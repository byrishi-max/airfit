import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';

// Pages
import Landing from './pages/Landing';
import ClientLogin from './pages/client/Login';
import ClientDashboard from './pages/client/Dashboard';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';

// Mock Auth logic
import { getClient } from './utils/storage';

function App() {
  const [user, setUser] = useState(null); // { type: 'client' | 'admin', phone?: string, username?: string }

  // Persist session
  useEffect(() => {
    const savedUser = localStorage.getItem('airfit_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleClientLogin = (phone) => {
    const client = getClient(phone);
    if (client) {
      const userData = { type: 'client', ...client };
      setUser(userData);
      localStorage.setItem('airfit_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const handleAdminLogin = (username, password) => {
    if (username === 'ADMIN' && password === 'AIRFIT2025') {
      const userData = { type: 'admin', username };
      setUser(userData);
      localStorage.setItem('airfit_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('airfit_user');
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      
      {/* Client Routes */}
      <Route path="/login" element={<ClientLogin onLogin={handleClientLogin} />} />
      <Route 
        path="/dashboard" 
        element={user?.type === 'client' ? <ClientDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
      />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin onLogin={handleAdminLogin} />} />
      <Route 
        path="/admin/dashboard" 
        element={user?.type === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/admin/login" />} 
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
