export function parseWorkoutPlan(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;

  try {
    let parsed = JSON.parse(raw);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return parsed;
  } catch (error) {
    console.error('Failed to parse workout plan:', error);
    return null;
  }
}

export function normalizePlanType(planType) {
  const lower = String(planType || '').toLowerCase();
  return lower.includes('diet') ? 'diet' : 'workout';
}

export function planTypeLabel(planType) {
  return normalizePlanType(planType) === 'diet' ? 'Diet Plan' : 'Workout Plan';
}

