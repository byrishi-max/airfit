import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import Questionnaire from '../components/Questionnaire';

export default function ClientDashboard() {
    const { client, logout } = useClientAuth();
    const navigate = useNavigate();
    const safeClient = client || {};
    const { planStatus } = useClientPlan(safeClient.clientId);

    const [activeForm, setActiveForm] = useState(null);

    useEffect(() => {
        // Check if client has an existing workout or diet plan, or if planStatus indicates readiness/pending
        if (client?.workoutPlan || client?.dietPlan || planStatus === 'ready') {
            navigate('/client/plan');
        } else if (planStatus === 'pending') {
            navigate('/client/waiting');
        }
    }, [planStatus, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/client/login');
    };

    if (!client) return null;

    const backgroundElements = (
        <>
            {/* Dark Base */}
            <div style={{ position: 'fixed', inset: 0, backgroundColor: '#050505', zIndex: 0 }}></div>

            {/* Background Noise Overlay */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
                opacity: 0.04, mixBlendMode: 'overlay', zIndex: 1
            }}></div>

            {/* Huge Background Text - Layer 1 */}
            <div style={{
                position: 'fixed', top: '12%', left: '0', width: '100vw', textAlign: 'center', pointerEvents: 'none', zIndex: 2,
                fontFamily: "'Inter', sans-serif", fontSize: 'clamp(60px, 9vw, 130px)', fontWeight: '900', lineHeight: '1.2',
                color: 'rgba(255, 138, 61, 0.4)', letterSpacing: '-0.02em', display: 'flex', flexDirection: 'column',
                textTransform: 'capitalize'
            }}>
                <div>Sculpt <span style={{ color: 'rgba(255, 138, 61, 0.15)' }}>Your</span> Body,</div>
                <div>Elevate <span style={{ color: 'rgba(255, 138, 61, 0.15)' }}>Your</span> Spirit</div>
            </div>

            {/* Bodybuilder Image - Layer 2 (Lighten blend mode for perfect occlusion hack) */}
            <div style={{
                position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: '100vw', maxWidth: '800px', height: '100vh',
                backgroundImage: 'url("/assets/images/bodybuilder_orange_bg.png")',
                backgroundSize: 'contain', backgroundPosition: 'bottom center', backgroundRepeat: 'no-referrer',
                mixBlendMode: 'lighten', zIndex: 3, pointerEvents: 'none',
                /* Optional fade out at bottom to blend smoothly */
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 20%)',
                maskImage: 'linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 20%)',
            }}></div>

            {/* Subtle floating gradient for pop */}
            <div style={{ position: 'fixed', bottom: '10%', left: '50%', transform: 'translateX(-50%)', width: '50vw', height: '50vw', background: 'radial-gradient(circle at center, rgba(255,107,0,0.08), transparent 70%)', filter: 'blur(80px)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}></div>

            {/* Floating Decorative Stats (Orange Theme) */}
            <div style={{ position: 'fixed', top: '35%', left: 'max(5%, calc(50% - 480px))', transform: 'rotate(-10deg)', background: 'linear-gradient(145deg, rgba(42,26,8,0.9), rgba(20,10,0,0.9))', padding: '16px 20px', borderRadius: '24px', textAlign: 'center', width: '90px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,107,0,0.15)', zIndex: 4, backdropFilter: 'blur(10px)' }}>
                <div style={{ color: '#ff6b00', fontSize: '26px', marginBottom: '8px' }}>⏱️</div>
                <div style={{ color: '#a3a3a3', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Hours</div>
                <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '800' }}>1.5</div>
            </div>

            <div style={{ position: 'fixed', top: '30%', right: 'max(5%, calc(50% - 480px))', transform: 'rotate(10deg)', background: 'linear-gradient(145deg, rgba(42,26,8,0.9), rgba(20,10,0,0.9))', padding: '16px 20px', borderRadius: '24px', textAlign: 'center', width: '90px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,107,0,0.15)', zIndex: 4, backdropFilter: 'blur(10px)' }}>
                <div style={{ color: '#ff6b00', fontSize: '26px', marginBottom: '8px' }}>🏃‍♂️</div>
                <div style={{ color: '#a3a3a3', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Poses</div>
                <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '800' }}>20</div>
            </div>

            <div style={{ position: 'fixed', bottom: '25%', left: 'max(8%, calc(50% - 400px))', transform: 'rotate(-12deg)', background: 'linear-gradient(145deg, rgba(42,26,8,0.9), rgba(20,10,0,0.9))', padding: '16px 20px', borderRadius: '24px', textAlign: 'center', width: '90px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,107,0,0.15)', zIndex: 4, backdropFilter: 'blur(10px)' }}>
                <div style={{ color: '#ff6b00', fontSize: '26px', marginBottom: '8px' }}>🔥</div>
                <div style={{ color: '#a3a3a3', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Kcal</div>
                <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '800' }}>550</div>
            </div>

            <div style={{ position: 'fixed', bottom: '20%', right: 'max(8%, calc(50% - 400px))', transform: 'rotate(12deg)', background: 'linear-gradient(145deg, rgba(42,26,8,0.9), rgba(20,10,0,0.9))', padding: '16px 20px', borderRadius: '24px', textAlign: 'center', width: '90px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,107,0,0.15)', zIndex: 4, backdropFilter: 'blur(10px)' }}>
                <div style={{ color: '#ff6b00', fontSize: '26px', marginBottom: '8px' }}>🏋️‍♀️</div>
                <div style={{ color: '#a3a3a3', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Sets</div>
                <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '800' }}>5</div>
            </div>

            {/* Vertical PREV / NEXT */}
            <div className="hide-on-mobile" style={{ position: 'fixed', top: '50%', left: '2%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '20px', color: '#a3a3a3', fontSize: '14px', fontWeight: '400', letterSpacing: '4px', zIndex: 4 }}>
                <span>P</span><span>R</span><span>E</span><span>V</span>
            </div>
            <div className="hide-on-mobile" style={{ position: 'fixed', top: '50%', right: '2%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '20px', color: '#a3a3a3', fontSize: '14px', fontWeight: '400', letterSpacing: '4px', zIndex: 4 }}>
                <span>N</span><span>E</span><span>X</span><span>T</span>
            </div>
        </>
    );

    const mobileStyles = `
        @media (max-width: 800px) {
            .hide-on-mobile { display: none !important; }
        }
    `;

    if (activeForm) {
        return (
            <div style={{ minHeight: '100vh', background: '#050505', color: '#a3a3a3', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
                {backgroundElements}
                <div style={{ position: 'relative', zIndex: 10, padding: '60px 24px', height: '100vh', overflowY: 'auto' }}>
                    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', maxWidth: '860px', margin: '0 auto 40px' }}>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
                            AIR<em style={{ color: '#ff6b00', fontStyle: 'normal' }}>FIT</em> GYM
                        </div>
                        <span style={{ color: '#a3a3a3', fontSize: '13px', fontWeight: '400' }}>{client.name}</span>
                    </header>
                    <Questionnaire
                        planType={activeForm}
                        client={client}
                        onCancel={() => setActiveForm(null)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#a3a3a3', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
            {backgroundElements}
            <style>{mobileStyles}</style>

            {/* Content Wrapper */}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100vh' }}>
                {/* Header */}
                <header style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,20,20,0.5)',
                    backdropFilter: 'blur(10px)', boxShadow: '0 0 80px rgba(255,107,0,0.02)'
                }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
                        AIR<em style={{ color: '#ff6b00', fontStyle: 'normal' }}>FIT</em> GYM
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontSize: '14px', color: '#a3a3a3', fontWeight: '400' }}>Hi, {client.name}</span>
                        <button onClick={handleLogout} style={{
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#a3a3a3', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                        onMouseOut={e => { e.currentTarget.style.color = '#a3a3a3'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <main style={{ padding: '40px 40px', maxWidth: '1000px', margin: 'auto auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                    <div style={{ display: 'inline-block', position: 'relative' }}>
                         <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: '42px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff', marginBottom: '16px', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                            Welcome, {client.name.split(' ')[0]}! 👋
                        </h1>
                    </div>
                    <p style={{ color: '#cccccc', fontWeight: '400', fontSize: '16px', marginBottom: '48px', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                        Select a path below to generate your personalized AI fitness plan.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '800px', width: '100%', margin: '0 auto', boxShadow: '0 0 80px rgba(255,107,0,0.04)', borderRadius: '16px' }}>
                        {[
                            { type: 'Workout Plan', emoji: '🏋️', desc: '6-day training program with progressive overload, exercise demos & recovery protocol.' },
                            { type: 'Diet Plan', emoji: '🥗', desc: '7-day personalised Indian meal plan with macros, timings, and supplement stack.' },
                        ].map(card => (
                            <div
                                key={card.type}
                                onClick={() => setActiveForm(card.type)}
                                style={{
                                    background: 'rgba(17, 17, 17, 0.7)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: '16px',
                                    padding: '40px 32px', cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'left',
                                    position: 'relative', overflow: 'hidden'
                                }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = '#ff6b00'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(255,107,0,0.25)'; e.currentTarget.style.background = 'rgba(26, 17, 10, 0.8)'; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(17, 17, 17, 0.7)'; }}
                            >
                                <div style={{ fontSize: '48px', marginBottom: '24px' }}>{card.emoji}</div>
                                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff', marginBottom: '12px' }}>{card.type}</h3>
                                <p style={{ color: '#a3a3a3', fontWeight: '400', fontSize: '14px', lineHeight: '1.6' }}>{card.desc}</p>
                                <div style={{ marginTop: '24px', color: '#ff6b00', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    Start Form →
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}

