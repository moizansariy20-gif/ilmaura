import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings01Icon as SettingsIcon, 
  Notification01Icon as Bell, 
  Shield01Icon as Shield, 
  Globe02Icon as Globe, 
  Moon02Icon as Moon, 
  Sun01Icon as Sun, 
  SmartPhone01Icon as Smartphone, 
  Mail01Icon as Mail, 
  ArrowRight01Icon as ChevronRight, 
  FloppyDiskIcon as Save, 
  Loading01Icon as Loader2,
  CheckmarkCircle01Icon as CheckCircle, 
  AlertCircleIcon as AlertTriangle, 
  SparklesIcon as Sparkles, 
  UserCircleIcon as UserCircle, 
  Key01Icon as Key, 
  Key02Icon as KeyRound,
  Logout01Icon as LogOut,
  ArrowLeft01Icon as ArrowLeft
} from 'hugeicons-react';
import { Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile, UserPreferences } from '../../types.ts';
import { updateUserPreferences } from '../../services/api.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import { supabase } from '../../services/supabase.ts';

import { translations, Language } from '../../services/translations.ts';

interface SettingsPageProps {
  profile: UserProfile;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ profile }) => {
  const navigate = useNavigate();
  const { refreshProfile, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const currentLang = (profile.preferences?.language as Language) || 'English';
  const t = translations[currentLang];

  const [settings, setSettings] = useState<UserPreferences>({
    pushNotifications: true,
    emailNotifications: true,
    darkMode: false,
    language: 'English',
    twoFactorAuth: false
  });

  const [formData, setFormData] = useState({
    email: profile.email || '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  useEffect(() => {
    if (profile.preferences) {
      setSettings(profile.preferences);
    }
  }, [profile.preferences]);

  const handleToggle = (key: keyof UserPreferences) => {
    if (typeof settings[key] === 'boolean') {
      const newValue = !settings[key];
      setSettings(prev => ({ ...prev, [key]: newValue }));
      
      // Immediate effect for dark mode preview
      if (key === 'darkMode') {
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  };

  const handleSave = async () => {
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setErrorMsg(t.passwordsMismatch || "Passwords do not match");
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      // Prepare Auth Updates (Email/Password)
      const authUpdates: any = {};
      let emailMsg = "";
      if (formData.email !== profile.email) {
        authUpdates.email = formData.email;
        emailMsg = " Verify your new email inbox.";
      }
      if (formData.newPassword) {
        authUpdates.password = formData.newPassword;
      }

      // Apply Auth Updates
      if (Object.keys(authUpdates).length > 0) {
        const { error: authUpdateError } = await supabase.auth.updateUser(authUpdates);
        if (authUpdateError) throw authUpdateError;
      }

      await updateUserPreferences(profile.uid, settings);
      localStorage.setItem('edu_user_preferences', JSON.stringify(settings));
      await refreshProfile();
      setSuccessMsg(t.settingsUpdated + emailMsg);
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setErrorMsg(error.message || t.failedToSave);
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="min-h-full bg-white dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      {/* TOP NAV BAR */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
          <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 active:scale-90 transition-transform"
          >
              <ArrowLeft size={20} className="text-[#1e3a8a] dark:text-[#D4AF37]" />
          </button>
          <div className="flex items-center gap-3">
              <div className="text-right">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Student</p>
                  <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{profile?.name || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37]/40 shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                  {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                      profile?.name?.charAt(0) || 'S'
                  )}
              </div>
          </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8 relative z-10 mt-4">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">{t.settings}</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">{t.studentPortal} • {t.personalAccount}</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Customize your experience
                </p>
              </div>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <SettingsIcon size={32} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">


          {/* App Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">{t.appearance}</h2>
              <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/10 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-[#D4AF37]" />
                  <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest">{t.language}</p>
                </div>
                <select 
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-700 border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-sm font-bold text-[#1e3a8a] dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a]/10"
                >
                  <option>English</option>
                  <option>Urdu</option>
                  <option>Arabic</option>
                </select>
              </div>

              <div className="p-5 bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/10 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <Moon size={18} className="text-[#D4AF37]" />
                  <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest">{t.appearance}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggle('darkMode')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${!settings.darkMode ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white border-[#D4AF37]/20'}`}
                  >
                    <Sun size={14} /> {t.lightMode}
                  </button>
                  <button 
                    onClick={() => handleToggle('darkMode')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${settings.darkMode ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white border-[#D4AF37]/20'}`}
                  >
                    <Moon size={14} /> {t.darkMode}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">{t.securityAccess || "Security & Access"}</h2>
              <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">{t.emailAddress || "Email Address"}</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                  <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#1e3a8a]/30 focus:ring-2 focus:ring-[#1e3a8a]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">{t.newPasskey || "New Password"}</label>
                  <div className="relative">
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                    <input name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange} placeholder={t.newPasskey || "New Password"} className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#1e3a8a]/30 focus:ring-2 focus:ring-[#1e3a8a]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-slate-300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">{t.confirmPasskey || "Confirm Password"}</label>
                  <div className="relative">
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                    <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder={t.confirmPasskey || "Confirm Password"} className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#1e3a8a]/30 focus:ring-2 focus:ring-[#1e3a8a]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-4">
            {successMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-emerald-100 animate-in fade-in flex items-center gap-2">
                <CheckCircle size={14} /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-rose-100 animate-in fade-in flex items-center gap-2">
                <AlertTriangle size={14} /> {errorMsg}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="py-4 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg border border-[#1e40af] hover:from-[#2563eb] hover:to-[#1d4ed8] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {isSaving ? 'Saving...' : t.savePreferences}
              </button>

              <button 
                onClick={() => logout()}
                className="py-4 bg-white dark:bg-slate-800 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm border border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/10 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <LogOut size={16} />
                {t.logout || "Logout"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
