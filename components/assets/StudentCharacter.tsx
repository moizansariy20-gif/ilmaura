
import React, { useState } from 'react';

const StudentCharacter = () => {
  // SYSTEM ARCHITECT NOTE:
  // This component uses a "Hybrid Asset Strategy".
  // 1. It tries to load the local file first (Best for Offline/Speed).
  //    Path: /public/assets/student-character.png
  // 2. If local fails, it falls back to the Cloud URL (Safety Net).
  
  const LOCAL_ASSET = "/assets/student-character.png";
  const CLOUD_BACKUP = "https://iili.io/fkxzKml.png";

  const [imgSrc, setImgSrc] = useState(LOCAL_ASSET);

  const handleError = () => {
    // If local file is missing, switch to cloud automatically
    if (imgSrc === LOCAL_ASSET) {
        console.warn("System Notice: Local asset not found. Switching to Cloud Backup.");
        setImgSrc(CLOUD_BACKUP);
    }
  };

  return (
    <div className="relative w-full h-full flex items-end justify-end pointer-events-none select-none z-50">
        {/* Character Image */}
        <img 
            src={imgSrc} 
            alt="Student Companion" 
            onError={handleError}
            // Visual Styles:
            // - Drop shadow for depth
            // - Scaling for perfect fit on the card
            // - Smooth transition on load
            className="w-full h-full object-contain object-bottom drop-shadow-2xl scale-110 translate-x-2 translate-y-2 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4"
            
            // Performance Hints
            decoding="async"
        />
    </div>
  );
};

export default StudentCharacter;
