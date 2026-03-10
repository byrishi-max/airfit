import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';

import WeeklyChart from '../components/WeeklyBarChart';

export default function ProgressDashboard() {
    const { client } = useClientAuth();
    const { workoutPlan } = useClientPlan(client?.clientId);
    const navigate = useNavigate();
    const [week, setWeek] = useState(1);

    if (!client || !workoutPlan) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', background: '#080808', color: '#fff', minHeight: '100vh' }}>
                <p>No plan found.</p>
                <button onClick={() => navigate('/client/dashboard')} style={{ padding: '10px 20px', marginTop: '20px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE8', paddingBottom: '80px' }}>
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(26,26,26,0.5)',
                backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/client/plan')} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}>
                        ← Plan
                    </button>
                    <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: '16px', fontWeight: '700', margin: 0 }}>Progress</h1>
                </div>
            </header>

            <main style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>
                <div style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', color: '#FF5C1A', marginBottom: '8px' }}>TRACK YOUR GAINS</div>
                    <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '32px', fontWeight: '800', lineHeight: 1.1, margin: 0 }}>Dashboard</h2>
                </div>

                {/* Week Selector */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', maxWidth: '400px' }}>
                    {[1, 2, 3, 4].map(w => (
                        <button key={w} onClick={() => setWeek(w)} style={{
                            flex: 1, padding: '10px 0', borderRadius: '8px',
                            background: week === w ? '#FF5C1A' : '#111',
                            border: `1px solid ${week === w ? '#FF5C1A' : '#1a1a1a'}`,
                            color: week === w ? '#fff' : '#666',
                            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            transition: 'all 0.2s', boxShadow: week === w ? '0 4px 16px rgba(255,92,26,0.3)' : 'none'
                        }}>
                            Week {w}
                        </button>
                    ))}
                </div>

                <WeeklyChart clientId={client.clientId} weekNumber={week} workoutJson={workoutPlan} />
            </main>
        </div>
    );
}
