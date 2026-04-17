import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';

interface TextSpotlightProps {
  h1: string;
  h2: string;
  p: string;
  showCursor: boolean;
}

const TextSpotlight: React.FC<TextSpotlightProps> = ({ h1, h2, p, showCursor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        data-hide-cursor="true"
        className="relative cursor-none select-none inline-block"
      >
        {/* Base Layer (Normal - Slate/Blue) */}
        <div className="text-center py-4 px-6">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            {h1} <br/><span className="text-[#007bff]">{h2}</span>
            {showCursor && p.length === 0 && <span className="animate-pulse text-[#007bff]">|</span>}
          </h2>
          <p className="text-slate-500 text-sm lg:text-base leading-relaxed max-w-lg mx-auto">
            {p}
            {showCursor && p.length > 0 && <span className="animate-pulse">|</span>}
          </p>
        </div>

        {/* Spotlight Overlay (Black bg, White/Blue text, Zoomed) */}
        <motion.div 
          initial={false}
          animate={{ 
            opacity: isHovering ? 1 : 0,
            clipPath: `circle(${isHovering ? 60 : 0}px at ${mousePos.x}px ${mousePos.y}px)`
          }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 25,
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
        >
          <div 
            className="bg-black w-full h-full flex flex-col items-center justify-center px-6"
            style={{
              transform: `scale(1.15)`, // Slightly more zoom
              transformOrigin: `${mousePos.x}px ${mousePos.y}px`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <div className="text-center w-full py-4">
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight">
                {h1} <br/><span className="text-[#007bff]">{h2}</span>
                {showCursor && p.length === 0 && <span className="animate-pulse text-[#007bff]">|</span>}
              </h2>
              <p className="text-white/80 text-sm lg:text-base leading-relaxed max-w-lg mx-auto">
                {p}
                {showCursor && p.length > 0 && <span className="animate-pulse">|</span>}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TextSpotlight;
