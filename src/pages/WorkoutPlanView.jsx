import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Dumbbell, Flame, LogOut, Utensils } from 'lucide-react';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import CalorieTracker from '../components/CalorieTracker';
import ExerciseCard from '../components/ExerciseCard';
import ProgressBar from '../components/ProgressBar';
import Questionnaire from '../components/Questionnaire';
import { useDayProgress } from '../hooks/useDayProgress';

const STANDARD_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const FALLBACK_WORKOUT = {
    greeting: 'Your training plan is ready.',
    overview: 'Follow the week tabs, complete each session, then mark the day as done.',
    days: [
        {
            day: 'Monday',
            muscle: 'Chest & Triceps',
            exercises: [
                { name: 'Barbell Bench Press', sets: '4', reps: '8-10', videoId: 'hWbUlkb5Ms4' },
                { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', videoId: '8iPEnn-ltC8' },
                { name: 'Cable Fly', sets: '3', reps: '12-15', videoId: 'Iwe6AmxVf7o' },
                { name: 'Triceps Pushdown', sets: '3', reps: '10-12', videoId: '2-LAMcpzODU' },
                { name: 'Overhead Triceps Extension', sets: '3', reps: '12', videoId: 'YbX7Wd8jQ-Q' },
            ],
        },
        {
            day: 'Tuesday',
            muscle: 'Back & Biceps',
            exercises: [
                { name: 'Lat Pulldown', sets: '4', reps: '10-12', videoId: 'CAwf7n6Luuc' },
                { name: 'Seated Cable Row', sets: '3', reps: '10-12', videoId: 'GZbfZ033f74' },
                { name: 'Dumbbell Curl', sets: '3', reps: '12', videoId: 'ykJmrZ5v0Oo' },
            ],
        },
        {
            day: 'Wednesday',
            muscle: 'Legs',
            exercises: [
                { name: 'Back Squat', sets: '4', reps: '8-10', videoId: 'bEv6CCg2BC8' },
                { name: 'Romanian Deadlift', sets: '3', reps: '10', videoId: 'JCXUYuzwNrM' },
                { name: 'Leg Press', sets: '3', reps: '12', videoId: 'IZxyjW7MPJQ' },
            ],
        },
        { day: 'Thursday', muscle: 'Shoulders & Core', exercises: [] },
        { day: 'Friday', muscle: 'Upper Body', exercises: [] },
        { day: 'Saturday', muscle: 'Conditioning', exercises: [] },
        { day: 'Sunday', muscle: 'Rest', exercises: [] },
    ],
};

const MEALS_BY_DAY = {
    Monday: ['Breakfast: oats, banana, whey, almonds', 'Lunch: rice, chicken, dal, curd', 'Snack: peanut butter toast and fruit', 'Dinner: paneer or lean meat with vegetables'],
    Tuesday: ['Breakfast: eggs, toast, fruit', 'Lunch: quinoa, dal, vegetables, curd', 'Snack: smoothie with whey and oats', 'Dinner: rice, fish or tofu, salad'],
    Wednesday: ['Breakfast: poha with peanuts and curd', 'Lunch: chapati, paneer, dal, vegetables', 'Snack: sprouts and banana', 'Dinner: chicken bowl with rice and greens'],
    Thursday: ['Breakfast: dosa, sambar, eggs or tofu', 'Lunch: rice, rajma, vegetables', 'Snack: Greek yogurt and nuts', 'Dinner: paneer bhurji, chapati, salad'],
    Friday: ['Breakfast: oats, dates, whey', 'Lunch: chicken biryani style bowl with curd', 'Snack: fruit, nuts, black coffee', 'Dinner: dal, rice, vegetables, eggs'],
    Saturday: ['Breakfast: upma with eggs or tofu', 'Lunch: chapati, dal, paneer, vegetables', 'Snack: protein shake and banana', 'Dinner: lean protein, potatoes, salad'],
    Sunday: ['Breakfast: balanced brunch with eggs or paneer', 'Lunch: home meal with rice, dal, vegetables', 'Snack: fruit and curd', 'Dinner: lighter protein-rich meal'],
};

function ensureParsed(plan) {
    if (!plan) return null;
    if (typeof plan === 'object') return plan;
    try {
        let parsed = JSON.parse(plan);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        return parsed;
    } catch {
        return null;
    }
}

function normalizeDays(plan) {
    const sourceDays = plan?.days?.length ? plan.days : FALLBACK_WORKOUT.days;
    return STANDARD_DAYS.map((dayName, index) => {
        const matched = sourceDays.find(day =>
            day?.day?.toLowerCase() === dayName.toLowerCase() ||
            day?.day?.toLowerCase() === `day ${index + 1}`
        );
        return matched ? { ...matched, day: dayName } : { day: dayName, muscle: dayName === 'Sunday' ? 'Rest' : 'Training Day', exercises: [] };
    });
}

export default function WorkoutPlanView() {
    const { client, logout } = useClientAuth();
    const { workoutPlan: rawPlan, dietPlan: rawDiet } = useClientPlan(client?.clientId);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('training');
    const [week, setWeek] = useState(1);
    const [activeDay, setActiveDay] = useState('Monday');
    const [activeGenerator, setActiveGenerator] = useState(null);

    const parsedWorkout = useMemo(() => ensureParsed(rawPlan) || FALLBACK_WORKOUT, [rawPlan]);
    const days = useMemo(() => normalizeDays(parsedWorkout), [parsedWorkout]);
    const currentDayPlan = useMemo(() => days.find(day => day.day === activeDay) || days[0], [days, activeDay]);
    const exercises = currentDayPlan?.exercises || [];
    const firstName = client?.name?.split(' ')?.[0] || 'Vishall';

    const {
        completedCount,
        totalCount,
        percent,
        isCompleted,
        toggleComplete,
        dayDone,
        markDayDone,
    } = useDayProgress(client?.clientId, activeDay, exercises, week);

    const handleDietAction = () => {
        setActiveTab('diet');
        if (!rawDiet) setActiveGenerator('Diet Plan');
    };

    const handleLogout = () => {
        logout();
        navigate('/client/login');
    };

    if (!client) {
        return (
            <div className="fit-app-shell fit-centered-state">
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="fit-app-shell">
            <header className="fit-topbar">
                <button className="fit-icon-button" onClick={() => navigate('/client/dashboard')} aria-label="Back to dashboard">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <p className="fit-kicker">AIRFIT</p>
                    <h1>Fitness & Nutrition</h1>
                </div>
                <div className="fit-header-actions">
                    <Link className="fit-icon-button" to="/client/progress" aria-label="Progress dashboard">
                        <Activity size={18} />
                    </Link>
                    <button className="fit-icon-button" onClick={handleLogout} aria-label="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="fit-dashboard">
                <section className="fit-panel fit-nav-panel" aria-label="Dashboard navigation">
                    <div className="fit-main-tabs">
                        <button className={`fit-main-tab ${activeTab === 'training' ? 'is-active' : ''}`} onClick={() => setActiveTab('training')}>
                            <Dumbbell size={18} />
                            <span>Training</span>
                        </button>
                        <button className={`fit-main-tab ${activeTab === 'calories' ? 'is-active' : ''}`} onClick={() => setActiveTab('calories')}>
                            <Flame size={18} />
                            <span>Calorie Log</span>
                        </button>
                    </div>

                    <button className="fit-diet-cta" onClick={handleDietAction}>
                        <Utensils size={18} />
                        <span>{rawDiet ? 'View Diet Plan' : 'Generate Diet Plan'}</span>
                    </button>

                    {activeGenerator && (
                        <div className="fit-generator">
                            <Questionnaire
                                planType={activeGenerator}
                                client={client}
                                onCancel={() => setActiveGenerator(null)}
                            />
                        </div>
                    )}

                    <div className="fit-pill-row" aria-label="Week selector">
                        {[1, 2, 3, 4].map(item => (
                            <button key={item} className={`fit-week-pill ${week === item ? 'is-active' : ''}`} onClick={() => setWeek(item)}>
                                Week {item}
                            </button>
                        ))}
                    </div>

                    <div className="fit-day-row" aria-label="Day selector">
                        {STANDARD_DAYS.map((day, index) => {
                            const isRest = day === 'Sunday' || !(days[index]?.exercises?.length);
                            return (
                                <button
                                    key={day}
                                    className={`fit-day-pill ${activeDay === day ? 'is-active' : ''}`}
                                    onClick={() => setActiveDay(day)}
                                >
                                    <span>{DAY_LABELS[index]}</span>
                                    {isRest && <small>REST</small>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {activeTab === 'calories' ? (
                    <section className="fit-content-panel">
                        <CalorieTracker clientId={client.clientId} />
                    </section>
                ) : activeTab === 'diet' ? (
                    <DietPlanDetail firstName={firstName} activeDay={activeDay} rawDiet={rawDiet} />
                ) : (
                    <TrainingPlan
                        currentDayPlan={currentDayPlan}
                        exercises={exercises}
                        completedCount={completedCount}
                        totalCount={totalCount}
                        percent={percent}
                        isCompleted={isCompleted}
                        toggleComplete={toggleComplete}
                        dayDone={dayDone}
                        markDayDone={markDayDone}
                    />
                )}
            </main>
        </div>
    );
}

function TrainingPlan({
    currentDayPlan,
    exercises,
    completedCount,
    totalCount,
    percent,
    isCompleted,
    toggleComplete,
    dayDone,
    markDayDone,
}) {
    return (
        <section className="fit-content-panel">
            <div className="fit-section-header">
                <div>
                    <p className="fit-kicker">Training Plan</p>
                    <h2>{currentDayPlan?.muscle || 'Training Day'}</h2>
                </div>
                <span className="fit-count-chip">{exercises.length} exercises</span>
            </div>

            <div className="fit-progress-card">
                <div className="fit-progress-meta">
                    <div>
                        <strong>Day Progress</strong>
                        <span>{completedCount} of {totalCount} exercises completed</span>
                    </div>
                    <b>{percent}%</b>
                </div>
                <ProgressBar completedCount={completedCount} totalCount={totalCount} percent={percent} />
            </div>

            {exercises.length ? (
                <div className="fit-exercise-list">
                    {exercises.map(exercise => (
                        <ExerciseCard
                            key={exercise.name}
                            exercise={exercise}
                            completed={isCompleted(exercise.name)}
                            toggleComplete={() => toggleComplete(exercise.name)}
                        />
                    ))}
                </div>
            ) : (
                <div className="fit-empty-card">
                    <h3>Rest & Recovery</h3>
                    <p>No workout is assigned for this day. Keep steps light, hydrate well, and prepare for the next session.</p>
                </div>
            )}

            {totalCount > 0 && completedCount === totalCount && !dayDone && (
                <button className="fit-done-button" onClick={markDayDone}>
                    Mark Day as Done
                </button>
            )}
            {dayDone && <p className="fit-done-note">Day completed. Your analytics are updated.</p>}
        </section>
    );
}

function DietPlanDetail({ firstName, activeDay, rawDiet }) {
    const meals = MEALS_BY_DAY[activeDay] || MEALS_BY_DAY.Monday;

    return (
        <section className="fit-content-panel fit-diet-detail">
            <p className="fit-diet-greeting">Hi {firstName}!</p>
            <button className="fit-diet-title" type="button">
                Personalised Diet Plan - Muscle Gain
            </button>

            <div className="fit-diet-section">
                <h2>1. Daily Calorie Target and Macros</h2>
                <p>
                    To support muscle gain, we'll aim for a slight calorie surplus with adequate protein.
                    Your target is approximately:
                </p>
                <div className="fit-macro-grid">
                    <MacroCard label="Calories" value="2700-2900 kcal" />
                    <MacroCard label="Protein" value="160-180g" detail="approx. 2.2-2.5g per kg bodyweight" />
                    <MacroCard label="Carbohydrates" value="300-350g" detail="focus on complex carbs" />
                    <MacroCard label="Fats" value="70-85g" detail="focus on healthy fats" />
                </div>
            </div>

            <div className="fit-diet-section">
                <h2>2. 7-Day Meal Plan</h2>
                <div className="fit-meal-list">
                    {meals.map(meal => (
                        <div key={meal} className="fit-meal-row">{meal}</div>
                    ))}
                </div>
            </div>

            {rawDiet && (
                <details className="fit-generated-diet">
                    <summary>Generated plan details</summary>
                    <div dangerouslySetInnerHTML={{ __html: rawDiet }} />
                </details>
            )}
        </section>
    );
}

function MacroCard({ label, value, detail }) {
    return (
        <div className="fit-macro-card">
            <span>{label}</span>
            <strong>{value}</strong>
            {detail && <small>{detail}</small>}
        </div>
    );
}
