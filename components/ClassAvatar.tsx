import React from 'react';

const GRADIENTS = [
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-purple-400 to-fuchsia-500',
  'from-cyan-400 to-blue-500',
  'from-lime-400 to-green-500',
  'from-red-400 to-rose-500',
  'from-yellow-400 to-amber-500',
  'from-violet-400 to-purple-500',
];

// Simple deterministic hash function for strings
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

interface ClassAvatarProps {
  className: string;
  classId: string;
  size?: number;
}

const ClassAvatar: React.FC<ClassAvatarProps> = ({ className, classId, size = 24 }) => {
  const hash = hashString(classId || className);
  const gradientClass = GRADIENTS[hash % GRADIENTS.length];
  
  // Get the first letter of the class name
  const firstLetter = className ? className.charAt(0).toUpperCase() : '?';

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white shadow-inner relative overflow-hidden`}>
      {/* Soft glow effect behind the letter */}
      <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-50"></div>
      
      {/* The actual letter */}
      <span 
        className="relative z-10 font-black drop-shadow-md"
        style={{ 
          fontSize: `${size * 0.6}px`, // Scale font size based on the container size
          filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' 
        }}
      >
        {firstLetter}
      </span>
    </div>
  );
};

export default ClassAvatar;
