
import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  schoolLogo?: string;
  schoolName?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ schoolLogo, schoolName }) => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Only load mascot animation if we don't have school branding
    if (!schoolLogo) {
      const loadPath = '/animation.json';
      
      fetch(loadPath)
        .then(res => {
          if (!res.ok) throw new Error('Local failed');
          return res.json();
        })
        .then(data => setAnimationData(data))
        .catch(() => {
          fetch('https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/animation.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error('All animation loads failed', err));
        });
    }
  }, [schoolLogo]);

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
      {schoolLogo ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-32 h-32 md:w-48 md:h-48 relative">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-2xl px-8"
            />
            <img 
              src={schoolLogo} 
              alt={schoolName}
              className="w-full h-full object-contain relative z-10"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
              {schoolName}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-2">
              Powered by ilmaura
            </p>
          </div>
        </motion.div>
      ) : (
        animationData && (
          <div className="relative w-96 h-96 md:w-[600px] md:h-[600px] flex items-center justify-center animate-in fade-in duration-1000">
            <Lottie 
              animationData={animationData} 
              loop={true} 
              autoplay={true}
              initialSegment={[0, 90]}
              className="w-full h-full object-contain"
            />
          </div>
        )
      )}
    </div>
  );
};

export default SplashScreen;
