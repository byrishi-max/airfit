import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';

export default function WaitingScreen() {
    const { client } = useClientAuth();
    const navigate = useNavigate();
    const { planStatus, checkPlan, isLoading } = useClientPlan(client?.clientId);
    const [dots, setDots] = useState('');
    const [showRefresh, setShowRefresh] = useState(false);
    const [tipIndex, setTipIndex] = useState(0);

    const tips = [
        "Analyzing your equipment availability...",
        "Calculated optimal volume for your goals...",
        "Reviewing your injury history for safety...",
        "Structuring progressive overload stages...",
        "Finalizing your personalized macro split...",
        "Optimizing exercise selection for hypertrophy..."
    ];

    useEffect(() => {
        const dotInterval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 800);
        
        const tipInterval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % tips.length);
        }, 4000);
        
        const refreshTimer = setTimeout(() => {
            setShowRefresh(true);
        }, 12000);

        return () => {
            clearInterval(dotInterval);
            clearInterval(tipInterval);
            clearTimeout(refreshTimer);
        };
    }, []);

    useEffect(() => {
        if (planStatus === 'ready') {
            navigate('/client/plan');
        }
    }, [planStatus, navigate]);

    const handleManualCheck = async () => {
        const ready = await checkPlan();
        if (!ready) {
            // If still not ready, show a small toast or feedback?
            // For now, the button states handle it
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient Background Glows */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle at center, rgba(255,107,0,0.05), transparent 70%)',
                filter: 'blur(80px)',
                zIndex: 0
            }}></div>

            {/* Pulsing Core Animation */}
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                <div style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 40px',
                    position: 'relative'
                }}>
                    {/* Ring 1 - Deep */}
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        border: '2px solid rgba(255,107,0,0.1)',
                        animation: 'pulse-ring 3s infinite ease-out'
                    }}></div>
                    {/* Ring 2 - Mid */}
                    <div style={{
                        position: 'absolute', inset: '10px', borderRadius: '50%',
                        border: '2px solid rgba(255,107,0,0.2)',
                        animation: 'pulse-ring 3s infinite ease-out 0.5s'
                    }}></div>
                    {/* Inner Gear/Logo Placeholder */}
                    <div style={{
                        position: 'absolute', inset: '25px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF6B00, #E05E00)',
                        boxShadow: '0 0 30px rgba(255,107,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', color: '#000000', fontWeight: '900'
                    }}>
                        AI
                    </div>
                </div>

                <h2 style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    letterSpacing: '-0.02em',
                    marginBottom: '16px'
                }}>
                    {isLoading ? 'Checking Server...' : `Curating Your Plan${dots}`}
                </h2>
                
                <div style={{ 
                    height: '24px', 
                    marginBottom: '40px',
                    color: '#ff6b00',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.5s ease'
                }}>
                    {tips[tipIndex]}
                </div>

                {/* Progress Bar Container */}
                <div style={{
                    width: '320px',
                    height: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '2px',
                    margin: '0 auto',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, #FF6B00, transparent)',
                        animation: isLoading ? 'progress-shimmer 0.8s infinite linear' : 'progress-shimmer 2s infinite linear'
                    }}></div>
                </div>

                {showRefresh && (
                    <div style={{ marginTop: '40px', animation: 'fade-in 0.5s ease' }}>
                        <button 
                            onClick={handleManualCheck}
                            disabled={isLoading}
                            style={{
                                background: isLoading ? 'rgba(255,107,0,0.05)' : 'transparent',
                                border: '1px solid #FF6B00',
                                color: '#FF6B00',
                                padding: '12px 28px',
                                borderRadius: '30px',
                                fontSize: '14px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                opacity: isLoading ? 0.5 : 1
                            }}
                        >
                            {isLoading ? 'Syncing...' : 'Check Status Now'}
                        </button>
                        <p style={{ marginTop: '16px', color: '#666', fontSize: '13px', maxWidth: '300px', margin: '16px auto 0' }}>
                            If it takes more than 1 minute, the AI might be experiencing high load. Try refreshing the page.
                        </p>
                    </div>
                )}

                <div style={{
                    marginTop: '60px',
                    fontSize: '13px',
                    color: '#ff6b00',
                    fontWeight: '700',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    Optimization in Progress
                </div>
            </div>

            <style>{`
                @keyframes pulse-ring {
                    0% { transform: scale(0.6); opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
                @keyframes progress-shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                body { margin: 0; }
            `}</style>
        </div>
    );
}
