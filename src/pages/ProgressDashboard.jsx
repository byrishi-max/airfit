import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import { getProgress } from '../utils/storage';
import { Helmet } from 'react-helmet-async';

import WeeklyChart from '../components/WeeklyBarChart';
import CalorieTracker from '../components/CalorieTracker';

export default function ProgressDashboard() {
    const { client } = useClientAuth();
    const { workoutPlan } = useClientPlan(client?.clientId);
    const navigate = useNavigate();
    const [week, setWeek] = useState(1);
    const [stats, setStats] = useState({ total: 0, done: 0, streak: 0 });

    useEffect(() => {
        if (workoutPlan && client) {
            let total = 0;
            let done = 0;
            workoutPlan.days.forEach(day => {
                day.exercises.forEach(ex => {
                    total++;
                    if (getProgress(client.clientId, week, day.day, ex.name)) {
                        done++;
                    }
                });
            });
            setStats({ total, done, streak: 5 }); // Streak mocked for now
        }
    }, [workoutPlan, client, week]);

    if (!client || !workoutPlan) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', background: '#080808', color: '#fff', minHeight: '100vh' }}>
                <p>Loading your profile...</p>
                <button onClick={() => navigate('/client/dashboard')} style={{ padding: '10px 20px', marginTop: '20px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Dashboard</button>
            </div>
        );
    }

    const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE8', paddingBottom: '100px' }}>
            <Helmet>
                <title>My Progress | AirFit</title>
                <meta name="description" content="Track your workout completion and calorie intake on AirFit." />
            </Helmet>

            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,10,0.8)',
                backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/client/plan')} style={{ 
                        background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', 
                        cursor: 'pointer', padding: '8px 12px', borderRadius: '12px', fontSize: '13px' 
                    }}>
                        ← Plan
                    </button>
                    <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: '14px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Progress Tracker</h1>
                </div>
            </header>

            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
                <section style={{ marginBottom: '48px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: '#FF5C1A', marginBottom: '12px' }}>EVOLUTION</div>
                    <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '40px', fontWeight: '800', lineHeight: 1, margin: '0 0 32px 0' }}>Performance Insight</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                        <div style={{ background: '#111', padding: '24px', borderRadius: '20px', border: '1px solid #1a1a1a' }}>
                            <div style={{ color: '#666', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>Completion</div>
                            <div style={{ fontSize: '32px', fontWeight: '900', color: completionRate === 100 ? '#22c55e' : '#fff' }}>{completionRate}%</div>
                            <div style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>Week {week} Progress</div>
                        </div>
                        <div style={{ background: '#111', padding: '24px', borderRadius: '20px', border: '1px solid #1a1a1a' }}>
                            <div style={{ color: '#666', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>Exercises</div>
                            <div style={{ fontSize: '32px', fontWeight: '900', color: '#FF5C1A' }}>{stats.done}<span style={{ fontSize: '16px', color: '#444', fontWeight: '600' }}>/{stats.total}</span></div>
                            <div style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>Total this week</div>
                        </div>
                        <div style={{ background: '#111', padding: '24px', borderRadius: '20px', border: '1px solid #1a1a1a' }}>
                            <div style={{ color: '#666', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>Current Streak</div>
                            <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>{stats.streak} <span style={{ fontSize: '16px', color: '#444' }}>Days</span></div>
                            <div style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>Keep it up!</div>
                        </div>
                    </div>
                </section>

                {/* Week Selector */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {[1, 2, 3, 4].map(w => (
                        <button key={w} onClick={() => setWeek(w)} style={{
                            padding: '12px 24px', borderRadius: '12px', minWidth: '100px',
                            background: week === w ? '#FF5C1A' : '#111',
                            border: `1px solid ${week === w ? '#FF5C1A' : '#1a1a1a'}`,
                            color: week === w ? '#fff' : '#666',
                            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: week === w ? '0 8px 24px rgba(255,92,26,0.3)' : 'none'
                        }}>
                            Week {w}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    <div>
                        <h3 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#444', marginBottom: '20px' }}>Daily Completion</h3>
                        <WeeklyChart clientId={client.clientId} weekNumber={week} workoutJson={workoutPlan} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#444', marginBottom: '20px' }}>Nutrition Log</h3>
                        <CalorieTracker clientId={client.clientId} />
                    </div>
                </div>

                <section style={{ marginTop: '64px', background: 'linear-gradient(135deg, #111 0%, #050505 100%)', padding: '32px', borderRadius: '24px', border: '1px solid #1a1a1a' }}>
                    <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>Pro Tip for Week {week}</h3>
                    <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                        {week === 1 ? "Focus on perfecting your form rather than heavy weights. Foundation is everything." : 
                         week === 2 ? "Maintain consistent hydration throughout the day. Your recovery depends on it." :
                         week === 3 ? "Intensity is key this week. Minimize rest periods to keep your heart rate up." :
                         "Listen to your body. If you feel any sharp pain, scale back. Consistency beats ego."}
                    </p>
                </section>
            </main>
        </div>
    );
}
