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
    const [planStatus, setPlanStatus] = useState('none');
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [dietPlan, setDietPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
                    
                    // PROACTIVE SYNC: If local says none, check the server once
                    if (!client.planStatus || client.planStatus === 'none') {
                        console.log('[AirFit] Plan "none" locally, checking server for updates...');
                        await checkPlan();
                    }
                } else {
                    // Not in local storage at all? Try server
                    setPlanStatus('none');
                    setWorkoutPlan(null);
                    setDietPlan(null);
                    console.log('[AirFit] Client not in local storage, checking server...');
                    await checkPlan();
                }
            } catch (e) {
                console.error('Failed to sync plan status:', e);
            }
        };

        syncLocalAndRemote();
    }, [clientId]); // Removed checkPlan from dependencies to avoid loop, we'll use a ref or separate check

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
        if (!clientId || isLoading) return false;
        
        setIsLoading(true);
        try {
            console.log('Checking status for client:', clientId);
            const response = await fetch(`${ENDPOINTS.GET_PLAN}?clientId=${encodeURIComponent(clientId)}`); // Using ENDPOINTS
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('[AirFit] Plan not ready yet (404)');
                } else {
                    console.warn(`[AirFit] API returned ${response.status}`);
                }
                setPlanStatus('not_started'); // Set status if API call fails or 404
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
            setIsLoading(false);
        }
        return false;
    }, [clientId, savePlanToStorage, isLoading]);

    // Polling logic
    useEffect(() => {
        if (!clientId || planStatus !== 'pending') return;

        console.log('[AirFit] Starting polling for', clientId);
        
        // Initial check
        const initialCheck = async () => {
            const ready = await checkPlan();
            if (ready) return;
        };
        initialCheck();

        // Faster polling for better UX (5 seconds instead of 15)
        const interval = setInterval(async () => {
            const ready = await checkPlan();
            if (ready) {
                console.log('[AirFit] Plan found! Stopping polling.');
                clearInterval(interval);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [clientId, planStatus]); // checkPlan intentionally omitted from deps to avoid re-triggering polling on every checkPlan update (which updates isLoading)

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
