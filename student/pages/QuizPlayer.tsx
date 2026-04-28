
import React, { useState, useEffect, useRef } from 'react';
import { LiveQuiz, QuizSubmission } from '../../types.ts';
import { 
  X, Trophy,
  Heart, Star, Zap, Leaf,
  Check, X as XIcon, Volume2, VolumeX,
  ArrowRight, Timer, Crown, Home, Sparkles, Flame
} from 'lucide-react';
import { addQuizSubmission } from '../../services/api.ts';

// --- Types ---
interface QuizPlayerProps {
  quiz: LiveQuiz;
  profile: any;
  teacher?: any;
  onFinish: () => void;
  onQuizComplete?: (quizId: string, score: number) => void;
}

// --- CONFIGURATIONS ---
const BACKGROUND_MUSIC_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const OPTION_THEMES = [
  { 
    bg: 'bg-[#E21B3C]', // Red
    border: 'border-[#B91530]',
    shadow: 'shadow-[0_6px_0_#891024]',
    activeShadow: 'active:shadow-none active:translate-y-[6px]',
    icon: <Heart className="fill-white text-white" size={40} strokeWidth={2} /> 
  }, 
  { 
    bg: 'bg-[#1368CE]', // Blue
    border: 'border-[#0F54A4]',
    shadow: 'shadow-[0_6px_0_#0B3D78]',
    activeShadow: 'active:shadow-none active:translate-y-[6px]',
    icon: <Star className="fill-white text-white" size={40} strokeWidth={2} /> 
  }, 
  { 
    bg: 'bg-[#D89E00]', // Yellow
    border: 'border-[#C69000]',
    shadow: 'shadow-[0_6px_0_#9F7400]',
    activeShadow: 'active:shadow-none active:translate-y-[6px]',
    icon: <Zap className="fill-white text-white" size={40} strokeWidth={2} /> 
  }, 
  { 
    bg: 'bg-[#26890C]', // Green
    border: 'border-[#1E6D09]',
    shadow: 'shadow-[0_6px_0_#165007]',
    activeShadow: 'active:shadow-none active:translate-y-[6px]',
    icon: <Leaf className="text-white" size={40} strokeWidth={2} /> 
  }, 
];

const CORRECT_PHRASES = ["Pure Genius!", "Unstoppable!", "Answer Streak!", "You're on fire!", "Podium bound!", "Excellent!", "Quick fingers!"];
const INCORRECT_PHRASES = ["Dust yourself off!", "Keep going!", "Tough one!", "You'll get the next one!", "Nice try!", "Not quite!", "Focus!"];

// --- Audio Engine ---
let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;

const playSound = (type: 'correct' | 'incorrect' | 'tick' | 'urgent_tick' | 'win' | 'start' | 'countdown') => {
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
      case 'tick':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'urgent_tick':
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      case 'start':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'countdown':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
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

const QuizBackground = ({ isUrgent }: { isUrgent: boolean }) => (
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
    <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isUrgent ? 'opacity-100' : 'opacity-0'}`} />
  </div>
);

const ScoreBadge = ({ score }: { score: number }) => (
  <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 shadow-sm">
    <span className="bg-white dark:bg-[#1e293b] text-[#46178f] text-[10px] font-black px-1.5 rounded uppercase">PTS</span>
    <span className="text-white font-black font-mono text-xl tracking-widest">{score}</span>
  </div>
);

const CircularTimer = ({ duration, timeLeft }: { duration: number, timeLeft: number }) => {
  const radius = 35;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / duration) * circumference;
  
  let strokeColor = "white";
  if (timeLeft <= 5) strokeColor = "#E21B3C";

  return (
    <div className="relative flex items-center justify-center drop-shadow-xl animate-in zoom-in-50 duration-300">
      <div className="absolute inset-0 bg-[#3a1078] rounded-full"></div>
      <svg height={radius * 2} width={radius * 2} className="-rotate-90 relative z-10">
        <circle stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx={radius} cy={radius} />
        <circle stroke={strokeColor} fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} />
      </svg>
      <span className="absolute text-2xl font-black text-white z-20 shadow-black drop-shadow-md">{timeLeft}</span>
    </div>
  );
};

const CountdownOverlay = ({ count, qIndex, total }: { count: number, qIndex: number, total: number }) => (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-[#46178f] overflow-hidden font-sans">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-12 bg-black/20 text-white px-8 py-3 rounded-full font-black text-2xl uppercase tracking-widest backdrop-blur-md border border-white/10 shadow-xl animate-in slide-in-from-top-10 duration-500">
            Question {qIndex + 1} <span className="opacity-50 text-xl ml-2">/ {total}</span>
        </div>
        <div className="absolute w-[60vmin] h-[60vmin] bg-[#3a1078] rounded-[3rem] animate-[spin_8s_linear_infinite] shadow-2xl" />
        <div key={count} className="relative z-10 text-white font-black text-[25vw] md:text-[15rem] leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] animate-in zoom-in-50 duration-300">
            {count}
        </div>
        <div className="absolute bottom-24 text-white/60 font-black text-2xl uppercase tracking-[0.5em] animate-pulse">
            Get Ready
        </div>
    </div>
);

// --- MAIN GAME ---
const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, profile, onFinish, onQuizComplete }) => {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [gameState, setGameState] = useState<'intro' | 'question_ready' | 'playing' | 'feedback' | 'finished'>('intro');
  const [timeLeft, setTimeLeft] = useState(0);
  const [countDown, setCountDown] = useState(3);
  const [feedbackData, setFeedbackData] = useState<{ correct: boolean, points: number, correctIndex: number, message: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const startTimeRef = useRef<number>(performance.now());
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentQ = quiz.questions[qIndex];

  const isUrgent = gameState === 'playing' && timeLeft <= 5 && timeLeft > 0;

  // --- EFFECTS ---

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

  // Intro -> Question Ready
  useEffect(() => {
    if (gameState === 'intro') {
        const timer = setTimeout(() => {
            setGameState('question_ready');
            setCountDown(3);
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Question Ready -> Playing
  useEffect(() => {
    if (gameState === 'question_ready') {
        if (countDown > 0) {
            playSound('countdown');
            const timer = setTimeout(() => setCountDown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setGameState('playing');
            setTimeLeft(currentQ.timeLimit);
            playSound('start');
        }
    }
  }, [gameState, countDown]);

  // Playing Timer
  useEffect(() => {
    if (gameState === 'playing') {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAnswer(-1);
                    return 0;
                }
                if (prev <= 6) { // seconds 5, 4, 3, 2, 1
                    playSound('urgent_tick');
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [gameState]);

  // --- HANDLERS ---

  const handleAnswer = (optionIdx: number) => {
    if (gameState !== 'playing') return;

    const isCorrect = optionIdx !== -1 && currentQ.options[optionIdx].isCorrect;
    const correctIdx = currentQ.options.findIndex(o => o.isCorrect);
    const basePoints = currentQ.points || 1000;
    
    let pointsEarned = 0;
    let feedbackMsg = "";

    if (isCorrect) {
        const ratio = timeLeft / currentQ.timeLimit;
        pointsEarned = Math.round(basePoints * (0.5 + (0.5 * ratio)));
        
        setScore(s => s + pointsEarned);
        setStreak(s => s + 1);
        playSound('correct');
        feedbackMsg = CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)];
    } else {
        setStreak(0);
        playSound('incorrect');
        feedbackMsg = INCORRECT_PHRASES[Math.floor(Math.random() * INCORRECT_PHRASES.length)];
    }

    setFeedbackData({ 
        correct: isCorrect, 
        points: pointsEarned, 
        correctIndex: correctIdx,
        message: feedbackMsg
    });
    
    setAnswers(prev => [...prev, { questionId: currentQ.id, selectedOptionIndex: optionIdx, score: pointsEarned }]);
    setGameState('feedback');
  };

  const handleNext = async () => {
    if (qIndex < quiz.questions.length - 1) {
        setQIndex(i => i + 1);
        setFeedbackData(null);
        setGameState('question_ready');
        setCountDown(3);
    } else {
        setGameState('finished');
        playSound('win');
        try {
            const finalScore = score + (feedbackData?.points || 0);
            const endTime = performance.now();
            const timeTakenSeconds = Math.max(1, Math.floor((endTime - startTimeRef.current) / 1000));
            
            console.log("Quiz finished. Time taken:", timeTakenSeconds, "seconds");
            
            await addQuizSubmission(profile.schoolId, {
                quizId: quiz.id!,
                studentId: profile.studentDocId,
                studentName: profile.name,
                answers: [...answers],
                totalScore: finalScore,
                timeTaken: timeTakenSeconds
            });
            if (onQuizComplete) {
                onQuizComplete(quiz.id!, finalScore);
            }
        } catch (e) { console.error("Submit error", e); }
    }
  };

  // --- RENDERERS ---

  if (gameState === 'intro') {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#46178f] z-[300]">
            <QuizBackground isUrgent={false} />
            <div className="relative z-10 text-center animate-in zoom-in-50 duration-500">
                <div className="w-24 h-24 bg-white dark:bg-[#1e293b] rounded-2xl rotate-12 mx-auto mb-6 flex items-center justify-center shadow-[0_10px_0_rgba(0,0,0,0.2)]">
                    <Zap size={48} className="text-[#46178f] fill-current" />
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{quiz.title}</h1>
                <p className="text-white/80 font-bold mt-4 text-xl">{quiz.questions.length} Questions</p>
            </div>
        </div>
    );
  }

  if (gameState === 'question_ready') {
      return <CountdownOverlay count={countDown} qIndex={qIndex} total={quiz.questions.length} />;
  }

  if (gameState === 'finished') {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#46178f] z-[300] overflow-hidden font-sans">
            <QuizBackground isUrgent={false} />
            <div className="relative z-10 text-center animate-in zoom-in duration-500 px-6">
                <div className="w-32 h-32 bg-white/10 dark:bg-[#1e293b]/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/20 shadow-2xl">
                    <Check size={64} className="text-white" strokeWidth={4} />
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                    Quiz Completed
                </h1>
                <p className="text-xl text-white/80 font-bold mb-12">
                    Thanks for participating!
                </p>
                <button onClick={onFinish} className="bg-white dark:bg-[#1e293b] text-[#46178f] px-8 py-3 md:px-10 md:py-4 rounded-2xl font-black text-lg md:text-xl shadow-[0_8px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[8px] transition-all flex items-center gap-3 mx-auto hover:bg-slate-50">
                    <Home size={24} /> Back to Dashboard
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 flex flex-col z-[300] font-sans overflow-hidden bg-[#46178f]">
        <audio ref={audioRef} src={BACKGROUND_MUSIC_URL} loop preload="auto" />
        <QuizBackground isUrgent={isUrgent} />
        
        <div className="h-16 flex items-center justify-between px-4 md:px-6 z-20 relative bg-black/10 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-4 text-white">
                <span className="font-black text-lg bg-white/20 dark:bg-[#1e293b]/20 px-3 py-1 rounded-full">{qIndex + 1} / {quiz.questions.length}</span>
            </div>
            <div className="font-black text-white tracking-tighter text-xl italic hidden md:block opacity-50">
                Ilmaura Quiz
            </div>
            <div className="flex items-center gap-3">
                <ScoreBadge score={score} />
                <button onClick={() => { isMutedGlobal = !isMutedGlobal; setIsMuted(!isMuted); }} className="w-10 h-10 bg-white/10 dark:bg-[#1e293b]/10 rounded-full flex items-center justify-center hover:bg-white/20 dark:bg-[#1e293b]/20 text-white transition-colors">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
            </div>
        </div>

        <div className="flex-1 flex flex-col relative z-20 px-4 md:px-8 pb-6 md:pb-12 w-full max-w-7xl mx-auto h-full justify-between overflow-y-auto custom-scrollbar">
            
            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[30vh]">
                <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-8 relative mt-4 md:mt-0">
                    <div className="hidden md:flex shrink-0 w-24 justify-center">
                         {gameState === 'playing' && (
                            <CircularTimer duration={currentQ.timeLimit} timeLeft={timeLeft} />
                        )}
                    </div>
                    <div className="relative w-full flex-1">
                        <div className="md:hidden absolute -top-12 left-1/2 -translate-x-1/2 z-30">
                            {gameState === 'playing' && (
                                <CircularTimer duration={currentQ.timeLimit} timeLeft={timeLeft} />
                            )}
                        </div>
                        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-10 rounded-[2rem] shadow-[0_8px_0_rgba(0,0,0,0.1)] text-center border-b-[6px] border-gray-200 animate-in zoom-in-95 duration-300 min-h-[150px] md:min-h-[200px] flex items-center justify-center">
                            <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 leading-snug">
                                {currentQ.questionText}
                            </h2>
                        </div>
                    </div>
                     <div className="hidden md:block shrink-0 w-24"></div> 
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto mt-auto pb-safe">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full">
                    {currentQ.options.map((opt, idx) => {
                        const theme = OPTION_THEMES[idx % 4];
                        return (
                            <button
                                key={idx}
                                disabled={gameState !== 'playing'}
                                onClick={() => handleAnswer(idx)}
                                className={`
                                    relative w-full rounded-[15px] flex items-center justify-start p-4 md:p-6 gap-4
                                    transition-all duration-100 group
                                    ${theme.bg} ${theme.border} 
                                    ${gameState === 'playing' 
                                        ? `border-b-[6px] ${theme.shadow} hover:brightness-110 ${theme.activeShadow}` 
                                        : 'border-b-[6px] opacity-50 cursor-default'
                                    }
                                    h-24 md:h-32 lg:h-40
                                `}
                            >
                                <div className="shrink-0 drop-shadow-md">
                                    {theme.icon}
                                </div>
                                <span className="text-white font-black text-lg md:text-2xl text-left leading-tight drop-shadow-sm line-clamp-3 w-full">
                                    {opt.text}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>

        {gameState === 'feedback' && feedbackData && (
            <div className="fixed inset-0 z-[400] flex flex-col bg-[#46178f] animate-in zoom-in duration-300 font-sans">
                
                <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                    
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 dark:bg-[#1e293b]/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 dark:bg-[#1e293b]/10 rounded-full blur-3xl"></div>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8 drop-shadow-md animate-bounce-short text-center">
                        {feedbackData.correct ? "Correct" : "Incorrect"}
                    </h2>

                    <div className="mb-6 relative">
                        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20 ${feedbackData.correct ? 'bg-[#26890C]' : 'bg-[#E21B3C]'}`}>
                            {feedbackData.correct ? (
                                <Check size={80} strokeWidth={4} className="text-white" />
                            ) : (
                                <XIcon size={80} strokeWidth={4} className="text-white" />
                            )}
                        </div>
                    </div>

                    {streak > 1 && (
                      <div className="flex items-center gap-3 bg-black/20 px-6 py-3 rounded-full text-white text-2xl md:text-4xl font-black mb-6 border border-white/10 shadow-lg animate-in slide-in-from-bottom-5 duration-500">
                         <Flame size={40} className="text-orange-400 fill-current"/>
                         <span>{streak}</span>
                         <span className="opacity-70 text-lg">ANSWER STREAK</span>
                      </div>
                    )}

                    <p className="text-2xl font-bold text-white/80 italic drop-shadow-sm">
                        {feedbackData.message}
                    </p>

                </div>
                
                <div className="h-28 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative">
                    <div className="flex flex-col">
                        <ScoreBadge score={score} />
                        {feedbackData.points > 0 && (
                          <span className="text-emerald-400 font-black mt-2 animate-in slide-in-from-bottom-2 duration-500">
                            +{feedbackData.points}
                          </span>
                        )}
                    </div>
                    
                    <button onClick={handleNext} className="absolute bottom-4 right-4 md:bottom-8 md:right-8 bg-slate-800 text-white px-6 py-3 md:px-10 md:py-4 rounded-xl font-black text-lg md:text-xl shadow-[0_6px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-[6px] transition-all flex items-center gap-3 group">
                        Next <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default QuizPlayer;
