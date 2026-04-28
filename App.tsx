
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.ts';
import { useNotifications } from './hooks/useNotifications.ts';
import Loader from './components/Loader.tsx';
import SplashScreen from './components/SplashScreen.tsx';
import SocialAuthCallback from './components/SocialAuthCallback.tsx';
import PrintAdmissionFormView from './components/PrintAdmissionFormView.tsx';
import OfflineScreen from './components/OfflineScreen.tsx';
import { resolveSchoolBySubdomain, getSchoolBranding } from './services/api.ts';
import { LockKey } from 'phosphor-react';

// Helper for PWA Branding
const updateBranding = async (schoolId: string) => {
  try {
    const branding = await getSchoolBranding(schoolId);
    if (branding && (window as any).updatePWAManifest) {
      (window as any).updatePWAManifest(branding.name, branding.logoURL);
    }
  } catch (err) {
    console.error("EduControl: Failed to update PWA branding:", err);
  }
};

// Lazy load portals for performance
const Login = lazy(() => import('./auth/Login.tsx'));
const TeacherDashboard = lazy(() => import('./teacher/TeacherDashboard.tsx'));
const StudentRoutes = lazy(() => import('./student/StudentRoutes.tsx'));
const MotherAdminApp = lazy(() => import('./mother_admin/MotherAdminApp.tsx'));
const PrincipalApp = lazy(() => import('./principal_admin/PrincipalApp.tsx'));
const SchoolLoginGate = lazy(() => import('./auth/SchoolLoginGate.tsx'));
const Onboarding = lazy(() => import('./components/Onboarding.tsx'));

const TeacherRoutes = () => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center">
      {/* Mobile-centric container for desktop */}
      <div className="w-full max-w-[430px] min-h-screen bg-white dark:bg-slate-900 shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] relative flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto relative h-full scrollbar-none">
          <TeacherDashboard />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { loading, user, profile, error, logout } = useAuth();
  const { token, notification } = useNotifications();

  // --- STARTUP LOGIC ---
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone);
  const [showSplash, setShowSplash] = useState(!isStandalone);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [schoolBranding, setSchoolBranding] = useState<{name: string, logoURL: string, plan?: string} | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // SYSTEM UPDATE: Changed to localStorage for persistent sessions (Auto-Login)
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(() => {
    return localStorage.getItem('active_school_portal_id') || sessionStorage.getItem('active_school_portal_id');
  });

  if (window.location.pathname === '/social-auth-callback') {
    return <SocialAuthCallback />;
  }

  if (window.location.pathname.includes('/print/admission-form')) {
    return <PrintAdmissionFormView />;
  }

  // --- SUBDOMAIN RESOLUTION ---
  useEffect(() => {
    const resolveUrlContext = async () => {
      const hostname = window.location.hostname;
      const searchParams = new URLSearchParams(window.location.search);
      const querySchool = searchParams.get('school');
      
      let resolvedId = null;

      // 1. Check Query Param (Highest priority for testing)
      if (querySchool) {
        resolvedId = await resolveSchoolBySubdomain(querySchool);
      } 
      // 2. Check Subdomain (Real SaaS logic)
      else if (hostname.includes('.')) {
        const parts = hostname.split('.');
        // Simple logic: if more than 2 parts, first part might be subdomain
        // e.g. citypublic.ilmaura.com -> parts: ['citypublic', 'ilmaura', 'com']
        if (parts.length >= 3) {
          const sub = parts[0].toLowerCase();
          // Exclude common ones
          if (!['www', 'ais-dev', 'ais-pre', 'localhost'].includes(sub)) {
            resolvedId = await resolveSchoolBySubdomain(sub);
          }
        }
      }

      if (resolvedId && resolvedId !== activeSchoolId) {
        console.log("EduControl: Resolved school from URL context:", resolvedId);
        localStorage.setItem('active_school_portal_id', resolvedId);
        setActiveSchoolId(resolvedId);
      }
    };

    resolveUrlContext();
  }, []);

  useEffect(() => {
    if (notification) {
      console.log("Notification received in foreground:", notification);
      // Show system notification even when app is open
      if (Notification.permission === 'granted') {
        const title = notification.data?.title || notification.notification?.title || 'New Notification';
        const body = notification.data?.body || notification.notification?.body;
        const customIcon = notification.data?.icon;
        
        const baseUrl = window.location.origin;
        const defaultIcon = `${baseUrl}/favicon-cropped.png`;

        const options = {
          body: body,
          icon: customIcon || defaultIcon,
          badge: defaultIcon // This replaces the small bell in the status bar
          // 'image' is intentionally omitted so it doesn't show as a large banner
        };

        try {
          // Try standard Notification API
          new Notification(title, options);
        } catch (e) {
          // On some mobile browsers (like Android Chrome), we must use the Service Worker to show it
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, options);
          });
        }
      }
    }
  }, [notification]);

  const [localPreferences, setLocalPreferences] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('edu_user_preferences');
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  });

  // Startup Sequence Effect - FIXED TIMER
  useEffect(() => {
    const timer = setTimeout(() => {
        setShowSplash(false);
    }, 3000); // Increased to 3s to let the animation play

    return () => clearTimeout(timer);
  }, []);

  // Reactive Onboarding Check
  // Runs only after Splash is done and loading is finished
  useEffect(() => {
      if (!showSplash && !loading && !user) {
          const hasCompletedOnboarding = localStorage.getItem('ilmaura_onboarding_complete');
          const isDesktop = window.innerWidth >= 768; // md breakpoint in Tailwind
          
          if (!hasCompletedOnboarding && !isDesktop) {
              setShowOnboarding(true);
          } else if (isDesktop && !hasCompletedOnboarding) {
              // Automatically mark as complete for desktop users so it doesn't show on resize
              localStorage.setItem('ilmaura_onboarding_complete', 'true');
          }
      }
  }, [showSplash, loading, user]);

  const handleOnboardingComplete = () => {
      localStorage.setItem('ilmaura_onboarding_complete', 'true');
      setShowOnboarding(false);
  };

  // Synchronize internal state if storage changes (Cross-tab sync only)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only update if the specific key changed
      if (e.key === 'active_school_portal_id') {
        setActiveSchoolId(e.newValue);
      }
      if (e.key === 'edu_user_preferences') {
        try {
          setLocalPreferences(JSON.parse(e.newValue || 'null'));
        } catch (err) {}
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Automatically restore activeSchoolId if logged in
  useEffect(() => {
    if (profile?.schoolId && !activeSchoolId && profile.role !== 'mother-admin') {
      console.log("EduControl: Auto-restoring session context for", profile.role);
      localStorage.setItem('active_school_portal_id', profile.schoolId);
      setActiveSchoolId(profile.schoolId);
    }
  }, [profile, activeSchoolId]);

  // Dark Mode & Language (RTL) Effect
  useEffect(() => {
    const prefs = localPreferences || profile?.preferences;
    if (prefs?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const lang = prefs?.language || 'English';
    if (lang === 'Urdu' || lang === 'Arabic') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', lang === 'Urdu' ? 'ur' : 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    }
  }, [profile?.preferences, localPreferences]);

  const handleClearSchoolId = () => {
    localStorage.removeItem('active_school_portal_id');
    sessionStorage.removeItem('active_school_portal_id');
    setActiveSchoolId(null);
    // Reset to default branding
    if ((window as any).updatePWAManifest) {
      (window as any).updatePWAManifest("Ilmaura", "/ilmaura-mascot.png");
    }
  };

  // PWA Branding Update Effect
  useEffect(() => {
    const syncBranding = async () => {
      if (activeSchoolId) {
        const branding = await getSchoolBranding(activeSchoolId);
        if (branding) {
          setSchoolBranding(branding);
          if ((window as any).updatePWAManifest) {
            (window as any).updatePWAManifest(branding.name, branding.logoURL);
          }
        }
      } else {
        setSchoolBranding(null);
      }
    };
    
    syncBranding();
  }, [activeSchoolId]);

  // Logout wrapper - Modified to keep school ID persistence
  const handleLogout = async () => {
    await logout();
    // Do NOT clear school ID here. This ensures redirection to SchoolLoginGate.
  };

  // --- RENDER FLOW ---

  // 0. Show Offline Screen if No Internet
  if (isOffline) {
    return <OfflineScreen schoolName={schoolBranding?.name} />;
  }

  // 1. Show Splash (Highest Priority)
  if (showSplash) {
      return (
        <SplashScreen 
          schoolLogo={schoolBranding?.logoURL} 
          schoolName={schoolBranding?.name} 
        />
      );
  }

  // 2. Show Onboarding (only if not logged in and not seen before)
  if (showOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // 3. Show Loading if Auth is still checking (after Splash)
  if (loading) {
    return <Loader message={schoolBranding ? `Loading ${schoolBranding.name}...` : "Securely logging you in..."} />;
  }
  
  // 4. Main App Logic
  
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-rose-50 text-rose-700 p-4 text-center">
        <div className="bg-white border-2 border-rose-300 p-8 shadow-2xl rounded-none">
          <h2 className="font-black italic uppercase tracking-tighter text-2xl mb-2">Authentication Error</h2>
          <p className="font-medium text-sm mb-6">{error}</p>
           <button onClick={handleLogout} className="px-6 py-3 bg-rose-600 text-white rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors">
            Logout and Retry
          </button>
        </div>
      </div>
    );
  }

  const isPlanFree = schoolBranding?.plan === 'free';
  const renderTeacherRoutes = () => isPlanFree ? <PlanLockMessage /> : <TeacherRoutes />;
  const renderStudentRoutes = () => isPlanFree ? <PlanLockMessage /> : <StudentRoutes />;
  const renderPrincipalRoutes = () => (isPlanFree && isMobileViewport) ? <PrincipalMobileLockMessage /> : <PrincipalApp profile={profile} onLogout={handleLogout} onClearSchoolId={handleClearSchoolId} />;

  const PrincipalMobileLockMessage = () => (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <LockKey size={32} weight="fill" />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white mb-2">Desktop Only Mode</h2>
          <p className="text-slate-500 font-medium max-w-md mb-6">
              You are currently using the Free Plan. The Principal Mobile App view is locked. <br/><br/>
              <strong>To access your portal, please use a Desktop or Laptop computer, or maximize this window.</strong>
          </p>
          <button onClick={handleLogout} className="px-6 py-3 bg-[#1e3a8a] text-white font-bold text-xs uppercase tracking-widest rounded-none hover:bg-[#172554] transition-colors shadow-md">
              Return to Login
          </button>
      </div>
  );

  const PlanLockMessage = () => (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
              <LockKey size={32} weight="fill" />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white mb-2">Access Locked</h2>
          <p className="text-slate-500 font-medium max-w-md mb-6">
              Your school is currently on the Free Plan. Student and Teacher applications are restricted. Please ask your administration to upgrade to the Premium Plan to unlock student & teacher mobile portals.
          </p>
          <button onClick={handleLogout} className="px-6 py-3 bg-[#1e3a8a] text-white font-bold text-xs uppercase tracking-widest rounded-none hover:bg-[#172554] transition-colors shadow-md">
              Return to Login
          </button>
      </div>
  );

  return (
    <Suspense fallback={<Loader message={schoolBranding ? `Loading ${schoolBranding.name}...` : "Loading Ilmaura..."} />}>
      <Routes>
        {/* Social Auth Callback */}
        <Route path="/social-auth-callback" element={<SocialAuthCallback />} />
        
        {/* Print Admission Form */}
        <Route path="/print/admission-form/*" element={<PrintAdmissionFormView />} />

        {/* Secret Mother Admin Access Route */}
        <Route path="/startup-monitor-system-founder-moiz-229900-03700329790" element={<Login forcedPortal="mother-admin" />} />

        {/* Main Portal Logic */}
        <Route 
          path="/*" 
          element={
            activeSchoolId ? (
              user && profile && profile.role !== 'mother-admin' ? (
                profile.role === 'principal' ? renderPrincipalRoutes() :
                profile.role === 'teacher' ? renderTeacherRoutes() :
                profile.role === 'student' ? renderStudentRoutes() :
                <SchoolLoginGate schoolId={activeSchoolId} onTryAgain={handleClearSchoolId} />
              ) : (
                <SchoolLoginGate schoolId={activeSchoolId} onTryAgain={handleClearSchoolId} />
              )
            ) : (
              !user || !profile ? (
                <Login onPortalChange={setActiveSchoolId} />
              ) : (
                profile.role === 'mother-admin' ? <MotherAdminApp profile={profile} onLogout={handleLogout} /> :
                profile.role === 'principal' ? renderPrincipalRoutes() :
                profile.role === 'teacher' ? renderTeacherRoutes() :
                profile.role === 'student' ? renderStudentRoutes() :
                <div className="h-screen flex items-center justify-center bg-slate-100">
                  <div className="text-center bg-white border-2 border-slate-300 p-12 shadow-2xl rounded-none">
                    <h1 className="text-2xl font-black italic uppercase italic tracking-tighter text-slate-800 mb-2">Role Not Recognized</h1>
                    <p className="text-slate-500 mb-8 font-medium text-sm">Could not determine your institutional permissions. Please contact administration.</p>
                    <button onClick={handleLogout} className="px-8 py-4 bg-slate-900 text-white rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-[#1e3a8a] transition-all">
                      Terminate Session
                    </button>
                  </div>
                </div>
              )
            )
          } 
        />
      </Routes>
    </Suspense>
  );
};

export default App;
