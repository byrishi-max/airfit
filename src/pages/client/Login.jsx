import React, { useState } from 'react';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

const ClientLogin = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin(phone)) {
      navigate('/dashboard');
    } else {
      setError('Access Code / Phone not identified in our roster.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
             <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Member Entrance</div>
             <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">RECLAIM YOUR<br/><span className="text-orange-500">EDGE.</span></h1>
             <p className="text-gray-500 font-medium max-w-xs mx-auto">Enter your registered mobile number to access your custom performance blueprint.</p>
          </div>

          <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Phone Identification</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">+91</span>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-2xl pl-14 pr-4 py-5 text-white text-lg font-bold focus:outline-none focus:border-orange-500 transition-all placeholder-gray-800"
                    placeholder="90000 00000"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest bg-red-500/10 py-2 rounded-lg">{error}</p>}

              <Button type="submit" className="w-full py-5 rounded-2xl text-lg shadow-2xl shadow-orange-500/20">Initialize Access</Button>
            </form>
          </div>

          <div className="text-center">
            <p className="text-gray-700 text-xs font-bold uppercase tracking-widest">Powered by AIRFIT Neural Engine v2.4</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
