import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, ArrowLeft, CheckCircle2, Dumbbell, Flame, LogOut, Utensils } from 'lucide-react';
import { useClientAuth } from '../hooks/useAuth';
import { useClientPlan } from '../hooks/useClientPlan';
import CalorieTracker from '../components/CalorieTracker';
import ExerciseCard from '../components/ExerciseCard';
import ProgressBar from '../components/ProgressBar';
import Questionnaire from '../components/Questionnaire';
import { useDayProgress } from '../hooks/useDayProgress';
import { getCurrentRepeatWeek, getDietProgress, saveDietProgress } from '../utils/progressRepository';

const STANDARD_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const FALLBACK_WORKOUT = {
    greeting: 'Your training plan is ready.',
    overview: 'Follow the daily template, complete each session, then mark the day as done.',
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
        {
            day: 'Thursday',
            muscle: 'Shoulders & Core',
            exercises: [
                { name: 'Overhead Press', sets: '4', reps: '8-10', videoId: '2yjwXTZQDDI' },
                { name: 'Lateral Raise', sets: '3', reps: '12-15', videoId: '3VcKaXpzqRo' },
                { name: 'Cable Crunch', sets: '3', reps: '12-15', videoId: 'AV5PmZJIrrw' },
                { name: 'Plank', sets: '3', reps: '45 sec', videoId: 'pSHjTRCQxIw' },
            ],
        },
        {
            day: 'Friday',
            muscle: 'Upper Body Volume',
            exercises: [
                { name: 'Dumbbell Shoulder Press', sets: '3', reps: '10-12', videoId: 'B-aVuyhvLHU' },
                { name: 'Chest Supported Row', sets: '3', reps: '10-12', videoId: 'GZbfZ033f74' },
                { name: 'Push-Up', sets: '3', reps: 'AMRAP', videoId: 'IODxDxX7oi4' },
                { name: 'Hammer Curl', sets: '3', reps: '12', videoId: 'zC3nLlEvin4' },
            ],
        },
        {
            day: 'Saturday',
            muscle: 'Legs & Conditioning',
            exercises: [
                { name: 'Goblet Squat', sets: '3', reps: '12', videoId: 'MeIiIdhvXT4' },
                { name: 'Walking Lunge', sets: '3', reps: '12 each', videoId: 'L8fvypPrzzs' },
                { name: 'Kettlebell Swing', sets: '4', reps: '15', videoId: 'YSxHifyI6s8' },
                { name: 'Farmer Carry', sets: '3', reps: '30 sec', videoId: 'rt17lmnaLSM' },
            ],
        },
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
        if (dayName === 'Sunday') {
            return { day: 'Sunday', muscle: 'Rest', exercises: [] };
        }
        const matched = sourceDays.find(day =>
            day?.day?.toLowerCase() === dayName.toLowerCase() ||
            day?.day?.toLowerCase() === `day ${index + 1}`
        );
        return matched ? { ...matched, day: dayName, exercises: matched.exercises || [] } : { day: dayName, muscle: 'Training Day', exercises: [] };
    });
}

export default function WorkoutPlanView() {
    const { client, logout } = useClientAuth();
    const { workoutPlan: rawPlan, dietPlan: rawDiet, workoutGeneratedAt } = useClientPlan(client?.clientId);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        const tab = searchParams.get('tab');
        return ['training', 'diet', 'calories'].includes(tab) ? tab : 'training';
    });
    const [activeDay, setActiveDay] = useState('Monday');
    const [activeGenerator, setActiveGenerator] = useState(null);

    const parsedWorkout = useMemo(() => ensureParsed(rawPlan) || FALLBACK_WORKOUT, [rawPlan]);
    const days = useMemo(() => normalizeDays(parsedWorkout), [parsedWorkout]);
    const currentDayPlan = useMemo(() => days.find(day => day.day === activeDay) || days[0], [days, activeDay]);
    const exercises = currentDayPlan?.exercises || [];
    const firstName = client?.name?.split(' ')?.[0] || 'Vishall';
    const repeatWeek = useMemo(() => getCurrentRepeatWeek(workoutGeneratedAt), [workoutGeneratedAt]);

    const {
        completedCount,
        totalCount,
        percent,
        isCompleted,
        toggleComplete,
        dayDone,
        markDayDone,
    } = useDayProgress(client?.clientId, activeDay, exercises, repeatWeek);

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

                    <div className="fit-repeat-note">
                        <span>One-week template</span>
                        <strong>Tracking repeat week {repeatWeek} of 4</strong>
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
                    <DietPlanDetail firstName={firstName} activeDay={activeDay} rawDiet={rawDiet} clientId={client.clientId} />
                ) : (
                    <TrainingPlan
                        currentDayPlan={currentDayPlan}
                        repeatWeek={repeatWeek}
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
    repeatWeek,
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
                    <span className="fit-repeat-inline">Monthly repeat week {repeatWeek}</span>
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

function DietPlanDetail({ firstName, activeDay, rawDiet, clientId }) {
    const meals = MEALS_BY_DAY[activeDay] || MEALS_BY_DAY.Monday;
    const [dietProgress, setDietProgress] = useState({ mealsCompleted: 0, mealTarget: 4, done: false });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getDietProgress(clientId).then(progress => {
            if (!cancelled) setDietProgress(progress);
        });
        return () => {
            cancelled = true;
        };
    }, [clientId]);

    const updateDietProgress = async (next) => {
        setSaving(true);
        const saved = await saveDietProgress(clientId, next).finally(() => setSaving(false));
        setDietProgress(saved);
    };

    const handleMealToggle = (count) => {
        const mealsCompleted = dietProgress.mealsCompleted >= count ? count - 1 : count;
        updateDietProgress({
            ...dietProgress,
            mealsCompleted,
            done: mealsCompleted >= dietProgress.mealTarget,
        });
    };

    return (
        <section className="fit-content-panel fit-diet-detail">
            <p className="fit-diet-greeting">Hi {firstName}!</p>
            <button className="fit-diet-title" type="button">
                {rawDiet ? 'Your saved diet plan' : 'Generate a diet plan'}
            </button>

            <div className="fit-diet-tracker">
                <div>
                    <span className="fit-kicker">Today's diet</span>
                    <h2>{dietProgress.done ? 'Nutrition completed' : `${dietProgress.mealsCompleted}/${dietProgress.mealTarget} meals complete`}</h2>
                    <p>Diet completion updates your unified dashboard progress.</p>
                </div>
                <div className="fit-meal-checks" aria-label="Diet meal completion">
                    {Array.from({ length: dietProgress.mealTarget || 4 }, (_, index) => {
                        const count = index + 1;
                        const complete = dietProgress.mealsCompleted >= count;
                        return (
                            <button
                                key={count}
                                className={`fit-meal-check ${complete ? 'is-complete' : ''}`}
                                onClick={() => handleMealToggle(count)}
                                disabled={saving}
                            >
                                {complete && <CheckCircle2 size={16} />}
                                Meal {count}
                            </button>
                        );
                    })}
                </div>
            </div>

            {rawDiet ? (
                ensureParsed(rawDiet)?.fallback ? (
                    <div className="fit-diet-section">
                        <h2>{ensureParsed(rawDiet).fallback.message}</h2>
                        {ensureParsed(rawDiet).fallback.showRecommendations && (
                            <p>We recommend adjusting your dietary preferences or consulting a nutritionist.</p>
                        )}
                    </div>
                ) : (
                    <div className="fit-generated-diet fit-generated-diet-body" dangerouslySetInnerHTML={{ __html: rawDiet }} />
                )
            ) : (
                <div className="fit-diet-section">
                    <h2>No saved diet plan yet</h2>
                    <p>Generate a diet plan once and it will appear here after login on any device.</p>
                    <div className="fit-meal-list">
                        {meals.map(meal => (
                            <div key={meal} className="fit-meal-row">{meal}</div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
