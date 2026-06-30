import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminClientTable from '../components/AdminClientTable';
import { useAdminAuth } from '../hooks/useAuth';
import { createClientRecord, deleteClientRecord, listClients } from '../utils/clientRepository';
import { sendPortalInvite } from '../utils/inviteClient';
import { deleteClient } from '../utils/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, LogOut, Activity, Clock, CheckCircle2, AlertCircle, X, Mail, Dumbbell } from 'lucide-react';

const spring = { duration: 0.5, ease: [0.16, 1, 0.3, 1] };

function MetricCard({ icon: Icon, label, value, accent, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay }}
            style={{
                padding: '20px', borderRadius: '18px',
                background: 'rgba(14, 14, 18, 0.88)', border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)', display: 'grid', gap: '12px',
                transition: 'border-color 220ms, box-shadow 220ms, transform 220ms',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: accent === 'green' ? 'rgba(34,197,94,0.1)' : accent === 'yellow' ? 'rgba(234,179,8,0.1)' : 'rgba(255,94,0,0.1)',
                display: 'grid', placeItems: 'center',
                color: accent === 'green' ? '#22c55e' : accent === 'yellow' ? '#eab308' : '#ff5e00',
            }}>
                <Icon size={20} strokeWidth={2} />
            </div>
            <small style={{ color: '#a1a1aa', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</small>
            <strong style={{ color: '#f4f4f5', fontSize: '28px', fontWeight: '900', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</strong>
        </motion.div>
    );
}

export default function AdminDashboard() {
    const { logout } = useAdminAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [toast, setToast] = useState({ msg: '', type: 'success' });
    const [selectedClient, setSelectedClient] = useState(null);
    const [inviteSending, setInviteSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setIsLoading(true);
        try {
            const list = await listClients();
            const deletedIds = JSON.parse(localStorage.getItem('deleted_clients') || '[]');
            setClients(list.filter(c => !deletedIds.includes(c.clientId)));
        } catch (error) {
            console.warn('Could not load clients:', error);
            setClients([]);
        }
        setIsLoading(false);
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
        let newClient;

        try {
            newClient = await createClientRecord({
                name: clientName,
                email: clientEmail,
                phone: clientPhone,
            });
        } catch (error) {
            setInviteSending(false);
            showToast(error.message || 'Could not add client. Please try again.', 'warning');
            return;
        }

        setClients(prev => [...prev, newClient]);
        setForm({ name: '', email: '', phone: '' });

        const sent = await sendPortalInvite({ name: clientName, email: clientEmail, phone: clientPhone });
        setInviteSending(false);

        if (sent) {
            showToast(`Client added. Invite sent to ${clientEmail}. Login phone: ${clientPhone}`, 'success');
        } else {
            showToast(`Client added. Invite email failed; send manually. Login phone: ${clientPhone}`, 'warning');
        }
    };

    const handleDeleteClient = async (client) => {
        if (!window.confirm(`Are you sure you want to delete ${client.name}?`)) return;
        try {
            await deleteClientRecord(client.clientId);
        } catch (error) {
            console.warn('Remote delete failed, removing local cache only:', error);
        }
        deleteClient(client.clientId);
        setClients(prev => prev.filter(c => c.clientId !== client.clientId));
        showToast(`Deleted client ${client.name}`, 'success');
    };

    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return clients;
        const q = searchQuery.toLowerCase();
        return clients.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.phone || '').includes(q)
        );
    }, [clients, searchQuery]);

    const stats = useMemo(() => ({
        total: clients.length,
        withPlans: clients.filter(c => c.planStatus === 'ready' || c.workoutPlan || c.dietPlan).length,
        pending: clients.filter(c => c.planStatus === 'pending').length,
        noPlan: clients.filter(c => c.planStatus === 'none' && !c.workoutPlan && !c.dietPlan).length,
    }), [clients]);

    const inputStyle = {
        width: '100%', padding: '13px 14px',
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', color: '#f4f4f5', outline: 'none',
        fontFamily: 'inherit', fontSize: '14px',
        transition: 'border-color 220ms, box-shadow 220ms',
    };

    return (
        <div style={{ minHeight: '100vh', background: '#060608' }}>
            {/* ─── Header ─────────────────────────────── */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(6,6,8,0.82)', backdropFilter: 'blur(20px)',
                position: 'sticky', top: 0, zIndex: 20,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'rgba(255,94,0,0.1)', display: 'grid', placeItems: 'center',
                    }}>
                        <Dumbbell size={20} color="#ff5e00" />
                    </div>
                    <div>
                        <div style={{
                            fontFamily: "'Sora', sans-serif", fontSize: '18px', fontWeight: '800',
                            letterSpacing: '-0.02em', color: '#f4f4f5'
                        }}>
                            AIR<em style={{ color: '#ff5e00', fontStyle: 'normal' }}>FIT</em>
                        </div>
                        <span style={{
                            fontSize: '10px', fontWeight: '700', color: '#52525b',
                            textTransform: 'uppercase', letterSpacing: '1px',
                        }}>Admin Console</span>
                    </div>
                </div>
                <button onClick={handleLogout} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    color: '#a1a1aa', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 220ms',
                }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#a1a1aa'; }}
                >
                    <LogOut size={15} /> Sign Out
                </button>
            </header>

            <main style={{ padding: '28px 24px', maxWidth: '1280px', margin: '0 auto' }}>
                {/* ─── Toast ──────────────────────────── */}
                <AnimatePresence>
                    {toast.msg && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            style={{
                                background: toast.type === 'warning' ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)',
                                border: `1px solid ${toast.type === 'warning' ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                color: toast.type === 'warning' ? '#eab308' : '#22c55e',
                                padding: '14px 16px', borderRadius: '14px', marginBottom: '24px',
                                fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
                            }}
                        >
                            {toast.type === 'warning' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                            <span style={{ flex: 1 }}>{toast.msg}</span>
                            <button onClick={() => setToast({ msg: '', type: 'success' })} style={{
                                background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px',
                            }}><X size={14} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── Analytics Strip ─────────────────── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px', marginBottom: '28px',
                }}>
                    <MetricCard icon={Users} label="Total Clients" value={stats.total} accent="orange" delay={0} />
                    <MetricCard icon={CheckCircle2} label="Plans Ready" value={stats.withPlans} accent="green" delay={0.05} />
                    <MetricCard icon={Clock} label="Pending" value={stats.pending} accent="yellow" delay={0.1} />
                    <MetricCard icon={Activity} label="Awaiting Plans" value={stats.noPlan} accent="orange" delay={0.15} />
                </div>

                {/* ─── Main Grid ──────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '28px', alignItems: 'start' }}>
                    {/* ─── Add Client Form ────────────── */}
                    <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={spring}
                        style={{
                            background: 'rgba(14,14,18,0.88)', padding: '24px', borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '10px',
                                background: 'rgba(255,94,0,0.1)', display: 'grid', placeItems: 'center',
                            }}>
                                <UserPlus size={16} color="#ff5e00" />
                            </div>
                            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
                                Add Client
                            </h2>
                        </div>
                        <p style={{ color: '#52525b', fontSize: '12px', marginBottom: '20px', marginTop: '4px' }}>
                            Client receives a portal invite email with their login credentials.
                        </p>

                        <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {[
                                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. Rahul Sharma' },
                                { key: 'email', label: 'Email Address', type: 'email', placeholder: 'client@example.com' },
                                { key: 'phone', label: 'Phone (Login ID)', type: 'tel', placeholder: '9876543210' }
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{
                                        display: 'block', fontSize: '11px', color: '#52525b', marginBottom: '6px',
                                        fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                                    }}>{f.label}</label>
                                    <input
                                        required type={f.type} placeholder={f.placeholder}
                                        value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                        style={inputStyle}
                                        onFocus={e => { e.target.style.borderColor = 'rgba(255,94,0,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,94,0,0.08)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            ))}
                            <button type="submit" disabled={inviteSending} className="premium-button" style={{
                                marginTop: '6px', padding: '14px', borderRadius: '12px',
                                fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                opacity: inviteSending ? 0.6 : 1, cursor: inviteSending ? 'not-allowed' : 'pointer',
                            }}>
                                {inviteSending ? (
                                    <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Sending...</>
                                ) : (
                                    <><Mail size={16} /> Add Client & Send Invite</>
                                )}
                            </button>
                        </form>
                    </motion.div>

                    {/* ─── Client Directory ───────────── */}
                    <motion.div
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...spring, delay: 0.1 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
                                Client Directory
                                <span style={{ marginLeft: '10px', color: '#52525b', fontWeight: '400', fontSize: '14px' }}>
                                    ({filteredClients.length}{searchQuery ? ` of ${clients.length}` : ''})
                                </span>
                            </h2>
                            <div style={{ position: 'relative', minWidth: '220px' }}>
                                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        ...inputStyle, width: '100%', paddingLeft: '36px', fontSize: '13px',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = 'rgba(255,94,0,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,94,0,0.08)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="fit-skeleton-list" style={{ gap: '10px' }}>
                                {[...Array(4)].map((_, i) => (
                                    <span key={i} style={{
                                        height: '64px', borderRadius: '14px',
                                        background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
                                        backgroundSize: '200% 100%', animation: 'fit-shimmer 1.4s ease-in-out infinite',
                                    }} />
                                ))}
                            </div>
                        ) : (
                            <AdminClientTable
                                clients={filteredClients}
                                onViewPlan={(c) => setSelectedClient(c)}
                                onDeleteClient={handleDeleteClient}
                            />
                        )}
                    </motion.div>
                </div>
            </main>

            {/* ─── Plan Modal ─────────────────────── */}
            <AnimatePresence>
                {selectedClient && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(8px)', zIndex: 100,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
                        }}
                        onClick={() => setSelectedClient(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={spring}
                            style={{
                                background: '#0e0e12', width: '100%', maxWidth: '800px', height: '100%', maxHeight: '80vh',
                                borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{
                                padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '17px', color: '#f4f4f5', fontWeight: '800', letterSpacing: '-0.02em' }}>
                                        {selectedClient.name}'s Plan
                                    </h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#52525b' }}>
                                        {selectedClient.planType || 'Workout Plan'}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedClient(null)} style={{
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                    color: '#a1a1aa', width: '36px', height: '36px', borderRadius: '10px',
                                    cursor: 'pointer', display: 'grid', placeItems: 'center',
                                    transition: 'all 220ms',
                                }}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444'; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#a1a1aa'; }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: '#d4d4d8', lineHeight: '1.6' }}>
                                {selectedClient.workoutPlan ? (
                                    <div>
                                        <p style={{ color: '#ff5e00', fontWeight: '700', fontSize: '15px' }}>{selectedClient.workoutPlan.greeting}</p>
                                        <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>{selectedClient.workoutPlan.overview}</p>
                                        {selectedClient.workoutPlan.days?.map((d, i) => (
                                            <div key={i} style={{
                                                marginBottom: '12px', background: 'rgba(255,255,255,0.02)',
                                                padding: '14px 16px', borderRadius: '14px',
                                                border: '1px solid rgba(255,255,255,0.04)',
                                            }}>
                                                <strong style={{ color: '#f4f4f5', fontSize: '14px' }}>{d.day} — {d.muscle}</strong>
                                                {d.exercises?.length > 0 && (
                                                    <ul style={{ margin: '8px 0 0', color: '#a1a1aa', paddingLeft: '20px', fontSize: '13px' }}>
                                                        {d.exercises.map((ex, j) => (
                                                            <li key={j} style={{ marginBottom: '3px' }}>
                                                                {ex.name} — {ex.sets} sets × {ex.reps}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : selectedClient.dietPlan ? (
                                    <div dangerouslySetInnerHTML={{ __html: selectedClient.dietPlan }} />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#52525b' }}>
                                        <Activity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                        <p>No plan data available yet.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
