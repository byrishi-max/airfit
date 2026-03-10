import { useState } from 'react';
import { getProgress, setProgress as setProgressStorage } from '../utils/storage';

export const useProgress = (clientId, weekNumber, day, exerciseName) => {
    const [completed, setCompleted] = useState(() =>
        getProgress(clientId, weekNumber, day, exerciseName)
    );

    const toggleComplete = () => {
        const nextVal = !completed;
        setCompleted(nextVal);
        setProgressStorage(clientId, weekNumber, day, exerciseName, nextVal);
    };

    return { completed, toggleComplete };
};
