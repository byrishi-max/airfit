import React from 'react';
import { Check, PlayCircle } from 'lucide-react';

const VIDEO_FALLBACKS = [
    ['flat dumbbell press', 'VmB1G1K7v94'],
    ['bench press', 'hWbUlkb5Ms4'],
    ['incline dumbbell press', '8iPEnn-ltC8'],
    ['dumbbell press', 'VmB1G1K7v94'],
    ['cable fly', 'Iwe6AmxVf7o'],
    ['triceps pushdown', '2-LAMcpzODU'],
    ['triceps extension', 'YbX7Wd8jQ-Q'],
    ['lat pulldown', 'CAwf7n6Luuc'],
    ['seated cable row', 'GZbfZ033f74'],
    ['t-bar row', 'j3Igk5nyZE4'],
    ['face pull', 'rep-qVOkqgk'],
    ['dumbbell curl', 'ykJmrZ5v0Oo'],
    ['incline dumbbell curl', 'soxrZlIl35U'],
    ['hammer curl', 'zC3nLlEvin4'],
    ['squat', 'bEv6CCg2BC8'],
    ['romanian deadlift', 'JCXUYuzwNrM'],
    ['leg press', 'IZxyjW7MPJQ'],
    ['standing calf raise', 'YMmgqO8Jo-k'],
    ['lunge', 'QOVaHwm-Q6U'],
    ['hamstring curl', 'Orxowest56U'],
    ['arnold press', '6Z15_WdXmVw'],
    ['front raise', 'hRJ6tR5-if0'],
    ['overhead press', 'qEwKCR5JCog'],
    ['shoulder press', 'B-aVuyhvLHU'],
    ['lateral raise', '3VcKaXpzqRo'],
    ['plank', 'pSHjTRCQxIw'],
    ['push-up', 'IODxDxX7oi4'],
    ['push up', 'IODxDxX7oi4'],
    ['mountain climber', 'nmwgirgXLYM'],
    ['burpee', 'TU8QYVW0gDU'],
    ['dead bug', 'g_BYB0R-4Ws'],
    ['glute bridge', 'wPM8icPu6H8'],
    ['goblet squat', 'MeIiIdhvXT4'],
];

function getVideoId(exercise) {
    if (exercise?.videoId) return exercise.videoId;
    if (exercise?.videoUrl) {
        const match = String(exercise.videoUrl).match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{6,})/);
        if (match) return match[1];
    }
    const name = exercise?.name?.toLowerCase() || '';
    const match = VIDEO_FALLBACKS.find(([pattern]) => name.includes(pattern));
    return match?.[1] || null;
}

function getYouTubeSearchUrl(exercise) {
    const query = encodeURIComponent(`${exercise?.name || 'exercise'} proper form exercise`);
    return `https://www.youtube.com/results?search_query=${query}`;
}

function getDisplayName(exercise) {
    const curatedTitle = String(exercise?.videoTitle || '').trim();
    const isCurated = String(exercise?.channelName || '').toLowerCase().includes('curated');
    const looksLikeExerciseName =
        curatedTitle &&
        curatedTitle.length <= 60 &&
        !/[|:]/.test(curatedTitle) &&
        !/^how\s+to/i.test(curatedTitle) &&
        !/\bguide\b/i.test(curatedTitle);

    if (isCurated && looksLikeExerciseName) return curatedTitle;
    return exercise?.name || curatedTitle || 'Exercise';
}

export default function ExerciseCard({ exercise, completed, toggleComplete }) {
    const videoId = getVideoId(exercise);
    const displayName = getDisplayName(exercise);
    const sets = exercise?.sets || '3';
    const reps = exercise?.reps || '10-12';
    const durationSeconds = Number(exercise?.durationSeconds || 0);
    const isShortCandidate = Boolean(exercise?.isShortCandidate || (durationSeconds > 0 && durationSeconds <= 60));
    const durationLabel = durationSeconds ? `${durationSeconds}s` : '';

    return (
        <article className={`fit-exercise-card ${completed ? 'is-complete' : ''}`}>
            <div className="fit-exercise-main">
                <button className="fit-check-button" onClick={toggleComplete} aria-label={`Mark ${displayName} complete`}>
                    {completed && <Check size={16} strokeWidth={3} />}
                </button>
                <div className="fit-exercise-copy">
                    <h3>{displayName}</h3>
                    <p>{sets} sets x {reps} reps</p>
                </div>
            </div>

            {videoId ? (
                <div className="fit-video-block">
                    <div className="fit-video-label">
                        <PlayCircle size={15} />
                        <span>{exercise.videoTitle || 'Technique video'}</span>
                        {durationLabel && <b>{durationLabel}</b>}
                        {isShortCandidate && <b>Short</b>}
                        {exercise.videoFallback && <b>Fallback</b>}
                    </div>
                    <div className="fit-video-frame">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
                            title={`${displayName} technique video`}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                </div>
            ) : (
                <div className="fit-video-block">
                    <div className="fit-video-label">
                        <PlayCircle size={15} />
                        <span>Technique video</span>
                        <b>Search</b>
                    </div>
                    <a
                        className="fit-video-missing-link"
                        href={getYouTubeSearchUrl(exercise)}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Open YouTube technique video for {displayName}
                    </a>
                </div>
            )}
        </article>
    );
}
