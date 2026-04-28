
import React, { useState, useEffect } from 'react';
import { 
    WarningCircle, CheckCircle, Hourglass, Plus, Trash, 
    Funnel, MagnifyingGlass, Megaphone, ArrowLeft as LArrowLeft, Sparkle as LSparkles, Gear as LSettings
} from 'phosphor-react';
import { 
    Image as ImageIcon, 
    Video as VideoIcon, 
    File as FileIcon 
} from 'lucide-react';
import { subscribeToComplaints, addComplaint, updateComplaintStatus, deleteComplaint } from '../../services/api.ts';
import { Complaint } from '../../types.ts';

interface ComplaintsManagementProps {
  schoolId: string;
  profile?: any;
  onNavigate?: (path: string) => void;
}

const ComplaintsManagement: React.FC<ComplaintsManagementProps> = ({ schoolId, profile, onNavigate }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<{url: string, isVideo: boolean} | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState('Medium');

    useEffect(() => {
        if (!schoolId) return;
        setLoading(true);
        const unsub = subscribeToComplaints(schoolId, (data) => {
            setComplaints(data);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });
        return () => unsub();
    }, [schoolId]);

    const handleAdd = async () => {
        if(!newTitle) return;
        try {
            await addComplaint(schoolId, {
                title: newTitle,
                description: newDesc,
                priority: newPriority,
                submittedBy: 'Principal'
            });
            setShowModal(false);
            setNewTitle(''); setNewDesc('');
        } catch (error) {
            alert('Error adding complaint');
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: Complaint['status']) => {
        try {
            await updateComplaintStatus(id, newStatus);
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Delete this ticket?')) {
            try {
                await deleteComplaint(id);
            } catch (error) {
                alert('Error deleting complaint');
            }
        }
    };

    const filteredList = complaints.filter(c => filterStatus === 'All' || c.status === filterStatus);

    const PriorityBadge = ({ p }: { p: string }) => {
        const colors = p === 'High' ? 'bg-rose-600' : p === 'Medium' ? 'bg-amber-500' : 'bg-blue-500';
        return <span className={`${colors} text-white text-[9px] font-black uppercase px-2 py-1`}>{p}</span>
    }

    if (isMobile) {
      return (
        <div className="bg-[#FCFBF8] dark:bg-[#020617] min-h-screen pb-32 font-sans">
          {/* Premium Mobile Header */}
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <button 
                onClick={() => onNavigate?.('dashboard')}
                className="w-10 h-10 rounded-xl bg-[#1e3a8a]/10 dark:bg-white/10 flex items-center justify-center text-[#1e3a8a] dark:text-white border border-[#1e3a8a]/20 active:scale-90 transition-transform"
              >
                <LArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-[#1e3a8a] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(30,58,138,0.1)' }}>
                  Complaints
                </h1>
                <div className="flex flex-col mt-1">
                  <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Principal App • Issue Tracker</p>
                </div>
              </div>
              <div className="flex p-1.5 bg-gradient-to-br from-[#1e3a8a] to-[#172554] shadow-[0_10px_25px_-5px_rgba(30,58,138,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-[#1e293b]/10 flex items-center justify-center relative z-10">
                  {profile?.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt={profile.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-white">
                      <LSparkles size={28} className="text-[#1e3a8a] dark:text-white" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full border-2 border-[#1e3a8a] flex items-center justify-center shadow-lg">
                  <LSettings size={10} className="text-[#1e3a8a] dark:text-white" />
                </div>
              </div>
            </div>
  
            <div className="relative z-10 space-y-3">
              <div className="relative">
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-4 pl-12 bg-[#FCFBF8] dark:bg-[#020617] shadow-[inset_0_2px_8px_rgba(30,58,138,0.04)] border border-[#E5E0D8] dark:border-[#1e293b] rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none uppercase"
                >
                  <option value="All">ALL COMPLAINTS</option>
                  <option value="Pending">PENDING</option>
                  <option value="In Progress">IN PROGRESS</option>
                  <option value="Resolved">RESOLVED</option>
                </select>
                <Funnel size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
              </div>
            </div>
          </div>
  
          <div className="px-4 mt-8 space-y-8">
            {/* List Section */}
            <div className="space-y-6 relative z-0">
              <div className="flex items-center gap-4">
                <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
                <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                  Active Tickets
                </h2>
                <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {loading ? (
                  <div className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-xs">Loading...</div>
                ) : filteredList.length > 0 ? (
                  filteredList.map(c => (
                    <div key={c.id} className="bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-[#D4AF37]/20 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] to-[#1e3a8a] opacity-90"></div>
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2">
                            <PriorityBadge p={c.priority} />
                            <span className={`text-[9px] font-black uppercase px-2 py-1 ${c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : c.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                {c.status}
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-black text-[#1e3a8a] dark:text-white text-lg leading-tight mb-2">{c.title}</h3>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">{c.description}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#1e293b]">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">
                            By: {c.submittedBy}
                        </span>
                        {c.mediaUrl && (
                            <button 
                                onClick={() => setPreviewMedia({url: c.mediaUrl!, isVideo: c.mediaType === 'video'})}
                                className="text-[#1e3a8a] dark:text-blue-400 text-xs font-bold flex items-center gap-1 hover:underline"
                            >
                                {c.mediaType === 'video' ? <VideoIcon size={14} /> : c.mediaType === 'image' ? <ImageIcon size={14} /> : <FileIcon size={14} />}
                                View Attachment
                            </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 rounded-3xl bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(30,58,138,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                    <CheckCircle size={48} className="text-[#D4AF37] mx-auto mb-4 opacity-50" weight="fill" />
                    <p className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">No Complaints Found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Media Preview Modal */}
          {previewMedia && (
              <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewMedia(null)}>
                  <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                      <button className="absolute -top-12 right-0 text-white hover:text-slate-300" onClick={() => setPreviewMedia(null)}>
                          <Trash size={32} />
                      </button>
                      {previewMedia.isVideo ? (
                          <video src={previewMedia.url} controls className="max-w-full max-h-[80vh] border-4 border-white" />
                      ) : (
                          <img src={previewMedia.url} alt="Attachment" className="max-w-full max-h-[80vh] object-contain border-4 border-white" />
                      )}
                  </div>
              </div>
          )}
        </div>
      );
    }

    return (
        <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
            <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Issue Tracker</h1>
                        <div className="flex items-center gap-4 mt-2">
                             <span className="bg-white dark:bg-[#1e293b] text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">Complaints</span>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                         <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-rose-600 text-white border-2 border-white font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center gap-2 rounded-none">
                             <Plus size={18} weight="fill"/> Report Issue
                         </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 bg-slate-50 dark:bg-[#0f172a] min-h-[600px]">
                    
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-[#1e293b] p-1">
                            {['All', 'Open', 'In Progress', 'Resolved'].map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-[#1e3a8a] text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredList.map(item => (
                            <div key={item.id} className="bg-white dark:bg-[#1e293b] border-l-8 border-l-slate-800 border-2 border-slate-200 dark:border-[#1e293b] p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:shadow-md transition-all">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <PriorityBadge p={item.priority} />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• By {item.submittedBy}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{item.description}</p>

                                    {item.mediaUrls && item.mediaUrls.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {item.mediaUrls.map((url, idx) => {
                                                const isVideo = !!url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('video');
                                                return (
                                                    <button 
                                                        key={idx} 
                                                        onClick={() => setPreviewMedia({ url, isVideo })}
                                                        className="relative w-16 h-16 rounded border-2 border-slate-200 dark:border-[#1e293b] overflow-hidden bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center hover:border-[#1e3a8a] transition-all"
                                                    >
                                                        {isVideo ? (
                                                            <VideoIcon size={24} className="text-slate-400" />
                                                        ) : (
                                                            <img src={url} alt="Evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-4 mt-4 md:mt-0">
                                    <div className="flex flex-col items-end">
                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</span>
                                         <span className={`text-xs font-black uppercase px-3 py-1 border-2 ${
                                             item.status === 'Open' ? 'text-rose-600 border-rose-600 bg-rose-50' : 
                                             item.status === 'Resolved' ? 'text-emerald-600 border-emerald-600 bg-emerald-50' : 
                                             'text-amber-600 border-amber-600 bg-amber-50'
                                         }`}>
                                             {item.status}
                                         </span>
                                    </div>
                                    
                                    <div className="flex gap-1 ml-4 border-l-2 border-slate-100 dark:border-[#334155] pl-4">
                                        {item.status !== 'Resolved' && (
                                            <button onClick={() => handleStatusUpdate(item.id, 'Resolved')} className="p-2 text-emerald-600 hover:bg-emerald-50" title="Mark Resolved"><CheckCircle size={20} weight="fill"/></button>
                                        )}
                                        {item.status !== 'In Progress' && item.status !== 'Resolved' && (
                                            <button onClick={() => handleStatusUpdate(item.id, 'In Progress')} className="p-2 text-amber-600 hover:bg-amber-50" title="Mark In Progress"><Hourglass size={20} weight="fill"/></button>
                                        )}
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50"><Trash size={20} weight="fill"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {showModal && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg border-4 border-slate-800 p-0 relative z-10 shadow-2xl">
                        <div className="bg-slate-800 text-white p-5 flex justify-between items-center border-b-4 border-black">
                            <h3 className="text-lg font-black uppercase tracking-tight">Report Issue</h3>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Title</label>
                                <input className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-[#1e293b] font-bold outline-none" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Priority</label>
                                <select className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-[#1e293b] font-bold outline-none" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Details</label>
                                <textarea className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-[#1e293b] font-bold outline-none h-24" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                            </div>
                            <button onClick={handleAdd} className="w-full py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest">Submit Ticket</button>
                        </div>
                    </div>
                </div>
            )}

            {previewMedia && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setPreviewMedia(null)}></div>
                    <div className="relative z-10 max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
                        <button 
                            onClick={() => setPreviewMedia(null)}
                            className="absolute -top-12 right-0 text-white hover:text-rose-500 transition-colors uppercase font-black text-xs tracking-widest flex items-center gap-2"
                        >
                            Close Preview
                        </button>
                        <div className="w-full h-full flex items-center justify-center bg-black/40 border-4 border-white/10 shadow-2xl overflow-hidden">
                            {previewMedia.isVideo ? (
                                <video 
                                    src={previewMedia.url} 
                                    controls 
                                    autoPlay 
                                    className="max-w-full max-h-[80vh] shadow-2xl"
                                />
                            ) : (
                                <img 
                                    src={previewMedia.url} 
                                    alt="Preview" 
                                    className="max-w-full max-h-[80vh] object-contain shadow-2xl"
                                    referrerPolicy="no-referrer"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintsManagement;
