import React from 'react';
import { Sparkles, CalendarCheck } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon }) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#6B1D2F] via-[#4A1421] to-[#2D0D14] p-8 rounded-[2.5rem] border border-[#4A1421] shadow-[0_20px_50px_rgba(107,29,47,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-slate-800/10 border border-white/10 backdrop-blur-md mb-2">
              <Sparkles size={14} className="text-[#D4AF37]" />
              <span className="text-[10px] font-black text-[#FCFBF8] uppercase tracking-widest">Faculty Hub</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white font-heading tracking-tight leading-none drop-shadow-lg">
              {title}
            </h1>
            <p className="text-[#FCFBF8]/70 font-medium text-sm md:text-base max-w-md">
              {subtitle}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">{today}</p>
              <p className="text-xl font-bold text-white drop-shadow-md">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 dark:bg-slate-800/10 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center shadow-2xl shadow-black/20 group-hover:scale-105 transition-transform duration-500">
              {icon || <CalendarCheck size={32} className="text-[#D4AF37] drop-shadow-md" />}
            </div>
          </div>
        </div>
      </div>
  );
};

export default PageHeader;
