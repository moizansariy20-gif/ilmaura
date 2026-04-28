
import React, { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle, Wallet } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: 0,
    type: 'role', 
    title: "IlmAura",
    subtitle: "", 
    desc: "Experience school like never before. Track results, manage tasks, and stay ahead with the smartest school.",
    align: 'text-left',
    image: "https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/ChatGPT%20Image%20Feb%203,%202026,%2001_55_31%20AM.png"
  },
  {
    id: 1,
    type: 'role',
    title: "Principal",
    subtitle: "",
    desc: "Complete oversight of your institute. Monitor fees, manage staff payroll, and track campus performance in real-time.",
    align: 'text-left',
    image: "https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/d43a6ca7-a989-4a6f-8877-97ba32e213d8.png"
  },
  {
    id: 2,
    type: 'role',
    title: "Teacher",
    subtitle: "",
    desc: "Effortless academic tools. Mark attendance, upload exam marks, and assign homework logs directly from your phone.",
    align: 'text-left',
    image: "https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/79379791-b261-401c-9edf-82eb0847dbbf.png"
  },
  {
    id: 3,
    type: 'role',
    title: "Student",
    subtitle: "",
    desc: "Your personal dashboard. View results, check daily diaries, attempt quizzes, and stay connected with your school.",
    align: 'text-left',
    image: "https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/ChatGPT%20Image%20Feb%203,%202026,%2001_55_31%20AM.png"
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(curr => curr + 1);
    } else {
      onComplete();
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-[9000] bg-white dark:bg-[#1e293b] flex flex-col font-sans overflow-hidden">
        
        {/* Image Section - Full width, stuck to top */}
        <div className="w-full relative h-[55vh] flex-shrink-0 bg-slate-50 dark:bg-[#0f172a] overflow-hidden">
            {/* 
                PRELOADING STRATEGY:
                Render ALL images at once, stacked on top of each other.
                Use opacity to transition between them. This ensures they are loaded
                in the DOM and display instantly when the index changes.
            */}
            {SLIDES.map((s, index) => (
                <img 
                    key={s.id} 
                    src={s.image} 
                    alt="Illustration" 
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    loading="eager"
                />
            ))}
            
            {/* Gradient overlay to blend image into white text area smoothly */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-20"></div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-between px-8 pb-10 relative z-30 -mt-2">
            
            {/* Text Content */}
            <div className={`space-y-4 mt-6 ${slide.align}`}>
                {/* Key ensures text animation replays on slide change */}
                <div key={slide.id} className="animate-in slide-in-from-bottom-4 duration-500">
                    {slide.type === 'welcome' ? (
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {slide.title}
                        </h2>
                    ) : (
                        <div>
                            {slide.subtitle && (
                                <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
                                    {slide.subtitle}
                                </p>
                            )}
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {slide.title}
                            </h2>
                        </div>
                    )}
                    
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-4">
                        {slide.desc}
                    </p>
                </div>
            </div>

            {/* Bottom Button Area */}
            <div className="w-full mb-2 space-y-6">
                {/* Dots Indicator */}
                <div className="flex gap-2 justify-center">
                    {SLIDES.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-slate-900' : 'w-2 bg-slate-200'}`}
                        />
                    ))}
                </div>

                <button 
                    onClick={handleNext}
                    className="w-full py-5 rounded-[1.5rem] bg-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-blue-700"
                >
                    {currentSlide === SLIDES.length - 1 ? "Get Started" : "Next"} 
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default Onboarding;
