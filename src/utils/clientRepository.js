import { createClient as createLocalClient, findClientByPhone, getClients, registerClientRemote, saveClient, saveClients } from './storage';
import { isSupabaseConfigured, supabaseRequest } from './supabaseClient';
import { getPlansForClient } from './planRepository';

const mapClientFromSupabase = (row, plans = []) => {
  const workoutPlan = plans.find(plan => plan.plan_type === 'workout');
  const dietPlan = plans.find(plan => plan.plan_type === 'diet');
  const readyPlan = workoutPlan?.status === 'ready' ? workoutPlan : dietPlan?.status === 'ready' ? dietPlan : null;
  const pendingPlan = plans.find(plan => plan.status === 'pending' || plan.status === 'processing');

  return {
    clientId: row.client_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    planStatus: readyPlan ? 'ready' : pendingPlan ? 'pending' : row.plan_status || 'none',
    workoutPlan: workoutPlan?.workout_json || null,
    dietPlan: dietPlan?.diet_html || null,
    workoutStatus: workoutPlan?.status || 'none',
    dietStatus: dietPlan?.status || 'none',
    generatedAt: readyPlan?.generated_at || '',
    registeredAt: row.created_at,
  };
};

function isUniqueError(error) {
  return error?.status === 409 || String(error?.body || error?.message || '').includes('duplicate key');
}

export async function listClients() {
  if (!isSupabaseConfigured) {
    return getClients();
  }

  const rows = await supabaseRequest('clients?select=*&order=created_at.desc');
  const clients = await Promise.all((rows || []).map(async (row) => {
    const plans = await getPlansForClient(row.client_id).catch(() => []);
    return mapClientFromSupabase(row, plans);
  }));
  saveClients(clients);
  return clients;
}

export async function findClientByPhoneRemote(phone) {
  if (!isSupabaseConfigured) {
    return findClientByPhone(phone);
  }

  const rows = await supabaseRequest(`clients?phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`);
  const row = rows?.[0];
  if (!row) return null;
  const plans = await getPlansForClient(row.client_id).catch(() => []);
  const client = mapClientFromSupabase(row, plans);
  saveClient(client);
  return client;
}

export async function createClientRecord({ name, email, phone }) {
  const clientId = `af_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  if (!isSupabaseConfigured) {
    const localClients = getClients();
    if (localClients.some(client => client.email?.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already exists');
    }
    if (localClients.some(client => client.phone === phone)) {
      throw new Error('Phone number already exists');
    }
    const localClient = createLocalClient(name, email, phone);
    await registerClientRemote(localClient).catch(() => null);
    return localClient;
  }

  const existingEmail = await supabaseRequest(`clients?email=eq.${encodeURIComponent(email)}&select=client_id&limit=1`);
  if (existingEmail?.length) throw new Error('Email already exists');

  const existingPhone = await supabaseRequest(`clients?phone=eq.${encodeURIComponent(phone)}&select=client_id&limit=1`);
  if (existingPhone?.length) throw new Error('Phone number already exists');

  try {
    const rows = await supabaseRequest('clients?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        client_id: clientId,
        name,
        email,
        phone,
        plan_status: 'none',
      }),
    });
    const client = mapClientFromSupabase(rows[0], []);
    saveClient(client);
    await registerClientRemote(client).catch(() => null);
    return client;
  } catch (error) {
    if (isUniqueError(error)) {
      const message = String(error.body || error.message).includes('phone') ? 'Phone number already exists' : 'Email already exists';
      throw new Error(message);
    }
    throw error;
  }
}

export async function updateClientPlanStatus(clientId, planStatus) {
  if (!isSupabaseConfigured) return null;

  return supabaseRequest(`clients?client_id=eq.${encodeURIComponent(clientId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ plan_status: planStatus, updated_at: new Date().toISOString() }),
  });
}

export async function deleteClientRecord(clientId) {
  if (!isSupabaseConfigured) {
    return null;
  }

  return supabaseRequest(`clients?client_id=eq.${encodeURIComponent(clientId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
}
