export const getClients = () => {
    const data = localStorage.getItem('airfit_clients');
    return data ? JSON.parse(data) : [];
};

export const saveClients = (clients) => {
    localStorage.setItem('airfit_clients', JSON.stringify(clients));
};

export const getClientByPhone = (phone) => {
    const clients = getClients();
    return clients.find(c => c.phone === phone);
};

export const getClientById = (clientId) => {
    const clients = getClients();
    return clients.find(c => c.clientId === clientId);
};

export const createClient = (name, email, phone) => {
    const clients = getClients();
    const newClient = {
        clientId: "client_" + Date.now(),
        name,
        email,
        phone,
        status: "invited",
        planStatus: "none",
        workoutPlan: null,
        dietPlan: null,
        progress: {},
        createdAt: new Date().toISOString()
    };
    clients.push(newClient);
    saveClients(clients);
    return newClient;
};

// Admin Session
export const getAdminSession = () => localStorage.getItem('airfit_admin_session') === 'true';
export const setAdminSession = () => localStorage.setItem('airfit_admin_session', 'true');
export const clearAdminSession = () => localStorage.removeItem('airfit_admin_session');

// Client Session
export const getClientSession = () => {
    const data = localStorage.getItem('airfit_client_session');
    return data ? JSON.parse(data) : null;
};
export const setClientSession = (session) => {
    localStorage.setItem('airfit_client_session', JSON.stringify(session));
};
export const clearClientSession = () => {
    localStorage.removeItem('airfit_client_session');
};

// Progress
export const getProgress = (clientId, week, day, exerciseName) => {
    return localStorage.getItem(`airfit_progress_${clientId}_w${week}_${day}_${exerciseName}`) === 'true';
};

export const setProgress = (clientId, week, day, exerciseName, val) => {
    localStorage.setItem(`airfit_progress_${clientId}_w${week}_${day}_${exerciseName}`, String(val));
};
