import React from 'react';

const DayTabs = ({ activeDay, onChange }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex bg-gray-900 rounded-2xl p-1 border border-gray-800 overflow-x-auto no-scrollbar">
      {days.map((day, idx) => (
        <button
          key={day}
          onClick={() => onChange(idx)}
          className={`flex-1 min-w-[60px] py-3 rounded-xl transition-all duration-300 flex flex-col items-center space-y-1 ${
            activeDay === idx 
              ? 'bg-orange-500 text-white shadow-lg' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Day</span>
          <span className="text-sm font-black italic leading-none">{idx + 1}</span>
        </button>
      ))}
    </div>
  );
};

export default DayTabs;
