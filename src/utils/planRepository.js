import { parseWorkoutPlan, normalizePlanType } from './planUtils';
import { isSupabaseConfigured, supabaseRequest } from './supabaseClient';

export async function getPlansForClient(clientId) {
  if (!isSupabaseConfigured || !clientId) return [];
  return supabaseRequest(`plans?client_id=eq.${encodeURIComponent(clientId)}&select=*&order=updated_at.desc`);
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
    planStatus: workout?.status === 'ready' || diet?.status === 'ready'
      ? 'ready'
      : rows.some(row => row.status === 'pending' || row.status === 'processing')
        ? 'pending'
        : 'none',
  };
}

export async function markPlanPending(clientId, planType) {
  if (!isSupabaseConfigured || !clientId) return null;

  const normalized = normalizePlanType(planType);
  return supabaseRequest('plans?on_conflict=client_id,plan_type', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      client_id: clientId,
      plan_type: normalized,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function saveGeneratedPlan(clientId, data) {
  if (!isSupabaseConfigured || !clientId) return null;

  const normalized = normalizePlanType(data.planType || (data.isDiet ? 'diet' : 'workout'));
  const rows = [];

  if (data.workoutJson || normalized === 'workout') {
    rows.push({
      client_id: clientId,
      plan_type: 'workout',
      status: 'ready',
      workout_json: parseWorkoutPlan(data.workoutJson),
      diet_html: null,
      generated_at: data.generatedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (data.dietHtml || normalized === 'diet') {
    rows.push({
      client_id: clientId,
      plan_type: 'diet',
      status: 'ready',
      workout_json: null,
      diet_html: data.dietHtml || null,
      generated_at: data.generatedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (!rows.length) return null;

  return supabaseRequest('plans?on_conflict=client_id,plan_type', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows),
  });
}
