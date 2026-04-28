
import React, { useState, useEffect, useMemo } from 'react';
// Replace Lucide icons with Phosphor Icons for a premium look
import { 
  SquaresFour, Buildings, UsersThree, ChartBar, Gear, ShieldWarning, CurrencyDollar, 
  Scroll, Bell, List, SignOut, CloudCheck, X, ChatCircleText, ArrowsClockwise
} from 'phosphor-react';
import { 
  subscribeToSchools, 
  subscribeToPrincipals, 
  updateSchoolFirestore,
  updateUserFirestore,
  addSchoolFirestore,
  deleteSchoolFirestore,
  deletePrincipalFirestore,
  logAudit,
  getStudentCounts
} from '../services/api.ts';
import Dashboard from './pages/Dashboard.tsx';
import SchoolsList from './pages/SchoolsList.tsx';
import PrincipalsList from './pages/PrincipalsList.tsx';
import RevenueControl from './pages/RevenueControl.tsx';
import AccessControl from './pages/AccessControl.tsx';
import Reports from './pages/Reports.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import AuditLogs from './pages/AuditLogs.tsx';
import RegistrationRequests from './pages/RegistrationRequests.tsx';
import SupportManagement from './pages/SupportManagement.tsx';
import { FirestoreError } from 'firebase/firestore';
import { UserProfile } from '../types.ts';

const MotherAdminApp: React.FC<{ profile: UserProfile, onLogout: () => void }> = ({ profile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [principals, setPrincipals] = useState<any[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [dataError, setDataError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const logAction = async (action: string, details: string, schoolId: string = 'PLATFORM') => {
    await logAudit({
      schoolId,
      userId: profile.uid,
      userName: profile.name,
      userRole: profile.role,
      action,
      details,
      category: 'System',
    });
  };

  // Define navigation items with Phosphor icons for premium SaaS feel
  const NAV_ITEMS = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: <SquaresFour size={20} weight="regular" /> },
    { id: 'requests', label: 'Registration Requests', icon: <Bell size={20} weight="regular" /> },
    { id: 'schools', label: 'Schools', icon: <Buildings size={20} weight="regular" /> },
    { id: 'access', label: 'Access Control', icon: <ShieldWarning size={20} weight="regular" /> },
    { id: 'support', label: 'Support & Helpdesk', icon: <ChatCircleText size={20} weight="regular" /> },
    { id: 'settings', label: 'Settings', icon: <Gear size={20} weight="regular" /> },
  ], []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleError = (error: FirestoreError) => {
      console.error("Mother Admin Sync Error:", error);
      setDataError(error.code === 'permission-denied' 
        ? "Access Denied. Central systems require Mother Admin credentials." 
        : "Network instability detected. Reconnecting...");
    };

    const unsubSchools = subscribeToSchools((data) => {
      setSchools(data);
      getStudentCounts().then(setStudentCounts);
    }, handleError);
    const unsubPrincipals = subscribeToPrincipals((data) => {
      setPrincipals(data);
    }, handleError);

    getStudentCounts().then(setStudentCounts);

    return () => { unsubSchools(); unsubPrincipals(); };
  }, [refreshKey]);

  // Merge student counts into schools data
  const schoolsWithCounts = useMemo(() => {
    return schools.map(school => ({
      ...school,
      actualStudents: studentCounts[school.id] || 0
    }));
  }, [schools, studentCounts]);

  if (dataError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <ShieldWarning size={64} weight="duotone" className="text-rose-500 mb-6" />
        <h2 className="text-3xl font-black text-white mb-2">Central Authorization Error</h2>
        <p className="text-slate-400 max-w-md mb-8">{dataError}</p>
        <button onClick={onLogout} className="px-10 py-4 bg-white dark:bg-[#1e293b] text-slate-950 rounded-2xl font-black shadow-2xl">Re-authenticate</button>
      </div>
    );
  }

  const handleAddSchool = async (data: any) => {
    const newSchool = await addSchoolFirestore(data);
    logAction('Create School', `Created new school: ${data.name} (${newSchool.schoolCode})`, newSchool.id);
    return newSchool;
  };

  const handleDeleteSchool = async (id: string) => {
    const school = schools.find(s => s.id === id);
    await deleteSchoolFirestore(id);
    logAction('Delete School', `Deleted school: ${school?.name || id}`, id);
  };

  const handleUpdateSchool = async (id: string, data: any) => {
    await updateSchoolFirestore(id, data);
    logAction('Update School', `Updated school settings for ${id}`, id);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard schools={schoolsWithCounts} principals={principals} />;
      case 'requests': return <RegistrationRequests refreshKey={refreshKey} />;
      case 'schools': return <SchoolsList schools={schoolsWithCounts} onAddSchool={handleAddSchool} onDeleteSchool={handleDeleteSchool} onUpdateSchool={handleUpdateSchool} />;
      case 'access': return <AccessControl schools={schoolsWithCounts} onUpdateStatus={async (id, status, isAccessLocked) => {
        await updateSchoolFirestore(id, { status, isAccessLocked });
        logAction('Access Control', `Updated access status for school ${id}: ${status}, Locked: ${isAccessLocked}`, id);
      }} />;
      case 'support': return <SupportManagement />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard schools={schoolsWithCounts} principals={principals} />;
    }
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden relative font-sans text-slate-900 dark:text-white">
      {isSidebarOpen && window.innerWidth < 1280 && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200] animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Minimal Software Sidebar - Matching Principal Portal */}
      <aside className={`fixed xl:static inset-y-0 left-0 z-[210] flex flex-col bg-[#0f172a] border-r border-slate-800 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-[260px] translate-x-0 shadow-2xl xl:shadow-none' : 'w-0 -translate-x-full xl:w-[72px] xl:translate-x-0'}`}>
        <div className="h-16 flex items-center px-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.svg" 
              alt="Ilmaura Logo" 
              className="h-10 w-auto object-contain"
              loading="eager"
            />
            {(isSidebarOpen || window.innerWidth < 1280) && (
               <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Mother Admin</p>
               </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className={`px-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 mb-4 ${(!isSidebarOpen && window.innerWidth >= 1280) ? 'hidden' : 'block'}`}>Infrastructure</p>
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id} 
              onClick={() => handleNavClick(item.id)} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-none transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className={`shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-300'}`}>{item.icon}</div>
              {(isSidebarOpen || window.innerWidth < 1280) && <span className="text-sm font-semibold truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
           <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-none text-slate-400 hover:bg-[#1e3a8a]/30 hover:text-[#D4AF37] transition-all group">
               <SignOut size={20} weight="regular" className="shrink-0" /> 
               {(isSidebarOpen || window.innerWidth < 1280) && <span className="text-sm font-semibold">Logout</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#fcfcfc]">
        <header className="h-16 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-[#1e293b] flex items-center justify-between px-6 shrink-0 sticky top-0 z-[100]">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 rounded-none transition-colors flex items-center justify-center">
                <List size={20} weight="regular" />
             </button>
             <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize hidden sm:block">
                  {activeTab.replace(/_/g, ' ')}
                </h2>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-none border border-emerald-100">
               <CloudCheck size={16} weight="duotone" />
               <span className="text-[9px] font-black uppercase tracking-widest leading-none">Cloud Live</span>
            </div>
            
            <button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-none transition-colors"
              title="Reload Data"
            >
                <ArrowsClockwise size={20} weight="regular" />
            </button>

            <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-none relative transition-colors">
                <Bell size={20} weight="regular" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full border-2 border-white"></span>
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block"></div>

            <button 
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-none transition-all border-2 hover:bg-slate-50 border-transparent hover:border-slate-200 text-slate-700 dark:text-slate-200"
            >
                <div className="w-7 h-7 flex items-center justify-center font-bold text-xs overflow-hidden border-2 bg-slate-200 text-slate-600 dark:text-slate-300 border-slate-300">
                    <span>{profile.name[0]}</span>
                </div>
                <div className="hidden md:block text-left mr-1">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none text-slate-700 dark:text-slate-200">
                      {profile.name.split(' ')[0]}
                    </p>
                </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto">
                <div key={activeTab} className="animate-in fade-in-50 duration-200">
                  {renderContent()}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default MotherAdminApp;
