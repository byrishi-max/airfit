import React from 'react';
import Header from '../components/common/Header';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500 selection:text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full -z-10"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-10">
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-700">
               <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Neural Engine v2.4 Live</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.85]">
              TRAIN WITH<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500">
                INDUSTRIAL STRENGTH.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto tracking-tight">
              The world's most aggressive performance management system for elite athletes. No fluff. Just raw progression.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
            <Button 
                onClick={() => navigate('/login')} 
                className="px-12 py-5 text-xl rounded-2xl shadow-2xl shadow-orange-500/20 transform hover:-translate-y-1"
            >
              ACCESS DASHBOARD
            </Button>
            <button 
                onClick={() => navigate('/admin/login')}
                className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              COACH PORTAL
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 w-full max-w-4xl border-t border-white/5">
             {[
               { label: 'Active Pros', value: '450+' },
               { label: 'Power Gain', value: '18%' },
               { label: 'Uptime', value: '99.9%' },
               { label: 'Fatigue Rec', value: '2.5x' }
             ].map((stat, i) => (
               <div key={i} className="space-y-1">
                 <div className="text-2xl font-black italic text-white">{stat.value}</div>
                 <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{stat.label}</div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 px-4 bg-zinc-950">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
               <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">The Philosophy</span>
               <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">ELIMINATE THE<br/><span className="text-zinc-700">GUESSWORK.</span></h2>
               <p className="text-zinc-500 text-lg leading-relaxed">
                  Most fitness apps focus on social clout. We focus on torque. AIRFIT analyzes your performance profile to generate blueprints that force adaptation.
               </p>
               <ul className="space-y-4">
                  {['Neural Adaptation Protocols', 'Intra-set Fatigue Monitoring', 'Volume Auto-regulation', 'Macro-cycle Precision'].map((item, i) => (
                    <li key={i} className="flex items-center space-x-3 text-white font-bold uppercase tracking-wider text-sm italic">
                       <span className="w-5 h-5 flex items-center justify-center bg-orange-500 text-black text-[10px] rounded-sm">✓</span>
                       <span>{item}</span>
                    </li>
                  ))}
               </ul>
            </div>
            <div className="relative group">
               <div className="absolute inset-0 bg-orange-500/20 blur-[80px] rounded-full group-hover:bg-orange-500/30 transition-all"></div>
               <div className="relative bg-zinc-900 aspect-square rounded-[3rem] border border-zinc-800 overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/80"></div>
                  <div className="p-12 space-y-6">
                     <div className="h-2 w-20 bg-orange-500 rounded-full"></div>
                     <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-zinc-800 rounded-full"></div>
                        <div className="h-4 w-1/2 bg-zinc-800 rounded-full"></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-8">
                        <div className="h-32 bg-zinc-800/50 rounded-2xl"></div>
                        <div className="h-32 bg-zinc-800/50 rounded-2xl"></div>
                        <div className="h-32 bg-orange-500/10 border border-orange-500/20 rounded-2xl"></div>
                        <div className="h-32 bg-zinc-800/50 rounded-2xl"></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-zinc-900">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-2xl font-black italic tracking-tighter">AIRFIT<span className="text-orange-500">_</span></div>
            <div className="flex space-x-8 text-[10px] font-black uppercase tracking-widest text-zinc-600">
               <a href="#" className="hover:text-white">Security</a>
               <a href="#" className="hover:text-white">Privacy</a>
               <a href="#" className="hover:text-white">Neural Engine API</a>
               <a href="#" className="hover:text-white">Hardware Integration</a>
            </div>
            <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">© 2025 ALL RIGHTS RESERVED. DOMINANCE IS EARNED.</p>
         </div>
      </footer>
    </div>
  );
};

export default Landing;
