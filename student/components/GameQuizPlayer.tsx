
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Trophy, Check, ArrowRight, RefreshCw, Home, Volume2, VolumeX, 
  Heart, Star, Zap, Leaf, CheckCircle, X as XIcon, Flame, Coins, Triangle, Diamond, Circle, Square, Sparkles
} from 'lucide-react';
import { GameQuestion } from '../../types.ts';
import { englishQuestions } from '../../games/english_quiz.ts';
import { supabase } from '../../services/supabase.ts'; // UPDATED: Import Supabase directly

interface GameQuizPlayerProps {
  onFinish: () => void;
  profile?: any;
  currentClass?: any;
}

// --- CONFIGURATIONS ---
const BACKGROUND_MUSIC_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const OPTION_THEMES = [
  { 
    bg: 'bg-[#E21B3C]', // Red
    border: 'border-[#B91530]',
    shadow: 'shadow-[0_6px_0_#891024]',
    activeShadow: 'active:shadow-none active:translate-y-[6px]',
    icon: <Triangle className="fill-white text-white" size={32} strokeWidth={3} /> 
  }, 
  { 
    bg: 'bg-[#1368CE]', // Blue
    border: 'border-[#0F54A4]',
    shadow: 'shadow-[0_6px_0_#0B3D78]',
    activeShadow: 'active:shadow-none active:translate-y-[6px]',
    icon: <Diamond className="fill-white text-white" size={32} strokeWidth={3} /> 
  }, 
  { 
    bg: 'bg-[#D89E00]', // Yellow
    border: 'border-[#C69000]',
    shadow: 'shadow-[0_6px_0_#9F7400]',
    activeShadow: 'active:shadow-none active:translate-y-[6px]',
    icon: <Circle className="fill-white text-white" size={32} strokeWidth={3} /> 
  }, 
  { 
    bg: 'bg-[#26890C]', // Green
    border: 'border-[#1E6D09]',
    shadow: 'shadow-[0_6px_0_#165007]',
    activeShadow: 'active:shadow-none active:translate-y-[6px]',
    icon: <Square className="fill-white text-white" size={32} strokeWidth={3} /> 
  }, 
];

const CORRECT_PHRASES = ["Pure Genius!", "Unstoppable!", "Answer Streak!", "You're on fire!", "Podium bound!", "Excellent!", "Quick fingers!"];
const INCORRECT_PHRASES = ["Dust yourself off!", "Keep going!", "Tough one!", "You'll get the next one!", "Nice try!", "Not quite!", "Focus!"];

// --- SOUND ENGINE ---
let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;

const playSound = (type: 'correct' | 'incorrect' | 'win' | 'click' | 'coin') => {
  if (isMutedGlobal) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
      case 'correct':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'incorrect':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'win':
        [0, 0.1, 0.2, 0.4].forEach((t, i) => {
            const o = audioCtx!.createOscillator();
            const g = audioCtx!.createGain();
            o.connect(g);
            g.connect(audioCtx!.destination);
            o.frequency.value = 400 + (i * 200);
            g.gain.setValueAtTime(0.1, now + t);
            g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.3);
            o.start(now + t);
            o.stop(now + t + 0.3);
        });
        break;
    }
  } catch (e) { console.error(e); }
};

// --- COMPONENTS ---

const QuizBackground = () => (
  <div className="fixed inset-0 z-0 bg-[#46178f] overflow-hidden pointer-events-none">
    <div className="absolute inset-0 opacity-10">
       <svg width="100%" height="100%">
          <pattern id="k-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
             <circle cx="50" cy="50" r="2" fill="white"/>
             <path d="M20 20 L25 25 M25 20 L20 25" stroke="white" strokeWidth="1"/>
             <rect x="80" y="80" width="6" height="6" stroke="white" fill="none"/>
             <path d="M80 20 L90 20 L85 10 Z" stroke="white" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#k-pattern)"/>
       </svg>
    </div>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]"></div>
  </div>
);

const ScoreBadge = ({ score }: { score: number }) => (
  <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 shadow-sm">
    <span className="bg-white dark:bg-slate-800 text-[#46178f] text-[10px] font-black px-1.5 rounded uppercase">PTS</span>
    <span className="text-white font-black font-mono text-xl tracking-widest">{score}</span>
  </div>
);

// --- MAIN COMPONENT ---

const GameQuizPlayer: React.FC<GameQuizPlayerProps> = ({ onFinish, profile }) => {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'feedback' | 'finished'>('intro');
  const [isMuted, setIsMuted] = useState(false);
  const [coinsSaved, setCoinsSaved] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Shuffle questions on game start
    setQuestions([...englishQuestions].sort(() => Math.random() - 0.5));
    // Brief intro state
    setTimeout(() => setGameState('playing'), 1500);
  }, []);

  // Background Music Controller
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (gameState === 'playing' && !isMuted) {
      audioElement.play().catch(e => {
        if (e.name !== 'AbortError') {
          console.error("Audio play failed:", e);
        }
      });
    } else {
      audioElement.pause();
      if (gameState !== 'playing') {
          audioElement.currentTime = 0;
      }
    }
  }, [gameState, isMuted]);

  // SAVE POINTS LOGIC WHEN GAME FINISHES
  useEffect(() => {
    const saveCoins = async () => {
        if (gameState === 'finished' && score > 0 && !coinsSaved && profile?.schoolId && profile?.studentDocId) {
            try {
                // Fetch current coins first to be safe
                const { data, error } = await supabase
                    .from('students')
                    .select('total_points')
                    .eq('id', profile.studentDocId)
                    .single();
                
                const currentPoints = (data && !error) ? (data.total_points || 0) : 0;
                
                // Add new score to total
                const newTotal = currentPoints + score;
                
                // Update in Supabase
                await supabase
                    .from('students')
                    .update({ total_points: newTotal })
                    .eq('id', profile.studentDocId);

                setCoinsSaved(true);
                playSound('coin');
            } catch (error) {
                console.error("Failed to save coins", error);
            }
        }
    };
    saveCoins();
  }, [gameState, score, coinsSaved, profile]);

  const currentQuestion = questions[qIndex];

  const handleAnswer = (option: string) => {
    if (gameState !== 'playing') return;

    setSelectedAnswer(option);
    const correct = option === currentQuestion.correct_answer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(s => s + 100 + (streak * 10)); // Bonus points for streak
      setStreak(s => s + 1);
      playSound('correct');
      setFeedbackMsg(CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)]);
    } else {
      setStreak(0);
      playSound('incorrect');
      setFeedbackMsg(INCORRECT_PHRASES[Math.floor(Math.random() * INCORRECT_PHRASES.length)]);
    }
    
    setGameState('feedback');
  };

  const handleNext = () => {
    playSound('click');
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setGameState('playing');
    } else {
      setGameState('finished');
      playSound('win');
    }
  };
  
  const handlePlayAgain = () => {
    playSound('click');
    setQuestions([...englishQuestions].sort(() => Math.random() - 0.5));
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCoinsSaved(false); // Reset persistence flag
    setGameState('playing');
  };

  // --- RENDERING ---

  if (gameState === 'intro') {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#46178f] z-[300]">
            <QuizBackground />
            <div className="relative z-10 text-center animate-in zoom-in-50 duration-500">
                <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl rotate-12 mx-auto mb-6 flex items-center justify-center shadow-[0_10px_0_rgba(0,0,0,0.2)]">
                    <Sparkles size={48} className="text-[#46178f] fill-current" />
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">Get Ready!</h1>
                <p className="text-white/80 font-bold mt-4 text-xl">Loading your game...</p>
            </div>
        </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#46178f] z-[300] overflow-hidden font-sans">
        <QuizBackground />
        <div className="relative z-10 text-center animate-in zoom-in duration-300 w-full max-w-md px-6">
            <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-2xl shadow-yellow-500/50">
                <Trophy size={64} className="text-yellow-900 fill-current" />
            </div>
            
            <h2 className="text-5xl font-black text-white tracking-tight mb-2 drop-shadow-md">
                Game Over!
            </h2>
            
            <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/20 mb-8 relative overflow-hidden">
                {coinsSaved && (
                    <div className="absolute inset-0 bg-yellow-400/20 animate-pulse"></div>
                )}
                <p className="text-6xl font-black text-yellow-300 tracking-tighter relative z-10 drop-shadow-sm">{score}</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-white/80 font-bold uppercase tracking-widest text-xs relative z-10">
                    {coinsSaved ? (
                        <>
                            <Check size={14} className="text-emerald-400"/>
                            <span className="text-emerald-300">Added to Total Score</span>
                        </>
                    ) : (
                        <span>Points Earned</span>
                    )}
                </div>
                
                {coinsSaved && (
                    <div className="absolute top-4 right-4 animate-bounce">
                        <Coins className="text-yellow-400" size={24} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={onFinish} className="py-4 bg-white/20 dark:bg-slate-800/20 text-white rounded-2xl font-black text-sm shadow-sm hover:bg-white/30 dark:bg-slate-800/30 transition-all flex items-center justify-center gap-2 backdrop-blur-md border border-white/10">
                    <Home size={18}/> Exit
                </button>
                <button onClick={handlePlayAgain} className="py-4 bg-white dark:bg-slate-800 text-[#46178f] rounded-2xl font-black text-sm shadow-[0_4px_0_rgba(0,0,0,0.2)] active:translate-y-[4px] active:shadow-none hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                    <RefreshCw size={18}/> Replay
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="fixed inset-0 bg-[#46178f] flex items-center justify-center text-white font-black">Loading question...</div>;
  }

  return (
    <div className="fixed inset-0 flex flex-col z-[300] font-sans overflow-hidden bg-[#46178f]">
      <audio ref={audioRef} src={BACKGROUND_MUSIC_URL} loop preload="auto" />
      <QuizBackground />

      {/* Top Bar */}
      <div className="h-20 flex items-center justify-between px-4 md:px-8 z-20 relative pt-4">
         <div className="flex items-center gap-4">
            <button onClick={onFinish} className="w-10 h-10 bg-white/10 dark:bg-slate-800/10 rounded-full flex items-center justify-center hover:bg-white/20 dark:bg-slate-800/20 text-white transition-colors backdrop-blur-md">
                <X size={20} />
            </button>
            <span className="font-black text-lg text-white/90 bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                {qIndex + 1} <span className="opacity-50 mx-1">/</span> {questions.length}
            </span>
         </div>
         
         <div className="flex items-center gap-3">
            <ScoreBadge score={score} />
            <button onClick={() => { isMutedGlobal = !isMutedGlobal; setIsMuted(!isMuted); }} className="w-10 h-10 bg-white/10 dark:bg-slate-800/10 rounded-full flex items-center justify-center hover:bg-white/20 dark:bg-slate-800/20 text-white transition-colors backdrop-blur-md">
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-20 px-4 md:px-8 pb-6 md:pb-12 w-full max-w-6xl mx-auto h-full justify-between overflow-y-auto custom-scrollbar">
          
          {/* Question Area */}
          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[30vh]">
             <div className="w-full max-w-4xl">
                <div className="bg-white dark:bg-slate-800 p-6 md:p-12 rounded-[2.5rem] shadow-[0_10px_0_rgba(0,0,0,0.1)] text-center border-b-[8px] border-gray-200 animate-in zoom-in-95 duration-300 min-h-[200px] flex items-center justify-center relative">
                    <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-slate-100 leading-snug">
                        {currentQuestion.question_text}
                    </h2>
                    
                    {streak > 1 && (
                        <div className="absolute -top-4 -right-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg animate-bounce flex items-center gap-1 border-2 border-white">
                            <Flame size={12} fill="currentColor" /> STREAK {streak}
                        </div>
                    )}
                </div>
             </div>
          </div>

          {/* Options Grid */}
          <div className="w-full max-w-5xl mx-auto mt-auto pb-safe pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full">
                {currentQuestion.options.map((option, i) => {
                    const theme = OPTION_THEMES[i % 4];
                    const isSelected = selectedAnswer === option;
                    
                    return (
                        <button
                        key={i}
                        disabled={!!selectedAnswer}
                        onClick={() => handleAnswer(option)}
                        className={`
                            relative w-full rounded-[1.2rem] flex items-center justify-start p-4 md:p-6 gap-5
                            transition-all duration-150 group h-24 md:h-32 lg:h-36
                            ${theme.bg} ${theme.border} 
                            ${!selectedAnswer ? `border-b-[6px] ${theme.shadow} hover:brightness-110 ${theme.activeShadow}` : ''}
                            ${isSelected ? 'translate-y-[6px] border-b-0 ring-4 ring-white ring-offset-4 ring-offset-[#46178f]' : ''}
                            ${selectedAnswer && !isSelected ? 'opacity-40 scale-95 border-b-0 translate-y-[6px]' : ''}
                        `}
                        >
                            <div className="w-12 h-12 flex items-center justify-center shrink-0 drop-shadow-md">
                                {theme.icon}
                            </div>
                            <span className="text-white font-black text-xl md:text-2xl text-left leading-tight drop-shadow-sm line-clamp-2 w-full">
                                {option}
                            </span>
                        </button>
                    );
                })}
            </div>
          </div>
      </div>

      {/* FEEDBACK OVERLAY (Full Screen) */}
      {gameState === 'feedback' && (
        <div className="fixed inset-0 z-[400] flex flex-col bg-[#46178f] animate-in zoom-in duration-300 font-sans">
            
            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 dark:bg-slate-800/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-56 h-56 bg-white/10 dark:bg-slate-800/10 rounded-full blur-3xl"></div>
                </div>

                <h2 className="text-6xl md:text-8xl font-black text-white tracking-tight mb-8 drop-shadow-md animate-bounce-short text-center">
                    {isCorrect ? "Correct" : "Incorrect"}
                </h2>

                <div className="mb-8 relative">
                    <div className={`w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center shadow-2xl border-[6px] border-white/20 ${isCorrect ? 'bg-[#26890C]' : 'bg-[#E21B3C]'}`}>
                        {isCorrect ? (
                            <Check size={80} strokeWidth={5} className="text-white drop-shadow-sm" />
                        ) : (
                            <XIcon size={80} strokeWidth={5} className="text-white drop-shadow-sm" />
                        )}
                    </div>
                </div>

                <p className="text-2xl md:text-3xl font-bold text-white/90 italic drop-shadow-sm px-6 text-center max-w-2xl">
                    {feedbackMsg}
                </p>
                
                {!isCorrect && (
                    <div className="mt-6 bg-white/10 dark:bg-slate-800/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-center animate-in slide-in-from-bottom-4">
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Correct Answer</p>
                        <p className="text-xl font-black text-white">{currentQuestion.correct_answer}</p>
                    </div>
                )}

            </div>
            
            <div className="h-32 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 md:px-12 shrink-0 relative border-t border-white/5">
                <div className="flex flex-col">
                    <ScoreBadge score={score} />
                    {isCorrect && (
                      <span className="text-emerald-400 font-black mt-2 animate-in slide-in-from-bottom-2 text-center text-lg drop-shadow-sm">
                        +100
                      </span>
                    )}
                </div>
                
                <button onClick={handleNext} className="bg-white dark:bg-slate-800 text-[#46178f] px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[6px] transition-all flex items-center gap-3 group hover:bg-slate-100">
                    {qIndex === questions.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform"/>
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default GameQuizPlayer;
