
import React, { useState, useEffect, useMemo } from 'react';
import { 
    CalendarBlank, Users, CheckCircle, XCircle, Coffee, 
    MinusCircle, TrendUp, MagnifyingGlass, ChalkboardTeacher, Student, HandPointing, CaretDown,
    Clock, ClockCounterClockwise, WarningCircle
} from 'phosphor-react';
import { subscribeToAttendanceByDate, setAttendance } from '../../services/api.ts';
import { AttendanceRecord } from '../../types.ts';
import { FirestoreError } from 'firebase/firestore';

interface ManualAttendanceProps {
  schoolId: string;
  students: any[];
  classes: any[];
  teachers: any[];
  profile: any;
}

const ManualAttendance: React.FC<ManualAttendanceProps> = ({ schoolId, students, classes, teachers, profile }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const [lastMarked, setLastMarked] = useState<any>(null);
  const [markHistory, setMarkHistory] = useState<any[]>([]);

  // Set default class
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes]);

  // Fetch Data
  useEffect(() => {
    if (!schoolId || !selectedDate) return;
    const unsub = subscribeToAttendanceByDate(schoolId, selectedDate, setAttendanceRecords, (err: FirestoreError) => console.error(err));
    return () => unsub();
  }, [schoolId, selectedDate]);
  
  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(30);
  }, [selectedClass, searchTerm]);

  // Filter Students
  const studentsInClass = useMemo(() => {
      return students.filter(s => {
          const matchesClass = s.classId === selectedClass;
          const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.includes(searchTerm);
          return matchesClass && matchesSearch;
      });
  }, [students, selectedClass, searchTerm]);

  const getStudentStatus = (studentId: string) => attendanceRecords.find(rec => rec.studentId === studentId)?.status;

  const handleMarkAttendance = async (student: any, status: string) => {
    try {
      await setAttendance(schoolId, {
        studentId: student.id,
        classId: selectedClass,
        teacher_id: profile.id,
        date: selectedDate,
        status
      });
      setLastMarked(student);
      setMarkHistory(prev => [{ ...student, status, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    } catch (error) {
      console.error("Error marking attendance:", error);
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
  
  const StatusIndicator: React.FC<{ status?: 'Present' | 'Absent' | 'Leave' }> = ({ status }) => {
    switch (status) {
      case 'Present':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-none shadow-sm"><CheckCircle size={12} weight="bold" /> Present</span>;
      case 'Absent':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider rounded-none shadow-sm"><XCircle size={12} weight="bold" /> Absent</span>;
      case 'Leave':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider rounded-none shadow-sm"><Coffee size={12} weight="bold" /> Leave</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-wider rounded-none border border-slate-200 dark:border-slate-700"><MinusCircle size={12} weight="bold" /> Pending</span>;
    }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      <div className="w-full max-w-[1920px] mx-auto flex flex-col lg:flex-row gap-6 min-h-[90vh]">
        
        {/* --- LEFT: REGISTRY AREA --- */}
        <div className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col">
            <div className="bg-[#1e3a8a] text-white p-6 border-b-4 border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 text-[#1e3a8a] flex items-center justify-center border-2 border-slate-900">
                        <HandPointing size={28} weight="fill" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Manual Registry</h1>
                        <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Student Attendance Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <select 
                            value={selectedClass} 
                            onChange={e => setSelectedClass(e.target.value)} 
                            className="bg-white/10 dark:bg-slate-800/10 border-2 border-white/20 text-white px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-white transition-all cursor-pointer appearance-none pr-10"
                        >
                            {classes.map(c => <option key={c.id} value={c.id} className="text-slate-900 dark:text-white">{c.name}</option>)}
                        </select>
                        <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)} 
                        className="bg-white/10 dark:bg-slate-800/10 border-2 border-white/20 text-white px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-white transition-all"
                    />
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="SEARCH BY NAME OR ROLL NO..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest outline-none focus:border-[#1e3a8a] transition-all"
                    />
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto max-h-[700px] custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {studentsInClass.slice(0, visibleCount).map(student => {
                        const status = getStudentStatus(student.id);
                        return (
                            <div key={student.id} className="p-4 border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-[#1e3a8a] transition-all group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 font-black text-lg shrink-0 overflow-hidden">
                                        {student.photoURL ? (
                                            <img src={student.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            student.name[0]
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-black text-slate-900 dark:text-white text-xs uppercase truncate">{student.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{student.rollNo}</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <StatusIndicator status={status} />
                                    </div>
                                    
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleMarkAttendance(student, 'Present')} 
                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${status === 'Present' ? 'bg-emerald-600 text-white border-slate-900 shadow-[2px_2px_0px_#1e3a8a]' : 'bg-white dark:bg-slate-800 text-emerald-600 border-slate-200 hover:border-emerald-600'}`}
                                        >
                                            P
                                        </button>
                                        <button 
                                            onClick={() => handleMarkAttendance(student, 'Absent')} 
                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${status === 'Absent' ? 'bg-rose-600 text-white border-slate-900 shadow-[2px_2px_0px_#1e3a8a]' : 'bg-white dark:bg-slate-800 text-rose-600 border-slate-200 hover:border-rose-600'}`}
                                        >
                                            A
                                        </button>
                                        <button 
                                            onClick={() => handleMarkAttendance(student, 'Leave')} 
                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${status === 'Leave' ? 'bg-amber-500 text-white border-slate-900 shadow-[2px_2px_0px_#1e3a8a]' : 'bg-white dark:bg-slate-800 text-amber-500 border-slate-200 hover:border-amber-500'}`}
                                        >
                                            L
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {studentsInClass.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                        <Student size={48} weight="duotone" className="mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No students found</p>
                    </div>
                )}

                {visibleCount < studentsInClass.length && (
                    <div className="mt-8 flex justify-center">
                        <button 
                            onClick={() => setVisibleCount(prev => prev + 30)}
                            className="px-8 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] hover:border-[#1e3a8a] transition-all"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* --- RIGHT: STATS & ACTIVITY --- */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
            {/* Stats Overview */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                    <TrendUp size={20} weight="bold" className="text-[#1e3a8a]" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Class Stats</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-2 border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 border-2 border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Present</p>
                        <p className="text-2xl font-black text-emerald-700">{stats.present}</p>
                    </div>
                    <div className="bg-rose-50 p-4 border-2 border-rose-100">
                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Absent</p>
                        <p className="text-2xl font-black text-rose-700">{stats.absent}</p>
                    </div>
                    <div className="bg-amber-50 p-4 border-2 border-amber-100">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Leave</p>
                        <p className="text-2xl font-black text-amber-700">{stats.leave}</p>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Rate</span>
                        <span className="text-sm font-black text-[#1e3a8a]">{stats.rate}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="h-full bg-[#1e3a8a] transition-all duration-500" style={{ width: `${stats.rate}%` }} />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-6 shadow-sm flex-1">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                    <ClockCounterClockwise size={20} weight="bold" className="text-[#1e3a8a]" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Recent Activity</h2>
                </div>

                <div className="space-y-4">
                    {markHistory.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 border-b border-slate-50 last:border-0">
                            <div className="w-8 h-8 bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-[10px] shrink-0 overflow-hidden">
                                {s.photoURL ? <img src={s.photoURL} className="w-full h-full object-cover"/> : s.name[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase truncate">{s.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black uppercase px-1 ${
                                        s.status === 'Present' ? 'text-emerald-600 bg-emerald-50' : 
                                        s.status === 'Absent' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'
                                    }`}>{s.status}</span>
                                    <span className="text-[8px] font-bold text-slate-400">{s.time}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {markHistory.length === 0 && (
                        <div className="py-12 flex flex-col items-center text-slate-300">
                            <WarningCircle size={48} weight="duotone" className="mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No activity yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendance;
