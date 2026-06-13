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

