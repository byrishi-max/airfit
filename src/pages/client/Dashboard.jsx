import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import QuestionnaireForm from '../../components/client/QuestionnaireForm';
import WeeklyChart from '../../components/client/WeeklyChart';
import DayTabs from '../../components/client/DayTabs';
import ExerciseCard from '../../components/client/ExerciseCard';
import CalorieTracker from '../../components/client/CalorieTracker';
import { getClient, saveClient, logExerciseWeight } from '../../utils/storage';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = ({ user, onLogout }) => {
  const [client, setClient] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setClient(getClient(user.phone));
  }, [user, navigate]);

  const handleQuestionnaireSubmit = (data) => {
    const updatedClient = {
      ...client,
      performanceProfile: data,
      planStatus: 'active', // In a real app, this would trigger an AI generation on backend
      workoutPlan: {
        exercises: [
          { name: 'Front Squat', sets: 4, reps: '10' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '12' },
          { name: 'Bicep Curls', sets: 3, reps: '15' },
          { name: 'Plank', sets: 3, reps: '60s' }
        ]
      }
    };
    saveClient(updatedClient);
    setClient(updatedClient);
  };

  const handleLogWeight = (exerciseName, weight) => {
    logExerciseWeight(client.clientId, exerciseName, weight);
    setClient(getClient(client.phone)); // Refresh local state
  };

  if (!client) return null;

  const mockProgress = [
    { day: 'M', weight: '80' },
    { day: 'T', weight: '82' },
    { day: 'W', weight: '81' },
    { day: 'T', weight: '84' },
    { day: 'F', weight: '85' },
    { day: 'S', weight: '0' },
    { day: 'S', weight: '0' }
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans pb-20">
      <Header user={user} onLogout={onLogout} />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full space-y-10">
        
        {!client.performanceProfile ? (
          <QuestionnaireForm onSubmit={handleQuestionnaireSubmit} />
        ) : (
          <div className="space-y-10 animate-in fade-in duration-1000">
            {/* Top Insight */}
            <div className="space-y-2">
               <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">FUEL THE<br/><span className="text-orange-500">MACHINE.</span></h1>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Current Status: Hypertrophy Phase 01</p>
            </div>

            {/* Fuel Management */}
            <div className="space-y-4">
               <h3 className="text-xs font-black text-gray-700 uppercase tracking-[0.2em] ml-1">Fuel Intake</h3>
               <CalorieTracker />
            </div>

            {/* Performance Snapshot */}
            <div className="space-y-4">
               <h3 className="text-xs font-black text-gray-700 uppercase tracking-[0.2em] ml-1">Performance Data</h3>
               <WeeklyChart logs={mockProgress} />
            </div>

            {/* Daily Routine */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-[0.2em] ml-1">Workload Execution</h3>
                <span className="text-orange-500 text-xs font-black uppercase italic">Day {activeDay + 1} Selected</span>
              </div>
              
              <DayTabs activeDay={activeDay} onChange={setActiveDay} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.workoutPlan?.exercises.map((ex, i) => (
                  <ExerciseCard 
                    key={i} 
                    exercise={ex} 
                    onLog={handleLogWeight}
                    initialWeight={client.performanceData?.[ex.name]?.[0]?.weight}
                  />
                ))}
              </div>
            </div>

            {/* Quote/Motivation */}
            <div className="pt-10 border-t border-gray-900 text-center">
               <p className="text-gray-800 font-bold italic">"Excellence is not a singular act, but a habit. You are what you repeatedly do."</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ClientDashboard;
