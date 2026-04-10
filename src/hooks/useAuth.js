import { useState, useEffect } from 'react';
import {
  findClientByPhone,
  setAdminSession,
  setClientSession,
  clearSessions,
  getAdminSession,
  getClientSession,
} from '../utils/storage';

export const useAuth = () => {
  const [admin, setAdmin] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminSession = getAdminSession();
    const clientSession = getClientSession();
    if (adminSession) setAdmin(adminSession);
    if (clientSession) setClient(clientSession);
    setLoading(false);
  }, []);

  // Single-arg login used by AdminLogin.jsx: login(password)
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

  // Two-arg login kept for backwards compatibility
  const loginAdmin = (username, password) => {
    if (username === 'ADMIN' && password === 'AIRFIT2025') {
      const session = { username, role: 'admin' };
      setAdminSession(session);
      setAdmin(session);
      return true;
    }
    return false;
  };

  const loginClient = (phone) => {
    const foundClient = findClientByPhone(phone);
    if (foundClient) {
      setClientSession(foundClient);
      setClient(foundClient);
      return true;
    }
    return false;
  };

  const logout = () => {
    clearSessions();
    setAdmin(null);
    setClient(null);
  };

  return { admin, client, loading, login, loginAdmin, loginClient, logout };
};

export const useClientAuth = useAuth;
export const useAdminAuth = useAuth;
