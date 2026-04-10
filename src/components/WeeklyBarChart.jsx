import React, { useMemo } from 'react';
import { getProgress } from '../utils/storage';

const STANDARD_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeeklyChart({ clientId, weekNumber, workoutJson }) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const data = useMemo(() => {
        if (!workoutJson || !workoutJson.days) return [];

        return STANDARD_DAYS.map(dayName => {
            const dayPlan = workoutJson.days.find(d => 
                d.day.toLowerCase() === dayName.toLowerCase() || 
                (dayName === 'Monday' && d.day.toLowerCase() === 'day 1') ||
                (dayName === 'Tuesday' && d.day.toLowerCase() === 'day 2') ||
                (dayName === 'Wednesday' && d.day.toLowerCase() === 'day 3') ||
                (dayName === 'Thursday' && d.day.toLowerCase() === 'day 4') ||
                (dayName === 'Friday' && d.day.toLowerCase() === 'day 5') ||
                (dayName === 'Saturday' && d.day.toLowerCase() === 'day 6') ||
                (dayName === 'Sunday' && d.day.toLowerCase() === 'day 7')
            );
            
            const exs = dayPlan?.exercises || [];
            if (exs.length === 0) return { name: dayName, total: 0, done: 0, percent: 0, isRest: true };

            const done = exs.filter(ex => getProgress(clientId, weekNumber, dayName, ex.name)).length;
            const percent = Math.round((done / exs.length) * 100);

            return { name: dayName, total: exs.length, done, percent, isRest: false };
        });
    }, [clientId, weekNumber, workoutJson]);

    const totalDone = data.reduce((a, b) => a + b.done, 0);
    const totalExs = data.reduce((a, b) => a + b.total, 0);
    const totalPct = totalExs > 0 ? Math.round((totalDone / totalExs) * 100) : 0;

    return (
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: '#111', borderRadius: '12px', padding: '16px', border: '1px solid #1a1a1a' }}>
                    <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '4px' }}>Completion</div>
                    <div style={{ color: '#fff', fontSize: '20px', fontWeight: '800' }}>{totalPct}%</div>
                </div>
                <div style={{ background: '#111', borderRadius: '12px', padding: '16px', border: '1px solid #1a1a1a' }}>
                    <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '4px' }}>Total Exercises</div>
                    <div style={{ color: '#FF5C1A', fontSize: '20px', fontWeight: '800' }}>{totalDone} / {totalExs}</div>
                </div>
            </div>

            <div style={{ 
                background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', 
                padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' 
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', gap: '8px' }}>
                    {data.map((d, i) => {
                        const isToday = d.name === today;
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                    <div style={{ 
                                        width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', 
                                        position: 'relative', border: isToday ? '1px solid rgba(255, 92, 26, 0.4)' : '1px solid #111'
                                    }}>
                                        {!d.isRest && d.percent > 0 && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0, height: `${d.percent}%`,
                                                background: d.percent === 100 ? '#22c55e' : 'linear-gradient(to top, #FF5C1A, #ff8c42)',
                                                borderRadius: '2px', transition: 'height 0.8s ease-out',
                                            }} />
                                        )}
                                        {d.isRest && (
                                            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', background: '#333', borderRadius: '50%' }} />
                                        )}
                                    </div>
                                </div>
                                <span style={{ 
                                    fontSize: '9px', color: isToday ? '#FF5C1A' : '#444', fontWeight: isToday ? '800' : '600', 
                                    textTransform: 'uppercase' 
                                }}>
                                    {d.name.substring(0, 3)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
