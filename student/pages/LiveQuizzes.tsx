
import React, { useState, useEffect } from 'react';
import { 
  AiBrain01Icon, 
  Book01Icon, 
  Clock01Icon, 
  FlashIcon, 
  PlayIcon, 
  Calendar03Icon, 
  AlertCircleIcon, 
  ArrowLeft01Icon, 
  CheckmarkCircle01Icon,
  UserGroupIcon,
  ArrowRight01Icon as ChevronRight,
  ArrowLeft01Icon as ChevronLeft
} from 'hugeicons-react';
import { Trophy, BarChart3 as Ranking01Icon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LiveQuiz } from '../../types.ts';
import { supabase } from '../../services/supabase.ts';
import { fetchLeaderboard } from '../../services/api.ts';

interface LiveQuizzesProps {
  quizzes: LiveQuiz[];
  quizSubmissions?: any[];
  subjects: any[];
  onStartQuiz: (quiz: LiveQuiz) => void;
  profile?: any;
  currentClass?: any;
}

const LiveQuizzes: React.FC<LiveQuizzesProps> = ({ quizzes, quizSubmissions = [], subjects, onStartQuiz, profile, currentClass }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'leaderboard'>('quizzes');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (activeTab === 'leaderboard' && selectedQuizId) {
      loadLeaderboard(selectedQuizId);
    }
  }, [selectedQuizId, activeTab]);

  const loadLeaderboard = async (quizId: string) => {
    setLoadingLeaderboard(true);
    try {
      // 1. Fetch all students in the class to show full ranking
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, photo_url')
        .eq('class_id', profile?.classId);

      if (studentsError) throw studentsError;

      // 2. Fetch submissions for this quiz
      const submissions = await fetchLeaderboard(profile?.schoolId || '', quizId);
      
      // 3. Merge students with their submissions
      const mergedData = students.map(student => {
        const submission = submissions.find(s => String(s.student_id) === String(student.id));
        return {
          id: student.id,
          student_id: student.id,
          student_name: student.name,
          photo_url: student.photo_url,
          total_score: submission ? (submission.total_score || 0) : 0,
          notAttempted: !submission,
          time_taken: submission ? submission.time_taken : null
        };
      });

      // Sort by score descending, then by time taken ascending (lower is better)
      mergedData.sort((a, b) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score;
        // If scores are equal, lower time is better. 
        // Use a large number for null time_taken so they appear last
        const timeA = a.time_taken ?? 999999;
        const timeB = b.time_taken ?? 999999;
        return timeA - timeB;
      });

      setLeaderboardData(mergedData);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleViewLeaderboard = (quizId: string) => {
    setSelectedQuizId(quizId);
    setActiveTab('leaderboard');
    // Scroll to top to see the leaderboard
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSubjectName = (id: string) => {
    if (id === 'general-knowledge') return 'General Knowledge';
    if (id === 'history-sports') return 'Sports & History';
    return subjects.find(s => s.id === id)?.name || 'General';
  }
  
  const now = new Date();

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const dateDisplay = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Filter quizzes by selected date
  const filteredQuizzes = quizzes.filter(quiz => {
    const scheduledTime = (quiz.scheduledAt as any)?.toDate ? (quiz.scheduledAt as any).toDate() : new Date(quiz.scheduledAt);
    const quizDateStr = scheduledTime.toISOString().split('T')[0];
    return quizDateStr === selectedDate;
  });

  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    const timeA = (a.scheduledAt as any)?.toDate ? (a.scheduledAt as any).toDate().getTime() : new Date(a.scheduledAt).getTime();
    const timeB = (b.scheduledAt as any)?.toDate ? (b.scheduledAt as any).toDate().getTime() : new Date(b.scheduledAt).getTime();
    return timeA - timeB;
  });

  const availableQuizzes = sortedQuizzes;
  
  // Show all completed quizzes, not just the ones for the selected date
  const completedQuizzes = quizzes.filter(quiz => {
    return quizSubmissions.some(s => String(s.quiz_id) === String(quiz.id));
  }).sort((a, b) => {
    const timeA = (a.scheduledAt as any)?.toDate ? (a.scheduledAt as any).toDate().getTime() : new Date(a.scheduledAt).getTime();
    const timeB = (b.scheduledAt as any)?.toDate ? (b.scheduledAt as any).toDate().getTime() : new Date(b.scheduledAt).getTime();
    return timeB - timeA; // Sort newest first
  });

  return (
    <div className="min-h-full bg-white dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">BrainStorm</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Live Quizzes</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Challenge yourself in real-time
                </p>
              </div>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <AiBrain01Icon size={32} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-2xl w-full max-w-md mx-auto relative z-10">
            <button 
              onClick={() => setActiveTab('quizzes')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'quizzes' ? 'bg-white dark:bg-slate-600 text-[#1e3a8a] dark:text-[#D4AF37] shadow-md' : 'text-slate-500'}`}
            >
              <FlashIcon size={16} /> Quizzes
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'leaderboard' ? 'bg-white dark:bg-slate-600 text-[#1e3a8a] dark:text-[#D4AF37] shadow-md' : 'text-slate-500'}`}
            >
              <Trophy size={16} /> Leaderboard
            </button>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          
          {/* Date Navigator - Premium Style */}
          <div className="bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/10 rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <button onClick={handlePrevDay} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white rounded-2xl border border-[#D4AF37]/20 shadow-sm active:scale-95 transition-all">
                  <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
              
              <div className="text-center">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-0.5 leading-none">
                      {isToday ? "Today's Quizzes" : "Viewing Date"}
                  </p>
                  <h3 className="text-base font-black text-[#1e3a8a] dark:text-white leading-tight uppercase tracking-tight">{dateDisplay}</h3>
              </div>

              <button onClick={handleNextDay} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white rounded-2xl border border-[#D4AF37]/20 shadow-sm active:scale-95 transition-all">
                  <ChevronRight size={24} strokeWidth={2.5} />
              </button>
          </div>

          {activeTab === 'quizzes' ? (
            <>
              {/* Section Header */}
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Available Sessions</h2>
                <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
              </div>

          {/* Available Quiz Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableQuizzes.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {availableQuizzes.map((quiz, index) => {
                  const scheduledTime = (quiz.scheduledAt as any)?.toDate ? (quiz.scheduledAt as any).toDate() : new Date(quiz.scheduledAt);
                  const endTime = quiz.endTime 
                    ? ((quiz.endTime as any).toDate ? (quiz.endTime as any).toDate() : new Date(quiz.endTime))
                    : new Date(scheduledTime.getTime() + quiz.duration * 60000);
                  const isLive = (now >= scheduledTime && now < endTime) || quiz.status === 'Live';
                  const subjectName = getSubjectName(quiz.subjectId);
                  const formattedTime = scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <motion.div 
                      key={quiz.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-6 bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/10 rounded-2xl shadow-sm space-y-6 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-300"
                    >
                      {isLive && (
                        <div className="absolute top-0 right-0 bg-[#D4AF37] text-[#1e3a8a] px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-md animate-pulse z-20">
                          Live Now
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Book01Icon size={18} className="text-[#D4AF37]" />
                          <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest">{subjectName}</p>
                        </div>

                        <h3 className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight leading-tight group-hover:text-[#D4AF37] transition-colors">
                          {quiz.title}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                              <CheckmarkCircle01Icon size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Questions</span>
                              <span className="text-xs font-black text-[#1e3a8a] dark:text-slate-200 leading-none">{quiz.questions.length}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                              <Clock01Icon size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Duration</span>
                              <span className="text-xs font-black text-[#1e3a8a] dark:text-slate-200 leading-none">{quiz.duration}m</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#D4AF37]/10 flex items-center justify-between">
                        {(() => {
                          const isCompleted = quizSubmissions.some(s => String(s.quiz_id) === String(quiz.id));
                          
                          if (isCompleted) {
                            return (
                              <div className="w-full py-3.5 bg-slate-100 dark:bg-slate-700/50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2">
                                <AlertCircleIcon size={14} /> Quiz Not Available
                              </div>
                            );
                          }

                          if (!isLive) {
                            return (
                              <>
                                <div className="flex items-center gap-2 text-[#1e3a8a]/60 dark:text-slate-400">
                                  <Calendar03Icon size={14} className="text-[#D4AF37]" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">{formattedTime}</span>
                                </div>
                                <div className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-[#D4AF37]/10 ml-auto">
                                  Waiting for Start
                                </div>
                              </>
                            );
                          }

                          return (
                            <button 
                              onClick={() => onStartQuiz(quiz)}
                              className="w-full py-3.5 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border border-[#1e40af] hover:from-[#2563eb] hover:to-[#1d4ed8] active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                            >
                              Enter Quiz <PlayIcon size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                          );
                        })()}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-24 bg-[#FCFBF8] dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-[#D4AF37]/20"
              >
                <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#D4AF37]/10">
                  <AiBrain01Icon size={32} className="text-[#D4AF37]/40" />
                </div>
                <h3 className="font-black text-[#1e3a8a] dark:text-white text-2xl tracking-tight">Quiz Not Available</h3>
              </motion.div>
            )}
          </div>

          {/* Completed Quizzes Section */}
          <div className="mt-12 space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Completed Quizzes</h2>
              <div className="h-px bg-gradient-to-r from-[#1e3a8a]/40 to-transparent flex-1"></div>
            </div>

            {completedQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {completedQuizzes.map((quiz, index) => {
                    const scheduledTime = (quiz.scheduledAt as any)?.toDate ? (quiz.scheduledAt as any).toDate() : new Date(quiz.scheduledAt);
                    const subjectName = getSubjectName(quiz.subjectId);
                    const submission = quizSubmissions.find(s => String(s.quiz_id) === String(quiz.id));

                    return (
                      <motion.div 
                        key={quiz.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-6 bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#1e3a8a]/20 rounded-2xl shadow-sm space-y-6 relative overflow-hidden group hover:border-[#1e3a8a]/40 transition-all duration-300 opacity-90 hover:opacity-100"
                      >
                        <div className="absolute top-0 right-0 bg-[#1e3a8a] text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-md z-20 flex items-center gap-1">
                          <CheckmarkCircle01Icon size={12} /> Completed
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Book01Icon size={18} className="text-[#1e3a8a] dark:text-[#D4AF37]" />
                            <p className="text-[10px] font-black text-[#1e3a8a]/80 dark:text-[#D4AF37]/80 uppercase tracking-widest">{subjectName}</p>
                          </div>

                          <h3 className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight leading-tight">
                            {quiz.title}
                          </h3>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-[#1e3a8a]/10 flex items-center justify-center text-[#1e3a8a] dark:text-[#D4AF37]">
                                <CheckmarkCircle01Icon size={16} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Questions</span>
                                <span className="text-xs font-black text-[#1e3a8a] dark:text-slate-200 leading-none">{quiz.questions.length}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-[#1e3a8a]/10 flex items-center justify-center text-[#1e3a8a] dark:text-[#D4AF37]">
                                <Clock01Icon size={16} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Duration</span>
                                <span className="text-xs font-black text-[#1e3a8a] dark:text-slate-200 leading-none">{quiz.duration}m</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#1e3a8a]/10 space-y-3">
                          <div className="w-full flex items-center justify-between bg-[#1e3a8a]/5 dark:bg-[#1e3a8a]/10 p-3 rounded-xl border border-[#1e3a8a]/10">
                            <span className="text-xs font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest">Score Achieved</span>
                            <span className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37]">{submission?.total_score || 0} pts</span>
                          </div>
                          <button 
                            onClick={() => handleViewLeaderboard(quiz.id!)}
                            className="w-full py-3 bg-white dark:bg-slate-800 text-[#1e3a8a] dark:text-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#1e3a8a]/20 hover:bg-[#1e3a8a]/5 transition-all flex items-center justify-center gap-2"
                          >
                            <Ranking01Icon size={14} /> View Leaderboard
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12 bg-[#FCFBF8] dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-[#1e3a8a]/10"
              >
                <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#1e3a8a]/10">
                  <CheckmarkCircle01Icon size={24} className="text-[#1e3a8a]/40" />
                </div>
                <h3 className="font-black text-[#1e3a8a] dark:text-white text-lg tracking-tight">No Completed Quizzes</h3>
                <p className="text-xs text-slate-500 mt-2">You haven't completed any quizzes yet.</p>
              </motion.div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Leaderboard Selection */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-[#D4AF37]/20 shadow-xl space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Ranking01Icon size={24} className="text-[#D4AF37]" />
              <h2 className="text-xl font-black text-[#1e3a8a] dark:text-white uppercase tracking-tight">Select Quiz</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {filteredQuizzes.length > 0 ? (
                filteredQuizzes.map(quiz => {
                  const scheduledTime = (quiz.scheduledAt as any)?.toDate ? (quiz.scheduledAt as any).toDate() : new Date(quiz.scheduledAt);
                  const endTime = quiz.endTime 
                    ? ((quiz.endTime as any).toDate ? (quiz.endTime as any).toDate() : new Date(quiz.endTime))
                    : new Date(scheduledTime.getTime() + quiz.duration * 60000);
                  const isEnded = now > endTime;

                  return (
                    <button
                      key={quiz.id}
                      onClick={() => setSelectedQuizId(quiz.id!)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${selectedQuizId === quiz.id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-100 dark:border-slate-700 hover:border-[#D4AF37]/40'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedQuizId === quiz.id ? 'bg-[#D4AF37] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-[#D4AF37]/20 group-hover:text-[#D4AF37]'}`}>
                          <Book01Icon size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-[#1e3a8a] dark:text-white leading-tight">{quiz.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {getSubjectName(quiz.subjectId)} • {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {!isEnded && (
                        <div className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Live / Pending
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 font-bold text-sm italic">
                  No quizzes found for this date.
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Display */}
          {selectedQuizId ? (
            <div className="space-y-8 pb-12">
              {loadingLeaderboard ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-black text-[#D4AF37] uppercase tracking-[0.2em]">Calculating Ranks...</p>
                </div>
              ) : leaderboardData.length > 0 ? (
                <div className="space-y-6">
                  {/* Header - Open Style */}
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest text-sm">Class Rankings</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{leaderboardData.length} Students</span>
                  </div>

                  {/* List View - Open Style */}
                  <div className="space-y-4">
                    {leaderboardData.map((entry, idx) => (
                      <div 
                        key={entry.id} 
                        className={`py-4 px-3 md:py-6 md:px-6 flex flex-col sm:flex-row items-center justify-between transition-all border-b border-slate-100 dark:border-slate-800 last:border-0 gap-4 sm:gap-0 ${entry.student_id === profile?.studentDocId ? 'bg-[#D4AF37]/10 rounded-3xl border-transparent shadow-sm' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <span className={`w-10 text-center font-black text-xl md:text-2xl ${idx < 3 ? 'scale-125' : 'text-slate-300 text-lg'}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 overflow-hidden border-2 border-[#D4AF37]/20 shadow-md shrink-0">
                            {entry.photo_url ? (
                              <img src={entry.photo_url} alt={entry.student_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <UserGroupIcon size={32} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-[#1e3a8a] dark:text-white text-base md:text-lg leading-none mb-2 truncate">
                              {entry.student_name}
                              {entry.student_id === profile?.studentDocId && <span className="ml-2 text-[8px] bg-[#1e3a8a] text-white px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              {entry.notAttempted ? (
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Not Attempted</p>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <Ranking01Icon size={12} className="text-slate-400" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score: {entry.total_score} pts</p>
                                  </div>
                                  <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
                                  <div className="flex items-center gap-1.5">
                                    <Clock01Icon size={12} className="text-[#D4AF37]" />
                                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                                      Time: <span className="text-[#1e3a8a] dark:text-white ml-0.5">
                                        {entry.time_taken ? (entry.time_taken > 60 ? `${Math.floor(entry.time_taken / 60)}m ${entry.time_taken % 60}s` : `${entry.time_taken}s`) : '0s'}
                                      </span>
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto sm:block text-right border-t sm:border-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                          <p className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Points</p>
                          <div>
                            <p className={`font-black text-2xl md:text-3xl leading-none ${entry.notAttempted ? 'text-slate-200' : 'text-[#1e3a8a] dark:text-[#D4AF37]'}`}>
                              {entry.notAttempted ? '-' : entry.total_score}
                            </p>
                            <p className="hidden sm:block text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Points</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ranking01Icon size={24} className="text-slate-300" />
                  </div>
                  <h3 className="font-black text-slate-400 text-lg uppercase tracking-widest">No Submissions Yet</h3>
                  <p className="text-xs text-slate-400 mt-2">Be the first one to top the charts!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FlashIcon size={24} className="text-slate-300" />
              </div>
              <h3 className="font-black text-slate-400 text-lg uppercase tracking-widest">Select a Quiz</h3>
              <p className="text-xs text-slate-400 mt-2">Choose a quiz from the list above to view its leaderboard.</p>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
</div>
);
};

export default LiveQuizzes;
