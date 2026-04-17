import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Plus, X, Trash, Coffee, Confetti, FloppyDisk, PencilSimple,
    Calculator, Flask, Atom, TestTube, BookBookmark, 
    Scroll, Globe, Palette, MusicNotes, Laptop, BookOpen, Book, DownloadSimple,
    CalendarBlank, Clock, ListPlus, CheckCircle
} from 'phosphor-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    addTimetableSlot, deleteTimetableSlot, subscribeToTimetable, updateSchoolFirestore
} from '../../services/api.ts';
import { TimetableSlot, Subject, Teacher, Class } from '../../types.ts';
import { FirestoreError } from 'firebase/firestore';

import html2canvas from 'html2canvas';

interface TimetableManagementProps {
  school: any;
  schoolId: string;
  classes: Class[];
  teachers: Teacher[];
  subjects: Subject[];
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Visual mapping using Phosphor Icons
const subjectVisuals: { [key: string]: { icon: React.FC<any>, color: string, textColor: string, bgColor: string } } = {
  math: { icon: Calculator, color: 'border-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  science: { icon: Flask, color: 'border-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  physics: { icon: Atom, color: 'border-indigo-500', textColor: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  chemistry: { icon: TestTube, color: 'border-violet-500', textColor: 'text-violet-600', bgColor: 'bg-violet-50' },
  english: { icon: BookBookmark, color: 'border-rose-500', textColor: 'text-rose-600', bgColor: 'bg-rose-50' },
  history: { icon: Scroll, color: 'border-amber-700', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  geography: { icon: Globe, color: 'border-cyan-500', textColor: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  art: { icon: Palette, color: 'border-pink-500', textColor: 'text-pink-600', bgColor: 'bg-pink-50' },
  music: { icon: MusicNotes, color: 'border-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  computer: { icon: Laptop, color: 'border-slate-600', textColor: 'text-slate-600', bgColor: 'bg-slate-200' },
  islam: { icon: BookOpen, color: 'border-teal-700', textColor: 'text-teal-700', bgColor: 'bg-teal-50' },
  default: { icon: Book, color: 'border-slate-400', textColor: 'text-slate-500', bgColor: 'bg-slate-100' },
};

const getSubjectVisuals = (subjectName: string) => {
  if (!subjectName) return subjectVisuals.default;
  const name = subjectName.toLowerCase();
  for (const key in subjectVisuals) { if (name.includes(key)) return subjectVisuals[key]; }
  return subjectVisuals.default;
};

const TimetableManagement: React.FC<TimetableManagementProps> = ({ school, schoolId, classes, teachers, subjects }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [modalData, setModalData] = useState({ id: '', day: '', startTime: '08:00', endTime: '09:00', subjectId: '', teacherId: '', isBreak: false });

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);

  const filteredSubjects = useMemo(() => {
    if (!selectedClass || !selectedClass.subjectAssignments) return subjects;
    const assignedSubjectIds = Object.keys(selectedClass.subjectAssignments);
    if (assignedSubjectIds.length === 0) return subjects;
    return subjects.filter(s => assignedSubjectIds.includes(s.id));
  }, [subjects, selectedClass]);

  const filteredTeachers = useMemo(() => {
    if (!selectedClass) return teachers;
    const assignedTeacherIds = selectedClass.subjectAssignments 
      ? Object.values(selectedClass.subjectAssignments).filter(t => t !== null).map(t => t!.id)
      : [];
    const involvedTeacherIds = selectedClass.involvedTeachers || [];
    const allRelevantTeacherIds = Array.from(new Set([...assignedTeacherIds, ...involvedTeacherIds]));
    if (allRelevantTeacherIds.length === 0) return teachers;
    return teachers.filter(t => allRelevantTeacherIds.includes(t.id));
  }, [teachers, selectedClass]);

  useEffect(() => {
    if (modalData.subjectId && selectedClass?.subjectAssignments?.[modalData.subjectId]) {
      const assignedTeacher = selectedClass.subjectAssignments[modalData.subjectId];
      if (assignedTeacher && assignedTeacher.id !== modalData.teacherId) {
        setModalData(prev => ({ ...prev, teacherId: assignedTeacher.id }));
      }
    }
  }, [modalData.subjectId, selectedClass]);

  const [masterStructure, setMasterStructure] = useState<{ startTime: string; endTime: string; isBreak: boolean; label: string }[]>([]);
  const [dayStructures, setDayStructures] = useState<{ [day: string]: { startTime: string; endTime: string; isBreak: boolean; label: string }[] }>({});
  const [selectedMasterDay, setSelectedMasterDay] = useState<string>('All');
  const [activeDay, setActiveDay] = useState(WEEK_DAYS[0]);
  const printRef = useRef<HTMLDivElement>(null);

  const fullHolidays = useMemo(() => school?.timetableConfig?.fullHolidays || {}, [school]);

  useEffect(() => {
    if (school?.timetableConfig?.masterStructure) {
      setMasterStructure(school.timetableConfig.masterStructure);
    }
    if (school?.timetableConfig?.dayStructures) {
      setDayStructures(school.timetableConfig.dayStructures);
    }
  }, [school]);

  useEffect(() => { if (classes.length > 0 && !selectedClassId) setSelectedClassId(classes[0].id); }, [classes]);
  useEffect(() => {
    if (!schoolId || !selectedClassId) { setTimetable([]); return; }
    const unsub = subscribeToTimetable(schoolId, selectedClassId, setTimetable, (e: FirestoreError) => console.error(e));
    return () => unsub();
  }, [schoolId, selectedClassId]);

  const handleOpenModal = (day: string, slotData: TimetableSlot | null = null, mSlot: any = null) => {
    if (slotData) {
      const isBreak = slotData.subjectId === 'break';
      const [startTime, endTime] = slotData.timeSlot.split(' - ');
      setModalData({ 
        id: slotData.id, 
        day: slotData.day, 
        startTime: startTime || '08:00', 
        endTime: endTime || '09:00', 
        subjectId: isBreak ? '' : slotData.subjectId, 
        teacherId: isBreak ? '' : slotData.teacherId,
        isBreak
      });
    } else if (mSlot) {
      setModalData({ 
        id: '', 
        day, 
        startTime: mSlot.startTime, 
        endTime: mSlot.endTime, 
        subjectId: '', 
        teacherId: '', 
        isBreak: mSlot.isBreak 
      });
    } else {
      setModalData({ id: '', day, startTime: '08:00', endTime: '09:00', subjectId: '', teacherId: '', isBreak: false });
    }
    setShowModal(true);
  };

  const handleSaveSlot = async () => {
    if (!modalData.isBreak && (!modalData.subjectId || !modalData.teacherId)) return;
    if (!modalData.startTime || !modalData.endTime) return;

    const timeSlot = `${modalData.startTime} - ${modalData.endTime}`;
    const subjectId = modalData.isBreak ? 'break' : modalData.subjectId;
    const teacherId = modalData.isBreak ? 'break' : modalData.teacherId;

    const slotPayload = { 
      classId: selectedClassId, 
      day: modalData.day, 
      timeSlot, 
      subjectId, 
      teacherId 
    };

    if (modalData.id) {
      // If editing, delete old and add new (since we don't have an updateTimetableSlot API easily available)
      await deleteTimetableSlot(schoolId, modalData.id);
    }
    await addTimetableSlot(schoolId, slotPayload);
    setShowModal(false);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    const className = classes.find(c => c.id === selectedClassId)?.name || 'Class';
    
    // Temporarily show the print section off-screen
    const printElement = printRef.current;
    const originalStyle = printElement.getAttribute('style') || '';
    
    printElement.style.display = 'block';
    printElement.style.position = 'absolute';
    printElement.style.left = '-9999px';
    printElement.style.top = '0';
    
    try {
      const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Timetable_${className.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      printElement.setAttribute('style', originalStyle);
    }
  };
  
  const handleSaveMasterStructure = async () => {
    const updatedConfig = {
      ...(school.timetableConfig || {}),
      masterStructure,
      dayStructures
    };
    await updateSchoolFirestore(schoolId, { timetableConfig: updatedConfig });
    setShowMasterModal(false);
  };

  const handleToggleHoliday = async () => {
    const updatedHolidays = { ...fullHolidays, [activeDay]: !isHoliday };
    const updatedConfig = {
      ...(school.timetableConfig || {}),
      fullHolidays: updatedHolidays
    };
    await updateSchoolFirestore(schoolId, { timetableConfig: updatedConfig });
  };

  const isHoliday = fullHolidays[activeDay];
  const activeDaySlots = timetable.filter(s => s.day === activeDay).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">Timetable Manager</h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                         Class Scheduler
                     </span>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4 md:mt-0 items-center">
               <div className="flex items-center bg-white dark:bg-slate-800 text-[#1e3a8a] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] px-2 py-1">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-2 ml-2">Class:</span>
                   <select 
                        value={selectedClassId} 
                        onChange={e => setSelectedClassId(e.target.value)} 
                        className="bg-transparent text-[#1e3a8a] font-black text-sm outline-none pr-4 py-1.5 uppercase tracking-wide cursor-pointer appearance-none"
                    >
                        {classes.length > 0 ? classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option value="">No Classes</option>}
                    </select>
               </div>
               
               <button 
                  onClick={() => setShowMasterModal(true)}
                  className="bg-white/10 dark:bg-slate-800/10 text-white px-4 py-2.5 font-black text-xs uppercase tracking-widest hover:bg-white/20 dark:bg-slate-800/20 transition-all border-2 border-white/20 flex items-center gap-2"
               >
                  <Clock size={18} weight="bold" /> Master Settings
               </button>

               <button 
                  onClick={handleDownloadPDF}
                  className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-4 py-2.5 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border-2 border-transparent hover:border-slate-300 flex items-center gap-2"
               >
                  <DownloadSimple size={18} weight="bold" /> Download Timetable
               </button>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 min-h-[600px]">
             
             {masterStructure.length === 0 ? (
                 <div className="flex flex-col items-center justify-center text-center h-[500px] border-4 border-dashed border-slate-300 bg-white dark:bg-slate-800">
                     <Clock size={64} weight="duotone" className="text-slate-300 mb-6" />
                     <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Step 1: Define Master Structure</h3>
                     <p className="font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest text-sm max-w-md">
                         Before creating timetables, you must define the standard periods and breaks for the whole school.
                     </p>
                     <button 
                        onClick={() => setShowMasterModal(true)}
                        className="mt-8 bg-[#1e3a8a] text-white px-8 py-4 font-black text-sm uppercase tracking-widest hover:bg-[#172554] transition-all flex items-center gap-3 shadow-lg"
                     >
                        <Clock size={24} weight="bold" /> Setup Master Settings
                     </button>
                 </div>
             ) : (
                 <>
                     {/* Day Tabs */}
                     <div className="flex flex-wrap border-b-4 border-slate-200 dark:border-slate-700 mb-8 bg-white dark:bg-slate-800">
                        {WEEK_DAYS.map(day => (
                            <button 
                                key={day} 
                                onClick={() => setActiveDay(day)} 
                                className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeDay === day ? 'bg-[#1e3a8a] text-white border-b-4 border-black -mb-1' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-300'}`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    <div key={activeDay} className="relative">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{activeDay}'s Schedule</h2>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleToggleHoliday}
                                    className={`px-4 py-2 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${isHoliday ? 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 hover:bg-slate-100'}`}
                                >
                                    <CalendarBlank size={16} weight={isHoliday ? "fill" : "bold"} /> 
                                    {isHoliday ? 'Remove Holiday' : 'Mark as Holiday'}
                                </button>
                            </div>
                        </div>

                        {isHoliday ? (
                            <div className="flex flex-col items-center justify-center text-center h-[400px] border-4 border-dashed border-indigo-200 bg-indigo-50/50">
                                <Confetti size={64} weight="duotone" className="text-indigo-400 mb-6" />
                                <h3 className="text-3xl font-black text-indigo-800 uppercase tracking-tight">It's a Holiday!</h3>
                                <p className="font-bold text-indigo-600/80 mt-1 uppercase tracking-widest text-xs">No classes scheduled.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {(dayStructures[activeDay] || masterStructure).map((mSlot, index) => {
                                        const timeString = `${mSlot.startTime} - ${mSlot.endTime}`;
                                        const dbSlot = timetable.find(s => s.day === activeDay && s.timeSlot === timeString);
                                        
                                        if (mSlot.isBreak) {
                                            return (
                                                <div key={index} className="relative group min-h-[180px]">
                                                    <div className="bg-slate-200/50 p-6 border-2 border-slate-300 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 h-full relative transition-all">
                                                        <Coffee size={32} weight="fill" className="mb-2"/> 
                                                        <span className="text-sm font-black uppercase tracking-wider">{mSlot.label}</span> 
                                                        <span className="font-mono text-xs mt-1 font-bold bg-white dark:bg-slate-800 px-2 py-1 border border-slate-300">{timeString}</span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (!dbSlot) {
                                            return (
                                                <div key={index} onClick={() => handleOpenModal(activeDay, null, mSlot)} className="relative group min-h-[180px] cursor-pointer">
                                                    <div className="p-6 border-2 border-dashed border-slate-300 h-full flex flex-col items-center justify-center transition-all bg-white dark:bg-slate-800 hover:border-[#1e3a8a] hover:bg-slate-50">
                                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors text-slate-400">
                                                            <Plus size={24} weight="bold" />
                                                        </div>
                                                        <p className="font-black text-sm text-slate-500 dark:text-slate-400 uppercase tracking-tight">Assign Subject</p>
                                                        <span className="font-mono text-[10px] mt-2 font-bold bg-slate-100 px-2 py-1 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">{timeString}</span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const subjectName = subjects.find(s => s.id === dbSlot.subjectId)?.name || 'Unassigned';
                                        const teacher = teachers.find(t => t.id === dbSlot.teacherId);
                                        const visuals = getSubjectVisuals(subjectName);
                                        const IconComponent = visuals.icon;

                                        return (
                                            <div key={dbSlot.id} className="relative group min-h-[180px]">
                                                <div className={`p-6 border-l-8 h-full flex flex-col justify-between transition-all bg-white dark:bg-slate-800 shadow-sm border-2 border-slate-200 hover:border-[#1e3a8a] hover:shadow-[4px_4px_0px_#1e3a8a] ${visuals.color}`}>
                                                    <div>
                                                        <div className="flex items-start justify-between">
                                                            <div className={`w-12 h-12 flex items-center justify-center border-2 border-slate-100 ${visuals.bgColor} ${visuals.textColor}`}>
                                                                <IconComponent size={24} weight="duotone" />
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleOpenModal(activeDay, dbSlot, mSlot)} className="p-1.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-200 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"><PencilSimple size={14} weight="bold"/></button>
                                                                <button onClick={() => deleteTimetableSlot(schoolId, dbSlot.id)} className="p-1.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-100 text-slate-500 dark:text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700"><Trash size={14} weight="bold"/></button>
                                                            </div>
                                                        </div>
                                                        <p className="font-black text-xl text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-none mt-4 truncate">{subjectName}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="w-6 h-6 bg-slate-100 text-slate-500 dark:text-slate-400 flex items-center justify-center font-black text-[10px] border border-slate-200 dark:border-slate-700">
                                                                {teacher?.name[0] || '?'}
                                                            </div>
                                                            <p className={`text-xs font-bold uppercase truncate ${!teacher ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>{teacher?.name || 'Unassigned'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t-2 border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mSlot.label}</span>
                                                        <span className="bg-slate-900 text-white text-[10px] font-black font-mono px-2 py-1 uppercase">{timeString}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                 </>
             )}
        </div>

      </div>

      {/* MASTER SETTINGS MODAL */}
      {showMasterModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowMasterModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl border-4 border-slate-800 p-0 relative z-10 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             <div className="bg-slate-800 text-white p-5 flex justify-between items-center border-b-4 border-black shrink-0">
                <div>
                   <h3 className="text-lg font-black uppercase tracking-tight">Master Timetable Structure</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Define standard periods for the whole school</p>
                </div>
                <button onClick={() => setShowMasterModal(false)}><X size={20} weight="bold"/></button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 p-4 shrink-0 flex items-center gap-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Configure For:</label>
                <select 
                    value={selectedMasterDay} 
                    onChange={e => {
                        const day = e.target.value;
                        setSelectedMasterDay(day);
                        if (day !== 'All' && !dayStructures[day]) {
                            setDayStructures(prev => ({ ...prev, [day]: JSON.parse(JSON.stringify(masterStructure)) }));
                        }
                    }}
                    className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-300 text-slate-800 dark:text-slate-100 font-bold text-sm outline-none px-3 py-1.5 uppercase tracking-wide cursor-pointer"
                >
                    <option value="All">All Regular Days (Master)</option>
                    {WEEK_DAYS.map(d => <option key={d} value={d}>{d} (Custom)</option>)}
                </select>
                {selectedMasterDay !== 'All' && (
                    <button 
                        onClick={() => {
                            const newStructs = { ...dayStructures };
                            delete newStructs[selectedMasterDay];
                            setDayStructures(newStructs);
                            setSelectedMasterDay('All');
                        }}
                        className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest"
                    >
                        Reset to Master
                    </button>
                )}
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-800/50">
                {(() => {
                    const currentEditStructure = selectedMasterDay === 'All' ? masterStructure : (dayStructures[selectedMasterDay] || masterStructure);
                    const updateCurrentStructure = (newStruct: any) => {
                        if (selectedMasterDay === 'All') {
                            setMasterStructure(newStruct);
                        } else {
                            setDayStructures(prev => ({ ...prev, [selectedMasterDay]: newStruct }));
                        }
                    };

                    return currentEditStructure.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock size={48} weight="duotone" className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">No structure defined yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {currentEditStructure.map((slot, index) => (
                                <div key={index} className={`flex items-center gap-4 p-4 border-2 ${slot.isBreak ? 'bg-slate-200 border-slate-300' : 'bg-white dark:bg-slate-800 border-slate-200'}`}>
                                    <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Label</label>
                                            <input 
                                                type="text" 
                                                value={slot.label} 
                                                onChange={(e) => {
                                                    const newStruct = [...currentEditStructure];
                                                    newStruct[index].label = e.target.value;
                                                    updateCurrentStructure(newStruct);
                                                }}
                                                placeholder={slot.isBreak ? "Break" : "Period"}
                                                className="w-full p-2 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] rounded-none uppercase"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Start Time</label>
                                            <input 
                                                type="time" 
                                                value={slot.startTime} 
                                                onChange={(e) => {
                                                    const newStruct = [...currentEditStructure];
                                                    newStruct[index].startTime = e.target.value;
                                                    updateCurrentStructure(newStruct);
                                                }}
                                                className="w-full p-2 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] rounded-none font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">End Time</label>
                                            <input 
                                                type="time" 
                                                value={slot.endTime} 
                                                onChange={(e) => {
                                                    const newStruct = [...currentEditStructure];
                                                    newStruct[index].endTime = e.target.value;
                                                    updateCurrentStructure(newStruct);
                                                }}
                                                className="w-full p-2 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] rounded-none font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={slot.isBreak} 
                                                onChange={(e) => {
                                                    const newStruct = [...currentEditStructure];
                                                    newStruct[index].isBreak = e.target.checked;
                                                    updateCurrentStructure(newStruct);
                                                }}
                                                className="w-4 h-4 accent-[#1e3a8a]"
                                            />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Break</span>
                                        </label>
                                        <button 
                                            onClick={() => {
                                                const newStruct = [...currentEditStructure];
                                                newStruct.splice(index, 1);
                                                updateCurrentStructure(newStruct);
                                            }}
                                            className="p-2 bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors border border-rose-200"
                                        >
                                            <Trash size={16} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}
                
                <button 
                    onClick={() => {
                        const currentEditStructure = selectedMasterDay === 'All' ? masterStructure : (dayStructures[selectedMasterDay] || masterStructure);
                        const lastSlot = currentEditStructure[currentEditStructure.length - 1];
                        const startTime = lastSlot ? lastSlot.endTime : '08:00';
                        const endTime = lastSlot ? lastSlot.endTime : '09:00';
                        const newStruct = [...currentEditStructure, { startTime, endTime, isBreak: false, label: `Period ${currentEditStructure.filter(s => !s.isBreak).length + 1}` }];
                        if (selectedMasterDay === 'All') {
                            setMasterStructure(newStruct);
                        } else {
                            setDayStructures(prev => ({ ...prev, [selectedMasterDay]: newStruct }));
                        }
                    }}
                    className="mt-6 w-full py-3 border-2 border-dashed border-[#1e3a8a] text-[#1e3a8a] font-black text-xs uppercase tracking-widest hover:bg-[#1e3a8a] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={16} weight="bold" /> Add Slot
                </button>
            </div>
            
            <div className="p-5 border-t-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                <button 
                    onClick={handleSaveMasterStructure} 
                    className="w-full py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest hover:bg-[#172554] transition-all shadow-sm active:translate-y-0.5 rounded-none flex items-center justify-center gap-2"
                >
                    <FloppyDisk size={16} weight="fill"/> Save Master Structure
                </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-md border-4 border-slate-800 p-0 relative z-10 shadow-2xl animate-in zoom-in-95">
             <div className="bg-slate-800 text-white p-5 flex justify-between items-center border-b-4 border-black">
                <div>
                   <h3 className="text-lg font-black uppercase tracking-tight">{modalData.id ? 'Edit Period' : 'Add Period'}</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{modalData.day}</p>
                </div>
                <button onClick={() => setShowModal(false)}><X size={20} weight="bold"/></button>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="bg-slate-100 p-4 border-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                   <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Scheduled Time</span>
                   <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 px-3 py-1 border border-slate-300">{modalData.startTime} - {modalData.endTime}</span>
               </div>

               {!modalData.isBreak && (
                   <>
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Subject</label>
                          <select value={modalData.subjectId} onChange={e => setModalData({...modalData, subjectId: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] rounded-none uppercase">
                              <option value="">-- Select --</option>
                              {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Teacher</label>
                          <select value={modalData.teacherId} onChange={e => setModalData({...modalData, teacherId: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] rounded-none uppercase">
                              <option value="">-- Select --</option>
                              {filteredTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                       </div>
                   </>
               )}

               <button 
                  onClick={handleSaveSlot} 
                  disabled={!modalData.isBreak && (!modalData.subjectId || !modalData.teacherId)}
                  className="w-full py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest hover:bg-[#172554] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:translate-y-0.5 rounded-none flex items-center justify-center gap-2"
               >
                   <FloppyDisk size={16} weight="fill"/> Save Period
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden Print Section */}
      <div ref={printRef} style={{ display: 'none', width: '794px', padding: '40px', background: 'white', fontFamily: 'sans-serif' }}>
        <div className="border border-slate-200 dark:border-slate-700 p-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6 mb-8">
            <div className="flex items-center gap-4">
              {school?.logoURL ? (
                <img src={school.logoURL} alt="Logo" className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">LOGO</div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{school?.name || 'SCHOOL NAME'}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Academic Session 2025-26</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-light text-slate-900 dark:text-white uppercase tracking-widest">TIME TABLE</h2>
              <div className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                CLASS: {classes.find(c => c.id === selectedClassId)?.name || '---'}
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-slate-200 dark:border-slate-700 mb-10">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="border border-slate-200 dark:border-slate-700 p-3 text-xs font-bold uppercase text-slate-700 dark:text-slate-200">Day</th>
                {masterStructure.map((m, i) => (
                  <th key={i} className="border border-slate-200 dark:border-slate-700 p-3 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-200">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{m.startTime}-{m.endTime}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEK_DAYS.map(day => {
                const currentStructure = dayStructures[day] || masterStructure;
                return (
                  <tr key={day}>
                    <td className="border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 font-bold uppercase text-center text-slate-800 dark:text-slate-100 text-xs">{day}</td>
                    {masterStructure.map((_, i) => {
                      const mSlot = currentStructure[i];
                      if (!mSlot) return <td key={i} className="border border-slate-200 dark:border-slate-700 p-3 text-center text-slate-200">-</td>;
                      
                      const timeString = `${mSlot.startTime} - ${mSlot.endTime}`;
                      const slot = timetable.find(s => s.day === day && s.timeSlot === timeString);
                      
                      if (mSlot.isBreak) {
                        return (
                          <td key={i} className="border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">BREAK</span>
                          </td>
                        );
                      }
                      
                      if (slot) {
                        const subject = subjects.find(s => s.id === slot.subjectId);
                        const teacher = teachers.find(t => t.id === slot.teacherId);
                        return (
                          <td key={i} className="border border-slate-200 dark:border-slate-700 p-3 text-center">
                            <div className="font-bold text-slate-900 dark:text-white text-[10px] uppercase leading-tight">{subject?.name || '---'}</div>
                            <div className="text-[8px] font-normal text-slate-500 dark:text-slate-400 uppercase mt-0.5">({teacher?.name || '---'})</div>
                          </td>
                        );
                      }
                      
                      return <td key={i} className="border border-slate-200 dark:border-slate-700 p-3 text-center text-slate-200">-</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Class Discipline & Manners / آداب اور نظم و ضبط</h3>
              <ul className="space-y-2 text-[10px] text-slate-700 dark:text-slate-200">
                <li className="flex justify-between"><span>1. Be Punctual & Respectful</span> <span dir="rtl">وقت کی پابندی اور احترام کریں</span></li>
                <li className="flex justify-between"><span>2. Maintain Cleanliness</span> <span dir="rtl">صفائی کا خاص خیال رکھیں</span></li>
                <li className="flex justify-between"><span>3. Listen Attentively</span> <span dir="rtl">توجہ سے سنیں اور عمل کریں</span></li>
                <li className="flex justify-between"><span>4. Be Kind to Peers</span> <span dir="rtl">ساتھیوں کے ساتھ حسن سلوک کریں</span></li>
              </ul>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Important Instructions / ضروری ہدایات</h3>
              <ul className="space-y-2 text-[10px] text-slate-700 dark:text-slate-200">
                <li className="flex justify-between"><span>• Arrive before the bell rings</span> <span dir="rtl">گھنٹی بجنے سے پہلے کلاس میں پہنچیں</span></li>
                <li className="flex justify-between"><span>• Follow the timetable strictly</span> <span dir="rtl">ٹائم ٹیبل کی سختی سے پابندی کریں</span></li>
                <li className="flex justify-between"><span>• Keep your books organized</span> <span dir="rtl">اپنی کتابیں ترتیب سے رکھیں</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableManagement;
