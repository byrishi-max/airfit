import { useState, useEffect } from 'react';
import {
    getDayDone,
    getExerciseProgressMap,
    markDayDoneRemote,
    setExerciseProgress,
} from '../utils/progressRepository';

/**
 * Custom hook to manage workout progress for a specific day.
 * It persists data to localStorage to ensure completion status is saved.
 */
export const useDayProgress = (clientId, dayKey, exercises = [], weekNumber = 1) => {
    // We use a simple composite key for storage
    const storageKey = `airfit_progress_${clientId}_w${weekNumber}_${dayKey}`;
    const dayDoneKey = `airfit_daydone_${clientId}_w${weekNumber}_${dayKey}`;

    // Helper to get freshest data
    const getSavedProgress = () => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error("Failed to parse progress:", e);
            return {};
        }
    };

    // Initialize state with stored data
    const [progress, setProgress] = useState(getSavedProgress);
    const [dayDone, setDayDone] = useState(() => localStorage.getItem(dayDoneKey) === 'true');

    // Sync state if dayKey or clientId changes
    // This prevents "flashes" of previous day's data when switching days
    useEffect(() => {
        setProgress(getSavedProgress());
        setDayDone(localStorage.getItem(dayDoneKey) === 'true');

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

    // Persist to localStorage whenever progress changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(progress));
    }, [progress, storageKey]);

    const toggleComplete = (exerciseName) => {
        let nextValue = false;
        setProgress(prev => {
            nextValue = !prev[exerciseName];
            return {
                ...prev,
                [exerciseName]: nextValue
            };
        });
        if (!nextValue && dayDone) {
            setDayDone(false);
            localStorage.removeItem(dayDoneKey);
        }
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
        localStorage.setItem(dayDoneKey, 'true');
        markDayDoneRemote(clientId, weekNumber, dayKey).catch(error => {
            console.warn('[AirFit] Failed to save remote day completion:', error);
        });
    };

    return { progress, toggleComplete, isCompleted, totalCount, completedCount, percent, dayDone, markDayDone };
};
