import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Droplets, Dumbbell, Flame, Home, Scale, Utensils, TrendingUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import { getProgressSummary } from '../utils/progressRepository';
import WeeklyChart from '../components/WeeklyBarChart';
import CalorieTracker from '../components/CalorieTracker';

const emptySummary = {
    currentWeek: 1,
    currentWeekDone: 0,
    currentWeekTotal: 0,
    monthlyDone: 0,
    monthlyTotal: 0,
    completedDays: 0,
    totalDays: 0,
    streak: 0,
    todayCalories: 0,
    weekCalories: 0,
    monthCalories: 0,
    dietDoneToday: false,
    dietMealsCompleted: 0,
    dietMealTarget: 4,
    waterToday: 0,
    waterTarget: 3000,
    latestWeight: null,
    unifiedPercent: 0,
};

export default function ProgressDashboard() {
    const { client } = useClientAuth();
    const { workoutPlan, workoutGeneratedAt } = useClientPlan(client?.clientId);
    const navigate = useNavigate();
    const [summary, setSummary] = useState(emptySummary);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function loadSummary() {
            if (!client || !workoutPlan) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const nextSummary = await getProgressSummary(client.clientId, workoutPlan, workoutGeneratedAt).catch(error => {
                console.warn('[AirFit] Failed to load progress summary:', error);
                return emptySummary;
            });
            if (!cancelled) {
                setSummary(nextSummary);
                setIsLoading(false);
            }
        }
        loadSummary();
        return () => {
            cancelled = true;
        };
    }, [client, workoutPlan, workoutGeneratedAt]);

    if (!client) {
        return (
            <div className="fit-app-shell fit-centered-state">
                <p>Loading your profile...</p>
            </div>
        );
    }

    const monthlyCompletion = summary.monthlyTotal
        ? Math.round((summary.monthlyDone / summary.monthlyTotal) * 100)
        : 0;
    const currentWeekCompletion = summary.currentWeekTotal
        ? Math.round((summary.currentWeekDone / summary.currentWeekTotal) * 100)
        : 0;

    return (
        <div className="fit-app-shell">
            <Helmet>
                <title>Progress Tracker | AirFit</title>
                <meta name="description" content="Track AirFit workout completion, streaks, and calories." />
            </Helmet>

            <header className="fit-topbar">
                <button className="fit-icon-button" onClick={() => navigate('/client/dashboard')} aria-label="Back home">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <p className="fit-kicker">Performance</p>
                    <h1>Progress Tracker</h1>
                </div>
                <button className="fit-icon-button" onClick={() => navigate('/client/dashboard')} aria-label="Home dashboard">
                    <Home size={18} />
                </button>
            </header>

            <main className="fit-dashboard fit-home-main">
                <section className="fit-home-hero">
                    <p className="fit-kicker">Monthly Analytics</p>
                    <h2>{isLoading ? 'Syncing progress...' : `${summary.unifiedPercent || monthlyCompletion}% synced`}</h2>
                    <p>
                        Workout, diet, calories, water, weight, and streaks are combined from your saved progress records.
                    </p>
                </section>

                <section className="fit-analytics-grid" aria-label="Progress analytics">
                    <MetricCard icon={TrendingUp} label="Unified Progress" value={`${summary.unifiedPercent || monthlyCompletion}%`} detail="Workout and diet combined" />
                    <MetricCard icon={Dumbbell} label={`Repeat Week ${summary.currentWeek}`} value={`${currentWeekCompletion}%`} detail={`${summary.currentWeekDone}/${summary.currentWeekTotal} exercises`} />
                    <MetricCard icon={CalendarCheck} label="Done Days" value={`${summary.completedDays}`} detail={`${summary.totalDays} workout days this month`} />
                    <MetricCard icon={Utensils} label="Diet Today" value={summary.dietDoneToday ? 'Done' : `${summary.dietMealsCompleted}/${summary.dietMealTarget}`} detail="Meals completed" />
                    <MetricCard icon={Flame} label="Calories" value={`${summary.todayCalories}`} detail={`${summary.weekCalories} week / ${summary.monthCalories} month kcal`} />
                    <MetricCard icon={Droplets} label="Water" value={`${Math.round((summary.waterToday || 0) / 100) / 10}L`} detail={`${summary.waterTarget || 3000} ml target`} />
                    <MetricCard icon={Scale} label="Weight" value={summary.latestWeight ? `${summary.latestWeight} kg` : 'No log'} detail="Latest check-in" />
                </section>

                <section className="fit-progress-layout">
                    <div className="fit-content-panel">
                        <div className="fit-section-header">
                            <div>
                                <p className="fit-kicker">Current Repeat</p>
                                <h2>Week {summary.currentWeek} Completion</h2>
                                <span className="fit-repeat-inline">{summary.streak} day current streak</span>
                            </div>
                        </div>
                        <WeeklyChart clientId={client.clientId} weekNumber={summary.currentWeek} workoutJson={workoutPlan} />
                    </div>
                    <div className="fit-content-panel fit-progress-calories">
                        <CalorieTracker clientId={client.clientId} />
                    </div>
                </section>
            </main>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, detail }) {
    return (
        <div className="fit-metric-card">
            <span><Icon size={18} /></span>
            <small>{label}</small>
            <strong>{value}</strong>
            <em>{detail}</em>
        </div>
    );
}
