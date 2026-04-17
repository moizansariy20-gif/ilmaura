
import React, { useState } from 'react';
import { User, ArrowRight, ArrowLeft, ClipboardList, AlertTriangle, Lock, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { verifyTeacherId, activateTeacherAccount, loginWithId } from '../services/api.ts';

interface TeacherLoginProps {
  onBack: () => void;
  school?: any;
}

const TeacherLogin: React.FC<TeacherLoginProps> = ({ onBack, school }) => {
  const [step, setStep] = useState<'id' | 'verify' | 'setup' | 'login'>('id');
  const [loginId, setLoginId] = useState('');
  const [dbId, setDbId] = useState(''); // Internal database ID for verification
  const [verifyInput, setVerifyInput] = useState(''); // DOB
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const schoolId = school?.id || localStorage.getItem('active_school_portal_id');
  const themeColor = school?.themeColor || '#4f46e5';

  // STEP 1: CHECK ID
  const handleIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) { setError("School context missing."); return; }
    setLoading(true);
    setError('');

    try {
        const teacherData = await verifyTeacherId(schoolId, loginId);
        if (!teacherData) {
            setError("Invalid Teacher ID. Please check and try again.");
            setLoading(false);
            return;
        }

        setDbId(teacherData.id);

        if (teacherData.auth_status === 'pending') {
            // New Account -> Verify Identity
            setStep('verify');
        } else {
            // Active Account -> Enter Password
            setStep('login');
        }
    } catch (err) {
        setError("Network error. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  // STEP 2: VERIFY IDENTITY (DOB)
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        // Fetch fresh data to compare securely
        const teacherData = await verifyTeacherId(schoolId, loginId);
        if (teacherData && teacherData.dob === verifyInput) {
            setStep('setup'); // Success -> Set Password
        } else {
            setError("Incorrect Date of Birth. Verification failed.");
        }
    } catch (err) {
        setError("Verification error.");
    } finally {
        setLoading(false);
    }
  };

  // STEP 3: SETUP PASSWORD (ACTIVATION)
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    
    setLoading(true);
    try {
        await activateTeacherAccount(schoolId, dbId, loginId, password);
        // SUCCESS: No need to reload. The auth listener in App.tsx will detect the user and redirect automatically.
    } catch (err: any) {
        setError(err.message || "Activation failed.");
        setLoading(false);
    }
  };

  // STEP 4: REGULAR LOGIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await loginWithId(schoolId, loginId, password);
        // Auth hook will handle redirect
    } catch (err: any) {
        setError("Incorrect password.");
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative animate-in fade-in duration-300">
       <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
         <ArrowLeft size={16} /> Back
       </button>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div 
            className="w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-6"
            style={{ 
                background: school ? `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` : 'linear-gradient(to top right, #3b82f6, #6366f1)' 
            }}
          >
             {school?.logoURL ? (
                <img src={school.logoURL} alt="School Logo" className="w-full h-full object-cover rounded-[2rem]" />
             ) : (
                <ClipboardList size={36} />
             )}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{school?.name || "Teacher App"}</h1>
          <p className="text-slate-500 mt-2 font-medium">Faculty Access</p>
        </div>

        <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 relative overflow-hidden">
          
          {error && (
             <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold text-center flex flex-col items-center gap-2 animate-in zoom-in-95">
                <AlertTriangle size={20} className="shrink-0" />
                <span>{error}</span>
            </div>
          )}

          {step === 'id' && (
              <form onSubmit={handleIdSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teacher ID</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        type="text" 
                        value={loginId} 
                        onChange={(e) => setLoginId(e.target.value.toUpperCase())} 
                        className="w-full bg-slate-100 border-2 border-transparent text-slate-900 rounded-xl py-3 pl-12 pr-4 outline-none transition-colors font-mono font-bold text-lg uppercase placeholder:normal-case"
                        style={{ '--tw-ring-color': themeColor } as any}
                        onFocus={(e) => e.target.style.borderColor = themeColor}
                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                        placeholder="e.g. T-8821" 
                        required 
                        autoFocus
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading || !loginId} className="w-full text-white font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50" style={{ backgroundColor: themeColor }}>
                  {loading ? <Loader2 className="animate-spin" size={20}/> : <>Next <ArrowRight size={16}/></>}
                </button>
              </form>
          )}

          {step === 'verify' && (
              <form onSubmit={handleVerifySubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center -mt-2 mb-4">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-3 py-1 rounded-full">First Time Activation</span>
                    <p className="text-xs text-slate-500 font-bold mt-2">Verify your Date of Birth to continue.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input type="date" value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)} className="w-full bg-slate-100 border-2 border-transparent text-slate-900 rounded-xl py-3 pl-12 pr-4 outline-none font-bold" required />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: themeColor }}>
                  {loading ? <Loader2 className="animate-spin" size={20}/> : 'Verify Identity'}
                </button>
              </form>
          )}

          {step === 'setup' && (
              <form onSubmit={handleSetupSubmit} className="space-y-4 animate-in slide-in-from-right duration-300">
                <p className="text-center text-xs text-slate-500 font-bold -mt-2">Create your secure password.</p>
                <div className="space-y-2">
                  <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-100 rounded-xl py-3 px-4 outline-none font-bold" required />
                  <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-100 rounded-xl py-3 px-4 outline-none font-bold" required />
                </div>
                <button type="submit" disabled={loading} className="w-full text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: themeColor }}>
                  {loading ? <Loader2 className="animate-spin" size={20}/> : 'Activate Account'}
                </button>
              </form>
          )}

          {step === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="text-center -mt-2 mb-4">
                    <p className="text-xs text-slate-500 font-bold">Welcome back, Faculty!</p>
                    <p className="text-lg font-black text-slate-800">{loginId}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-100 border-2 border-transparent text-slate-900 rounded-xl py-3 pl-12 pr-4 outline-none transition-colors font-bold text-lg" style={{ '--tw-ring-color': themeColor } as any} onFocus={(e) => e.target.style.borderColor = themeColor} onBlur={(e) => e.target.style.borderColor = 'transparent'} placeholder="••••••" required autoFocus />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: themeColor }}>
                  {loading ? <Loader2 className="animate-spin" size={20}/> : <>Login <ArrowRight size={16}/></>}
                </button>
                <div className="text-center">
                    <button type="button" onClick={() => { setStep('id'); setLoginId(''); setPassword(''); }} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Not you? Switch ID</button>
                </div>
              </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
