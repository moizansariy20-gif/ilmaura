import React from 'react';

const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
);

const SkeletonBox = ({ className }: { className: string }) => (
  <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 ${className}`}>
    <Shimmer />
  </div>
);

const TeacherSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] dark:bg-slate-900 transition-colors duration-300 overflow-y-auto no-scrollbar">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { -ms-overflow-style: none; scrollbar-width: none; }
        body::-webkit-scrollbar { display: none; }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>

      {/* Header Block */}
      <div className="w-full h-[250px] bg-slate-100 dark:bg-slate-800 rounded-b-[3.5rem] relative z-10 shrink-0 flex flex-col justify-between px-6 pt-6 pb-8 overflow-hidden border-b-4 border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative z-20 w-full h-full">
          <div className="absolute top-0 left-0 flex flex-col items-start gap-3 pl-1 pt-1">
            <SkeletonBox className="w-32 h-8 rounded-lg" />
            <div className="flex items-center gap-2 mt-2">
              <SkeletonBox className="w-16 h-6 rounded-full" />
              <SkeletonBox className="w-24 h-6 rounded-full" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 z-20">
            <SkeletonBox className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-sm" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 relative z-20 mt-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl h-24 p-3 flex flex-col items-center justify-center gap-2.5 shadow-sm border border-slate-100 dark:border-slate-700">
              <SkeletonBox className="w-8 h-8 rounded-full" />
              <SkeletonBox className="w-14 h-2 rounded-full" />
              <SkeletonBox className="w-8 h-3 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-grow flex flex-col mt-6 relative z-10">
        {/* Classes Story Bar */}
        <div className="flex gap-4 overflow-x-hidden pb-4 pt-1 px-6 w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[72px] shrink-0">
              <SkeletonBox className="w-16 h-16 rounded-full shadow-sm border-2 border-white dark:border-slate-800" />
              <SkeletonBox className="w-12 h-2 rounded-full mt-1" />
            </div>
          ))}
        </div>

        {/* School Card */}
        <div className="mx-6 mb-8 w-[calc(100%-3rem)] h-36 rounded-2xl bg-white dark:bg-slate-800 p-4 flex flex-col items-center justify-center gap-3 shadow-sm border border-slate-100 dark:border-slate-700">
           <SkeletonBox className="w-12 h-12 rounded-full" />
           <SkeletonBox className="w-24 h-2 rounded-full" />
           <SkeletonBox className="w-40 h-4 rounded-full" />
        </div>

        {/* Tools Grid */}
        <div className="mt-auto w-full bg-white dark:bg-slate-800 rounded-t-[3rem] p-8 pb-32 border-t-4 border-slate-100 dark:border-slate-700 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-8">
            <SkeletonBox className="w-40 h-6 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-slate-50 dark:bg-slate-700/30 h-32 p-4 flex flex-col items-center justify-center gap-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                <SkeletonBox className="w-10 h-10 rounded-full" />
                <SkeletonBox className="w-16 h-2 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full h-20 bg-white dark:bg-slate-900 border-t-2 border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 pb-2 z-[100]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 mt-2">
            <SkeletonBox className="w-8 h-8 rounded-xl" />
            <SkeletonBox className="w-10 h-2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherSkeleton;
