
import React, { useState, useEffect } from 'react';
import { Book, CheckCircle, Save, Trash2, CalendarDays, BookOpen, Clock, ClipboardCheck, Zap, CalendarX, Check, FilePlus } from 'lucide-react';
import { UserProfile, Class, Subject, GraphicalAcademicPlan, GraphicalPlanActivity, SavedAcademicPlan } from '../../types.ts';
import { generateAcademicYearPlan } from '../../services/aiService.ts'; // Now returns static template
import { subscribeToAcademicPlan, saveAcademicPlan, deleteAcademicPlan } from '../../services/api.ts';

interface CurriculumHubProps {
  profile: UserProfile;
  classes: Class[];
  subjects: Subject[];
}

const ActivityPill: React.FC<{type: GraphicalPlanActivity['type'], description: string}> = ({ type, description }) => {
    const typeStyles: {[key: string]: {icon: React.ReactNode, color: string}} = {
        Chapter:    { icon: <BookOpen size={12}/>,   color: 'bg-[#6B1D2F]/10 text-[#6B1D2F] border-[#6B1D2F]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_1px_2px_rgba(107,29,47,0.05)]' },
        Assessment: { icon: <ClipboardCheck size={12}/>, color: 'bg-[#6B1D2F] text-white border-[#4A1421] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_2px_4px_rgba(107,29,47,0.2)]' },
        Revision:   { icon: <Zap size={12}/>,        color: 'bg-[#6B1D2F]/5 text-[#6B1D2F] border-[#6B1D2F]/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_1px_2px_rgba(107,29,47,0.05)]' },
        Holiday:    { icon: <CalendarX size={12}/>,    color: 'bg-slate-100 text-slate-600 border-slate-200 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.05)]' },
        Activity:   { icon: <CheckCircle size={12}/>,    color: 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_1px_2px_rgba(107,29,47,0.05)]' },
    };
    const style = typeStyles[type] || typeStyles['Activity'];

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${style.color}`}>
            {style.icon}
            <span>{description}</span>
        </div>
    );
};

const CurriculumHub: React.FC<CurriculumHubProps> = ({ profile, classes, subjects }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  const [formState, setFormState] = useState({
      startDate: '',
      endDate: '',
      numChapters: 15,
  });
  
  const [academicPlan, setAcademicPlan] = useState<GraphicalAcademicPlan | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedAcademicPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkedDays, setCheckedDays] = useState(new Set<string>());

  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      if (selectedClass) {
        const assignedSubjectIds = Object.keys(selectedClass.subjectAssignments || {}).filter(subId => (selectedClass.subjectAssignments as any)[subId]?.id === profile.teacherId);
        setAvailableSubjects(subjects.filter(s => assignedSubjectIds.includes(s.id)));
      }
    } else {
      setAvailableSubjects([]);
    }
    setSelectedSubjectId('');
    setAcademicPlan(null);
    setSavedPlan(null);
    setCheckedDays(new Set<string>());
  }, [selectedClassId, classes, subjects, profile.teacherId]);

  useEffect(() => {
    if (profile.teacherId && selectedClassId && selectedSubjectId) {
        setCheckedDays(new Set<string>());
        const unsub = subscribeToAcademicPlan(profile.schoolId!, profile.teacherId, selectedClassId, selectedSubjectId, (plan) => {
            setSavedPlan(plan);
            if (plan) {
                setAcademicPlan(plan.planData);
            } else {
                setAcademicPlan(null);
            }
        }, (err) => {
            console.error(err);
            setError("Could not load saved plan.");
        });
        return () => unsub();
    }
  }, [profile.teacherId, selectedClassId, selectedSubjectId]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateTemplate = async () => {
    if (!formState.startDate || !formState.endDate || !selectedClassId || !selectedSubjectId) {
        setError("Please select a class, subject, and provide both start and end dates.");
        return;
    }
    setIsGenerating(true);
    setError('');
    
    // Call the updated service which now returns a static template
    const result = await generateAcademicYearPlan(
      { startDate: formState.startDate, endDate: formState.endDate, numChapters: formState.numChapters }, 
      subjects.find(s=>s.id===selectedSubjectId)!.name, 
      classes.find(c=>c.id===selectedClassId)!.name,
      ''
    );
    
    if (typeof result === 'object' && result !== null && 'terms' in result) {
      setAcademicPlan(result as GraphicalAcademicPlan);
    } else {
      setError('Could not create template.');
    }
    setIsGenerating(false);
  };

  const handleSavePlan = async () => {
    if (!academicPlan || !profile.teacherId || !selectedClassId || !selectedSubjectId) return;
    setIsSaving(true);
    setError('');
    try {
        await saveAcademicPlan(profile.schoolId!, savedPlan?.id || null, {
            teacherId: profile.teacherId,
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            planData: academicPlan
        });
    } catch (err) {
        setError("Failed to save plan.");
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleToggleDayCheck = (dayId: string) => {
    setCheckedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) newSet.delete(dayId);
      else newSet.add(dayId);
      return newSet;
    });
  };

  const handleDeletePlan = () => {
    if (!savedPlan) return;
    setShowDeleteConfirm(true);
  };
  
  const executeDeletePlan = async () => {
    if (!savedPlan) return;
    setShowDeleteConfirm(false);
    setIsSaving(true);
    setError('');
    try {
      await deleteAcademicPlan(profile.schoolId!, savedPlan.id);
    } catch (err) {
      setError("Failed to delete plan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.8)] border border-slate-200 dark:border-slate-700/50 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-gradient-to-br from-[#6B1D2F]/10 to-[#6B1D2F]/5 text-[#6B1D2F] dark:text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_10px_rgba(107,29,47,0.1)] border border-[#6B1D2F]/20">
                    <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Delete Academic Plan?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    This action is permanent and cannot be undone. Are you sure you want to delete this saved plan?
                </p>
                <div className="mt-8 flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 active:scale-95 transition-all">Cancel</button>
                    <button onClick={executeDeletePlan} className="flex-1 py-3.5 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white rounded-2xl font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(107,29,47,0.3)] border border-[#4A1421] hover:from-[#8B2D3F] hover:to-[#6B1D2F] active:scale-95 transition-all">Yes, Delete</button>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#6B1D2F]/10 dark:border-slate-700 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B1D2F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6B1D2F]/10 to-[#6B1D2F]/5 rounded-2xl flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_10px_rgba(107,29,47,0.1)] border border-[#6B1D2F]/20">
            <CalendarDays size={32} className="text-[#6B1D2F] dark:text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Academic Planner</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Create and track your yearly teaching roadmap.</p>
          </div>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#6B1D2F]/10 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#6B1D2F]/5 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative z-10">
          <label className="text-xs font-bold uppercase tracking-wider text-[#6B1D2F] dark:text-white/60 ml-1">Select Class</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full mt-2 p-4 bg-slate-50 dark:bg-slate-800/50/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl font-bold text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/30 transition-all appearance-none cursor-pointer">
            <option value="">-- Choose a Class --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="relative z-10">
          <label className="text-xs font-bold uppercase tracking-wider text-[#6B1D2F] dark:text-white/60 ml-1">Select Subject</label>
          <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={!selectedClassId || availableSubjects.length === 0} className="w-full mt-2 p-4 bg-slate-50 dark:bg-slate-800/50/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl font-bold text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/30 transition-all appearance-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer">
            <option value="">-- Choose a Subject --</option>
            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#6B1D2F]/10 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#6B1D2F]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-xl mb-6 flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-[#6B1D2F]/5 rounded-xl flex items-center justify-center border border-[#6B1D2F]/10 dark:border-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <CalendarDays size={20} className="text-[#6B1D2F] dark:text-white"/>
                  </div>
                  Setup
              </h3>
              
              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B1D2F] dark:text-white/60 ml-1">Start Date</label>
                    <input name="startDate" type="date" value={formState.startDate} onChange={handleInputChange} className="w-full mt-2 p-3.5 bg-slate-50 dark:bg-slate-800/50/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/30 transition-all"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B1D2F] dark:text-white/60 ml-1">End Date</label>
                    <input name="endDate" type="date" value={formState.endDate} onChange={handleInputChange} className="w-full mt-2 p-3.5 bg-slate-50 dark:bg-slate-800/50/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/30 transition-all"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B1D2F] dark:text-white/60 ml-1">Total Chapters</label>
                  <input name="numChapters" type="number" value={formState.numChapters} onChange={handleInputChange} className="w-full mt-2 p-3.5 bg-slate-50 dark:bg-slate-800/50/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/30 transition-all"/>
                </div>

                <button onClick={handleCreateTemplate} disabled={isGenerating} className="w-full py-4 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white font-black rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_15px_rgba(107,29,47,0.4)] border border-[#4A1421] active:scale-[0.98] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)] transition-all uppercase tracking-wider text-sm">
                  <FilePlus size={18}/> {isGenerating ? 'Generating...' : 'Create Template'}
                </button>
                {error && <p className="text-xs text-[#6B1D2F] dark:text-white font-bold text-center bg-[#6B1D2F]/5 p-3 rounded-xl border border-[#6B1D2F]/10 dark:border-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">{error}</p>}
              </div>
            </div>
          </div>
          
          <div className="xl:col-span-8 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#6B1D2F]/10 dark:border-slate-700 relative overflow-hidden min-h-[600px]">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#6B1D2F]/5 via-transparent to-transparent pointer-events-none"></div>
            
            {academicPlan ? (
                <div className="space-y-8 relative z-10">
                    <div className="flex justify-between items-start bg-slate-50 dark:bg-slate-800/50/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <div className="text-left">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{academicPlan.courseTitle}</h2>
                            <p className="font-bold text-xs text-[#6B1D2F] dark:text-white/80 uppercase tracking-widest mt-2 bg-[#6B1D2F]/5 inline-block px-3 py-1 rounded-lg border border-[#6B1D2F]/10 dark:border-slate-700">{academicPlan.sessionDuration}</p>
                        </div>
                        <div className="flex items-center gap-3">
                           {savedPlan && (
                               <button onClick={handleDeletePlan} disabled={isSaving} className="p-3.5 bg-white dark:bg-slate-800 text-[#6B1D2F] dark:text-white rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_5px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-700/60 hover:bg-[#6B1D2F]/5 active:scale-95 transition-all">
                                   <Trash2 size={18}/>
                               </button>
                           )}
                           <button onClick={handleSavePlan} disabled={isSaving} className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white rounded-2xl text-sm font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(107,29,47,0.3)] border border-[#4A1421] hover:from-[#8B2D3F] hover:to-[#6B1D2F] active:scale-95 active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)] transition-all uppercase tracking-wider">
                              <Save size={18}/> {isSaving ? 'Saving...' : 'Save Plan'}
                           </button>
                        </div>
                    </div>
                    
                    <div className="space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar -mr-4 pr-4">
                        {academicPlan.terms.map((term, termIndex) => (
                            <div key={termIndex} className="relative">
                                <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md py-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                        <div className="w-2 h-6 bg-[#6B1D2F] rounded-full"></div>
                                        {term.title}
                                    </h3>
                                </div>
                                
                                <div className="space-y-6">
                                    {term.weeks.map((week, weekIndex) => (
                                        <div key={`${termIndex}-${weekIndex}`} className="bg-slate-50 dark:bg-slate-800/50/50 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden">
                                            <div className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                                <p className="font-black text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider">{week.weekLabel}</p>
                                            </div>
                                            <ul className="divide-y divide-slate-100">
                                                {week.days.map((day, dayIndex) => {
                                                    const dayId = `${termIndex}-${weekIndex}-${dayIndex}`;
                                                    const isChecked = checkedDays.has(dayId);
                                                    return (
                                                        <li 
                                                            key={dayIndex} 
                                                            onClick={() => handleToggleDayCheck(dayId)}
                                                            className={`flex items-start gap-4 p-5 hover:bg-white dark:bg-slate-800 transition-colors duration-200 cursor-pointer ${isChecked ? 'bg-[#6B1D2F]/5' : ''}`}
                                                        >
                                                            <div className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 border shadow-sm ${isChecked ? 'bg-[#6B1D2F] border-[#4A1421] shadow-[#6B1D2F]/20' : 'bg-white dark:bg-slate-800 border-slate-300 shadow-slate-200/50'}`}>
                                                                <Check size={14} className={`transition-all duration-300 ease-in-out ${isChecked ? 'text-white scale-100' : 'text-slate-300 scale-0'}`} strokeWidth={3}/>
                                                            </div>
                                                            <div className={`flex-1 transition-all duration-300 ${isChecked ? 'opacity-50' : 'opacity-100'}`}>
                                                                <div className={`font-bold text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 ${isChecked ? 'line-through' : ''}`}>
                                                                    <span className="bg-slate-200/50 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">{day.dayName}</span>
                                                                    <span className="text-slate-400">{day.date}</span>
                                                                </div>
                                                                <div className={`flex flex-wrap gap-2 items-center mt-3 ${isChecked ? 'line-through' : ''}`}>
                                                                    {day.activities.length > 0 ? day.activities.map((activity, actIndex) => (
                                                                        <ActivityPill key={actIndex} type={activity.type} description={activity.description} />
                                                                    )) : <span className="text-xs text-slate-400 font-medium italic bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50">No scheduled activities</span>}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400 py-20 h-full flex flex-col justify-center items-center relative z-10">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <CalendarDays size={40} className="text-slate-300"/>
                    </div>
                    <h3 className="font-black text-xl text-slate-600 dark:text-slate-300">Academic Roadmap</h3>
                    <p className="text-sm mt-2 max-w-xs mx-auto font-medium">
                        {selectedClassId && selectedSubjectId ? 'Generate a template to start planning.' : 'Select a class and subject to begin.'}
                    </p>
                </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default CurriculumHub;
