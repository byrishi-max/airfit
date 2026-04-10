import React, { useState } from 'react';

const ExerciseCard = ({ exercise, onLog, initialWeight = "" }) => {
  const [isLogging, setIsLogging] = useState(false);
  const [weight, setWeight] = useState(initialWeight);

  const handleSave = () => {
    onLog(exercise.name, weight);
    setIsLogging(false);
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4 hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="text-white font-black text-lg uppercase leading-none tracking-tight">{exercise.name}</h4>
          <p className="text-orange-500 font-black text-xs uppercase tracking-widest">
            {exercise.sets} Sets × {exercise.reps}
          </p>
        </div>
        <div className="bg-black/50 px-3 py-1.5 rounded-lg border border-gray-800">
           <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block">Last Weight</span>
           <span className="text-white font-black text-xs">{weight ? `${weight} kg` : '--'}</span>
        </div>
      </div>

      {!isLogging ? (
        <button 
          onClick={() => setIsLogging(true)}
          className="w-full py-3 bg-black border border-gray-800 rounded-xl text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-gray-800 hover:text-white transition-all"
        >
          {weight ? 'Update Progress' : 'Log Performance'}
        </button>
      ) : (
        <div className="flex space-x-2 animate-in slide-in-from-top-2 duration-300">
          <input 
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="KG"
            autoFocus
            className="flex-1 bg-black border border-orange-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
          />
          <button 
            onClick={handleSave}
            className="px-6 bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;
