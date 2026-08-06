import React from 'react';

export default function AdminClientTable({ clients, onViewPlan, onDeleteClient }) {
    if (!clients || clients.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', background: '#111', borderRadius: '12px', border: '1px dashed #333' }}>
                <p style={{ color: '#888' }}>No clients found.</p>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'none':
                return <span style={{ padding: '4px 10px', borderRadius: '100px', background: '#2a2a2a', color: '#888', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>No Plan</span>;
            case 'pending':
                return <span style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontSize: '11px', fontWeight: '600', border: '1px solid rgba(234, 179, 8, 0.2)', whiteSpace: 'nowrap' }}>Generating...</span>;
            case 'ready':
                return <span style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '11px', fontWeight: '600', border: '1px solid rgba(34, 197, 94, 0.2)', whiteSpace: 'nowrap' }}>Plan Ready</span>;
            default:
                return <span style={{ padding: '4px 10px', borderRadius: '100px', background: '#2a2a2a', color: '#888', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>Unknown</span>;
        }
    };

    return (
        <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#111', borderRadius: '12px', overflow: 'hidden' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #222' }}>
                        <th style={{ padding: '16px 20px', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', width: '40px', whiteSpace: 'nowrap' }}>#</th>
                        <th style={{ padding: '16px 20px', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>Name</th>
                        <th style={{ padding: '16px 20px', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>Phone</th>
                        <th style={{ padding: '16px 20px', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>Email</th>
                        <th style={{ padding: '16px 20px', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>Plan Status</th>
                        <th style={{ padding: '16px 20px', fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map((c, index) => (
                        <tr key={c.clientId} style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td style={{ padding: '16px 20px', fontSize: '14px', color: '#666', fontWeight: '600', whiteSpace: 'nowrap' }}>{index + 1}</td>
                            <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>{c.name}</td>
                            <td style={{ padding: '16px 20px', fontSize: '14px', color: '#ccc', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.phone}</td>
                            <td style={{ padding: '16px 20px', fontSize: '14px', color: '#888', whiteSpace: 'nowrap' }}>{c.email}</td>
                            <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>{getStatusBadge(c.planStatus)}</td>
                            <td style={{ padding: '16px 20px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                {c.planStatus === 'ready' ? (
                                    <button
                                        onClick={() => onViewPlan(c)}
                                        style={{
                                            background: '#1a1a1a', border: '1px solid #333', color: '#fff',
                                            padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = '#FF5C1A'; e.currentTarget.style.color = '#FF5C1A'; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                                    >
                                        View Plan
                                    </button>
                                ) : (
                                    <span style={{ color: '#555', fontSize: '12px', marginRight: '8px' }}>—</span>
                                )}
                                <button
                                    onClick={() => onDeleteClient && onDeleteClient(c)}
                                    style={{
                                        background: '#1a1a1a', border: '1px solid #333', color: '#ef4444',
                                        padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                        cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = '#1a1a1a'; }}
                                    title="Delete Client"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
