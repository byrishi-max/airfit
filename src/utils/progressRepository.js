import { getDailyCalories as getLocalDailyCalories, getProgress as getLocalProgress, logDailyCalories as logLocalDailyCalories, setProgress as setLocalProgress } from './storage';
import { isSupabaseConfigured, supabaseRequest, toIsoNow } from './supabaseClient';

export async function getExerciseProgressMap(clientId, weekNumber, dayName) {
  if (!isSupabaseConfigured || !clientId) return null;

  const rows = await supabaseRequest(
    `exercise_progress?client_id=eq.${encodeURIComponent(clientId)}&week_number=eq.${weekNumber}&day_name=eq.${encodeURIComponent(dayName)}&select=exercise_name,completed`
  );
  return (rows || []).reduce((acc, row) => {
    acc[row.exercise_name] = Boolean(row.completed);
    return acc;
  }, {});
}

export async function setExerciseProgress({ clientId, weekNumber, dayName, exerciseName, completed }) {
  if (!isSupabaseConfigured || !clientId) {
    setLocalProgress(clientId, weekNumber, dayName, exerciseName, completed);
    return null;
  }

  return supabaseRequest('exercise_progress?on_conflict=client_id,week_number,day_name,exercise_name', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      client_id: clientId,
      week_number: weekNumber,
      day_name: dayName,
      exercise_name: exerciseName,
      completed,
      completed_at: completed ? toIsoNow() : null,
      updated_at: toIsoNow(),
    }),
  });
}

export async function getDayDone(clientId, weekNumber, dayName) {
  if (!isSupabaseConfigured || !clientId) {
    return localStorage.getItem(`airfit_daydone_${clientId}_${dayName}`) === 'true';
  }

  const rows = await supabaseRequest(
    `day_progress?client_id=eq.${encodeURIComponent(clientId)}&week_number=eq.${weekNumber}&day_name=eq.${encodeURIComponent(dayName)}&select=done&limit=1`
  );
  return Boolean(rows?.[0]?.done);
}

export async function markDayDoneRemote(clientId, weekNumber, dayName) {
  if (!isSupabaseConfigured || !clientId) {
    localStorage.setItem(`airfit_daydone_${clientId}_${dayName}`, 'true');
    return null;
  }

  return supabaseRequest('day_progress?on_conflict=client_id,week_number,day_name', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      client_id: clientId,
      week_number: weekNumber,
      day_name: dayName,
      done: true,
      done_at: toIsoNow(),
      updated_at: toIsoNow(),
    }),
  });
}

export async function getWeeklyProgress(clientId, weekNumber) {
  if (!isSupabaseConfigured || !clientId) return null;

  const [exerciseRows, dayRows, calorieRows] = await Promise.all([
    supabaseRequest(`exercise_progress?client_id=eq.${encodeURIComponent(clientId)}&week_number=eq.${weekNumber}&select=*`),
    supabaseRequest(`day_progress?client_id=eq.${encodeURIComponent(clientId)}&week_number=eq.${weekNumber}&select=*`),
    getWeeklyCalories(clientId),
  ]);

  return {
    exercises: exerciseRows || [],
    days: dayRows || [],
    calories: calorieRows || [],
  };
}

export function getCurrentRepeatWeek(generatedAt, now = new Date()) {
  const startDate = generatedAt ? new Date(generatedAt) : new Date(now.getFullYear(), now.getMonth(), 1);
  const safeStart = Number.isNaN(startDate.getTime())
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : startDate;
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - safeStart.getTime()) / 86400000));
  return (Math.floor(elapsedDays / 7) % 4) + 1;
}

function getWorkoutTemplate(workoutPlan) {
  const days = Array.isArray(workoutPlan?.days) ? workoutPlan.days : [];
  const exerciseKeys = new Set();
  let exerciseCount = 0;

  days.forEach(day => {
    const dayName = day.day || '';
    (day.exercises || []).forEach(exercise => {
      if (!exercise?.name) return;
      exerciseCount += 1;
      exerciseKeys.add(`${dayName}::${exercise.name}`);
    });
  });

  return {
    days,
    exerciseCount,
    exerciseKeys,
    workoutDayCount: days.filter(day => (day.exercises || []).length > 0).length,
  };
}

function calculateStreak(dayRows = []) {
  const completedDates = new Set(
    dayRows
      .filter(row => row.done && row.done_at)
      .map(row => new Date(row.done_at).toISOString().split('T')[0])
  );

  let streak = 0;
  const cursor = new Date();
  while (completedDates.has(cursor.toISOString().split('T')[0])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function startOfMonthDate(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

export async function getProgressSummary(clientId, workoutPlan, generatedAt) {
  const currentWeek = getCurrentRepeatWeek(generatedAt);
  const template = getWorkoutTemplate(workoutPlan);
  const monthlyExerciseTarget = template.exerciseCount * 4;
  const monthlyDayTarget = template.workoutDayCount * 4;

  if (!clientId || !template.exerciseCount) {
    return {
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
      weeklyProgress: null,
    };
  }

  if (!isSupabaseConfigured) {
    const currentWeekDone = template.days.reduce((sum, day) => {
      return sum + (day.exercises || []).filter(exercise =>
        getLocalProgress(clientId, currentWeek, day.day, exercise.name)
      ).length;
    }, 0);

    return {
      currentWeek,
      currentWeekDone,
      currentWeekTotal: template.exerciseCount,
      monthlyDone: currentWeekDone,
      monthlyTotal: template.exerciseCount,
      completedDays: 0,
      totalDays: template.workoutDayCount,
      streak: 0,
      todayCalories: getLocalDailyCalories(clientId).reduce((sum, log) => sum + Number(log.calories || 0), 0),
      weekCalories: 0,
      monthCalories: 0,
      weeklyProgress: null,
    };
  }

  const weekNumbers = [1, 2, 3, 4];
  const [exerciseRows, dayRows, monthCaloriesRows, todayCaloriesRows] = await Promise.all([
    supabaseRequest(`exercise_progress?client_id=eq.${encodeURIComponent(clientId)}&week_number=in.(1,2,3,4)&completed=eq.true&select=*`),
    supabaseRequest(`day_progress?client_id=eq.${encodeURIComponent(clientId)}&week_number=in.(1,2,3,4)&done=eq.true&select=*`),
    supabaseRequest(`calorie_logs?client_id=eq.${encodeURIComponent(clientId)}&log_date=gte.${startOfMonthDate()}&select=*`),
    getCaloriesForDate(clientId),
  ]);

  const validCompletedExerciseKeys = new Set();
  (exerciseRows || []).forEach(row => {
    if (!template.exerciseKeys.has(`${row.day_name}::${row.exercise_name}`)) return;
    validCompletedExerciseKeys.add(`${row.week_number}::${row.day_name}::${row.exercise_name}`);
  });

  const currentWeekDone = Array.from(validCompletedExerciseKeys)
    .filter(key => key.startsWith(`${currentWeek}::`)).length;

  const weeklyProgress = await getWeeklyProgress(clientId, currentWeek);
  const todayCalories = (todayCaloriesRows || []).reduce((sum, log) => sum + Number(log.calories || 0), 0);
  const weekCalories = (weeklyProgress?.calories || []).reduce((sum, log) => sum + Number(log.calories || 0), 0);
  const monthCalories = (monthCaloriesRows || []).reduce((sum, log) => sum + Number(log.calories || 0), 0);

  return {
    currentWeek,
    currentWeekDone,
    currentWeekTotal: template.exerciseCount,
    monthlyDone: validCompletedExerciseKeys.size,
    monthlyTotal: monthlyExerciseTarget,
    completedDays: (dayRows || []).length,
    totalDays: monthlyDayTarget,
    streak: calculateStreak(dayRows || []),
    todayCalories,
    weekCalories,
    monthCalories,
    weeklyProgress,
    weekNumbers,
  };
}

export function getLocalExerciseCompleted(clientId, weekNumber, dayName, exerciseName) {
  return getLocalProgress(clientId, weekNumber, dayName, exerciseName);
}

export async function logCalories(clientId, food, calories) {
  if (!isSupabaseConfigured || !clientId) {
    logLocalDailyCalories(clientId, food, calories);
    return getLocalDailyCalories(clientId);
  }

  await supabaseRequest('calorie_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      client_id: clientId,
      log_date: new Date().toISOString().split('T')[0],
      food,
      calories: Number(calories),
    }),
  });
  return getCaloriesForDate(clientId);
}

export async function getCaloriesForDate(clientId, date = new Date().toISOString().split('T')[0]) {
  if (!isSupabaseConfigured || !clientId) {
    return getLocalDailyCalories(clientId);
  }

  const rows = await supabaseRequest(
    `calorie_logs?client_id=eq.${encodeURIComponent(clientId)}&log_date=eq.${date}&select=*&order=created_at.desc`
  );
  return (rows || []).map(row => ({
    food: row.food,
    calories: row.calories,
    time: new Date(row.created_at).toLocaleTimeString(),
    createdAt: row.created_at,
  }));
}

async function getWeeklyCalories(clientId) {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceDate = since.toISOString().split('T')[0];
  return supabaseRequest(
    `calorie_logs?client_id=eq.${encodeURIComponent(clientId)}&log_date=gte.${sinceDate}&select=*`
  );
}
