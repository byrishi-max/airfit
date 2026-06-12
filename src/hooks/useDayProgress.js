import { useState, useEffect } from 'react';

/**
 * Custom hook to manage workout progress for a specific day.
 * It persists data to localStorage to ensure completion status is saved.
 */
export const useDayProgress = (clientId, dayKey, exercises = []) => {
    // We use a simple composite key for storage
    const storageKey = `airfit_progress_${clientId}_${dayKey}`;
    const dayDoneKey = `airfit_daydone_${clientId}_${dayKey}`;

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId, dayKey]);

    // Persist to localStorage whenever progress changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(progress));
    }, [progress, storageKey]);

    const toggleComplete = (exerciseName) => {
        setProgress(prev => ({
            ...prev,
            [exerciseName]: !prev[exerciseName]
        }));
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
    };

    return { progress, toggleComplete, isCompleted, totalCount, completedCount, percent, dayDone, markDayDone };
};
