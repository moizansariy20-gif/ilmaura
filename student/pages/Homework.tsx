
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft01Icon as ChevronLeft, 
  ArrowRight01Icon as ChevronRight, 
  Bookmark01Icon as Bookmark,
  Loading01Icon as Loader2,
  Book01Icon as BookOpen,
  Calendar01Icon as CalendarIcon,
  Clock01Icon as Clock,
  CheckmarkCircle01Icon as CheckCircle2,
  ArrowLeft01Icon as ArrowLeft
} from 'hugeicons-react';
import { subscribeToClassLogs } from '../../services/api.ts';
import { ClassLog } from '../../types.ts';
import ImageWithTempUrl from '../../components/ImageWithTempUrl.tsx';
import { motion, AnimatePresence } from 'motion/react';

// --- Custom 3D Calendar Icon (Navigator) ---
const TotalDaysIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <filter id="cal-365-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.2" />
      </filter>
      <linearGradient id="cal-body-grad" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1E3A8A" />
      </linearGradient>
    </defs>
    
    <g filter="url(#cal-365-shadow)">
      <rect x="25" y="25" width="150" height="150" rx="30" fill="url(#cal-body-grad)" />
      <rect x="45" y="50" width="110" height="110" rx="10" fill="#F8FAFC" />
      <path d="M45 60 C45 54 50 50 55 50 H145 C150 50 155 54 155 60 V 80 H45 V 60 Z" fill="#EF4444" />
      <rect x="65" y="40" width="8" height="25" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
      <rect x="125" y="40" width="8" height="25" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
      <g transform="translate(55, 90)">
         <rect x="0" y="0" width="12" height="12" rx="3" fill="#1E3A8A" />
         <rect x="25" y="0" width="12" height="12" rx="3" fill="#1E3A8A" />
         <rect x="50" y="0" width="12" height="12" rx="3" fill="#64748B" />
         <rect x="75" y="0" width="12" height="12" rx="3" fill="#EF4444" />
         <rect x="0" y="25" width="12" height="12" rx="3" fill="#FCD34D" />
         <rect x="25" y="25" width="12" height="12" rx="3" fill="#64748B" />
         <rect x="50" y="25" width="12" height="12" rx="3" fill="#64748B" />
         <rect x="75" y="25" width="12" height="12" rx="3" fill="#1E3A8A" />
         <rect x="0" y="50" width="12" height="12" rx="3" fill="#FCD34D" />
         <rect x="25" y="50" width="12" height="12" rx="3" fill="#1E3A8A" />
         <rect x="50" y="50" width="12" height="12" rx="3" fill="#FCD34D" />
         <rect x="75" y="50" width="12" height="12" rx="3" fill="#1E3A8A" />
      </g>
    </g>
  </svg>
);

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
          <rect x="-10" y="-80" width="20" height="20" rx="2" fill="#F472B6" />
          {/* Metal Band */}
          <rect x="-10" y="-60" width="20" height="10" fill="#94A3B8" />
          {/* Tip (Wood) */}
          <path d="M-10 40 L 0 55 L 10 40 Z" fill="#FDE68A" />
          {/* Tip (Lead) */}
          <path d="M-3 50 L 0 55 L 3 50 Z" fill="#1E293B" />
       </g>
    </g>
  </svg>
);

interface HomeworkProps {
  profile: any;
  subjects: any[];
  currentClass?: any;
  teachers?: any[]; 
  school?: any;
}

const Homework: React.FC<HomeworkProps> = ({ profile, subjects, currentClass, school }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<ClassLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile.classId || !profile.schoolId) { setIsLoading(false); return; }
    
    const unsub = subscribeToClassLogs(profile.schoolId, profile.classId, 
      (fetchedLogs) => { 
          setLogs(fetchedLogs.filter(log => log.type === 'homework')); 
          setIsLoading(false); 
      },
      () => setIsLoading(false)
    );
    return unsub;
  }, [profile.classId, profile.schoolId]);

  const getSubjectName = (id: string) => {
      return subjects.find(s => s.id === id)?.name || 'General Subject';
  };
  
  const formatDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const dailyLogs = useMemo(() => {
      const key = formatDateKey(currentDate);
      return logs.filter(log => log.date === key);
  }, [logs, currentDate]);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const dateDisplay = currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const isToday = formatDateKey(currentDate) === formatDateKey(new Date());

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
    <div className="min-h-full bg-white dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      
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
            <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">School Diary</h1>
            <div className="flex flex-col mt-1 md:mt-2">
              <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Daily Tasks</p>
              <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                Stay updated with your homework
              </p>
            </div>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <BookOpen size={32} className="text-[#D4AF37] relative z-10" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-10">
        
        {/* Date Navigator - Premium Style */}
        <div className="bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/10 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <button onClick={handlePrevDay} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white rounded-2xl border border-[#D4AF37]/20 shadow-sm active:scale-95 transition-all">
                <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 shrink-0 hidden sm:block">
                    <TotalDaysIcon className="w-full h-full drop-shadow-md" />
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-0.5 leading-none">
                        {isToday ? "Today's Work" : "Viewing Date"}
                    </p>
                    <h3 className="text-base font-black text-[#1e3a8a] dark:text-white leading-tight uppercase tracking-tight">{dateDisplay}</h3>
                </div>
            </div>

            <button onClick={handleNextDay} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white rounded-2xl border border-[#D4AF37]/20 shadow-sm active:scale-95 transition-all">
                <ChevronRight size={24} strokeWidth={2.5} />
            </button>
        </div>

        {/* Diary Entries Container */}
        <div className="space-y-8">
            {isLoading ? (
                <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#1e3a8a] dark:text-[#D4AF37]"/></div>
            ) : dailyLogs.length > 0 ? (
                <AnimatePresence mode="popLayout">
                    {dailyLogs.map((log, index) => {
                        const subjectName = getSubjectName(log.subjectId);
                        const dateObj = log.createdAt?.toDate ? log.createdAt.toDate() : new Date(log.date);
                        const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
                        const hasImage = !!log.b2File?.fileName;

                        return (
                            <motion.div 
                                key={log.id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.1 }}
                                className="group"
                            >
                                <div className="bg-[#FCFBF8] dark:bg-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-sm border border-[#D4AF37]/10">
                                    <div className="p-6 border-b border-[#D4AF37]/10 bg-gradient-to-r from-[#1e3a8a]/5 to-transparent flex justify-between items-center">
                                        <h4 className="font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest text-sm">{subjectName}</h4>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon size={12} className="text-[#D4AF37]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formattedDate}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        {log.content && (
                                            <div className="text-[#1e3a8a] dark:text-slate-200 text-base leading-relaxed whitespace-pre-wrap font-medium">
                                                {log.content}
                                            </div>
                                        )}

                                        {hasImage && (
                                            <div className="space-y-4">
                                                <div className="w-full max-w-2xl">
                                                    <ImageWithTempUrl 
                                                        fileName={log.b2File?.fileName} 
                                                        className="w-full h-auto max-h-[500px] object-cover rounded-2xl border-4 border-white shadow-lg" 
                                                        alt="Homework"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                        1 Image Attached
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {!log.content && !hasImage && (
                                            <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                                                <Clock size={24} className="text-slate-300 mb-2" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No homework recorded for this subject</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-[#FCFBF8] dark:bg-slate-800/50 rounded-[3rem] border border-[#D4AF37]/10 border-dashed">
                    <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border-4 border-[#FCFBF8]">
                        <Bookmark size={48} className="text-slate-200" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-[#1e3a8a] dark:text-white tracking-tight uppercase">No Homework!</h3>
                        <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mx-auto mt-2 leading-relaxed uppercase tracking-widest">
                            No diary entries found for {dateDisplay}. Enjoy your free time!
                        </p>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Homework;
