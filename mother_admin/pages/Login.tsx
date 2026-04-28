import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, User, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.ts';
import CustomCursor from '../../src/components/CustomCursor.tsx';
import TextSpotlight from '../../src/components/TextSpotlight.tsx';

interface LoginProps {
  onSwitchPortal: () => void;
}

const ButtonWithSpotlight: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  overlayClassName?: string;
  type?: "button" | "submit";
}> = ({ onClick, disabled, className, children, overlayClassName, type = "button" }) => {
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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => isDesktop && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
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
          className={`absolute inset-0 z-20 pointer-events-none overflow-hidden flex items-center justify-center ${overlayClassName}`}
        >
          <div className="flex items-center justify-center gap-2 font-bold">
            {children}
          </div>
        </motion.div>
      )}
    </button>
  );
};

const MotherAdminLogin: React.FC<LoginProps> = ({ onSwitchPortal }) => {
  const { login, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaStep, setMfaStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [typewriter, setTypewriter] = useState({ h1: '', h2: '', p: '', showCursor: true });

  useEffect(() => {
    const fullH1 = "Main Control, ";
    const fullH2 = "Full Security";
    const fullP = "Access the main management system of Ilmaura. Monitor and manage the whole network from this one place.";
    
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

  const sendEmailCode = async (targetEmail: string, code: string) => {
    setIsSendingCode(true);
    try {
      const response = await fetch("/api/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, code })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to send email");
      
      return true;
    } catch (err) {
      console.error("Failed to send code:", err);
      return false;
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError('');
    
    // Step 1: Verify Password via Supabase
    const success = await login(email, password);
    
    if (success) {
      // Step 2: Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      
      // Step 3: Send Code to Email
      const sent = await sendEmailCode(email, code);
      if (sent) {
        setMfaStep(true);
      } else {
        setMfaError("Failed to send verification code. Please try again.");
      }
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode === generatedCode) {
      // Success! Force a clean reload using location.replace
      // to establish the fresh authenticated session in the current context.
      window.location.replace(window.location.pathname);
    } else {
      setMfaError("Invalid verification code. Please check your email.");
    }
  };

  const loading = authLoading || isSendingCode;
  const error = authError || mfaError;

  return (
    <div className="min-h-screen relative flex items-center justify-center md:p-6 overflow-hidden bg-white md:bg-slate-50 md:cursor-none">
      <CustomCursor color="#000000" />
      
      <div className="w-full max-w-[1300px] relative z-10 h-screen md:h-auto">
        <div className="bg-white md:border border-[#1e3a8a]/20 p-0 rounded-none md:rounded-xl md:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)] relative overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[650px] lg:min-h-[750px]">
          
          {/* Left Side - Art/Assets */}
          <div className="hidden md:flex md:w-[55%] lg:w-[60%] relative flex-col items-center justify-center bg-white border-r border-slate-100 p-8 lg:p-12">
            <div className="mb-6 lg:mb-10 z-20 mt-4 min-h-[120px] w-full">
              <TextSpotlight 
                h1={typewriter.h1}
                h2={typewriter.h2}
                p={typewriter.p}
                showCursor={typewriter.showCursor}
              />
            </div>

            <div className="w-full flex-1 relative flex items-center justify-center z-10 min-h-0">
              <img 
                  src="/left-image.svg" 
                  alt="Mother Admin Gateway" 
                  className="w-full h-full object-contain object-center"
                  loading="eager"
              />
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full md:w-[45%] lg:w-[40%] p-8 sm:p-12 md:p-10 lg:p-16 flex flex-col justify-center relative bg-white min-h-screen md:min-h-0">
            <div className="flex justify-center md:justify-start mb-8 -mt-6">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30">
                  <ShieldCheck size={40}/>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              {!mfaStep ? (
                <>
                  <div className="text-center md:text-left mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                      System <span className="text-[#007bff] font-['Pacifico',_cursive] tracking-wider drop-shadow-sm text-4xl md:text-5xl ml-1">Admin</span> 🛡️
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                        Please login to manage the whole system.
                    </p>
                  </div>

                  <form onSubmit={handleInitialSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block">Admin Email</label>
                      <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User size={20} className="text-slate-400 group-focus-within:text-[#007bff] transition-colors" />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg py-4 pl-12 pr-4 outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] transition-all text-base placeholder:text-slate-400 shadow-sm"
                            placeholder="admin@ilmaura.com"
                            required
                          />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block">Password</label>
                      <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock size={20} className="text-slate-400 group-focus-within:text-[#007bff] transition-colors" />
                          </div>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg py-4 pl-12 pr-4 outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] transition-all text-base placeholder:text-slate-400 shadow-sm"
                            placeholder="••••••••"
                            required
                          />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <ButtonWithSpotlight
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#007bff] text-white font-bold py-4 rounded-xl transition-all hover:bg-[#0056b3] shadow-lg shadow-blue-500/30 text-lg"
                      overlayClassName="bg-white text-[#007bff]"
                    >
                      {loading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Logging in...</span>
                        </>
                      ) : (
                        <>
                          <span>Login Now</span> <ArrowRight size={20} />
                        </>
                      )}
                    </ButtonWithSpotlight>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center md:text-left mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                      Verify <span className="text-[#007bff] font-['Pacifico',_cursive] tracking-wider drop-shadow-sm text-4xl md:text-5xl ml-1">Identity</span> 📧
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                        We've sent a 6-digit code to <b>{email}</b>. Please enter it below to continue.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyCode} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block">Verification Code</label>
                      <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <ShieldCheck size={20} className="text-slate-400 group-focus-within:text-[#007bff] transition-colors" />
                          </div>
                          <input
                            type="text"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg py-4 pl-12 pr-4 outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] transition-all text-2xl tracking-[0.5em] font-bold text-center placeholder:text-slate-200 shadow-sm"
                            placeholder="000000"
                            required
                          />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <ButtonWithSpotlight
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#007bff] text-white font-bold py-4 rounded-xl transition-all hover:bg-[#0056b3] shadow-lg shadow-blue-500/30 text-lg"
                      overlayClassName="bg-white text-[#007bff]"
                    >
                      <span>Verify & Access</span> <ArrowRight size={20} />
                    </ButtonWithSpotlight>
                    
                    <button 
                      type="button"
                      onClick={() => setMfaStep(false)}
                      className="w-full text-slate-500 text-sm font-medium hover:text-slate-800 transition-colors"
                    >
                      Back to Login
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotherAdminLogin;
