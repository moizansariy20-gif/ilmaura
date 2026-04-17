
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, X, BookOpen, Key, 
  CheckCircle, ShieldCheck, ClipboardCopy, Loader2, 
  ShieldAlert, UserCheck, Book, FileUp, Download, Phone,
  User, Sparkles, Clock, Search, UserCircle
} from 'lucide-react';
import { deleteStudent, provisionStudentPortalAccount } from '../../services/api.ts';

interface ClassViewProps {
  profile: any;
  school: any;
  classes: any[];
  students: any[];
  subjects: any[];
}

const INITIAL_FORM_STATE = { id: '', name: '', rollNo: '', fatherName: '', phone: '' };

const ClassView: React.FC<ClassViewProps> = ({ profile, school, classes, students, subjects }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showModal, setShowModal] = useState<'confirm-activate' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [studentToActivate, setStudentToActivate] = useState<any | null>(null);
  const [autoCreds, setAutoCreds] = useState({ email: '', password: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisionedCreds, setProvisionedCreds] = useState<any | null>(null);
  const [formError, setFormError] = useState('');
  
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentsInClass = useMemo(() => {
    const filtered = students.filter(s => s.classId === selectedClassId);
    if (!searchQuery) return filtered;
    return filtered.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, selectedClassId, searchQuery]);

  const isHeadTeacher = selectedClass?.classTeacher?.id === profile.teacherId;

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const openActivateModal = (student: any) => {
    if (!isHeadTeacher) return;
    setStudentToActivate(student);
    
    // Use roll number if available, otherwise use name part
    const rollPart = student.rollNo ? student.rollNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : student.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    const cleanSchool = school.name.replace(/\s+/g, '').toLowerCase().slice(0, 10);
    const generatedEmail = `${rollPart}.${cleanSchool}@studentportal.pk`;
    
    const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    const toughNumbers = Math.floor(1000 + Math.random() * 9000);
    const generatedPassword = `${firstName}@${toughNumbers}`;
    
    setAutoCreds({ email: generatedEmail, password: generatedPassword });
    setFormError('');
    setShowModal('confirm-activate');
  };

  const handleActivatePortal = async () => {
    if (!studentToActivate || !isHeadTeacher) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      await provisionStudentPortalAccount(
        profile.schoolId, 
        studentToActivate.id, 
        studentToActivate, 
        autoCreds
      );
      setProvisionedCreds({
        name: studentToActivate.name,
        email: autoCreds.email,
        password: autoCreds.password,
        schoolId: profile.schoolId
      });
      setShowModal(null);
    } catch (error: any) {
      console.error("Activation error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setFormError("ID already exists. Generating alternate...");
        const extraRand = Math.floor(10 + Math.random() * 89);
        setAutoCreds(prev => ({ ...prev, email: prev.email.replace('@', `${extraRand}@`) }));
      } else {
        setFormError("Platform Sync Error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-slate-800 pb-32 font-sans relative overflow-hidden">
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header & Filters Combined */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>Class View</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • Student Directory</p>
                <p className="text-[11px] md:text-sm text-[#6B1D2F] dark:text-white font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  {selectedClass?.name || 'Select Class'}
                </p>
              </div>
            </div>
            <div className="flex p-1.5 md:p-2 bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[0_10px_25px_-5px_rgba(107,29,47,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-slate-800/10 flex items-center justify-center relative z-10">
                {profile.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-[#E5E0D8]">
                    <User size={28} className="text-[#6B1D2F] dark:text-white md:hidden" />
                    <User size={36} className="text-[#6B1D2F] dark:text-white hidden md:block" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#D4AF37] rounded-full border-2 border-[#6B1D2F] flex items-center justify-center shadow-lg">
                <Sparkles size={10} className="text-[#6B1D2F] dark:text-white md:hidden" />
                <Sparkles size={12} className="text-[#6B1D2F] dark:text-white hidden md:block" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10">
            <div className="group">
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Select Class</label>
              <div className="relative">
                <select 
                  value={selectedClassId} 
                  onChange={e => setSelectedClassId(e.target.value)} 
                  className="w-full p-4 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                  <svg width="14" height="10" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
            <div className="group">
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Search Student</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Name or Roll No..."
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="w-full p-4 pl-12 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all" 
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-slate-700 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <Users size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{studentsInClass.length}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Students</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-slate-700 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <ShieldCheck size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{studentsInClass.filter(s => s.uid).length}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Active Portals</p>
                </div>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                Student Directory
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
                       {studentsInClass.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {studentsInClass.map(s => (
                  <div key={s.id} className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_15px_40px_-12px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group flex flex-col items-center text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-[#6B1D2F] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Student Photo */}
                    <div className="relative mb-4">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] overflow-hidden border-2 border-[#D4AF37]/20 bg-slate-50 dark:bg-slate-900 shadow-inner flex items-center justify-center group-hover:border-[#D4AF37]/60 transition-all duration-500 group-hover:scale-105">
                        {s.photoURL ? (
                          <img 
                            src={s.photoURL} 
                            alt={s.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <UserCircle size={48} className="text-[#D4AF37]/30" />
                        )}
                      </div>
                    </div>

                    <div className="w-full">
                      <h4 className="text-sm md:text-base font-black text-[#6B1D2F] dark:text-white tracking-tight leading-tight line-clamp-2 px-1">{s.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 rounded-3xl text-[#D4AF37] bg-white dark:bg-slate-800 shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#D4AF37]/20">
                  <Users size={32} className="text-[#D4AF37]" />
                </div>
                <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">No students found.</p>
                <p className="text-sm font-bold text-[#D4AF37] mt-2">Principal will add students to this class.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Head Teacher Action Modals */}

      {showModal === 'confirm-activate' && studentToActivate && isHeadTeacher && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(null)}></div>
          <div className="bg-gradient-to-b from-white to-[#6B1D2F]/5 w-full max-w-md rounded-[3rem] p-10 relative z-10 animate-in zoom-in-95 shadow-[0_20px_60px_rgba(107,29,47,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#6B1D2F]/10 dark:border-slate-700 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#6B1D2F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex items-center gap-5 mb-10 relative z-10">
                <div className="w-16 h-16 bg-[#6B1D2F]/5 text-[#6B1D2F] dark:text-white rounded-[1.5rem] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] border border-[#6B1D2F]/10 dark:border-slate-700"><Key size={32}/></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">Access Node</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">Provisioning portal for {studentToActivate.name}</p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-[#6B1D2F]/10 dark:border-slate-700 space-y-6 mb-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] relative z-10">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deployment Email</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{autoCreds.email}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temp Access Key</p>
                  <p className="font-mono font-black text-[#6B1D2F] dark:text-white text-xl tracking-wider">{autoCreds.password}</p>
               </div>
            </div>

            <div className="space-y-4 relative z-10">
              {formError && <p className="text-xs text-[#6B1D2F] dark:text-white font-black text-center uppercase tracking-widest">{formError}</p>}
              <button 
                onClick={handleActivatePortal} 
                disabled={isSubmitting} 
                className="w-full py-5 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white rounded-[1.5rem] font-black shadow-[0_8px_20px_rgba(107,29,47,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#4A1421] active:scale-95 active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)] active:translate-y-[1px] transition-all flex items-center justify-center gap-3 hover:from-[#8B2D3F] hover:to-[#6B1D2F]"
              >
                {isSubmitting ? <><Loader2 className="animate-spin" size={20}/> Deploying...</> : 'Deploy Portal Instance'}
              </button>
              <button onClick={() => setShowModal(null)} className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-800 dark:text-slate-100 transition-colors">Abort Mission</button>
            </div>
          </div>
        </div>
      )}

      {/* Credential Delivery Modal (WhatsApp Style) */}
      {provisionedCreds && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setProvisionedCreds(null)}></div>
            <div className="bg-gradient-to-b from-white to-[#6B1D2F]/5 w-full max-w-sm rounded-[3.5rem] shadow-[0_20px_60px_rgba(107,29,47,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] p-12 z-10 text-center animate-in slide-in-from-bottom-10 duration-500 border border-[#6B1D2F]/10 dark:border-slate-700 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#6B1D2F]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] mx-auto flex items-center justify-center mb-8 border-4 border-emerald-100 shadow-[0_8px_20px_rgba(16,185,129,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)] relative z-10">
                    <ShieldCheck size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight relative z-10">Access Online!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium leading-relaxed relative z-10">Identity node for <span className="font-black text-slate-800 dark:text-slate-100">{provisionedCreds.name}</span> is live.</p>
                
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] mt-10 text-left space-y-6 border border-[#6B1D2F]/10 dark:border-slate-700 relative overflow-hidden group shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portal Login</p>
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{provisionedCreds.email}</p>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Secret Key</p>
                        <p className="font-mono font-black text-[#6B1D2F] dark:text-white text-xl tracking-widest">{provisionedCreds.password}</p>
                    </div>
                    <button 
                        onClick={() => {
                            const text = `Salaam! Your Ilmaura Student App access for ${provisionedCreds.name} is ready.\n\n*School ID:* ${provisionedCreds.schoolId}\n*Email:* ${provisionedCreds.email}\n*Password:* ${provisionedCreds.password}\n\nPlease login at ilmaura.com`;
                            navigator.clipboard.writeText(text);
                            alert("Credentials copied! You can now paste and send to the parents.");
                        }}
                        className="w-full mt-4 flex items-center justify-center gap-3 py-4 bg-gradient-to-b from-white to-[#6B1D2F]/5 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs border border-[#6B1D2F]/10 dark:border-slate-700 hover:bg-[#6B1D2F]/5 transition-all active:scale-95 shadow-[0_4px_10px_rgba(107,29,47,0.05),inset_0_1px_0_rgba(255,255,255,1)] relative z-10"
                    >
                        <ClipboardCopy size={18}/> Copy for WhatsApp
                    </button>
                </div>
                <button onClick={() => setProvisionedCreds(null)} className="w-full mt-10 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-800 dark:text-slate-100 transition-all relative z-10">Dismiss Notification</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ClassView;
