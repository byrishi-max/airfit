import React, { useState } from 'react';

/**
 * ExerciseCard displays exercise details and a checkbox for completion.
 * It is a "dumb" component that receives state from WorkoutPlanView.
 */
export default function ExerciseCard({ exercise, completed, toggleComplete }) {
    const [videoExpanded, setVideoExpanded] = useState(false);

    return (
        <div style={{
            background: completed ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${completed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '16px',
            marginBottom: '16px',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            boxShadow: completed ? '0 4px 20px rgba(0, 0, 0, 0.4)' : 'none'
        }}>
            {/* Exercise header row */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', gap: '16px' }}>
                {/* Checkbox */}
                <div
                    onClick={toggleComplete}
                    style={{
                        width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0, cursor: 'pointer',
                        border: `2px solid ${completed ? '#22c55e' : '#444'}`,
                        background: completed ? '#22c55e' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        transform: completed ? 'scale(1.05)' : 'scale(1)'
                    }}
                >
                    {completed && <span style={{ color: '#000', fontSize: '16px', fontWeight: 'bold' }}>✓</span>}
                </div>

                {/* Exercise info */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        color: completed ? '#777' : '#fff',
                        fontWeight: '600', fontSize: '15px',
                        textDecoration: completed ? 'line-through' : 'none',
                        transition: 'color 0.3s ease'
                    }}>
                        {exercise.name}
                    </div>
                    <div style={{ color: '#888', fontSize: '13px', marginTop: '4px', fontFamily: "'Inter', sans-serif" }}>
                        {exercise.sets} sets × {exercise.reps} reps
                    </div>
                </div>

                {/* Video toggle button */}
                {exercise.videoId && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setVideoExpanded(v => !v);
                        }}
                        style={{
                            background: videoExpanded ? '#FF5C1A' : 'rgba(255, 255, 255, 0.08)',
                            color: '#fff', border: 'none', borderRadius: '10px',
                            padding: '8px 14px', fontSize: '11px', fontWeight: '700',
                            cursor: 'pointer', letterSpacing: '0.8px', whiteSpace: 'nowrap',
                            transition: 'all 0.3s ease',
                            fontFamily: "'Sora', sans-serif"
                        }}
                    >
                        {videoExpanded ? 'CLOSE' : 'WATCH'}
                    </button>
                )}
            </div>

            {/* YouTube embed */}
            {videoExpanded && exercise.videoId && (
                <div style={{ padding: '0 20px 20px', animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ 
                        position: 'relative', 
                        paddingBottom: '56.25%', 
                        height: 0, 
                        overflow: 'hidden', 
                        borderRadius: '12px',
                        background: '#000'
                    }}>
                        <iframe
                            src={`https://www.youtube.com/embed/${exercise.videoId}?modestbranding=1&rel=0&showinfo=0`}
                            style={{
                                position: 'absolute', top: 0, left: 0, 
                                width: '100%', height: '100%',
                                border: 'none'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title={exercise.name}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
