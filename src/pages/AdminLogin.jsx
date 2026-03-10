import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAuth';

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
            minHeight: '100vh',
            background: '#0C0C0C',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div style={{
                background: '#1A1A1A',
                padding: '40px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{
                        fontFamily: "'Sora', sans-serif",
                        fontSize: '28px',
                        fontWeight: '800',
                        color: '#F0EDE8',
                        marginBottom: '8px',
                        letterSpacing: '-1px'
                    }}>
                        AIR<em style={{ color: '#FF5C1A', fontStyle: 'normal' }}>FIT</em> GYM
                    </h1>
                    <p style={{ color: '#888', fontSize: '14px' }}>Admin Portal Access</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#888',
                            marginBottom: '8px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>Admin Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder="Enter password"
                            style={{
                                width: '100%', padding: '14px 16px',
                                background: '#111', border: '1.5px solid rgba(255,255,255,0.07)',
                                borderRadius: '8px', color: '#fff', fontSize: '15px'
                            }}
                        />
                    </div>

                    {error && <div style={{ color: '#ff4444', fontSize: '13px' }}>{error}</div>}

                    <button type="submit" style={{
                        padding: '16px', borderRadius: '8px', background: 'linear-gradient(135deg, #FF6B00 0%, #ff4500 100%)',
                        border: 'none', color: '#fff', fontWeight: '700', fontSize: '15px',
                        cursor: 'pointer', fontFamily: "'Sora', sans-serif"
                    }}>
                        Enter Dashboard →
                    </button>
                </form>
            </div>
        </div>
    );
}
