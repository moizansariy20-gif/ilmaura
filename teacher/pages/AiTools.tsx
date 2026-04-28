
import React, { useState, useEffect } from 'react';
import { PenTool, FileText, ClipboardList, HelpCircle, Save, CheckCircle, ChevronRight } from 'lucide-react';
import { Class, Subject, UserProfile } from '../../types.ts';

interface AiToolsProps {
  profile: UserProfile;
  classes: Class[];
  subjects: Subject[];
  setActiveTab?: (tab: string) => void;
}

const AiTools: React.FC<AiToolsProps> = ({ profile, classes, subjects, setActiveTab }) => {
  const [activeTool, setActiveTool] = useState<'lessonPlanner' | 'quizGenerator'>('lessonPlanner');

  // Manual Lesson Planner State
  const [lessonTopic, setLessonTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [manualPlan, setManualPlan] = useState('');

  // Manual Quiz Creator State
  const [quizTopic, setQuizTopic] = useState('');
  const [manualQuiz, setManualQuiz] = useState('');

  useEffect(() => {
    if (classes.length > 0) {
        setGrade(classes[0].name);
    }
  }, [classes]);

  const loadLessonTemplate = () => {
    setManualPlan(`
# Lesson Plan
**Topic:** ${lessonTopic}
**Subject:** ${subject}

### Objectives
1. 
2. 

### Activities
- Introduction (5 mins): 
- Main Activity (20 mins): 
- Conclusion (10 mins): 
    `);
  };

  const loadQuizTemplate = () => {
    setManualQuiz(`
### Quiz: ${quizTopic}

1. Question 1?
   A) Option A
   B) Option B
   
2. Question 2?
   A) Option A
   B) Option B
    `);
  };
  
  const renderLessonPlanner = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-b from-white to-[#6B1D2F]/5 p-6 rounded-[2rem] border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6B1D2F]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            <h3 className="font-black text-[#6B1D2F] dark:text-white/80 uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><PenTool size={16} className="text-[#6B1D2F] dark:text-white"/> Manual Planner</h3>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white/60 uppercase tracking-widest ml-1">Topic</label>
                <input type="text" placeholder="e.g., Photosynthesis" value={lessonTopic} onChange={e => setLessonTopic(e.target.value)} className="w-full p-4 bg-white dark:bg-[#1e293b] border border-[#6B1D2F]/10 dark:border-[#1e293b] rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/40 transition-all placeholder:text-slate-300"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white/60 uppercase tracking-widest ml-1">Grade</label>
                <input type="text" value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-4 bg-white dark:bg-[#1e293b] border border-[#6B1D2F]/10 dark:border-[#1e293b] rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/40 transition-all"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white/60 uppercase tracking-widest ml-1">Subject</label>
                <input type="text" placeholder="e.g. Science" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-4 bg-white dark:bg-[#1e293b] border border-[#6B1D2F]/10 dark:border-[#1e293b] rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/40 transition-all placeholder:text-slate-300"/>
              </div>
              <button onClick={loadLessonTemplate} className="w-full mt-2 py-4 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(107,29,47,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#4A1421] hover:from-[#4A1421] hover:to-[#2D0D14] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)] active:translate-y-[1px] transition-all flex items-center justify-center gap-2">
                <FileText size={18}/> Load Template
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 bg-gradient-to-b from-white to-[#6B1D2F]/5 p-6 rounded-[2rem] border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B1D2F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex-1 flex flex-col">
            <h3 className="font-black text-[#6B1D2F] dark:text-white/80 uppercase tracking-widest text-xs mb-4">Lesson Plan Editor</h3>
            <textarea 
                value={manualPlan} 
                onChange={e => setManualPlan(e.target.value)} 
                className="flex-1 w-full min-h-[400px] p-6 bg-white dark:bg-[#1e293b] border border-[#6B1D2F]/10 dark:border-[#1e293b] rounded-2xl font-medium text-sm text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4_rgba(0,0,0,0.02)] outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/40 transition-all placeholder:text-slate-300 resize-none custom-scrollbar"
                placeholder="Load a template or start typing your plan here..."
            />
            <div className="mt-6 flex justify-end">
                <button className="px-8 py-4 bg-gradient-to-b from-[#D4AF37] to-[#B8860B] text-[#4A1421] rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_4px_15px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 transition-all active:translate-y-[1px] flex items-center gap-2">
                    <Save size={18} /> Save Draft
                </button>
            </div>
        </div>
      </div>
    </div>
  );
  
  const renderQuizGenerator = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
      <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-b from-white to-[#6B1D2F]/5 p-6 rounded-[2rem] border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#6B1D2F]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="relative z-10">
                  <h3 className="font-black text-[#6B1D2F] dark:text-white/80 uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><HelpCircle size={16} className="text-[#6B1D2F] dark:text-white"/> Quiz Builder</h3>
                  <div className="space-y-5">
                      <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white/60 uppercase tracking-widest ml-1">Quiz Topic</label>
                          <input type="text" placeholder="e.g. History Test" value={quizTopic} onChange={e => setQuizTopic(e.target.value)} className="w-full p-4 bg-white dark:bg-[#1e293b] border border-[#6B1D2F]/10 dark:border-[#1e293b] rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/40 transition-all placeholder:text-slate-300"/>
                      </div>
                      <button onClick={loadQuizTemplate} className="w-full mt-2 py-4 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(107,29,47,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#4A1421] hover:from-[#4A1421] hover:to-[#2D0D14] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)] active:translate-y-[1px] transition-all flex items-center justify-center gap-2">
                          <ClipboardList size={18}/> Load Template
                      </button>
                  </div>
              </div>
          </div>
      </div>
      <div className="lg:col-span-2 bg-gradient-to-b from-white to-[#6B1D2F]/5 p-6 rounded-[2rem] border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B1D2F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10 flex-1 flex flex-col">
                <h3 className="font-black text-[#6B1D2F] dark:text-white/80 uppercase tracking-widest text-xs mb-4">Question Editor</h3>
                <textarea 
                    value={manualQuiz} 
                    onChange={e => setManualQuiz(e.target.value)} 
                    className="flex-1 w-full min-h-[400px] p-6 bg-white dark:bg-[#1e293b] border border-[#6B1D2F]/10 dark:border-[#1e293b] rounded-2xl font-medium text-sm text-slate-700 dark:text-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:ring-2 focus:ring-[#6B1D2F]/20 focus:border-[#6B1D2F]/40 transition-all placeholder:text-slate-300 resize-none custom-scrollbar"
                    placeholder="Write your questions here..."
                />
                <div className="mt-6 flex justify-end">
                    <button className="px-8 py-4 bg-gradient-to-b from-[#D4AF37] to-[#B8860B] text-[#4A1421] rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_4px_15px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 transition-all active:translate-y-[1px] flex items-center gap-2">
                        <Save size={18} /> Save Quiz
                    </button>
                </div>
            </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <PenTool size={40} className="text-[#6B1D2F] dark:text-white drop-shadow-sm"/>
          <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Teaching Tools</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-1">Manage lesson plans, quizzes, and tracking.</p>
          </div>
        </div>

        {/* New Student Progress Button */}
        {setActiveTab && (
          <button 
            onClick={() => setActiveTab('student_curriculum')}
            className="group flex items-center gap-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-4 md:p-5 rounded-[2rem] border border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(107,29,47,0.05)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.2)] hover:border-[#D4AF37] transition-all active:scale-[0.98] w-full md:w-auto"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
              <CheckCircle size={24} />
            </div>
            <div className="text-left flex-1">
              <p className="text-xs font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Live Tracking</p>
              <p className="text-lg font-black text-[#6B1D2F] dark:text-white leading-tight">Student Progress</p>
            </div>
            <ChevronRight size={20} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      <div className="flex gap-2 bg-white dark:bg-[#1e293b] p-2 rounded-2xl w-fit border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-[0_4px_15px_rgba(107,29,47,0.03)]">
        <button
          onClick={() => setActiveTool('lessonPlanner')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTool === 'lessonPlanner' ? 'bg-[#6B1D2F]/5 text-[#6B1D2F] dark:text-white shadow-[inset_0_1px_0_rgba(255,255,255,1)] border border-[#6B1D2F]/10 dark:border-[#1e293b]' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Lesson Planner
        </button>
        <button
          onClick={() => setActiveTool('quizGenerator')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTool === 'quizGenerator' ? 'bg-[#6B1D2F]/5 text-[#6B1D2F] dark:text-white shadow-[inset_0_1px_0_rgba(255,255,255,1)] border border-[#6B1D2F]/10 dark:border-[#1e293b]' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Quiz Creator
        </button>
      </div>

      <div>
        {activeTool === 'lessonPlanner' ? renderLessonPlanner() : 
         activeTool === 'quizGenerator' ? renderQuizGenerator() :
         null}
      </div>
    </div>
  );
};

export default AiTools;
