import React from 'react';
import { Check, PlayCircle } from 'lucide-react';

const VIDEO_FALLBACKS = [
    ['bench press', 'hWbUlkb5Ms4'],
    ['incline dumbbell press', '8iPEnn-ltC8'],
    ['cable fly', 'Iwe6AmxVf7o'],
    ['triceps pushdown', '2-LAMcpzODU'],
    ['triceps extension', 'YbX7Wd8jQ-Q'],
    ['lat pulldown', 'CAwf7n6Luuc'],
    ['seated cable row', 'GZbfZ033f74'],
    ['dumbbell curl', 'ykJmrZ5v0Oo'],
    ['squat', 'bEv6CCg2BC8'],
    ['romanian deadlift', 'JCXUYuzwNrM'],
    ['leg press', 'IZxyjW7MPJQ'],
];

function getVideoId(exercise) {
    if (exercise?.videoId) return exercise.videoId;
    const name = exercise?.name?.toLowerCase() || '';
    const match = VIDEO_FALLBACKS.find(([pattern]) => name.includes(pattern));
    return match?.[1] || null;
}

export default function ExerciseCard({ exercise, completed, toggleComplete }) {
    const videoId = getVideoId(exercise);
    const sets = exercise?.sets || '3';
    const reps = exercise?.reps || '10-12';

    return (
        <article className={`fit-exercise-card ${completed ? 'is-complete' : ''}`}>
            <div className="fit-exercise-main">
                <button className="fit-check-button" onClick={toggleComplete} aria-label={`Mark ${exercise.name} complete`}>
                    {completed && <Check size={16} strokeWidth={3} />}
                </button>
                <div className="fit-exercise-copy">
                    <h3>{exercise.name}</h3>
                    <p>{sets} sets x {reps} reps</p>
                </div>
            </div>

            {videoId && (
                <div className="fit-video-block">
                    <div className="fit-video-label">
                        <PlayCircle size={15} />
                        <span>Technique video</span>
                    </div>
                    <div className="fit-video-frame">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
                            title={`${exercise.name} technique video`}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </article>
    );
}
