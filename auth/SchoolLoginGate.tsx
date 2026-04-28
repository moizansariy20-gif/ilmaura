
import React, { useState, useEffect, useRef } from 'react';
import { getSchoolBranding } from '../services/api.ts';
import Loader from '../components/Loader.tsx';
import { Buildings, ArrowLeft, Eye, EyeSlash, ChalkboardTeacher, ShieldCheck, Student, Spinner, WarningCircle, UserPlus, DeviceMobile } from 'phosphor-react';
import { useAuth } from '../hooks/useAuth.ts';
import CustomCursor from '../src/components/CustomCursor.tsx';
import TextSpotlight from '../src/components/TextSpotlight.tsx';
import CreateAccess from './CreateAccess.tsx';

const SpotlightButton: React.FC<{
  children: React.ReactNode;
  onClick?: (e: any) => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}> = ({ children, onClick, disabled, loading, type = "button" }) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      containerRef.current.style.setProperty('--x', `${x}px`);
      containerRef.current.style.setProperty('--y', `${y}px`);
    }
  };

  return (
    <button
      ref={containerRef}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseMove={handleMouseMove}
      onMouseEnter={(e) => isDesktop && e.currentTarget.style.setProperty('--opacity', '1')}
      onMouseLeave={(e) => e.currentTarget.style.setProperty('--opacity', '0')}
      className="w-full bg-[#007bff] hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 mt-2 relative overflow-hidden group"
    >
      {/* Base Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading ? <Spinner size={20} className="animate-spin" weight="bold" /> : children}
      </div>

      {/* Reveal Overlay */}
      {isDesktop && (
        <div 
          className="absolute inset-0 bg-white text-[#007bff] flex items-center justify-center z-20 pointer-events-none transition-opacity duration-200"
          style={{ 
            opacity: 'var(--opacity, 0)',
            clipPath: 'circle(60px at var(--x, 50%) var(--y, 50%))'
          }}
        >
          <div className="flex items-center justify-center gap-2 font-bold">
            {loading ? <Spinner size={20} className="animate-spin" weight="bold" /> : children}
          </div>
        </div>
      )}
    </button>
  );
};

interface SchoolLoginGateProps {
  schoolId: string;
  onTryAgain: () => void;
}

type LoginRole = 'student' | 'teacher' | 'principal';

const ShimmerBlock = ({ className }: { className: string }) => (
  <div className={`relative overflow-hidden bg-slate-200 ${className}`}>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_1.5s_infinite]"></div>
  </div>
);

const SchoolLoginGate: React.FC<SchoolLoginGateProps> = ({ schoolId, onTryAgain }) => {
  const { login, loading: authLoading, error: authError } = useAuth();
  
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [typewriter, setTypewriter] = useState({ h1: '', h2: '', p: '', showCursor: true });
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handlePrompt = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handlePrompt);
    if ((window as any).deferredPrompt) setCanInstall(true);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstall = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    (window as any).deferredPrompt = null;
    setCanInstall(false);
  };
  
  // Login Form State
  const [selectedRole, setSelectedRole] = useState<LoginRole>('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [view, setView] = useState<'login' | 'create-access'>('login');

  useEffect(() => {
    const fullH1 = "Smart Institution, ";
    const fullH2 = "Smarter Management";
    const fullP = "Manage everything in one place with a fast, secure, and fully connected school system.";
    
    let h1 = '';
    let h2 = '';
    let p = '';
    let i = 0;
    let j = 0;
    let k = 0;

    const interval = setInterval(() => {
      if (i < fullH1.length) {
        h1 += fullH1[i];
        i++;
      } else if (j < fullH2.length) {
        h2 += fullH2[j];
        j++;
      } else if (k < fullP.length) {
        p += fullP[k];
        k++;
      } else {
        clearInterval(interval);
      }
      setTypewriter({ h1, h2, p, showCursor: k < fullP.length });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchBranding = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const schoolData = await getSchoolBranding(schoolId);
        if (schoolData) {
          setSchool(schoolData);
        } else {
          setFetchError(`The school portal with ID '${schoolId}' could not be found.`);
        }
      } catch (err) {
        setFetchError("Failed to load school information.");
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, [schoolId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError("Please enter both email and password.");
      return;
    }

    let loginEmail = email.trim();

    // Teacher ID Logic: If role is Teacher and input is not an email, try constructing the ID email
    if (selectedRole === 'teacher' && !loginEmail.includes('@')) {
        // Assume it's a Teacher ID (e.g. T-101)
        loginEmail = `${loginEmail.toLowerCase()}.${schoolId}@ilmaura.com`;
    }

    await login(loginEmail, password);
  };

  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-4 lg:p-8 font-sans">
        <div className="w-full max-w-[1300px] relative z-10 h-screen md:h-auto">
          <div className="bg-white md:border border-[#1e3a8a]/20 p-0 rounded-none md:rounded-xl md:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)] relative overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[650px] lg:min-h-[750px]">
            
            {/* Left Side Skeleton */}
            <div className="hidden md:flex md:w-[55%] lg:w-[60%] relative flex-col items-center justify-center bg-white border-r border-slate-100 p-8 lg:p-12">
              <div className="text-center max-w-lg mb-6 lg:mb-10 z-20 mt-4 min-h-[120px] w-full flex flex-col items-center justify-center">
                <ShimmerBlock className="h-10 rounded-lg w-3/4 mb-4" />
                <ShimmerBlock className="h-10 rounded-lg w-1/2 mb-6" />
                <ShimmerBlock className="h-4 rounded w-full mb-2" />
                <ShimmerBlock className="h-4 rounded w-5/6" />
              </div>
              <div className="w-full flex-1 relative flex items-center justify-center z-10 min-h-0">
                <ShimmerBlock className="w-full h-full rounded-3xl" />
              </div>
            </div>

            {/* Right Side Skeleton */}
            <div className="w-full md:w-[45%] lg:w-[40%] p-8 sm:p-12 md:p-10 lg:p-16 flex flex-col justify-center relative bg-white min-h-screen md:min-h-0">
              
              {/* Top Icon Skeleton */}
              <div className="flex justify-center md:justify-start mb-8 -mt-6">
                <ShimmerBlock className="w-32 h-32 md:w-36 md:h-36 rounded-3xl" />
              </div>

              {/* Heading Skeleton */}
              <div className="mb-8 flex flex-col items-center md:items-start">
                <ShimmerBlock className="h-10 rounded-lg w-2/3 mb-4" />
                <ShimmerBlock className="h-4 rounded w-full mb-2" />
                <ShimmerBlock className="h-4 rounded w-4/5" />
              </div>

              {/* Role Tabs Skeleton */}
              <div className="mb-6">
                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-2">
                  <ShimmerBlock className="flex-1 py-5 rounded-lg" />
                  <ShimmerBlock className="flex-1 py-5 rounded-lg" />
                  <ShimmerBlock className="flex-1 py-5 rounded-lg" />
                </div>
              </div>

              {/* Form Skeleton */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <ShimmerBlock className="h-4 rounded w-1/4" />
                  <ShimmerBlock className="h-14 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <ShimmerBlock className="h-4 rounded w-1/4" />
                  <ShimmerBlock className="h-14 w-full rounded-xl" />
                </div>
                <ShimmerBlock className="h-14 w-full rounded-xl mt-2" />
              </div>

              {/* Bottom Links Skeleton */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <ShimmerBlock className="h-4 rounded w-1/3" />
                <ShimmerBlock className="h-4 rounded w-1/4" />
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (fetchError) {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-rose-50 text-rose-800 p-4 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
                <Buildings size={32} weight="duotone" />
            </div>
            <h2 className="font-black text-2xl">Portal Error</h2>
            <p className="text-rose-600 mt-2 max-w-sm">{fetchError}</p>
            <button onClick={onTryAgain} className="mt-6 px-5 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold">
                Try a different School ID
            </button>
        </div>
    );
  }

  const themeColor = school.themeColor || '#2563eb';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-4 lg:p-8 font-sans md:cursor-none">
      <CustomCursor color="#000000" />
      <div className="w-full max-w-[1300px] relative z-10 h-screen md:h-auto">
        
        {/* Main Split Card */}
        <div className="bg-white md:border border-[#1e3a8a]/20 p-0 rounded-none md:rounded-xl md:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)] relative overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[650px] lg:min-h-[750px]">
          
          {/* Left Side - Art/Assets (Wider) - Full Image */}
          <div className="hidden md:flex md:w-[55%] lg:w-[60%] relative flex-col items-center justify-center bg-white border-r border-slate-100 p-8 lg:p-12">
            
            {/* Left Side Text */}
            <div className="mb-6 lg:mb-10 z-20 mt-4 min-h-[120px] w-full">
              <TextSpotlight 
                h1={typewriter.h1}
                h2={typewriter.h2}
                p={typewriter.p}
                showCursor={typewriter.showCursor}
              />
            </div>

            {/* Image Container */}
            <div className="w-full flex-1 relative flex items-center justify-center z-10 min-h-0">
              <img 
                  src="/left-image.svg" 
                  alt="School Gateway" 
                  className="w-full h-full object-contain object-center"
                  loading="eager"
              />
            </div>
          </div>

          {/* Right Side - Input (Narrower) */}
          <div className="w-full md:w-[45%] lg:w-[40%] p-8 sm:p-12 md:p-10 lg:p-16 flex flex-col justify-center relative bg-white min-h-screen md:min-h-0">
            
            {/* Top Icon - School Logo */}
            <div className="flex justify-center md:justify-start mb-8 -mt-6">
                {school?.logoURL ? (
                    <img 
                        src={school.logoURL} 
                        alt={`${school.name} Logo`} 
                        className="w-32 h-32 md:w-36 md:h-36 object-contain mix-blend-multiply"
                        loading="eager"
                    />
                ) : (
                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl flex items-center justify-center text-5xl font-black text-white shadow-xl" style={{ backgroundColor: themeColor }}>
                        {school?.name?.[0] || 'S'}
                    </div>
                )}
            </div>

            {view === 'login' ? (
              <>
                <div className="text-center md:text-left mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    Who are <span className="text-[#007bff] font-['Pacifico',_cursive] tracking-wider drop-shadow-sm text-4xl md:text-5xl ml-1">You?</span> 🧐
                  </h1>
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                      Please enter your credentials to access your dashboard.
                  </p>
                </div>

                {/* Role Selection Tabs */}
                <div className="mb-6">
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <button 
                          onClick={() => setSelectedRole('student')}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${selectedRole === 'student' ? 'bg-white shadow-sm text-[#007bff]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Student size={18} weight={selectedRole === 'student' ? 'fill' : 'regular'} /> Student
                        </button>
                        <button 
                          onClick={() => setSelectedRole('teacher')}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${selectedRole === 'teacher' ? 'bg-white shadow-sm text-[#007bff]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ChalkboardTeacher size={18} weight={selectedRole === 'teacher' ? 'fill' : 'regular'} /> Faculty
                        </button>
                        <button 
                          onClick={() => setSelectedRole('principal')}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${selectedRole === 'principal' ? 'bg-white shadow-sm text-[#007bff]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ShieldCheck size={18} weight={selectedRole === 'principal' ? 'fill' : 'regular'} /> Admin
                        </button>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">
                      {selectedRole === 'teacher' ? "Email or Teacher ID" : 
                       selectedRole === 'principal' ? "Email or Admin ID" : 
                       selectedRole === 'student' ? "Email or Student ID" : "Email Address"}
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'teacher' ? "Enter your email or Teacher ID" : 
                                   selectedRole === 'principal' ? "Enter your email or Admin ID" :
                                   selectedRole === 'student' ? "Enter your email or Student ID" : "Enter your email"}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007bff]/20 focus:border-[#007bff] transition-all text-slate-700 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007bff]/20 focus:border-[#007bff] transition-all text-slate-700 font-medium pr-12"
                        required
                      />
                      <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#007bff] transition-colors"
                      >
                          {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {(formError || authError) && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-600 flex items-center gap-2">
                          <WarningCircle size={18} weight="fill" />
                          {formError || authError}
                      </div>
                  )}

                  <SpotlightButton
                    type="submit"
                    disabled={authLoading}
                    loading={authLoading}
                  >
                    Sign In
                  </SpotlightButton>
                </form>

                {/* Bottom Links */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                  <button 
                    onClick={onTryAgain}
                    className="text-slate-500 hover:text-[#007bff] font-medium transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft size={16} /> Not your school?
                  </button>
                  <button className="text-[#007bff] hover:text-blue-700 font-semibold transition-colors">
                    Forgot Password?
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-slate-500 text-sm">
                    Don't have a password yet?{' '}
                    <button 
                      onClick={() => setView('create-access')}
                      className="text-[#007bff] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <UserPlus size={16} /> Create Your Access
                    </button>
                  </p>
                </div>

                {canInstall && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={handleInstall}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200"
                    >
                      <DeviceMobile size={18} weight="duotone" className="text-[#007bff]" />
                      Install {school?.name || 'School'} App
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2 px-4">
                      Install for a faster, app-like experience on your home screen.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <CreateAccess 
                schoolId={schoolId} 
                onBack={() => setView('login')} 
                onSuccess={() => setView('login')} 
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolLoginGate;
