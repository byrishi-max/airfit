import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getProgress } from '../utils/storage';

export default function WeeklyChart({ clientId, weekNumber, workoutJson }) {
    const days = workoutJson?.days || [];

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const data = weekDays.map(dayName => {
        const dayPlan = days.find(d => d.day === dayName);
        const exs = dayPlan?.exercises || [];

        const done = exs.filter(ex => getProgress(clientId, weekNumber, dayName, ex.name)).length;
        const total = exs.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return { day: dayName.slice(0, 3).toUpperCase(), done, total, pct };
    });

    const totalDone = data.reduce((a, d) => a + d.done, 0);
    const totalExs = data.reduce((a, d) => a + d.total, 0);
    const totalPct = totalExs > 0 ? Math.round((totalDone / totalExs) * 100) : 0;
    const streak = (() => {
        let s = 0;
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i].pct === 100) s++; else break;
        }
        return s;
    })();
    const bestDay = data.reduce((a, d) => d.done > a.done ? d : a, data[0]);

    const getColor = pct => {
        if (pct === 100) return '#22c55e';
        if (pct >= 50) return '#FF5C1A';
        return '#2a2a2a';
    };

    return (
        <div>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                    { label: 'Done This Week', value: `${totalDone} / ${totalExs}`, color: '#FF5C1A' },
                    { label: 'Completion', value: `${totalPct}%`, color: totalPct === 100 ? '#22c55e' : '#FF5C1A' },
                    { label: 'Current Streak', value: `${streak} days 🔥`, color: '#ff8c42' },
                    { label: 'Best Day', value: bestDay?.day || '—', color: '#4488ff' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: '#111', borderRadius: '12px', padding: '20px', border: '1px solid #1a1a1a' }}>
                        <div style={{ color: '#555', fontSize: '11px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>{label}</div>
                        <div style={{ color, fontSize: '24px', fontWeight: '800', fontFamily: "'Sora', sans-serif" }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Bar chart */}
            <div style={{ background: '#111', borderRadius: '12px', padding: '24px', border: '1px solid #1a1a1a' }}>
                <p style={{ color: '#888', fontSize: '12px', fontWeight: '700', margin: '0 0 20px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    📊 This Week's Progress
                </p>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data} barSize={32} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
                        <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 11, fontWeight: '600' }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div style={{ background: '#080808', border: '1px solid rgba(255,92,26,0.3)', padding: '10px 14px', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                                            {d.done} / {d.total} exercises
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                            {data.map((entry, i) => (
                                <Cell key={i} fill={getColor(entry.pct)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'center' }}>
                    {[['#22c55e', 'Complete'], ['#FF5C1A', 'In Progress'], ['#2a2a2a', 'Not Started']].map(([c, l]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: c }} />
                            <span style={{ color: '#555', fontSize: '11px' }}>{l}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
