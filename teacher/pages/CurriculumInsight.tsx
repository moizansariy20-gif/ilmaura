
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, CheckCircle, Clock, Target, Info, AlertCircle, Sparkles, User, GraduationCap
} from 'lucide-react';
import { Subject, Class, SyllabusChapter } from '../../types.ts';
import { subscribeToSyllabusChapters, updateSyllabusChapter } from '../../services/api.ts';
import { useTranslation } from '../../services/translations.ts';

interface CurriculumInsightProps {
  profile: any;
  classes: Class[];
  subjects: Subject[];
}

const CurriculumInsight: React.FC<CurriculumInsightProps> = ({ profile, classes, subjects }) => {
  const { t } = useTranslation();
  const [chapters, setChapters] = useState<SyllabusChapter[]>([]);
  const [loading, setLoading] = useState(false);

  const teacherAssignments = useMemo(() => {
    const tid = profile.teacherId;
    const assignments: { id: string, subjectId: string, subjectName: string, className: string, classId: string }[] = [];

    classes.forEach(cls => {
      if (cls.subjectAssignments) {
        Object.keys(cls.subjectAssignments).forEach(subId => {
          const teacherRef = cls.subjectAssignments![subId];
          if (teacherRef?.id === tid || (teacherRef?.name && teacherRef.name === profile.name)) {
            const subject = subjects.find(s => s.id === subId);
            if (subject) {
              assignments.push({
                id: `${cls.id}-${subId}`,
                subjectId: subId,
                subjectName: subject.name,
                classId: cls.id,
                className: `${cls.name}${cls.section ? ` (${cls.section})` : ''}`
              });
            }
          }
        });
      }
    });

    subjects.filter(sub => (sub as any).teacherId === tid).forEach(sub => {
      const exists = assignments.some(a => a.subjectId === sub.id);
      if (!exists) {
        assignments.push({
          id: sub.id,
          subjectId: sub.id,
          subjectName: sub.name,
          classId: sub.classId || '',
          className: classes.find(c => c.id === sub.classId)?.name || 'Direct'
        });
      }
    });

    return assignments;
  }, [subjects, classes, profile]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  useEffect(() => {
    if (teacherAssignments.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(teacherAssignments[0].id);
    }
  }, [teacherAssignments]);

  const activeAssignment = useMemo(() => 
    teacherAssignments.find(a => a.id === selectedAssignmentId)
  , [teacherAssignments, selectedAssignmentId]);

  useEffect(() => {
    if (activeAssignment) {
      setLoading(true);
      const unsubscribe = subscribeToSyllabusChapters(activeAssignment.subjectId, (data) => {
        setChapters(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeAssignment]);

  const toggleCompletion = async (chapter: SyllabusChapter) => {
    try {
      const isFinishing = !chapter.isCompleted;
      const updatedCheckpoints = chapter.checkpoints?.map(cp => ({ ...cp, isCompleted: isFinishing }));
      
      await updateSyllabusChapter(chapter.id, { 
        isCompleted: isFinishing,
        completedAt: isFinishing ? new Date().toISOString() : null,
        checkpoints: updatedCheckpoints
      });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const toggleCheckpoint = async (chapter: SyllabusChapter, cpId: string) => {
    try {
        const updatedCheckpoints = chapter.checkpoints?.map(cp => {
            if (cp.id === cpId) return { ...cp, isCompleted: !cp.isCompleted };
            return cp;
        });

        const allDone = updatedCheckpoints?.every(cp => cp.isCompleted);
        
        await updateSyllabusChapter(chapter.id, {
            checkpoints: updatedCheckpoints,
            isCompleted: !!allDone,
            completedAt: allDone ? new Date().toISOString() : (chapter.isCompleted ? null : chapter.completedAt)
        });
    } catch (err) {
        console.error("Error updating checkpoint:", err);
    }
  };

  const completedCount = chapters.filter(c => c.isCompleted).length;
  const totalCount = chapters.length;

  return (
    <div className="min-h-full bg-white dark:bg-[#1e293b] pb-32 font-sans relative overflow-hidden">
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header & Filters Combined */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>Curriculum</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • Track Syllabus Progress</p>
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
                    <User size={28} className="text-[#6B1D2F] dark:text-white md:hidden" />
                    <User size={36} className="text-[#6B1D2F] dark:text-white hidden md:block" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#D4AF37] rounded-full border-2 border-[#6B1D2F] flex items-center justify-center shadow-lg">
                <Sparkles size={10} className="text-[#6B1D2F] dark:text-white md:hidden" />
                <Sparkles size={12} className="text-[#6B1D2F] dark:text-white hidden md:block" />
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="group">
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Select Assigment</label>
              <div className="relative">
                <select 
                  value={selectedAssignmentId} 
                  onChange={e => setSelectedAssignmentId(e.target.value)} 
                  className="w-full p-4 bg-white dark:bg-[#1e293b] shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                >
                  {teacherAssignments.length > 0 ? (
                    teacherAssignments.map(assign => (
                      <option key={assign.id} value={assign.id}>
                        {assign.subjectName} — {assign.className}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No active assignments</option>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                  <svg width="14" height="10" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          
          {/* Stats area */}
          {activeAssignment && (
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                    <CheckCircle size={24} className="drop-shadow-sm" />
                  </div>
                  <div className="relative z-10">
                      <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{completedCount}</p>
                      <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Completed</p>
                  </div>
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                    <Target size={24} className="drop-shadow-sm" />
                  </div>
                  <div className="relative z-10">
                      <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{totalCount}</p>
                      <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Total Units</p>
                  </div>
              </div>
            </div>
          )}

          {/* List display */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm flex items-center gap-3">
              <BookOpen size={24} className="text-[#D4AF37]" />
              Syllabus Units
            </h2>

            {!activeAssignment ? (
               <div className="text-center py-20 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#D4AF37]/20">
                    <GraduationCap size={32} className="text-[#D4AF37]" />
                  </div>
                  <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">Academic Void</p>
                  <p className="text-sm font-bold text-[#D4AF37] mt-2">No subjects have been assigned to your profile yet.</p>
               </div>
            ) : loading ? (
               <div className="text-center py-20 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                 <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-sm font-bold text-[#D4AF37] mt-2">Loading curriculum chapters...</p>
               </div>
            ) : totalCount > 0 ? (
               <div className="space-y-4">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className={`p-5 md:p-6 rounded-3xl flex flex-col md:flex-row gap-5 shadow-[0_10px_30px_-5px_rgba(107,29,47,0.08)] border transition-all relative overflow-hidden group ${chapter.isCompleted ? 'bg-[#FCFBF8] border-emerald-500/30' : 'bg-white dark:bg-[#1e293b] border-[#D4AF37]/20 hover:border-[#D4AF37]/50'}`}>
                      {chapter.isCompleted && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      )}
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                           <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/30 flex items-center justify-center font-black text-xs text-[#6B1D2F] dark:text-white shrink-0">
                                {chapter.order}
                              </span>
                              <h3 className={`text-lg md:text-xl font-black ${chapter.isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through decoration-emerald-500/30' : 'text-[#6B1D2F] dark:text-white'} tracking-tight leading-tight`}>
                                 {chapter.name}
                              </h3>
                           </div>
                        </div>
                        
                        {chapter.description && (
                          <p className="text-sm text-[#6B1D2F] dark:text-white/80 font-bold leading-relaxed whitespace-pre-wrap ml-11">
                            {chapter.description}
                          </p>
                        )}

                        {chapter.checkpoints && chapter.checkpoints.length > 0 && (
                          <div className="ml-11 grid gap-2 pt-2 border-t border-[#D4AF37]/10">
                            {chapter.checkpoints.map(cp => (
                              <button 
                                key={cp.id} 
                                onClick={() => toggleCheckpoint(chapter, cp.id)}
                                className="flex items-center gap-3 w-full text-left group/cp"
                              >
                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                  cp.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-[#D4AF37]/40 group-hover/cp:border-[#D4AF37]'
                                }`}>
                                  {cp.isCompleted && <CheckCircle size={12} className="text-white" />}
                                </div>
                                <span className={`text-xs font-bold ${cp.isCompleted ? 'text-slate-400 line-through' : 'text-[#6B1D2F] dark:text-white group-hover/cp:text-[#D4AF37]'}`}>
                                  {cp.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="shrink-0 flex items-center md:items-start border-t md:border-t-0 md:border-l border-[#D4AF37]/20 pt-4 md:pt-0 md:pl-6">
                         <button
                            onClick={() => toggleCompletion(chapter)}
                            className={`flex flex-1 md:flex-none items-center justify-center gap-2 p-3 md:px-5 md:py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all shadow-sm ${
                              chapter.isCompleted 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                                : 'bg-white dark:bg-[#1e293b] text-[#D4AF37] border-[#D4AF37]/30 hover:border-[#4A1420] hover:text-white hover:bg-[#6B1D2F] hover:shadow-[0_4px_12px_rgba(107,29,47,0.2)]'
                            }`}
                         >
                            {chapter.isCompleted ? <CheckCircle size={16} /> : <div className="w-4 h-4 border-2 border-current rounded-sm"></div>}
                            {chapter.isCompleted ? 'Completed' : 'Mark Done'}
                         </button>
                      </div>
                    </div>
                  ))}
               </div>
            ) : (
              <div className="text-center py-20 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#D4AF37]/20">
                  <AlertCircle size={32} className="text-[#D4AF37]" />
                </div>
                <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">No chapters defined.</p>
                <p className="text-sm font-bold text-[#D4AF37] mt-2">The curriculum timeline has not been populated yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumInsight;
