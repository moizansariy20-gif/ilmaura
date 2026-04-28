import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.ts';
import { linkSocialAccount } from '../services/api.ts';

const SocialAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        setError(authError.message);
        return;
      }

      if (session?.user) {
        const pendingInfo = localStorage.getItem('pending_access_info');
        if (pendingInfo) {
          try {
            const { schoolId, role, loginId, name } = JSON.parse(pendingInfo);
            await linkSocialAccount(
              session.user.id,
              session.user.email || '',
              schoolId,
              role,
              loginId,
              name
            );
            localStorage.removeItem('pending_access_info');
          } catch (err: any) {
            console.error("Linking error:", err);
          }
        }
        navigate('/');
      } else {
        // No session, maybe check hash for legacy support or redirect home
        const hash = window.location.hash;
        if (!hash) navigate('/');
      }
    };

    handleAuth();
  }, [navigate]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-rose-50 p-4 text-center">
        <h2 className="text-xl font-bold text-rose-700 mb-2">Authentication Error</h2>
        <p className="text-rose-600 mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-rose-600 text-white rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-colors">
          Return to Portal
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Connecting Account...</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2">Please wait while we finalize your access.</p>
    </div>
  );
};

export default SocialAuthCallback;
