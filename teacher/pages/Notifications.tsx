import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Info, 
  User, 
  X, 
  ChevronRight, 
  Sparkles,
  Trash2,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { UserProfile } from '../../types.ts';

interface NotificationsProps {
  profile: UserProfile;
}

const Notifications: React.FC<NotificationsProps> = ({ profile }) => {
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock Notifications for Teachers
  const notifications = [
    {
      id: 1,
      type: 'urgent',
      title: "Principal's Notice",
      message: 'Staff meeting scheduled for Friday at 2:00 PM in the conference room. Attendance is mandatory for all senior faculty members.',
      time: '2 hours ago',
      icon: <Bell size={20} />,
      color: 'bg-[#6B1D2F]',
      lightColor: 'bg-[#FCFBF8]',
      textColor: 'text-[#6B1D2F]',
    },
    {
      id: 2,
      type: 'system',
      title: 'System Maintenance',
      message: 'The portal will be down for maintenance on Sunday from 12 AM to 4 AM. Please save your work beforehand.',
      time: 'Yesterday',
      icon: <Info size={20} />,
      color: 'bg-slate-500',
      lightColor: 'bg-slate-50',
      textColor: 'text-slate-600',
    },
    {
      id: 3,
      type: 'academic',
      title: 'Attendance Reminder',
      message: 'Please mark attendance for Class 9A before 10:00 AM. Recurring delays have been noted.',
      time: 'Today, 9:00 AM',
      icon: <Clock size={20} />,
      color: 'bg-[#D4AF37]',
      lightColor: 'bg-[#FCFBF8]',
      textColor: 'text-[#D4AF37]',
    },
    {
      id: 4,
      type: 'activity',
      title: 'New Submission',
      message: 'Ali Ahmed (9A) submitted "Math Homework - Algebra". Please review and grade it.',
      time: '30 mins ago',
      icon: <User size={20} />,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      id: 5,
      type: 'success',
      title: 'Quiz Published',
      message: 'Your quiz "Science Chapter 4" is now live and students can access it.',
      time: 'Yesterday',
      icon: <CheckCircle size={20} />,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    }
  ];

  return (
    <div className="min-h-full bg-white dark:bg-[#1e293b] pb-32 font-sans relative overflow-hidden">
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header & Filters Combined */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>Alerts Center</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • Stay Updated</p>
                <p className="text-[11px] md:text-sm text-[#6B1D2F] dark:text-white font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  {profile.name}
                </p>
              </div>
            </div>
            <div className="flex p-1.5 md:p-2 bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[0_10px_25px_-5px_rgba(107,29,47,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-[#1e293b]/10 flex items-center justify-center relative z-10">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-[#E5E0D8]">
                    <User size={28} className="text-[#6B1D2F] dark:text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#D4AF37] rounded-full border-2 border-[#6B1D2F] flex items-center justify-center shadow-lg">
                <Sparkles size={10} className="text-[#6B1D2F] dark:text-white" />
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <button className="w-full py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-black text-sm hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all flex items-center justify-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(107,29,47,0.3)] border border-[#4A1420] active:scale-[0.98] uppercase tracking-widest">
              <CheckCircle size={20} className="text-[#D4AF37]" /> Mark All as Read
            </button>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#6B1D2F]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#6B1D2F] dark:text-white rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                <Bell size={24} className="drop-shadow-sm" />
              </div>
              <div className="relative z-10">
                <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{notifications.filter(n => n.type === 'urgent').length}</p>
                <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Urgent</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100 relative z-10">
                <CheckCircle size={24} className="drop-shadow-sm" />
              </div>
              <div className="relative z-10">
                <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{notifications.length}</p>
                <p className="text-[10px] font-bold uppercase text-indigo-600 tracking-widest mt-2">Total</p>
              </div>
            </div>
            <div className="hidden md:flex bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                <Sparkles size={24} className="drop-shadow-sm" />
              </div>
              <div className="relative z-10">
                <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">2</p>
                <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">New</p>
              </div>
            </div>
          </div>

          {/* Notifications Feed */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                Recent Notifications
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>

            {notifications.map((note) => (
              <div 
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_15px_50px_-12px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group cursor-pointer active:scale-[0.98]"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#6B1D2F] opacity-90 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start gap-4 pl-3">
                  <div className="space-y-5 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-4 py-1.5 ${note.color} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md border border-black/10`}>
                        {note.type}
                      </span>
                      <span className="text-[11px] font-bold text-[#D4AF37] ml-2 flex items-center gap-1.5 bg-[#FCFBF8] dark:bg-[#020617] px-3 py-1 rounded-lg border border-[#D4AF37]/20">
                        <Clock size={14} className="text-[#D4AF37]" />
                        {note.time}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#FCFBF8] to-white p-5 rounded-2xl border border-[#D4AF37]/20 shadow-[inset_0_2px_4px_rgba(107,29,47,0.02)]">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${note.lightColor} ${note.textColor} shadow-sm border border-[#E5E0D8] dark:border-[#1e293b] flex items-center justify-center shrink-0`}>
                          {note.icon}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-[#6B1D2F] dark:text-white tracking-tight leading-tight">{note.title}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1 line-clamp-2 leading-relaxed">{note.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 text-[#D4AF37] group-hover:text-white group-hover:bg-[#6B1D2F] transition-all rounded-xl border border-[#D4AF37]/20 group-hover:border-[#4A1420] shadow-sm bg-white dark:bg-[#1e293b]">
                    <ChevronRight size={20}/>
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-20 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#D4AF37]/20">
                  <Bell size={32} className="text-[#D4AF37]" />
                </div>
                <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">No notifications yet.</p>
                <p className="text-sm font-bold text-[#D4AF37] mt-2">We'll alert you when something important happens.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-[#6B1D2F]/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] p-8 md:p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(107,29,47,0.4)] border border-[#D4AF37]/30 w-full max-w-sm transform scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
            <button 
              onClick={() => setSelectedNote(null)} 
              className="absolute top-6 right-6 w-10 h-10 bg-[#FCFBF8] dark:bg-[#020617] rounded-xl text-[#D4AF37] flex items-center justify-center shadow-md border border-[#D4AF37]/20 active:scale-90 transition-all hover:bg-[#D4AF37]/10"
            >
              <X size={20} />
            </button>
            
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-[#D4AF37]/20 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] ${selectedNote.lightColor} ${selectedNote.textColor}`}>
              {React.cloneElement(selectedNote.icon as React.ReactElement<any>, { size: 28 })}
            </div>
            
            <h2 className="text-3xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm leading-tight">{selectedNote.title}</h2>
            <div className="flex items-center gap-2 mt-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${selectedNote.color}`}></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">{selectedNote.time}</p>
            </div>
            
            <div className="bg-[#FCFBF8] dark:bg-[#020617] p-6 rounded-2xl border border-[#D4AF37]/20 shadow-[inset_0_2px_4px_rgba(107,29,47,0.02)] mb-8">
              <p className="text-sm text-[#6B1D2F] dark:text-white font-bold leading-relaxed italic">"{selectedNote.message}"</p>
            </div>
            
            <button 
              onClick={() => setSelectedNote(null)} 
              className="w-full py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-black text-sm hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all shadow-[0_8px_20px_rgba(107,29,47,0.25)] border border-[#4A1420] uppercase tracking-widest"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
