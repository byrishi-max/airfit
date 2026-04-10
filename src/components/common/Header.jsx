import React from 'react';

const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-black/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-black text-white italic tracking-tighter">
            AIRFIT<span className="text-orange-500">.</span>
          </span>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400 font-medium">
              Hello, {user.name || user.username}
            </span>
            <button 
              onClick={onLogout}
              className="text-xs font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
