import { createClient as createLocalClient, findClientByPhone as findClientLocal, getClients, registerClientRemote, deleteClient as deleteLocalClient } from './storage';
import { getPlansForClient } from './planRepository';
import { supabase } from './supabaseClient';

export async function updateClientPlanStatus(clientId, planStatus) {
  try {
    const { error } = await supabase
      .from('clients')
      .update({ plan_status: planStatus })
      .eq('id', clientId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn('[AirFit] Failed to update client plan status', error);
    return false;
  }
}

const normalizeClient = (row = {}, plans = {}) => ({
  clientId: row.clientId || row.client_id || row.id || '',
  name: row.name || row.clientName || row.client_name || '',
  email: row.email || row.clientEmail || row.client_email || '',
  phone: row.phone || row.clientPhone || row.client_phone || '',
  age: row.age || '',
  gender: row.gender || '',
  goal: row.goal || '',
  planStatus: row.planStatus || row.plan_status || plans.planStatus || 'none',
  workoutPlan: row.workoutPlan || row.workoutJson || plans.workoutPlan || null,
  dietPlan: row.dietPlan || row.dietHtml || plans.dietPlan || null,
  workoutStatus: row.workoutStatus || plans.workoutStatus || 'none',
  dietStatus: row.dietStatus || plans.dietStatus || 'none',
  generatedAt: row.generatedAt || row.generated_at || plans.workoutGeneratedAt || plans.dietGeneratedAt || '',
  registeredAt: row.registeredAt || row.created_at || row.createdAt || '',
});

export async function listClients() {
  try {
    const rows = await getClients();
    const clients = await Promise.all(rows.map(async row => {
      const client = normalizeClient(row);
      const plans = client.clientId ? await getPlansForClient(client.clientId).catch(() => ({})) : {};
      return normalizeClient(row, plans);
    }));
    return clients;
  } catch (error) {
    console.warn('[AirFit] Client API unavailable', error);
    return [];
  }
}

export async function findClientByPhoneRemote(phone) {
  try {
    const data = await findClientLocal(phone);
    if (!data) return null;
    const client = normalizeClient(data);
    if (!client.clientId) return null;
    const plans = await getPlansForClient(client.clientId).catch(() => ({}));
    return normalizeClient(data, plans);
  } catch (error) {
    console.warn('[AirFit] Remote client lookup failed:', error);
    return null;
  }
}

export async function createClientRecord({ name, email, phone }) {
  try {
    const data = await registerClientRemote({ name, email, phone });
    return normalizeClient(data);
  } catch (error) {
    throw new Error(error.message || 'Failed to create client');
  }
}

export async function deleteClientRecord(clientId) {
  if (!clientId) return null;
  try {
    await deleteLocalClient(clientId);
    return true;
  } catch (error) {
    console.warn('[AirFit] Remote client delete failed:', error);
    return null;
  }
}

