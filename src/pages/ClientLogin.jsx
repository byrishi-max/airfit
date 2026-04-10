import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Dumbbell, ArrowRight, Phone } from 'lucide-react';

export default function ClientLogin() {
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { loginByPhone } = useClientAuth();

    const handleLogin = async () => {
        if (!phone.trim()) {
            setError('Please enter your phone number');
            return;
        }

        setIsLoggingIn(true);
        const result = await loginByPhone(phone.trim());
        setIsLoggingIn(false);

        if (!result.success) {
            setError(result.error);
            return;
        }

        const client = result.client;
        if (client.planStatus === 'ready') {
            navigate('/client/plan');
        } else if (client.planStatus === 'pending') {
            navigate('/client/waiting');
        } else {
            navigate('/client/dashboard');
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            position: 'relative', overflow: 'hidden'
        }}>
            {/* Background elements */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0
            }} />

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px', boxShadow: '0 8px 32px rgba(249, 115, 22, 0.15)' }}
                    >
                        <Dumbbell size={32} color="#f97316" strokeWidth={1.5} />
                    </motion.div>
                    <h1 className="brand-font" style={{
                        color: '#fff', letterSpacing: '-0.04em', fontWeight: '700',
                        fontSize: '36px', margin: '0 0 12px'
                    }}>
                        Welcome to <span className="text-gradient-orange">AirFit</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '16px', margin: 0, fontWeight: 300 }}>
                        Client Training Portal
                    </p>
                </div>

                <div className="glass-panel" style={{
                    borderRadius: '24px', padding: '40px'
                }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block', fontSize: '13px', color: 'var(--text-muted)',
                            marginBottom: '10px', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase'
                        }}>Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                                <Phone size={18} />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => { setPhone(e.target.value); setError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                placeholder="Enter your 10-digit number"
                                style={{
                                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', padding: '16px 16px 16px 48px', color: '#fff', fontSize: '16px',
                                    outline: 'none', transition: 'all 0.3s ease',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.15)'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{
                                color: '#ef4444', fontSize: '13px', margin: '0 0 24px',
                                background: 'rgba(239,68,68,0.1)', padding: '12px 16px', borderRadius: '8px',
                                borderLeft: '3px solid #ef4444'
                            }}
                        >{error}</motion.div>
                    )}

                    <button
                        className="premium-button"
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        style={{
                            width: '100%', borderRadius: '12px', padding: '16px',
                            fontSize: '16px', fontWeight: '600', cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            opacity: isLoggingIn ? 0.7 : 1
                        }}
                    >
                        {isLoggingIn ? 'Verifying...' : <>Access Portal <ArrowRight size={18} /></>}
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <button 
                        onClick={() => navigate('/admin/login')}
                        style={{ 
                            background: 'none', border: 'none',
                            color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer',
                            transition: 'color 0.2s', padding: '8px'
                        }}
                        onMouseOver={(e) => e.target.style.color = '#fff'}
                        onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
                    >
                        Are you a trainer? <span style={{ color: 'var(--primary)' }}>Admin Login</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
