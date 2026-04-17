
import React, { useState, useRef } from 'react';
import { 
  User, Mail, Lock, CheckCircle, AlertTriangle, Loader2, BookOpen, 
  UserCircle, Camera, Phone, Calendar, Save, KeyRound, Sparkles,
  ShieldAlert, UploadCloud, ChevronRight
} from 'lucide-react';
import { supabase } from '../../services/supabase.ts';
import { updateUserFirestore, uploadFileToStorage } from '../../services/api.ts';
// import ImageStudio from '../../components/ImageStudio.tsx';
import imageCompression from 'browser-image-compression';

interface ProfilePageProps {
  profile: any;
  school: any;
}

import { translations, Language } from '../../services/translations.ts';

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, school }) => {
  const currentLang = (profile?.preferences?.language as Language) || 'English';
  const t = translations[currentLang];

  const [isSyncing, setIsSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    gender: profile.gender || '',
    dob: profile.dob || '',
    street: profile.address?.street || '',
    city: profile.address?.city || '',
    zip: profile.address?.zip || '',
    country: profile.country || 'Pakistan',
    photoURL: profile.photoURL || '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, photoURL: base64 }));
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Image compression error:', error);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, photoURL: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.name.trim()) { setErrorMsg("Full Name is required."); return; }
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setErrorMsg(t.passwordsMismatch);
      return;
    }
    
    setIsSyncing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // 1. Check Supabase Session
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user) throw new Error("Auth system offline. Please login again.");

      let emailMsg = "";
      
      // 2. Prepare Auth Updates (Email/Password)
      const authUpdates: any = {};
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

      let finalPhotoURL = formData.photoURL;

      // 3. Upload Image if changed (Base64)
      if (finalPhotoURL && finalPhotoURL.startsWith('data:')) {
          const blob = await (await fetch(finalPhotoURL)).blob();
          const file = new File([blob], `profile_${profile.uid}.png`, { type: "image/png" });
          const { publicUrl } = await uploadFileToStorage(file, `profiles/${profile.uid}_${Date.now()}.png`);
          finalPhotoURL = publicUrl;
      }

      // 4. Update User Profile (Global)
      const userProfilePayload = {
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
        dob: formData.dob || null,
        photoURL: finalPhotoURL,
        updated_at: new Date().toISOString()
      };
      
      await updateUserFirestore(profile.uid, userProfilePayload);

      // 5. Sync to School's Teacher Roster (teachers table) - Detailed fields go here
      if (profile.role === 'teacher' && profile.schoolId) {
          const { error: syncError } = await supabase
            .from('teachers')
            .update({
                photo_url: finalPhotoURL,
                name: formData.name,
                phone: formData.phone,
                gender: formData.gender,
                dob: formData.dob || null // Assuming teachers table supports this
            })
            .eq('uid', profile.uid)
            .eq('school_id', profile.schoolId);

          if (syncError) console.warn("Failed to sync teacher roster:", syncError);
      }

      setSuccessMsg(`Faculty Identity Synced.${emailMsg}`);
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '', photoURL: finalPhotoURL }));
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to sync credentials.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section - Same as Homework */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-[#D4AF37] tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>{t.profile}</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">{t.teacherPortal} • {t.personalAccount}</p>
                <p className="text-[11px] md:text-sm text-[#6B1D2F] dark:text-white font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  {profile.name}
                </p>
              </div>
            </div>
            <div className="flex p-1.5 md:p-2 bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[0_10px_25px_-5px_rgba(107,29,47,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 flex items-center justify-center relative z-10">
                {formData.photoURL ? (
                  <img 
                    src={formData.photoURL} 
                    alt={formData.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-[#E5E0D8] dark:from-slate-700 dark:to-slate-800">
                    <User size={32} className="text-[#6B1D2F] dark:text-[#D4AF37] md:hidden" />
                    <User size={44} className="text-[#6B1D2F] dark:text-[#D4AF37] hidden md:block" />
                  </div>
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-1.5 bg-[#D4AF37] rounded-lg border border-[#6B1D2F] shadow-lg text-[#6B1D2F] hover:scale-110 transition-transform"
                >
                  <Camera size={12} />
                </button>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-[#D4AF37] rounded-full border-2 border-[#6B1D2F] flex items-center justify-center shadow-lg">
                <Sparkles size={12} className="text-[#6B1D2F] md:hidden" />
                <Sparkles size={16} className="text-[#6B1D2F] hidden md:block" />
              </div>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-[#6B1D2F] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">{t.personalDetails}</h2>
              <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6B1D2F]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">{t.fullName}</label>
                <input name="name" type="text" value={formData.name} onChange={handleInputChange} className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-[#6B1D2F]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#6B1D2F]/30 focus:ring-2 focus:ring-[#6B1D2F]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6B1D2F]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">{t.phoneNumber}</label>
                <input name="phone" type="text" value={formData.phone} onChange={handleInputChange} className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-[#6B1D2F]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#6B1D2F]/30 focus:ring-2 focus:ring-[#6B1D2F]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6B1D2F]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">{t.gender}</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-[#6B1D2F]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#6B1D2F]/30 focus:ring-2 focus:ring-[#6B1D2F]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all appearance-none cursor-pointer">
                  <option value="">{t.selectGender}</option>
                  <option value="Male">{t.male}</option>
                  <option value="Female">{t.female}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#6B1D2F]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">{t.dob}</label>
                <input name="dob" type="date" value={formData.dob} onChange={handleInputChange} className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-[#6B1D2F]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#6B1D2F]/30 focus:ring-2 focus:ring-[#6B1D2F]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" />
              </div>
            </div>
          </div>

          {/* School Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-[#6B1D2F] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">{t.schoolInfo}</h2>
              <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] border border-[#D4AF37]/40 shadow-[0_15px_35px_rgba(107,29,47,0.2)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">{t.currentInstitution}</p>
                  <p className="text-xl font-black text-white tracking-tight">{school.name}</p>
                  <p className="text-white/60 text-xs font-bold">{school.address}</p>
                </div>
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-white font-black text-2xl shadow-lg overflow-hidden">
                  {(school.logoURL || school.logo) ? (
                    <img src={school.logoURL || school.logo} className="w-full h-full object-cover" alt="School Logo" referrerPolicy="no-referrer" />
                  ) : (
                    school.name ? school.name[0] : '?'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            {successMsg && <div className="p-4 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-emerald-100 animate-in fade-in flex items-center gap-2 mb-2"><CheckCircle size={14} /> {successMsg}</div>}
            {errorMsg && <div className="p-4 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-rose-100 animate-in fade-in flex items-center gap-2 mb-2"><AlertTriangle size={14} /> {errorMsg}</div>}
            
            <button 
              onClick={handleUpdateProfile}
              disabled={isSyncing}
              className="w-full py-5 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(107,29,47,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#4A1421] hover:from-[#7C2236] hover:to-[#5A1828] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSyncing ? 'Syncing Profile...' : t.syncProfile}
            </button>

            <p className="text-center text-[10px] font-black text-[#A89F91] uppercase tracking-[0.2em]">
              {t.lastSynced}: {new Date().toLocaleDateString()} • {t.secureConnection}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
