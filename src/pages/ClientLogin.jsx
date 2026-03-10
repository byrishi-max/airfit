import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';

export default function ClientLogin() {
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { loginByPhone } = useClientAuth();

    const handleLogin = () => {
        if (!phone.trim()) {
            setError('Please enter your phone number');
            return;
        }

        const result = loginByPhone(phone.trim());
        if (!result.success) {
            setError(result.error);
            return;
        }

        // Route based on plan status
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
            minHeight: '100vh', background: '#0C0C0C', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{
                        fontFamily: "'Sora', sans-serif",
                        color: '#FF5C1A', letterSpacing: '6px', fontWeight: '900',
                        fontSize: '26px', margin: '0 0 8px'
                    }}>
                        AIRFIT GYM
                    </h1>
                    <p style={{ color: '#444', fontSize: '14px', margin: 0 }}>Client Training Portal</p>
                </div>

                <div style={{
                    background: '#111', borderRadius: '14px', padding: '32px',
                    border: '1px solid #1a1a1a', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}>
                    <p style={{ color: '#888', fontSize: '13px', margin: '0 0 20px', textAlign: 'center' }}>
                        Enter your registered phone number to login
                    </p>

                    <input
                        type="tel"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        placeholder="e.g. 9876543210"
                        style={{
                            width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                            borderRadius: '8px', padding: '13px 14px', color: '#fff', fontSize: '16px',
                            outline: 'none', boxSizing: 'border-box', marginBottom: '6px',
                            fontFamily: 'monospace', letterSpacing: '2px'
                        }}
                    />

                    {error && (
                        <div style={{
                            color: '#ef4444', fontSize: '12px', margin: '0 0 12px',
                            background: 'rgba(239,68,68,0.08)', padding: '10px 12px', borderRadius: '6px'
                        }}>{error}</div>
                    )}

                    <button
                        onClick={handleLogin}
                        style={{
                            width: '100%', background: 'linear-gradient(135deg, #FF6B00 0%, #FF4500 100%)',
                            color: '#fff', border: 'none', borderRadius: '8px', padding: '14px',
                            fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '8px',
                            letterSpacing: '1px', fontFamily: "'Sora', sans-serif"
                        }}
                    >
                        ENTER PORTAL →
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <a href="/admin/login" style={{ color: '#333', fontSize: '12px', textDecoration: 'none' }}>
                        Admin access →
                    </a>
                </div>
            </div>
        </div>
    );
}
