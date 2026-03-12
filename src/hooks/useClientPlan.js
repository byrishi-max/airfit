import { useState, useEffect, useCallback } from 'react';
import { ENDPOINTS } from '../utils/config';

/**
 * Safely parse workoutJson — handles double-stringified JSON from n8n.
 * Returns a JS object or null.
 */
function parseWorkout(raw) {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;   // already parsed
    // Try parsing (may be double-stringified)
    try {
        let parsed = JSON.parse(raw);
        // If still a string after first parse, parse again
        if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
        }
        return parsed;
    } catch (e) {
        console.error('Failed to parse workoutJson:', e);
        return null;
    }
}


export function useClientPlan(clientId) {
    const [planStatus, setPlanStatus] = useState(() => {
        if (!clientId) return 'none';
        const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
        const client = clients.find(c => c.clientId === clientId);
        return client?.planStatus || 'none';
    });

    const [workoutPlan, setWorkoutPlan] = useState(() => {
        if (!clientId) return null;
        const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
        const client = clients.find(c => c.clientId === clientId);
        return parseWorkout(client?.workoutPlan) || null;
    });

    const savePlanToStorage = useCallback((data) => {
        const parsed = parseWorkout(data.workoutJson);

        const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
        const idx = clients.findIndex(c => c.clientId === clientId);
        if (idx !== -1) {
            clients[idx].planStatus = 'ready';
            clients[idx].workoutPlan = parsed;           // store parsed object
            clients[idx].dietPlan = data.dietHtml || null;
            clients[idx].planType = data.planType || '';
            clients[idx].planReadyAt = data.generatedAt || new Date().toISOString();
            localStorage.setItem('airfit_clients', JSON.stringify(clients));
        }
        setWorkoutPlan(parsed);
        setPlanStatus('ready');
    }, [clientId]);

    const checkPlan = useCallback(async () => {
        if (!clientId) return false;
        try {
            const res = await fetch(`${ENDPOINTS.GET_PLAN}?clientId=${clientId}`);
            const data = await res.json();

            console.log('[AirFit] Plan poll response:', {
                status: data.status,
                hasWorkoutJson: !!data.workoutJson,
                workoutJsonType: typeof data.workoutJson,
                hasDietHtml: !!data.dietHtml,
            });

            if (data.status === 'ready' && (data.workoutJson || data.dietHtml)) {
                savePlanToStorage(data);
                return true;
            }
        } catch (e) {
            console.log('Poll error:', e);
        }
        return false;
    }, [clientId, savePlanToStorage]);

    useEffect(() => {
        if (!clientId || planStatus !== 'pending') return;

        // Check immediately
        checkPlan();

        // Poll every 20 seconds (faster than before)
        const interval = setInterval(async () => {
            const ready = await checkPlan();
            if (ready) clearInterval(interval);
        }, 20000);

        return () => clearInterval(interval);
    }, [clientId, planStatus, checkPlan]);

    const markPending = useCallback(() => {
        setPlanStatus('pending');
        const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
        const idx = clients.findIndex(c => c.clientId === clientId);
        if (idx !== -1) {
            clients[idx].planStatus = 'pending';
            clients[idx].submittedAt = Date.now();
            localStorage.setItem('airfit_clients', JSON.stringify(clients));
        }
    }, [clientId]);

    return { planStatus, workoutPlan, markPending };
}

// Default export for backward compat
export default function useClientPlanDefault(clientId) {
    return useClientPlan(clientId);
}
