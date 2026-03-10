import { useState, useEffect, useCallback } from 'react';
import { ENDPOINTS } from '../utils/config';


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
        return client?.workoutPlan || null;
    });

    const savePlanToStorage = useCallback((data) => {
        const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
        const idx = clients.findIndex(c => c.clientId === clientId);
        if (idx !== -1) {
            clients[idx].planStatus = 'ready';
            clients[idx].workoutPlan = data.workoutJson || null;
            clients[idx].dietPlan = data.dietHtml || null;
            clients[idx].planType = data.planType || '';
            clients[idx].planReadyAt = data.generatedAt || new Date().toISOString();
            localStorage.setItem('airfit_clients', JSON.stringify(clients));
        }
        setWorkoutPlan(data.workoutJson || null);
        setPlanStatus('ready');
    }, [clientId]);

    const checkPlan = useCallback(async () => {
        if (!clientId) return false;
        try {
            const res = await fetch(`${ENDPOINTS.GET_PLAN}?clientId=${clientId}`);
            const data = await res.json();

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

        // Poll every 30 seconds
        const interval = setInterval(async () => {
            const ready = await checkPlan();
            if (ready) clearInterval(interval);
        }, 30000);

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
