
import React from 'react';
import { SparklesIcon as Sparkles, RocketIcon as Rocket, Settings01Icon as Construction } from 'hugeicons-react';
import { Gamepad2, Hammer } from 'lucide-react';
import StudentPageHeader from '../components/StudentPageHeader.tsx';

interface LearningZoneProps {
  profile?: any;
  currentClass?: any;
}

// --- Custom 3D Icons ---

const IconDefs = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <filter id="game-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
      </filter>
      <linearGradient id="glass-shine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="white" stopOpacity="0.4" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="purple-grad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#8B5CF6"/>
          <stop offset="1" stopColor="#6D28D9"/>
      </linearGradient>
    </defs>
  </svg>
);

const GamesThemeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g filter="url(#game-shadow)">
       <rect x="35" y="50" width="130" height="100" rx="25" fill="url(#purple-grad)" />
       <rect x="35" y="50" width="130" height="100" rx="25" fill="url(#glass-shine)" />
       
       {/* Screen Area */}
       <circle cx="70" cy="100" r="15" fill="#F5F3FF" opacity="0.5" />
       <rect x="65" y="85" width="10" height="30" rx="2" fill="#5B21B6" />
       <rect x="55" y="95" width="30" height="10" rx="2" fill="#5B21B6" />
       
       {/* Buttons Right */}
       <circle cx="120" cy="100" r="8" fill="#FCD34D" stroke="#B45309" strokeWidth="1"/>
       <circle cx="140" cy="90" r="8" fill="#F87171" stroke="#991B1B" strokeWidth="1"/>
       <circle cx="140" cy="110" r="8" fill="#34D399" stroke="#047857" strokeWidth="1"/>
    </g>
  </svg>
);

const LearningZone: React.FC<LearningZoneProps> = ({ profile, currentClass }) => {
  
  return (
    <div className="pb-24 animate-in fade-in duration-500 min-h-screen">
        
        <IconDefs />

        {/* Header */}
        <StudentPageHeader profile={profile} currentClass={currentClass} title="Games" subtitle="Play & Learn" />

        {/* BANNER SECTION (Purple/Indigo for Fun/Magic) */}
        <div className="px-4 lg:px-8 mb-6">
            <div className="w-full h-40 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2rem] shadow-xl shadow-purple-200 flex items-center justify-between relative overflow-hidden p-8 group pt-8">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                
                <div className="relative z-10 flex-1">
                    <div className="inline-flex items-center gap-2 bg-white/20 dark:bg-[#1e293b]/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 mb-3 shadow-sm">
                        <Sparkles size={12} className="text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Arcade</span>
                    </div>
                    <h2 className="text-3xl font-black text-white leading-none tracking-tight mb-1">Game<br/>Zone</h2>
                    <p className="text-purple-100 text-xs font-medium opacity-90 mt-2">Level up your skills.</p>
                </div>
                
                {/* Floating 3D Icon */}
                <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                    <div className="w-24 h-24 bg-white/10 dark:bg-[#1e293b]/10 backdrop-blur-md rounded-[1.5rem] border border-white/20 flex items-center justify-center shadow-xl">
                        <GamesThemeIcon className="w-20 h-20 drop-shadow-2xl" />
                    </div>
                </div>
            </div>
        </div>

        <div className="px-4 lg:px-8">
            {/* --- MAIN BASE CARD --- */}
            <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 border border-slate-200 dark:border-[#1e293b] shadow-xl relative min-h-[500px] flex flex-col items-center justify-center text-center">
                
                <div className="w-32 h-32 bg-slate-50 dark:bg-[#0f172a] rounded-full flex items-center justify-center mb-8 border-[6px] border-slate-100 dark:border-[#334155] shadow-inner relative">
                    <Gamepad2 size={64} className="text-slate-300" />
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-full border-4 border-white shadow-lg">
                        <Rocket size={20} />
                    </div>
                </div>

                <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">Coming Soon</h2>
                
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed mb-8">
                    We are building an exciting arcade for you! Get ready for fun educational games, global leaderboards, and rewards.
                </p>

                <div className="flex gap-2">
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest">English</span>
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest">Math</span>
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest">Science</span>
                </div>

                <div className="mt-12 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    <Construction size={14} /> Under Construction
                </div>

            </div>
        </div>
    </div>
  );
};

export default LearningZone;
