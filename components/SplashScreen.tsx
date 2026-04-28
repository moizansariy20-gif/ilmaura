
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
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
      {schoolLogo ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="w-40 h-40 md:w-64 md:h-64">
            <img 
              src={schoolLogo} 
              alt={schoolName}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
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
