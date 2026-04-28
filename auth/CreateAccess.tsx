
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, User, IdentificationCard, Envelope, Lock, CheckCircle, Spinner, WarningCircle, ChalkboardTeacher, Student, ShieldCheck } from 'phosphor-react';
import { verifyLoginId, completeUserAccess, signInWithGoogle } from '../services/api.ts';

interface CreateAccessProps {
  schoolId: string;
  onBack: () => void;
  onSuccess: () => void;
}

const SpotlightButton: React.FC<{
  children: React.ReactNode;
  onClick?: (e: any) => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  className?: string;
  overlayClassName?: string;
}> = ({ children, onClick, disabled, loading, type = "button", className, overlayClassName }) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
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
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <button
      ref={containerRef}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => isDesktop && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`w-full font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg mt-2 relative overflow-hidden group ${className || 'bg-[#007bff] hover:bg-blue-700 text-white shadow-blue-500/30'}`}
    >
      {/* Base Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading ? <Spinner size={20} className="animate-spin" weight="bold" /> : children}
      </div>

      {/* Reveal Overlay */}
      {isDesktop && (
        <motion.div 
          initial={false}
          animate={{ 
            opacity: isHovering ? 1 : 0,
            clipPath: `circle(${isHovering ? 60 : 0}px at ${mousePos.x}px ${mousePos.y}px)`
          }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 25,
            opacity: { duration: 0.2 }
          }}
          className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden ${overlayClassName || 'bg-white text-[#007bff]'}`}
        >
          <div className="flex items-center justify-center gap-2 font-bold">
            {loading ? <Spinner size={20} className="animate-spin" weight="bold" /> : children}
          </div>
        </motion.div>
      )}
    </button>
  );
};

const CreateAccess: React.FC<CreateAccessProps> = ({ schoolId, onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'teacher' | 'student' | 'principal' | 'staff'>('student');
  const [loginId, setLoginId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState<any>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleVerifyId = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Principal verification might need a different logic, but for now we follow the same pattern
      const details = await verifyLoginId(schoolId, role as any, loginId);
      if (details) {
        if (details.uid) {
          setError("Access has already been created for this ID. Please login.");
        } else {
          // If we are in the Admin tab and it detected a staff member, update the role
          if (role === 'principal' && (details as any).detectedRole === 'staff') {
             setRole('staff');
          }
          setUserDetails(details);
          setStep(2);
        }
      } else {
        setError(`Invalid ${role === 'teacher' ? 'Faculty' : role === 'principal' ? 'Admin/Staff' : 'Student'} ID for this school.`);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await completeUserAccess(schoolId, role as any, loginId, email, password);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to create access");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Save pending access info to localStorage
      localStorage.setItem('pending_access_info', JSON.stringify({
        schoolId,
        role,
        loginId: userDetails?.login_id || loginId,
        name: userDetails?.name
      }));
      
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google login");
    }
  };

  if (step === 3) {
    return (
      <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
          <CheckCircle size={40} weight="fill" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Access Created!</h2>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto">Your account is now active. You can now login with your email and password.</p>
        <SpotlightButton onClick={onSuccess}>
          Go to Login
        </SpotlightButton>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center md:text-left mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Create <span className="text-[#007bff] font-['Pacifico',_cursive] tracking-wider drop-shadow-sm text-4xl md:text-5xl ml-1">Access</span> 🚀
        </h1>
        <p className="text-slate-500 text-sm md:text-base leading-relaxed">
          Enter your system ID to set up your login credentials.
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleVerifyId} className="space-y-6">
          {/* Role Selection Tabs */}
          <div className="mb-6">
              <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button 
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${role === 'student' ? 'bg-white shadow-sm text-[#007bff]' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      <Student size={18} weight={role === 'student' ? 'fill' : 'regular'} /> Student
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${role === 'teacher' ? 'bg-white shadow-sm text-[#007bff]' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      <ChalkboardTeacher size={18} weight={role === 'teacher' ? 'fill' : 'regular'} /> Faculty
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('principal')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${role === 'principal' ? 'bg-white shadow-sm text-[#007bff]' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                      <ShieldCheck size={18} weight={role === 'principal' ? 'fill' : 'regular'} /> Admin / Staff
                  </button>
              </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              {role === 'teacher' ? 'Teacher ID' : role === 'principal' ? 'Admin / Staff ID' : 'Student ID'}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <IdentificationCard size={20} />
              </div>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                placeholder={`Enter your ${role === 'teacher' ? 'Teacher' : role === 'principal' ? 'Admin / Staff' : 'Student'} ID`}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007bff]/20 focus:border-[#007bff] transition-all text-slate-700 font-bold uppercase tracking-widest"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-600 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <WarningCircle size={18} weight="fill" />
              {error}
            </div>
          )}

          <SpotlightButton
            type="submit"
            disabled={loading || !loginId}
            loading={loading}
          >
            Verify Identity
          </SpotlightButton>
        </form>
      ) : (
        <form onSubmit={handleCompleteAccess} className="space-y-5">
          {/* User Preview */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
              {userDetails.photo_url ? (
                <img src={userDetails.photo_url} className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-slate-300" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity Confirmed</p>
              <p className="font-black text-slate-900 uppercase tracking-tight">{userDetails.name}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Envelope size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007bff]/20 focus:border-[#007bff] transition-all text-slate-700 font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">New Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007bff]/20 focus:border-[#007bff] transition-all text-slate-700 font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Confirm Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007bff]/20 focus:border-[#007bff] transition-all text-slate-700 font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-600 flex items-center gap-2">
              <WarningCircle size={18} weight="fill" />
              {error}
            </div>
          )}

          <SpotlightButton
            type="submit"
            disabled={loading}
            loading={loading}
          >
            Create My Access
          </SpotlightButton>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative px-4 bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest">Or</span>
          </div>

          <SpotlightButton
            type="button"
            onClick={handleGoogleLogin}
            className="bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
            overlayClassName="bg-slate-900 text-white"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </SpotlightButton>
        </form>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-[#007bff] font-medium transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>
      </div>
    </div>
  );
};

export default CreateAccess;
