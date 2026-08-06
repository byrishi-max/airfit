import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { getCaloriesForDate, logCalories, deleteCalorieLog } from '../utils/progressRepository';

export default function CalorieTracker({ clientId }) {
    const [food, setFood] = useState('');
    const [calories, setCalories] = useState('');
    const [logs, setLogs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2500);
    };
    
    useEffect(() => {
        let cancelled = false;
        if (clientId) {
            getCaloriesForDate(clientId).then(nextLogs => {
                if (!cancelled) setLogs(nextLogs || []);
            }).catch(error => {
                console.warn('[AirFit] Failed to load calorie logs:', error);
            });
        }
        return () => { cancelled = true; };
    }, [clientId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!food || !calories || saving) return;
        setSaving(true);
        try {
            const nextLogs = await logCalories(clientId, food, parseInt(calories, 10));
            setLogs(nextLogs || []);
            setFood('');
            setCalories('');
            showToast('✅ Intake logged!');
        } catch (error) {
            console.warn('[AirFit] Failed to save calorie log:', error);
            showToast('❌ Failed to save intake', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (log) => {
        if (!log.docId || deleting) return;
        setDeleting(log.docId);
        try {
            await deleteCalorieLog(clientId, log.docId);
            setLogs(prev => prev.filter(l => l.docId !== log.docId));
            showToast('🗑️ Entry removed');
        } catch (error) {
            console.warn('[AirFit] Failed to delete calorie log:', error);
            showToast('❌ Failed to delete', 'error');
        } finally {
            setDeleting(null);
        }
    };

    const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeUp 0.5s ease both',
            position: 'relative'
        }}>
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, background: toast.type === 'error' ? '#c0392b' : '#27ae60',
                    color: '#fff', padding: '12px 24px', borderRadius: 12,
                    fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    animation: 'fadeUp 0.3s ease', whiteSpace: 'nowrap'
                }}>{toast.message}</div>
            )}
            <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 20, fontFamily: "'Sora', sans-serif" }}>Daily Calorie Tracker</h2>

            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Food name (e.g. Chicken breast)"
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: 200,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: '12px 16px',
                        color: '#fff',
                        outline: 'none',
                        fontFamily: 'inherit'
                    }}
                />
                <input
                    type="number"
                    placeholder="Calories"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    style={{
                        width: 120,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: '12px 16px',
                        color: '#fff',
                        outline: 'none',
                        fontFamily: 'inherit'
                    }}
                />
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        background: saving ? '#666' : '#FF5C1A',
                        color: '#000',
                        border: 'none',
                        borderRadius: 12,
                        padding: '12px 24px',
                        fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s',
                        fontFamily: "'Sora', sans-serif"
                    }}
                    onMouseEnter={(e) => { if (!saving) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {saving ? 'Saving...' : 'Add Intake'}
                </button>
            </form>

            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ color: '#ddd', fontSize: 18, margin: 0 }}>Today's Logs</h3>
                    <div style={{ color: '#FF5C1A', fontWeight: 700, fontSize: 20 }}>
                        {totalCalories} <span style={{ fontSize: 13, color: '#666', fontWeight: 400 }}>kcal total</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {logs.length === 0 ? (
                        <p style={{ color: '#666' }}>No calories logged yet today.</p>
                    ) : (
                        logs.map((log, i) => (
                            <div key={log.docId || i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.03)',
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'background 0.2s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            >
                                <div>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>{log.food}</span>
                                    <span style={{ color: '#666', fontSize: 12, marginLeft: 12 }}>{log.time}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ color: '#eee', fontWeight: 700 }}>{log.calories} kcal</span>
                                    {log.docId && (
                                        <button
                                            onClick={() => handleDelete(log)}
                                            disabled={deleting === log.docId}
                                            title="Delete entry"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: deleting === log.docId ? 'not-allowed' : 'pointer',
                                                color: deleting === log.docId ? '#555' : '#c0392b',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderRadius: 6,
                                                transition: 'color 0.2s',
                                                opacity: deleting === log.docId ? 0.4 : 1,
                                            }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
