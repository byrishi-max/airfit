// Central config — all API URLs read from .env variables
const N8N_BASE = process.env.REACT_APP_N8N_BASE || 'https://airfitgym.app.n8n.cloud/webhook';

export const ENDPOINTS = {
    SUBMIT_PLAN: `${N8N_BASE}/airfit-gym-diet`,
    GET_PLAN: `${N8N_BASE}/airfit-get-plan`,
    PLAN_READY: `${N8N_BASE}/airfit-plan-ready`,
    INVITE: `${N8N_BASE}/airfit-invite`,
};

// Always use the live origin so invite emails point to the correct deployment
export const APP_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.REACT_APP_URL || 'https://airfit.vercel.app');
