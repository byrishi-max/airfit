import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Dumbbell, Flame, LogOut, RefreshCcw, Utensils } from 'lucide-react';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import Questionnaire from '../components/Questionnaire';
import { getCurrentRepeatWeek } from '../utils/progressRepository';

export default function ClientDashboard() {
    const { client, logout } = useClientAuth();
    const navigate = useNavigate();
    const { planStatus, workoutPlan, dietPlan, workoutGeneratedAt } = useClientPlan(client?.clientId);
    const [activeForm, setActiveForm] = useState(null);
    const repeatWeek = getCurrentRepeatWeek(workoutGeneratedAt);

    const handleLogout = () => {
        logout();
        navigate('/client/login');
    };

    if (!client) return null;

    if (activeForm) {
        return (
            <div className="fit-app-shell">
                <header className="fit-topbar">
                    <button className="fit-icon-button" onClick={() => setActiveForm(null)} aria-label="Back to home">
                        <RefreshCcw size={18} />
                    </button>
                    <div>
                        <p className="fit-kicker">AIRFIT HOME</p>
                        <h1>{activeForm}</h1>
                    </div>
                    <button className="fit-icon-button" onClick={handleLogout} aria-label="Logout">
                        <LogOut size={18} />
                    </button>
                </header>
                <main className="fit-dashboard fit-home-main">
                    <Questionnaire
                        planType={activeForm}
                        client={client}
                        onCancel={() => setActiveForm(null)}
                    />
                </main>
            </div>
        );
    }

    const hasWorkout = Boolean(workoutPlan?.days?.length || client.workoutPlan);
    const hasDiet = Boolean(dietPlan || client.dietPlan);
    const isPending = planStatus === 'pending';

    const cards = [
        {
            title: hasWorkout ? 'View Workout Plan' : 'Generate Workout Plan',
            text: hasWorkout
                ? `Continue your one-week template. Current monthly repeat: Week ${repeatWeek} of 4.`
                : 'Create a personalised 7-day training template with video demos.',
            icon: Dumbbell,
            action: () => hasWorkout ? navigate('/client/plan') : setActiveForm('Workout Plan'),
            tone: 'primary',
        },
        {
            title: 'Progress & Analytics',
            text: 'Review completion, streak, calories, and monthly training progress.',
            icon: Activity,
            action: () => navigate('/client/progress'),
        },
        {
            title: hasDiet ? 'View Diet Plan' : 'Generate Diet Plan',
            text: hasDiet ? 'Open your nutrition targets and meal plan.' : 'Generate macros and a 7-day meal structure.',
            icon: Utensils,
            action: () => hasDiet ? navigate('/client/plan?tab=diet') : setActiveForm('Diet Plan'),
        },
        {
            title: 'Calorie Log',
            text: 'Track today’s intake and keep nutrition aligned with your goal.',
            icon: Flame,
            action: () => navigate('/client/plan?tab=calories'),
        },
    ];

    return (
        <div className="fit-app-shell">
            <header className="fit-topbar">
                <div className="fit-home-avatar" aria-hidden="true">
                    {client.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                    <p className="fit-kicker">AIRFIT HOME</p>
                    <h1>Hi, {client.name?.split(' ')[0] || 'Athlete'}</h1>
                </div>
                <button className="fit-icon-button" onClick={handleLogout} aria-label="Logout">
                    <LogOut size={18} />
                </button>
            </header>

            <main className="fit-dashboard fit-home-main">
                {isPending && (
                    <section className="fit-home-status">
                        <strong>Plan generation in progress</strong>
                        <span>Your plan is still processing. You can check the waiting screen any time.</span>
                        <button onClick={() => navigate('/client/waiting')}>Check Status</button>
                    </section>
                )}

                <section className="fit-home-hero">
                    <p className="fit-kicker">Dashboard</p>
                    <h2>Your fitness control center</h2>
                    <p>
                        Access the workout loop, nutrition, calorie tracking, and monthly analytics from one place.
                    </p>
                </section>

                <section className="fit-home-grid" aria-label="Client dashboard actions">
                    {cards.map(card => {
                        const Icon = card.icon;
                        return (
                            <button
                                key={card.title}
                                className={`fit-home-card ${card.tone === 'primary' ? 'is-primary' : ''}`}
                                onClick={card.action}
                            >
                                <span className="fit-home-card-icon"><Icon size={22} /></span>
                                <strong>{card.title}</strong>
                                <small>{card.text}</small>
                            </button>
                        );
                    })}
                </section>
            </main>
        </div>
    );
}
