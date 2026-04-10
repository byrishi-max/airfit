import React, { useState } from 'react';
import Button from '../common/Button';

const QuestionnaireForm = ({ onSubmit }) => {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('intermediate');

  const goals = [
    { id: 'strength', label: 'Bulking & Strength', icon: '🏋️‍♂️' },
    { id: 'weightloss', label: 'Weight Loss', icon: '🏃‍♂️' },
    { id: 'maintenance', label: 'Maintenance', icon: '🤸‍♂️' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-white italic tracking-tighter">THE BLUEPRINT<span className="text-orange-500">.</span></h2>
        <p className="text-gray-500 font-medium">Define your objective and level to unlock your custom plan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((g) => (
          <div
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center space-y-3 ${
              goal === g.id 
                ? 'bg-orange-500 border-orange-500 scale-105 shadow-xl shadow-orange-500/20' 
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            }`}
          >
            <span className="text-4xl">{g.icon}</span>
            <span className={`font-black uppercase tracking-widest text-xs ${goal === g.id ? 'text-white' : 'text-gray-400'}`}>
              {g.label}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 overflow-hidden rounded-2xl border border-gray-800 flex divide-x divide-gray-800">
        {['beginner', 'intermediate', 'advanced'].map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`flex-1 py-4 font-black uppercase tracking-tighter text-xs transition-colors ${
              level === l ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <Button 
        onClick={() => onSubmit({ goal, level })}
        disabled={!goal}
        className="w-full text-lg py-5 shadow-2xl"
      >
        ANALYZE & GENERATE
      </Button>
    </div>
  );
};

export default QuestionnaireForm;
