import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import Questionnaire from '../components/Questionnaire';
import { useState } from 'react';

export default function ClientDashboard() {
    const { client, logout } = useClientAuth();
    const navigate = useNavigate();
    const safeClient = client || {};
    const { planStatus } = useClientPlan(safeClient.clientId);

    const [activeForm, setActiveForm] = useState(null);

    useEffect(() => {
        if (planStatus === 'ready') {
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

    if (activeForm) {
        return (
            <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE8', padding: '60px 24px' }}>
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', maxWidth: '860px', margin: '0 auto 40px' }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '18px', fontWeight: '800' }}>
                        AIR<em style={{ color: '#FF5C1A', fontStyle: 'normal' }}>FIT</em> GYM
                    </div>
                    <span style={{ color: '#555', fontSize: '13px' }}>{client.name}</span>
                </header>
                <Questionnaire
                    planType={activeForm}
                    client={client}
                    onCancel={() => setActiveForm(null)}
                />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE8' }}>
            {/* Header */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(26,26,26,0.5)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                    AIR<em style={{ color: '#FF5C1A', fontStyle: 'normal' }}>FIT</em> GYM
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '14px', color: '#ccc' }}>Hi, {client.name}</span>
                    <button onClick={handleLogout} style={{
                        background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                    }}>
                        Logout
                    </button>
                </div>
            </header>

            <main style={{ padding: '60px 40px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: '42px', fontWeight: '800', marginBottom: '16px' }}>
                    Welcome, {client.name.split(' ')[0]}! 👋
                </h1>
                <p style={{ color: '#888', fontSize: '16px', marginBottom: '48px' }}>
                    Select a path below to generate your personalized AI fitness plan.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
                    {[
                        { type: 'Workout Plan', emoji: '🏋️', desc: '6-day training program with progressive overload, exercise demos & recovery protocol.' },
                        { type: 'Diet Plan', emoji: '🥗', desc: '7-day personalised Indian meal plan with macros, timings, and supplement stack.' },
                    ].map(card => (
                        <div
                            key={card.type}
                            onClick={() => setActiveForm(card.type)}
                            style={{
                                background: '#111', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: '16px',
                                padding: '40px 32px', cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'left'
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = '#FF5C1A'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(255,92,26,0.15)'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '24px' }}>{card.emoji}</div>
                            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>{card.type}</h3>
                            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>{card.desc}</p>
                            <div style={{ marginTop: '24px', color: '#FF5C1A', fontSize: '13px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                Start Form →
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
