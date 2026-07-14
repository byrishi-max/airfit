import { useState, useEffect, useCallback, useRef } from 'react';
import { ENDPOINTS } from '../utils/config';
import { updateClientPlanStatus } from '../utils/clientRepository';
import { getClientPlans, markPlanPending, saveGeneratedPlan } from '../utils/planRepository';
import { fetchWithTimeout } from '../utils/async';
import { jsonHeaders } from '../utils/apiHeaders';

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
    const [workoutStatus, setWorkoutStatus] = useState('none');
    const [dietStatus, setDietStatus] = useState('none');
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [dietPlan, setDietPlan] = useState(null);
    const [workoutGeneratedAt, setWorkoutGeneratedAt] = useState(null);
    const [dietGeneratedAt, setDietGeneratedAt] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const isLoadingRef = useRef(false);
    const checkPlanRef = useRef(null);
    const planStatusRef = useRef(planStatus);
    const workoutStatusRef = useRef(workoutStatus);
    const dietStatusRef = useRef(dietStatus);

    useEffect(() => {
        planStatusRef.current = planStatus;
    }, [planStatus]);

    useEffect(() => {
        workoutStatusRef.current = workoutStatus;
    }, [workoutStatus]);

    useEffect(() => {
        dietStatusRef.current = dietStatus;
    }, [dietStatus]);

    const applyPlanData = useCallback((data) => {
        const parsed = parseWorkout(data.workoutJson);
        let applied = false;

        if (data.workoutJson) {
            setWorkoutPlan(parsed);
            setWorkoutGeneratedAt(data.generatedAt || new Date().toISOString());
            setWorkoutStatus('ready');
            applied = true;
        }
        if (data.dietHtml) {
            setDietPlan(data.dietHtml);
            setDietGeneratedAt(data.generatedAt || new Date().toISOString());
            setDietStatus('ready');
            applied = true;
        }

        const nextWorkoutStatus = data.workoutJson ? 'ready' : workoutStatusRef.current;
        const nextDietStatus = data.dietHtml ? 'ready' : dietStatusRef.current;
        setPlanStatus(
            nextWorkoutStatus === 'pending' || nextDietStatus === 'pending'
                ? 'pending'
                : applied
                    ? 'ready'
                    : planStatusRef.current
        );
    }, []);

    const checkPlan = useCallback(async () => {
        if (!clientId || isLoadingRef.current) return false;
        
        isLoadingRef.current = true;
        setIsLoading(true);
        try {
            console.log('Checking status for client:', clientId);
            const response = await fetchWithTimeout(
                `${ENDPOINTS.GET_PLAN}?clientId=${encodeURIComponent(clientId)}`,
                { method: 'GET', headers: jsonHeaders() },
                10000
            );
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('[AirFit] Plan not ready yet (404)');
                    // Keep per-plan pending state while backend is still processing.
                    if (
                        planStatusRef.current !== 'pending' &&
                        workoutStatusRef.current !== 'pending' &&
                        dietStatusRef.current !== 'pending'
                    ) {
                        setPlanStatus('not_started');
                    }
                } else {
                    console.warn(`[AirFit] API returned ${response.status}`);
                    if (
                        workoutStatusRef.current !== 'pending' &&
                        dietStatusRef.current !== 'pending'
                    ) {
                        setPlanStatus('not_started');
                    }
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
                    await saveGeneratedPlan(clientId, data).catch(error => {
                        console.warn('[AirFit] Failed to save generated plan to Firebase:', error);
                    });
                    applyPlanData(data);
                    const hasPendingAfterApply =
                        (!data.workoutJson && workoutStatusRef.current === 'pending') ||
                        (!data.dietHtml && dietStatusRef.current === 'pending');
                    if (!hasPendingAfterApply) {
                        await updateClientPlanStatus(clientId, 'ready').catch(error => {
                            console.warn('[AirFit] Failed to update remote client ready status:', error);
                        });
                    }
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
    }, [clientId, applyPlanData]);

    // Keep checkPlanRef up to date
    useEffect(() => {
        checkPlanRef.current = checkPlan;
    }, [checkPlan]);

    // Initial load and sync when clientId changes
    useEffect(() => {
        if (!clientId) {
            setPlanStatus('none');
            setWorkoutStatus('none');
            setDietStatus('none');
            setWorkoutPlan(null);
            setDietPlan(null);
            setWorkoutGeneratedAt(null);
            setDietGeneratedAt(null);
            return;
        }

        const syncLocalAndRemote = async () => {
            try {
                const remotePlans = await getClientPlans(clientId).catch(error => {
                    console.warn('[AirFit] Firebase plan sync skipped:', error);
                    return null;
                });

                if (remotePlans && remotePlans.planStatus !== 'none') {
                    setPlanStatus(remotePlans.planStatus);
                    setWorkoutStatus(remotePlans.workoutStatus || 'none');
                    setDietStatus(remotePlans.dietStatus || 'none');
                    setWorkoutPlan(remotePlans.workoutPlan);
                    setDietPlan(remotePlans.dietPlan);
                    setWorkoutGeneratedAt(remotePlans.workoutGeneratedAt);
                    setDietGeneratedAt(remotePlans.dietGeneratedAt);

                    if (remotePlans.planStatus === 'ready') {
                        return;
                    }
                    if (remotePlans.planStatus === 'pending') {
                        return;
                    }
                }

                setPlanStatus('none');
                setWorkoutStatus('none');
                setDietStatus('none');
                setWorkoutPlan(null);
                setDietPlan(null);
                setWorkoutGeneratedAt(null);
                setDietGeneratedAt(null);
                await checkPlanRef.current?.();
            } catch (e) {
                console.error('Failed to sync plan status:', e);
            }
        };

        syncLocalAndRemote();
    }, [clientId]);

    // Polling logic
    useEffect(() => {
        const shouldPoll = planStatus === 'pending' || workoutStatus === 'pending' || dietStatus === 'pending';
        if (!clientId || !shouldPoll) return;

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
    }, [clientId, planStatus, workoutStatus, dietStatus]);

    const markPending = useCallback((planType = 'Workout Plan') => {
        if (!clientId) return;
        setPlanStatus('pending');
        if (planType === 'Diet Plan') {
            setDietStatus('pending');
        } else {
            setWorkoutStatus('pending');
        }
        markPlanPending(clientId, planType).catch(error => {
            console.warn('[AirFit] Failed to mark remote plan pending:', error);
        });
        updateClientPlanStatus(clientId, 'pending').catch(error => {
            console.warn('[AirFit] Failed to update remote client status:', error);
        });
    }, [clientId]);

    return { planStatus, workoutStatus, dietStatus, workoutPlan, dietPlan, workoutGeneratedAt, dietGeneratedAt, markPending, checkPlan, isLoading };
}

export default useClientPlan;
