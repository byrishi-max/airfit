import React from 'react';

const WeeklyChart = ({ logs }) => {
  // Simple representation of workload
  const maxWeight = Math.max(...logs.map(l => parseFloat(l.weight) || 0), 10);
  
  return (
    <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 space-y-6">
      <div className="flex justify-between items-end h-40 space-x-2">
        {logs.map((log, idx) => {
          const height = log.weight ? (parseFloat(log.weight) / maxWeight) * 100 : 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center space-y-2 group">
              <div 
                className="w-full bg-orange-500/20 rounded-t-lg relative overflow-hidden flex items-end justify-center transition-all duration-500 hover:bg-orange-500/30" 
                style={{ height: '100%' }}
              >
                <div 
                  className="w-full bg-orange-500 rounded-t-lg transition-all duration-700 delay-100 ease-out flex items-center justify-center"
                  style={{ height: `${height}%` }}
                >
                  {log.weight && <span className="text-[10px] font-black text-white -rotate-90 md:rotate-0 mb-2">{log.weight}</span>}
                </div>
              </div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{log.day}</span>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-800">
         <div>
            <span className="text-gray-500 text-xs font-bold block">Current Cycle</span>
            <span className="text-white text-lg font-black uppercase tracking-tight italic">Week 1 Progression</span>
         </div>
         <div className="text-right">
            <span className="text-orange-500 text-2xl font-black italic tracking-tighter">+12%</span>
            <span className="text-gray-500 text-xs font-bold block leading-none">Power Output</span>
         </div>
      </div>
    </div>
  );
};

export default WeeklyChart;
