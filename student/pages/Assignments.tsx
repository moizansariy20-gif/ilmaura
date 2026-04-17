
import React from 'react';
import { 
  File01Icon as FileText, 
  Calendar01Icon as Calendar, 
  ArrowRight01Icon as ChevronRight, 
  Clock01Icon as Clock, 
  AlertCircleIcon as AlertCircle, 
  CheckmarkCircle01Icon as CheckCircle2, 
  Bookmark01Icon as Bookmark, 
  ArrowLeft01Icon as ArrowLeft 
} from 'hugeicons-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface AssignmentsProps {
  assignments: any[];
  subjects: any[];
  profile?: any;
  currentClass?: any;
}

// --- Custom 3D Homework Icon (Notebook & Pencil) ---
const HomeworkThemeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <filter id="hw-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="12" stdDeviation="8" floodOpacity="0.25" />
      </filter>
      <linearGradient id="notebook-cover" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="pencil-body" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#FCD34D" />
        <stop offset="0.5" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <g filter="url(#hw-shadow)">
       {/* Notebook Back Cover */}
       <rect x="30" y="30" width="140" height="160" rx="12" fill="#334155" />
       
       {/* Notebook Pages (White) */}
       <rect x="35" y="25" width="130" height="160" rx="8" fill="#F8FAFC" />
       
       {/* Notebook Front Cover (Orange) - Open slightly */}
       <path d="M35 25 H 165 C 169 25 172 28 172 32 V 180 C 172 184 169 187 165 187 H 35 V 25 Z" fill="url(#notebook-cover)" />
       
       {/* Binding Rings */}
       <circle cx="45" cy="40" r="6" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
       <circle cx="45" cy="70" r="6" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
       <circle cx="45" cy="100" r="6" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
       <circle cx="45" cy="130" r="6" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
       <circle cx="45" cy="160" r="6" fill="#94A3B8" stroke="#475569" strokeWidth="2" />

       {/* Label on Notebook */}
       <rect x="70" y="50" width="80" height="30" rx="4" fill="#FFFBEB" stroke="#FCD34D" strokeWidth="2" />
       <rect x="75" y="60" width="50" height="2" rx="1" fill="#CBD5E1" />
       <rect x="75" y="68" width="70" height="2" rx="1" fill="#CBD5E1" />

       {/* 3D Pencil Floating Diagonally */}
       <g transform="translate(140, 140) rotate(-45)">
          {/* Pencil Body */}
          <rect x="-10" y="-60" width="20" height="100" fill="url(#pencil-body)" />
          {/* Eraser */}
          <rect x="-10" y="40" width="20" height="15" fill="#FDA4AF" />
          <rect x="-10" y="35" width="20" height="5" fill="#94A3B8" />
          {/* Tip */}
          <path d="M-10 -60 L 0 -80 L 10 -60 Z" fill="#FDE68A" />
          <path d="M-3 -74 L 0 -80 L 3 -74 Z" fill="#1E293B" />
       </g>
    </g>
  </svg>
);

const Assignments: React.FC<AssignmentsProps> = ({ assignments, subjects, profile, currentClass }) => {
  const navigate = useNavigate();
  const getSubjectName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.name || 'General';

  // REALISTIC NOTEBOOK CSS
  const PAPER_STYLE: React.CSSProperties = {
    backgroundColor: 'white',
    backgroundImage: `
        linear-gradient(90deg, transparent 3.5rem, #f43f5e 3.5rem, #f43f5e 3.6rem, transparent 3.6rem),
        linear-gradient(#e5e7eb 1px, transparent 1px)
    `,
    backgroundSize: '100% 100%, 100% 2rem', // Lines repeat every 2rem (32px)
    backgroundAttachment: 'local',
    backgroundPosition: '0 0, 0 1.9rem', // Offset lines slightly
    lineHeight: '2rem',
    fontFamily: '"Plus Jakarta Sans", serif',
  };

  return (
    <div className="pb-24 min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      
      {/* TOP NAV BAR */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
          <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 active:scale-90 transition-transform"
          >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-3">
              <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Student</p>
                  <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{profile?.name || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-white shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                  {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                      profile?.name?.charAt(0) || 'S'
                  )}
              </div>
          </div>
      </div>

      {/* Header Section - Matches Attendance/Fees Page */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">Assignments</h1>
            <div className="flex flex-col mt-1 md:mt-2">
              <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Academic Tasks</p>
              <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                Track and submit your work
              </p>
            </div>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <FileText size={32} className="text-[#D4AF37] relative z-10" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-10">
        
        {/* Header Section - Premium Style (Like Date Navigator) */}
        <div className="bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/10 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 shrink-0">
                    <div className="w-full h-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 rounded-2xl border border-amber-100 dark:border-amber-800 shadow-sm">
                        <FileText size={24} />
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-0.5 leading-none">
                        Academic Tasks
                    </p>
                    <h3 className="text-base font-black text-[#1e3a8a] dark:text-white leading-tight uppercase tracking-tight">Recent Assignments</h3>
                </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-white dark:bg-slate-700 px-4 py-1.5 rounded-full border border-[#D4AF37]/20 uppercase tracking-widest shadow-sm">
                {assignments.length} Total
            </span>
        </div>

        {/* Assignments Entries Container */}
        <div className="space-y-8">
            {Array.isArray(assignments) && assignments.length > 0 ? (
                <AnimatePresence mode="popLayout">
                    {assignments.map((assignment, index) => {
                        const subjectName = getSubjectName(assignment.subjectId);
                        const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate);
                        const formattedDate = dueDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

                        return (
                            <motion.div 
                                key={assignment.id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.1 }}
                                className="group"
                            >
                                <div className="bg-[#FCFBF8] dark:bg-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-sm border border-[#D4AF37]/10">
                                    
                                    {/* Subject Header */}
                                    <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] p-6 relative overflow-hidden h-24 flex flex-col justify-center shrink-0">
                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
                                        
                                        <div className="flex justify-between items-center relative z-10 w-full pl-2">
                                            <div>
                                                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full mb-1 border border-white/10">
                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Assignment</span>
                                                </div>
                                                <h4 className="font-black text-2xl text-white leading-none tracking-tight">
                                                    {subjectName}
                                                </h4>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Due: {formattedDate}</p>
                                            </div>
                                        </div>

                                        <div className="absolute -bottom-6 -right-4 w-32 h-32 z-0 pointer-events-none transform rotate-12 opacity-20">
                                            <HomeworkThemeIcon className="w-full h-full" />
                                        </div>
                                    </div>

                                    {/* Realistic Notebook Paper */}
                                    <div className="relative">
                                        <div 
                                            className="w-full h-auto px-6 md:px-10 pb-10 font-serif text-lg text-slate-700 dark:text-slate-200 pt-10"
                                            style={PAPER_STYLE}
                                        >
                                            <div className="space-y-4">
                                                <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 leading-tight border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                                                    {assignment.title}
                                                </h3>
                                                <div className="whitespace-pre-wrap leading-relaxed">
                                                    {assignment.instructions}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submission Status Badge */}
                                        <div className="absolute bottom-4 right-6 flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-2xl border border-amber-100 dark:border-amber-800 shadow-sm">
                                                <AlertCircle size={14} className="text-amber-500" />
                                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Pending</span>
                                            </div>
                                            <button className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-md flex items-center justify-center text-[#1e3a8a] dark:text-white border border-[#D4AF37]/20 active:scale-90 transition-transform">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-24 bg-[#FCFBF8] dark:bg-slate-800/50 rounded-[3rem] border border-dashed border-[#D4AF37]/30"
                >
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-[#D4AF37]/10">
                        <CheckCircle2 size={40} className="text-emerald-400" />
                    </div>
                    <p className="font-black text-[#1e3a8a] dark:text-white text-2xl mb-2">All caught up!</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No pending assignments found</p>
                </motion.div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Assignments;
