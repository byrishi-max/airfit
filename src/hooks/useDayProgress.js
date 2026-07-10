import { useState, useEffect } from 'react';
import {
    getDayDone,
    getExerciseProgressMap,
    markDayDoneRemote,
    setExerciseProgress,
} from '../utils/progressRepository';

/**
 * Custom hook to manage workout progress for a specific day.
 * Firestore is the source of truth so progress syncs across devices.
 */
export const useDayProgress = (clientId, dayKey, exercises = [], weekNumber = 1) => {
    const [progress, setProgress] = useState({});
    const [dayDone, setDayDone] = useState(false);

    // Sync state if dayKey or clientId changes
    // This prevents "flashes" of previous day's data when switching days
    useEffect(() => {
        setProgress({});
        setDayDone(false);

        let cancelled = false;
        async function loadRemoteProgress() {
            if (!clientId || !dayKey) return;
            try {
                const [remoteProgress, remoteDone] = await Promise.all([
                    getExerciseProgressMap(clientId, weekNumber, dayKey),
                    getDayDone(clientId, weekNumber, dayKey),
                ]);
                if (cancelled) return;
                if (remoteProgress) setProgress(remoteProgress);
                setDayDone(Boolean(remoteDone));
            } catch (error) {
                console.warn('[AirFit] Failed to load remote day progress:', error);
            }
        }
        loadRemoteProgress();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId, dayKey, weekNumber]);

    const toggleComplete = (exerciseName) => {
        let nextValue = false;
        setProgress(prev => {
            nextValue = !prev[exerciseName];
            return {
                ...prev,
                [exerciseName]: nextValue
            };
        });
        setExerciseProgress({
            clientId,
            weekNumber,
            dayName: dayKey,
            exerciseName,
            completed: nextValue,
        }).catch(error => {
            console.warn('[AirFit] Failed to save remote exercise progress:', error);
        });
    };

    const isCompleted = (exerciseName) => {
        return !!progress[exerciseName];
    };
    
    const totalCount = Array.isArray(exercises) ? exercises.length : 0;
    const completedCount = totalCount
        ? exercises.reduce((sum, ex) => sum + (progress[ex?.name] ? 1 : 0), 0)
        : 0;
    const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

    const markDayDone = () => {
        setDayDone(true);
        markDayDoneRemote(clientId, weekNumber, dayKey).catch(error => {
            console.warn('[AirFit] Failed to save remote day completion:', error);
        });
    };

    return { progress, toggleComplete, isCompleted, totalCount, completedCount, percent, dayDone, markDayDone };
};
