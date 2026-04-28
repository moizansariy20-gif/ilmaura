
import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Bell, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
}

interface LayoutProps {
  navItems: NavItem[];
  profile: any;
  school: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ navItems, profile, school, activeTab, setActiveTab, children }) => {
  const { logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!profile || !school) return null;

  const isTestMode = !!sessionStorage.getItem('testing_school_id');

  const handleNavItemClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else {
      setActiveTab(item.id);
      if (window.innerWidth < 1024) setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative" style={{'--brand-color': school.themeColor || '#4f46e5'} as any}>
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[140] lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-[150] flex flex-col bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white border-r border-slate-100 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80 translate-x-0 shadow-2xl lg:shadow-none' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex flex-col items-center justify-center border-b border-slate-100 dark:border-[#334155] min-h-[180px] shrink-0 bg-white dark:bg-[#1e293b] space-y-4">
          <div className="w-28 h-28 rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-2xl overflow-hidden bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-[#334155] p-3">
              {school.logoURL ? (
                <img src={school.logoURL} className="w-full h-full object-contain rounded-full" alt="Logo" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white rounded-full" style={{ backgroundColor: school.themeColor }}>
                  {school.name[0]}
                </div>
              )}
          </div>
          {(isSidebarOpen || window.innerWidth < 1024) && (
            <div className="text-center w-full px-4">
              <span className="font-black text-base tracking-tight truncate block leading-none text-slate-900 dark:text-white">{school.name}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 block">Platform Node</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-50 dark:bg-[#0f172a] rounded-xl transition-all"><X size={20}/></button>
        </div>
        
        <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Personal Hub</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-sm font-bold ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' 
                  : item.id === 'logout'
                    ? 'text-rose-500 hover:bg-rose-50'
                    : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              {(isSidebarOpen || window.innerWidth < 1024) && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-2xl border-b border-slate-100 dark:border-[#334155] flex items-center justify-between px-4 md:px-8 shrink-0 print:hidden sticky top-0 z-[100]">
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-slate-50 dark:bg-[#0f172a] hover:bg-slate-100 rounded-xl text-slate-600 dark:text-slate-300 transition-colors">
                <Menu size={22} />
            </button>
            <h2 className="text-sm md:text-xl font-black capitalize truncate text-slate-900 dark:text-white tracking-tight leading-none">{activeTab.replace(/_/g, ' ')}</h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6 shrink-0">
            {isTestMode && (
              <button onClick={() => logout()} className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:text-slate-100 bg-white dark:bg-[#1e293b] px-4 py-3 rounded-xl shadow-sm border border-slate-200 dark:border-[#1e293b]">
                <ArrowLeft size={14} /> Back to Admin
              </button>
            )}
            <button className="p-3 text-slate-400 hover:bg-slate-50 dark:bg-[#0f172a] rounded-xl transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 p-1 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-[#1e293b] flex items-center justify-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 shadow-xl border border-slate-100 dark:border-[#334155] overflow-hidden p-1">
                {school.logoURL ? (
                  <img src={school.logoURL} className="w-full h-full object-contain rounded-full" alt="Avatar" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-full font-black text-indigo-600">
                    {profile.name[0]}
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left leading-none">
                <p className="text-xs font-black text-slate-900 dark:text-white">{profile.name.split(' ')[0]}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{profile.role}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
