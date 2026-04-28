
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carousel } from '@/components/Carousel.tsx';
// Fix: Import `GraduationCap` icon from lucide-react.
import { Book, Clock, Users, Bell, AlertTriangle, CheckCircle, FileText, ArrowRight, GraduationCap, Sparkles, CalendarCheck, FilePen, BookCheck, ChevronRight, PenTool, BrainCircuit } from 'lucide-react';
import ClassAvatar from '../../components/ClassAvatar.tsx';

interface HomeProps {
  profile: any;
  classes: any[];
  students: any[];
  timetable: any[];
  subjects: any[];
  assignments: any[];
  school: any;
}

import { translations, Language } from '../../services/translations.ts';

const Home: React.FC<HomeProps> = ({ profile, classes, students, timetable, subjects, assignments, school }) => {
  const navigate = useNavigate();
  const [bannerIndex, setBannerIndex] = useState(0);
  const currentLang = (profile?.preferences?.language as Language) || 'English';
  const t = translations[currentLang];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysSlots = timetable.filter(slot => slot.day === today).sort((a,b) => a.timeSlot.localeCompare(b.timeSlot));
  const totalStudents = classes.reduce((acc, c) => acc + students.filter(s => s.classId === c.id).length, 0);

  const getSubjectName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.name || '...';
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return '...';
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };

  const stats = [
      { label: t.assignedClasses, value: classes.length, icon: <Users size={20} /> },
      { label: t.totalStudents, value: totalStudents, icon: <GraduationCap size={20} /> },
      { label: t.todaysClasses, value: todaysSlots.length, icon: <Clock size={20} /> },
      { label: t.pendingHomework, value: assignments.length, icon: <FilePen size={20} /> }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Classes Story Bar */}
      {classes && classes.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 px-1 -mx-4 md:mx-0 px-4 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {classes.map((cls, idx) => {
            const displayName = cls.section ? `${cls.name} ${cls.section}` : cls.name;

            return (
              <div key={cls.id} onClick={() => navigate('/class_view')} className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group">
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-[#D4AF37] via-[#6B1D2F] to-[#D4AF37] shadow-md group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-white dark:bg-[#1e293b] flex items-center justify-center relative">
                    {cls.image ? (
                      <img src={cls.image} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <ClassAvatar className={cls.name} classId={cls.id} size={32} />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center w-full truncate px-1">
                  {displayName}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Welcome Banner - Skeuomorphic & Premium or Custom */}
      <div className="relative group">
        {school?.bannerURLs && school.bannerURLs.length > 0 ? (
          <>
            <div className="w-full p-3 bg-gradient-to-br from-[#b5835a] via-[#8b5a2b] to-[#5c3a21] rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.25),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-[#5c3a21]/50">
              <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0.02turn, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px), repeating-linear-gradient(-0.01turn, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)' }}></div>
              <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'repeating-radial-gradient(ellipse at 50% 150%, transparent, transparent 10px, rgba(0,0,0,0.4) 10px, rgba(0,0,0,0.4) 20px)' }}></div>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none mix-blend-overlay"></div>
              <div className="w-full aspect-video rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] border-2 border-[#D4AF37] flex items-center justify-center relative overflow-hidden z-10">
                <Carousel images={school.bannerURLs} className="w-full h-full" currentIndex={bannerIndex} setCurrentIndex={setBannerIndex} />
              </div>
            </div>
            {school.bannerURLs.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {school.bannerURLs.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setBannerIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === bannerIndex ? 'bg-[#D4AF37] w-4' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : school?.bannerURL ? (
          <div className="w-full aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-b-4 border-[#D4AF37] relative">
            <img 
              src={school.bannerURL} 
              className="w-full h-full object-cover" 
              alt="School Banner" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute bottom-6 left-8 right-8 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37] shadow-lg mb-3">
                <Sparkles size={14} className="text-[#6B1D2F]" />
                <span className="text-[10px] font-black text-[#6B1D2F] uppercase tracking-widest">{t.facultyHub}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white font-heading tracking-tight leading-none drop-shadow-lg">
                {t.welcome}, <span className="text-[#D4AF37]">{profile.name.split(' ')[0]}</span>
              </h1>
              <p className="text-white/80 font-medium text-sm md:text-base max-w-md mt-2 drop-shadow-md">
                {t.manageClassroom}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-[#6B1D2F] via-[#8B253D] to-[#4A1421] p-8 rounded-[2.5rem] border border-[#4A1421] shadow-[0_20px_50px_rgba(107,29,47,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-2">
                  <Sparkles size={14} className="text-[#D4AF37]" />
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{t.facultyHub}</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white font-heading tracking-tight leading-none drop-shadow-lg">
                  {t.welcome}, <span className="text-[#D4AF37]">{profile.name.split(' ')[0]}</span>
                </h1>
                <p className="text-white/70 font-medium text-sm md:text-base max-w-md">
                  {t.manageClassroom}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">{today}</p>
                  <p className="text-xl font-bold text-white drop-shadow-md">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center shadow-2xl shadow-black/20 group-hover:scale-105 transition-transform duration-500">
                  <CalendarCheck size={32} className="text-[#D4AF37] drop-shadow-md" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
              <div key={stat.label} className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-[0_10px_20px_rgba(107,29,47,0.05),inset_0_2px_0_rgba(255,255,255,1)] dark:shadow-none relative overflow-hidden group hover:shadow-[0_15px_25px_rgba(107,29,47,0.1)] transition-all duration-300 active:scale-95">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#6B1D2F]/5 dark:bg-[#D4AF37]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110"></div>
                  <div className="flex items-center justify-between text-[#6B1D2F] dark:text-[#D4AF37] mb-4 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6B1D2F]/60 dark:text-[#D4AF37]/60">{stat.label}</p>
                    <div className="p-2.5 bg-[#6B1D2F]/5 dark:bg-[#D4AF37]/5 rounded-2xl text-[#6B1D2F] dark:text-[#D4AF37] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-[#6B1D2F]/10 dark:border-[#D4AF37]/10">
                        {stat.icon}
                    </div>
                  </div>
                  <p className="text-4xl font-black text-slate-900 dark:text-white relative z-10 drop-shadow-sm">{stat.value}</p>
              </div>
          ))}
      </div>

      <div 
         onClick={() => navigate('/curriculum_insight')}
         className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer group hover:shadow-[0_15px_30px_rgba(16,185,129,0.1)] transition-all duration-300 active:scale-[0.98]"
      >
         <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_15px_rgba(16,185,129,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
               <BookCheck size={28} />
            </div>
            <div>
               <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-400 tracking-tight">Curriculum Insight</h3>
               <p className="text-sm font-semibold text-emerald-700/80 dark:text-emerald-500 mt-1">Manage syllabus chapters and class progress.</p>
            </div>
         </div>
         <div className="hidden md:flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#1e293b] rounded-xl font-bold text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            Access Portal
            <ChevronRight size={18} />
         </div>
      </div>

      <div className="w-full bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-[#6B1D2F]/10 dark:border-[#1e293b] p-6 md:p-8 shadow-[0_20px_50px_rgba(107,29,47,0.05)] relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
         
         <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-[#6B1D2F]/5 dark:bg-[#D4AF37]/5 rounded-2xl flex items-center justify-center text-[#6B1D2F] dark:text-[#D4AF37] border border-[#6B1D2F]/10">
                     <PenTool size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">Teaching Tools</h3>
                     <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Faculty Hub • Live Tracking</p>
                  </div>
               </div>
            </div>

            {/* Primary Action Button - Prominent Card Style like "My Tools" */}
            <button 
               onClick={() => navigate('/student_curriculum')}
               className="w-full group/btn flex items-center gap-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900 p-5 md:p-6 rounded-3xl border border-[#D4AF37]/30 shadow-[0_10px_25px_rgba(107,29,47,0.05)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.15)] hover:border-[#D4AF37] transition-all active:scale-[0.98]"
            >
               <div className="w-14 h-14 bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] rounded-2xl flex items-center justify-center text-white shadow-lg group-hover/btn:rotate-6 transition-transform">
                  <CheckCircle size={30} />
               </div>
               <div className="text-left flex-1">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] leading-none mb-1.5">Learning Milestones</p>
                  <p className="text-xl font-black text-[#6B1D2F] dark:text-white leading-tight">Student Progress Tracker</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">Live curriculum checkpoints per student.</p>
               </div>
               <ChevronRight size={20} className="text-[#D4AF37] group-hover/btn:translate-x-1 transition-transform" />
            </button>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
               <button 
                  onClick={() => navigate('/teaching_tools')}
                  className="flex items-center justify-center gap-3 p-4 bg-[#6B1D2F]/5 dark:bg-white/5 text-[#6B1D2F] dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-[#6B1D2F]/10 hover:bg-[#6B1D2F] hover:text-white transition-all shadow-sm group/ai"
               >
                  <Sparkles size={16} className="text-[#D4AF37] group-hover/ai:text-white"/>
                  AI Lesson Tools
               </button>
               <button 
                  onClick={() => navigate('/quizzes')}
                  className="flex items-center justify-center gap-3 p-4 bg-[#6B1D2F]/5 dark:bg-white/5 text-[#6B1D2F] dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-[#6B1D2F]/10 hover:bg-[#6B1D2F] hover:text-white transition-all shadow-sm group/quiz"
               >
                  <BrainCircuit size={16} className="text-[#D4AF37] group-hover/quiz:text-white"/>
                  Smart Quizzes
               </button>
               <button 
                  onClick={() => navigate('/curriculum_insight')}
                  className="flex items-center justify-center gap-3 p-4 bg-[#6B1D2F]/5 dark:bg-white/5 text-[#6B1D2F] dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-[#6B1D2F]/10 hover:bg-[#6B1D2F] hover:text-white transition-all shadow-sm group/curr"
               >
                  <BookCheck size={16} className="text-[#D4AF37] group-hover/curr:text-white"/>
                  Syllabus
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] text-white p-6 rounded-[2rem] border border-[#4A1421] shadow-[0_15px_35px_rgba(107,29,47,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-between relative overflow-hidden group active:scale-[0.98] transition-all">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
               <div className="flex items-center gap-5 relative z-10">
                 <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] backdrop-blur-md border border-white/10">
                    <Bell size={26} className="drop-shadow-md text-[#D4AF37]" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">{t.latestNotice}</p>
                    <p className="font-bold text-white text-lg drop-shadow-md">{t.staffMeetingNotice}</p>
                 </div>
               </div>
               <button className="relative z-10 text-xs font-black text-white bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-colors border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">{t.viewAll}</button>
            </div>
            
            <div className="bg-white dark:bg-[#1e293b] border border-[#6B1D2F]/10 dark:border-[#1e293b] p-6 rounded-[2rem] flex items-center gap-5 shadow-[0_10px_25px_rgba(107,29,47,0.03),inset_0_2px_0_rgba(255,255,255,1)] dark:shadow-none relative overflow-hidden group transition-colors duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#6B1D2F]/5 dark:bg-[#D4AF37]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="w-14 h-14 bg-[#6B1D2F]/5 dark:bg-[#D4AF37]/5 text-[#6B1D2F] dark:text-[#D4AF37] rounded-2xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-[#6B1D2F]/10 dark:border-[#D4AF37]/10 relative z-10">
                    <AlertTriangle size={28} className="text-[#D4AF37]" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-slate-900 dark:text-white text-lg leading-tight">{t.smartAlert}: {t.lowAttendance}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">5 students in Grade 7 have attendance below 75% this month.</p>
                </div>
            </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2.5rem] border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-[0_15px_35px_rgba(107,29,47,0.05),inset_0_2px_0_rgba(255,255,255,1)] dark:shadow-none relative overflow-hidden h-full transition-colors duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#6B1D2F]/5 dark:bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <h2 className="text-lg font-black text-[#6B1D2F] dark:text-[#D4AF37] mb-6 flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-[#6B1D2F]/5 dark:bg-[#D4AF37]/5 rounded-2xl text-[#6B1D2F] dark:text-[#D4AF37] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-[#6B1D2F]/10 dark:border-[#D4AF37]/10">
                <Clock size={20} className="text-[#D4AF37]" />
              </div>
              {t.todaysSchedule}
            </h2>
            
            <div className="space-y-3 relative z-10">
              {todaysSlots.length > 0 ? (
                  todaysSlots.map((slot) => (
                    <div key={slot.id} className="p-4 bg-[#6B1D2F]/5 dark:bg-[#020617]/50 rounded-2xl flex items-center justify-between border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-sm hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:border-[#6B1D2F]/20 transition-all group active:scale-[0.98]">
                       <div>
                          <p className="font-black text-slate-900 dark:text-white text-sm group-hover:text-[#6B1D2F] dark:group-hover:text-[#D4AF37] transition-colors">{getSubjectName(slot.subjectId)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">{getClassName(slot.classId)}</p>
                       </div>
                       <div className="px-3 py-1.5 bg-white dark:bg-[#1e293b] rounded-xl border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-sm">
                          <p className="font-mono text-xs font-black text-[#6B1D2F] dark:text-[#D4AF37]">{slot.timeSlot}</p>
                       </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-12 text-slate-400 dark:text-slate-600 bg-[#6B1D2F]/5 dark:bg-[#020617]/50 rounded-3xl border border-dashed border-[#6B1D2F]/10 dark:border-[#1e293b]">
                  <Clock size={32} className="mx-auto mb-3 text-[#6B1D2F]/20 dark:text-[#D4AF37]/20" />
                  <p className="font-bold">{t.noClassesScheduled}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
