
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon as User, Mail01Icon as Mail, Camera01Icon as Camera, CallIcon as Phone, Calendar01Icon as Calendar, FloppyDiskIcon as Save, Key02Icon as KeyRound, Loading01Icon as Loader2, LicenseIcon as GraduationCap, Shield01Icon as Shield, SparklesIcon as Sparkles, Bookmark01Icon as Bookmark, ArrowLeft01Icon as ArrowLeft } from 'hugeicons-react';
import { Lock } from 'lucide-react';
import { supabase } from '../../services/supabase.ts';
import { updateUserFirestore, uploadFileToStorage, updateStudent } from '../../services/api.ts';

interface ProfilePageProps {
  profile: any;
  school: any;
  currentClass?: any;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, school, currentClass }) => {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name || '', email: profile.email || '', phone: profile.phone || '',
    dob: profile.dob || '', photoURL: profile.photoURL || '',
    newPassword: '', confirmPassword: ''
  });

  const handleUpdate = async () => {
    if (!formData.name) return alert("Name required");
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) return alert("Passwords mismatch");
    
    setIsSyncing(true);
    try {
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        if (sessionError || !user) throw new Error("Please login again.");

        const authUpdates: any = {};
        if (formData.newPassword) authUpdates.password = formData.newPassword;
        if (formData.email !== profile.email) authUpdates.email = formData.email;

        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabase.auth.updateUser(authUpdates);
            if (authError) throw authError;
        }
        
        let finalPhotoURL = formData.photoURL;

        // If photoURL is a Base64 string (from cropper), upload it to Supabase first
        if (finalPhotoURL && finalPhotoURL.startsWith('data:')) {
            const blob = await (await fetch(finalPhotoURL)).blob();
            const file = new File([blob], `profile_${profile.uid}.png`, { type: "image/png" });
            const { publicUrl } = await uploadFileToStorage(file, `profiles/${profile.uid}_${Date.now()}.png`);
            finalPhotoURL = publicUrl;
        }

        await updateUserFirestore(profile.uid, { 
            name: formData.name, 
            email: profile.email, 
            phone: formData.phone, 
            photoURL: finalPhotoURL 
        });

        // Also update the students table if linked
        if (profile.studentDocId && profile.schoolId) {
            console.log("Updating student record:", profile.studentDocId);
            await updateStudent(profile.schoolId, profile.studentDocId, {
                photoURL: finalPhotoURL,
                name: formData.name,
                phone: formData.phone,
                dob: formData.dob
            });
        } else {
            console.warn("Missing studentDocId or schoolId in profile:", profile);
            // Attempt to find studentDocId if missing
            const { data: studentRow } = await supabase.from('students').select('id').eq('uid', profile.uid).single();
            if (studentRow) {
                await updateStudent(profile.schoolId, studentRow.id, {
                    photoURL: finalPhotoURL,
                    name: formData.name,
                    phone: formData.phone,
                    dob: formData.dob
                });
            }
        }
        
        alert("Profile Updated Successfully!");
        setFormData(p => ({...p, newPassword: '', confirmPassword: '', photoURL: finalPhotoURL}));
    } catch(e: any) { 
        alert(e.message || "Failed to update profile."); 
    }
    setIsSyncing(false);
  };

  return (
    <div className="min-h-full bg-white dark:bg-[#020617] pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      {/* TOP NAV BAR */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
          <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e293b] shadow-sm flex items-center justify-center border border-slate-100 dark:border-[#1e293b] active:scale-90 transition-transform"
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

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 mt-4">
        {/* Header Section */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">My Profile</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Account</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Manage your personal info
                </p>
              </div>
            </div>
            
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <User size={32} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* --- MAIN BASE CARD --- */}
          <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 border border-[#D4AF37]/20 shadow-xl relative mt-4">
            
            {/* Avatar Section - Centered & Overlapping */}
            <div className="flex justify-center -mt-20 mb-8 relative z-20">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-[6px] border-white dark:border-[#334155] shadow-2xl overflow-hidden bg-[#FCFBF8] dark:bg-slate-700 ring-4 ring-[#D4AF37]">
                        {formData.photoURL ? (
                            <img src={formData.photoURL} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#1e3a8a]/30 dark:text-[#D4AF37]/30 bg-[#FCFBF8] dark:bg-[#1e293b]">
                                <User size={48} strokeWidth={1.5} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Personal Details Section */}
                <div className="space-y-4">
                    <h3 className="font-black text-[#1e3a8a] dark:text-[#D4AF37] text-lg flex items-center gap-2 px-2">
                        <User size={20} className="text-[#D4AF37]"/> Personal Details
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-white/60 uppercase tracking-widest ml-4">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1e3a8a]/40 dark:text-white/40" />
                                <input 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    className="w-full pl-14 pr-6 py-5 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/20 rounded-[1.5rem] font-bold text-[#1e3a8a] dark:text-white outline-none focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/50 transition-all placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-white/60 uppercase tracking-widest ml-4">Date of Birth</label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1e3a8a]/40 dark:text-white/40" />
                                    <input 
                                        type="date" 
                                        value={formData.dob} 
                                        onChange={e => setFormData({...formData, dob: e.target.value})} 
                                        className="w-full pl-14 pr-6 py-5 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/20 rounded-[1.5rem] font-bold text-[#1e3a8a] dark:text-white outline-none focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-white/60 uppercase tracking-widest ml-4">Phone Number</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1e3a8a]/40 dark:text-white/40" />
                                    <input 
                                        value={formData.phone} 
                                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                                        className="w-full pl-14 pr-6 py-5 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/20 rounded-[1.5rem] font-bold text-[#1e3a8a] dark:text-white outline-none focus:ring-4 focus:ring-[#D4AF37]/10 focus:border-[#D4AF37]/50 transition-all placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30"
                                        placeholder="03xx-xxxxxxx"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#D4AF37]/20 mx-4"></div>

                {/* Save Button */}
                <button 
                    onClick={handleUpdate} 
                    disabled={isSyncing} 
                    className="w-full py-6 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 border border-[#D4AF37]/30"
                >
                    {isSyncing ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                    Save Profile Changes
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
