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

function extractYoutubeId(str) {
    if (!str) return '';
    const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([^&?\/]+)/);
    return match ? match[1] : str.trim();
}

const VIDEO_FALLBACKS = [
    // Chest
    ['bench press', 'hWbUlkb5Ms4'],
    ['incline press', '8iPEnn-ltC8'],
    ['incline dumbbell press', '8iPEnn-ltC8'],
    ['chest press', 'hWbUlkb5Ms4'],
    ['cable fly', 'Iwe6AmxVf7o'],
    ['chest fly', 'Iwe6AmxVf7o'],
    ['flye', 'Iwe6AmxVf7o'],
    ['fly', 'Iwe6AmxVf7o'],
    ['push up', 'IODxDxX7oi4'],
    ['pushup', 'IODxDxX7oi4'],
    ['dip', '2z8JmcrW-As'],
    ['pec deck', 'Iwe6AmxVf7o'],

    // Back
    ['pull-up', 'ym1V5H35IpA'],
    ['pullup', 'ym1V5H35IpA'],
    ['pull up', 'ym1V5H35IpA'],
    ['chin up', 'ym1V5H35IpA'],
    ['lat pulldown', 'CAwf7n6Luuc'],
    ['seated cable row', 'GZbfZ033f74'],
    ['cable row', 'GZbfZ033f74'],
    ['bent-over', 'G8l_8chR5BE'],
    ['bent over row', 'G8l_8chR5BE'],
    ['barbell row', 'G8l_8chR5BE'],
    ['dumbbell row', 'pYcpY20QaE8'],
    ['one arm row', 'pYcpY20QaE8'],
    ['single arm row', 'pYcpY20QaE8'],
    ['t-bar row', 'G8l_8chR5BE'],
    ['rack pull', 'op9kVnSso6Q'],
    ['hyperextension', 'ph3pFa69Y2E'],
    ['good morning', 'YA-h3n9L4Ko'],

    // Arms - Triceps
    ['triceps pushdown', '2-LAMcpzODU'],
    ['tricep pushdown', '2-LAMcpzODU'],
    ['triceps extension', 'YbX7Wd8jQ-Q'],
    ['tricep extension', 'YbX7Wd8jQ-Q'],
    ['dumbbell extension', 'YbX7Wd8jQ-Q'],
    ['overhead extension', 'YbX7Wd8jQ-Q'],
    ['overhead tricep', 'YbX7Wd8jQ-Q'],
    ['skullcrusher', 'd_KZxkY_0cM'],
    ['skull crusher', 'd_KZxkY_0cM'],
    ['ez bar curl', 'd_KZxkY_0cM'],
    ['close grip bench', 'nEF0bv2FW-4'],
    ['kickback', 'ZO81bExngMI'],
    ['tricep', '2-LAMcpzODU'],

    // Arms - Biceps
    ['incline dumbbell curl', '8iPEnn-ltC8'],
    ['incline curl', '8iPEnn-ltC8'],
    ['hammer curl', 'zC3nLlEvin4'],
    ['concentration curl', 'ykJmrZ5v0Oo'],
    ['preacher curl', 'ykJmrZ5v0Oo'],
    ['cable curl', 'ykJmrZ5v0Oo'],
    ['barbell curl', 'ykJmrZ5v0Oo'],
    ['dumbbell curl', 'ykJmrZ5v0Oo'],
    ['bicep', 'ykJmrZ5v0Oo'],
    ['curl', 'ykJmrZ5v0Oo'],

    // Shoulders
    ['shoulder press', 'G2qpTG1Eh40'],
    ['overhead press', 'G2qpTG1Eh40'],
    ['military press', 'G2qpTG1Eh40'],
    ['arnold press', 'B-aVuyhvLHU'],
    ['dumbbell shoulder press', 'B-aVuyhvLHU'],
    ['lateral raise', '3VcKaXpzqRo'],
    ['side raise', '3VcKaXpzqRo'],
    ['front raise', 'h9xfpTrAvkE'],
    ['front raises', 'h9xfpTrAvkE'],
    ['face pull', 'rep-qVOkqgk'],
    ['facepull', 'rep-qVOkqgk'],
    ['reverse fly', 'ttvoBDBm3PI'],
    ['rear delt fly', 'ttvoBDBm3PI'],
    ['rear delt', 'ttvoBDBm3PI'],
    ['cable lateral', '3VcKaXpzqRo'],
    ['upright row', 'VG7MeRJGtKo'],
    ['shrug', 'cJRVVxmytaM'],

    // Legs
    ['squat', 'bEv6CCg2BC8'],
    ['romanian deadlift', 'JCXUYuzwNrM'],
    ['rdl', 'JCXUYuzwNrM'],
    ['deadlift', 'op9kVnSso6Q'],
    ['sumo deadlift', 'op9kVnSso6Q'],
    ['leg press', 'IZxyjW7MPJQ'],
    ['lunge', 'D7KaRcUTQeE'],
    ['walking lunge', 'D7KaRcUTQeE'],
    ['split squat', 'D7KaRcUTQeE'],
    ['bulgarian split', 'D7KaRcUTQeE'],
    ['leg extension', 'YyvSfVjQeL0'],
    ['leg curl', 'F488k67BTNo'],
    ['hamstring curl', 'F488k67BTNo'],
    ['calf raise', '-M4-G8p8fmc'],
    ['seated calf', '-M4-G8p8fmc'],
    ['hip thrust', 'xDmFkJxPzeM'],
    ['glute bridge', 'OUgsJ8-Vi0E'],
    ['goblet squat', 'MeIiIdhvXT4'],
    ['hack squat', 'EdtPMD0pKbY'],
    ['step up', 'dQqApCGd5Ss'],
    ['lateral lunge', 'e5sOHBKx7MU'],

    // Core & Abs
    ['plank', 'pSHjTRCQxIw'],
    ['side plank', 'K2VljzCC16g'],
    ['crunch', 'Xyd_fa5zoEU'],
    ['ab crunch', 'Xyd_fa5zoEU'],
    ['sit up', 'jDwoBqPH0jk'],
    ['russian twist', 'JyUqwkVpsi8'],
    ['leg raise', 'l4kQd9eWclI'],
    ['hanging leg raise', 'hdng3vmclwY'],
    ['cable crunch', 'Emi6-EpzWiI'],
    ['mountain climber', 'nmwgirgXLYM'],
    ['dead bug', 'g_BYB0R-4Ws'],
    ['bird dog', 'wiFNA3sqjCA'],
    ['hollow hold', 'LlDNef_Ztsc'],
    ['ab wheel', 'pTGAMuqHk68'],
    ['woodchop', 'CtBnSr6c5QI'],
    ['pallof press', 'AH_QZLm_0-s'],
    ['toe touch', 'Xyd_fa5zoEU'],

    // Cardio / Conditioning
    ['burpee', 'TU8QYVW0gDU'],
    ['jump rope', 'u3zgHI8QhiI'],
    ['box jump', 'NBY9-kTuHEk'],
    ['jumping jack', '-nDjECEEQUQ'],
    ['battle rope', 'pFgxAy7OKCU'],

    // Compound / Other
    ['clean', 'KjGvwQl8vWE'],
    ['power clean', 'KjGvwQl8vWE'],
    ['snatch', 'Xp_aBbm8zKY'],
    ['thruster', 'BI3-KGkAGoI'],
    ['farmer', 'Fsop6g8GDDU'],
    ['carry', 'Fzop6g8GDDU'],
    ['sled push', 'pEaLTEEkpWM'],
    ['row machine', 'GZbfZ033f74'],
    ['cable crossover', 'taI4XduLpTk'],
    ['cable', 'GZbfZ033f74'],

    // Warmup / Mobility
    ['cat cow', 'kqnua4rHVVA'],
    ['hip circle', 'kDa1MvdVrxI'],
    ['arm circle', '-7BKRB4fGps'],
    ['high knee', 'D0NumyZy19U'],
    ['butt kick', '5EDSy4jPoI4'],
    ['inchworm', 'mRen4kSa05A'],
    ['world greatest', 'TkxKRgPJsVQ'],
];


function getHardcodedFallback(name) {
    const lower = (name || '').toLowerCase();
    const match = VIDEO_FALLBACKS.find(([pattern]) => lower.includes(pattern));
    return match?.[1] || null;
}

/**
 * Looks up a video ID for an exercise:
 * 1. Query curated_videos Firestore collection by slug
 * 2. Fall back to hardcoded list
 * 3. Fall back to n8n provided ID
 * Returns { videoId, loading }
 */
function useExerciseVideo(exercise) {
    let providedId = exercise?.videoId || null;
    let providedTitle = exercise?.videoTitle || null;

    // Reject the n8n hardcoded dummy fallback video or any title containing "Fallback"
    if (
        (providedId && typeof providedId === 'string' && providedId.includes('IODxDxX7oi')) ||
        (providedTitle && providedTitle.toLowerCase().includes('fallback')) ||
        (providedTitle && providedTitle.toLowerCase().includes('search'))
    ) {
        providedId = null;
    }
    
    const [videoId, setVideoId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function resolve() {
            const name = exercise?.name;

            // Step 1: get candidate ID prioritizing DB > Hardcoded > n8n
            let candidateId = null;

            if (name) {
                if (db) {
                    try {
                        const slug = slugify(name);
                        const snapshot = await getDoc(doc(db, 'curated_videos', slug));
                        if (!cancelled && snapshot.exists()) {
                            candidateId = extractYoutubeId(snapshot.data().videoId) || null;
                        }
                    } catch { /* ignore */ }
                }

                if (!candidateId) {
                    const fallback = getHardcodedFallback(name);
                    if (fallback) {
                        candidateId = fallback;
                    }
                }
            }

            if (!candidateId && providedId) {
                candidateId = extractYoutubeId(providedId);
            }

            if (cancelled) return;

            setVideoId(candidateId);
            setLoading(false);
        }

        resolve();
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

    const cleanTitle = (exercise.videoTitle || 'Technique video')
        .replace(/fallback/i, '')
        .replace(/search/i, '')
        .trim();

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
                        <span>{cleanTitle}</span>
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
