import { parseWorkoutPlan, normalizePlanType } from './planUtils';
import { isFirebaseConfigured, db, toIsoNow } from './firebaseClient';
import { collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { withTimeout } from './async';

export async function getPlansForClient(clientId) {
  if (!isFirebaseConfigured || !clientId) return [];
  
  const plansRef = collection(db, 'clients', clientId, 'plans');
  const q = query(plansRef, orderBy('updated_at', 'desc'));
  const snapshot = await withTimeout(getDocs(q), 12000, 'Firebase plan list');
  return snapshot.docs.map(docSnap => docSnap.data());
}

export async function getClientPlans(clientId) {
  const rows = await getPlansForClient(clientId);
  const workout = rows.find(row => row.plan_type === 'workout');
  const diet = rows.find(row => row.plan_type === 'diet');
  return {
    workoutPlan: parseWorkoutPlan(workout?.workout_json),
    dietPlan: diet?.diet_html || null,
    workoutStatus: workout?.status || 'none',
    dietStatus: diet?.status || 'none',
    workoutGeneratedAt: workout?.generated_at || workout?.created_at || null,
    dietGeneratedAt: diet?.generated_at || diet?.created_at || null,
    planStatus: workout?.status === 'ready' || diet?.status === 'ready'
      ? 'ready'
      : rows.some(row => row.status === 'pending' || row.status === 'processing')
        ? 'pending'
        : 'none',
  };
}

export async function markPlanPending(clientId, planType) {
  if (!isFirebaseConfigured || !clientId) return null;

  const normalized = normalizePlanType(planType);
  const planRef = doc(db, 'clients', clientId, 'plans', normalized);
  
  return withTimeout(setDoc(planRef, {
    client_id: clientId,
    plan_type: normalized,
    status: 'pending',
    updated_at: toIsoNow(),
  }, { merge: true }), 12000, 'Firebase mark plan pending');
}

export async function saveGeneratedPlan(clientId, data) {
  if (!isFirebaseConfigured || !clientId) return null;

  const normalized = normalizePlanType(data.planType || (data.isDiet ? 'diet' : 'workout'));
  const promises = [];

  if (data.workoutJson || normalized === 'workout') {
    const workoutRef = doc(db, 'clients', clientId, 'plans', 'workout');
    promises.push(withTimeout(setDoc(workoutRef, {
      client_id: clientId,
      plan_type: 'workout',
      status: 'ready',
      workout_json: parseWorkoutPlan(data.workoutJson),
      diet_html: null,
      generated_at: data.generatedAt || toIsoNow(),
      updated_at: toIsoNow(),
    }, { merge: true }), 12000, 'Firebase save workout plan'));
  }

  if (data.dietHtml || normalized === 'diet') {
    const dietRef = doc(db, 'clients', clientId, 'plans', 'diet');
    promises.push(withTimeout(setDoc(dietRef, {
      client_id: clientId,
      plan_type: 'diet',
      status: 'ready',
      workout_json: null,
      diet_html: data.dietHtml || null,
      generated_at: data.generatedAt || toIsoNow(),
      updated_at: toIsoNow(),
    }, { merge: true }), 12000, 'Firebase save diet plan'));
  }

  if (!promises.length) return null;

  return Promise.all(promises);
}
