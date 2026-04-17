
import React from 'react';

interface StudentPageHeaderProps {
  profile: any;
  currentClass?: any;
  title?: string;
  subtitle?: string;
}

const StudentPageHeader: React.FC<StudentPageHeaderProps> = ({ profile, currentClass, title, subtitle }) => {
  const name = profile?.name || 'Student';

  // Dynamic Font Sizing Logic
  // Adjusts the text size based on character count to ensure it fits the card design aesthetic
  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len > 25) return 'text-xl';      // Very long names (e.g. Muhammad Shahroz Khan)
    if (len > 18) return 'text-2xl';     // Long names
    if (len > 10) return 'text-3xl';     // Medium names
    return 'text-4xl';                   // Short names (Standard Dashboard Look)
  };

  const nameFontSize = getFontSizeClass(name);

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-b-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] relative z-10 shrink-0 flex flex-col justify-center px-6 pt-8 pb-10 border-b border-slate-100 dark:border-slate-800/50 overflow-hidden mb-6">
        {/* Yellow Circle Decoration - Large sized like dashboard */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#FFD700] rounded-full z-0 shadow-sm"></div>
        
        <div className="relative z-20 w-full flex justify-between items-start">
            <div className="flex flex-col items-start gap-2 pt-2 pl-1 w-[70%]">
                {/* Student Name with Dynamic Font Size */}
                <h1 className={`${nameFontSize} font-black text-[#1e3a8a] tracking-tight leading-none drop-shadow-sm break-words w-full`}>
                    {name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Page Title (e.g. Homework) is now a Badge */}
                  <span className="inline-block px-3 py-1 rounded-full bg-[#1e3a8a] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20">
                      {title || 'Student App'}
                  </span>
                  
                  {/* Class Name */}
                  {currentClass && (
                    <span className="text-[#1e3a8a] text-sm font-black tracking-tight border-l-2 border-[#1e3a8a]/20 pl-2 truncate max-w-[100px]">
                      {currentClass.name}
                    </span>
                  )}
                </div>
            </div>

            {/* Profile Image - Large Size (w-24 h-24) to match Dashboard */}
            <div className="relative z-20 -mt-2 -mr-2 shrink-0">
                <div className="w-24 h-24 rounded-full p-1 bg-white dark:bg-slate-800 shadow-2xl border-4 border-slate-50">
                    {profile?.photoURL ? (
                        <img src={profile.photoURL} className="w-full h-full rounded-full object-cover shadow-inner" alt="Profile" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] flex items-center justify-center text-white font-black text-3xl shadow-inner border border-white/20">
                            {name[0]}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default StudentPageHeader;
