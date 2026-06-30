// Central config — all API URLs read from .env variables
const N8N_BASE = process.env.REACT_APP_N8N_BASE;

export const FIREBASE_CONFIG = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.authDomain &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.appId
);

export const ENDPOINTS = {
    SUBMIT_PLAN:     `${N8N_BASE}/airfit-gym-diet`,
    GET_PLAN:        `${N8N_BASE}/airfit-get-plan`,
    PLAN_READY:      `${N8N_BASE}/airfit-plan-ready`,
    INVITE:          `${N8N_BASE}/airfit-invite`,
    GET_CLIENTS:     `${N8N_BASE}/airfit-get-clients`,
    VERIFY_CLIENT:   `${N8N_BASE}/airfit-verify-client`,   // GET ?phone=xxx or ?clientId=xxx
    REGISTER_CLIENT: `${N8N_BASE}/airfit-register-client`, // POST { clientId, name, email, phone }
    UPDATE_CLIENT:   `${N8N_BASE}/airfit-update-client`,
    SAVE_PROGRESS:   `${N8N_BASE}/airfit-save-progress`,
    GET_PROGRESS:    `${N8N_BASE}/airfit-get-progress`,
    SAVE_DIET_PROGRESS: `${N8N_BASE}/airfit-save-diet-progress`,
    SAVE_CALORIES:   `${N8N_BASE}/airfit-save-calories`,
    GET_CALORIES:    `${N8N_BASE}/airfit-get-calories`,
    SAVE_WATER:      `${N8N_BASE}/airfit-save-water`,
    GET_WATER:       `${N8N_BASE}/airfit-get-water`,
    SAVE_WEIGHT:     `${N8N_BASE}/airfit-save-weight`,
    GET_WEIGHT:      `${N8N_BASE}/airfit-get-weight`,
    DASHBOARD_SUMMARY: `${N8N_BASE}/airfit-dashboard-summary`,
};

export const APP_URL =
    process.env.REACT_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://airfitworkout.vercel.app');
