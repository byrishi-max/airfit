import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminClientTable from '../components/AdminClientTable';
import { useAdminAuth } from '../hooks/useAuth';
import { createClientRecord, deleteClientRecord, listClients } from '../utils/clientRepository';
import { sendPortalInvite } from '../utils/inviteClient';

export default function AdminDashboard() {
    const { logout } = useAdminAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [toast, setToast] = useState({ msg: '', type: 'success' });
    const [selectedClient, setSelectedClient] = useState(null);
    const [activeTab, setActiveTab] = useState('workout');
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteSending, setInviteSending] = useState(false);
    const [submitStage, setSubmitStage] = useState('idle');

    // Filter clients based on search query (name, email, or phone)
    const filteredClients = clients.filter(c => {
        const query = searchQuery.toLowerCase();
        return (
            (c.name || '').toLowerCase().includes(query) ||
            (c.email || '').toLowerCase().includes(query) ||
            (c.phone || '').includes(query)
        );
    });

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const list = await listClients();
            setClients(list);
        } catch (error) {
            console.warn('Could not load clients:', error);
            setClients([]);
        }
    };

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

        const clientName = form.name.trim();
        const clientEmail = form.email.trim().toLowerCase();
        const clientPhone = form.phone.trim();

        setInviteSending(true);
        setSubmitStage('saving');
        let newClient;

        try {
            newClient = await createClientRecord({
                name: clientName,
                email: clientEmail,
                phone: clientPhone,
            });
        } catch (error) {
            setInviteSending(false);
            setSubmitStage('idle');
            showToast(error.message || 'Could not add client. Please try again.', 'warning');
            return;
        }

        setClients(prev => [newClient, ...prev.filter(client => client.clientId !== newClient.clientId)]);
        setForm({ name: '', email: '', phone: '' });
        setInviteSending(false);
        setSubmitStage('idle');
        showToast(`Client saved. Sending invite to ${clientEmail}...`, 'success');

        sendPortalInvite({ name: clientName, email: clientEmail, phone: clientPhone })
            .then(sent => {
                if (sent) {
                    showToast(`Invite sent to ${clientEmail}. Login phone: ${clientPhone}`, 'success');
                } else {
                    showToast(`Client saved, but invite email failed. Send manually. Login phone: ${clientPhone}`, 'warning');
                }
            });
    };

    const handleDeleteClient = async (client) => {
        if (!window.confirm(`Are you sure you want to delete ${client.name}?`)) return;
        try {
            await deleteClientRecord(client.clientId);
        } catch (error) {
            console.warn('Remote delete failed, removing local cache only:', error);
        }
        setClients(prev => prev.filter(c => c.clientId !== client.clientId));
        showToast(`Deleted client ${client.name}`, 'success');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#080808' }}>
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

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-start' }}>
                    <div style={{ flex: '1 1 300px', maxWidth: '400px', background: '#111', padding: '24px', borderRadius: '16px', border: '1px solid #1a1a1a' }}>
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
                                {submitStage === 'saving' ? 'Saving to Firebase...' : submitStage === 'inviting' ? 'Sending invite...' : '+ Add Client & Send Invite'}
                            </button>
                        </form>
                    </div>

                    <div style={{ flex: '2 1 600px', minWidth: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: 0 }}>
                                Clients Directory
                                <span style={{ marginLeft: '10px', color: '#555', fontWeight: '400', fontSize: '14px' }}>({filteredClients.length} total)</span>
                            </h2>
                            <input 
                                type="text"
                                placeholder="Search by name, phone or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '10px 14px', background: '#111', border: '1px solid #333', 
                                    borderRadius: '8px', color: '#fff', outline: 'none', width: '100%', maxWidth: '300px',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                        <AdminClientTable clients={filteredClients} onViewPlan={(c) => { setSelectedClient(c); setActiveTab('workout'); }} onDeleteClient={handleDeleteClient} />
                    </div>
                </div>
            </main>

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
                            </div>
                            <button onClick={() => setSelectedClient(null)} style={{ background: '#2a2a2a', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' }}>x</button>
                        </div>
                        
                        <div style={{ display: 'flex', borderBottom: '1px solid #222', background: '#1a1a1a' }}>
                            <button
                                onClick={() => setActiveTab('workout')}
                                style={{
                                    flex: 1, padding: '16px', background: 'transparent', border: 'none',
                                    borderBottom: activeTab === 'workout' ? '2px solid #FF5C1A' : '2px solid transparent',
                                    color: activeTab === 'workout' ? '#fff' : '#888', fontWeight: activeTab === 'workout' ? '700' : '500',
                                    cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s'
                                }}
                            >
                                Workout Plan
                            </button>
                            <button
                                onClick={() => setActiveTab('diet')}
                                style={{
                                    flex: 1, padding: '16px', background: 'transparent', border: 'none',
                                    borderBottom: activeTab === 'diet' ? '2px solid #FF5C1A' : '2px solid transparent',
                                    color: activeTab === 'diet' ? '#fff' : '#888', fontWeight: activeTab === 'diet' ? '700' : '500',
                                    cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s'
                                }}
                            >
                                Diet Plan
                            </button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: '#ccc', lineHeight: '1.6' }}>
                            {activeTab === 'workout' ? (
                                selectedClient.workoutPlan ? (
                                    <div>
                                        <p style={{ color: '#FF5C1A', fontWeight: '700' }}>{selectedClient.workoutPlan.greeting}</p>
                                        <p style={{ color: '#888' }}>{selectedClient.workoutPlan.overview}</p>
                                        {selectedClient.workoutPlan.days?.map((d, i) => (
                                            <div key={i} style={{ marginBottom: '16px', background: '#1a1a1a', padding: '12px', borderRadius: '8px' }}>
                                                <strong style={{ color: '#fff' }}>{d.day} - {d.muscle}</strong>
                                                <ul style={{ margin: '8px 0 0', color: '#888', paddingLeft: '20px' }}>
                                                    {d.exercises?.map((ex, j) => (
                                                        <li key={j} style={{ marginBottom: '4px' }}>
                                                            <span style={{ 
                                                                color: ex.phase === 'warmup' ? '#fbbf24' : ex.phase === 'cooldown' ? '#60a5fa' : ex.phase === 'core' ? '#f87171' : '#a3e635', 
                                                                marginRight: '8px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' 
                                                            }}>
                                                                [{ex.phase || 'main'}]
                                                            </span>
                                                            {ex.name} - {ex.sets} sets x {ex.reps} reps
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No Workout Plan generated yet.</p>
                                )
                            ) : (
                                selectedClient.dietPlan ? (
                                    <div dangerouslySetInnerHTML={{ __html: selectedClient.dietPlan }} />
                                ) : (
                                    <p>No Diet Plan generated yet.</p>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
