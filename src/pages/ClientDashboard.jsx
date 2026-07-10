import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    CalendarCheck,
    CheckCircle2,
    Droplets,
    Dumbbell,
    Flame,
    LogOut,
    RefreshCcw,
    Scale,
    Target,
    Utensils,
} from 'lucide-react';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import Questionnaire from '../components/Questionnaire';
import { getCurrentRepeatWeek, getProgressSummary, logWater, logWeight } from '../utils/progressRepository';

const emptySummary = {
    unifiedPercent: 0,
    currentWeekDone: 0,
    currentWeekTotal: 0,
    todayCalories: 0,
    waterToday: 0,
    waterTarget: 3000,
    latestWeight: null,
    streak: 0,
    dietMealsCompleted: 0,
    dietMealTarget: 4,
    dietDoneToday: false,
};

export default function ClientDashboard() {
    const { client, logout } = useClientAuth();
    const navigate = useNavigate();
    const { planStatus, workoutStatus, dietStatus, workoutPlan, dietPlan, workoutGeneratedAt } = useClientPlan(client?.clientId);
    const [activeForm, setActiveForm] = useState(null);
    const [summary, setSummary] = useState(emptySummary);
    const [waterAmount, setWaterAmount] = useState('500');
    const [weightKg, setWeightKg] = useState('');
    const repeatWeek = getCurrentRepeatWeek(workoutGeneratedAt);

    useEffect(() => {
        let cancelled = false;
        async function loadSummary() {
            if (!client?.clientId) return;
            const nextSummary = await getProgressSummary(client.clientId, workoutPlan, workoutGeneratedAt).catch(() => emptySummary);
            if (!cancelled) setSummary(nextSummary);
        }
        loadSummary();
        return () => {
            cancelled = true;
        };
    }, [client?.clientId, workoutPlan, workoutGeneratedAt]);

    const handleLogout = () => {
        logout();
        navigate('/client/login');
    };

    const refreshSummary = async () => {
        if (!client?.clientId) return;
        const nextSummary = await getProgressSummary(client.clientId, workoutPlan, workoutGeneratedAt).catch(() => summary);
        setSummary(nextSummary);
    };

    const handleWaterLog = async () => {
        if (!client?.clientId || !waterAmount) return;
        await logWater(client.clientId, Number(waterAmount));
        await refreshSummary();
    };

    const handleWeightLog = async () => {
        if (!client?.clientId || !weightKg) return;
        await logWeight(client.clientId, Number(weightKg));
        setWeightKg('');
        await refreshSummary();
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
                        <p className="fit-kicker">AirFit home</p>
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
    const workoutLocked = hasWorkout || workoutStatus === 'pending' || workoutStatus === 'ready';
    const dietLocked = hasDiet || dietStatus === 'pending' || dietStatus === 'ready';
    const isPending = planStatus === 'pending';

    // Plan-locked card helper: renders when a plan already exists.
    const PlanExistsCard = ({ title, icon: Icon, navigateTo, tone }) => (
        <div
            className={`fit-home-card ${tone === 'primary' ? 'is-primary' : ''}`}
            style={{ pointerEvents: 'auto', cursor: 'default', opacity: 1 }}
        >
            <span className="fit-home-card-icon"><Icon size={22} /></span>
            <strong>{title}</strong>
            <small style={{ color: '#FF6B00', fontWeight: 600 }}>Plan already exists</small>
            <button
                onClick={() => navigate(navigateTo)}
                style={{
                    marginTop: '8px', padding: '8px 16px', borderRadius: '6px',
                    background: 'linear-gradient(135deg, #FF6B00, #ff4500)',
                    color: '#fff', fontSize: '12px', fontWeight: '700',
                    border: 'none', cursor: 'pointer', width: '100%'
                }}
            >
                View Plan
            </button>
        </div>
    );

    const cards = [
        // Workout card: locked when plan exists.
        ...(!workoutLocked ? [{
            title: 'Generate Workout',
            text: 'Generate your training template',
            icon: Dumbbell,
            action: () => setActiveForm('Workout Plan'),
            tone: 'primary',
            locked: false,
        }] : []),
        // Diet card: locked when plan exists.
        ...(!dietLocked ? [{
            title: 'Generate Diet Plan',
            text: 'Generate nutrition targets and meals',
            icon: Utensils,
            action: () => setActiveForm('Diet Plan'),
            locked: false,
        }] : []),
        {
            title: 'Progress & Analytics',
            text: `${summary.unifiedPercent || 0}% unified completion`,
            icon: Activity,
            action: () => navigate('/client/progress'),
        },
        {
            title: 'Calorie Log',
            text: `${summary.todayCalories || 0} kcal logged today`,
            icon: Flame,
            action: () => navigate('/client/plan?tab=calories'),
        },
    ];

    const metrics = [
        { label: 'Overall Progress', value: `${summary.unifiedPercent || 0}%`, detail: 'Workout + diet', icon: CheckCircle2 },
        { label: 'Weekly Progress', value: `${summary.currentWeekDone}/${summary.currentWeekTotal}`, detail: `Repeat week ${repeatWeek}`, icon: CalendarCheck },
        { label: 'Calories', value: summary.todayCalories || 0, detail: 'kcal today', icon: Flame },
        { label: 'Water Intake', value: `${Math.round((summary.waterToday || 0) / 100) / 10}L`, detail: `${summary.waterTarget || 3000} ml target`, icon: Droplets },
        { label: 'Weight Tracking', value: summary.latestWeight ? `${summary.latestWeight} kg` : 'Add', detail: 'Latest check-in', icon: Scale },
        { label: 'Streak Counter', value: summary.streak || 0, detail: 'completed days', icon: Target },
        { label: 'Goals', value: hasWorkout && hasDiet ? 'Active' : 'Setup', detail: hasWorkout && hasDiet ? 'Workout and diet ready' : 'Generate both plans', icon: Target },
    ];

    return (
        <div className="fit-app-shell">
            <header className="fit-topbar">
                <div className="fit-home-avatar" aria-hidden="true">
                    {client.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                    <p className="fit-kicker">AirFit home</p>
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

                <section className="fit-home-hero fit-premium-hero">
                    <p className="fit-kicker">Dashboard</p>
                    <h2>{summary.unifiedPercent || 0}% synced today</h2>
                    <p>
                        Workout, diet, calories, water, weight, streaks, goals, and tasks in one view.
                    </p>
                </section>

                <section className="fit-metric-strip" aria-label="Dashboard metrics">
                    {metrics.map(metric => {
                        const Icon = metric.icon;
                        return (
                            <article key={metric.label} className="fit-mini-metric">
                                <span><Icon size={17} /></span>
                                <small>{metric.label}</small>
                                <strong>{metric.value}</strong>
                                <em>{metric.detail}</em>
                            </article>
                        );
                    })}
                </section>

                <section className="fit-quick-grid" aria-label="Quick tracking">
                    <div className="fit-quick-panel">
                        <div>
                            <p className="fit-kicker">Water</p>
                            <h3>Log intake</h3>
                        </div>
                        <div className="fit-inline-form">
                            <input value={waterAmount} onChange={event => setWaterAmount(event.target.value)} type="number" min="50" step="50" aria-label="Water amount in milliliters" />
                            <button onClick={handleWaterLog}>Add ml</button>
                        </div>
                    </div>
                    <div className="fit-quick-panel">
                        <div>
                            <p className="fit-kicker">Weight</p>
                            <h3>Track body weight</h3>
                        </div>
                        <div className="fit-inline-form">
                            <input value={weightKg} onChange={event => setWeightKg(event.target.value)} type="number" min="20" step="0.1" placeholder="kg" aria-label="Weight in kilograms" />
                            <button onClick={handleWeightLog}>Save</button>
                        </div>
                    </div>
                    <div className="fit-quick-panel">
                        <div>
                            <p className="fit-kicker">Upcoming tasks</p>
                            <h3>{hasWorkout ? 'Complete today\'s workout' : 'Generate workout plan'}</h3>
                            <p>{hasDiet ? 'Finish today\'s meal checklist.' : 'Generate diet plan to sync nutrition progress.'}</p>
                        </div>
                    </div>
                </section>

                <section className="fit-home-grid" aria-label="Client dashboard actions">
                    {/* Locked plan cards: shown when plan already exists. */}
                    {hasWorkout && (
                        <PlanExistsCard
                            title="Daily Workout"
                            icon={Dumbbell}
                            navigateTo="/client/plan"
                            tone="primary"
                        />
                    )}
                    {hasDiet && (
                        <PlanExistsCard
                            title="Today's Diet"
                            icon={Utensils}
                            navigateTo="/client/plan?tab=diet"
                        />
                    )}
                    {/* Regular action cards */}
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
