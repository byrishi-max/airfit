import { ENDPOINTS } from './config';

export const STORAGE_KEYS = {
  ADMIN_SESSION: 'airfit_admin_session',
  CLIENT_SESSION: 'airfit_client_session',
  CLIENTS: 'airfit_clients',
  PROGRESS: (clientId, week, day, exercise) => `airfit_progress_${clientId}_w${week}_${day}_${exercise}`,
  CALORIES: (clientId, date) => `airfit_calories_${clientId}_${date}`
};

// ─── Safe JSON parser — clears corrupted keys instead of crashing ──────────
const safeRead = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch {
    console.warn(`[storage] Clearing corrupted key: ${key}`);
    localStorage.removeItem(key);
    return fallback;
  }
};

export const getAdminSession  = () => safeRead(STORAGE_KEYS.ADMIN_SESSION);
export const getClientSession = () => safeRead(STORAGE_KEYS.CLIENT_SESSION);

export const setAdminSession = (session) => localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
export const setClientSession = (session) => localStorage.setItem(STORAGE_KEYS.CLIENT_SESSION, JSON.stringify(session));

export const clearSessions = () => {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  localStorage.removeItem(STORAGE_KEYS.CLIENT_SESSION);
};


export const getClients = () => safeRead(STORAGE_KEYS.CLIENTS, []);

export const saveClient = (client) => {
  const clients = getClients();
  const index = clients.findIndex(c => c.clientId === client.clientId);
  if (index !== -1) {
    clients[index] = client;
  } else {
    clients.push(client);
  }
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
};

export const saveClients = (clientsArray) => {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clientsArray));
};

export const createClient = (name, email, phone) => {
  const clientId = `af_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const newClient = {
    clientId,
    name,
    email: email || '',
    phone,
    planStatus: 'none',
    workoutPlan: null,
    dietPlan: null,
    registeredAt: new Date().toISOString(),
  };
  saveClient(newClient);
  return newClient;
};

// ─── Remote client lookup via n8n (cross-device) ──────────────────────────
const normaliseClient = (data) => ({
  clientId:    data.clientId,
  name:        data.name,
  email:       data.email,
  phone:       data.phone,
  planStatus:  data.planStatus || 'none',
  workoutPlan: data.workoutJson || null,
  dietPlan:    data.dietHtml   || null,
  isDiet:      data.isDiet     || false,
  generatedAt: data.generatedAt || '',
});

export const findClientByPhone = async (phone) => {
  try {
    const res = await fetch(
      `${ENDPOINTS.VERIFY_CLIENT}?phone=${encodeURIComponent(phone)}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.found ? normaliseClient(data) : null;
  } catch (err) {
    console.error('[findClientByPhone] Network error:', err);
    return null;
  }
};

export const findClientById = async (clientId) => {
  try {
    const res = await fetch(
      `${ENDPOINTS.VERIFY_CLIENT}?clientId=${encodeURIComponent(clientId)}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.found ? normaliseClient(data) : null;
  } catch (err) {
    console.error('[findClientById] Network error:', err);
    return null;
  }
};

export const registerClientRemote = async ({ clientId, name, email, phone }) => {
  const res = await fetch(ENDPOINTS.REGISTER_CLIENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, name, email, phone }),
  });
  if (!res.ok) throw new Error(`Register failed: ${res.status}`);
  return res.json();
};

export function deleteClient(clientId) {
    const clients = getClients();
    const filtered = clients.filter(c => c.clientId !== clientId);
    localStorage.setItem('airfit_clients', JSON.stringify(filtered));
    
    const deleted = safeRead('deleted_clients', []);
    if (!deleted.includes(clientId)) {
        deleted.push(clientId);
        localStorage.setItem('deleted_clients', JSON.stringify(deleted));
    }
};

// Alias used by App.jsx and ClientDashboard
export const getClient = findClientByPhone;

export const logExerciseWeight = (clientId, exerciseName, weight) => {
  const clients = getClients();
  const idx = clients.findIndex(c => c.clientId === clientId);
  if (idx !== -1) {
    if (!clients[idx].performanceData) clients[idx].performanceData = {};
    if (!clients[idx].performanceData[exerciseName]) clients[idx].performanceData[exerciseName] = [];
    clients[idx].performanceData[exerciseName].unshift({ weight, date: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }
};

export const updateClientStatus = (clientId, status, planData = null) => {
  const clients = getClients();
  const index = clients.findIndex(c => c.clientId === clientId);
  if (index !== -1) {
    clients[index].planStatus = status;
    if (planData) {
      clients[index].workoutPlan = planData;
    }
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }
};

export const logDailyCalories = (clientId, food, calories) => {
  const date = new Date().toISOString().split('T')[0];
  const key = STORAGE_KEYS.CALORIES(clientId, date);
  const logs = safeRead(key, []);
  logs.push({ food, calories: Number(calories), time: new Date().toLocaleTimeString() });
  localStorage.setItem(key, JSON.stringify(logs));
};

export const getDailyCalories = (clientId) => {
  const date = new Date().toISOString().split('T')[0];
  const key = STORAGE_KEYS.CALORIES(clientId, date);
  return safeRead(key, []);
};

export const getProgress = (clientId, week, day, exercise) => {
  const key = STORAGE_KEYS.PROGRESS(clientId, week, day, exercise);
  return localStorage.getItem(key) === 'true';
};

export const setProgress = (clientId, week, day, exercise, completed) => {
  const key = STORAGE_KEYS.PROGRESS(clientId, week, day, exercise);
  localStorage.setItem(key, String(completed));
};
