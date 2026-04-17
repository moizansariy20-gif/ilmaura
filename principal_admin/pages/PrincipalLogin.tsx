
import React, { useState } from 'react';
import { School, Lock, User, ArrowRight, ArrowLeft, Mail, Send } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.ts';
import { supabase } from '../../services/supabase.ts';

interface LoginProps {
  onSwitchPortal: () => void;
}

const PrincipalLogin: React.FC<LoginProps> = ({ onSwitchPortal }) => {
  const { login, loading, error: authError } = useAuth();
  const [email, setEmail] = useState('principal@ilmaura.com');
  const [password, setPassword] = useState('principal');
  const [showReset, setShowReset] = useState(false);
  
  // State for reset form
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setResetMessage('Password reset link sent! Please check your email inbox.');
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };
  
  if (showReset) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] relative z-10 animate-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 mb-6">
               <Lock size={36} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Reset Password</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">We'll send a secure link to your email.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50">
            <form onSubmit={handleResetPassword} className="space-y-6">
              {resetError && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-bold text-center">{resetError}</div>}
              {resetMessage && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-[11px] font-bold text-center">{resetMessage}</div>}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Registered Email</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500"><Mail size={18} /></div>
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 pl-14 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="your-email@school.com" required />
                </div>
              </div>
              <button type="submit" disabled={resetLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50">
                {resetLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <>Send Reset Link <Send size={16} /></>}
              </button>
              <div className="text-center pt-2">
                <button type="button" onClick={() => { setShowReset(false); setResetError(''); setResetMessage(''); }} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">Back to Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative animate-in fade-in duration-300">
       <button onClick={onSwitchPortal} className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-100">
         <ArrowLeft size={16} /> Back to Portals
       </button>
      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 mb-6">
             <School size={36} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Principal App</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Welcome, School Administrator</p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium -mt-4">Demo credentials are pre-filled for your convenience.</p>

            {authError && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-bold text-center">{authError}</div>}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500"><User size={18} /></div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 pl-14 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="your-email@school.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500"><Lock size={18} /></div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl py-4 pl-14 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="••••••••" required />
              </div>
               <div className="text-right mt-2">
                 <button type="button" onClick={() => setShowReset(true)} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">Forgot Password?</button>
               </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <>Login <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrincipalLogin;
