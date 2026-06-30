import { supabase } from './supabaseClient';

export const STORAGE_KEYS = {
  ADMIN_SESSION: 'airfit_admin_session',
  CLIENT_SESSION: 'airfit_client_session',
};

// ─── Local Auth Session ──────────────────────────────────────────────
const safeRead = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

export const getAdminSession = () => safeRead(STORAGE_KEYS.ADMIN_SESSION);
export const getClientSession = () => safeRead(STORAGE_KEYS.CLIENT_SESSION);

export const setAdminSession = (session) => localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
export const setClientSession = (session) => localStorage.setItem(STORAGE_KEYS.CLIENT_SESSION, JSON.stringify(session));

export const clearSessions = () => {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  localStorage.removeItem(STORAGE_KEYS.CLIENT_SESSION);
};

// ─── Supabase Client Operations ───────────────────────────────────────

export const getClients = async () => {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return data.map(normalizeClient);
};

export const createClient = async (name, email, phone) => {
  const newClient = {
    name,
    email: email || '',
    phone,
  };
  const { data, error } = await supabase.from('clients').insert([newClient]).select().single();
  if (error) throw new Error(error.message);
  return normalizeClient(data);
};

const normalizeClient = (data) => ({
  clientId: data.id,
  name: data.name,
  email: data.email,
  phone: data.phone,
  registeredAt: data.created_at,
});

export const findClientByPhone = async (phone) => {
  const { data, error } = await supabase.from('clients').select('*').eq('phone', phone).limit(1).single();
  if (error || !data) return null;
  return normalizeClient(data);
};

export const findClientById = async (clientId) => {
  const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).limit(1).single();
  if (error || !data) return null;
  return normalizeClient(data);
};

export const registerClientRemote = async ({ name, email, phone }) => {
  return createClient(name, email, phone);
};

export const deleteClient = async (clientId) => {
  await supabase.from('clients').delete().eq('id', clientId);
  // Also delete associated plans and metrics automatically if cascading delete is not enabled
  await supabase.from('plans').delete().eq('client_id', clientId);
  await supabase.from('metrics').delete().eq('client_id', clientId);
};

// Alias used by App.jsx and ClientDashboard
export const getClient = findClientByPhone;

// Metrics logging using Supabase 
export const logDailyCalories = async (clientId, food, calories) => {
  const date = new Date().toISOString().split('T')[0];
  const { error } = await supabase.from('metrics').insert([{
    client_id: clientId,
    calories: Number(calories),
    date: date,
    metadata: { food, time: new Date().toLocaleTimeString() }
  }]);
  if (error) console.error('Error logging calories:', error);
};

export const getDailyCalories = async (clientId) => {
  const date = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('metrics').select('*').eq('client_id', clientId).eq('date', date).not('calories', 'is', null);
  if (error) return [];
  return data.map(d => ({ food: d.metadata?.food, calories: d.calories, time: d.metadata?.time }));
};

// Store progress marks using Supabase metrics table
export const setProgress = async (clientId, week, day, exercise, completed) => {
  const exerciseId = `w${week}_${day}_${exercise}`;
  if (completed) {
    await supabase.from('metrics').insert([{
      client_id: clientId,
      date: new Date().toISOString().split('T')[0],
      metadata: { type: 'exercise_completion', exerciseId }
    }]);
  } else {
    // If not completed, we might want to delete the record, but this is a simplified append-only logic
  }
};

