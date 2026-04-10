import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAuth';
import { getClients, createClient, saveClients, deleteClient } from '../utils/storage';
import { sendPortalInvite } from '../utils/inviteClient';
import AdminClientTable from '../components/AdminClientTable';
import { ENDPOINTS } from '../utils/config';

export default function AdminDashboard() {
    const { logout } = useAdminAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [toast, setToast] = useState({ msg: '', type: 'success' });
    const [selectedClient, setSelectedClient] = useState(null);
    const [inviteSending, setInviteSending] = useState(false);

    useEffect(() => {
        const localClients = getClients();
        setClients(localClients);

        const syncWithBackend = async () => {
            try {
                const res = await fetch(ENDPOINTS.GET_CLIENTS);
                if (res.ok) {
                    const backendClients = await res.json();
                    if (Array.isArray(backendClients)) {
                        const deletedIds = JSON.parse(localStorage.getItem('deleted_clients') || '[]');
                        // Merge: Start with backend data, excluding deleted
                        const merged = [...backendClients].filter(c => !deletedIds.includes(c.clientId));
                        
                        // Add any local clients not found in backend (to prevent data loss)
                        localClients.forEach(lc => {
                            if (deletedIds.includes(lc.clientId)) return;
                            const exists = merged.some(bc => 
                                bc.clientId === lc.clientId || 
                                (bc.phone && bc.phone === lc.phone)
                            );
                            if (!exists) merged.push(lc);
                        });

                        setClients(merged);
                        saveClients(merged);
                    }
                }
            } catch (e) {
                console.warn('Sync with backend failed (offline or endpoint missing):', e);
            }
        };

        syncWithBackend();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: 'success' }), 8000);
    };

    const handleAddClient = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.phone) return;

        // Capture form values BEFORE clearing (prevents race conditions)
        const clientName  = form.name.trim();
        const clientEmail = form.email.trim();
        const clientPhone = form.phone.trim();

        setInviteSending(true);
        const newClient = createClient(clientName, clientEmail, clientPhone);
        setClients(prev => [...prev, newClient]);
        setForm({ name: '', email: '', phone: '' });

        // Send portal invite email via n8n
        const sent = await sendPortalInvite({ name: clientName, email: clientEmail, phone: clientPhone });
        setInviteSending(false);

        if (sent) {
            showToast(`✅ Client added! Invite email sent to ${clientEmail}. They can login with phone: ${clientPhone}`, 'success');
        } else {
            showToast(`✅ Client added! (Invite email failed — send manually. Login phone: ${clientPhone})`, 'warning');
        }
    };

    const handleDeleteClient = (client) => {
        if (!window.confirm(`Are you sure you want to delete ${client.name}?`)) return;
        deleteClient(client.clientId);
        setClients(prev => prev.filter(c => c.clientId !== client.clientId));
        showToast(`🗑️ Deleted client ${client.name}`, 'success');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#080808' }}>
            {/* Header */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 40px', borderBottom: '1px solid #1a1a1a', background: '#111'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px', color: '#F0EDE8' }}>
                        AIR<em style={{ color: '#FF5C1A', fontStyle: 'normal' }}>FIT</em> GYM
                    </div>
                    <span style={{ background: '#2a2a2a', color: '#888', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Panel</span>
                </div>
                <button onClick={handleLogout} style={{
                    background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                }}>
                    Logout
                </button>
            </header>

            <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Toast */}
                {toast.msg && (
                    <div style={{
                        background: toast.type === 'warning' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                        border: `1px solid ${toast.type === 'warning' ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        color: toast.type === 'warning' ? '#eab308' : '#22c55e',
                        padding: '14px 16px', borderRadius: '8px', marginBottom: '32px', fontSize: '14px', fontWeight: '500'
                    }}>
                        {toast.msg}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '40px', alignItems: 'start' }}>

                    {/* Add Client Panel */}
                    <div style={{ background: '#111', padding: '24px', borderRadius: '16px', border: '1px solid #1a1a1a' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', color: '#fff' }}>Add New Client</h2>
                        <p style={{ color: '#555', fontSize: '12px', marginBottom: '24px' }}>Client will receive a portal invite email with their login link.</p>
                        <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. Rahul Sharma' },
                                { key: 'email', label: 'Email Address', type: 'email', placeholder: 'client@example.com' },
                                { key: 'phone', label: 'Phone Number (Login ID)', type: 'tel', placeholder: 'e.g. 9876543210' }
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>{f.label}</label>
                                    <input
                                        required type={f.type} placeholder={f.placeholder}
                                        value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                        style={{ width: '100%', padding: '12px 14px', background: '#0C0C0C', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                                    />
                                </div>
                            ))}
                            <button type="submit" disabled={inviteSending} style={{
                                marginTop: '8px', padding: '14px', background: inviteSending ? '#2a2a2a' : '#FF5C1A',
                                color: inviteSending ? '#666' : '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: inviteSending ? 'not-allowed' : 'pointer'
                            }}>
                                {inviteSending ? 'Sending Invite...' : '+ Add Client & Send Invite'}
                            </button>
                        </form>
                    </div>

                    {/* Client List */}
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>
                            Clients Directory
                            <span style={{ marginLeft: '10px', color: '#555', fontWeight: '400', fontSize: '14px' }}>({clients.length} total)</span>
                        </h2>
                        <AdminClientTable clients={clients} onViewPlan={(c) => setSelectedClient(c)} onDeleteClient={handleDeleteClient} />
                    </div>
                </div>
            </main>

            {/* Plan Modal */}
            {selectedClient && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
                }} onClick={() => setSelectedClient(null)}>
                    <div style={{
                        background: '#111', width: '100%', maxWidth: '800px', height: '100%', maxHeight: '80vh',
                        borderRadius: '16px', border: '1px solid #333', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>{selectedClient.name}'s Plan</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>{selectedClient.planType || 'Workout Plan'}</p>
                            </div>
                            <button onClick={() => setSelectedClient(null)} style={{ background: '#2a2a2a', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: '#ccc', lineHeight: '1.6' }}>
                            {selectedClient.workoutPlan ? (
                                <div>
                                    <p style={{ color: '#FF5C1A', fontWeight: '700' }}>{selectedClient.workoutPlan.greeting}</p>
                                    <p style={{ color: '#888' }}>{selectedClient.workoutPlan.overview}</p>
                                    {selectedClient.workoutPlan.days?.map((d, i) => (
                                        <div key={i} style={{ marginBottom: '16px', background: '#1a1a1a', padding: '12px', borderRadius: '8px' }}>
                                            <strong style={{ color: '#fff' }}>{d.day} — {d.muscle}</strong>
                                            <ul style={{ margin: '8px 0 0', color: '#888', paddingLeft: '20px' }}>
                                                {d.exercises?.map((ex, j) => (
                                                    <li key={j}>{ex.name} — {ex.sets} sets × {ex.reps} reps</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : selectedClient.dietHtml ? (
                                <div dangerouslySetInnerHTML={{ __html: selectedClient.dietHtml }} />
                            ) : (
                                <p>No plan data available yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
