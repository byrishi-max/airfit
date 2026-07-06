import { getDailyCalories as getLocalDailyCalories, getProgress as getLocalProgress, logDailyCalories as logLocalDailyCalories, setProgress as setLocalProgress } from './storage';
import { isFirebaseConfigured, db, toIsoNow } from './firebaseClient';
import { collection, doc, setDoc, getDocs, query, where, orderBy, addDoc } from 'firebase/firestore';

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

  if (!isFirebaseConfigured) {
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
  const [exerciseSnap, daySnap, monthCaloriesRows, todayCaloriesRows] = await Promise.all([
    getDocs(query(collection(db, 'clients', clientId, 'exercise_progress'), where('week_number', 'in', weekNumbers), where('completed', '==', true))),
    getDocs(query(collection(db, 'clients', clientId, 'day_progress'), where('week_number', 'in', weekNumbers), where('done', '==', true))),
    getDocs(query(collection(db, 'clients', clientId, 'calorie_logs'), where('log_date', '>=', startOfMonthDate()))),
    getCaloriesForDate(clientId),
  ]);

  const exerciseRows = exerciseSnap.docs.map(d => d.data());
  const dayRows = daySnap.docs.map(d => d.data());
  const monthCaloriesData = monthCaloriesRows.docs.map(d => d.data());

  const validCompletedExerciseKeys = new Set();
  exerciseRows.forEach(row => {
    if (!template.exerciseKeys.has(`${row.day_name}::${row.exercise_name}`)) return;
    validCompletedExerciseKeys.add(`${row.week_number}::${row.day_name}::${row.exercise_name}`);
  });

  const currentWeekDone = Array.from(validCompletedExerciseKeys)
    .filter(key => key.startsWith(`${currentWeek}::`)).length;

  const weeklyProgress = await getWeeklyProgress(clientId, currentWeek);
  const todayCalories = (todayCaloriesRows || []).reduce((sum, log) => sum + Number(log.calories || 0), 0);
  const weekCalories = (weeklyProgress?.calories || []).reduce((sum, log) => sum + Number(log.calories || 0), 0);
  const monthCalories = monthCaloriesData.reduce((sum, log) => sum + Number(log.calories || 0), 0);

  return {
    currentWeek,
    currentWeekDone,
    currentWeekTotal: template.exerciseCount,
    monthlyDone: validCompletedExerciseKeys.size,
    monthlyTotal: monthlyExerciseTarget,
    completedDays: dayRows.length,
    totalDays: monthlyDayTarget,
    streak: calculateStreak(dayRows),
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
  if (!isFirebaseConfigured || !clientId) {
    logLocalDailyCalories(clientId, food, calories);
    return getLocalDailyCalories(clientId);
  }

  const logsRef = collection(db, 'clients', clientId, 'calorie_logs');
  await addDoc(logsRef, {
    client_id: clientId,
    log_date: new Date().toISOString().split('T')[0],
    food,
    calories: Number(calories),
    created_at: toIsoNow()
  });
  
  return getCaloriesForDate(clientId);
}

export async function getCaloriesForDate(clientId, date = new Date().toISOString().split('T')[0]) {
  if (!isFirebaseConfigured || !clientId) {
    return getLocalDailyCalories(clientId);
  }

  const logsRef = collection(db, 'clients', clientId, 'calorie_logs');
  const q = query(logsRef, where('log_date', '==', date), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(docSnap => {
    const row = docSnap.data();
    return {
      food: row.food,
      calories: row.calories,
      time: new Date(row.created_at).toLocaleTimeString(),
      createdAt: row.created_at,
    };
  });
}

async function getWeeklyCalories(clientId) {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceDate = since.toISOString().split('T')[0];
  
  const logsRef = collection(db, 'clients', clientId, 'calorie_logs');
  const q = query(logsRef, where('log_date', '>=', sinceDate));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}
