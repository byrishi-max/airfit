export const STORAGE_KEYS = {
  ADMIN_SESSION: 'airfit_admin_session',
  CLIENT_SESSION: 'airfit_client_session',
  CLIENTS: 'airfit_clients',
  PROGRESS: (clientId, week, day, exercise) => `airfit_progress_${clientId}_w${week}_${day}_${exercise}`,
  CALORIES: (clientId, date) => `airfit_calories_${clientId}_${date}`
};

export const getAdminSession = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION));
export const getClientSession = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENT_SESSION));

export const setAdminSession = (session) => localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
export const setClientSession = (session) => localStorage.setItem(STORAGE_KEYS.CLIENT_SESSION, JSON.stringify(session));

export const clearSessions = () => {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  localStorage.removeItem(STORAGE_KEYS.CLIENT_SESSION);
};


export const getClients = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
};

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

export const findClientByPhone = (phone) => {
  const clients = getClients();
  return clients.find(c => c.phone === phone);
};

export const findClientById = (clientId) => {
  const clients = getClients();
  return clients.find(c => c.clientId === clientId);
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
  const logs = JSON.parse(localStorage.getItem(key) || '[]');
  logs.push({ food, calories: Number(calories), time: new Date().toLocaleTimeString() });
  localStorage.setItem(key, JSON.stringify(logs));
};

export const getDailyCalories = (clientId) => {
  const date = new Date().toISOString().split('T')[0];
  const key = STORAGE_KEYS.CALORIES(clientId, date);
  return JSON.parse(localStorage.getItem(key) || '[]');
};

export const getProgress = (clientId, week, day, exercise) => {
  const key = STORAGE_KEYS.PROGRESS(clientId, week, day, exercise);
  return localStorage.getItem(key) === 'true';
};

export const setProgress = (clientId, week, day, exercise, completed) => {
  const key = STORAGE_KEYS.PROGRESS(clientId, week, day, exercise);
  localStorage.setItem(key, String(completed));
};
