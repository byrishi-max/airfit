import React, { useState } from 'react';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin(username, password)) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Command Center</h1>
            <p className="text-gray-500 text-sm font-medium">Restricted Access. Credentials Required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="ADMIN"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Access Pass</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center uppercase tracking-widest">{error}</p>}

            <Button type="submit" className="w-full uppercase py-4 shadow-xl shadow-orange-500/10">Authorize Session</Button>
          </form>

          <div className="pt-4 text-center">
             <button onClick={() => navigate('/')} className="text-xs text-gray-600 hover:text-gray-400 font-bold uppercase tracking-widest transition-colors">Return to Base</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
