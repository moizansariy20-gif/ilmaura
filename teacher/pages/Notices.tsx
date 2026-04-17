
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageSquare, Send, Image as ImageIcon, Video, X, Info, Loader2, Calendar, Clock, ShieldAlert, CheckCircle, Plus, Upload, Trash2, User, Sparkles, ChevronRight, Bell } from 'lucide-react';
import { subscribeToAnnouncements, postAnnouncement, deleteAnnouncement } from '../../services/api.ts';
import { Announcement } from '../../types.ts';
import { FirestoreError } from 'firebase/firestore';

interface NoticesProps {
  profile: any;
  classes: any[];
}

const Notices: React.FC<NoticesProps> = ({ profile, classes }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [heading, setHeading] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [isPopup, setIsPopup] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<Announcement | null>(null);
  
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => setShowSuccessModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (!selectedClassId || !profile.schoolId) {
        setAnnouncements([]);
        return;
    }
    
    setIsLoading(true);
    const unsub = subscribeToAnnouncements(profile.schoolId, selectedClassId, 
      (fetched: Announcement[]) => {
        setAnnouncements(fetched);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [selectedClassId, profile.schoolId]);

  const handlePostAnnouncement = async () => {
    if (!heading.trim() || !newAnnouncement.trim() || !selectedClassId) {
      setError("Please fill in both heading and content.");
      return;
    }
    setIsPosting(true);
    setError('');
    
    try {
      const combinedContent = `
        <h1 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.5rem; color: #6B1D2F; text-transform: uppercase;">${heading}</h1>
        <div style="font-size: 0.9rem; color: #4A1421; font-weight: 600;">${newAnnouncement}</div>
      `;

      await postAnnouncement(profile.schoolId, {
        content: combinedContent,
        classId: selectedClassId,
        teacher_id: profile.teacherId,
        is_popup: isPopup,
        media_url: null,
        media_type: null,
        start_date: startDate || null,
        end_date: endDate || null
      });
      
      setHeading('');
      setNewAnnouncement('');
      setIsPopup(false);
      setStartDate('');
      setEndDate('');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Failed to post notice:", err);
      setError(`Failed to post: ${err.message || 'Unknown error'}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = (announcement: Announcement) => {
    setConfirmDeleteTarget(announcement);
  };

  const executeDelete = async () => {
    if (!confirmDeleteTarget) return;
    try {
      await deleteAnnouncement(confirmDeleteTarget.id!);
      setConfirmDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      setError("Failed to delete notice.");
      setConfirmDeleteTarget(null);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    if (!date) return announcements;
    return announcements.filter(a => {
      const aDate = a.timestamp?.toDate ? a.timestamp.toDate().toISOString().split('T')[0] : (a.timestamp ? new Date(a.timestamp).toISOString().split('T')[0] : '');
      return aDate === date;
    });
  }, [announcements, date]);

  return (
    <div className="min-h-full bg-white dark:bg-slate-800 pb-32 font-sans relative overflow-hidden">
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header & Filters Combined */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>Notices</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • Class Announcements</p>
                <p className="text-[11px] md:text-sm text-[#6B1D2F] dark:text-white font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  {profile.name}
                </p>
              </div>
            </div>
            <div className="flex p-1.5 md:p-2 bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[0_10px_25px_-5px_rgba(107,29,47,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-slate-800/10 flex items-center justify-center relative z-10">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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

          <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10">
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
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Filter Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full p-4 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-slate-700 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                <MessageSquare size={24} className="drop-shadow-sm" />
              </div>
              <div className="relative z-10">
                <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{announcements.length}</p>
                <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Total Notices</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-slate-700 text-[#6B1D2F] dark:text-white rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                <Bell size={24} className="drop-shadow-sm" />
              </div>
              <div className="relative z-10">
                <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{announcements.filter(a => a.is_popup).length}</p>
                <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Popups</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-[0_15px_50px_-12px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 relative z-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
            <div className="flex items-center gap-4 mb-8 ml-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_10px_rgba(107,29,47,0.3)] flex items-center justify-center text-[#D4AF37]">
                <Sparkles size={22} />
              </div>
              <h3 className="text-2xl font-black text-[#6B1D2F] dark:text-white tracking-tight">Post New Notice</h3>
            </div>
            
            <div className="space-y-6">
              <div className="group">
                <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Notice Heading</label>
                <input 
                  type="text"
                  value={heading}
                  onChange={e => setHeading(e.target.value)}
                  placeholder="e.g. URGENT: SCHOOL CLOSED TOMORROW"
                  className="w-full p-4 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-2xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all placeholder:text-[#A89F91] uppercase"
                />
              </div>

              <div className="group">
                <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Notice Content</label>
                <textarea 
                  value={newAnnouncement} 
                  onChange={e => setNewAnnouncement(e.target.value)} 
                  placeholder="Write the full announcement details here..." 
                  className="w-full p-5 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-2xl text-sm font-medium text-[#6B1D2F] dark:text-white h-40 focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all resize-none placeholder:text-[#A89F91] placeholder:font-medium leading-relaxed"
                />
              </div>

              <div className="bg-[#FCFBF8] dark:bg-slate-900 p-6 rounded-2xl border-2 border-[#D4AF37]/30 border-dashed shadow-[inset_0_4px_10px_rgba(107,29,47,0.02)] space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative inline-block">
                    <input 
                      type="checkbox" 
                      id="isPopupTeacher" 
                      checked={isPopup} 
                      onChange={(e) => setIsPopup(e.target.checked)}
                      className="w-6 h-6 text-[#6B1D2F] dark:text-white border-[#D4AF37]/30 rounded-lg focus:ring-[#6B1D2F] focus:ring-offset-0 transition-all cursor-pointer accent-[#6B1D2F]"
                    />
                  </div>
                  <label htmlFor="isPopupTeacher" className="text-xs font-black text-[#6B1D2F] dark:text-white cursor-pointer uppercase tracking-widest">
                    Show as Popup Notification
                  </label>
                </div>

                {isPopup && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
                    <div>
                      <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block mb-2">Start Date</label>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-[#D4AF37]/20 rounded-xl text-xs font-bold text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#6B1D2F]/10 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block mb-2">End Date</label>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-[#D4AF37]/20 rounded-xl text-xs font-bold text-[#6B1D2F] dark:text-white outline-none focus:ring-2 focus:ring-[#6B1D2F]/10 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handlePostAnnouncement} 
                disabled={isPosting || !selectedClassId || !heading.trim() || !newAnnouncement.trim()} 
                className="w-full py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-bold text-sm hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(107,29,47,0.3)] border border-[#4A1420] active:scale-[0.98]"
              >
                {isPosting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
                <span className="tracking-wide uppercase text-xs">{isPosting ? 'Posting...' : 'Post Notice'}</span>
              </button>
              
              {error && (
                <div className="bg-white dark:bg-slate-800 border-l-4 border-[#6B1D2F] shadow-sm p-4 rounded-r-xl flex items-center gap-3">
                  <ShieldAlert size={18} className="text-[#6B1D2F] dark:text-white" />
                  <p className="text-[#6B1D2F] dark:text-white text-xs font-bold">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                Sent Notices History
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>
            ) : (
              filteredAnnouncements.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {filteredAnnouncements.map(a => (
                    <div key={a.id} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_15px_50px_-12px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#6B1D2F] opacity-90 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex justify-between items-start gap-4 pl-3">
                        <div className="space-y-5 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-4 py-1.5 bg-gradient-to-r from-[#6B1D2F] to-[#8B253D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(107,29,47,0.2)] border border-[#4A1420]">
                              {classes.find(c => c.id === a.classId)?.name || 'General'}
                            </span>
                            {a.is_popup && (
                              <span className="px-4 py-1.5 bg-[#D4AF37] text-[#6B1D2F] dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#6B1D2F]/20 shadow-sm flex items-center gap-1.5">
                                <Bell size={12} /> Popup
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-[#D4AF37] ml-2 flex items-center gap-1.5 bg-[#FCFBF8] dark:bg-slate-900 px-3 py-1 rounded-lg border border-[#D4AF37]/20">
                              <Clock size={14} className="text-[#D4AF37]" />
                              {a.timestamp?.toDate ? a.timestamp.toDate().toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : (a.timestamp ? new Date(a.timestamp).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'Recent')}
                            </span>
                          </div>
                          
                          <div className="bg-gradient-to-br from-[#FCFBF8] to-white p-5 rounded-2xl border border-[#D4AF37]/20 shadow-[inset_0_2px_4px_rgba(107,29,47,0.02)]">
                            <div className="prose prose-sm max-w-none text-[#6B1D2F] dark:text-white font-semibold whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: a.content }} />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(a)} 
                          className="p-3 text-[#D4AF37] hover:text-white hover:bg-[#6B1D2F] transition-all rounded-xl border border-[#D4AF37]/20 hover:border-[#4A1420] shadow-sm hover:shadow-[0_4px_12px_rgba(107,29,47,0.2)] bg-white dark:bg-slate-800"
                        >
                          <Trash2 size={20}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 rounded-3xl text-[#D4AF37] bg-white dark:bg-slate-800 shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#D4AF37]/20">
                    <MessageSquare size={32} className="text-[#D4AF37]" />
                  </div>
                  <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">No notices found.</p>
                  <p className="text-sm font-bold text-[#D4AF37] mt-2">Select a different class or post a new notice above.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 bg-[#6B1D2F]/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(107,29,47,0.4)] border border-[#D4AF37]/30 w-full max-w-sm transform scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-[#FCFBF8] to-white rounded-2xl flex items-center justify-center mb-6 border border-[#D4AF37]/20 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)]">
              <Trash2 size={28} className="text-[#6B1D2F] dark:text-white" />
            </div>
            <h2 className="text-3xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm">Delete Notice?</h2>
            <p className="text-sm text-[#6B1D2F] dark:text-white/80 mt-3 font-bold leading-relaxed">Are you sure you want to delete this notice? This action cannot be undone.</p>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setConfirmDeleteTarget(null)} className="flex-1 py-4 bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(107,29,47,0.05)] border border-[#D4AF37]/30 text-[#6B1D2F] dark:text-white rounded-2xl font-black text-sm hover:bg-[#FCFBF8] transition-all">Cancel</button>
              <button onClick={executeDelete} className="flex-1 py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-black text-sm hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all shadow-[0_8px_20px_rgba(107,29,47,0.25)] border border-[#4A1420]">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-[#6B1D2F]/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(107,29,47,0.4)] border border-[#D4AF37]/30 w-full max-w-sm flex flex-col items-center text-center transform scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#6B1D2F] to-[#D4AF37]"></div>
            <div className="p-5 bg-gradient-to-br from-[#FCFBF8] to-white border border-[#D4AF37]/30 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl mb-6">
              <CheckCircle size={48} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-3xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm">Success!</h2>
            <p className="text-sm font-bold text-[#D4AF37] mt-2">Notice posted successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;
