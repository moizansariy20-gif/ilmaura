
import React, { useState, useEffect, useMemo } from 'react';
import { 
    CalendarBlank, Users, CheckCircle, XCircle, Coffee, 
    MinusCircle, TrendUp, Funnel, MagnifyingGlass, ChalkboardTeacher, Student, UserList,
    QrCode, Scan, HandPointing, CalendarCheck, Clock
} from 'phosphor-react';
import { 
  Check as LCheck, X as LX, Coffee as LCoffee, Users as LUsers, CheckCircle as LCheckCircle, UserX as LUserX, UserCheck as LUserCheck, 
  Calendar as LCalendar, Sparkles as LSparkles, Clock as LClock, ShieldAlert as LShieldAlert, Eye as LEye, QrCode as LQrCode, Scan as LScan, CheckCircle2 as LCheckCircle2,
  ArrowLeft as LArrowLeft
} from 'lucide-react';
import { subscribeToAttendanceByDate, setAttendance, subscribeToTeacherAttendanceByDate } from '../../services/api.ts';
import { AttendanceRecord } from '../../types.ts';
import { FirestoreError } from 'firebase/firestore';
import TeacherAttendance from './TeacherAttendance.tsx';
import SmartScanner from '../components/SmartScanner.tsx';

interface AttendanceManagementProps {
  schoolId: string;
  students: any[];
  classes: any[];
  teachers: any[];
  profile: any;
  defaultMode?: 'manual' | 'qr' | 'face';
  defaultTab?: 'student' | 'staff';
  onNavigate?: (tab: string) => void;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ 
  schoolId, students, classes, teachers, profile, 
  defaultMode = 'manual', 
  defaultTab = 'student',
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'staff'>(defaultTab);
  const [attendanceMode, setAttendanceMode] = useState<'manual' | 'qr' | 'face'>(defaultMode);

  // Update state if props change (e.g. when navigating between sub-pages)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    setAttendanceMode(defaultMode);
  }, [defaultMode]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [lastScannedStudent, setLastScannedStudent] = useState<any>(null);

  // Set default class
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      window.history.back();
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Data
  useEffect(() => {
    if (!schoolId || !selectedDate) return;
    const unsub = subscribeToAttendanceByDate(schoolId, selectedDate, setAttendanceRecords, (err: FirestoreError) => console.error(err));
    return () => unsub();
  }, [schoolId, selectedDate]);

  // Fetch Teacher Attendance for mobile view stats
  const [teacherAttendance, setTeacherAttendance] = useState<any[]>([]);
  useEffect(() => {
    if (!schoolId || !selectedDate || !isMobile) return;
    const unsub = subscribeToTeacherAttendanceByDate(schoolId, selectedDate, setTeacherAttendance, (err) => console.error(err));
    return () => unsub();
  }, [schoolId, selectedDate, isMobile]);
  
  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(30);
  }, [selectedClass, searchTerm, activeTab]);

  // Filter Students
  const studentsInClass = useMemo(() => {
      return students.filter(s => {
          const matchesClass = s.classId === selectedClass;
          const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.includes(searchTerm);
          return matchesClass && matchesSearch;
      });
  }, [students, selectedClass, searchTerm]);

  // Filter Teachers for mobile view
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.designation && t.designation.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [teachers, searchTerm]);

  // KPI Calculations
  const getStudentStatus = (studentId: string) => attendanceRecords.find(rec => rec.studentId === studentId)?.status;
  const getTeacherStatus = (teacherId: string) => teacherAttendance.find(rec => rec.teacherId === teacherId)?.status;

  const handleMarkAttendance = async (studentId: string, status: string) => {
    if (isMobile) return; // View-only on mobile
    try {
      await setAttendance(schoolId, {
        studentId,
        classId: selectedClass,
        teacher_id: profile.id,
        date: selectedDate,
        status
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Failed to mark attendance.");
    }
  };

  const handleScan = (scannedData: string) => {
    if (isMobile) return; // No scanning on mobile
    // Extract ID if it's a URL
    let idToSearch = scannedData;
    if (scannedData.includes('/')) {
        const parts = scannedData.split('/');
        idToSearch = parts[parts.length - 1];
    }

    const student = students.find(s => s.rollNo === idToSearch || s.id === idToSearch);
    if (student) {
      handleMarkAttendance(student.id, 'Present');
      setScannedStudent(student);
      setLastScannedStudent(student);
      setTimeout(() => setScannedStudent(null), 3000); // Hide after 3 seconds
    } else {
      alert(`Student not found. Scanned data: ${idToSearch}`);
    }
  };

  const stats = useMemo(() => {
      const total = studentsInClass.length;
      let present = 0;
      let absent = 0;
      let leave = 0;

      studentsInClass.forEach(s => {
          const status = getStudentStatus(s.id);
          if (status === 'Present') present++;
          else if (status === 'Absent') absent++;
          else if (status === 'Leave') leave++;
      });

      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return { total, present, absent, leave, rate };
  }, [studentsInClass, attendanceRecords]);

  const teacherStats = useMemo(() => {
    const total = filteredTeachers.length;
    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;

    filteredTeachers.forEach(t => {
      const status = getTeacherStatus(t.id);
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Leave') leave++;
      else if (status === 'Late') late++;
    });

    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, leave, late, rate };
  }, [filteredTeachers, teacherAttendance]);
  
  const StatusIndicator: React.FC<{ status?: 'Present' | 'Absent' | 'Leave' | 'Late' }> = ({ status }) => {
    switch (status) {
      case 'Present':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest"><CheckCircle size={14} weight="fill" /> Present</span>;
      case 'Absent':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest"><XCircle size={14} weight="fill" /> Absent</span>;
      case 'Leave':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest"><Coffee size={14} weight="fill" /> Leave</span>;
      case 'Late':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest"><Clock size={14} weight="fill" /> Late</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest"><MinusCircle size={14} weight="fill" /> N/A</span>;
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1e293b] pb-32 font-sans relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          
          {/* Header & Filters Combined - Matching Teacher Attendance Style */}
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-4 mb-2 relative z-10">
              <button 
                onClick={handleBack}
                className="w-10 h-10 rounded-xl bg-[#1e3a8a]/10 dark:bg-white/10 flex items-center justify-center text-[#1e3a8a] dark:text-white border border-[#1e3a8a]/20 active:scale-90 transition-transform"
              >
                <LArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-[#1e3a8a] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(30,58,138,0.1)' }}>
                  Attendance
                </h1>
                <div className="flex flex-col mt-1">
                  <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Principal App • Daily Registry</p>
                </div>
              </div>
              <div className="flex p-1.5 bg-gradient-to-br from-[#1e3a8a] to-[#172554] shadow-[0_10px_25px_-5px_rgba(30,58,138,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-[#1e293b]/10 flex items-center justify-center relative z-10">
                  {profile.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt={profile.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-[#E5E0D8]">
                      <LSparkles size={28} className="text-[#1e3a8a] dark:text-white" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full border-2 border-[#1e3a8a] flex items-center justify-center shadow-lg">
                  <LClock size={10} className="text-[#1e3a8a] dark:text-white" />
                </div>
              </div>
            </div>

            {/* Mobile Tabs - Styled to match theme */}
            <div className="flex bg-[#FCFBF8] dark:bg-[#020617] p-1 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
              <button 
                onClick={() => setActiveTab('student')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'student' ? 'bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white shadow-lg' : 'text-[#1e3a8a]/60 dark:text-white/60 hover:text-[#1e3a8a]'}`}
              >
                Students
              </button>
              <button 
                onClick={() => setActiveTab('staff')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'staff' ? 'bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white shadow-lg' : 'text-[#1e3a8a]/60 dark:text-white/60 hover:text-[#1e3a8a]'}`}
              >
                Staff
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="group">
                <label className="block text-[11px] font-bold text-[#1e3a8a] dark:text-white uppercase tracking-widest mb-2 ml-1">Select Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)} 
                  className="w-full p-4 bg-white dark:bg-[#1e293b] shadow-[inset_0_2px_8px_rgba(30,58,138,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all" 
                />
              </div>
              {activeTab === 'student' && (
                <div className="group">
                  <label className="block text-[11px] font-bold text-[#1e3a8a] dark:text-white uppercase tracking-widest mb-2 ml-1">Select Class</label>
                  <div className="relative">
                    <select 
                      value={selectedClass} 
                      onChange={e => setSelectedClass(e.target.value)} 
                      className="w-full p-4 bg-white dark:bg-[#1e293b] shadow-[inset_0_2px_8px_rgba(30,58,138,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                    >
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                      <svg width="14" height="10" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={activeTab === 'student' ? "SEARCH STUDENT..." : "SEARCH STAFF..."}
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full p-4 pl-12 bg-[#FCFBF8] dark:bg-[#020617] shadow-[inset_0_2px_8px_rgba(30,58,138,0.04)] border border-[#E5E0D8] dark:border-[#1e293b] rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all"
                />
                <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
              </div>
            </div>
          </div>

          <div className="px-4 space-y-8">
            {/* Stats Grid - Matching Teacher Attendance Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1e293b] p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(30,58,138,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                    <LUsers size={24} className="drop-shadow-sm" />
                  </div>
                  <div className="relative z-10">
                      <p className="font-black text-3xl text-[#1e3a8a] dark:text-white leading-none drop-shadow-sm">{activeTab === 'student' ? stats.total : teacherStats.total}</p>
                      <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Total</p>
                  </div>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative z-10">
                    <LUserCheck size={24} className="drop-shadow-sm" />
                  </div>
                  <div className="relative z-10">
                      <p className="font-black text-3xl text-emerald-600 leading-none drop-shadow-sm">{activeTab === 'student' ? stats.present : (teacherStats.present + teacherStats.late)}</p>
                      <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest mt-2">Present</p>
                  </div>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-rose-100 dark:border-rose-900/30 relative z-10">
                    <LUserX size={24} className="drop-shadow-sm" />
                  </div>
                  <div className="relative z-10">
                      <p className="font-black text-3xl text-rose-600 leading-none drop-shadow-sm">{activeTab === 'student' ? stats.absent : teacherStats.absent}</p>
                      <p className="text-[10px] font-bold uppercase text-rose-600 tracking-widest mt-2">Absent</p>
                  </div>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-amber-100 dark:border-amber-900/30 relative z-10">
                    <LCoffee size={24} className="drop-shadow-sm" />
                  </div>
                  <div className="relative z-10">
                      <p className="font-black text-3xl text-amber-600 leading-none drop-shadow-sm">{activeTab === 'student' ? stats.leave : teacherStats.leave}</p>
                      <p className="text-[10px] font-bold uppercase text-amber-600 tracking-widest mt-2">Leave</p>
                  </div>
              </div>
            </div>

            {/* List Section */}
            <div className="space-y-6 relative z-0">
              <div className="flex items-center gap-4">
                <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
                <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                  {activeTab === 'student' ? 'Student Register' : 'Staff Register'}
                </h2>
                <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {activeTab === 'student' ? (
                  studentsInClass.slice(0, visibleCount).length > 0 ? studentsInClass.slice(0, visibleCount).map(student => {
                    const status = getStudentStatus(student.id);
                    let statusBg = 'bg-white dark:bg-[#1e293b]';
                    let statusBorder = 'border-[#D4AF37]/20';
                    let accentColor = 'from-[#D4AF37] to-[#1e3a8a]';
                    
                    if (status === 'Present') { 
                      statusBg = 'bg-emerald-50/30 dark:bg-emerald-900/10'; 
                      statusBorder = 'border-emerald-200'; 
                      accentColor = 'from-emerald-400 to-emerald-600';
                    }
                    if (status === 'Absent') { 
                      statusBg = 'bg-rose-50/30 dark:bg-rose-900/10'; 
                      statusBorder = 'border-rose-200'; 
                      accentColor = 'from-rose-400 to-rose-600';
                    }
                    if (status === 'Leave') { 
                      statusBg = 'bg-amber-50/30 dark:bg-amber-900/10'; 
                      statusBorder = 'border-amber-200'; 
                      accentColor = 'from-amber-400 to-amber-600';
                    }
                    
                    return (
                      <div key={student.id} className={`${statusBg} p-6 rounded-3xl border ${statusBorder} shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] flex flex-col gap-6 transition-all duration-300 relative overflow-hidden group`}>
                        <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${accentColor} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                        
                        <div className="flex items-center justify-between relative z-10 pl-3">
                          <div className="flex items-center gap-5">
                            <div className="relative shrink-0">
                              {student.photoURL ? (
                                  <img src={student.photoURL} alt={student.name} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white dark:border-[#1e293b]" />
                              ) : (
                                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#172554] flex items-center justify-center text-white font-black text-2xl shrink-0 border-2 border-white dark:border-[#1e293b] shadow-lg">
                                      {student.name[0]}
                                  </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-[#1e3a8a] dark:text-white text-xl leading-tight truncate tracking-tight">{student.name}</p>
                            </div>
                          </div>
                          
                          {status && (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
                              status === 'Present' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 
                              status === 'Absent' ? 'bg-rose-500/10 border-rose-500/30 text-rose-600' : 
                              'bg-amber-500/10 border-amber-500/30 text-amber-600'
                            }`}>
                              {status === 'Present' ? <LCheck size={20} strokeWidth={3} /> : status === 'Absent' ? <LX size={20} strokeWidth={3} /> : <LCoffee size={20} strokeWidth={3} />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full text-center py-24 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(30,58,138,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                       <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white dark:from-slate-700 dark:to-slate-800 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(30,58,138,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/20">
                         <LUsers size={36} className="text-[#D4AF37]" />
                       </div>
                       <p className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">No Students Found</p>
                     </div>
                  )
                ) : (
                  filteredTeachers.slice(0, visibleCount).length > 0 ? filteredTeachers.slice(0, visibleCount).map(teacher => {
                    const status = getTeacherStatus(teacher.id);
                    let statusBg = 'bg-white dark:bg-[#1e293b]';
                    let statusBorder = 'border-[#D4AF37]/20';
                    let accentColor = 'from-[#D4AF37] to-[#1e3a8a]';
                    
                    if (status === 'Present' || status === 'Late') { 
                      statusBg = 'bg-emerald-50/30 dark:bg-emerald-900/10'; 
                      statusBorder = 'border-emerald-200'; 
                      accentColor = 'from-emerald-400 to-emerald-600';
                    }
                    if (status === 'Absent') { 
                      statusBg = 'bg-rose-50/30 dark:bg-rose-900/10'; 
                      statusBorder = 'border-rose-200'; 
                      accentColor = 'from-rose-400 to-rose-600';
                    }
                    if (status === 'Leave') { 
                      statusBg = 'bg-amber-50/30 dark:bg-amber-900/10'; 
                      statusBorder = 'border-amber-200'; 
                      accentColor = 'from-amber-400 to-amber-600';
                    }
                    
                    return (
                      <div key={teacher.id} className={`${statusBg} p-6 rounded-3xl border ${statusBorder} shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] flex flex-col gap-6 transition-all duration-300 relative overflow-hidden group`}>
                        <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${accentColor} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                        
                        <div className="flex items-center justify-between relative z-10 pl-3">
                          <div className="flex items-center gap-5">
                            <div className="relative shrink-0">
                              {teacher.photoURL ? (
                                  <img src={teacher.photoURL} alt={teacher.name} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white dark:border-[#1e293b]" />
                              ) : (
                                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#172554] flex items-center justify-center text-white font-black text-2xl shrink-0 border-2 border-white dark:border-[#1e293b] shadow-lg">
                                      {teacher.name[0]}
                                  </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-[#6B1D2F] dark:text-white text-xl leading-tight truncate tracking-tight">{teacher.name}</p>
                              <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mt-1">{teacher.designation || 'Faculty'}</p>
                            </div>
                          </div>
                          
                          {status && (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
                              (status === 'Present' || status === 'Late') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 
                              status === 'Absent' ? 'bg-rose-500/10 border-rose-500/30 text-rose-600' : 
                              'bg-amber-500/10 border-amber-500/30 text-amber-600'
                            }`}>
                              {(status === 'Present' || status === 'Late') ? <LCheck size={20} strokeWidth={3} /> : status === 'Absent' ? <LX size={20} strokeWidth={3} /> : <LCoffee size={20} strokeWidth={3} />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full text-center py-24 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                       <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white dark:from-slate-700 dark:to-slate-800 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/20">
                         <Users size={36} className="text-[#D4AF37]" />
                       </div>
                       <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">No Staff Found</p>
                     </div>
                  )
                )}
              </div>

              {((activeTab === 'student' && visibleCount < studentsInClass.length) || (activeTab === 'staff' && visibleCount < filteredTeachers.length)) && (
                <button 
                  onClick={() => setVisibleCount(prev => prev + 30)}
                  className="w-full py-4 bg-white dark:bg-[#1e293b] text-[#1e3a8a] dark:text-white rounded-2xl font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(30,58,138,0.1)] border-2 border-[#D4AF37]/30 active:scale-[0.98]"
                >
                  <span className="tracking-wide uppercase text-xs">Load More Records</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">Attendance Tracking</h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="bg-white dark:bg-[#1e293b] text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                         Daily Log
                     </span>
                </div>
            </div>
            
            {activeTab === 'student' && (
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                 <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Attendance Rate</p>
                    <p className="text-2xl font-black leading-none">{stats.rate}%</p>
                 </div>
                 <div className="w-12 h-12 border-2 border-white/20 flex items-center justify-center bg-emerald-500 text-white rounded-none">
                    <TrendUp size={24} weight="fill"/>
                 </div>
              </div>
            )}
        </div>

        {/* --- TABS --- */}
        <div className="flex border-b-2 border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#0f172a] px-8 pt-4 gap-2 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('student')}
                className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-xs transition-all border-b-4 ${activeTab === 'student' ? 'border-[#1e3a8a] text-[#1e3a8a] bg-white dark:bg-[#1e293b]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-100'}`}
            >
                <Student size={18} weight={activeTab === 'student' ? 'fill' : 'regular'} />
                Student Attendance
            </button>
            <button 
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-xs transition-all border-b-4 ${activeTab === 'staff' ? 'border-[#1e3a8a] text-[#1e3a8a] bg-white dark:bg-[#1e293b]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-100'}`}
            >
                <UserList size={18} weight={activeTab === 'staff' ? 'fill' : 'regular'} />
                Staff Attendance
            </button>
        </div>

        {activeTab === 'student' ? (
          <div className="p-8 space-y-8 bg-white dark:bg-[#1e293b]">
            
            {/* --- KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total */}
                <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-blue-900 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Class Strength</span>
                        <div className="p-2 bg-blue-900 text-white rounded-none">
                            <Users size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</span>
                    </div>
                </div>

                {/* Present */}
                <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-emerald-600 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Present</span>
                        <div className="p-2 bg-emerald-600 text-white rounded-none">
                            <CheckCircle size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stats.present}</h3>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">In Class</span>
                    </div>
                </div>

                {/* Absent */}
                <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-rose-600 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-rose-700 uppercase tracking-widest">Absent</span>
                        <div className="p-2 bg-rose-600 text-white rounded-none">
                            <XCircle size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stats.absent}</h3>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Unaccounted</span>
                    </div>
                </div>

                {/* Leave */}
                <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-amber-500 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-amber-700 uppercase tracking-widest">On Leave</span>
                        <div className="p-2 bg-amber-500 text-white rounded-none">
                            <Coffee size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{stats.leave}</h3>
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Approved</span>
                    </div>
                </div>
            </div>

            {/* --- SIDE TOAST NOTIFICATION --- */}
            {scannedStudent && (
                <div className="fixed top-6 right-6 z-[100] bg-white dark:bg-[#1e293b] border-2 border-emerald-500 shadow-[4px_4px_0px_#10b981] p-4 animate-in slide-in-from-right-8 fade-in duration-300 w-80">
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-slate-100 border-2 border-slate-200 dark:border-[#1e293b] flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-xl shrink-0">
                            {scannedStudent.photoURL ? <img src={scannedStudent.photoURL} className="w-full h-full object-cover"/> : scannedStudent.name[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-1 mb-1">
                                <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Present</span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{scannedStudent.name}</h3>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate mt-0.5">
                                {classes.find(c => c.id === scannedStudent.classId)?.name || 'N/A'} 
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#1e293b] border-2 border-[#1e3a8a] shadow-sm flex flex-col md:flex-row items-center justify-between p-1 mt-6">
                <div className="flex gap-2 w-full md:w-auto p-1">
                   {/* Class Selector */}
                   <div className="flex items-center bg-slate-100 border-2 border-slate-200 dark:border-[#1e293b] p-1 w-full md:w-56 group focus-within:border-[#1e3a8a]">
                        <ChalkboardTeacher size={16} weight="fill" className="text-slate-400 ml-2 group-focus-within:text-[#1e3a8a]"/>
                        <select 
                            value={selectedClass} 
                            onChange={e => setSelectedClass(e.target.value)} 
                            className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none uppercase tracking-wide cursor-pointer"
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                   </div>
                   
                   {/* Date Picker */}
                   <div className="flex items-center bg-slate-100 border-2 border-slate-200 dark:border-[#1e293b] p-1 w-full md:w-48 group focus-within:border-[#1e3a8a]">
                        <CalendarBlank size={16} weight="fill" className="text-slate-400 ml-2 group-focus-within:text-[#1e3a8a]"/>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={e => setSelectedDate(e.target.value)} 
                            className="w-full bg-transparent p-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none uppercase tracking-wide"
                        />
                   </div>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-1 p-1 bg-slate-100 border-2 border-slate-200 dark:border-[#1e293b]">
                    <button 
                        onClick={() => setAttendanceMode('manual')}
                        className={`flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${attendanceMode === 'manual' ? 'bg-[#1e3a8a] text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
                    >
                        <HandPointing size={14} weight={attendanceMode === 'manual' ? 'fill' : 'regular'} />
                        Manual
                    </button>
                    <button 
                        onClick={() => setAttendanceMode('qr')}
                        className={`flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${attendanceMode === 'qr' ? 'bg-[#1e3a8a] text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
                    >
                        <QrCode size={14} weight={attendanceMode === 'qr' ? 'fill' : 'regular'} />
                        QR/Barcode
                    </button>
                    <button 
                        onClick={() => setAttendanceMode('face')}
                        className={`flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${attendanceMode === 'face' ? 'bg-[#1e3a8a] text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
                    >
                        <Scan size={14} weight={attendanceMode === 'face' ? 'fill' : 'regular'} />
                        Face Scan
                    </button>
                </div>

                {/* Search */}
                <div className="w-full md:w-64 p-1">
                     <div className="flex items-center bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-[#1e293b] p-1 group focus-within:border-[#1e3a8a]">
                         <input 
                            type="text" 
                            placeholder="SEARCH STUDENT..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full bg-transparent px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                         />
                         <MagnifyingGlass size={16} weight="bold" className="text-slate-400 mr-2 group-focus-within:text-[#1e3a8a]"/>
                     </div>
                </div>
            </div>

            {/* --- LIST GRID OR SCANNER --- */}
            <div className="bg-slate-50 dark:bg-[#0f172a] p-6 min-h-[400px] border-2 border-slate-200 dark:border-[#1e293b] border-t-0 -mt-2">
                
                {attendanceMode === 'qr' && (
                    <div className="mb-8">
                        <SmartScanner onScan={handleScan} mode="qr" />
                    </div>
                )}

                {attendanceMode === 'face' && (
                    <div className="mb-8">
                        <SmartScanner 
                            onScan={handleScan} 
                            mode="face" 
                            referenceData={studentsInClass.map(s => ({ id: s.id, photoURL: s.photoURL, name: s.name }))}
                        />
                    </div>
                )}

                {/* --- LAST SCANNED PERSISTENT BOX --- */}
                {(attendanceMode === 'qr' || attendanceMode === 'face') && lastScannedStudent && (
                    <div className="mb-8 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-[#1e293b] p-4 flex items-center gap-4 shadow-sm animate-in fade-in duration-300">
                        <div className="w-14 h-14 bg-slate-100 border-2 border-slate-200 dark:border-[#1e293b] flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-xl shrink-0">
                            {lastScannedStudent.photoURL ? <img src={lastScannedStudent.photoURL} className="w-full h-full object-cover"/> : lastScannedStudent.name[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 mb-0.5">
                                <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Last Scanned Successfully</p>
                            </div>
                            <p className="text-lg font-black text-slate-900 dark:text-white truncate leading-tight uppercase">{lastScannedStudent.name}</p>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate mt-0.5">
                                Class: {classes.find(c => c.id === lastScannedStudent.classId)?.name || 'N/A'}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {studentsInClass.slice(0, visibleCount).map(student => {
                    const status = getStudentStatus(student.id);
                    return (
                      <div key={student.id} className="p-5 border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#1e293b] flex flex-col justify-between group hover:border-[#1e3a8a] hover:shadow-[4px_4px_0px_#1e3a8a] transition-all relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 border-2 border-slate-200 dark:border-[#1e293b] flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-xs shrink-0 overflow-hidden">
                                     {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover"/> : student.name[0]}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 dark:text-white text-sm uppercase line-clamp-1" title={student.name}>{student.name}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-3 border-t-2 border-slate-100 dark:border-[#334155] flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                                <StatusIndicator status={status} />
                            </div>
                            
                            {attendanceMode === 'manual' && (
                                <div className="flex gap-1 mt-2">
                                    <button onClick={() => handleMarkAttendance(student.id, 'Present')} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${status === 'Present' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-[#1e293b] text-emerald-600 border-emerald-600 hover:bg-emerald-50'}`}>P</button>
                                    <button onClick={() => handleMarkAttendance(student.id, 'Absent')} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${status === 'Absent' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-[#1e293b] text-rose-600 border-rose-600 hover:bg-rose-50'}`}>A</button>
                                    <button onClick={() => handleMarkAttendance(student.id, 'Leave')} className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${status === 'Leave' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-[#1e293b] text-amber-500 border-amber-500 hover:bg-amber-50'}`}>L</button>
                                </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {studentsInClass.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                   <Users size={48} weight="duotone" className="mb-2 opacity-30"/>
                   <p className="font-black text-sm uppercase tracking-widest">No records found</p>
                 </div>
               )}

               {visibleCount < studentsInClass.length && (
                 <div className="mt-8 flex justify-center">
                   <button 
                     onClick={() => setVisibleCount(prev => prev + 30)}
                     className="px-8 py-3 bg-white dark:bg-[#1e293b] border-2 border-slate-300 text-slate-700 dark:text-slate-200 font-black uppercase tracking-widest text-xs hover:border-[#1e3a8a] hover:text-[#1e3a8a] transition-colors shadow-sm"
                   >
                     Show More
                   </button>
                 </div>
               )}
            </div>
        </div>
        ) : (
          <div className="p-0">
            {/* Render TeacherAttendance inside the tab, but strip its outer layout if possible. For now, just render it. */}
            <TeacherAttendance schoolId={schoolId} teachers={teachers} isTabView={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManagement;
