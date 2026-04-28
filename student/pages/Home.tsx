
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carousel } from '@/components/Carousel.tsx';
import { useAuth } from '../../hooks/useAuth.ts';
import { 
  Notification01Icon, 
  File01Icon, 
  Clock01Icon, 
  Book01Icon, 
  CheckListIcon, 
  FlashIcon, 
  Calendar03Icon, 
  SparklesIcon, 
  ArrowDown01Icon, 
  UserGroupIcon, 
  AlertCircleIcon, 
  CheckmarkCircle01Icon, 
  ArrowRight01Icon, 
  LicenseIcon,
  Note01Icon,
  Calendar01Icon
} from 'hugeicons-react';
import { Map } from 'lucide-react';
import { GraphicalPlanActivity, SavedAcademicPlan } from '../../types.ts';
import ClassAvatar from '../../components/ClassAvatar.tsx';

interface HomeProps {
  announcements: any[];
  assignments: any[];
  timetable: any[];
  subjects: any[];
  academicPlans: SavedAcademicPlan[];
  school: any;
}

const Home: React.FC<HomeProps> = ({ announcements, assignments, timetable, subjects, academicPlans, school }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [bannerIndex, setBannerIndex] = useState(0);
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysSlots = (Array.isArray(timetable) ? timetable : []).filter(slot => slot.day === today).sort((a,b) => a.timeSlot.localeCompare(b.timeSlot));
  
  const pendingAssignments = (Array.isArray(assignments) ? assignments : []).filter(a => a.status !== 'submitted');
  const latestNotice = (Array.isArray(announcements) ? announcements : [])[0];

  const getSubjectName = (subjectId: string) => (Array.isArray(subjects) ? subjects : []).find(s => s.id === subjectId)?.name || '...';

  const stats = [
      { label: 'My Subjects', value: subjects?.length || 0, icon: <Book01Icon size={20} /> },
      { label: 'Pending Work', value: pendingAssignments.length, icon: <Note01Icon size={20} /> },
      { label: "Today's Classes", value: todaysSlots.length, icon: <Clock01Icon size={20} /> },
      { label: 'New Notices', value: announcements?.length || 0, icon: <Notification01Icon size={20} /> }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Subjects Story Bar */}
      {subjects && subjects.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 px-1 -mx-4 md:mx-0 px-4 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {subjects.map((sub, idx) => {
            return (
              <div key={sub.id} className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group">
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-[#D4AF37] via-[#1E3A8A] to-[#D4AF37] shadow-md group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-white dark:bg-[#1e293b] flex items-center justify-center relative">
                    <ClassAvatar className={sub.name} classId={sub.id} size={32} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center w-full truncate px-1">
                  {sub.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Welcome Banner - Skeuomorphic & Premium (Navy Blue Theme) or Custom */}
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
          <div className="w-full aspect-[21/9] rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-b-4 border-[#D4AF37] relative">
            <img 
              src={school.bannerURL} 
              className="w-full h-full object-cover" 
              alt="School Banner" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute bottom-6 left-8 right-8 text-white">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37] shadow-lg mb-3">
                <SparklesIcon size={16} className="text-[#1E3A8A]" />
                <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Student App</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white font-heading tracking-tight leading-none drop-shadow-lg">
                {profile?.name?.split(' ')[0] || 'Student'} <span className="text-5xl md:text-7xl drop-shadow-sm">👋</span>
              </h1>
              <p className="text-white font-bold text-lg md:text-xl max-w-md mt-2 drop-shadow-md">
                Ready to conquer your classes today? Let's make it happen! 🚀
              </p>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#0F172A] p-8 rounded-[3rem] border-b-4 border-[#D4AF37] shadow-[0_15px_30px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-white/15 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37] shadow-lg mb-2">
                  <SparklesIcon size={16} className="text-[#1E3A8A]" />
                  <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Student App</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white font-heading tracking-tight leading-none flex items-center gap-3 flex-wrap">
                  {profile?.name?.split(' ')[0] || 'Student'} <span className="text-5xl md:text-7xl drop-shadow-sm">👋</span>
                  <span className="text-6xl md:text-8xl font-serif italic text-[#D4AF37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] ml-2 select-none">Hi</span>
                </h1>
                <p className="text-white font-bold text-lg md:text-xl max-w-md leading-relaxed drop-shadow-md">
                  Ready to conquer your classes today? Let's make it happen! 🚀
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <p className="text-xs font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">{today}</p>
                  <p className="text-2xl font-black text-white drop-shadow-md">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform duration-500">
                  <Calendar01Icon size={40} className="text-[#1E3A8A] drop-shadow-md" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
              <div key={stat.label} className="bg-white dark:bg-[#1e293b] p-6 rounded-[2.5rem] border-t-2 border-white border-b-4 border-slate-100 dark:border-[#1e293b] shadow-[0_15px_30px_rgba(30,58,138,0.1)] relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-300 active:translate-y-1 active:border-b-2">
                  <div className="flex items-center justify-between text-[#1E3A8A] dark:text-[#D4AF37] mb-6 relative z-10">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <div className="p-3 bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] rounded-2xl text-[#D4AF37] shadow-[0_8px_15px_rgba(30,58,138,0.3)] border-t border-white/20">
                        {stat.icon}
                    </div>
                  </div>
                  <p className="text-4xl font-black text-[#1E3A8A] dark:text-white relative z-10 drop-shadow-sm tracking-tight">{stat.value}</p>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] text-white p-8 rounded-[2.5rem] border-b-4 border-[#D4AF37] shadow-[0_15px_35px_rgba(30,58,138,0.25)] flex items-center justify-between relative overflow-hidden group active:scale-[0.98] transition-all">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
               <div className="flex items-center gap-6 relative z-10">
                 <div className="w-16 h-16 bg-white text-[#1E3A8A] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#D4AF37]">
                    <Notification01Icon size={30} className="drop-shadow-md text-[#1E3A8A]" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-1">Latest Notice</p>
                    <p className="font-black text-white text-xl drop-shadow-md">{latestNotice?.title || 'No new notices'}</p>
                 </div>
               </div>
               <button onClick={() => navigate('/notifications')} className="relative z-10 text-xs font-black text-[#1E3A8A] bg-[#D4AF37] px-6 py-3 rounded-xl hover:bg-white transition-colors shadow-lg">View All</button>
            </div>
            
            <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-50 dark:border-[#1e293b] p-8 rounded-[2.5rem] flex items-center gap-6 shadow-[0_15px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group transition-colors duration-300">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner border-2 border-rose-100 dark:border-rose-800 relative z-10">
                    <AlertCircleIcon size={32} />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-[#1E3A8A] dark:text-white text-xl leading-tight">Pending Homework</p>
                    <p className="text-base font-bold text-slate-500 dark:text-slate-400 mt-1">You have {pendingAssignments.length} pending assignments due soon.</p>
                </div>
            </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border-2 border-slate-50 dark:border-[#1e293b] shadow-[0_20px_40px_rgba(0,0,0,0.05)] relative overflow-hidden h-full transition-colors duration-300">
            <h2 className="text-xl font-black text-[#1E3A8A] dark:text-[#D4AF37] mb-8 flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#1E3A8A] rounded-2xl text-[#D4AF37] shadow-lg">
                <Clock01Icon size={24} />
              </div>
              Today's Schedule
            </h2>
            
            <div className="space-y-4 relative z-10">
              {todaysSlots.length > 0 ? (
                  todaysSlots.map((slot) => (
                    <div key={slot.id} className="p-5 bg-slate-50 dark:bg-[#020617] rounded-2xl flex items-center justify-between border-2 border-transparent hover:border-[#D4AF37] hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:shadow-xl transition-all group active:scale-[0.98]">
                       <div>
                          <p className="font-black text-[#1E3A8A] dark:text-white text-base group-hover:text-[#1E3A8A] transition-colors">{getSubjectName(slot.subjectId)}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">{slot.room || 'Classroom'}</p>
                       </div>
                       <div className="px-4 py-2 bg-[#1E3A8A] rounded-xl shadow-lg">
                          <p className="font-mono text-xs font-black text-white">{slot.timeSlot}</p>
                       </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-16 text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-[#020617] rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-[#1e293b]">
                  <Clock01Icon size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="font-black uppercase tracking-widest text-xs">No Classes Scheduled</p>
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
