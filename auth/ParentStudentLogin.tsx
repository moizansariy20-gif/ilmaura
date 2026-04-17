
import React, { useState } from 'react';
import { Lock, User, ArrowRight, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';

interface ParentStudentLoginProps {
  onBack?: () => void;
  school?: any; // School branding object
  returnPath?: string | null;
}

const ParentStudentLogin: React.FC<ParentStudentLoginProps> = ({ onBack, school, returnPath }) => {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('student@ilmaura.com');
  const [password, setPassword] = useState('student123');
  
  const themeColor = school?.themeColor || '#10b981';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleReturnToAdmin = () => {
    if (returnPath) {
        sessionStorage.removeItem('dev_return_to');
        sessionStorage.removeItem('active_school_portal_id');
        localStorage.removeItem('active_school_portal_id');
        window.location.href = '/';
    }
  }
  
  const handleBack = () => {
      // If going back from Login, clear the School ID so they can enter a new one if needed
      localStorage.removeItem('active_school_portal_id');
      if (onBack) onBack();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative animate-in fade-in duration-300">
       {/* Show "Change School" button only if not in admin test mode */}
       {onBack && !returnPath && (
        <button onClick={handleBack} className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft size={16} /> Change School
        </button>
       )}
       {/* Show "Back to Admin" button only if in admin test mode */}
       {returnPath && (
         <button onClick={handleReturnToAdmin} className="absolute top-6 right-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <ArrowLeft size={16} /> Back to Admin
         </button>
       )}
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-green-500 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 mb-6" style={{ background: themeColor }}>
            {school?.logoURL ? (
                <img src={school.logoURL} alt="School Logo" className="w-full h-full object-cover rounded-[2rem]" />
            ) : (
                <Users size={36} />
            )}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{school?.name || "Parent & Student"}</h1>
          <p className="text-slate-500 mt-2 font-medium">View academic progress</p>
        </div>

        <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-center text-xs text-slate-500 font-medium -mt-2">
                {school ? `Welcome! Please login to continue.` : 'Use the pre-filled demo credentials to log in.'}
            </p>
            {error && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold text-center">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-100 border-2 border-transparent text-slate-900 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-emerald-400 transition-colors" style={{'--tw-ring-color': themeColor} as any} placeholder="your.email@school.com" required />
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-100 border-2 border-transparent text-slate-900 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-emerald-400 transition-colors" style={{'--tw-ring-color': themeColor} as any} placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full text-white font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50" style={{ backgroundColor: themeColor, boxShadow: `0 10px 15px -3px ${themeColor}40, 0 4px 6px -4px ${themeColor}40`}}>
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <>Secure Login <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParentStudentLogin;
