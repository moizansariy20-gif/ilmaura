
import React, { useMemo, useState } from 'react';
import { Notification01Icon as Bell, File01Icon as FileText, Award01Icon as Award, Megaphone01Icon as Megaphone, Clock01Icon as Clock, Calendar01Icon as Calendar, CheckmarkCircle01Icon as CheckCircle, ArrowRight01Icon as ChevronRight, Cancel01Icon as X, UserCheck01Icon as UserCheck, UserRemove01Icon as UserX, Coffee01Icon as Coffee, BookOpen01Icon as BookOpen } from 'hugeicons-react';
import { Announcement, Assignment, Exam } from '../../types.ts';

interface NotificationsProps {
  profile: any;
  currentClass: any;
  announcements: Announcement[];
  assignments: Assignment[];
  exams: Exam[];
  classLogs?: any[];
  attendance?: any[];
}

const Notifications: React.FC<NotificationsProps> = ({ profile, currentClass, announcements, assignments, exams, classLogs = [], attendance = [] }) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  
  // Combine and sort all items by date
  const allNotifications = useMemo(() => {
    const combined = [
      ...announcements.map(a => ({
        id: a.id,
        type: 'announcement',
        title: 'New Announcement',
        message: a.content,
        date: a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || Date.now()),
        icon: <Megaphone size={20} />,
        color: 'bg-blue-100 text-blue-600',
        detailColor: 'bg-blue-600',
        media_url: a.media_url,
        media_type: a.media_type
      })),
      ...assignments.map(a => ({
        id: a.id,
        type: 'assignment',
        title: 'New Assignment: ' + a.title,
        message: `Due on ${new Date(a.dueDate).toLocaleDateString()}. ${a.instructions || ''}`,
        date: a.createdAt?.toDate ? a.createdAt.toDate() : new Date(), // Fallback to now if created date missing
        icon: <FileText size={20} />,
        color: 'bg-orange-100 text-orange-600',
        detailColor: 'bg-orange-500'
      })),
      ...exams.map(e => ({
        id: e.id,
        type: 'exam',
        title: 'Exam Scheduled: ' + e.title,
        message: `Date: ${new Date(e.date).toLocaleDateString()}. Total Marks: ${e.totalMarks}`,
        date: new Date(), // Exams don't usually have created date in this app, showing as recent
        icon: <Award size={20} />,
        color: 'bg-purple-100 text-purple-600',
        detailColor: 'bg-purple-600'
      })),
      ...classLogs.filter(l => l.type === 'homework').map(l => ({
        id: l.id,
        type: 'homework',
        title: 'New Homework Assigned!',
        message: `New homework added for ${l.subject_id || 'your class'}. Check your Learning Zone.`,
        date: l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.date || Date.now()),
        icon: <BookOpen size={20} />,
        color: 'bg-indigo-100 text-indigo-600',
        detailColor: 'bg-indigo-600'
      })),
      ...attendance.map(a => {
        let title = "Attendance Update";
        let message = "";
        let icon = <Calendar size={20} />;
        let color = 'bg-slate-100 text-slate-600';
        let detailColor = 'bg-slate-600';

        if (a.status === 'Present') {
            title = "School Arrival! 😊";
            message = "Good news! Your child has arrived safely at school today.";
            icon = <UserCheck size={20} />;
            color = 'bg-emerald-100 text-emerald-600';
            detailColor = 'bg-emerald-600';
        } else if (a.status === 'Absent') {
            title = "We missed you! ❤️";
            message = "Your child was marked absent today. Hope everything is fine!";
            icon = <UserX size={20} />;
            color = 'bg-rose-100 text-rose-600';
            detailColor = 'bg-rose-600';
        } else if (a.status === 'Leave') {
            title = "Leave Marked 👋";
            message = "Today's leave has been successfully recorded in the system.";
            icon = <Coffee size={20} />;
            color = 'bg-amber-100 text-amber-600';
            detailColor = 'bg-amber-600';
        }

        return {
          id: a.id,
          type: 'attendance',
          title,
          message,
          date: a.created_at ? new Date(a.created_at) : new Date(a.date),
          icon,
          color,
          detailColor
        };
      })
    ];

    return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [announcements, assignments, exams, classLogs, attendance]);

  const visibleNotifications = allNotifications.slice(0, visibleCount);

  const handleSeeMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  };

  return (
    <div className="min-h-full bg-white dark:bg-[#020617] pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">Alerts</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Notifications</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Stay updated with recent activities
                </p>
              </div>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Bell size={32} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Recent Activity</h2>
              <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
              <span className="text-[10px] font-bold text-[#1e3a8a] bg-[#D4AF37]/10 px-3 py-1.5 rounded-full border border-[#D4AF37]/20 uppercase tracking-widest">
                  {allNotifications.length} Alerts
              </span>
            </div>

            <div className="space-y-4">
                {visibleNotifications.length > 0 ? (
                    visibleNotifications.map((item, index) => (
                        <div 
                            key={index}
                            onClick={() => setSelectedItem(item)}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="group flex gap-4 p-5 bg-[#FCFBF8] dark:bg-[#0f172a] rounded-2xl border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 hover:shadow-md transition-all animate-in slide-in-from-bottom-2 duration-300 cursor-pointer"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.color} border shadow-sm`}>
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-[#1e3a8a] dark:text-white text-sm leading-tight group-hover:text-[#D4AF37] transition-colors line-clamp-1">{item.title}</h4>
                                    <span className="text-[10px] font-bold text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 whitespace-nowrap ml-2 flex items-center gap-1 uppercase tracking-widest">
                                        <Clock size={10} /> {getTimeAgo(item.date)}
                                    </span>
                                </div>
                                <p className="text-xs text-[#1e3a8a]/70 dark:text-white/60 mt-1 line-clamp-1 leading-relaxed">
                                    {item.message}
                                </p>
                            </div>
                            <ChevronRight size={16} className="self-center text-[#D4AF37] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-[#FCFBF8] dark:bg-[#0f172a] rounded-2xl border border-[#D4AF37]/10 border-dashed">
                        <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#D4AF37]/20">
                            <CheckCircle size={32} className="text-[#D4AF37]" />
                        </div>
                        <p className="font-black text-[#1e3a8a] dark:text-white text-lg">All Caught Up!</p>
                        <p className="text-[10px] text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 mt-1 font-bold uppercase tracking-widest">No new notifications</p>
                    </div>
                )}
                
                {visibleCount < allNotifications.length && (
                  <div className="flex justify-center pt-4">
                    <button 
                      onClick={handleSeeMore}
                      className="px-6 py-3 bg-white dark:bg-[#1e293b] border border-[#D4AF37]/30 text-[#1e3a8a] dark:text-[#D4AF37] font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                      See More
                    </button>
                  </div>
                )}
            </div>
        </div>

      {/* MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSelectedItem(null)}></div>
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-3xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-[#D4AF37]/20">
                {/* Header */}
                <div className={`${selectedItem.detailColor} p-6 md:p-8 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/50 to-white/0"></div>
                    <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <X size={20}/>
                    </button>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-lg">
                        {React.cloneElement(selectedItem.icon, { size: 32, className: 'text-white' })}
                    </div>
                    <h3 className="text-2xl font-black leading-tight tracking-tight drop-shadow-sm">{selectedItem.title}</h3>
                    <p className="text-[10px] font-bold opacity-90 mt-2 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={12} /> {getTimeAgo(selectedItem.date)}
                    </p>
                </div>
                
                {/* Content */}
                <div className="p-6 md:p-8 bg-[#FCFBF8] dark:bg-[#1e293b]">
                    {selectedItem.media_url && (
                        <div className="mb-6 rounded-2xl overflow-hidden border border-[#D4AF37]/20 shadow-sm">
                            {selectedItem.media_type === 'video' ? (
                                <video src={selectedItem.media_url} controls className="w-full h-auto max-h-48 object-cover" />
                            ) : (
                                <img src={selectedItem.media_url} alt="Notification Media" className="w-full h-auto max-h-48 object-cover" />
                            )}
                        </div>
                    )}
                    <div className="bg-white dark:bg-slate-700 p-5 rounded-2xl border border-[#D4AF37]/10 mb-6 shadow-sm">
                        <p className="text-[#1e3a8a] dark:text-white/90 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedItem.message}
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setSelectedItem(null)}
                        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all ${selectedItem.detailColor}`}
                    >
                        Close Alert
                    </button>
                </div>
            </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Notifications;
