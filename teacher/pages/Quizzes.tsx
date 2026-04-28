
import React, { useState, useEffect } from 'react';
import { BrainCircuit, Plus, Clock, Calendar, Edit, Trash2, X, Save, Send, Eye, BarChart2, Loader2, Zap, CheckCircle, CheckCircle2, Users, Triangle, Circle, Square, Diamond, Sparkles, ChevronLeft, Check, Trophy, User } from 'lucide-react';
import { UserProfile, Class, Subject, LiveQuiz, QuizQuestion } from '../../types.ts';
import { addQuiz, subscribeToQuizzesByTeacher, updateQuiz, deleteQuiz, fetchLeaderboard } from '../../services/api.ts';
import { motion, AnimatePresence } from 'motion/react';

interface LiveQuizzesProps {
  profile: UserProfile;
  classes: Class[];
  subjects: Subject[];
}

const OPTION_CONFIG = [
  { color: 'bg-rose-500', Icon: Triangle },
  { color: 'bg-blue-500', Icon: Diamond },
  { color: 'bg-amber-500', Icon: Circle },
  { color: 'bg-emerald-500', Icon: Square },
];

const Quizzes: React.FC<LiveQuizzesProps> = ({ profile, classes, subjects }) => {
  const [quizzes, setQuizzes] = useState<LiveQuiz[]>([]);
  const [view, setView] = useState<'list' | 'builder' | 'leaderboard'>('list');
  const [currentQuiz, setCurrentQuiz] = useState<Partial<LiveQuiz> | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [quizToEnd, setQuizToEnd] = useState<LiveQuiz | null>(null);
  const [scheduleDetails, setScheduleDetails] = useState({ id: '', scheduledAtDate: '', scheduledAtTime: '', endTimeDate: '', endTimeTime: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Leaderboard state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'leaderboard'>('quizzes');

  useEffect(() => {
    if (profile.teacherId) {
        setIsLoading(true);
        const unsub = subscribeToQuizzesByTeacher(profile.schoolId!, profile.teacherId, (data) => {
            setQuizzes(data);
            setIsLoading(false);
        });
        return () => unsub();
    }
  }, [profile.teacherId, profile.schoolId]);

  const handleNewQuiz = () => {
    const now = new Date();
    const defaultEndTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
    
    setCurrentQuiz({
      title: '',
      classId: classes.length > 0 ? classes[0].id : '',
      subjectId: subjects.length > 0 ? subjects[0].id : '',
      questions: [{ id: `q_${Date.now()}`, questionText: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], timeLimit: 30, points: 1000 }],
      status: 'Live',
      scheduledAt: now,
      endTime: defaultEndTime,
      duration: 60,
    });
    setView('builder');
  };

  const handleQuestionChange = (qIndex: number, field: string, value: any) => {
    if (!currentQuiz || !currentQuiz.questions) return;
    const updatedQuestions = [...currentQuiz.questions];
    (updatedQuestions[qIndex] as any)[field] = value;
    setCurrentQuiz({ ...currentQuiz, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, text: string) => {
    if (!currentQuiz || !currentQuiz.questions) return;
    const updatedQuestions = [...currentQuiz.questions];
    updatedQuestions[qIndex].options[oIndex].text = text;
    setCurrentQuiz({ ...currentQuiz, questions: updatedQuestions });
  };
  
  const setCorrectOption = (qIndex: number, oIndex: number) => {
    if (!currentQuiz || !currentQuiz.questions) return;
    const updatedQuestions = [...currentQuiz.questions];
    updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.map((opt, i) => ({ ...opt, isCorrect: i === oIndex }));
    setCurrentQuiz({ ...currentQuiz, questions: updatedQuestions });
  };
  
  const handleAddQuestion = () => {
    if (!currentQuiz || !currentQuiz.questions) return;
    const newQuestion: QuizQuestion = { id: `q_${Date.now()}`, questionText: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], timeLimit: 30, points: 1000 };
    setCurrentQuiz({ ...currentQuiz, questions: [...currentQuiz.questions, newQuestion] });
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length <= 1) return;
    const updatedQuestions = currentQuiz.questions.filter((_, index) => index !== qIndex);
    setCurrentQuiz({ ...currentQuiz, questions: updatedQuestions });
  };
  
  const handleEditQuiz = (quiz: LiveQuiz) => {
    setCurrentQuiz({ ...quiz });
    setView('builder');
  };

  const handleDeleteQuiz = (id: string) => {
    setQuizToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (quizToDelete) {
      try {
        await deleteQuiz(profile.schoolId!, quizToDelete);
        setShowDeleteConfirm(false);
        setQuizToDelete(null);
      } catch (error) {
        console.error("Error deleting quiz:", error);
        alert("Failed to delete quiz.");
      }
    }
  };

  const handleSaveQuiz = async () => {
    if (!currentQuiz || !currentQuiz.title || !currentQuiz.classId || !currentQuiz.subjectId) {
      alert("Title, Class, and Subject are required.");
      return;
    }
    setIsSaving(true);
    try {
      const scheduledAtRaw = currentQuiz.scheduledAt || new Date();
      const scheduledAt = scheduledAtRaw instanceof Date ? scheduledAtRaw.toISOString() : scheduledAtRaw;
      
      const endTimeRaw = currentQuiz.endTime || new Date(new Date().getTime() + 60 * 60 * 1000);
      const endTime = endTimeRaw instanceof Date ? endTimeRaw.toISOString() : endTimeRaw;

      // Calculate duration in minutes if needed for backward compatibility
      const start = new Date(scheduledAt);
      const end = new Date(endTime);
      const duration = Math.round((end.getTime() - start.getTime()) / 60000);

      const quizData = {
        ...currentQuiz,
        teacherId: profile.teacherId,
        schoolId: profile.schoolId,
        status: 'Live',
        scheduledAt: scheduledAt,
        endTime: endTime,
        duration: duration > 0 ? duration : 60,
      } as LiveQuiz;

      if (currentQuiz.id) {
        await updateQuiz(profile.schoolId!, currentQuiz.id, quizData);
      } else {
        await addQuiz(profile.schoolId!, quizData);
      }
      
      setView('list');
      setCurrentQuiz(null);
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleOpenScheduleModal = (quiz: LiveQuiz) => {
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000);
    
    setShowScheduleModal(true);
    setScheduleDetails({
        id: quiz.id!,
        scheduledAtDate: now.toISOString().split('T')[0],
        scheduledAtTime: now.toTimeString().slice(0, 5),
        endTimeDate: defaultEnd.toISOString().split('T')[0],
        endTimeTime: defaultEnd.toTimeString().slice(0, 5)
    });
  };

  const handleEndQuiz = (quiz: LiveQuiz) => {
    setQuizToEnd(quiz);
    setShowEndConfirm(true);
  };

  const confirmEnd = async () => {
    if (quizToEnd) {
      try {
        await updateQuiz(profile.schoolId!, quizToEnd.id!, { status: 'Completed' });
        setShowEndConfirm(false);
        setQuizToEnd(null);
      } catch (error) {
        console.error("Error ending quiz:", error);
        alert("Failed to end quiz.");
      }
    }
  };

  const handleViewLeaderboard = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setLoadingLeaderboard(true);
    setView('leaderboard');
    try {
      const data = await fetchLeaderboard(profile.schoolId!, quizId);
      setLeaderboardData(data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleConfirmSchedule = async () => {
    const { id, scheduledAtDate, scheduledAtTime, endTimeDate, endTimeTime } = scheduleDetails;
    const scheduledAt = new Date(`${scheduledAtDate}T${scheduledAtTime}`);
    const endTime = new Date(`${endTimeDate}T${endTimeTime}`);
    
    // Calculate duration for backward compatibility
    const duration = Math.round((endTime.getTime() - scheduledAt.getTime()) / 60000);

    await updateQuiz(profile.schoolId!, id, {
      status: 'Scheduled',
      scheduledAt: scheduledAt.toISOString(),
      endTime: endTime.toISOString(),
      duration: duration > 0 ? duration : 60
    });

    setShowScheduleModal(false);
  };

  if (view === 'builder') {
    return (
      <div className="min-h-full bg-white dark:bg-[#1e293b] pb-32 font-sans relative overflow-hidden">
        
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          
          {/* Header Section - Matching Homework Style */}
          <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-2 md:mb-0 relative z-10 flex-1">
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>Quiz Builder</h1>
                <div className="flex flex-col mt-1 md:mt-2">
                  <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • Interactive Assessments</p>
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
                      <Users size={28} className="text-[#6B1D2F] dark:text-white md:hidden" />
                      <Users size={36} className="text-[#6B1D2F] dark:text-white hidden md:block" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#D4AF37] rounded-full border-2 border-[#6B1D2F] flex items-center justify-center shadow-lg">
                  <Sparkles size={10} className="text-[#6B1D2F] dark:text-white md:hidden" />
                  <Sparkles size={12} className="text-[#6B1D2F] dark:text-white hidden md:block" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 relative z-10 md:ml-6">
              <button 
                onClick={() => setView('list')}
                className="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-[#1e293b] text-[#6B1D2F] dark:text-white rounded-2xl font-bold text-xs uppercase tracking-widest border border-[#D4AF37]/30 hover:bg-[#FCFBF8] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
              >
                <ChevronLeft size={18} />
                Discard
              </button>
              <button 
                onClick={handleSaveQuiz}
                disabled={isSaving}
                className="flex-[2] md:flex-none px-8 py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(107,29,47,0.3)] border border-[#4A1420] active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Quiz
              </button>
            </div>
          </div>

          <div className="px-4 md:px-6 space-y-8">
            {/* Quiz Details Form - Matching Homework Style */}
            <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#6B1D2F]"></div>
              
              <div className="bg-[#FCFBF8] dark:bg-[#020617] p-5 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">Quiz Title</label>
                <input 
                  type="text" 
                  value={currentQuiz.title} 
                  onChange={e => setCurrentQuiz({...currentQuiz, title: e.target.value})} 
                  placeholder="e.g., Mathematics Mid-Term" 
                  className="w-full p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#FCFBF8] dark:bg-[#020617] p-5 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                  <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">Class</label>
                  <select 
                    value={currentQuiz.classId} 
                    onChange={e => setCurrentQuiz({...currentQuiz, classId: e.target.value})} 
                    className="w-full p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm appearance-none"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="bg-[#FCFBF8] dark:bg-[#020617] p-5 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                  <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">Subject</label>
                  <select 
                    value={currentQuiz.subjectId} 
                    onChange={e => setCurrentQuiz({...currentQuiz, subjectId: e.target.value})} 
                    className="w-full p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm appearance-none"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="bg-[#FCFBF8] dark:bg-[#020617] p-5 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                  <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">Start Time</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="datetime-local" 
                      value={currentQuiz.scheduledAt instanceof Date ? currentQuiz.scheduledAt.toISOString().slice(0, 16) : new Date(currentQuiz.scheduledAt || Date.now()).toISOString().slice(0, 16)} 
                      onChange={e => setCurrentQuiz({...currentQuiz, scheduledAt: new Date(e.target.value)})} 
                      className="w-full p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" 
                    />
                    <Calendar size={20} className="text-[#D4AF37] shrink-0" />
                  </div>
                </div>
                <div className="bg-[#FCFBF8] dark:bg-[#020617] p-5 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                  <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">End Time</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="datetime-local" 
                      value={currentQuiz.endTime instanceof Date ? currentQuiz.endTime.toISOString().slice(0, 16) : new Date(currentQuiz.endTime || Date.now() + 3600000).toISOString().slice(0, 16)} 
                      onChange={e => setCurrentQuiz({...currentQuiz, endTime: new Date(e.target.value)})} 
                      className="w-full p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" 
                    />
                    <Clock size={20} className="text-[#D4AF37] shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 relative z-0">
              <div className="flex items-center gap-4">
                <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
                <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                  Questions • {currentQuiz.questions?.length || 0} Items
                </h2>
                <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              </div>

              <div className="space-y-6">
                {currentQuiz.questions?.map((q, qIndex) => (
                  <div key={q.id} className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#6B1D2F]"></div>
                    
                    <div className="flex justify-between items-start mb-6 pl-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6B1D2F] text-white flex items-center justify-center font-black text-sm shadow-md border border-[#4A1420]">
                          {qIndex + 1}
                        </div>
                        <h4 className="font-black text-lg text-[#6B1D2F] dark:text-white uppercase tracking-tight">Question {qIndex + 1}</h4>
                      </div>
                      <button 
                        onClick={() => handleRemoveQuestion(qIndex)} 
                        className="p-2 text-[#D4AF37] hover:text-white hover:bg-[#6B1D2F] transition-all rounded-xl border border-[#D4AF37]/20 hover:border-[#4A1420] shadow-sm bg-white dark:bg-[#1e293b]"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-6 pl-3">
                      <div className="bg-[#FCFBF8] dark:bg-[#020617] p-5 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                        <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">Question Text</label>
                        <textarea 
                          value={q.questionText} 
                          onChange={e => handleQuestionChange(qIndex, 'questionText', e.target.value)} 
                          placeholder="Enter your question here..." 
                          rows={3} 
                          className="w-full p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm resize-none" 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, oIndex) => {
                          const isCorrect = opt.isCorrect;
                          return (
                            <div key={oIndex} className={`bg-[#FCFBF8] dark:bg-[#020617] p-4 rounded-2xl border flex items-center gap-3 transition-all ${isCorrect ? 'border-emerald-500 shadow-md' : 'border-[#D4AF37]/20 shadow-inner'}`}>
                              <button 
                                onClick={() => setCorrectOption(qIndex, oIndex)}
                                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${isCorrect ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-[#E5E0D8] text-transparent'}`}
                              >
                                <Check size={16} strokeWidth={4} />
                              </button>
                              <input 
                                type="text" 
                                value={opt.text} 
                                onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)} 
                                placeholder={`Option ${oIndex + 1}`} 
                                className="flex-1 bg-transparent font-bold text-sm text-[#6B1D2F] dark:text-white outline-none" 
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-6 border-t border-[#D4AF37]/10 flex flex-wrap gap-4">
                        <div className="flex items-center gap-3 bg-[#FCFBF8] dark:bg-[#020617] px-4 py-3 rounded-2xl border border-[#D4AF37]/20 shadow-sm">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1e293b] flex items-center justify-center border border-[#D4AF37]/20 shadow-sm">
                            <Clock size={16} className="text-[#D4AF37]"/>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest">Time Limit</span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={q.timeLimit} 
                                onChange={e => handleQuestionChange(qIndex, 'timeLimit', Number(e.target.value))} 
                                className="w-12 bg-white dark:bg-[#1e293b] border border-[#E5E0D8] dark:border-[#1e293b] rounded-lg font-black text-xs outline-none text-[#6B1D2F] dark:text-white py-0.5 text-center focus:border-[#D4AF37]" 
                              />
                              <span className="text-[9px] font-bold text-[#A89F91] dark:text-slate-400 uppercase tracking-widest">Sec</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-[#FCFBF8] dark:bg-[#020617] px-4 py-3 rounded-2xl border border-[#D4AF37]/20 shadow-sm">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1e293b] flex items-center justify-center border border-[#D4AF37]/20 shadow-sm">
                            <Zap size={16} className="text-[#D4AF37] fill-[#D4AF37]"/>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest">Points</span>
                            <input 
                              type="number" 
                              value={q.points} 
                              onChange={e => handleQuestionChange(qIndex, 'points', Number(e.target.value))} 
                              className="w-16 bg-white dark:bg-[#1e293b] border border-[#E5E0D8] dark:border-[#1e293b] rounded-lg font-black text-xs outline-none text-[#6B1D2F] dark:text-white py-0.5 text-center focus:border-[#D4AF37]" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Button */}
                <button 
                  onClick={handleAddQuestion} 
                  className="w-full py-10 rounded-3xl border-2 border-[#D4AF37]/30 border-dashed bg-[#FCFBF8] text-[#D4AF37] hover:bg-white dark:bg-[#1e293b] hover:border-[#D4AF37]/60 transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.99] shadow-[inset_0_4px_10px_rgba(107,29,47,0.02)]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1e293b] border border-[#D4AF37]/20 shadow-sm flex items-center justify-center transition-all duration-300">
                    <Plus size={28} className="text-[#D4AF37]" />
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest">Add Another Question</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-white dark:bg-[#1e293b] pb-32 font-sans relative overflow-hidden">
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section - Matching Homework Style */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>Quizzes</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • Interactive Assessments</p>
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
                    <Users size={28} className="text-[#6B1D2F] dark:text-white md:hidden" />
                    <Users size={36} className="text-[#6B1D2F] dark:text-white hidden md:block" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#D4AF37] rounded-full border-2 border-[#6B1D2F] flex items-center justify-center shadow-lg">
                <Sparkles size={10} className="text-[#6B1D2F] dark:text-white md:hidden" />
                <Sparkles size={12} className="text-[#6B1D2F] dark:text-white hidden md:block" />
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-2xl w-full max-w-md mx-auto relative z-10">
            <button 
              onClick={() => { setActiveTab('quizzes'); setView('list'); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'quizzes' ? 'bg-white dark:bg-slate-600 text-[#6B1D2F] dark:text-[#D4AF37] shadow-md' : 'text-slate-500'}`}
            >
              <Zap size={16} /> Quizzes
            </button>
            <button 
              onClick={() => { setActiveTab('leaderboard'); setView('leaderboard'); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'leaderboard' ? 'bg-white dark:bg-slate-600 text-[#6B1D2F] dark:text-[#D4AF37] shadow-md' : 'text-slate-500'}`}
            >
              <Trophy size={16} /> Leaderboard
            </button>
          </div>

          <button 
            onClick={handleNewQuiz}
            className="w-full py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-bold text-sm hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(107,29,47,0.3)] border border-[#4A1420] active:scale-[0.98]"
          >
            <Plus size={20} />
            <span className="tracking-wide uppercase text-xs text-white">Create New Quiz</span>
          </button>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* Stats Grid - Matching Homework Style */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <Zap size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{quizzes.filter(q => q.status === 'Live').length}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Live Now</p>
                </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <BrainCircuit size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{quizzes.length}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Total Quizzes</p>
                </div>
            </div>
          </div>

          <div className="space-y-6 relative z-0">
            {activeTab === 'quizzes' ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
                  <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                    Academic Assessments
                  </h2>
                  <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>
                ) : (
                  quizzes.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {quizzes.map(quiz => {
                        const statusStyles = {
                            Draft: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', icon: <Edit size={12}/> },
                            Scheduled: { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-700', icon: <Calendar size={12}/> },
                            Live: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700 animate-pulse', icon: <Zap size={12} className="fill-emerald-700"/> },
                            Completed: { bg: 'bg-violet-100 border-violet-200', text: 'text-violet-700', icon: <CheckCircle size={12}/> },
                        }[quiz.status] || { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', icon: <Edit size={12}/> };

                        return (
                          <div key={quiz.id} className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_15px_50px_-12px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#6B1D2F] opacity-90 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex justify-between items-start gap-4 pl-3">
                              <div className="space-y-5 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border flex items-center gap-2 ${statusStyles.bg} ${statusStyles.text}`}>
                                    {statusStyles.icon}
                                    {quiz.status}
                                  </span>
                                  <span className="px-4 py-1.5 bg-gradient-to-r from-[#6B1D2F] to-[#8B253D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(107,29,47,0.2)] border border-[#4A1420]">
                                    {subjects.find(s => s.id === quiz.subjectId)?.name || '...'}
                                  </span>
                                  <span className="px-4 py-1.5 bg-white dark:bg-[#1e293b] text-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#D4AF37]/30 shadow-sm">
                                    {classes.find(c => c.id === quiz.classId)?.name || '...'}
                                  </span>
                                </div>
                                
                                <h3 className="font-black text-xl text-[#6B1D2F] dark:text-white leading-tight drop-shadow-sm">{quiz.title}</h3>

                                <div className="flex flex-wrap gap-3">
                                  <div className="flex items-center gap-2 bg-[#FCFBF8] dark:bg-[#020617] px-3 py-1.5 rounded-lg border border-[#D4AF37]/20">
                                      <BrainCircuit size={14} className="text-[#D4AF37]"/>
                                      <span className="text-[10px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-wider">{quiz.questions.length} Questions</span>
                                  </div>
                                  <div className="flex items-center gap-2 bg-[#FCFBF8] dark:bg-[#020617] px-3 py-1.5 rounded-lg border border-[#D4AF37]/20">
                                      <Clock size={14} className="text-[#D4AF37]"/>
                                      <span className="text-[10px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-wider">
                                        {quiz.endTime ? `Ends at: ${new Date(quiz.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `${quiz.duration} Mins`}
                                      </span>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-[#D4AF37]/10 flex items-center justify-start gap-2">
                                    {quiz.status === 'Live' && (
                                        <button 
                                            onClick={() => handleEndQuiz(quiz)} 
                                            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md border border-rose-800 active:scale-95 transition-all flex items-center gap-1.5"
                                        >
                                            <X size={12}/> End Quiz
                                        </button>
                                    )}
                                    {quiz.status === 'Draft' && (
                                        <button 
                                            onClick={() => handleOpenScheduleModal(quiz)} 
                                            className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#4A1421] rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md border border-[#D4AF37] active:scale-95 transition-all flex items-center gap-1.5"
                                        >
                                            <Send size={12}/> Schedule
                                        </button>
                                    )}
                                    {quiz.status === 'Scheduled' && (
                                        <button className="px-4 py-2 bg-gradient-to-r from-[#6B1D2F] to-[#4A1421] text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md border border-[#4A1421] active:scale-95 transition-all flex items-center gap-1.5">
                                            <Eye size={12}/> View
                                        </button>
                                    )}
                                    {quiz.status === 'Completed' && (
                                        <button 
                                            onClick={() => handleViewLeaderboard(quiz.id!)}
                                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md border border-violet-900 active:scale-95 transition-all flex items-center gap-1.5"
                                        >
                                            <BarChart2 size={12}/> Results
                                        </button>
                                    )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => handleEditQuiz(quiz)}
                                  className="p-3 text-[#D4AF37] hover:text-white hover:bg-[#6B1D2F] transition-all rounded-xl border border-[#D4AF37]/20 hover:border-[#4A1420] shadow-sm bg-white dark:bg-[#1e293b]"
                                >
                                  <Edit size={18}/>
                                </button>
                                <button 
                                  onClick={() => handleDeleteQuiz(quiz.id!)}
                                  className="p-3 text-[#D4AF37] hover:text-white hover:bg-rose-600 transition-all rounded-xl border border-[#D4AF37]/20 hover:border-rose-100 shadow-sm bg-white dark:bg-[#1e293b]"
                                >
                                  <Trash2 size={18}/>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-20 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#D4AF37]/20">
                        <BrainCircuit size={32} className="text-[#D4AF37]" />
                      </div>
                      <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">No quizzes created yet.</p>
                      <p className="text-sm font-bold text-[#D4AF37] mt-2">Start by clicking the button above.</p>
                    </div>
                  )
                )}
              </>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Leaderboard Selection */}
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-[#D4AF37]/20 shadow-sm space-y-4">
                  <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 block">Select Quiz</label>
                  <select 
                    value={selectedQuizId || ''} 
                    onChange={(e) => handleViewLeaderboard(e.target.value)}
                    className="w-full p-4 bg-[#FCFBF8] dark:bg-[#020617] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm appearance-none"
                  >
                    <option value="">Choose a completed quiz...</option>
                    {quizzes.filter(q => q.status === 'Completed').map(q => (
                      <option key={q.id} value={q.id}>{q.title}</option>
                    ))}
                  </select>
                </div>

                {loadingLeaderboard ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
                    <p className="text-xs font-black text-[#D4AF37] uppercase tracking-widest animate-pulse">Calculating Ranks...</p>
                  </div>
                ) : selectedQuizId && leaderboardData.length > 0 ? (
                  <div className="space-y-8">
                    {/* Top 3 Podium */}
                    <div className="flex items-end justify-center gap-2 md:gap-4 pt-10 pb-4">
                      {/* 2nd Place */}
                      {leaderboardData[1] && (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-lg">
                              <User size={32} className="text-slate-400" />
                            </div>
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-300 rounded-full border-2 border-white flex items-center justify-center font-black text-slate-700 text-sm shadow-md">2</div>
                          </div>
                          <div className="text-center">
                            <p className="font-black text-xs text-[#6B1D2F] dark:text-white truncate w-24">{leaderboardData[1].student_name}</p>
                            <p className="font-bold text-[10px] text-[#D4AF37]">{leaderboardData[1].total_score} pts</p>
                          </div>
                          <div className="w-20 h-24 bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-t-xl border-x border-t border-slate-300"></div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {leaderboardData[0] && (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                              <Trophy size={32} fill="currentColor" />
                            </div>
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border-4 border-yellow-400 flex items-center justify-center overflow-hidden shadow-xl ring-4 ring-yellow-400/20">
                              <User size={40} className="text-yellow-600" />
                            </div>
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center font-black text-white text-lg shadow-md">1</div>
                          </div>
                          <div className="text-center">
                            <p className="font-black text-sm text-[#6B1D2F] dark:text-white truncate w-28">{leaderboardData[0].student_name}</p>
                            <p className="font-bold text-xs text-[#D4AF37]">{leaderboardData[0].total_score} pts</p>
                          </div>
                          <div className="w-24 h-32 bg-gradient-to-t from-yellow-400 to-yellow-200 dark:from-yellow-600 dark:to-yellow-400 rounded-t-xl border-x border-t border-yellow-400 shadow-[0_-10px_30px_rgba(234,179,8,0.2)]"></div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {leaderboardData[2] && (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 flex items-center justify-center overflow-hidden shadow-lg">
                              <User size={28} className="text-orange-400" />
                            </div>
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-300 rounded-full border-2 border-white flex items-center justify-center font-black text-orange-700 text-sm shadow-md">3</div>
                          </div>
                          <div className="text-center">
                            <p className="font-black text-xs text-[#6B1D2F] dark:text-white truncate w-24">{leaderboardData[2].student_name}</p>
                            <p className="font-bold text-[10px] text-[#D4AF37]">{leaderboardData[2].total_score} pts</p>
                          </div>
                          <div className="w-16 h-16 bg-gradient-to-t from-orange-200 to-orange-100 dark:from-orange-800 dark:to-orange-700 rounded-t-xl border-x border-t border-orange-300"></div>
                        </div>
                      )}
                    </div>

                    {/* Rankings List */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-[#D4AF37]/20 overflow-hidden shadow-sm">
                      <div className="p-4 bg-[#FCFBF8] dark:bg-[#020617] border-b border-[#D4AF37]/10 flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest">Participant Rankings</span>
                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">{leaderboardData.length} Total</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {leaderboardData.map((entry, index) => (
                          <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <span className={`w-8 text-sm font-black ${index < 3 ? 'text-[#D4AF37]' : 'text-slate-400'}`}>#{index + 1}</span>
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                <User size={18} className="text-slate-400" />
                              </div>
                              <div>
                                <p className="font-black text-sm text-[#6B1D2F] dark:text-white">{entry.student_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score: {entry.total_score}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-[#D4AF37]">
                                <Zap size={12} fill="currentColor" />
                                <span className="font-black text-sm">{entry.total_score}</span>
                              </div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Points</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : selectedQuizId ? (
                  <div className="bg-[#FCFBF8] dark:bg-[#020617]/50 rounded-3xl border-2 border-dashed border-[#D4AF37]/20 py-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 bg-white dark:bg-[#1e293b] rounded-full flex items-center justify-center border border-[#D4AF37]/20 shadow-sm mb-6">
                      <Trophy size={40} className="text-[#D4AF37]/40" />
                    </div>
                    <h3 className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight mb-2">No Submissions Yet</h3>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 max-w-xs">This quiz has no recorded student submissions yet.</p>
                  </div>
                ) : (
                  <div className="bg-[#FCFBF8] dark:bg-[#020617]/50 rounded-3xl border-2 border-dashed border-[#D4AF37]/20 py-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 bg-white dark:bg-[#1e293b] rounded-full flex items-center justify-center border border-[#D4AF37]/20 shadow-sm mb-6">
                      <BarChart2 size={40} className="text-[#D4AF37]/40" />
                    </div>
                    <h3 className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight mb-2">Select a Quiz</h3>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 max-w-xs">Choose a completed quiz from the dropdown above to view its performance leaderboard.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#6B1D2F]/40 backdrop-blur-md" onClick={() => setShowScheduleModal(false)}></div>
          <div className="bg-white dark:bg-[#1e293b] p-8 md:p-10 rounded-3xl border border-[#D4AF37]/30 shadow-[0_20px_60px_-15px_rgba(107,29,47,0.4)] relative w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
            
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#FCFBF8] dark:bg-[#020617] text-[#D4AF37] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#D4AF37]/20">
                    <Calendar size={28} />
                </div>
                <div>
                    <h3 className="font-black text-2xl text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm">Schedule</h3>
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Set Quiz Timing</p>
                </div>
            </div>
            
            <div className="space-y-6">
                <div className="bg-[#FCFBF8] dark:bg-[#020617] p-5 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                    <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">Start Date & Time</label>
                    <div className="flex gap-2">
                      <input 
                          type="date" 
                          value={scheduleDetails.scheduledAtDate} 
                          onChange={e => setScheduleDetails({...scheduleDetails, scheduledAtDate: e.target.value})} 
                          className="flex-1 p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" 
                      />
                      <input 
                          type="time" 
                          value={scheduleDetails.scheduledAtTime} 
                          onChange={e => setScheduleDetails({...scheduleDetails, scheduledAtTime: e.target.value})} 
                          className="flex-1 p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" 
                      />
                    </div>
                </div>
                <div className="bg-[#FCFBF8] dark:bg-[#020617] p-5 rounded-2xl border border-[#D4AF37]/20 shadow-inner">
                    <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white uppercase tracking-widest ml-1 mb-2 block">End Date & Time</label>
                    <div className="flex gap-2">
                      <input 
                          type="date" 
                          value={scheduleDetails.endTimeDate} 
                          onChange={e => setScheduleDetails({...scheduleDetails, endTimeDate: e.target.value})} 
                          className="flex-1 p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" 
                      />
                      <input 
                          type="time" 
                          value={scheduleDetails.endTimeTime} 
                          onChange={e => setScheduleDetails({...scheduleDetails, endTimeTime: e.target.value})} 
                          className="flex-1 p-4 bg-white dark:bg-[#1e293b] border-[#E5E0D8] dark:border-[#1e293b] border rounded-xl font-bold text-sm text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all shadow-sm" 
                      />
                    </div>
                </div>
            </div>
            <div className="mt-10 flex gap-4">
                <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-4 text-xs font-black text-[#6B1D2F] dark:text-white bg-white dark:bg-[#1e293b] border border-[#D4AF37]/30 rounded-2xl hover:bg-[#FCFBF8] transition-all uppercase tracking-widest shadow-sm">Cancel</button>
                <button onClick={handleConfirmSchedule} className="flex-1 py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#4A1421] rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(212,175,55,0.25)] border border-[#D4AF37] active:scale-[0.98] transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#6B1D2F]/40 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="bg-white dark:bg-[#1e293b] p-8 md:p-10 rounded-3xl border border-[#D4AF37]/30 shadow-[0_20px_60px_-15px_rgba(107,29,47,0.4)] relative w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>
            
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100 dark:border-rose-900/30">
                <Trash2 size={40} />
            </div>
            
            <h3 className="font-black text-2xl text-[#6B1D2F] dark:text-white tracking-tight mb-2">Delete Quiz?</h3>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8">This action cannot be undone. All questions and submissions will be permanently removed.</p>
            
            <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all uppercase tracking-widest">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(244,63,94,0.25)] active:scale-[0.98] transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#6B1D2F]/40 backdrop-blur-md" onClick={() => setShowEndConfirm(false)}></div>
          <div className="bg-white dark:bg-[#1e293b] p-8 md:p-10 rounded-3xl border border-[#D4AF37]/30 shadow-[0_20px_60px_-15px_rgba(107,29,47,0.4)] relative w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
            
            <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-100 dark:border-amber-900/30">
                <Clock size={40} />
            </div>
            
            <h3 className="font-black text-2xl text-[#6B1D2F] dark:text-white tracking-tight mb-2">End Quiz?</h3>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8">This will stop all live participation and mark the quiz as completed.</p>
            
            <div className="flex gap-4">
                <button onClick={() => setShowEndConfirm(false)} className="flex-1 py-4 text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all uppercase tracking-widest">Cancel</button>
                <button onClick={confirmEnd} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(245,158,11,0.25)] active:scale-[0.98] transition-all">End Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quizzes;
