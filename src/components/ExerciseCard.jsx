import React, { useState } from 'react';
import { useProgress } from '../hooks/useProgress';

export default function ExerciseCard({ exercise, clientId, weekNumber, day }) {
    const { completed, toggleComplete } = useProgress(clientId, weekNumber, day, exercise.name);
    const [videoExpanded, setVideoExpanded] = useState(false);

    return (
        <div style={{
            background: completed ? '#0d2818' : '#1a1a1a',
            border: `1px solid ${completed ? '#22c55e' : '#2a2a2a'}`,
            borderRadius: '10px',
            marginBottom: '12px',
            overflow: 'hidden',
            transition: 'all 0.2s'
        }}>
            {/* Exercise header row */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
                {/* Checkbox */}
                <div
                    onClick={toggleComplete}
                    style={{
                        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                        border: `2px solid ${completed ? '#22c55e' : '#444'}`,
                        background: completed ? '#22c55e' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    {completed && <span style={{ color: '#fff', fontSize: '13px' }}>✓</span>}
                </div>

                {/* Exercise info */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        color: completed ? '#6b7280' : '#f0f0f0',
                        fontWeight: '600', fontSize: '14px',
                        textDecoration: completed ? 'line-through' : 'none'
                    }}>
                        {exercise.name}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
                        {exercise.sets} sets × {exercise.reps} reps
                    </div>
                </div>

                {/* Video toggle button */}
                {exercise.videoId && (
                    <button
                        onClick={() => setVideoExpanded(v => !v)}
                        style={{
                            background: videoExpanded ? '#FF5C1A' : '#2a2a2a',
                            color: '#fff', border: 'none', borderRadius: '6px',
                            padding: '6px 12px', fontSize: '11px', fontWeight: '700',
                            cursor: 'pointer', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                            transition: 'background 0.2s'
                        }}
                    >
                        {videoExpanded ? '▼ HIDE' : '▶ WATCH'}
                    </button>
                )}
            </div>

            {/* YouTube embed — in-app, no redirect */}
            {videoExpanded && exercise.videoId && (
                <div style={{ padding: '0 16px 14px' }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${exercise.videoId}?modestbranding=1&rel=0&showinfo=0`}
                        width="100%"
                        height="210"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{ borderRadius: '8px', display: 'block', border: '1px solid #333' }}
                        title={exercise.videoTitle || exercise.name}
                    />
                    {exercise.videoTitle && (
                        <div style={{ color: '#555', fontSize: '11px', marginTop: '6px' }}>
                            📺 {exercise.videoTitle}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
