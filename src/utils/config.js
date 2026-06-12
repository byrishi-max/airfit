// Central config — all API URLs read from .env variables
const N8N_BASE = process.env.REACT_APP_N8N_BASE;

export const ENDPOINTS = {
    SUBMIT_PLAN:     `${N8N_BASE}/airfit-gym-diet`,
    GET_PLAN:        `${N8N_BASE}/airfit-get-plan`,
    PLAN_READY:      `${N8N_BASE}/airfit-plan-ready`,
    INVITE:          `${N8N_BASE}/airfit-invite`,
    GET_CLIENTS:     `${N8N_BASE}/airfit-get-clients`,
    VERIFY_CLIENT:   `${N8N_BASE}/airfit-verify-client`,   // GET ?phone=xxx or ?clientId=xxx
    REGISTER_CLIENT: `${N8N_BASE}/airfit-register-client`, // POST { clientId, name, email, phone }
};

export const APP_URL =
    process.env.REACT_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://airfitworkout.vercel.app');
