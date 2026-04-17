import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Users, MagnifyingGlass, CheckCircle, XCircle, Funnel, Stack } from 'phosphor-react';
import { subscribeToTimetable } from '../../services/api.ts';
import { Teacher, Class, Subject, TimetableSlot } from '../../types.ts';
import Loader from '../../components/Loader.tsx';

interface TeacherAvailabilityProps {
  schoolId: string;
  school: any;
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TeacherAvailability: React.FC<TeacherAvailabilityProps> = ({ schoolId, school, teachers, classes, subjects }) => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Default to current day
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [selectedDay, setSelectedDay] = useState<string>(WEEK_DAYS[todayIndex]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);

  const MaleAvatar = () => (
    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2 text-blue-600">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );

  const FemaleAvatar = () => (
    <div className="w-full h-full bg-rose-100 flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2 text-rose-600">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    // Fetch all timetables for the school by passing empty classId
    const unsub = subscribeToTimetable(schoolId, '', (data) => {
      setTimetable(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching timetable:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [schoolId]);

  // Extract periods from master structure or timetable
  const periods = useMemo(() => {
    if (school?.timetableConfig?.masterStructure && school.timetableConfig.masterStructure.length > 0) {
      return school.timetableConfig.masterStructure
        .filter((p: any) => !p.isBreak)
        .map((p: any) => `${p.startTime} - ${p.endTime}`);
    }
    // Fallback: extract unique time slots from timetable
    const slots = new Set<string>();
    timetable.forEach(t => {
      if (t.subjectId !== 'break') slots.add(t.timeSlot);
    });
    return Array.from(slots).sort();
  }, [school, timetable]);

  // Auto-select first period if none selected
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods, selectedPeriod]);

  // Calculate availability
  const teacherStatus = useMemo(() => {
    if (!selectedDay || !selectedPeriod) return [];

    const busyTeachersMap = new Map<string, { classId: string, subjectId: string }>();
    
    timetable.forEach(slot => {
      if (slot.day === selectedDay && slot.timeSlot === selectedPeriod && slot.teacherId && slot.teacherId !== 'break') {
        busyTeachersMap.set(slot.teacherId, { classId: slot.classId, subjectId: slot.subjectId });
      }
    });

    return teachers.map(teacher => {
      const busyInfo = busyTeachersMap.get(teacher.id);
      const cls = busyInfo ? classes.find(c => c.id === busyInfo.classId) : null;
      const sub = busyInfo ? subjects.find(s => s.id === busyInfo.subjectId) : null;
      
      return {
        ...teacher,
        isFree: !busyInfo,
        busyWithClass: cls?.name || 'Unknown Class',
        busyWithSubject: sub?.name || 'Unknown Subject'
      };
    }).filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [teachers, timetable, selectedDay, selectedPeriod, classes, subjects, searchTerm]);

  const freeCount = teacherStatus.filter(t => t.isFree).length;
  const busyCount = teacherStatus.length - freeCount;

  const visibleTeachers = teacherStatus.slice(0, visibleCount);

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      {/* --- MAIN BASE CONTAINER --- */}
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- DASHBOARD HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Teacher Availability</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">Academic</span>
              <span className="text-sm font-bold opacity-80">Monitor Staff Schedule</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <div className="w-12 h-12 bg-white/10 dark:bg-slate-800/10 flex items-center justify-center border-2 border-white/20">
              <Clock size={24} weight="fill" />
            </div>
          </div>
        </div>

        {/* --- CONTENT BODY --- */}
        <div className="p-8 flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center min-h-[400px] bg-slate-50 dark:bg-slate-800/50/50">
              <Loader />
              <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Schedule Data...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* --- METRICS GRID --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Metric 1 */}
                <div className="bg-white dark:bg-slate-800 p-6 border-2 border-blue-900 shadow-sm flex flex-col justify-between h-36 relative">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Total Staff</span>
                    <div className="p-2 bg-blue-900 text-white">
                      <Users size={20} weight="fill"/>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white">{teacherStatus.length}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Teachers</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white dark:bg-slate-800 p-6 border-2 border-emerald-600 shadow-sm flex flex-col justify-between h-36 relative">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Available</span>
                    <div className="p-2 bg-emerald-600 text-white">
                      <CheckCircle size={20} weight="fill"/>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white">{freeCount}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Free this Period</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white dark:bg-slate-800 p-6 border-2 border-rose-600 shadow-sm flex flex-col justify-between h-36 relative">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-rose-700 uppercase tracking-widest">Engaged</span>
                    <div className="p-2 bg-rose-600 text-white">
                      <XCircle size={20} weight="fill"/>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white">{busyCount}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Classrooms</span>
                  </div>
                </div>

              </div>

              {/* --- TOOLBAR --- */}
              <div className="bg-slate-800 p-4 border-b-4 border-slate-900 grid grid-cols-1 md:grid-cols-4 gap-4 items-center shadow-sm">
                <h3 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Funnel size={18} weight="fill"/> Filters
                </h3>
                
                <div className="relative">
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white text-xs font-bold uppercase tracking-widest border border-slate-600 focus:border-white outline-none appearance-none cursor-pointer"
                  >
                    {WEEK_DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white text-xs font-bold uppercase tracking-widest border border-slate-600 focus:border-white outline-none appearance-none cursor-pointer"
                  >
                    {periods.length === 0 && <option value="">No periods found</option>}
                    {periods.map(period => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="SEARCH TEACHER..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white placeholder-slate-400 text-xs font-bold uppercase tracking-widest border border-slate-600 focus:border-white outline-none"
                  />
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" weight="bold"/>
                </div>
              </div>

              {/* --- TEACHER ROSTER --- */}
              <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <Stack size={18} weight="fill" className="text-[#1e3a8a]"/>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Staff Availability List</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Teacher Details</th>
                        <th className="px-6 py-4">Designation</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Current Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {visibleTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center font-black text-slate-300 uppercase tracking-widest text-xs">
                            No teachers found matching criteria
                          </td>
                        </tr>
                      ) : (
                        visibleTeachers.map((teacher, idx) => (
                          <tr key={teacher.id} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors animate-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 20}ms` }}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white dark:bg-slate-800 flex items-center justify-center border-2 border-slate-900 shrink-0 shadow-sm overflow-hidden rounded-full">
                                  {teacher.photoURL ? (
                                    <img src={teacher.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    teacher.gender?.toLowerCase() === 'female' ? <FemaleAvatar /> : <MaleAvatar />
                                  )}
                                </div>
                                <div>
                                  <p className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{teacher.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {teacher.id.slice(-6)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-1 uppercase tracking-tighter">
                                {teacher.designation || 'Teacher'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {teacher.isFree ? (
                                <span className="text-[10px] font-black px-2 py-1 uppercase tracking-tighter text-emerald-700 bg-emerald-50 border-2 border-emerald-200">
                                  Available
                                </span>
                              ) : (
                                <span className="text-[10px] font-black px-2 py-1 uppercase tracking-tighter text-rose-700 bg-rose-50 border-2 border-rose-200">
                                  Engaged
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {teacher.isFree ? (
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No Engagement</span>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight">{teacher.busyWithClass}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{teacher.busyWithSubject}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {teacherStatus.length > visibleCount && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-100 dark:border-slate-800 text-center">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 30)}
                      className="px-8 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
                    >
                      Show More ({teacherStatus.length - visibleCount} Remaining)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAvailability;
