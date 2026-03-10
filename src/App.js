import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ClientLogin from './pages/ClientLogin';
import ClientDashboard from './pages/ClientDashboard';
import WaitingScreen from './pages/WaitingScreen';
import WorkoutPlanView from './pages/WorkoutPlanView';
import ProgressDashboard from './pages/ProgressDashboard';
import { getAdminSession, getClientSession } from './utils/storage';

function ProtectedAdmin({ children }) {
  const session = getAdminSession();
  return session ? children : <Navigate to="/admin/login" replace />;
}

function ProtectedClient({ children }) {
  const session = getClientSession();
  return session ? children : <Navigate to="/client/login" replace />;
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unexpected error" };
  }

  componentDidCatch(error, info) {
    console.error("Airfit app crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#0C0C0C", color: "#F0EDE8", fontFamily: "system-ui, sans-serif",
          textAlign: "center", padding: "24px",
        }}>
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ opacity: 0.8, marginBottom: 4 }}>The AirFit app crashed while loading.</p>
            <p style={{ fontSize: 13, opacity: 0.7 }}>{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/client/login" replace />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <ProtectedAdmin><AdminDashboard /></ProtectedAdmin>
          } />

          {/* Client routes */}
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/client/dashboard" element={
            <ProtectedClient><ClientDashboard /></ProtectedClient>
          } />
          <Route path="/client/waiting" element={
            <ProtectedClient><WaitingScreen /></ProtectedClient>
          } />
          <Route path="/client/plan" element={
            <ProtectedClient><WorkoutPlanView /></ProtectedClient>
          } />
          <Route path="/client/progress" element={
            <ProtectedClient><ProgressDashboard /></ProtectedClient>
          } />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
