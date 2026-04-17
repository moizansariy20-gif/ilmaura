import React, { useState, useEffect, useMemo } from 'react';
import { ChalkboardTeacher, CalendarBlank, WarningCircle, CheckCircle, UserSwitch, Funnel, Stack } from 'phosphor-react';
import { subscribeToTimetable } from '../../services/api.ts';
import { Teacher, Class, Subject, TimetableSlot } from '../../types.ts';
import Loader from '../../components/Loader.tsx';

interface PeriodEngagementProps {
  schoolId: string;
  school: any;
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PeriodEngagement: React.FC<PeriodEngagementProps> = ({ schoolId, school, teachers, classes, subjects }) => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [selectedDay, setSelectedDay] = useState<string>(WEEK_DAYS[todayIndex]);
  const [absentTeacherId, setAbsentTeacherId] = useState<string>('');
  
  // Local state to track substitutions: { [slotId]: substituteTeacherId }
  const [substitutions, setSubstitutions] = useState<Record<string, string>>({});

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
    const unsub = subscribeToTimetable(schoolId, '', (data) => {
      setTimetable(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching timetable:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [schoolId]);

  // Get absent teacher's schedule for the selected day
  const absentTeacherSchedule = useMemo(() => {
    if (!absentTeacherId || !selectedDay) return [];
    return timetable
      .filter(t => t.teacherId === absentTeacherId && t.day === selectedDay && t.subjectId !== 'break')
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [timetable, absentTeacherId, selectedDay]);

  // Helper to find free teachers for a specific time slot on the selected day
  const getFreeTeachersForSlot = (timeSlot: string) => {
    const busyTeacherIds = new Set(
      timetable
        .filter(t => t.day === selectedDay && t.timeSlot === timeSlot && t.teacherId && t.teacherId !== 'break')
        .map(t => t.teacherId)
    );
    return teachers.filter(t => !busyTeacherIds.has(t.id) && t.id !== absentTeacherId);
  };

  const handleAssignSubstitute = (slotId: string, substituteId: string) => {
    setSubstitutions(prev => ({
      ...prev,
      [slotId]: substituteId
    }));
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      {/* --- MAIN BASE CONTAINER --- */}
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- DASHBOARD HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Period Engagement</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">Academic</span>
              <span className="text-sm font-bold opacity-80">Substitution & Staff Management</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <div className="w-12 h-12 bg-white/10 dark:bg-slate-800/10 flex items-center justify-center border-2 border-white/20">
              <UserSwitch size={24} weight="fill" />
            </div>
          </div>
        </div>

        {/* --- CONTENT BODY --- */}
        <div className="p-8 flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center min-h-[400px] bg-slate-50 dark:bg-slate-800/50/50">
              <Loader />
              <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Initializing Substitution Engine...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* --- TOOLBAR / FILTERS --- */}
              <div className="bg-slate-800 p-4 border-b-4 border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-4 items-center shadow-sm">
                <h3 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Funnel size={18} weight="fill"/> Staff Absence Entry
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
                  <CalendarBlank size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" weight="bold"/>
                </div>

                <div className="relative">
                  <select
                    value={absentTeacherId}
                    onChange={(e) => setAbsentTeacherId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white text-xs font-bold uppercase tracking-widest border border-slate-600 focus:border-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="">-- SELECT ABSENT TEACHER --</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                  <ChalkboardTeacher size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" weight="bold"/>
                </div>
              </div>

              {absentTeacherId && (
                <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 flex items-center justify-center border-2 border-slate-900 shrink-0 shadow-sm overflow-hidden rounded-full">
                        {teachers.find(t => t.id === absentTeacherId)?.photoURL ? (
                          <img src={teachers.find(t => t.id === absentTeacherId)?.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          teachers.find(t => t.id === absentTeacherId)?.gender?.toLowerCase() === 'female' ? <FemaleAvatar /> : <MaleAvatar />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                          Schedule: {teachers.find(t => t.id === absentTeacherId)?.name}
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedDay}</p>
                      </div>
                    </div>
                    <div className="bg-[#1e3a8a] text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest border border-slate-900">
                      {absentTeacherSchedule.length} Classes
                    </div>
                  </div>

                  {absentTeacherSchedule.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-800">
                      <WarningCircle size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No classes scheduled for this teacher on {selectedDay}.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b-2 border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Time Slot</th>
                            <th className="px-6 py-4">Class & Subject</th>
                            <th className="px-6 py-4">Assign Substitute</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                          {absentTeacherSchedule.map(slot => {
                            const cls = classes.find(c => c.id === slot.classId);
                            const sub = subjects.find(s => s.id === slot.subjectId);
                            const freeTeachers = getFreeTeachersForSlot(slot.timeSlot);
                            const currentSub = substitutions[slot.id] || '';

                            return (
                              <tr key={slot.id} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{slot.timeSlot}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-600 border border-blue-100 bg-blue-50 px-2 py-0.5 uppercase tracking-tighter w-fit mb-1">
                                      {cls?.name || 'Unknown'}
                                    </span>
                                    <span className="font-black text-xs text-slate-600 dark:text-slate-300 uppercase tracking-tight">{sub?.name || 'Unknown'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className={`p-1 flex items-center border-2 transition-all ${currentSub ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 focus-within:border-slate-900'}`}>
                                    <select
                                      value={currentSub}
                                      onChange={(e) => handleAssignSubstitute(slot.id, e.target.value)}
                                      className="w-full bg-transparent text-slate-900 dark:text-white font-black text-[10px] outline-none px-2 uppercase tracking-widest py-1.5 cursor-pointer"
                                    >
                                      <option value="">-- SELECT SUBSTITUTE --</option>
                                      {freeTeachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {currentSub ? (
                                    <span className="text-[10px] font-black px-2 py-1 uppercase tracking-tighter text-emerald-700 bg-emerald-50 border-2 border-emerald-200 flex items-center gap-1.5 w-fit">
                                      <CheckCircle size={14} weight="fill" /> Assigned
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black px-2 py-1 uppercase tracking-tighter text-amber-700 bg-amber-50 border-2 border-amber-200 flex items-center gap-1.5 w-fit">
                                      <WarningCircle size={14} weight="fill" /> Pending
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodEngagement;
