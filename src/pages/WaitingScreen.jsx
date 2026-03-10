import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientPlan } from '../hooks/useClientPlan';

export default function WaitingScreen() {
    const navigate = useNavigate();
    const session = JSON.parse(localStorage.getItem('airfit_client_session') || '{}');
    const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
    const client = clients.find(c => c.clientId === session.clientId) || {};
    const submittedAt = client.submittedAt || Date.now();

    const { planStatus } = useClientPlan(session.clientId);

    // Auto-redirect when plan is ready
    useEffect(() => {
        if (planStatus === 'ready') {
            navigate('/client/plan');
        }
    }, [planStatus, navigate]);

    const WAIT_MS = 65 * 60 * 1000;
    const readyAt = submittedAt + WAIT_MS;

    const [timeLeft, setTimeLeft] = useState(Math.max(0, readyAt - Date.now()));
    useEffect(() => {
        const t = setInterval(() => setTimeLeft(Math.max(0, readyAt - Date.now())), 1000);
        return () => clearInterval(t);
    }, [readyAt]);

    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);
    const progress = Math.min(100, ((WAIT_MS - timeLeft) / WAIT_MS) * 100);

    return (
        <div style={{
            minHeight: '100vh', background: '#0C0C0C',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                {/* Spinner */}
                <div style={{
                    width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 28px',
                    border: '3px solid #1a1a1a', borderTop: '3px solid #FF5C1A',
                    animation: 'spin 1s linear infinite'
                }} />

                <h2 style={{ color: '#FF5C1A', fontSize: '22px', fontWeight: '800', margin: '0 0 8px', fontFamily: "'Sora', sans-serif" }}>
                    🤖 AI Coach is Building Your Plan
                </h2>
                <p style={{ color: '#666', fontSize: '14px', margin: '0 0 32px', lineHeight: '1.6' }}>
                    Crafting your 6-day workout with YouTube tutorials for every exercise...
                </p>

                {/* Countdown timer */}
                <div style={{
                    background: '#1a1a1a', borderRadius: '12px', padding: '20px 32px',
                    display: 'inline-block', marginBottom: '24px', border: '1px solid #2a2a2a'
                }}>
                    <div style={{ color: '#fff', fontSize: '40px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '4px' }}>
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </div>
                    <div style={{ color: '#444', fontSize: '11px', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
                        REMAINING
                    </div>
                </div>

                {/* Progress bar */}
                <div style={{ background: '#1a1a1a', borderRadius: '4px', height: '6px', margin: '0 auto 16px', maxWidth: '320px' }}>
                    <div style={{
                        height: '100%', borderRadius: '4px', width: `${progress}%`,
                        background: 'linear-gradient(90deg, #FF5C1A, #ff8c42)',
                        transition: 'width 1s linear'
                    }} />
                </div>

                <p style={{ color: '#333', fontSize: '12px' }}>
                    You can close this tab and come back — your plan will be waiting!
                </p>

                {/* Polling indicator */}
                <div style={{ marginTop: '24px', color: '#2a2a2a', fontSize: '11px' }}>
                    Checking for plan every 30 seconds...
                </div>
            </div>
        </div>
    );
}
