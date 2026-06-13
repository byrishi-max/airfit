import { useState, useEffect } from 'react';
import {
  setAdminSession,
  setClientSession,
  clearSessions,
  getAdminSession,
  getClientSession,
} from '../utils/storage';
import { findClientByPhoneRemote } from '../utils/clientRepository';

export const useAuth = () => {
  const [admin, setAdmin] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const adminSession = getAdminSession();
      const clientSession = getClientSession();
      if (adminSession) setAdmin(adminSession);
      if (clientSession) setClient(clientSession);
    } catch (e) {
      console.warn('[useAuth] Session restore failed — clearing sessions:', e);
      clearSessions();
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin login (password only)
  const login = (password) => {
    const allowed = process.env.REACT_APP_ADMIN_PASSWORD || 'airfitadmin2026';
    if (password === allowed) {
      const session = { username: 'admin', role: 'admin' };
      setAdminSession(session);
      setAdmin(session);
      return true;
    }
    return false;
  };

  // Two-arg admin login (legacy)
  const loginAdmin = (username, password) => {
    if (username === 'ADMIN' && password === 'AIRFIT2025') {
      const session = { username, role: 'admin' };
      setAdminSession(session);
      setAdmin(session);
      return true;
    }
    return false;
  };

  /**
   * loginByPhone — async, looks up client in n8n (cross-device).
   * Returns { success: true, client } or { success: false, error: string }
   */
  const loginByPhone = async (phone) => {
    try {
      const foundClient = await findClientByPhoneRemote(phone);
      if (!foundClient) {
        return { success: false, error: 'Client not found. Please contact your trainer.' };
      }
      setClientSession(foundClient);
      setClient(foundClient);
      return { success: true, client: foundClient };
    } catch (err) {
      console.error('[loginByPhone] error:', err);
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  // Legacy sync alias — now delegates to async loginByPhone
  const loginClient = async (phone) => {
    const result = await loginByPhone(phone);
    return result.success;
  };

  const logout = () => {
    clearSessions();
    setAdmin(null);
    setClient(null);
  };

  return { admin, client, loading, login, loginAdmin, loginClient, loginByPhone, logout };
};

export const useClientAuth = useAuth;
export const useAdminAuth = useAuth;
