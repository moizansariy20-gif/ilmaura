import React, { useState, useEffect } from 'react';
import { 
    BookCheck, 
    ChevronDown, 
    ChevronRight, 
    UserIcon, 
    CheckCircle,
    ArrowLeft,
    Check
} from 'lucide-react';
import { supabase } from '../../services/supabase.ts';
import { subscribeToSyllabusChapters, subscribeToStudentChapterProgress, updateStudentChapterProgress } from '../../services/api.ts';
import { Assignment } from '../../types';

interface StudentCurriculumProps {
    profile: any;
    subjects: any[];
    classes: any[];
    setActiveTab?: any;
}

const StudentCurriculum: React.FC<StudentCurriculumProps> = ({ profile, subjects, classes, setActiveTab }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    
    const [students, setStudents] = useState<any[]>([]);
    const [chapters, setChapters] = useState<any[]>([]);
    const [progressData, setProgressData] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    // Derived distinct classes taught by the teacher
    const taughtClasses = classes.filter(c => subjects.some(s => s.classId === c.id));

    useEffect(() => {
        if (taughtClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(taughtClasses[0].id);
        }
    }, [taughtClasses]);

    useEffect(() => {
        const classSubjects = subjects.filter(s => s.classId === selectedClassId);
        if (classSubjects.length > 0) {
            if (!classSubjects.find(s => s.id === selectedSubjectId)) {
                setSelectedSubjectId(classSubjects[0].id);
            }
        } else {
            setSelectedSubjectId('');
        }
    }, [selectedClassId, subjects]);

    // Fetch students
    useEffect(() => {
        if (!selectedClassId || !profile?.schoolId) return;
        setLoading(true);
        const fetchStudents = async () => {
            const { data } = await supabase
                .from('students')
                .select('*')
                .eq('class_id', selectedClassId)
                .eq('school_id', profile.schoolId);
            setStudents(data || []);
            setLoading(false);
        };
        fetchStudents();
    }, [selectedClassId, profile?.schoolId]);

    // Fetch chapters for the subject
    useEffect(() => {
        if (!selectedSubjectId) {
            setChapters([]);
            return;
        }
        const unsub = subscribeToSyllabusChapters(selectedSubjectId, (data) => {
            setChapters(data);
        });
        return () => unsub();
    }, [selectedSubjectId]);

    // Fetch progress data from DB / localStorage fallback
    useEffect(() => {
        if (!selectedClassId || !selectedSubjectId || !profile?.schoolId) {
            setProgressData([]);
            return;
        }
        
        // Remove aggressive setInterval polling. It causes UI glitches (accordions closing, etc)
        // Instead, we just read it once, and then any local writes will happen in the same file and
        // we already optimistically update the state.
        
        const fetchLocalFallback = () => {
            const key = `student_prog_${selectedClassId}_${selectedSubjectId}`;
            try { 
                const lp = JSON.parse(localStorage.getItem(key) || '[]'); 
                setProgressData(prev => JSON.stringify(prev) === JSON.stringify(lp) ? prev : lp);
            } catch(e) {}
        };
        
        const unsub = subscribeToStudentChapterProgress(
            profile.schoolId, 
            selectedClassId, 
            selectedSubjectId, 
            (data) => {
                if (data.length > 0) {
                    setProgressData(data);
                } else {
                    fetchLocalFallback();
                }
            }
        );
        
        // Polling fallback just in case we are in 100% localStorage mode, but less aggressive 
        // and only updates if data actually changed to avoid re-render loops.
        let localInterval = setInterval(fetchLocalFallback, 5000);
        
        return () => {
            unsub();
            clearInterval(localInterval);
        };
    }, [selectedClassId, selectedSubjectId, profile?.schoolId]);

    const handleToggleProgress = async (studentId: string, chapterId: string, currentStatus: boolean) => {
        if (!selectedClassId || !selectedSubjectId || !profile?.schoolId) return;
        
        // Optimistic UI update
        const optimisticPayload = {
            student_id: studentId,
            chapter_id: chapterId,
            is_completed: !currentStatus,
            school_id: profile.schoolId,
            class_id: selectedClassId,
            subject_id: selectedSubjectId
        };
        
        setProgressData(prev => {
            const exist = prev.find(p => p.student_id === studentId && p.chapter_id === chapterId);
            if (exist) {
                return prev.map(p => p === exist ? { ...p, is_completed: !currentStatus } : p);
            }
            return [...prev, optimisticPayload];
        });

        // Backend update
        try {
            await updateStudentChapterProgress(optimisticPayload);
        } catch (e) {
            console.error("Progress update failed", e);
            // Revert on error could be implemented here
        }
    };

    const getStudentProgressStats = (studentId: string) => {
        if (chapters.length === 0) return { completed: 0, total: 0, percent: 0 };
        const total = chapters.length;
        const completed = progressData.filter(p => p.student_id === studentId && p.is_completed).length;
        const percent = Math.round((completed / total) * 100);
        return { completed, total, percent };
    };

    return (
        <div className="min-h-full bg-[#FCFBF8] dark:bg-[#020617] pb-32 font-sans relative overflow-hidden transition-colors duration-300">
            {/* Background elements matching Curriculum Insight */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6B1D2F]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                {/* Header - Matching Curriculum Insight EXACTLY */}
                <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>Progress</h1>
                            <div className="flex flex-col mt-1 md:mt-2">
                                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • Per-Student Tracking</p>
                                <p className="text-[11px] md:text-sm text-[#6B1D2F] dark:text-white font-black mt-0.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                    {profile.name}
                                </p>
                            </div>
                        </div>

                        {/* Profile Avatar / Decoration like in Quizzes/Curriculum */}
                        <div className="flex p-1.5 md:p-2 bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[0_10px_25px_-5px_rgba(107,29,47,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-[#1e293b]/10 flex items-center justify-center relative z-10">
                                {profile.photoURL ? (
                                    <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-[#E5E0D8]">
                                        <UserIcon size={32} className="text-[#6B1D2F]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 relative z-10">
                        <button 
                            onClick={() => setActiveTab('home')}
                            className="px-6 py-4 bg-white dark:bg-[#1e293b] text-[#6B1D2F] dark:text-white rounded-2xl font-bold text-xs uppercase tracking-widest border border-[#D4AF37]/30 hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <ArrowLeft size={18} />
                            Exit
                        </button>
                    </div>

                    {/* Filters Integrated in Header Shadow area */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D4AF37]/10">
                        <div className="bg-[#FCFBF8] dark:bg-[#020617] p-4 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                            <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">Class</label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full bg-transparent border-none font-bold text-sm text-[#6B1D2F] dark:text-white outline-none appearance-none"
                            >
                                {taughtClasses.map(c => (
                                    <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="bg-[#FCFBF8] dark:bg-[#020617] p-4 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                            <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">Subject</label>
                            <select
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                                className="w-full bg-transparent border-none font-bold text-sm text-[#6B1D2F] dark:text-white outline-none appearance-none"
                            >
                                {subjects.filter(s => s.classId === selectedClassId).map(s => (
                                    <option key={s.id} value={s.id} className="text-slate-900">{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Progress Content */}
                <div className="px-4 md:px-6 pb-20">
                    {!selectedClassId || !selectedSubjectId ? (
                        <div className="text-center py-20 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                             <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white shadow-xl rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#D4AF37]/20">
                                <CheckCircle size={32} className="text-[#D4AF37]" />
                             </div>
                             <h2 className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">Select Classroom</h2>
                             <p className="text-sm font-bold text-[#D4AF37] mt-2">Pick a class and subject to track progress.</p>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
                            <p className="text-xs font-black text-[#D4AF37] uppercase tracking-widest animate-pulse">Scanning student roster...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-[#1e293b] rounded-3xl border border-[#D4AF37]/20 shadow-sm">
                            <p className="text-sm font-black text-[#D4AF37] uppercase tracking-wider">No students enrolled in this class.</p>
                        </div>
                    ) : chapters.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-[#1e293b] rounded-3xl border border-[#D4AF37]/20 shadow-sm">
                            <p className="text-sm font-black text-[#D4AF37] uppercase tracking-wider">No syllabus chapters found for this subject.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
                                <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                                    Student Roster • {students.length} Total
                                </h2>
                                <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
                            </div>

                            {students.map(student => {
                        const isExpanded = expandedStudent === student.id;
                        const stats = getStudentProgressStats(student.id);
                        
                        return (
                            <div key={student.id} className={`bg-white dark:bg-[#1e293b] rounded-3xl border transition-all duration-500 overflow-hidden relative group ${isExpanded ? 'ring-2 ring-[#D4AF37] border-transparent shadow-2xl' : 'border-[#E5E0D8] dark:border-[#1e293b] shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-[#D4AF37]/50'}`}>
                                {isExpanded && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>
                                )}
                                
                                {/* Student Header (Clickable) */}
                                <button 
                                    onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                                    className="w-full p-5 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors text-left relative z-10"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FCFBF8] to-[#E5E0D8] dark:from-slate-700 dark:to-slate-800 p-1 shrink-0 border border-[#E5E0D8] dark:border-slate-600 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                            {student.photo_local_url || student.photo_url ? (
                                                <img src={student.photo_local_url || student.photo_url} alt={student.name} className="w-full h-full rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] text-white flex items-center justify-center font-black text-xl shadow-lg">
                                                    {student.name ? student.name[0] : 'S'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-slate-800 dark:text-white leading-tight tracking-tight">{student.name}</span>
                                            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mt-1">Roll: {student.registration_number || `ID: ${student.id.substring(0,6)}`}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-sm font-black ${stats.percent === 100 ? 'text-green-500' : 'text-[#D4AF37]'}`}>{stats.percent}%</span>
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#6B1D2F] to-[#D4AF37] rounded-full transition-all" style={{ width: `${stats.percent}%` }} />
                                            </div>
                                        </div>
                                        <div className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="bg-[#FCFBF8] dark:bg-[#020617]/50 border-t border-[#E5E0D8] dark:border-[#334155] p-6 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar relative z-10">
                                        <div className="flex items-center gap-3 mb-2 px-1">
                                            <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent flex-1"></div>
                                            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">Learning Milestones</span>
                                            <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent flex-1"></div>
                                        </div>

                                        {chapters.map((chapter, idx) => {
                                            const isDone = progressData.some(p => p.student_id === student.id && p.chapter_id === chapter.id && p.is_completed);
                                            return (
                                                <div 
                                                    key={chapter.id} 
                                                    onClick={() => handleToggleProgress(student.id, chapter.id, isDone)}
                                                    className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center gap-4 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group shadow-sm ${
                                                        isDone 
                                                            ? 'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-500/30' 
                                                            : 'bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50'
                                                    }`}
                                                >
                                                    {isDone && (
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                                                    )}

                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all font-black text-xs ${
                                                            isDone 
                                                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                                : 'bg-white dark:bg-[#1e293b] border-[#D4AF37]/30 text-[#6B1D2F] dark:text-white'
                                                        }`}>
                                                            {isDone ? <Check size={14} strokeWidth={4} /> : chapter.order || (idx + 1)}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`text-sm md:text-base font-black leading-tight tracking-tight ${isDone ? 'text-emerald-700 dark:text-emerald-400 line-through decoration-emerald-500/30' : 'text-[#6B1D2F] dark:text-white group-hover:text-[#D4AF37]'} transition-colors`}>{chapter.name}</span>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Unit {idx + 1}</span>
                                                                {isDone && (
                                                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-widest">
                                                                        <CheckCircle size={10} /> Recorded
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 flex items-center pt-2 md:pt-0">
                                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            isDone 
                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                                : 'bg-[#FCFBF8] dark:bg-[#020617]/50 text-[#D4AF37] border border-[#D4AF37]/20 group-hover:bg-[#6B1D2F] group-hover:text-white group-hover:border-[#4A1421]'
                                                        }`}>
                                                            {isDone ? 'Progress Logged' : 'Mark Progress'}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
</div>
);
};

export default StudentCurriculum;
