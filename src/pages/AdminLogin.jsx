import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Lock } from 'lucide-react';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAdminAuth();

    const handleLogin = (e) => {
        e.preventDefault();
        if (login(password)) {
            navigate('/admin/dashboard');
        } else {
            setError('Invalid password');
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
                width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, rgba(0,0,0,0) 70%)',
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
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)' }}
                    >
                        <Shield size={32} color="#ef4444" strokeWidth={1.5} />
                    </motion.div>
                    <h1 className="brand-font" style={{
                        color: '#fff', letterSpacing: '-0.04em', fontWeight: '700',
                        fontSize: '36px', margin: '0 0 12px'
                    }}>
                        AirFit <span style={{ color: '#ef4444' }}>Admin</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '16px', margin: 0, fontWeight: 300 }}>
                        Secure Trainer Portal
                    </p>
                </div>

                <div className="glass-panel" style={{
                    borderRadius: '24px', padding: '40px'
                }}>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{
                                display: 'block', fontSize: '13px', color: 'var(--text-muted)',
                                marginBottom: '10px', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase'
                            }}>Access Passcode</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    placeholder="Enter admin passcode"
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', padding: '16px 16px 16px 48px', color: '#fff', fontSize: '16px',
                                        outline: 'none', transition: 'all 0.3s ease',
                                        fontFamily: 'inherit'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{
                                    color: '#ef4444', fontSize: '13px', margin: 0,
                                    background: 'rgba(239,68,68,0.1)', padding: '12px 16px', borderRadius: '8px',
                                    borderLeft: '3px solid #ef4444'
                                }}
                            >{error}</motion.div>
                        )}

                        <button 
                            type="submit" 
                            style={{
                                width: '100%', borderRadius: '12px', padding: '16px',
                                background: '#ef4444', color: '#fff', border: 'none',
                                fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                            onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'; }}
                            onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'; }}
                        >
                            Authorize Access <ArrowRight size={18} />
                        </button>
                    </form>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <button 
                        onClick={() => navigate('/')}
                        style={{ 
                            background: 'none', border: 'none',
                            color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer',
                            transition: 'color 0.2s', padding: '8px'
                        }}
                        onMouseOver={(e) => e.target.style.color = '#fff'}
                        onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
                    >
                        Return to <span style={{ color: 'var(--primary)' }}>Client Login</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
