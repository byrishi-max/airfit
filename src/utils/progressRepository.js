import { getDailyCalories as getLocalDailyCalories, getProgress as getLocalProgress, logDailyCalories as logLocalDailyCalories, setProgress as setLocalProgress } from './storage';
import { isFirebaseConfigured, db, toIsoNow } from './firebaseClient';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where, orderBy, addDoc } from 'firebase/firestore';

export async function getExerciseProgressMap(clientId, weekNumber, dayName) {
  if (!isFirebaseConfigured || !clientId) return null;

  const progressRef = collection(db, 'clients', clientId, 'exercise_progress');
  const q = query(progressRef, where('week_number', '==', weekNumber), where('day_name', '==', dayName));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.reduce((acc, docSnap) => {
    const data = docSnap.data();
    acc[data.exercise_name] = Boolean(data.completed);
    return acc;
  }, {});
}

export async function setExerciseProgress({ clientId, weekNumber, dayName, exerciseName, completed }) {
  if (!isFirebaseConfigured || !clientId) {
    setLocalProgress(clientId, weekNumber, dayName, exerciseName, completed);
    return null;
  }

  const docId = `${weekNumber}_${dayName}_${exerciseName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const progressRef = doc(db, 'clients', clientId, 'exercise_progress', docId);

  return setDoc(progressRef, {
    client_id: clientId,
    week_number: weekNumber,
    day_name: dayName,
    exercise_name: exerciseName,
    completed,
    completed_at: completed ? toIsoNow() : null,
    updated_at: toIsoNow(),
  }, { merge: true });
}

export async function getDayDone(clientId, weekNumber, dayName) {
  if (!isFirebaseConfigured || !clientId) {
    return localStorage.getItem(`airfit_daydone_${clientId}_${dayName}`) === 'true';
  }

  const dayRef = collection(db, 'clients', clientId, 'day_progress');
  const q = query(dayRef, where('week_number', '==', weekNumber), where('day_name', '==', dayName));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return false;
  return Boolean(snapshot.docs[0].data().done);
}

export async function markDayDoneRemote(clientId, weekNumber, dayName) {
  if (!isFirebaseConfigured || !clientId) {
    localStorage.setItem(`airfit_daydone_${clientId}_${dayName}`, 'true');
    return null;
  }

  const docId = `${weekNumber}_${dayName}`;
  const dayRef = doc(db, 'clients', clientId, 'day_progress', docId);

  return setDoc(dayRef, {
    client_id: clientId,
    week_number: weekNumber,
    day_name: dayName,
    done: true,
    done_at: toIsoNow(),
    updated_at: toIsoNow(),
  }, { merge: true });
}

export async function getWeeklyProgress(clientId, weekNumber) {
  if (!isFirebaseConfigured || !clientId) return null;

  const [exerciseSnap, daySnap, calorieRows] = await Promise.all([
    getDocs(query(collection(db, 'clients', clientId, 'exercise_progress'), where('week_number', '==', weekNumber))),
    getDocs(query(collection(db, 'clients', clientId, 'day_progress'), where('week_number', '==', weekNumber))),
    getWeeklyCalories(clientId),
  ]);

  return {
    exercises: exerciseSnap.docs.map(d => d.data()),
    days: daySnap.docs.map(d => d.data()),
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

/**
 * Only count "main" phase exercises — not warmup, cooldown, cardio, core injected by workoutEnhancer.
 * This ensures progress percentages are correct (user can only tick main exercises).
 */
function getWorkoutTemplate(workoutPlan) {
  const days = Array.isArray(workoutPlan?.days) ? workoutPlan.days : [];
  const exerciseKeys = new Set();
  let exerciseCount = 0;

  days.forEach(day => {
    const dayName = day.day || '';
    (day.exercises || []).forEach(exercise => {
      if (!exercise?.name) return;
      // Only count main exercises — skip warmup/cooldown/cardio/core phases
      const phase = (exercise.phase || 'main').toLowerCase();
      if (phase !== 'main') return;
      exerciseCount += 1;
      exerciseKeys.add(`${dayName}::${exercise.name}`);
    });
  });

  return {
    days,
    exerciseCount,
    exerciseKeys,
    workoutDayCount: days.filter(day => (day.exercises || []).some(ex => (ex.phase || 'main') === 'main')).length,
  };
}

function calculateStreak(dayRows = []) {
  const completedDates = new Set();
  for (const row of dayRows) {
    if (!row.done || !row.done_at) continue;
    try {
      completedDates.add(new Date(row.done_at).toISOString().split('T')[0]);
    } catch {
      // skip malformed done_at values
    }
  }

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

function todayDate() {
  return new Date().toISOString().split('T')[0];
}

function readLocalList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function writeLocalList(key, rows) {
  localStorage.setItem(key, JSON.stringify(rows));
}

function localWaterKey(clientId, date = todayDate()) {
  return `airfit_water_${clientId}_${date}`;
}

function localWeightKey(clientId) {
  return `airfit_weight_${clientId}`;
}

export async function getProgressSummary(clientId, workoutPlan, generatedAt) {
  const currentWeek = getCurrentRepeatWeek(generatedAt);
  const template = getWorkoutTemplate(workoutPlan);
  const monthlyExerciseTarget = template.exerciseCount * 4;
  const monthlyDayTarget = template.workoutDayCount * 4;

  const emptySummary = {
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

  if (!clientId || !template.exerciseCount) {
    return emptySummary;
  }

  if (!isFirebaseConfigured) {
    const currentWeekDone = template.days.reduce((sum, day) => {
      return sum + (day.exercises || []).filter(exercise =>
        exercise.phase === 'main' && getLocalProgress(clientId, currentWeek, day.day, exercise.name)
      ).length;
    }, 0);
    const localWaterRows = await getWaterForDate(clientId);
    const localWeightRows = await getWeightLogs(clientId);
    const todayCalories = getLocalDailyCalories(clientId).reduce((sum, log) => sum + Number(log.calories || 0), 0);
    const workoutPercent = template.exerciseCount ? Math.round((currentWeekDone / template.exerciseCount) * 100) : 0;

    return {
      ...emptySummary,
      currentWeek,
      currentWeekDone,
      currentWeekTotal: template.exerciseCount,
      monthlyDone: currentWeekDone,
      monthlyTotal: template.exerciseCount,
      completedDays: 0,
      totalDays: template.workoutDayCount,
      streak: 0,
      todayCalories,
      weekCalories: 0,
      monthCalories: 0,
      waterToday: localWaterRows.reduce((sum, log) => sum + Number(log.amountMl || 0), 0),
      latestWeight: localWeightRows[0]?.weightKg || null,
      unifiedPercent: workoutPercent,
      weeklyProgress: null,
    };
  }

  const weekNumbers = [1, 2, 3, 4];
  const [exerciseSnap, daySnap, waterRows, weightRows] = await Promise.all([
    getDocs(query(collection(db, 'clients', clientId, 'exercise_progress'), where('week_number', 'in', weekNumbers), where('completed', '==', true))),
    getDocs(query(collection(db, 'clients', clientId, 'day_progress'), where('week_number', 'in', weekNumbers), where('done', '==', true))),
    getWaterForDate(clientId),
    getWeightLogs(clientId),
  ]);

  // Get today and monthly calories without composite index (fetch all, filter client-side)
  const todayCaloriesRows = await getCaloriesForDate(clientId).catch(() => []);
  const monthCaloriesRows = await getCaloriesForMonth(clientId).catch(() => []);

  const exerciseRows = exerciseSnap.docs.map(d => d.data());
  const dayRows = daySnap.docs.map(d => d.data());

  // Count ALL completed exercise_progress rows for current week — no template filtering
  // (template day names might be 'Day 4' but Firestore stores 'Thursday' — can't reliably cross-match)
  const currentWeekDone = exerciseRows.filter(row => row.week_number === currentWeek && row.completed).length;
  const monthlyDone = exerciseRows.filter(row => row.completed).length;

  const weeklyProgress = await getWeeklyProgress(clientId, currentWeek).catch(() => null);
  const todayCalories = (todayCaloriesRows || []).reduce((sum, log) => sum + Number(log.calories || 0), 0);
  const weekCalories = (weeklyProgress?.calories || []).reduce((sum, log) => sum + Number(log.calories || 0), 0);
  const monthCalories = (monthCaloriesRows || []).reduce((sum, log) => sum + Number(log.calories || 0), 0);
  const workoutPercent = template.exerciseCount ? Math.round((currentWeekDone / template.exerciseCount) * 100) : 0;

  return {
    ...emptySummary,
    currentWeek,
    currentWeekDone,
    currentWeekTotal: template.exerciseCount,
    monthlyDone,
    monthlyTotal: monthlyExerciseTarget,
    completedDays: dayRows.length,
    totalDays: monthlyDayTarget,
    streak: calculateStreak(dayRows),
    todayCalories,
    weekCalories,
    monthCalories,
    waterToday: (waterRows || []).reduce((sum, log) => sum + Number(log.amountMl || 0), 0),
    latestWeight: weightRows?.[0]?.weightKg || null,
    unifiedPercent: workoutPercent,
    weeklyProgress,
    weekNumbers,
  };
}

export function getLocalExerciseCompleted(clientId, weekNumber, dayName, exerciseName) {
  return getLocalProgress(clientId, weekNumber, dayName, exerciseName);
}

export async function logCalories(clientId, food, calories) {
  if (!isFirebaseConfigured || !clientId) {
    logLocalDailyCalories(clientId, food, calories);
    return getLocalDailyCalories(clientId);
  }

  const logsRef = collection(db, 'clients', clientId, 'calorie_logs');
  await addDoc(logsRef, {
    client_id: clientId,
    log_date: todayDate(),
    food,
    calories: Number(calories),
    created_at: toIsoNow()
  });
  
  return getCaloriesForDate(clientId);
}

export async function getCaloriesForDate(clientId, date = todayDate()) {
  if (!isFirebaseConfigured || !clientId) {
    return getLocalDailyCalories(clientId);
  }

  try {
    const logsRef = collection(db, 'clients', clientId, 'calorie_logs');
    const q = query(logsRef, where('log_date', '==', date));
    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map(docSnap => {
        const row = docSnap.data();
        return {
          docId: docSnap.id,
          food: row.food,
          calories: row.calories,
          time: row.created_at ? new Date(row.created_at).toLocaleTimeString() : '',
          createdAt: row.created_at || '',
        };
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  } catch (error) {
    console.warn('[AirFit] getCaloriesForDate error:', error);
    return [];
  }
}

export async function deleteCalorieLog(clientId, docId) {
  if (!isFirebaseConfigured || !clientId || !docId) return;
  try {
    await deleteDoc(doc(db, 'clients', clientId, 'calorie_logs', docId));
  } catch (error) {
    console.warn('[AirFit] deleteCalorieLog error:', error);
  }
}

async function getCaloriesForMonth(clientId) {
  if (!isFirebaseConfigured || !clientId) return [];

  try {
    const logsRef = collection(db, 'clients', clientId, 'calorie_logs');
    const q = query(logsRef, where('log_date', '>=', startOfMonthDate()));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data());
  } catch (error) {
    console.warn('[AirFit] getCaloriesForMonth error:', error);
    return [];
  }
}

async function getWeeklyCalories(clientId) {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceDate = since.toISOString().split('T')[0];
  
  try {
    const logsRef = collection(db, 'clients', clientId, 'calorie_logs');
    const q = query(logsRef, where('log_date', '>=', sinceDate));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.warn('[AirFit] getWeeklyCalories error:', error);
    return [];
  }
}

export async function logWater(clientId, amountMl, date = todayDate()) {
  const row = {
    amountMl: Number(amountMl),
    logDate: date,
    createdAt: toIsoNow(),
  };

  if (!isFirebaseConfigured || !clientId) {
    const key = localWaterKey(clientId, date);
    const rows = readLocalList(key);
    rows.unshift(row);
    writeLocalList(key, rows);
    return rows;
  }

  try {
    const logsRef = collection(db, 'clients', clientId, 'water_logs');
    await addDoc(logsRef, {
      client_id: clientId,
      log_date: date,
      amount_ml: row.amountMl,
      created_at: row.createdAt,
    });
  } catch (error) {
    console.warn('[AirFit] logWater Firebase error:', error);
    // Fallback to localStorage
    const key = localWaterKey(clientId, date);
    const rows = readLocalList(key);
    rows.unshift(row);
    writeLocalList(key, rows);
  }

  return getWaterForDate(clientId, date);
}

export async function getWaterForDate(clientId, date = todayDate()) {
  if (!isFirebaseConfigured || !clientId) {
    return readLocalList(localWaterKey(clientId, date));
  }

  try {
    const logsRef = collection(db, 'clients', clientId, 'water_logs');
    const q = query(logsRef, where('log_date', '==', date));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(docSnap => {
        const row = docSnap.data();
        return {
          amountMl: Number(row.amount_ml || 0),
          logDate: row.log_date,
          createdAt: row.created_at,
        };
      })
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  } catch (error) {
    console.warn('[AirFit] getWaterForDate error:', error);
    return [];
  }
}

export async function logWeight(clientId, weightKg, date = todayDate()) {
  const row = {
    weightKg: Number(weightKg),
    logDate: date,
    createdAt: toIsoNow(),
  };

  if (!isFirebaseConfigured || !clientId) {
    const key = localWeightKey(clientId);
    const rows = readLocalList(key);
    rows.unshift(row);
    writeLocalList(key, rows);
    return rows;
  }

  try {
    const logsRef = collection(db, 'clients', clientId, 'weight_logs');
    await addDoc(logsRef, {
      client_id: clientId,
      log_date: date,
      weight_kg: row.weightKg,
      created_at: row.createdAt,
    });

    // Also update the client's latest weight on their main document
    const clientRef = doc(db, 'clients', clientId);
    await setDoc(clientRef, { latest_weight_kg: row.weightKg, latest_weight_date: date }, { merge: true });
  } catch (error) {
    console.warn('[AirFit] logWeight Firebase error:', error);
    // Fallback to localStorage
    const key = localWeightKey(clientId);
    const rows = readLocalList(key);
    rows.unshift(row);
    writeLocalList(key, rows);
  }

  return getWeightLogs(clientId);
}

export async function getWeightLogs(clientId) {
  if (!isFirebaseConfigured || !clientId) {
    return readLocalList(localWeightKey(clientId));
  }

  try {
    const logsRef = collection(db, 'clients', clientId, 'weight_logs');
    const q = query(logsRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => {
      const row = docSnap.data();
      return {
        weightKg: Number(row.weight_kg || 0),
        logDate: row.log_date,
        createdAt: row.created_at,
      };
    });
  } catch (error) {
    console.warn('[AirFit] getWeightLogs error (possibly missing index), falling back:', error);
    return [];
  }
}
