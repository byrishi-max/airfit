import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import DayTabs from '../components/DayTabs';
import ExerciseCard from '../components/ExerciseCard';
import ProgressBar from '../components/ProgressBar';

export default function WorkoutPlanView() {
    const { client } = useClientAuth();
    const { workoutPlan } = useClientPlan(client?.clientId);
    const navigate = useNavigate();

    const [week, setWeek] = useState(1);
    const [activeDay, setActiveDay] = useState('Monday');

    if (!client || !workoutPlan) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', background: '#080808', color: '#fff', minHeight: '100vh' }}>
                <p>No plan found. Redirecting...</p>
                <button onClick={() => navigate('/client/dashboard')} style={{ padding: '10px 20px', marginTop: '20px', background: '#333' }}>Back to Dashboard</button>
            </div>
        );
    }

    const days = workoutPlan.days || [];
    const currentDayPlan = days.find(d => d.day === activeDay);
    const exercises = currentDayPlan?.exercises || [];

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE8', paddingBottom: '80px' }}>

            {/* Top Nav */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(26,26,26,0.5)',
                backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/client/dashboard')} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}>
                        ← Back
                    </button>
                    <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: '16px', fontWeight: '700', margin: 0 }}>My Plan</h1>
                </div>
                <Link to="/client/progress" style={{
                    background: 'rgba(255, 92, 26, 0.1)', color: '#FF5C1A', textDecoration: 'none',
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700'
                }}>
                    📊 Progress
                </Link>
            </header>

            <main style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>

                {/* Header Section */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', color: '#FF5C1A', marginBottom: '8px' }}>
                        6-DAY WORKOUT PLAN
                    </div>
                    <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '28px', fontWeight: '800', lineHeight: 1.1, marginBottom: '16px' }}>
                        {workoutPlan.greeting || `Let's go, ${client.name.split(' ')[0]}!`}
                    </h2>
                    <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>
                        {workoutPlan.overview || 'Here is your personalized training program.'}
                    </p>
                </div>

                {/* Week Selector */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {[1, 2, 3, 4].map(w => (
                        <button key={w} onClick={() => setWeek(w)} style={{
                            flex: 1, padding: '10px 0', borderRadius: '8px',
                            background: week === w ? '#2a2a2a' : '#111',
                            border: `1px solid ${week === w ? '#444' : '#1a1a1a'}`,
                            color: week === w ? '#fff' : '#666',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                        }}>
                            Week {w}
                        </button>
                    ))}
                </div>

                {/* Day Tabs */}
                <DayTabs days={days} activeDay={activeDay} onChange={setActiveDay} />

                {/* Content Area */}
                {exercises.length > 0 ? (
                    <div style={{ animation: 'fadeUp 0.3s ease both' }} key={activeDay}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: '20px', fontWeight: '700' }}>
                                {currentDayPlan.muscle || 'Training Day'}
                            </h3>
                        </div>

                        <ProgressBar clientId={client.clientId} weekNumber={week} day={activeDay} exercises={exercises} />

                        <div style={{ marginTop: '24px' }}>
                            {exercises.map((ex, i) => (
                                <ExerciseCard
                                    key={i}
                                    exercise={ex}
                                    clientId={client.clientId}
                                    weekNumber={week}
                                    day={activeDay}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#111', borderRadius: '12px', border: '1px dashed #333' }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🛌</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Rest & Recovery Day</h3>
                        <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>
                            Take time to recover today. Drink plenty of water, stretch, and get 8 hours of sleep.
                        </p>
                    </div>
                )}

            </main>
        </div>
    );
}
