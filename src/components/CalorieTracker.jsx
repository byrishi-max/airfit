import React, { useState, useEffect } from 'react';
import { logDailyCalories, getDailyCalories } from '../utils/storage';

export default function CalorieTracker({ clientId }) {
    const [food, setFood] = useState('');
    const [calories, setCalories] = useState('');
    const [logs, setLogs] = useState([]);
    
    useEffect(() => {
        if (clientId) {
            setLogs(getDailyCalories(clientId));
        }
    }, [clientId]);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!food || !calories) return;
        
        logDailyCalories(clientId, food, parseInt(calories));
        setLogs(getDailyCalories(clientId));
        setFood('');
        setCalories('');
    };

    const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeUp 0.5s ease both'
        }}>
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
                    style={{
                        background: '#FF5C1A',
                        color: '#000',
                        border: 'none',
                        borderRadius: 12,
                        padding: '12px 24px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        fontFamily: "'Sora', sans-serif"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Add Intake
                </button>
            </form>

            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ color: '#ddd', fontSize: 18, margin: 0 }}>Today's Logs</h3>
                    <div style={{ color: '#FF5C1A', fontWeight: 700, fontSize: 20 }}>
                        {totalCalories} <span style={{ fontSize: 13, color: '#666', fontWeight: 400 }}>kcal total</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {logs.length === 0 ? (
                        <p style={{ color: '#666' }}>No calories logged yet today.</p>
                    ) : (
                        logs.slice().reverse().map((log, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.03)',
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>{log.food}</span>
                                    <span style={{ color: '#666', fontSize: 12, marginLeft: 12 }}>{log.time}</span>
                                </div>
                                <div style={{ color: '#eee', fontWeight: 700 }}>{log.calories} kcal</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
