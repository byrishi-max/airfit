import React, { useState, useEffect } from 'react';

export default function PlanWaitingScreen({ client }) {
    // Wait time 65 minutes
    const WAIT_MS = 65 * 60 * 1000;
    // submittedAt is stored in the client object, if not let's use Date.now()
    const submittedAt = client.submittedAt || Date.now();
    const readyAt = submittedAt + WAIT_MS;

    const [timeLeft, setTimeLeft] = useState(Math.max(0, readyAt - Date.now()));

    useEffect(() => {
        const t = setInterval(() => {
            const remaining = Math.max(0, readyAt - Date.now());
            setTimeLeft(remaining);
        }, 1000);
        return () => clearInterval(t);
    }, [readyAt]);

    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);
    const progress = Math.min(100, ((WAIT_MS - timeLeft) / WAIT_MS) * 100);

    return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            {/* Animated spinner */}
            <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                border: '3px solid #2a2a2a', borderTop: '3px solid #FF5C1A',
                animation: 'spin 1s linear infinite', margin: '0 auto 24px'
            }} />

            <h2 style={{ color: '#FF5C1A', fontFamily: "'Sora', sans-serif", fontSize: '22px', fontWeight: '800', margin: '0 0 8px' }}>
                🤖 Your AI Coach is Working...
            </h2>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px', lineHeight: '1.6' }}>
                Crafting your personalized 6-day plan with YouTube tutorials for every exercise.
            </p>

            {/* Countdown */}
            <div style={{
                background: '#1a1a1a', borderRadius: '12px', padding: '20px 32px',
                display: 'inline-block', marginBottom: '24px', border: '1px solid #2a2a2a'
            }}>
                <div style={{ color: '#fff', fontSize: '36px', fontWeight: '900', fontFamily: 'monospace' }}>
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
                <div style={{ color: '#555', fontSize: '12px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>remaining</div>
            </div>

            {/* Progress bar */}
            <div style={{ maxWidth: '320px', margin: '0 auto' }}>
                <div style={{ height: '6px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: '3px', width: `${progress}%`,
                        background: 'linear-gradient(90deg, #FF5C1A, #ff8c42)',
                        transition: 'width 1s linear'
                    }} />
                </div>
                <p style={{ color: '#555', fontSize: '12px', marginTop: '12px' }}>
                    You can close this tab and come back. Your plan will be ready!
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <p style={{ color: '#ffb', fontSize: '11px', marginTop: '20px', padding: '10px', background: '#222', borderRadius: '6px' }}>
                        [Dev Mode]: Demo plan will automatically unlock in 10 seconds...
                    </p>
                )}
            </div>
        </div>
    );
}
