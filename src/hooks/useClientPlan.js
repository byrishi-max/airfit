import { useState, useEffect, useCallback, useRef } from 'react';
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
    const [planStatus, setPlanStatus] = useState('none');
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [dietPlan, setDietPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const isLoadingRef = useRef(false);
    const checkPlanRef = useRef(null);
    const planStatusRef = useRef(planStatus);

    useEffect(() => {
        planStatusRef.current = planStatus;
    }, [planStatus]);

    const savePlanToStorage = useCallback((data) => {
        const parsed = parseWorkout(data.workoutJson);

        try {
            const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
            const idx = clients.findIndex(c => c.clientId === clientId);
            if (idx !== -1) {
                clients[idx].planStatus = 'ready';
                clients[idx].workoutPlan = parsed;
                clients[idx].dietPlan = data.dietHtml || null;
                clients[idx].planType = data.planType || '';
                clients[idx].planReadyAt = data.generatedAt || new Date().toISOString();
                localStorage.setItem('airfit_clients', JSON.stringify(clients));
                console.log('[AirFit] Plan saved to localStorage');
            }
        } catch (e) {
            console.error('Failed to save plan to storage:', e);
        }
        setWorkoutPlan(parsed);
        setDietPlan(data.dietHtml || null); // Save diet plan to state
        setPlanStatus('ready');
    }, [clientId]);

    const checkPlan = useCallback(async () => {
        if (!clientId || isLoadingRef.current) return false;
        
        isLoadingRef.current = true;
        setIsLoading(true);
        try {
            console.log('Checking status for client:', clientId);
            const response = await fetch(`${ENDPOINTS.GET_PLAN}?clientId=${encodeURIComponent(clientId)}`); // Using ENDPOINTS
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('[AirFit] Plan not ready yet (404)');
                    // Keep "pending" while backend is still processing
                    if (planStatusRef.current !== 'pending') setPlanStatus('not_started');
                } else {
                    console.warn(`[AirFit] API returned ${response.status}`);
                    setPlanStatus('not_started');
                }
                return false;
            }
            
            const data = await response.json();
            
            console.log('[AirFit] Status check response:', { // Updated log
                status: data.status,
                hasWorkoutJson: !!data.workoutJson,
                hasDietHtml: !!data.dietHtml,
                planType: data.planType,
                clientId: data.clientId
            });

            if (data.status === 'ready') {
                if (data.workoutJson || data.dietHtml) {
                    savePlanToStorage(data);
                    return true;
                } else {
                    console.warn('[AirFit] Plan is marked ready but workoutJson and dietHtml are both missing!');
                }
            } else if (data.status === 'processing' || data.status === 'pending') {
                setPlanStatus('pending');
            }
        } catch (e) {
            console.warn('[AirFit] Poll error:', e);
        } finally {
            isLoadingRef.current = false;
            setIsLoading(false);
        }
        return false;
    }, [clientId, savePlanToStorage]);

    // Keep checkPlanRef up to date
    useEffect(() => {
        checkPlanRef.current = checkPlan;
    }, [checkPlan]);

    // Initial load and sync when clientId changes
    useEffect(() => {
        if (!clientId) {
            setPlanStatus('none');
            setWorkoutPlan(null);
            setDietPlan(null);
            return;
        }

        const syncLocalAndRemote = async () => {
            try {
                const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
                const client = clients.find(c => c.clientId === clientId);

                if (client) {
                    setPlanStatus(client.planStatus || 'none');
                    setWorkoutPlan(parseWorkout(client.workoutPlan));
                    setDietPlan(client.dietPlan || null);
                    console.log(`[AirFit] useClientPlan sync for ${clientId}:`, client.planStatus);

                    // If local says none, check the server once for cross-device updates.
                    if (!client.planStatus || client.planStatus === 'none') {
                        console.log('[AirFit] Plan "none" locally, checking server for updates...');
                        await checkPlanRef.current?.();
                    }
                } else {
                    setPlanStatus('none');
                    setWorkoutPlan(null);
                    setDietPlan(null);
                    console.log('[AirFit] Client not in local storage, checking server...');
                    await checkPlanRef.current?.();
                }
            } catch (e) {
                console.error('Failed to sync plan status:', e);
            }
        };

        syncLocalAndRemote();
    }, [clientId]);

    // Polling logic
    useEffect(() => {
        if (!clientId || planStatus !== 'pending') return;

        console.log('[AirFit] Starting polling for', clientId);
        let stopped = false;

        // Initial check after short delay
        const timeout = setTimeout(async () => {
            if (stopped) return;
            const ready = checkPlanRef.current && await checkPlanRef.current();
            if (ready) return;
        }, 1000);

        // Poll every 5 seconds using ref to avoid stale closures
        const interval = setInterval(async () => {
            if (stopped) return;
            const ready = checkPlanRef.current && await checkPlanRef.current();
            if (ready) {
                console.log('[AirFit] Plan found! Stopping polling.');
                clearInterval(interval);
            }
        }, 5000);

        return () => {
            stopped = true;
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [clientId, planStatus]);

    const markPending = useCallback(() => {
        if (!clientId) return;
        setPlanStatus('pending');
        try {
            const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
            const idx = clients.findIndex(c => c.clientId === clientId);
            if (idx !== -1) {
                clients[idx].planStatus = 'pending';
                clients[idx].submittedAt = Date.now();
                localStorage.setItem('airfit_clients', JSON.stringify(clients));
                console.log('[AirFit] Client marked as pending');
            }
        } catch (e) {
            console.error('Failed to mark pending:', e);
        }
    }, [clientId]);

    return { planStatus, workoutPlan, dietPlan, markPending, checkPlan, isLoading };
}

export default useClientPlan;
