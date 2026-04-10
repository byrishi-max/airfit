import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, saveClient } from '../../utils/storage';
import { sendPortalInvite } from '../../utils/inviteClient';
import { getAdminSession, clearSessions } from '../../utils/storage';
import { ENDPOINTS } from '../../utils/config';

function AdminDashboard() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [adding, setAdding] = useState(false);
  const [inviteStatus, setInviteStatus] = useState({}); // { [clientId]: 'sending'|'sent'|'error' }
  const navigate = useNavigate();

  useEffect(() => {
    if (!getAdminSession()) { navigate('/admin/login', { replace: true }); return; }
    refreshClients();
  }, []);

  const refreshClients = useCallback(async () => {
    // Pull local list first
    const local = getClients();
    setClients(local);

    // Optionally fetch from n8n store to sync statuses
    try {
      const res = await fetch(ENDPOINTS.GET_CLIENTS);
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote)) {
          remote.forEach(r => saveClient({ ...r }));
          setClients(getClients());
        }
      }
    } catch (e) {
      // Not fatal — fall back to local
    }
  }, []);

  const handleLogout = () => {
    clearSessions();
    navigate('/admin/login', { replace: true });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setAdding(true);

    const clientId = `af_${Date.now().toString(36)}`;
    const newClient = {
      clientId,
      name: form.name,
      phone: form.phone,
      email: form.email || '',
      planStatus: 'none',
      workoutPlan: null,
      dietPlan: null,
      registeredAt: new Date().toISOString(),
    };

    // Register in n8n Plan Store
    try {
      await fetch(ENDPOINTS.PLAN_READY.replace('airfit-plan-ready', 'airfit-register-client'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
    } catch (_) {}

    saveClient(newClient);
    setClients(getClients());
    setForm({ name: '', phone: '', email: '' });
    setAdding(false);

    // Auto-send invite if email provided
    if (form.email) {
      handleInvite(newClient);
    }
  };

  const handleInvite = async (client) => {
    setInviteStatus(s => ({ ...s, [client.clientId]: 'sending' }));
    const ok = await sendPortalInvite({ name: client.name, email: client.email, phone: client.phone });
    setInviteStatus(s => ({ ...s, [client.clientId]: ok ? 'sent' : 'error' }));
  };

  const statusColor = {
    none: '#555',
    pending: '#FF6B00',
    ready: '#22c55e',
    active: '#22c55e',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-1px' }}>AIRFIT<span style={{ color: '#FF6B00' }}>_</span></div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px' }}>Admin Portal</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
            Logout
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', fontStyle: 'italic', textTransform: 'uppercase', margin: 0 }}>
            Operations Hub<span style={{ color: '#FF6B00' }}>.</span>
          </h1>
          <p style={{ color: '#555', fontWeight: '600', marginTop: '8px' }}>Managing {clients.length} athletes</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
          {/* Add Client Form */}
          <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #1a1a1a', padding: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: '#FF6B00', margin: '0 0 24px' }}>Add New Client</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. Ravi Kumar', required: true },
                { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '9876543210', required: true },
                { key: 'email', label: 'Email (for invite)', type: 'email', placeholder: 'client@email.com', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#555', marginBottom: '8px' }}>
                    {f.label}{!f.required && <span style={{ color: '#333', marginLeft: '6px' }}>optional</span>}
                  </label>
                  <input
                    type={f.type} value={form[f.key]} placeholder={f.placeholder} required={f.required}
                    onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}
                    style={{ width: '100%', background: '#0a0a0a', border: '1.5px solid #1a1a1a', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <button type="submit" disabled={adding} style={{
                background: adding ? '#1a1a1a' : 'linear-gradient(135deg, #FF6B00, #ff4500)',
                border: 'none', borderRadius: '8px', padding: '14px', color: '#fff', fontSize: '14px',
                fontWeight: '800', cursor: adding ? 'not-allowed' : 'pointer', marginTop: '8px',
              }}>
                {adding ? 'Adding...' : '+ Add & Send Invite'}
              </button>
            </form>
          </div>

          {/* Client Table */}
          <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: '#fff' }}>Client Roster</h3>
              <button onClick={refreshClients} style={{ background: 'transparent', border: '1px solid #222', color: '#555', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>↻ Refresh</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0a0a0a' }}>
                    {['Client', 'Phone', 'Plan Status', 'Registered', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: '#444', borderBottom: '1px solid #1a1a1a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#333', fontSize: '14px' }}>No clients yet. Add your first athlete above.</td></tr>
                  )}
                  {clients.map(c => (
                    <tr key={c.clientId} style={{ borderBottom: '1px solid #111' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>ID: {c.clientId}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#666', fontSize: '14px' }}>{c.phone}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px', borderRadius: '20px',
                          fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px',
                          background: `${statusColor[c.planStatus] || '#555'}15`,
                          color: statusColor[c.planStatus] || '#555',
                          border: `1px solid ${statusColor[c.planStatus] || '#555'}30`,
                        }}>{c.planStatus || 'none'}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#444', fontSize: '12px' }}>
                        {c.registeredAt ? new Date(c.registeredAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {c.email ? (
                          <button
                            onClick={() => handleInvite(c)}
                            disabled={inviteStatus[c.clientId] === 'sending'}
                            style={{
                              background: inviteStatus[c.clientId] === 'sent' ? '#22c55e15' : 'transparent',
                              border: `1px solid ${inviteStatus[c.clientId] === 'sent' ? '#22c55e' : inviteStatus[c.clientId] === 'error' ? '#ef4444' : '#FF6B00'}`,
                              color: inviteStatus[c.clientId] === 'sent' ? '#22c55e' : inviteStatus[c.clientId] === 'error' ? '#ef4444' : '#FF6B00',
                              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                            }}
                          >
                            {inviteStatus[c.clientId] === 'sending' ? '...' : inviteStatus[c.clientId] === 'sent' ? '✓ Sent' : inviteStatus[c.clientId] === 'error' ? '✗ Failed' : 'Send Invite'}
                          </button>
                        ) : (
                          <span style={{ color: '#333', fontSize: '12px' }}>No email</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
