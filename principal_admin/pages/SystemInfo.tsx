import React from 'react';
import { 
  Info, CheckCircle, Database, HardDrives, 
  Clock, ShieldCheck, FileText, RocketLaunch
} from 'phosphor-react';

const SystemInfo = () => {
  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
                  <Info size={32} weight="fill" />
                  System Information
                </h1>
                <p className="text-sm font-bold text-blue-200 uppercase tracking-wider mt-1">
                  About EduControl ERP & System Health
                </p>
            </div>
        </div>

        <div className="p-8 space-y-8 bg-white dark:bg-slate-800 max-w-5xl mx-auto w-full">
          
          {/* LOGO & VERSION */}
          <div className="flex flex-col items-center text-center py-8 border-b-2 border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 bg-[#1e3a8a] text-white flex items-center justify-center rounded-2xl mb-6 shadow-lg transform rotate-3">
              <RocketLaunch size={48} weight="fill" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">EduControl ERP</h2>
            <div className="flex items-center gap-3 justify-center">
              <span className="px-3 py-1 bg-slate-100 border-2 border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Version 1.0.5
              </span>
              <span className="px-3 py-1 bg-emerald-100 border-2 border-emerald-200 text-xs font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1">
                <CheckCircle size={14} weight="fill" /> Stable Build
              </span>
            </div>
          </div>

          {/* OVERVIEW */}
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              EduControl is a next-generation School Management System designed to streamline administrative tasks, enhance communication, and empower educational institutions. Developed with cutting-edge technology to ensure security, speed, and reliability.
            </p>
          </div>

          {/* SYSTEM HEALTH DASHBOARD */}
          <div className="mt-12">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <HardDrives size={20} weight="fill" className="text-[#1e3a8a]" />
              System Health Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-2 border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-none border-2 border-emerald-200">
                  <Database size={24} weight="fill" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Database</p>
                  <p className="font-bold text-sm text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                  </p>
                </div>
              </div>
              
              <div className="border-2 border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-none border-2 border-emerald-200">
                  <HardDrives size={24} weight="fill" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cloud Server</p>
                  <p className="font-bold text-sm text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online (99.9% Uptime)
                  </p>
                </div>
              </div>

              <div className="border-2 border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded-none border-2 border-blue-200">
                  <Clock size={24} weight="fill" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Last Backup</p>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Today, 02:00 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* LEGAL & LINKS */}
          <div className="mt-12 pt-8 border-t-2 border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck size={20} weight="fill" className="text-[#1e3a8a]" />
              Legal & Resources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] hover:bg-slate-50 dark:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-slate-400 group-hover:text-[#1e3a8a]" />
                  <span className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Terms of Service</span>
                </div>
              </button>
              <button className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] hover:bg-slate-50 dark:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-slate-400 group-hover:text-[#1e3a8a]" />
                  <span className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Privacy Policy</span>
                </div>
              </button>
              <button className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] hover:bg-slate-50 dark:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <RocketLaunch size={20} className="text-slate-400 group-hover:text-[#1e3a8a]" />
                  <span className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Release Notes</span>
                </div>
              </button>
            </div>
          </div>

          <div className="text-center pt-12 pb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              © {new Date().getFullYear()} EduControl Technologies. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SystemInfo;
