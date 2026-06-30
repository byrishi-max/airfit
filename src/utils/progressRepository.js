import { supabase } from './supabaseClient';
import { ENDPOINTS } from './config';

const WORKOUT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_DAYS = [...WORKOUT_DAYS, 'Sunday'];

const todayDate = () => new Date().toISOString().split('T')[0];

export async function getExerciseProgressMap(clientId, weekNumber, dayName) {
  if (!clientId) return null;

  const { data, error } = await supabase.from('metrics')
    .select('metadata')
    .eq('client_id', clientId)
    .filter('metadata->>type', 'eq', 'exercise_completion')
    .like('metadata->>exerciseId', `w${weekNumber}_${dayName}_%`);

  if (error || !data) return {};

  return data.reduce((acc, row) => {
    const exId = row.metadata.exerciseId; // e.g. "w1_Monday_Pushups"
    const name = exId.split('_').slice(2).join('_');
    if (name) acc[name] = true;
    return acc;
  }, {});
}

function setLocalProgress(clientId, weekNumber, dayName, exerciseName, completed) {
  try {
    const raw = localStorage.getItem('airfit_progress') || '{}';
    const all = JSON.parse(raw);
    const key = `${clientId}_w${weekNumber}_${dayName}_${exerciseName}`;
    all[key] = { completed, ts: Date.now() };
    localStorage.setItem('airfit_progress', JSON.stringify(all));
  } catch (e) {}
}

export async function setExerciseProgress({ clientId, weekNumber, dayName, exerciseName, completed }) {
  if (!clientId) return null;
  
  setLocalProgress(clientId, weekNumber, dayName, exerciseName, completed);
  
  const exerciseId = `w${weekNumber}_${dayName}_${exerciseName}`;
  
  if (completed) {
    const { error } = await supabase.from('metrics').insert([{
      client_id: clientId,
      date: todayDate(),
      metadata: { type: 'exercise_completion', exerciseId }
    }]);
    if (error) console.warn('[AirFit] Remote exercise progress save failed:', error);
  } else {
    // Basic delete for unchecking
    await supabase.from('metrics')
      .delete()
      .eq('client_id', clientId)
      .filter('metadata->>type', 'eq', 'exercise_completion')
      .filter('metadata->>exerciseId', 'eq', exerciseId);
  }
  return true;
}

export async function getDayDone(clientId, weekNumber, dayName) {
  if (!clientId) return false;
  
  const { data, error } = await supabase.from('metrics')
    .select('id')
    .eq('client_id', clientId)
    .filter('metadata->>type', 'eq', 'day_completion')
    .filter('metadata->>dayId', 'eq', `w${weekNumber}_${dayName}`)
    .limit(1);
    
  if (error || !data || data.length === 0) return false;
  return true;
}

export async function markDayDoneRemote(clientId, weekNumber, dayName) {
  if (!clientId) return null;
  
  const { error } = await supabase.from('metrics').insert([{
    client_id: clientId,
    date: todayDate(),
    metadata: { type: 'day_completion', dayId: `w${weekNumber}_${dayName}` }
  }]);
  
  if (error) console.warn('[AirFit] Remote day completion save failed:', error);
  return true;
}

export async function getWeeklyProgress(clientId, weekNumber) {
  // Stubbed for Supabase - metrics can be fetched aggregately in getProgressSummary instead
  return null;
}

export function getCurrentRepeatWeek(generatedAt, now = new Date()) {
  const startDate = generatedAt ? new Date(generatedAt) : new Date(now.getFullYear(), now.getMonth(), 1);
  const safeStart = Number.isNaN(startDate.getTime())
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : startDate;
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - safeStart.getTime()) / 86400000));
  return (Math.floor(elapsedDays / 7) % 4) + 1;
}

function normalizeWorkoutDays(workoutPlan) {
  const sourceDays = Array.isArray(workoutPlan?.days) ? workoutPlan.days : [];
  return ALL_DAYS.map(dayName => {
    if (dayName === 'Sunday') return { day: 'Sunday', muscle: 'Rest', exercises: [] };
    const match = sourceDays.find(day => String(day?.day || '').toLowerCase() === dayName.toLowerCase());
    return match ? { ...match, day: dayName, exercises: match.exercises || [] } : { day: dayName, muscle: 'Training Day', exercises: [] };
  });
}

function getWorkoutTemplate(workoutPlan) {
  const days = normalizeWorkoutDays(workoutPlan);
  const exerciseKeys = new Set();
  let exerciseCount = 0;

  days.filter(day => WORKOUT_DAYS.includes(day.day)).forEach(day => {
    (day.exercises || []).forEach(exercise => {
      if (!exercise?.name) return;
      exerciseCount += 1;
      exerciseKeys.add(`${day.day}::${exercise.name}`);
    });
  });

  return {
    days,
    exerciseCount,
    exerciseKeys,
    workoutDayCount: WORKOUT_DAYS.length,
  };
}

export async function getProgressSummary(clientId, workoutPlan, generatedAt) {
  const currentWeek = getCurrentRepeatWeek(generatedAt);
  const template = getWorkoutTemplate(workoutPlan);
  const monthlyExerciseTarget = template.exerciseCount * 4;
  const monthlyDayTarget = template.workoutDayCount * 4;
  
  const empty = {
    currentWeek,
    currentWeekDone: 0,
    currentWeekTotal: template.exerciseCount,
    monthlyDone: 0,
    monthlyTotal: monthlyExerciseTarget,
    completedDays: 0,
    totalDays: monthlyDayTarget,
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
    weeklyProgress: null,
  };

  if (!clientId) return empty;

  // Retrieve today's metrics
  const todayCaloriesRows = await getCaloriesForDate(clientId, todayDate()).catch(() => []);
  const todayCalories = todayCaloriesRows.reduce((sum, log) => sum + Number(log.calories || 0), 0);
  
  const waterRows = await getWaterForDate(clientId, todayDate()).catch(() => []);
  const waterToday = waterRows.reduce((sum, log) => sum + Number(log.amountMl || 0), 0);
  
  const dietProgress = await getDietProgress(clientId, todayDate()).catch(() => ({ mealsCompleted: 0, done: false }));
  const weightRows = await getWeightLogs(clientId).catch(() => []);

  // Approximations for percentages (since we lack full historical aggregations in this simple setup)
  const currentWeekDone = 0; // Simplified
  const workoutPercent = template.exerciseCount ? Math.round((currentWeekDone / template.exerciseCount) * 100) : 0;
  const dietPercent = dietProgress.done ? 100 : Math.min(100, Math.round((Number(dietProgress.mealsCompleted || 0) / Number(dietProgress.mealTarget || 4)) * 100));
  const unifiedPercent = Math.round((workoutPercent + dietPercent) / 2);

  return {
    ...empty,
    currentWeekDone,
    todayCalories,
    monthCalories: todayCalories,
    weekCalories: todayCalories,
    dietDoneToday: Boolean(dietProgress.done),
    dietMealsCompleted: Number(dietProgress.mealsCompleted || 0),
    dietMealTarget: Number(dietProgress.mealTarget || 4),
    waterToday,
    latestWeight: weightRows[0]?.weightKg || weightRows[0]?.weight || null,
    unifiedPercent,
  };
}

export function getLocalExerciseCompleted(clientId, weekNumber, dayName, exerciseName) {
  try {
    const raw = localStorage.getItem('airfit_progress');
    if (!raw) return false;
    const all = JSON.parse(raw);
    const key = `${clientId}_w${weekNumber}_${dayName}_${exerciseName}`;
    return Boolean(all[key]?.completed);
  } catch(e) {
    return false;
  }
}

export async function logCalories(clientId, food, calories) {
  if (!clientId) return [];
  
  const { error } = await supabase.from('metrics').insert([{
    client_id: clientId,
    date: todayDate(),
    calories: Number(calories),
    metadata: { type: 'calories', food, time: new Date().toLocaleTimeString() }
  }]);
  
  if (error) console.warn('[AirFit] Remote calorie log failed:', error);
  return getCaloriesForDate(clientId, todayDate());
}

export async function getCaloriesForDate(clientId, date = todayDate()) {
  if (!clientId) return [];

  const { data, error } = await supabase.from('metrics')
    .select('*')
    .eq('client_id', clientId)
    .eq('date', date)
    .filter('metadata->>type', 'eq', 'calories');

  if (error || !data) return [];
  
  return data.map(row => ({
    food: row.metadata.food,
    calories: Number(row.calories || 0),
    time: row.metadata.time || '',
    createdAt: row.created_at,
  }));
}

export async function getDietProgress(clientId, date = todayDate()) {
  if (!clientId) return { date, mealsCompleted: 0, mealTarget: 4, done: false };

  const { data, error } = await supabase.from('metrics')
    .select('*')
    .eq('client_id', clientId)
    .eq('date', date)
    .filter('metadata->>type', 'eq', 'diet_progress')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return { date, mealsCompleted: 0, mealTarget: 4, done: false };
  }
  
  return {
    date,
    mealsCompleted: Number(data[0].metadata.mealsCompleted || 0),
    mealTarget: Number(data[0].metadata.mealTarget || 4),
    done: Boolean(data[0].metadata.done),
  };
}

export async function saveDietProgress(clientId, progress, date = todayDate()) {
  const next = {
    date,
    mealsCompleted: Math.max(0, Math.min(Number(progress.mealTarget || 4), Number(progress.mealsCompleted || 0))),
    mealTarget: Number(progress.mealTarget || 4),
    done: Boolean(progress.done),
  };

  const { error } = await supabase.from('metrics').insert([{
    client_id: clientId,
    date: date,
    metadata: { type: 'diet_progress', ...next }
  }]);

  if (error) console.warn('[AirFit] Remote diet progress save failed:', error);
  return next;
}

export async function logWater(clientId, amountMl, date = todayDate()) {
  const { error } = await supabase.from('metrics').insert([{
    client_id: clientId,
    date: date,
    water_ml: Number(amountMl),
    metadata: { type: 'water' }
  }]);

  if (error) console.warn('[AirFit] Remote water log failed:', error);
  return getWaterForDate(clientId, date);
}

export async function getWaterForDate(clientId, date = todayDate()) {
  const { data, error } = await supabase.from('metrics')
    .select('*')
    .eq('client_id', clientId)
    .eq('date', date)
    .filter('metadata->>type', 'eq', 'water')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(d => ({ amountMl: d.water_ml, createdAt: d.created_at }));
}

export async function logWeight(clientId, weightKg, date = todayDate()) {
  const { error } = await supabase.from('metrics').insert([{
    client_id: clientId,
    date: date,
    weight_kg: Number(weightKg),
    metadata: { type: 'weight' }
  }]);

  if (error) console.warn('[AirFit] Remote weight log failed:', error);
  return getWeightLogs(clientId);
}

export async function getWeightLogs(clientId) {
  const { data, error } = await supabase.from('metrics')
    .select('*')
    .eq('client_id', clientId)
    .filter('metadata->>type', 'eq', 'weight')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(d => ({ weightKg: d.weight_kg, date: d.date, createdAt: d.created_at }));
}

