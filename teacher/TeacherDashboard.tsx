
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarCheck, BookOpen, FileText, Award, 
  MessageSquare, BarChart2, BrainCircuit, LogOut, Menu, Bell, Clock, 
  X, ChevronRight, UserCircle, BookCheck, FilePen, Sparkles, MessageCircle,
  ShieldAlert, Lock, CheckCircle, Camera, Calendar as CalendarIcon, UploadCloud,
  Home as HomeIcon, Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { subscribeToSchoolDetails, subscribeToTeacherData } from '../services/api.ts';
import TeacherSkeleton from './components/TeacherSkeleton.tsx';
import Loader from '../components/Loader.tsx';
import { supabase } from '../services/supabase.ts';

// Lazy load sub-pages for performance
const Home = lazy(() => import('./pages/Home.tsx'));
const Attendance = lazy(() => import('./pages/Attendance.tsx'));
const ClassView = lazy(() => import('./pages/ClassView.tsx'));
const Exams = lazy(() => import('./pages/Exams.tsx'));
const Resources = lazy(() => import('./pages/Resources.tsx'));
const Notices = lazy(() => import('./pages/Notices.tsx'));
const Analytics = lazy(() => import('./pages/Analytics.tsx'));
const Timetable = lazy(() => import('./pages/Timetable.tsx'));
const ProfilePage = lazy(() => import('./pages/Profile.tsx'));
const Classwork = lazy(() => import('./pages/Classwork.tsx'));
const Homework = lazy(() => import('./pages/Homework.tsx'));
const Quizzes = lazy(() => import('./pages/Quizzes.tsx'));
const SettingsPage = lazy(() => import('./pages/Settings.tsx'));
const TeacherMessenger = lazy(() => import('./pages/Messenger.tsx'));
const Notifications = lazy(() => import('./pages/Notifications.tsx'));
import { FirestoreError } from 'firebase/firestore';
import { Assignment } from '../types.ts';
import { useTranslation } from '../services/translations.ts';
import ClassAvatar from '../components/ClassAvatar.tsx';

const getSalutation = (gender?: string, t?: any): string => {
    if (gender === 'Male') return t?.sir || 'Sir';
    if (gender === 'Female') return t?.miss || 'Miss';
    return '';
};

const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.type = 'sine'; 
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
      gainNode.gain.setValueAtTime(0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (error) { console.error("Audio failed", error); }
};

const MobileToolsView: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
    const { t } = useTranslation();
    
    const menuCards = [
      { id: 'attendance', label: t.attendance, icon: <CalendarCheck className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'class_log', label: t.classwork, icon: <BookOpen className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'homework', label: t.homework, icon: <FilePen className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'messenger', label: t.messages, icon: <MessageSquare className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'quizzes', label: t.quizzes, icon: <BrainCircuit className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'notifications', label: t.alerts, icon: <Bell className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'timetable', label: t.timetable, icon: <Clock className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'resources', label: t.resources, icon: <UploadCloud className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'notices', label: t.notices, icon: <MessageSquare className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'profile', label: t.profile, icon: <UserCircle className="w-8 h-8 text-[#D4AF37]" /> },
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-full bg-[#FCFBF8] dark:bg-slate-900 pb-32 transition-colors duration-300"
      >
        <div className="w-full bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] p-8 pt-12 pb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">{t.facultyHub}</p>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">{t.teachingTools}</h1>
            <p className="text-white/60 text-xs mt-2 font-medium">{t.manageClassroom}</p>
          </div>
        </div>

        <div className="p-6 -mt-6 relative z-20">
          <div className="border-4 border-[#D4AF37] rounded-[2.5rem] p-8 bg-white dark:bg-slate-800 shadow-[0_20px_50px_rgba(107,29,47,0.1),inset_0_0_40px_rgba(0,0,0,0.02)] grid grid-cols-2 gap-5 transition-colors duration-300">
            {menuCards.map(card => (
              <button 
                key={card.id} 
                onClick={() => { playClickSound(); setActiveTab(card.id); }} 
                className="bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] p-6 rounded-3xl border border-[#D4AF37]/40 shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col items-center gap-3 hover:border-[#D4AF37] hover:shadow-[0_15px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.2)] transition-all active:scale-95 group"
              >
                <div className="shrink-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300 transform group-hover:rotate-3">{card.icon}</div>
                <span className="text-xs font-black text-white uppercase tracking-widest drop-shadow-sm text-center leading-tight">{card.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
};

const MobileTeacherDashboard: React.FC<{
  setActiveTab: (tab: string) => void; profile: any; classes: any[]; students: any[];
  timetable: any[]; school: any; assignments: Assignment[];
}> = ({ setActiveTab, profile, classes, students, timetable, school, assignments }) => {
  const { t } = useTranslation();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysClassesCount = timetable.filter(slot => slot.day === today).length;
  const salutation = getSalutation(profile.gender, t);
  const firstName = profile.name ? profile.name.split(' ')[0] : t.teacher;

  const quickStats = [
    { label: t.today, icon: <CalendarCheck size={24} className="text-[#D4AF37]" />, value: `${todaysClassesCount}`, action: 'timetable' },
    { label: t.classes, icon: <Users size={24} className="text-[#D4AF37]" />, value: `${classes.length}`, action: 'class_view' },
    { label: t.alerts, icon: <Bell size={24} className="text-[#D4AF37]" />, value: '3 New', action: 'notifications' },
  ];

  const menuCards = [
    { id: 'attendance', label: t.attendance, icon: <CalendarCheck className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'class_log', label: t.classwork, icon: <BookOpen className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'homework', label: t.homework, icon: <FilePen className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'messenger', label: t.messages, icon: <MessageSquare className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'quizzes', label: t.quizzes, icon: <BrainCircuit className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'notifications', label: t.alerts, icon: <Bell className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'timetable', label: t.timetable, icon: <Clock className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'resources', label: t.resources, icon: <UploadCloud className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'notices', label: t.notices, icon: <MessageSquare className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'profile', label: t.profile, icon: <UserCircle className="w-8 h-8 text-[#D4AF37]" /> },
  ];

  return (
    <div className="min-h-full flex flex-col bg-[#FCFBF8] dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full h-[250px] bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] rounded-b-[3.5rem] shadow-[0_10px_30px_rgba(107,29,47,0.3)] relative z-10 shrink-0 flex flex-col justify-between px-6 pt-6 pb-8 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#D4AF37]/10 rounded-full z-0 shadow-sm"></div>
        <div className="relative z-20 w-full h-full">
          <div className="absolute top-0 left-0 flex flex-col items-start gap-0 pl-1 pt-1">
            {salutation && <p className="text-sm font-bold text-[#D4AF37]/70 -mb-1">{salutation}</p>}
            <h1 className="text-4xl font-black font-heading text-white tracking-tight leading-none drop-shadow-sm">{firstName}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-[#D4AF37] text-[#6B1D2F] text-[10px] font-black uppercase tracking-widest shadow-lg">{t.teacher}</span>
            </div>
          </div>
          <div className="absolute -top-2 -right-2 z-20">
            <div className="w-24 h-24 rounded-full p-1 bg-white/10 backdrop-blur-md shadow-2xl border-2 border-[#D4AF37]">
              {profile.photoURL ? (
                <img src={profile.photoURL} className="w-full h-full rounded-full object-cover shadow-inner" alt="Profile" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] flex items-center justify-center text-white shadow-inner">
                  <UserCircle size={52} strokeWidth={1.2} className="text-[#D4AF37]" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 relative z-20 mt-auto">
          {quickStats.map((stat, idx) => (
            <button 
              key={idx} 
              onClick={() => { playClickSound(); setActiveTab(stat.action); }} 
              className="group flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-150 ease-out bg-gradient-to-b from-white/10 to-white/5 border border-white/10 h-24 shadow-[0_6px_10px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] active:scale-95"
            >
              <div className="flex items-center justify-center drop-shadow-md">{stat.icon}</div>
              <div className="text-center w-full mt-1">
                  <p className="text-[8px] font-black uppercase tracking-wider text-white/40">{stat.label}</p>
                  <p className="text-xs font-black leading-none text-white mt-0.5">{stat.value}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow flex flex-col mt-6 relative z-10">
        {/* Classes Story Bar (Mobile) */}
        {classes && classes.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-6 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {classes.map((cls, idx) => {
              const displayName = cls.section ? `${cls.name} ${cls.section}` : cls.name;

              return (
                <div key={cls.id} onClick={() => { playClickSound(); setActiveTab('class_view'); }} className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group shrink-0">
                  <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-[#D4AF37] via-[#6B1D2F] to-[#D4AF37] shadow-md active:scale-95 transition-transform duration-300">
                    <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center relative">
                      {cls.image ? (
                        <img src={cls.image} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <ClassAvatar className={cls.name} classId={cls.id} size={32} />
                      )}
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

        <div className="mx-6 mb-8 w-[calc(100%-3rem)] relative group">
          {school.bannerURL ? (
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.25)] border-2 border-[#D4AF37] relative">
              <img 
                src={school.bannerURL} 
                className="w-full h-full object-cover" 
                alt="School Banner" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-0.5">{t.officialBanner || 'Official Banner'}</p>
                <p className="font-bold text-lg leading-tight drop-shadow-lg truncate">{school.name}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-br from-[#b5835a] via-[#8b5a2b] to-[#5c3a21] rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.25),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-[#5c3a21]/50">
              <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0.02turn, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px), repeating-linear-gradient(-0.01turn, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)' }}></div>
              <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'repeating-radial-gradient(ellipse at 50% 150%, transparent, transparent 10px, rgba(0,0,0,0.4) 10px, rgba(0,0,0,0.4) 20px)' }}></div>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none mix-blend-overlay"></div>
              <div onClick={playClickSound} className="w-full h-36 bg-gradient-to-r from-[#6B1D2F] to-[#4A1421] rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] border border-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden group active:scale-[0.98] transition-all duration-300 ease-out z-10">
                <div className="text-center text-white z-20 p-4 relative">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20 shadow-[0_4px_10px_rgba(0,0,0,0.3)]"><Sparkles size={20} className="text-[#D4AF37] drop-shadow-md" /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]/80 mb-1">{t.schoolCampus}</p>
                  <p className="font-bold font-heading text-xl leading-tight text-white drop-shadow-md">{school.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto w-full bg-white dark:bg-slate-800 rounded-t-[3rem] p-8 pb-32 border-t-4 border-[#D4AF37] shadow-[0_-15px_35px_rgba(107,29,47,0.08)] transition-colors duration-300">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black font-heading text-[#6B1D2F] dark:text-[#D4AF37] drop-shadow-sm tracking-tight">{t.teachingTools}</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {menuCards.map((item, idx) => (
              <button 
                key={`menu-${idx}`} 
                onClick={() => { playClickSound(); setActiveTab(item.id); }} 
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] border border-[#D4AF37]/40 h-32 gap-2 shadow-[0_8px_15px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-[#D4AF37] hover:shadow-[0_10px_20px_rgba(0,0,0,0.4),0_0_15px_rgba(212,175,55,0.2)] transition-all active:scale-95 group"
              >
                <div className="shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <span className="text-[10px] font-black text-white uppercase tracking-tight text-center leading-tight drop-shadow-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuList: React.FC<{title: string; items: any[]; setActiveTab: any}> = ({ title, items, setActiveTab }) => {
    const { t } = useTranslation();
    return (
      <div className="space-y-6 pb-24 px-4 pt-4 bg-[#FCFBF8] dark:bg-slate-900 min-h-full transition-colors duration-300">
        <h1 className="text-3xl font-black text-slate-900 dark:text-[#D4AF37]">{title}</h1>
        <div className="space-y-3">
          {items.map((item, i) => (
            <button 
              key={i} 
              onClick={() => {if(item.action) item.action(); else setActiveTab(item.id);}} 
              className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold transition-colors duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="text-[#6B1D2F] dark:text-[#D4AF37]">{item.icon}</div>
                {item.label}
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    );
};

const MobilePageBanner: React.FC<{title: string; profile: any; setActiveTab: any}> = ({ title, profile }) => {
    const { t } = useTranslation();
    return (
      <div className="w-full h-[180px] bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] rounded-none shadow-[0_8px_20px_rgba(0,0,0,0.3)] relative z-10 shrink-0 flex flex-col justify-center px-6 pt-6 pb-6 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#D4AF37]/10 rounded-full z-0 shadow-sm opacity-50"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#D4AF37]/5 rounded-full z-0 shadow-sm opacity-30"></div>
        
        <div className="relative z-20 w-full h-full flex items-center justify-between">
          <div className="flex flex-col items-start gap-0 pl-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">{t.teacherPortal}</p>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-none drop-shadow-sm">{title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#D4AF37] shadow-[#D4AF37]/20 text-[#6B1D2F] text-[10px] font-black uppercase tracking-widest shadow-lg">{t.teacher}</span>
            </div>
          </div>
          <div className="z-20">
            <div className="w-20 h-20 rounded-full p-1.5 bg-white shadow-xl border-2 border-[#D4AF37]">
              {profile.photoURL ? (
                <img src={profile.photoURL} className="w-full h-full rounded-full object-cover shadow-inner" alt="Profile" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] flex items-center justify-center text-white shadow-inner">
                  <UserCircle size={44} strokeWidth={1.2} className="text-[#D4AF37]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
};

const TeacherDashboard: React.FC = () => {
    const { profile, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const [school, setSchool] = useState<any>(null);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [exams, setExams] = useState([]);
    const [marks, setMarks] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    useEffect(() => {
      const checkScreen = () => { if (window.innerWidth >= 1024) setSidebarOpen(true); else setSidebarOpen(false); };
      checkScreen(); window.addEventListener('resize', checkScreen);
      return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
      if (!profile?.schoolId) { setLoading(false); return; }
      setLoading(true);
      const handleError = (error: FirestoreError) => { console.error("Teacher App Sync Error:", error); setLoading(false); };
      
      const unsubTeacherData = subscribeToTeacherData(profile, { 
          setClasses, setStudents, setTimetable, setSubjects, setAssignments, setExams, setMarks, setResources 
      });
      
      const unsubSchool = subscribeToSchoolDetails(profile.schoolId, (d) => setSchool(d), handleError);
      
      setLoading(false);

      return () => { unsubSchool(); unsubTeacherData(); };
    }, [profile]);

    if (loading || !profile || !school) return <TeacherSkeleton />;

    const setActiveTab = (tab: string) => { 
      navigate(`/${tab}`); 
      if (window.innerWidth < 1024) setSidebarOpen(false); 
    };

    const DESKTOP_NAV_ITEMS = [
      { id: 'home', label: t.dashboard, icon: <HomeIcon size={20} /> },
      { id: 'notifications', label: t.notifications, icon: <Bell size={20} /> }, 
      { id: 'messenger', label: t.messages, icon: <MessageCircle size={20} /> }, 
      { id: 'attendance', label: t.attendance, icon: <CalendarCheck size={20} /> },
      { id: 'timetable', label: t.timetable, icon: <Clock size={20} /> },
      { id: 'class_view', label: t.classes, icon: <Users size={20} /> },
      { id: 'quizzes', label: t.quizzes, icon: <BrainCircuit size={20} /> },
      { id: 'class_log', label: t.classwork, icon: <BookCheck size={20} /> },
      { id: 'homework', label: t.homework, icon: <FilePen size={20} /> },
      { id: 'exams', label: t.results, icon: <Award size={20} /> },
      { id: 'analytics', label: t.analytics, icon: <BarChart2 size={20} /> },
      { id: 'resources', label: t.resources, icon: <BookOpen size={20} /> },
      { id: 'notices', label: t.notices, icon: <MessageSquare size={20} /> },
      { id: 'settings', label: t.settings, icon: <Settings size={20} /> },
      { id: 'profile', label: t.profile, icon: <UserCircle size={20} /> },
    ];
    
    const MOBILE_NAV_ITEMS = [
      { id: 'home', label: t.dashboard, icon: <HomeIcon size={24} /> },
      { id: 'tools', label: t.tools, icon: <LayoutDashboard size={24} /> },
      { id: 'settings', label: t.settings, icon: <Settings size={24} /> }
    ];
    const PROFILE_MENU_ITEMS = [{ id: 'profile', label: t.profile, icon: <UserCircle size={20} /> }, { id: 'logout', label: t.logout, icon: <LogOut size={20} />, action: logout }];

    const activeTab = location.pathname.replace(/^\//, '') || 'home';
    const getPageTitle = () => DESKTOP_NAV_ITEMS.find(i => i.id === activeTab)?.label || activeTab.replace(/_/g, ' ');

    const renderContent = () => {
      return (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader message="Loading..." /></div>}>
          <Routes>
            <Route path="/home" element={<Home profile={profile} classes={classes} students={students} timetable={timetable} subjects={subjects} assignments={assignments} school={school} />} />
            <Route path="/attendance" element={<Attendance profile={profile} classes={classes} students={students} />} />
            <Route path="/timetable" element={<Timetable profile={profile} timetable={timetable} subjects={subjects} classes={classes} school={school} />} />
            <Route path="/class_view" element={<ClassView profile={profile} school={school} classes={classes} students={students} subjects={subjects} />} />
            <Route path="/quizzes" element={<Quizzes profile={profile} classes={classes} subjects={subjects} />} />
            <Route path="/class_log" element={<Classwork profile={profile} classes={classes} subjects={subjects} />} />
            <Route path="/homework" element={<Homework profile={profile} classes={classes} subjects={subjects} />} />
            <Route path="/exams" element={<Exams profile={profile} classes={classes} subjects={subjects} exams={exams} students={students} />} />
            <Route path="/analytics" element={<Analytics students={students} exams={exams} marks={marks} />} />
            <Route path="/resources" element={<Resources profile={profile} classes={classes} subjects={subjects} resources={resources} />} />
            <Route path="/notices" element={<Notices profile={profile} classes={classes} />} />
            <Route path="/messenger" element={<TeacherMessenger />} />
            <Route path="/notifications" element={<Notifications profile={profile} />} />
            <Route path="/profile" element={<ProfilePage profile={profile} school={school} />} />
            <Route path="/settings" element={<SettingsPage profile={profile} />} />
            <Route path="/profile-menu" element={<MenuList title={t.profileAndMore} items={PROFILE_MENU_ITEMS} setActiveTab={setActiveTab} />} />
            <Route path="/tools" element={<MobileToolsView setActiveTab={setActiveTab} />} />
            
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      );
    };
    
    const renderMobileView = () => {
        const pageTitle = getPageTitle();

        switch (activeTab) {
          case 'home':
            return <MobileTeacherDashboard setActiveTab={setActiveTab} profile={profile} classes={classes} students={students} timetable={timetable} school={school} assignments={assignments} />;
          case 'tools':
            return <MobileToolsView setActiveTab={setActiveTab} />;
          case 'profile-menu':
            return <MenuList title={t.profileAndMore} items={PROFILE_MENU_ITEMS} setActiveTab={setActiveTab} />;
          default:
            return (
              <div className="min-h-full flex flex-col bg-[#FCFBF8] dark:bg-slate-900 transition-colors duration-300">
                <MobilePageBanner title={pageTitle} profile={profile} setActiveTab={setActiveTab} />
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
                    <div className="bg-white dark:bg-slate-800 mt-4 rounded-t-2xl px-0 pt-6 pb-32 shadow-xl flex-1 mobile-content-card relative z-20 min-h-[70vh] transition-colors duration-300">
                        {renderContent()}
                    </div>
                </div>
              </div>
            );
        }
    };

    return (
      <div className="bg-[#FCFBF8] dark:bg-slate-900 min-h-screen font-sans text-slate-800 no-scrollbar overflow-y-auto transition-colors duration-300">
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          body { -ms-overflow-style: none; scrollbar-width: none; }
          body::-webkit-scrollbar { display: none; }
        `}</style>
        
        <div className="relative w-full h-screen shadow-2xl bg-white dark:bg-slate-900 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {renderMobileView()}
          </div>
          
          <div className="w-full z-[100] bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] transition-colors duration-300 shrink-0">
            <div className="flex items-center justify-around w-full h-20 px-2 pb-2">
              {MOBILE_NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id || (item.id === 'profile-menu' && ['profile', 'logout'].includes(activeTab));
                return (
                  <button key={item.id} onClick={() => { playClickSound(); setActiveTab(item.id); }} className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all">
                    <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-[#6B1D2F] text-white -translate-y-2 shadow-lg shadow-[#6B1D2F]/30' : 'text-slate-600 dark:text-slate-400'}`}>{item.icon}</div>
                    <span className={`text-[10px] font-black uppercase transition-all ${isActive ? 'text-[#6B1D2F] dark:text-[#D4AF37] opacity-100' : 'text-slate-700 dark:text-slate-400 opacity-100'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
};

export default TeacherDashboard;
