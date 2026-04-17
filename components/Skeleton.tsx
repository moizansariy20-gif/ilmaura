import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "", variant = 'rect' }) => {
  const baseClass = "animate-pulse bg-slate-200";
  const variantClass = 
    variant === 'circle' ? "rounded-full" : 
    variant === 'text' ? "rounded h-4 w-full" : 
    "rounded-none";

  return <div className={`${baseClass} ${variantClass} ${className}`} />;
};

export const DashboardSkeleton = () => {
  return (
    <div className="p-8 space-y-8 bg-slate-100 min-h-screen">
      {/* Header Skeleton */}
      <div className="h-24 bg-slate-300 border-b-4 border-slate-400 mb-8" />

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 border-2 border-slate-200 dark:border-slate-700 h-36 flex flex-col justify-between">
            <Skeleton className="w-24 h-3" />
            <Skeleton className="w-16 h-10" />
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 h-[380px] p-6">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 h-[380px] p-6 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-full h-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
