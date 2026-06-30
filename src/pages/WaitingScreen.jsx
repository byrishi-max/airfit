import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, Clock, CheckCircle2 } from 'lucide-react';

const WAITING_TIPS = [
    "Analyzing your equipment availability...",
    "Calculated optimal volume for your goals...",
    "Reviewing your injury history for safety...",
    "Structuring progressive overload stages...",
    "Finalizing your personalized macro split...",
    "Optimizing exercise selection for hypertrophy..."
];

export default function WaitingScreen() {
    const { client } = useClientAuth();
    const navigate = useNavigate();
    const { planStatus, checkPlan, isLoading } = useClientPlan(client?.clientId);
    const [tipIndex, setTipIndex] = useState(0);

    useEffect(() => {
        const tipInterval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % WAITING_TIPS.length);
        }, 3500);
        return () => clearInterval(tipInterval);
    }, []);

    useEffect(() => {
        if (planStatus === 'ready') {
            navigate('/client/dashboard');
        }
    }, [planStatus, navigate]);

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--fit-bg)', color: 'var(--fit-text)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden'
        }}>
            {/* Ambient Background Glows */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '70vw', height: '70vw',
                background: 'radial-gradient(circle, rgba(255,94,0,0.06) 0%, transparent 60%)',
                filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    position: 'relative', zIndex: 10, width: '100%', maxWidth: '520px',
                    padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                {/* Loader Animation */}
                <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '40px' }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
                        style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            border: '1px dashed rgba(255,94,0,0.3)',
                        }}
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 12, ease: 'linear', repeat: Infinity }}
                        style={{
                            position: 'absolute', inset: '12px', borderRadius: '50%',
                            border: '2px solid transparent',
                            borderTopColor: 'rgba(255,94,0,0.6)',
                            borderBottomColor: 'rgba(255,94,0,0.2)',
                        }}
                    />
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
                        style={{
                            position: 'absolute', inset: '28px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ff6a1f, #ff4c00)',
                            boxShadow: '0 0 32px rgba(255,94,0,0.4)',
                            display: 'grid', placeItems: 'center', color: '#fff'
                        }}
                    >
                        <Sparkles size={36} strokeWidth={1.5} />
                    </motion.div>
                </div>

                <h2 style={{
                    fontSize: '32px', fontWeight: '900', letterSpacing: '-0.03em',
                    margin: '0 0 16px', background: 'linear-gradient(135deg, #fff, #a1a1aa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    Curating Your Plan...
                </h2>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={tipIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        style={{ color: 'var(--fit-orange)', fontSize: '15px', fontWeight: '700', minHeight: '24px', marginBottom: '32px' }}
                    >
                        {WAITING_TIPS[tipIndex]}
                    </motion.div>
                </AnimatePresence>

                {/* Progress Track */}
                <div style={{ width: '100%', maxWidth: '340px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', position: 'relative', marginBottom: '32px' }}>
                    <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
                        style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%',
                            background: 'linear-gradient(90deg, transparent, var(--fit-orange), transparent)',
                        }}
                    />
                </div>

                <div className="glass-panel" style={{
                    width: '100%', padding: '20px', borderRadius: '16px',
                    display: 'flex', alignItems: 'flex-start', gap: '14px', textAlign: 'left'
                }}>
                    <div style={{ flex: '0 0 40px', width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', display: 'grid', placeItems: 'center', color: '#22c55e' }}>
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <strong style={{ display: 'block', color: 'var(--fit-text)', fontSize: '15px', marginBottom: '4px' }}>Safe to leave this screen</strong>
                        <p style={{ margin: 0, color: 'var(--fit-muted)', fontSize: '13px', lineHeight: '1.5' }}>
                            Your customized plan is generating securely on our servers. You can exit now and we’ll email a direct link to <span style={{ color: '#fff', fontWeight: '600' }}>{client?.email || 'your registered email'}</span> once it's ready.
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <button onClick={() => navigate('/client/dashboard')} style={{
                        background: 'transparent', border: 'none', color: 'var(--fit-dim)', fontSize: '13px',
                        fontWeight: '700', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px',
                        transition: 'color 0.2s, background 0.2s'
                    }} onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }} onMouseOut={e => { e.currentTarget.style.color = 'var(--fit-dim)'; e.currentTarget.style.background = 'transparent'; }}>
                        Return to Dashboard
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
