import React, { useEffect, useState } from 'react';
import { Check, PlayCircle } from 'lucide-react';
import { db } from '../utils/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

/** Convert exercise name to Firestore slug — must match seedCuratedVideos.js logic */
function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

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

function getHardcodedFallback(name) {
    const lower = (name || '').toLowerCase();
    const match = VIDEO_FALLBACKS.find(([pattern]) => lower.includes(pattern));
    return match?.[1] || null;
}

/**
 * Looks up a video ID for an exercise:
 * 1. Use exercise.videoId if already attached by n8n
 * 2. Query curated_videos Firestore collection by slug
 * 3. Fall back to hardcoded list
 * Returns { videoId, loading }
 */
function useExerciseVideo(exercise) {
    let providedId = exercise?.videoId || null;
    // Reject the n8n hardcoded dummy fallback video (Push up video) so we can query our real DB
    if (providedId === 'IODxDxX7oi4') {
        providedId = null;
    }
    
    const [videoId, setVideoId] = useState(providedId);
    const [loading, setLoading] = useState(!providedId);

    useEffect(() => {
        // If n8n already provided a videoId, use it directly — no lookup needed
        if (providedId) {
            setVideoId(providedId);
            setLoading(false);
            return;
        }

        const name = exercise?.name;
        if (!name) {
            setLoading(false);
            return;
        }

        // Check hardcoded list first (instant, no network)
        const fallback = getHardcodedFallback(name);
        if (fallback) {
            setVideoId(fallback);
            setLoading(false);
            return;
        }

        // Query Firebase curated_videos collection
        if (!db) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        const slug = slugify(name);
        getDoc(doc(db, 'curated_videos', slug))
            .then(snapshot => {
                if (cancelled) return;
                if (snapshot.exists()) {
                    setVideoId(snapshot.data().videoId || null);
                } else {
                    setVideoId(null);
                }
            })
            .catch(() => {
                if (!cancelled) setVideoId(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [providedId, exercise?.name]);

    return { videoId, loading };
}

export default function ExerciseCard({ exercise, completed, toggleComplete }) {
    const { videoId, loading } = useExerciseVideo(exercise);
    const sets = exercise?.sets || '3';
    const reps = exercise?.reps || '10-12';
    const durationSeconds = Number(exercise?.durationSeconds || 0);
    const isShortCandidate = Boolean(exercise?.isShortCandidate || (durationSeconds > 0 && durationSeconds <= 60));
    const durationLabel = durationSeconds ? `${durationSeconds}s` : '';

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

            {loading ? (
                <div className="fit-video-block">
                    <div className="fit-video-label">
                        <PlayCircle size={15} />
                        <span>Loading video...</span>
                    </div>
                </div>
            ) : videoId ? (
                <div className="fit-video-block">
                    <div className="fit-video-label">
                        <PlayCircle size={15} />
                        <span>{exercise.videoTitle || 'Technique video'}</span>
                        {durationLabel && <b>{durationLabel}</b>}
                        {isShortCandidate && <b>Short</b>}
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
            ) : (
                <div className="fit-video-block">
                    <div className="fit-video-label">
                        <PlayCircle size={15} />
                        <span>Technique video</span>
                    </div>
                    <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' exercise technique')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fit-yt-search-btn"
                    >
                        Search on YouTube →
                    </a>
                </div>
            )}
        </article>
    );
}
