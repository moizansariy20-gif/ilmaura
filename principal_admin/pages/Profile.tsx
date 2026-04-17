import React, { useState, useRef } from 'react';
import { 
  User, 
  CheckCircle, 
  WarningCircle, 
  CircleNotch, 
  Camera, 
  FloppyDisk, 
  Key,
  Phone,
  ArrowLeft,
  Gear,
  SignOut
} from 'phosphor-react';
import { supabase } from '../../services/supabase.ts';
import { updateUserFirestore, uploadFileToStorage } from '../../services/api.ts';
import imageCompression from 'browser-image-compression';

interface ProfilePageProps {
  profile: any;
  school: any;
  onProfileUpdate?: (updatedProfile: any) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, school, onProfileUpdate }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
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
      reader.onload = () => setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Image compression error:', error);
      const reader = new FileReader();
      reader.onload = () => setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSyncing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user) throw new Error("Session expired. Please login again.");

      if (formData.newPassword) {
          if (formData.newPassword !== formData.confirmPassword) {
              throw new Error("New passwords do not match.");
          }
          if (formData.newPassword.length < 6) {
              throw new Error("Password must be at least 6 characters.");
          }
          
          const { error: pwdError } = await supabase.auth.updateUser({ 
              password: formData.newPassword 
          });
          
          if (pwdError) throw pwdError;
      }

      let finalPhotoURL = formData.photoURL;
      if (finalPhotoURL && finalPhotoURL.startsWith('data:')) {
          const blob = await (await fetch(finalPhotoURL)).blob();
          const file = new File([blob], `profile_${profile.uid}.png`, { type: "image/png" });
          const { publicUrl } = await uploadFileToStorage(file, `profiles/${profile.uid}_${Date.now()}.png`);
          finalPhotoURL = publicUrl;
      }

      const payload = {
        name: formData.name,
        phone: formData.phone,
        photo_url: finalPhotoURL,
        updated_at: new Date().toISOString()
      };

      await updateUserFirestore(profile.uid, payload);
      
      if (onProfileUpdate) {
        onProfileUpdate({
            ...profile,
            name: formData.name,
            phone: formData.phone,
            photoURL: finalPhotoURL
        });
      }

      setSuccessMsg(`Profile saved successfully.`);
      setFormData(prev => ({ 
          ...prev, 
          photoURL: finalPhotoURL,
          newPassword: '', 
          confirmPassword: '' 
      }));
      
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setErrorMsg(err.message || "Failed to save profile.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      {/* TOP NAV BAR */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
          <button 
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 active:scale-90 transition-transform"
          >
              <ArrowLeft size={20} className="text-[#1e3a8a] dark:text-[#D4AF37]" />
          </button>
          <div className="flex items-center gap-3">
              <div className="text-right">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Principal</p>
                  <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{profile?.name || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37]/40 shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                  {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                      profile?.name?.charAt(0) || 'P'
                  )}
              </div>
          </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 mt-4">
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">My Profile</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Principal App • Account</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Manage your personal info
                </p>
              </div>
            </div>
            
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <User size={32} className="text-[#D4AF37] relative z-10" weight="fill" />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* --- MAIN BASE CARD --- */}
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 border border-[#D4AF37]/20 shadow-xl relative mt-4">
            
            {/* Avatar Section - Centered & Overlapping */}
            <div className="flex justify-center -mt-20 mb-8 relative z-20">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-[6px] border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-[#FCFBF8] dark:bg-slate-700 ring-4 ring-[#D4AF37] relative">
                        {formData.photoURL ? (
                            <img src={formData.photoURL} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#1e3a8a]/30 dark:text-[#D4AF37]/30 bg-[#FCFBF8] dark:bg-slate-800 text-5xl font-black">
                                {formData.name[0]}
                            </div>
                        )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-[#1e3a8a] text-white rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera size={18} weight="fill" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>

            <div className="space-y-8">
                {/* Personal Details Section */}
                <div className="space-y-4">
                    <h3 className="font-black text-[#1e3a8a] dark:text-[#D4AF37] text-lg flex items-center gap-2 px-2">
                        <User size={20} className="text-[#D4AF37]" weight="bold" /> Personal Details
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-white/60 uppercase tracking-widest ml-4">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1e3a8a]/40 dark:text-white/40" weight="bold" />
                                <input 
                                    name="name"
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    className="w-full pl-14 pr-6 py-5 bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/20 rounded-[1.5rem] font-bold text-[#1e3a8a] dark:text-white outline-none focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/50 transition-all placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-white/60 uppercase tracking-widest ml-4">Phone Number</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1e3a8a]/40 dark:text-white/40" weight="bold" />
                                <input 
                                    name="phone"
                                    value={formData.phone} 
                                    onChange={handleInputChange} 
                                    className="w-full pl-14 pr-6 py-5 bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/20 rounded-[1.5rem] font-bold text-[#1e3a8a] dark:text-white outline-none focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/50 transition-all placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30"
                                    placeholder="03xx-xxxxxxx"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="space-y-4">
                    <h3 className="font-black text-[#1e3a8a] dark:text-[#D4AF37] text-lg flex items-center gap-2 px-2">
                        <Key size={20} className="text-[#D4AF37]" weight="bold" /> Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-white/60 uppercase tracking-widest ml-4">New Password</label>
                            <div className="relative">
                                <Key size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1e3a8a]/40 dark:text-white/40" weight="bold" />
                                <input 
                                    name="newPassword"
                                    type="password"
                                    value={formData.newPassword} 
                                    onChange={handleInputChange} 
                                    className="w-full pl-14 pr-6 py-5 bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/20 rounded-[1.5rem] font-bold text-[#1e3a8a] dark:text-white outline-none focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/50 transition-all placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-white/60 uppercase tracking-widest ml-4">Confirm Password</label>
                            <div className="relative">
                                <Key size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1e3a8a]/40 dark:text-white/40" weight="bold" />
                                <input 
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword} 
                                    onChange={handleInputChange} 
                                    className="w-full pl-14 pr-6 py-5 bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/20 rounded-[1.5rem] font-bold text-[#1e3a8a] dark:text-white outline-none focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/50 transition-all placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {successMsg && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-emerald-100 animate-in fade-in flex items-center gap-2">
                    <CheckCircle size={14} weight="bold" /> {successMsg}
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-100 animate-in fade-in flex items-center gap-2">
                    <WarningCircle size={14} weight="bold" /> {errorMsg}
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-[#D4AF37]/20 mx-4"></div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-4">
                  <button 
                      onClick={handleUpdateProfile} 
                      disabled={isSyncing} 
                      className="w-full py-6 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 border border-[#D4AF37]/30 disabled:opacity-50"
                  >
                      {isSyncing ? <CircleNotch className="animate-spin" size={18}/> : <FloppyDisk size={18} weight="bold" />} 
                      {isSyncing ? 'Saving...' : 'Save Profile Changes'}
                  </button>

                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="w-full py-4 bg-white dark:bg-slate-800 text-red-600 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10"
                  >
                    <SignOut size={16} weight="bold" />
                    Logout
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
