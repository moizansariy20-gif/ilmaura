
import React, { useState, useEffect } from 'react';
import { Check, X, Coffee, Users, CheckCircle, UserX, UserCheck, Calendar, Sparkles, Clock, ShieldAlert, Eye, QrCode, Scan, CheckCircle2 } from 'lucide-react';
import { subscribeToAttendanceByDate, setAttendance } from '../../services/api.ts';
import { AttendanceRecord } from '../../types.ts';
import { FirestoreError } from 'firebase/firestore';
import { useTranslation } from '../../services/translations.ts';
import { supabase } from '../../services/supabase.ts';
import QRScanner from '../components/QRScanner.tsx';

interface AttendanceProps {
  profile: any;
  classes: any[];
  students: any[];
}

const Attendance: React.FC<AttendanceProps> = ({ profile, classes, students }) => {
  const { t } = useTranslation();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord['status']>>(new Map());
  const [leaveApplications, setLeaveApplications] = useState<any[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (!selectedClassId || !profile.schoolId) return;

    const fetchLeaves = async () => {
      try {
        const { data, error } = await supabase
          .from('leave_applications')
          .select('*')
          .eq('school_id', profile.schoolId)
          .eq('class_id', selectedClassId);
        
        if (!error && data) {
          setLeaveApplications(data);
        }
      } catch (err) {
        console.error("Error fetching leaves:", err);
      }
    };

    fetchLeaves();
  }, [selectedClassId, profile.schoolId]);

  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;
    
    const handleError = (error: FirestoreError) => console.error("Attendance sync failed:", error);

    const unsub = subscribeToAttendanceByDate(profile.schoolId, selectedDate, (records) => {
      const newRecords = new Map<string, AttendanceRecord['status']>();
      records.filter(r => r.classId === selectedClassId).forEach(rec => newRecords.set(rec.studentId, rec.status));
      setAttendanceRecords(newRecords);
    }, handleError);

    return () => unsub();
  }, [profile.schoolId, selectedClassId, selectedDate]);
  
  const studentsInClass = students.filter(s => s.classId === selectedClassId);

  const handleSetAttendance = (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    // 1. Optimistic Update: Update UI immediately before server responds
    setAttendanceRecords(prev => {
        const newMap = new Map(prev);
        newMap.set(studentId, status);
        return newMap;
    });

    // 2. Send to Server in background
    setAttendance(profile.schoolId, {
      studentId, 
      status, 
      date: selectedDate, 
      classId: selectedClassId,
      teacherId: profile.teacherId,
      schoolId: profile.schoolId,
    }).catch(err => {
        console.error("Failed to sync attendance:", err);
        // Optional: Revert UI if needed, but rarely happens if 'setAttendance' is robust
    });
  };
  
  const handleMarkAllPresent = async () => {
    if (window.confirm(t.confirmMarkAllPresent)) {
      
      // 1. Optimistic Update
      setAttendanceRecords(prev => {
          const newMap = new Map(prev);
          studentsInClass.forEach(s => newMap.set(s.id, 'Present'));
          return newMap;
      });

      // 2. Batch Send
      const promises = studentsInClass.map(student => {
        return setAttendance(profile.schoolId, {
          studentId: student.id, 
          status: 'Present', 
          date: selectedDate, 
          classId: selectedClassId,
          teacherId: profile.teacherId,
          schoolId: profile.schoolId,
        });
      });
      await Promise.all(promises);
    }
  }

  const handleApproveLeave = async (leaveId: string, studentId: string) => {
    try {
      await supabase.from('leave_applications').update({ status: 'approved' }).eq('id', leaveId);
      setLeaveApplications(prev => prev.map(l => l.id === leaveId ? { ...l, status: 'approved' } : l));
      handleSetAttendance(studentId, 'Leave');
    } catch (err) {
      console.error("Error approving leave:", err);
    }
  };

  const handleRejectLeave = async (leaveId: string, studentId: string) => {
    try {
      await supabase.from('leave_applications').update({ status: 'rejected' }).eq('id', leaveId);
      setLeaveApplications(prev => prev.map(l => l.id === leaveId ? { ...l, status: 'rejected' } : l));
      handleSetAttendance(studentId, 'Absent');
    } catch (err) {
      console.error("Error rejecting leave:", err);
    }
  };

  const handleScan = (scannedData: string) => {
    let idToSearch = scannedData;
    if (scannedData.includes('/')) {
        const parts = scannedData.split('/');
        idToSearch = parts[parts.length - 1];
    }

    const student = students.find(s => s.rollNo === idToSearch || s.id === idToSearch);
    
    if (student) {
      if (student.classId !== selectedClassId) {
        const studentClass = classes.find(c => c.id === student.classId);
        alert(`Student ${student.name} belongs to ${studentClass?.name || 'another class'}, not the currently selected class.`);
        return;
      }

      handleSetAttendance(student.id, 'Present');
      setScannedStudent(student);
      
      // Play a success sound if possible
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {}

      setTimeout(() => setScannedStudent(null), 3000);
    } else {
      console.warn(`Student not found: ${idToSearch}`);
    }
  };
  
  const presentCount = Array.from(attendanceRecords.values()).filter(s => s === 'Present').length;
  const absentCount = Array.from(attendanceRecords.values()).filter(s => s === 'Absent').length;
  const leaveCount = Array.from(attendanceRecords.values()).filter(s => s === 'Leave').length;


  return (
    <div className="min-h-full bg-white dark:bg-[#1e293b] pb-32 font-sans relative overflow-hidden">
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header & Filters Combined - Matching Homework Style */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>
                {t.attendance}
              </h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • {t.studentRegister}</p>
                <p className="text-[11px] md:text-sm text-[#6B1D2F] dark:text-white font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  {profile.name}
                </p>
              </div>
            </div>
            <div className="flex p-1.5 md:p-2 bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[0_10px_25px_-5px_rgba(107,29,47,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-[#1e293b]/10 flex items-center justify-center relative z-10">
                {profile.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-[#E5E0D8]">
                    <Sparkles size={28} className="text-[#6B1D2F] dark:text-white md:hidden" />
                    <Sparkles size={36} className="text-[#6B1D2F] dark:text-white hidden md:block" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#D4AF37] rounded-full border-2 border-[#6B1D2F] flex items-center justify-center shadow-lg">
                <Clock size={10} className="text-[#6B1D2F] dark:text-white md:hidden" />
                <Clock size={12} className="text-[#6B1D2F] dark:text-white hidden md:block" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10">
            <div className="group">
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">{t.selectClass}</label>
              <div className="relative">
                <select 
                  value={selectedClassId} 
                  onChange={e => setSelectedClassId(e.target.value)} 
                  className="w-full p-4 bg-white dark:bg-[#1e293b] shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                  <svg width="14" height="10" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
            <div className="group">
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">{t.selectDate}</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="w-full p-4 bg-white dark:bg-[#1e293b] shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <button 
              onClick={handleMarkAllPresent} 
              className="w-full py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-bold text-sm hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(107,29,47,0.3)] border border-[#4A1420] active:scale-[0.98]"
            >
              <CheckCircle size={20} className="text-[#D4AF37]" />
              <span className="tracking-wide uppercase text-xs">{t.markAllPresent}</span>
            </button>
            <button 
              onClick={() => setIsScannerOpen(true)} 
              className="w-full py-4 bg-white dark:bg-[#1e293b] text-[#6B1D2F] dark:text-white rounded-2xl font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(107,29,47,0.1)] border-2 border-[#D4AF37]/30 active:scale-[0.98]"
            >
              <QrCode size={20} className="text-[#D4AF37]" />
              <span className="tracking-wide uppercase text-xs">Scan QR Attendance</span>
            </button>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* Stats Grid - Matching Homework Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <Users size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{studentsInClass.length}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">{t.total}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative z-10">
                  <UserCheck size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-emerald-600 leading-none drop-shadow-sm">{presentCount}</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest mt-2">{t.present}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-rose-100 dark:border-rose-900/30 relative z-10">
                  <UserX size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-rose-600 leading-none drop-shadow-sm">{absentCount}</p>
                    <p className="text-[10px] font-bold uppercase text-rose-600 tracking-widest mt-2">{t.absent}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-amber-100 dark:border-amber-900/30 relative z-10">
                  <Coffee size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-amber-600 leading-none drop-shadow-sm">{leaveCount}</p>
                    <p className="text-[10px] font-bold uppercase text-amber-600 tracking-widest mt-2">{t.leave}</p>
                </div>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                {t.studentRegister} • {studentsInClass.length} {t.totalStudents}
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentsInClass.length > 0 ? studentsInClass.map(student => {
                const status = attendanceRecords.get(student.id);
                let statusBg = 'bg-white dark:bg-[#1e293b]';
                let statusBorder = 'border-[#D4AF37]/20';
                let accentColor = 'from-[#D4AF37] to-[#6B1D2F]';
                
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
                  <div key={student.id} className={`${statusBg} p-6 md:p-8 rounded-3xl border ${statusBorder} shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] flex flex-col gap-6 transition-all duration-300 relative overflow-hidden group`}>
                    <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${accentColor} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                    
                    <div className="flex items-center justify-between relative z-10 pl-3">
                      <div className="flex items-center gap-5">
                        <div className="relative shrink-0">
                          {student.photoURL ? (
                              <img src={student.photoURL} alt={student.name} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white dark:border-[#1e293b]" />
                          ) : (
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] flex items-center justify-center text-white font-black text-2xl shrink-0 border-2 border-white dark:border-[#1e293b] shadow-lg">
                                  {student.name[0]}
                              </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[#6B1D2F] dark:text-white text-xl leading-tight truncate tracking-tight">{student.name}</p>
                        </div>
                      </div>
                      
                      {status && (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
                          status === 'Present' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 
                          status === 'Absent' ? 'bg-rose-500/10 border-rose-500/30 text-rose-600' : 
                          'bg-amber-500/10 border-amber-500/30 text-amber-600'
                        }`}>
                          {status === 'Present' ? <Check size={20} strokeWidth={3} /> : status === 'Absent' ? <X size={20} strokeWidth={3} /> : <Coffee size={20} strokeWidth={3} />}
                        </div>
                      )}
                    </div>

                    {(() => {
                      const studentLeave = leaveApplications.find(l => l.student_id === student.id && l.start_date <= selectedDate && l.end_date >= selectedDate);
                      if (studentLeave) {
                        return (
                          <div className="flex flex-col gap-3 bg-[#FCFBF8] dark:bg-[#020617] p-4 rounded-2xl shadow-[inset_0_2px_8px_rgba(107,29,47,0.04)] border border-amber-200 dark:border-amber-900/30 relative z-10">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-amber-600 flex items-center gap-2 capitalize">
                                <ShieldAlert size={16} /> Leave Application ({studentLeave.status})
                              </span>
                              <button onClick={() => setSelectedLeave(studentLeave)} className="text-xs font-bold text-[#1e3a8a] dark:text-blue-400 underline flex items-center gap-1">
                                <Eye size={14} /> View Reason
                              </button>
                            </div>
                            {studentLeave.status === 'pending' ? (
                              <div className="flex gap-3 mt-2">
                                <button 
                                  onClick={() => handleApproveLeave(studentLeave.id, student.id)}
                                  className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-sm"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectLeave(studentLeave.id, student.id)}
                                  className="flex-1 py-2 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-colors shadow-sm"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <div className="text-sm font-bold text-slate-500 mt-1 capitalize">
                                Application was {studentLeave.status}.
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="flex gap-3 bg-[#FCFBF8] dark:bg-[#020617] p-2 rounded-2xl justify-between shadow-[inset_0_2px_8px_rgba(107,29,47,0.04)] border border-[#E5E0D8] dark:border-[#1e293b] relative z-10">
                           <button 
                              onClick={() => handleSetAttendance(student.id, 'Present')} 
                              className={`p-4 rounded-xl transition-all flex-1 flex items-center justify-center ${status === 'Present' ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] scale-[1.02]' : 'bg-white dark:bg-[#1e293b] text-[#A89F91] dark:text-slate-400 hover:text-emerald-600 border border-[#E5E0D8] dark:border-[#1e293b] shadow-sm hover:shadow-md active:scale-95'}`}
                           >
                              <Check size={24} strokeWidth={3} />
                           </button>
                           <button 
                              onClick={() => handleSetAttendance(student.id, 'Absent')} 
                              className={`p-4 rounded-xl transition-all flex-1 flex items-center justify-center ${status === 'Absent' ? 'bg-rose-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)] scale-[1.02]' : 'bg-white dark:bg-[#1e293b] text-[#A89F91] dark:text-slate-400 hover:text-rose-600 border border-[#E5E0D8] dark:border-[#1e293b] shadow-sm hover:shadow-md active:scale-95'}`}
                           >
                              <X size={24} strokeWidth={3} />
                           </button>
                           <button 
                              onClick={() => handleSetAttendance(student.id, 'Leave')} 
                              className={`p-4 rounded-xl transition-all flex-1 flex items-center justify-center ${status === 'Leave' ? 'bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] scale-[1.02]' : 'bg-white dark:bg-[#1e293b] text-[#A89F91] dark:text-slate-400 hover:text-amber-600 border border-[#E5E0D8] dark:border-[#1e293b] shadow-sm hover:shadow-md active:scale-95'}`}
                           >
                              <Coffee size={24} strokeWidth={3} />
                           </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }) : (
                <div className="col-span-full text-center py-24 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                   <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white dark:from-slate-700 dark:to-slate-800 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/20">
                     <Users size={36} className="text-[#D4AF37]" />
                   </div>
                   <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">{t.noStudentsFound}</p>
                   <p className="text-sm font-bold text-[#D4AF37] mt-2">{t.selectClassOrDate}</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Reason Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl w-full max-w-md shadow-[0_20px_60px_-15px_rgba(107,29,47,0.3)] border border-[#D4AF37]/30 animate-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col max-h-[85vh]">
            {/* Top Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 pb-4 border-b border-slate-100 dark:border-[#1e293b]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-200 dark:border-amber-800/50">
                  <ShieldAlert className="text-amber-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#6B1D2F] dark:text-white leading-tight">Leave Details</h3>
                  <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Student Application</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLeave(null)}
                className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Date Range & Status */}
              <div className="bg-[#FCFBF8] dark:bg-[#020617]/50 p-3.5 rounded-2xl border border-[#D4AF37]/20 shadow-[inset_0_2px_8px_rgba(212,175,55,0.05)]">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black text-[#6B1D2F]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest">Date Range</p>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    selectedLeave.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' :
                    selectedLeave.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50' :
                    'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'
                  }`}>
                    {selectedLeave.status}
                  </span>
                </div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm">
                  {new Date(selectedLeave.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  {selectedLeave.start_date !== selectedLeave.end_date && ` - ${new Date(selectedLeave.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`}
                </p>
              </div>

              {/* Reason */}
              <div>
                <p className="text-[10px] font-black text-[#6B1D2F]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest mb-1.5 ml-1">Application Reason</p>
                <div className="bg-white dark:bg-[#020617] p-4 rounded-2xl border border-slate-200 dark:border-[#1e293b] shadow-sm max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-medium leading-relaxed">
                    {selectedLeave.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 pt-0 mt-auto">
              <button
                onClick={() => setSelectedLeave(null)}
                className="w-full py-3 bg-gradient-to-r from-[#6B1D2F] to-[#8A253D] text-white text-sm font-black tracking-wide rounded-xl hover:shadow-[0_8px_20px_-6px_rgba(107,29,47,0.5)] transition-all active:scale-[0.98]"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <QRScanner 
          onScan={handleScan} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      {/* Scan Success Toast */}
      {scannedStudent && (
        <div className="fixed top-24 right-4 md:right-10 z-[110] bg-emerald-600 text-white border-4 border-[#6B1D2F] shadow-[8px_8px_0px_rgba(107,29,47,0.3)] p-6 animate-in slide-in-from-right-12 fade-in duration-300 w-[calc(100%-2rem)] md:w-96 rounded-2xl">
          <div className="flex gap-6 items-center">
            <div className="w-20 h-20 bg-white dark:bg-[#1e293b] border-4 border-[#6B1D2F] rounded-xl flex items-center justify-center text-slate-900 dark:text-white font-black text-2xl shrink-0 overflow-hidden shadow-lg">
              {scannedStudent.photoURL ? (
                <img src={scannedStudent.photoURL} alt={scannedStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                scannedStudent.name[0]
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={20} className="text-[#D4AF37]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Attendance Marked</span>
              </div>
              <h3 className="text-xl font-black uppercase truncate tracking-tight">{scannedStudent.name}</h3>
              <p className="text-[10px] font-black opacity-80 uppercase tracking-widest truncate mt-1">
                {classes.find(c => c.id === scannedStudent.classId)?.name || 'N/A'} • {scannedStudent.rollNo}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
