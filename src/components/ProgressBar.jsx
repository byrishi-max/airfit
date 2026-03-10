import React from 'react';
import { getProgress } from '../utils/storage';

export default function ProgressBar({ clientId, weekNumber, day, exercises }) {
    if (!exercises || exercises.length === 0) return null;

    // Compute number of completed exercises directly from localStorage
    const completed = exercises.filter(ex =>
        getProgress(clientId, weekNumber, day, ex.name)
    ).length;

    const total = exercises.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>{completed}/{total} exercises completed</span>
                <span style={{ color: pct === 100 ? '#22c55e' : '#FF5C1A', fontSize: '12px', fontWeight: '700' }}>
                    {pct}%
                </span>
            </div>
            <div style={{ height: '4px', background: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${pct}%`,
                    background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg, #FF5C1A, #ff8c42)',
                    transition: 'width 0.4s ease'
                }} />
            </div>
        </div>
    );
}
