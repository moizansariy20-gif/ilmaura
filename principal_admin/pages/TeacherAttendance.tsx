
import React, { useState, useEffect, useMemo } from 'react';
import { 
    CalendarBlank, Users, CheckCircle, XCircle, Coffee, Clock,
    TrendUp, MagnifyingGlass, UserList, FloppyDisk, ArrowsClockwise,
    QrCode, Scan, HandPointing, User as PhosphorUser, ClockCounterClockwise, WarningCircle,
    MinusCircle
} from 'phosphor-react';
import { Teacher, TeacherAttendanceRecord } from '../../types.ts';
import { subscribeToTeacherAttendanceByDate, saveTeacherAttendance } from '../../services/api.ts';
import SmartScanner from '../components/SmartScanner.tsx';

interface TeacherAttendanceProps {
  schoolId: string;
  teachers: Teacher[];
  isTabView?: boolean;
}

const TeacherAttendance: React.FC<TeacherAttendanceProps> = ({ schoolId, teachers, isTabView = false }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent' | 'Leave' | 'Late'>>({});
  const [attendanceMode, setAttendanceMode] = useState<'manual' | 'qr' | 'face'>('manual');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [scannedTeacher, setScannedTeacher] = useState<Teacher | null>(null);
  const [lastScannedTeacher, setLastScannedTeacher] = useState<Teacher | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(30);
  }, [searchTerm]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!schoolId || !selectedDate) return;
    
    const unsub = subscribeToTeacherAttendanceByDate(schoolId, selectedDate, (data) => {
        const map: Record<string, any> = {};
        data.forEach(rec => {
            map[rec.teacherId] = rec.status;
        });
        setAttendanceMap(map);
    }, (err) => console.error("Teacher Attendance Fetch Error:", err));

    return () => unsub();
  }, [schoolId, selectedDate]);

  const handleSave = async () => {
    if (isMobile) return; // View-only on mobile
    if (Object.keys(attendanceMap).length === 0) return;
    setIsSaving(true);
    try {
        await saveTeacherAttendance(schoolId, selectedDate, attendanceMap);
        setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
        console.error("Failed to save attendance:", err);
    } finally {
        setIsSaving(false);
    }
  };

  // Filtering
  const filteredTeachers = useMemo(() => {
      return teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.designation && t.designation.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [teachers, searchTerm]);

  // KPI Stats
  const stats = useMemo(() => {
      const total = filteredTeachers.length;
      const values = Object.values(attendanceMap);
      const present = values.filter(s => s === 'Present').length;
      const absent = values.filter(s => s === 'Absent').length;
      const leave = values.filter(s => s === 'Leave').length;
      const late = values.filter(s => s === 'Late').length;
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      return { total, present, absent, leave, late, rate };
  }, [filteredTeachers, attendanceMap]);

  const handleMark = (teacherId: string, status: 'Present' | 'Absent' | 'Leave' | 'Late') => {
      if (isMobile) return; // View-only on mobile
      setAttendanceMap(prev => ({
          ...prev,
          [teacherId]: status
      }));
      const teacher = teachers.find(t => t.id === teacherId);
      if (teacher) {
          setScanHistory(prev => [{ ...teacher, status, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      }
  };

  const handleScan = (scannedData: string) => {
    if (isMobile) return; // No scanning on mobile
    let idToSearch = scannedData;
    if (scannedData.includes('/')) {
        const parts = scannedData.split('/');
        idToSearch = parts[parts.length - 1];
    }

    const teacher = teachers.find(t => t.id === idToSearch || t.name === idToSearch);
    if (teacher) {
      handleMark(teacher.id, 'Present');
      setScannedTeacher(teacher);
      setLastScannedTeacher(teacher);
      setTimeout(() => setScannedTeacher(null), 3000);
    }
  };

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
      <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 font-sans pb-24">
        {/* Premium Mobile Header */}
        <div className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] pt-12 pb-10 px-8 rounded-b-[3rem] shadow-2xl relative overflow-hidden border-b-4 border-[#D4AF37]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Staff Attendance</h1>
                <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] mt-2">Faculty Registry • View Only</p>
              </div>
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <UserList size={24} className="text-[#D4AF37]" weight="fill" />
              </div>
            </div>

            {/* Stats Grid - Premium Minimalist Style */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 w-12 h-12 bg-[#1e3a8a]/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <p className="text-[9px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest mb-1 relative z-10">Total</p>
                <p className="text-xl font-black text-[#1e3a8a] dark:text-white relative z-10">{stats.total}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 w-12 h-12 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mb-1 relative z-10">Present</p>
                <p className="text-xl font-black text-emerald-600 relative z-10">{stats.present + stats.late}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 w-12 h-12 bg-rose-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <p className="text-[9px] font-black text-rose-600/60 uppercase tracking-widest mb-1 relative z-10">Absent</p>
                <p className="text-xl font-black text-rose-600 relative z-10">{stats.absent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="px-6 -mt-6 relative z-20">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-4 py-3 flex items-center border border-slate-100 dark:border-slate-700">
              <CalendarBlank size={18} className="text-[#1e3a8a] dark:text-[#D4AF37] mr-3" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-slate-700 dark:text-slate-200 w-full"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-4 py-3 flex items-center border border-slate-100 dark:border-slate-700">
              <MagnifyingGlass size={18} className="text-[#1e3a8a] dark:text-[#D4AF37] mr-3" />
              <input 
                type="text" 
                placeholder="SEARCH STAFF..."
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="px-6 mt-8 space-y-4">
          {filteredTeachers.slice(0, visibleCount).map(teacher => {
            const status = attendanceMap[teacher.id];
            return (
              <div key={teacher.id} className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                  {teacher.photoURL ? (
                    <img src={teacher.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37]">{teacher.name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{teacher.name}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{teacher.designation || 'Faculty'}</p>
                </div>
                <div className="shrink-0">
                  <StatusIndicator status={status as any} />
                </div>
              </div>
            );
          })}

          {filteredTeachers.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-slate-300" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No staff found</p>
            </div>
          )}

          {visibleCount < filteredTeachers.length && (
            <button 
              onClick={() => setVisibleCount(prev => prev + 30)}
              className="w-full py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-[10px] font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest border border-slate-100 dark:border-slate-800"
            >
              Load More Records
            </button>
          )}
        </div>
      </div>
    );
  }

  const mainContent = (
    <div className="w-full max-w-[1920px] mx-auto flex flex-col lg:flex-row gap-6 min-h-[90vh]">
        
        {/* --- LEFT: SCANNER/REGISTRY AREA --- */}
        <div className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col">
            <div className="bg-[#1e3a8a] text-white p-6 border-b-4 border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 text-[#1e3a8a] flex items-center justify-center border-2 border-slate-900">
                        <UserList size={28} weight="fill" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Staff Registry</h1>
                        <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Faculty Attendance Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-white/10 dark:bg-slate-800/10 border-2 border-white/20">
                        <button 
                            onClick={() => setAttendanceMode('manual')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${attendanceMode === 'manual' ? 'bg-white dark:bg-slate-800 text-[#1e3a8a]' : 'text-white hover:bg-white/10 dark:bg-slate-800/10'}`}
                        >
                            Manual
                        </button>
                        <button 
                            onClick={() => setAttendanceMode('qr')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${attendanceMode === 'qr' ? 'bg-white dark:bg-slate-800 text-[#1e3a8a]' : 'text-white hover:bg-white/10 dark:bg-slate-800/10'}`}
                        >
                            QR
                        </button>
                        <button 
                            onClick={() => setAttendanceMode('face')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${attendanceMode === 'face' ? 'bg-white dark:bg-slate-800 text-[#1e3a8a]' : 'text-white hover:bg-white/10 dark:bg-slate-800/10'}`}
                        >
                            Face
                        </button>
                    </div>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)} 
                        className="bg-white/10 dark:bg-slate-800/10 border-2 border-white/20 text-white px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-white transition-all"
                    />
                </div>
            </div>

            {attendanceMode === 'manual' ? (
                <>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <div className="relative">
                            <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="SEARCH STAFF BY NAME OR DESIGNATION..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest outline-none focus:border-[#1e3a8a] transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto max-h-[700px] custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredTeachers.slice(0, visibleCount).map(teacher => {
                                const status = attendanceMap[teacher.id];
                                return (
                                    <div key={teacher.id} className="p-4 border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-[#1e3a8a] transition-all group">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 font-black text-lg shrink-0 overflow-hidden">
                                                {teacher.photoURL ? (
                                                    <img src={teacher.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <PhosphorUser size={24} weight="duotone" />
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-black text-slate-900 dark:text-white text-xs uppercase truncate">{teacher.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{teacher.designation || 'Faculty'}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1">
                                            {['Present', 'Late', 'Leave', 'Absent'].map((s) => (
                                                <button 
                                                    key={s}
                                                    onClick={() => handleMark(teacher.id, s as any)}
                                                    className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest border-2 transition-all ${status === s ? 'bg-[#1e3a8a] text-white border-slate-900 shadow-[2px_2px_0px_#1e3a8a]' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 hover:border-[#1e3a8a] hover:text-[#1e3a8a]'}`}
                                                >
                                                    {s[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredTeachers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                <PhosphorUser size={48} weight="duotone" className="mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No staff found</p>
                            </div>
                        )}

                        {visibleCount < filteredTeachers.length && (
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
                </>
            ) : (
                <div className="p-8 flex-1 flex flex-col items-center justify-center">
                    <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-800/50 border-4 border-slate-200 dark:border-slate-700 p-2 relative">
                        <SmartScanner 
                            onScan={handleScan} 
                            mode={attendanceMode === 'qr' ? 'qr' : 'face'} 
                            referenceData={attendanceMode === 'face' ? teachers.map(t => ({ id: t.id, photoURL: t.photoURL, name: t.name })) : undefined}
                        />
                        
                        {/* Scanner Overlay */}
                        <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent">
                            <div className="w-full h-full border-2 border-blue-500/30 animate-pulse flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-blue-500/50 rounded-3xl" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="flex items-center gap-2 justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                            <Scan size={16} />
                            Position {attendanceMode === 'qr' ? 'QR Code' : 'Face'} within the frame to scan
                        </div>
                    </div>
                </div>
            )}

            {/* --- SCAN FEEDBACK TOAST --- */}
            {scannedTeacher && (
                <div className="fixed top-24 right-10 z-[100] bg-emerald-600 text-white border-4 border-slate-900 shadow-[8px_8px_0px_#1e3a8a] p-6 animate-in slide-in-from-right-12 fade-in duration-300 w-96">
                    <div className="flex gap-6 items-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-2xl shrink-0 overflow-hidden">
                            {scannedTeacher.photoURL ? <img src={scannedTeacher.photoURL} className="w-full h-full object-cover"/> : <PhosphorUser size={40} weight="duotone" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle size={20} weight="fill" />
                                <span className="text-xs font-black uppercase tracking-widest">Attendance Logged</span>
                            </div>
                            <h3 className="text-xl font-black uppercase truncate">{scannedTeacher.name}</h3>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest truncate mt-1">
                                {scannedTeacher.designation || 'Faculty'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 border-t-4 border-slate-900 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {lastSaved && (
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Last Saved: {lastSaved}</p>
                    )}
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-8 py-3 border-4 border-slate-900 shadow-[4px_4px_0px_#000] text-xs font-black uppercase tracking-widest transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${isSaving ? 'bg-slate-300' : 'bg-[#1e3a8a] text-white hover:bg-blue-800'}`}
                >
                    {isSaving ? <ArrowsClockwise size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="bold" />}
                    {isSaving ? 'Saving...' : 'Save Registry'}
                </button>
            </div>
        </div>

        {/* --- RIGHT: STATS & ACTIVITY --- */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
            {/* Stats Overview */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                    <TrendUp size={20} weight="bold" className="text-[#1e3a8a]" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Staff Stats</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-2 border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 border-2 border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Present</p>
                        <p className="text-2xl font-black text-emerald-700">{stats.present + stats.late}</p>
                    </div>
                    <div className="bg-rose-50 p-4 border-2 border-rose-100">
                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Absent</p>
                        <p className="text-2xl font-black text-rose-700">{stats.absent}</p>
                    </div>
                    <div className="bg-amber-50 p-4 border-2 border-amber-100">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Leave/Late</p>
                        <p className="text-2xl font-black text-amber-700">{stats.leave + stats.late}</p>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presence Rate</span>
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
                    {scanHistory.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 border-b border-slate-50 last:border-0">
                            <div className="w-8 h-8 bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-[10px] shrink-0 overflow-hidden">
                                {s.photoURL ? <img src={s.photoURL} className="w-full h-full object-cover"/> : <PhosphorUser size={16} weight="duotone" />}
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
                    {scanHistory.length === 0 && (
                        <div className="py-12 flex flex-col items-center text-slate-300">
                            <WarningCircle size={48} weight="duotone" className="mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No activity yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );

  if (isTabView) {
    return (
        <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
            {mainContent}
        </div>
    );
  }

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      {mainContent}
    </div>
  );
};

export default TeacherAttendance;
