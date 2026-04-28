import React from 'react';

const Loader: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#1e293b] gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-slate-200 dark:border-[#1e293b] rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <span className="font-bold text-xs text-slate-500 dark:text-slate-400 animate-pulse">{message}</span>
    </div>
  );
};

export default Loader;
