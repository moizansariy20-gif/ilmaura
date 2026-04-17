
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Home01Icon,
  DashboardSquare01Icon,
  Settings01Icon,
  Calendar03Icon,
  Wallet01Icon,
  Notification01Icon,
  UserCircleIcon,
  Message01Icon,
  Logout01Icon,
  Note01Icon,
  File01Icon,
  Book01Icon,
  Award01Icon,
  Clock01Icon,
  CreditCardIcon,
  Megaphone01Icon,
  StickyNote01Icon,
  Folder01Icon,
  RocketIcon,
  CheckListIcon,
  AiBrain01Icon,
  FolderOpenIcon,
  LicenseIcon,
  HelpCircleIcon,
  SparklesIcon,
  Menu01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  CloudUploadIcon
} from 'hugeicons-react';
import { useAuth } from '../hooks/useAuth.ts';
import { subscribeToSchoolDetails, subscribeToStudentData, subscribeToTeachers, subscribeToClassLogs } from '../services/api.ts';
import { supabase } from '../services/supabase.ts'; // UPDATED: Import Supabase
import Loader from '../components/Loader.tsx';
import StudentSkeleton from './components/StudentSkeleton.tsx';

// Lazy load sub-pages for performance
const Home = lazy(() => import('./pages/Home.tsx'));
const Assignments = lazy(() => import('./pages/Assignments.tsx'));
const Timetable = lazy(() => import('./pages/Timetable.tsx'));
const Attendance = lazy(() => import('./pages/Attendance.tsx'));
const Resources = lazy(() => import('./pages/Resources.tsx'));
const Fees = lazy(() => import('./pages/Fees.tsx'));
const ProfilePage = lazy(() => import('./pages/Profile.tsx'));
const ClassLog = lazy(() => import('./pages/ClassLog.tsx'));
const Homework = lazy(() => import('./pages/Homework.tsx'));
const LiveQuizzes = lazy(() => import('./pages/LiveQuizzes.tsx'));
const QuizPlayer = lazy(() => import('./pages/QuizPlayer.tsx'));
const Messenger = lazy(() => import('./pages/Messenger.tsx'));
const Notes = lazy(() => import('./pages/Notes.tsx'));
const IdCardPage = lazy(() => import('./pages/IdCard.tsx'));
const Complaints = lazy(() => import('./pages/Complaints.tsx'));
const Notifications = lazy(() => import('./pages/Notifications.tsx'));
const SettingsPage = lazy(() => import('./pages/Settings.tsx'));
const Leaves = lazy(() => import('./pages/Leaves.tsx'));
import { Assignment, LiveQuiz } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import StudentCharacter from '../components/assets/StudentCharacter.tsx';

import ClassAvatar from '../components/ClassAvatar.tsx';

// --- SOUND ENGINE (Audible Professional Click) ---
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

    } catch (error) {
      console.error("Audio failed", error);
    }
};

// --- Mobile Specific Components ---

const MenuList: React.FC<{title: string; items: any[]; setActiveTab: any}> = ({ title, items, setActiveTab }) => {
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
                <div className="text-[#1e3a8a] dark:text-[#D4AF37]">{item.icon}</div>
                {item.label}
              </div>
              <ArrowRight01Icon size={20} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    );
};

const MobileToolsView: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
    const menuCards = [
      { id: 'fees', label: 'My Fees', icon: <Wallet01Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'results', label: 'Attendance', icon: <Calendar03Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'leaves', label: 'Leaves', icon: <Calendar03Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'homework', label: 'Homework', icon: <Note01Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'class_log', label: 'Classwork', icon: <CheckListIcon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'assignments', label: 'Assignments', icon: <File01Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'live_quizzes', label: 'Live Quizzes', icon: <AiBrain01Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'notifications', label: 'Alerts', icon: <Notification01Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'timetable', label: 'Timetable', icon: <Clock01Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'resources', label: 'Resources', icon: <FolderOpenIcon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'messenger', label: 'Messages', icon: <Message01Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'profile', label: 'Profile', icon: <UserCircleIcon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'id_card', label: 'ID Card', icon: <LicenseIcon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'notes', label: 'My Notes', icon: <StickyNote01Icon className="w-8 h-8 text-[#D4AF37]" /> },
      { id: 'complaints', label: 'Complaints', icon: <Megaphone01Icon className="w-8 h-8 text-[#D4AF37]" /> },
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-full bg-[#FCFBF8] dark:bg-slate-900 pb-32 transition-colors duration-300"
      >
        <div className="w-full bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] p-8 pt-12 pb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.3em]">Student Hub</p>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">Student Tools</h1>
            <p className="text-white/60 text-sm mt-2 font-medium">Manage your learning</p>
          </div>
        </div>

        <div className="p-6 -mt-6 relative z-20">
          <div className="border-4 border-[#D4AF37] rounded-[2.5rem] p-8 bg-white dark:bg-slate-800 shadow-[0_20px_50px_rgba(30,58,138,0.1),inset_0_0_40px_rgba(0,0,0,0.02)] grid grid-cols-2 gap-5 transition-colors duration-300">
            {menuCards.map(card => (
              <button 
                key={card.id} 
                onClick={() => { playClickSound(); setActiveTab(card.id); }} 
                className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] p-6 rounded-3xl border border-[#D4AF37]/40 shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col items-center gap-3 hover:border-[#D4AF37] hover:shadow-[0_15px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.2)] transition-all active:scale-95 group"
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

const MobileDashboard: React.FC<{
  setActiveView: (view: string) => void;
  announcements: any[];
  assignments: Assignment[];
  profile: any;
  teachers: any[];
  timetable: any[];
  school: any;
  currentClass: any;
  setInitialChatId: (id: string) => void;
  unreadCounts: { homework: number; classwork: number; assignments: number };
}> = ({ setActiveView, announcements, profile, teachers, timetable, school, currentClass, setInitialChatId, unreadCounts }) => {
  const myTeacherIds = new Set(timetable.map(t => t.teacherId));
  
  if (currentClass?.class_teacher?.id) {
    myTeacherIds.add(currentClass.class_teacher.id);
  } else if (currentClass?.classTeacher?.id) {
    myTeacherIds.add(currentClass.classTeacher.id);
  }
  
  let myTeachers = teachers.filter(t => myTeacherIds.has(t.id));

  const classTeacherId = currentClass?.class_teacher?.id || currentClass?.classTeacher?.id;

  if (classTeacherId) {
    myTeachers = myTeachers.sort((a, b) => {
        if (a.id === classTeacherId) return -1;
        if (b.id === classTeacherId) return 1;
        return 0;
    });
  }

  const displayTeachers = myTeachers.length > 0 ? myTeachers : teachers.slice(0, 5);

  const handleTeacherClick = (teacherId: string) => {
      playClickSound();
      setInitialChatId(teacherId);
      setActiveView('messenger');
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysClassesCount = timetable.filter(slot => slot.day === today).length;
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Student';

  const quickStats = [
    { label: 'Today', icon: <Clock01Icon size={24} className="text-[#D4AF37]" />, value: `${todaysClassesCount}`, action: 'timetable' },
    { label: 'Teachers', icon: <UserCircleIcon size={24} className="text-[#D4AF37]" />, value: `${displayTeachers.length}`, action: 'messenger' },
    { label: 'Alerts', icon: <Notification01Icon size={24} className="text-[#D4AF37]" />, value: `${announcements.length} New`, action: 'notifications' },
  ];

  const menuCards = [
    { id: 'fees', label: 'My Fees', icon: <Wallet01Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'results', label: 'Attendance', icon: <Calendar03Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'leaves', label: 'Leaves', icon: <Calendar03Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'homework', label: 'Homework', icon: <Note01Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'class_log', label: 'Classwork', icon: <CheckListIcon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'assignments', label: 'Assignments', icon: <File01Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'live_quizzes', label: 'Live Quizzes', icon: <AiBrain01Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'notifications', label: 'Alerts', icon: <Notification01Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'timetable', label: 'Timetable', icon: <Clock01Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'resources', label: 'Resources', icon: <FolderOpenIcon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'messenger', label: 'Messages', icon: <Message01Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'profile', label: 'Profile', icon: <UserCircleIcon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'id_card', label: 'ID Card', icon: <LicenseIcon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'notes', label: 'My Notes', icon: <StickyNote01Icon className="w-8 h-8 text-[#D4AF37]" /> },
    { id: 'complaints', label: 'Complaints', icon: <Megaphone01Icon className="w-8 h-8 text-[#D4AF37]" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full h-[250px] bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-b-[3.5rem] shadow-[0_15px_40px_rgba(30,58,138,0.4)] relative z-10 shrink-0 flex flex-col justify-between px-6 pt-6 pb-8 overflow-hidden border-b-4 border-[#D4AF37]">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full z-0"></div>
        <div className="relative z-20 w-full h-full">
          <div className="absolute top-0 left-0 flex flex-col items-start gap-0 pl-1 pt-1">
            <h1 className="text-4xl font-black font-heading text-white tracking-tight leading-none drop-shadow-sm flex items-center gap-2">
              {firstName} 👋
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#D4AF37] text-[#1e3a8a] text-xs font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.3)] border border-white/20">Student</span>
              {currentClass && (
                <span className="inline-block px-4 py-1.5 rounded-full bg-white text-[#1e3a8a] text-xs font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 border-[#D4AF37]">
                  {currentClass.name}
                </span>
              )}
            </div>
          </div>
          <div className="absolute -top-2 -right-2 z-20">
            <div className="w-24 h-24 rounded-full p-1 bg-white shadow-[0_10px_25px_rgba(0,0,0,0.3)] border-2 border-[#D4AF37]">
              {profile?.photoURL ? (
                <img src={profile.photoURL} className="w-full h-full rounded-full object-cover shadow-inner" alt="Profile" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full rounded-full bg-[#1e3a8a] flex items-center justify-center text-white shadow-inner">
                  <UserCircleIcon size={52} className="text-[#D4AF37]" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 relative z-20 mt-auto">
          {quickStats.map((stat, idx) => (
            <button 
              key={idx} 
              onClick={() => { playClickSound(); setActiveView(stat.action); }} 
              className="group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-150 ease-out bg-gradient-to-b from-white to-slate-50 border-t-2 border-white border-b-4 border-slate-200 h-24 shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:translate-y-1 active:border-b-2 active:shadow-inner"
            >
              <div className="flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] mb-1 group-active:scale-95 transition-transform">{stat.icon}</div>
              <div className="text-center w-full">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-active:text-slate-500">{stat.label}</p>
                  <p className="text-sm font-black leading-none text-[#1e3a8a] mt-1">{stat.value}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow flex flex-col mt-6 relative z-10">
        {/* Teachers Story Bar (Mobile) */}
        {displayTeachers && displayTeachers.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-6 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {displayTeachers.map((teacher, idx) => {
              const isHead = classTeacherId === teacher.id;
              return (
                <div key={teacher.id || idx} onClick={() => handleTeacherClick(teacher.id)} className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group shrink-0 relative">
                  <div className={`w-16 h-16 rounded-full p-[3px] shadow-md active:scale-95 transition-transform duration-300 ${isHead ? 'bg-gradient-to-tr from-[#D4AF37] via-[#FDB931] to-[#D4AF37]' : 'bg-gradient-to-tr from-[#D4AF37] via-[#1e3a8a] to-[#D4AF37]'}`}>
                    <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center relative">
                      {teacher.photoURL ? (
                        <img src={teacher.photoURL} alt={teacher.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-[#1e3a8a] text-xl">
                          {teacher.name ? teacher.name[0] : 'T'}
                        </div>
                      )}
                    </div>
                  </div>
                  {isHead && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md z-10 border border-white flex items-center gap-1">
                       HEAD
                    </div>
                  )}
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center w-full truncate px-1 mt-1">
                    {teacher.name ? teacher.name.split(' ')[0] : 'Teacher'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mx-6 mb-8 w-[calc(100%-3rem)] relative group">
          {school?.bannerURL ? (
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.25)] border-2 border-[#D4AF37] relative">
              <img 
                src={school.bannerURL} 
                className="w-full h-full object-cover" 
                alt="School Banner" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-0.5">Official Banner</p>
                <p className="font-bold text-lg leading-tight drop-shadow-lg truncate">{school?.name || 'School'}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-br from-[#b5835a] via-[#8b5a2b] to-[#5c3a21] rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.25),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-[#5c3a21]/50">
              <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0.02turn, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px), repeating-linear-gradient(-0.01turn, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)' }}></div>
              <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'repeating-radial-gradient(ellipse at 50% 150%, transparent, transparent 10px, rgba(0,0,0,0.4) 10px, rgba(0,0,0,0.4) 20px)' }}></div>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none mix-blend-overlay"></div>
              <div onClick={playClickSound} className="w-full h-36 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] border-2 border-[#D4AF37] flex items-center justify-center relative overflow-hidden group active:scale-[0.98] transition-all duration-300 ease-out z-10">
                <div className="text-center text-white z-20 p-4 relative">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-[#D4AF37] shadow-xl"><SparklesIcon size={24} className="text-[#D4AF37] drop-shadow-md" /></div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-1">School Campus</p>
                  <p className="font-bold font-heading text-xl leading-tight text-white drop-shadow-md">{school?.name || 'School'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto w-full bg-white dark:bg-slate-800 rounded-t-[3rem] p-8 pb-32 border-t-4 border-[#D4AF37] shadow-[0_-15px_35px_rgba(30,58,138,0.08)] transition-colors duration-300">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black font-heading text-[#1e3a8a] dark:text-[#D4AF37] drop-shadow-sm tracking-tight">Student Tools</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {menuCards.map((item, idx) => (
              <button 
                key={`menu-${idx}`} 
                onClick={() => { playClickSound(); setActiveView(item.id); }} 
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border border-[#D4AF37]/40 h-32 gap-2 shadow-[0_8px_15px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-[#D4AF37] hover:shadow-[0_10px_20px_rgba(0,0,0,0.4),0_0_15px_rgba(212,175,55,0.2)] transition-all active:scale-95 group relative"
              >
                {/* Badge for unread counts */}
                {(item.id === 'homework' && unreadCounts.homework > 0) && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse z-20 border border-white">
                    {unreadCounts.homework}
                  </div>
                )}
                {(item.id === 'class_log' && unreadCounts.classwork > 0) && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse z-20 border border-white">
                    {unreadCounts.classwork}
                  </div>
                )}
                {(item.id === 'assignments' && unreadCounts.assignments > 0) && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse z-20 border border-white">
                    {unreadCounts.assignments}
                  </div>
                )}
                
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

const NoticeModal = ({ notice, onClose }: { notice: any, onClose: () => void }) => {
  if (!notice) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl md:max-w-3xl lg:max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="relative flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-10 lg:p-12 text-center">
            <div className="prose prose-slate md:prose-lg lg:prose-xl max-w-none mb-8">
              <div 
                className="text-slate-900 font-bold leading-relaxed"
                dangerouslySetInnerHTML={{ __html: notice.content || notice.message }}
              />
            </div>
          </div>
        </div>
        <div className="p-6 md:p-10 pt-0">
          <button 
            onClick={onClose} 
            className="w-full py-5 bg-[#1e3a8a] hover:bg-blue-800 text-white font-black text-base uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-blue-900/20"
          >
            Close Notice
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentDashboard: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active view from URL path
  const activeView = location.pathname.replace(/^\//, '') || 'home';
  
  const [school, setSchool] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClassLoaded, setIsClassLoaded] = useState(false);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<LiveQuiz[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [playingQuiz, setPlayingQuiz] = useState<LiveQuiz | null>(null);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);
  const [classLogs, setClassLogs] = useState<any[]>([]);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [latestNotice, setLatestNotice] = useState<any>(null);

  useEffect(() => {
    console.log("StudentDashboard - Quiz Submissions updated:", quizSubmissions.length);
  }, [quizSubmissions]);

  useEffect(() => {
    if (!profile?.uid) return;
    if (announcements && announcements.length > 0) {
      // Sort announcements by date descending to get the latest
      const sorted = [...announcements].sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      const latest = sorted[0];
      const seenNoticeId = localStorage.getItem(`seen_notice_${profile.uid}`);
      const uniqueId = latest.id ? String(latest.id) : String(latest.timestamp || latest.createdAt);
      
      const now = new Date();
      // Use local date string for comparison to avoid UTC issues
      const todayStr = now.toISOString().split('T')[0];
      
      const startStr = latest.start_date || null;
      const endStr = latest.end_date || null;
      
      const isWithinRange = (!startStr || todayStr >= startStr) && (!endStr || todayStr <= endStr);
      
      if (uniqueId && uniqueId !== seenNoticeId && latest.is_popup && isWithinRange) {
        setLatestNotice({ ...latest, _uniqueId: uniqueId });
        setShowNoticeModal(true);
      }
    }
  }, [announcements, profile?.uid]);

  const handleCloseNotice = () => {
    if (latestNotice && latestNotice._uniqueId && profile?.uid) {
      localStorage.setItem(`seen_notice_${profile.uid}`, latestNotice._uniqueId);
    }
    setShowNoticeModal(false);
  };

  const setActiveView = (view: string) => {
    // Update last viewed timestamp in local storage
    if (view === 'homework') localStorage.setItem('lastViewed_homework', new Date().toISOString());
    if (view === 'class_log') localStorage.setItem('lastViewed_class_log', new Date().toISOString());
    if (view === 'assignments') localStorage.setItem('lastViewed_assignments', new Date().toISOString());

    navigate(`/${view}`);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (!profile?.schoolId || !profile?.classId) return;
    setLoading(true);
    
    // Subscribe to School Data
    const unsubSchool = subscribeToSchoolDetails(profile.schoolId, (data) => setSchool(data), console.error);
    
    // Subscribe to Teachers Data (for Messenger & Dashboard)
    const unsubTeachers = subscribeToTeachers(profile.schoolId, (data: any[]) => setTeachers(data), console.error);

    // Subscribe to Student Data
    const unsubStudent = subscribeToStudentData(profile, {
      setAnnouncements: (data: any) => { setAnnouncements(data); setLoading(false); },
      setAssignments: (data: any) => { setAssignments(data); setLoading(false); },
      setTimetable: (data: any) => { setTimetable(data); setLoading(false); },
      setSubjects: (data: any) => { setSubjects(data); setLoading(false); },
      setExams: (data: any) => { setExams(data); setLoading(false); },
      setMarks: (data: any) => { setMarks(data); setLoading(false); },
      setResources: (data: any) => { setResources(data); setLoading(false); },
      setAttendance: (data: any) => { setAttendance(data); setLoading(false); },
      setQuizzes: (data: any) => { setQuizzes(data); setLoading(false); },
      setQuizSubmissions: (data: any) => { setQuizSubmissions(data); },
      setAcademicPlan: () => { setLoading(false); }
    } as any);

    // Subscribe to Class Logs (Homework & Classwork)
    const unsubClassLogs = subscribeToClassLogs(profile.schoolId, profile.classId, (logs) => {
        setClassLogs(logs);
    }, console.error);

    // UPDATED: Replaced onSnapshot with supabase single fetch for class info
    // Class info rarely changes during a session, so we fetch once.
    const fetchClass = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('id', profile.classId)
                .single();
            
            if (!error && data) {
                // Map snake_case to camelCase if needed, though most UI uses flexible access
                setCurrentClass({ 
                    id: data.id, 
                    name: data.name, 
                    classTeacher: data.class_teacher 
                });
            }
        } catch (e) {
            console.error("Error fetching class details:", e);
        } finally {
            setIsClassLoaded(true);
        }
    };

    fetchClass();

    return () => {
        unsubSchool();
        unsubStudent();
        unsubTeachers();
        unsubClassLogs();
    };
  }, [profile]);

  // Remove the full-page loader to allow the layout to render immediately.
  // Sub-components handle their own loading states.
  // if (loading && !school) return <Loader message="Loading Student App..." />;

  if (!profile || loading || !school || !isClassLoaded) return <StudentSkeleton />;

  const handleStartQuiz = (quiz: LiveQuiz) => {
      setPlayingQuiz(quiz);
  };

  if (playingQuiz) {
      return (
        <QuizPlayer 
            quiz={playingQuiz} 
            profile={profile}
            onFinish={() => setPlayingQuiz(null)}
        />
      );
  }

  // --- BADGE LOGIC ---
  const getUnreadCount = (key: string, items: any[]) => {
    const lastViewed = localStorage.getItem(key);
    // Use current time as default if never viewed to avoid showing badges on first ever load, 
    // OR use a past date to show everything as new. Let's use 0 to show all as new initially.
    const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(0); 
    
    return items.filter(item => {
        let itemDate = new Date();
        // Determine the correct date field
        if (item.createdAt?.toDate) {
            itemDate = item.createdAt.toDate();
        } else if (item.timestamp?.toDate) {
             itemDate = item.timestamp.toDate();
        } else if (item.date) { // ClassLogs usually have a 'date' string YYYY-MM-DD
             itemDate = new Date(item.date); // This is just the date part, might be inaccurate for time.
             // Ideally we use createdAt for classLogs if available.
             // If createdAt is missing in old data, fallback to 'date'.
             if (item.createdAt) {
                 // Check if it's a Firestore timestamp
                 if (item.createdAt.toDate) itemDate = item.createdAt.toDate();
                 else itemDate = new Date(item.createdAt);
             }
        }
        
        return itemDate.getTime() > lastViewedDate.getTime();
    }).length;
  };

  const unreadHomework = getUnreadCount('lastViewed_homework', classLogs.filter(l => l.type === 'homework'));
  const unreadClasswork = getUnreadCount('lastViewed_class_log', classLogs.filter(l => l.type === 'classwork'));
  const unreadAssignments = getUnreadCount('lastViewed_assignments', assignments);

  const handleQuizFinish = (quizId: string, score: number) => {
    // Manually add the submission to local state to bypass RLS/Subscription delay
    const newSubmission = {
      id: `temp-${Date.now()}`,
      quiz_id: quizId,
      student_id: profile.studentDocId,
      total_score: score,
      created_at: new Date().toISOString()
    };
    console.log("Quiz completed! Adding temporary submission to local state:", newSubmission);
    setQuizSubmissions(prev => {
        // Check if already exists to avoid duplicates
        if (prev.some(s => String(s.quiz_id) === String(quizId))) return prev;
        return [...prev, newSubmission];
    });
  };

  const renderMobileView = () => {
    if (playingQuiz) return (
      <Suspense fallback={<Loader message="Loading Quiz..." />}>
        <QuizPlayer quiz={playingQuiz} profile={profile} onFinish={() => setPlayingQuiz(null)} onQuizComplete={handleQuizFinish} />
      </Suspense>
    );

    if (activeView === 'tools') {
      return <MobileToolsView setActiveTab={setActiveView} />;
    }

    return (
      <Suspense fallback={<Loader message="Loading..." />}>
        <Routes>
          <Route path="/home" element={
            <MobileDashboard 
                setActiveView={setActiveView}
                announcements={announcements}
                assignments={assignments}
                profile={profile}
                teachers={teachers}
                timetable={timetable}
                school={school}
                currentClass={currentClass}
                setInitialChatId={setInitialChatId}
                unreadCounts={{
                    homework: unreadHomework,
                    classwork: unreadClasswork,
                    assignments: unreadAssignments
                }}
            />
          } />
          <Route path="/assignments" element={<Assignments assignments={assignments} subjects={subjects} profile={profile} currentClass={currentClass} />} />
          <Route path="/timetable" element={<Timetable timetable={timetable} subjects={subjects} school={school} profile={profile} currentClass={currentClass} />} />
          <Route path="/results" element={<Attendance attendance={attendance} exams={exams} marks={marks} subjects={subjects} profile={profile} currentClass={currentClass} loading={loading} />} />
          <Route path="/leaves" element={<Leaves profile={profile} currentClass={currentClass} school={school} />} />
          <Route path="/resources" element={<Resources resources={resources} subjects={subjects} profile={profile} currentClass={currentClass} />} />
          <Route path="/fees" element={<Fees profile={profile} school={school} currentClass={currentClass} />} />
          <Route path="/class_log" element={<ClassLog profile={profile} subjects={subjects} currentClass={currentClass} />} />
          <Route path="/homework" element={<Homework profile={profile} subjects={subjects} currentClass={currentClass} />} />
          <Route path="/live_quizzes" element={<LiveQuizzes quizzes={quizzes} quizSubmissions={quizSubmissions} subjects={subjects} onStartQuiz={handleStartQuiz} profile={profile} currentClass={currentClass} />} />
          <Route path="/messenger" element={<Messenger profile={profile} currentClass={currentClass} initialChatId={initialChatId} teachers={teachers} />} />
          <Route path="/notes" element={<Notes profile={profile} currentClass={currentClass} />} />
          <Route path="/complaints" element={<Complaints profile={profile} />} />
          <Route path="/id_card" element={<IdCardPage profile={profile} school={school} currentClass={currentClass} />} />
          <Route path="/notifications" element={<Notifications profile={profile} currentClass={currentClass} announcements={announcements} assignments={assignments} exams={exams} classLogs={classLogs} attendance={attendance} />} />
          <Route path="/profile" element={<ProfilePage profile={profile} school={school} currentClass={currentClass} />} />
          <Route path="/settings" element={<SettingsPage profile={profile} />} />
          <Route path="/tools" element={<MobileToolsView setActiveTab={setActiveView} />} />
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    );
  };

  return (
    <div className="bg-[#FCFBF8] dark:bg-slate-900 min-h-screen font-sans text-slate-800 no-scrollbar overflow-y-auto transition-colors duration-300">
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          body { -ms-overflow-style: none; scrollbar-width: none; }
          body::-webkit-scrollbar { display: none; }
        `}</style>
        {showNoticeModal && <NoticeModal notice={latestNotice} onClose={handleCloseNotice} />}
        
        {/* Only Mobile View is supported for Students currently as per design */}
        <div className="relative w-full h-screen shadow-2xl bg-white dark:bg-slate-900 flex flex-col">
            <div className="flex-1 overflow-y-auto">
                {renderMobileView()}
            </div>
            
            {/* Navigation Bar (Fixed Bottom) */}
            <div className="w-full z-[100] bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] transition-colors duration-300 shrink-0">
                <div className="flex items-center justify-around w-full h-20 px-2 pb-2">
                    <button onClick={() => setActiveView('home')} className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all">
                        <div className={`p-2 rounded-xl transition-all ${activeView === 'home' ? 'bg-[#1e3a8a] text-white -translate-y-2 shadow-lg shadow-[#1e3a8a]/30' : 'text-slate-600 dark:text-slate-400'}`}>
                            <Home01Icon size={24} />
                        </div>
                        <span className={`text-[10px] font-black uppercase transition-all ${activeView === 'home' ? 'text-[#1e3a8a] dark:text-[#D4AF37] opacity-100' : 'text-slate-700 dark:text-slate-400 opacity-100'}`}>Home</span>
                    </button>
                    <button onClick={() => setActiveView('tools')} className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all">
                        <div className={`p-2 rounded-xl transition-all ${activeView === 'tools' ? 'bg-[#1e3a8a] text-white -translate-y-2 shadow-lg shadow-[#1e3a8a]/30' : 'text-slate-600 dark:text-slate-400'}`}>
                            <DashboardSquare01Icon size={24} />
                        </div>
                        <span className={`text-[10px] font-black uppercase transition-all ${activeView === 'tools' ? 'text-[#1e3a8a] dark:text-[#D4AF37] opacity-100' : 'text-slate-700 dark:text-slate-400 opacity-100'}`}>Tools</span>
                    </button>
                    <button onClick={() => setActiveView('settings')} className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all">
                        <div className={`p-2 rounded-xl transition-all ${activeView === 'settings' ? 'bg-[#1e3a8a] text-white -translate-y-2 shadow-lg shadow-[#1e3a8a]/30' : 'text-slate-600 dark:text-slate-400'}`}>
                            <Settings01Icon size={24} />
                        </div>
                        <span className={`text-[10px] font-black uppercase transition-all ${activeView === 'settings' ? 'text-[#1e3a8a] dark:text-[#D4AF37] opacity-100' : 'text-slate-700 dark:text-slate-400 opacity-100'}`}>Settings</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default StudentDashboard;
