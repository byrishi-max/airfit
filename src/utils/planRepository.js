import { supabase } from './supabaseClient';
import { parseWorkoutPlan, normalizePlanType } from './planUtils';
import { ENDPOINTS } from './config';

export async function getPlansForClient(clientId) {
  if (!clientId) return {};

  const { data, error } = await supabase.from('plans').select('*').eq('client_id', clientId);
  if (error || !data) return {};

  const workout = data.find(p => p.type === 'Workout Plan' || p.type === 'workout');
  const diet = data.find(p => p.type === 'Diet Plan' || p.type === 'diet');

  const ready = data.some(p => p.status === 'ready');
  const pending = data.some(p => p.status === 'pending');

  return {
    workoutPlan: workout?.content ? parseWorkoutPlan(workout.content) : null,
    dietPlan: diet?.content || null,
    workoutStatus: workout?.status || 'none',
    dietStatus: diet?.status || 'none',
    workoutGeneratedAt: workout?.generated_at || null,
    dietGeneratedAt: diet?.generated_at || null,
    planStatus: ready ? 'ready' : pending ? 'pending' : 'none',
  };
}

export async function getClientPlans(clientId) {
  const plans = await getPlansForClient(clientId);
  return {
    workoutPlan: plans.workoutPlan || null,
    dietPlan: plans.dietPlan || null,
    workoutStatus: plans.workoutStatus || 'none',
    dietStatus: plans.dietStatus || 'none',
    workoutGeneratedAt: plans.workoutGeneratedAt || null,
    dietGeneratedAt: plans.dietGeneratedAt || null,
    planStatus: plans.planStatus || 'none',
  };
}

export async function markPlanPending(clientId, planType) {
  if (!clientId) return null;
  const normalized = normalizePlanType(planType);
  const typeStr = normalized === 'diet' ? 'Diet Plan' : 'Workout Plan';
  
  const { data, error } = await supabase.from('plans').upsert({
    client_id: clientId,
    type: typeStr,
    status: 'pending',
  }, { onConflict: 'client_id, type' }).select().single();
  
  if (error) console.warn('[AirFit] Remote pending state skipped:', error);
  return data;
}

export async function saveGeneratedPlan(clientId, data) {
  // This is usually called by the webhook from n8n.
  // But if the frontend calls it:
  if (!clientId) return null;

  const normalized = normalizePlanType(data.planType || (data.isDiet ? 'diet' : 'workout'));
  const typeStr = normalized === 'diet' ? 'Diet Plan' : 'Workout Plan';
  const content = normalized === 'diet' ? (data.dietHtml || data.planHtml) : (data.workoutJson ? parseWorkoutPlan(data.workoutJson) : null);

  const { error } = await supabase.from('plans').upsert({
    client_id: clientId,
    type: typeStr,
    content: content,
    status: 'ready',
    generated_at: new Date().toISOString()
  }, { onConflict: 'client_id, type' });

  if (error) {
    console.warn('[AirFit] Remote plan save failed:', error);
    return null;
  }
  return true;
}
