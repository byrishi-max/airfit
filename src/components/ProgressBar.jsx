import React from 'react';

/**
 * ProgressBar displays completion status for the day's training.
 * It is a pure component that receives stats via props.
 */
export default function ProgressBar({ completedCount, totalCount, percent }) {
    if (totalCount === 0) return null;

    const isComplete = percent === 100;

    return (
        <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '24px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                        Day Progress
                    </div>
                    <div style={{ color: '#888', fontSize: '12px' }}>
                        {completedCount} of {totalCount} exercises completed
                    </div>
                </div>
                <div style={{ 
                    color: isComplete ? '#22c55e' : '#FF5C1A', 
                    fontSize: '20px', 
                    fontWeight: '800',
                    fontFamily: "'Sora', sans-serif"
                }}>
                    {percent}%
                </div>
            </div>

            <div style={{ 
                height: '8px', 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '4px', 
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    height: '100%',
                    width: `${percent}%`,
                    background: isComplete 
                        ? 'linear-gradient(90deg, #22c55e, #4ade80)' 
                        : 'linear-gradient(90deg, #FF5C1A, #ff8c42)',
                    borderRadius: '4px',
                    transition: 'width 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: isComplete ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
                }} />
            </div>
            
            {isComplete && (
                <div style={{ 
                    color: '#22c55e', 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    animation: 'fadeIn 0.5s ease'
                }}>
                    <span style={{ fontSize: '14px' }}>🏆</span> DAILY GOAL REACHED!
                </div>
            )}
        </div>
    );
}
