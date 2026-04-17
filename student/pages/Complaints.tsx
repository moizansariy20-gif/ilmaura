
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Megaphone01Icon as Megaphone, 
    PlusSignIcon as Plus, 
    Clock01Icon as Clock, 
    CheckmarkCircle01Icon as CheckCircle, 
    AlertCircleIcon as AlertCircle,
    ArrowRight01Icon as ChevronRight,
    Message01Icon as MessageSquare,
    Image01Icon as ImageIcon,
    Video01Icon as VideoIcon,
    Cancel01Icon as X,
    Attachment01Icon as Paperclip,
    ArrowLeft01Icon as ArrowLeft
} from 'hugeicons-react';
import { subscribeToComplaints, addComplaint, uploadFileToStorage } from '../../services/api.ts';
import { Complaint } from '../../types.ts';

const Complaints: React.FC<{ profile: any }> = ({ profile }) => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!profile?.schoolId) return;
        
        // Subscribe to complaints for this school
        // We might want to filter by studentId if we only want to show their own complaints
        const unsub = subscribeToComplaints(profile.schoolId, (data) => {
            // Filter to only show complaints submitted by this student/parent
            const myComplaints = data.filter(c => c.student_id === profile.studentDocId);
            setComplaints(myComplaints);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });
        
        return () => unsub();
    }, [profile]);

    const handleSubmit = async () => {
        if (!newTitle || !newDesc) return;
        
        setIsSubmitting(true);
        try {
            const mediaUrls: string[] = [];
            
            // Upload files if any
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const path = `complaints/${profile.schoolId}/${Date.now()}_${file.name}`;
                    const result = await uploadFileToStorage(file, path);
                    if (result?.publicUrl) mediaUrls.push(result.publicUrl);
                }
            }

            await addComplaint(profile.schoolId, {
                title: newTitle,
                description: newDesc,
                priority: 'Medium',
                submittedBy: profile.name,
                studentId: profile.studentDocId,
                mediaUrls
            });
            setShowModal(false);
            setNewTitle('');
            setNewDesc('');
            setSelectedFiles([]);
        } catch (error) {
            console.error('Complaint Submission Error:', error);
            alert('An error occurred while submitting. Please check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...filesArray]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            'Open': 'bg-blue-100 text-blue-700 border-blue-200',
            'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
            'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
        const icons = {
            'Open': <Clock size={12} />,
            'In Progress': <AlertCircle size={12} />,
            'Resolved': <CheckCircle size={12} />
        };
        
        return (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${colors[status as keyof typeof colors]}`}>
                {icons[status as keyof typeof icons]}
                {status}
            </span>
        );
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

            <div className="max-w-4xl mx-auto space-y-8 relative z-10 mt-4">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">Complaints</h1>
                            <div className="flex flex-col mt-1 md:mt-2">
                                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Help</p>
                                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                    Contact Principal Directly
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setShowModal(true)}
                            className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden active:scale-95 transition-transform"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <Plus size={32} className="text-[#D4AF37] relative z-10" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="px-4 lg:px-8 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-[#1e3a8a] border-t-[#D4AF37] rounded-full animate-spin mb-4"></div>
                            <p className="text-sm font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 text-center border border-[#D4AF37]/20 shadow-xl">
                            <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Megaphone size={48} className="text-[#1e3a8a]/30 dark:text-[#D4AF37]/30" />
                            </div>
                            <h3 className="text-2xl font-black text-[#1e3a8a] dark:text-white tracking-tight">No Complaints Found</h3>
                            <p className="text-sm font-bold text-[#1e3a8a]/60 dark:text-white/60 mt-3 leading-relaxed">
                                If you have any issues or feedback, please submit a complaint using the button above.
                            </p>
                        </div>
                    ) : (
                        complaints.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-[#D4AF37]/20 shadow-lg hover:shadow-xl transition-all group active:scale-[0.98]">
                                <div className="flex justify-between items-start mb-4">
                                    <StatusBadge status={item.status} />
                                    <span className="text-[10px] font-black text-[#1e3a8a]/40 dark:text-white/40 uppercase tracking-widest">{item.date}</span>
                                </div>
                                <h3 className="text-xl font-black text-[#1e3a8a] dark:text-white leading-tight group-hover:text-[#D4AF37] transition-colors tracking-tight">
                                    {item.title}
                                </h3>
                                <p className="text-sm font-bold text-[#1e3a8a]/60 dark:text-white/60 mt-2 line-clamp-2 leading-relaxed">
                                    {item.description}
                                </p>

                                {item.mediaUrls && item.mediaUrls.length > 0 && (
                                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {item.mediaUrls.map((url, idx) => {
                                            const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('video');
                                            return (
                                                <div key={idx} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-[#D4AF37]/20 bg-[#FCFBF8] dark:bg-slate-800/50">
                                                    {isVideo ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                                            <VideoIcon size={24} className="text-white opacity-50" />
                                                        </div>
                                                    ) : (
                                                        <img src={url} alt="Evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    )}
                                                    <a 
                                                        href={url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all"
                                                    >
                                                        <Paperclip size={16} className="text-white opacity-0 group-hover:opacity-100" />
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                <div className="mt-5 pt-5 border-t border-[#D4AF37]/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center">
                                            <MessageSquare size={14} className="text-[#D4AF37]" />
                                        </div>
                                        <span className="text-[10px] font-black text-[#1e3a8a]/40 dark:text-white/40 uppercase tracking-widest">Ticket: #{item.id.slice(0, 5)}</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-[#FCFBF8] dark:bg-slate-800/50 flex items-center justify-center text-[#1e3a8a]/30 dark:text-white/30 group-hover:bg-[#1e3a8a] group-hover:text-[#D4AF37] transition-all border border-[#D4AF37]/20">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-10 relative z-10 shadow-2xl animate-in slide-in-from-bottom duration-500 border border-[#D4AF37]/30">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-3xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tighter">New Complaint</h3>
                                <p className="text-[10px] font-black text-[#1e3a8a]/40 dark:text-white/40 uppercase tracking-widest mt-1">Submit your issue to the Principal</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-[#FCFBF8] dark:bg-slate-800 rounded-2xl flex items-center justify-center text-[#1e3a8a]/40 dark:text-white/40 active:scale-90 transition-all border border-[#D4AF37]/20 hover:bg-[#D4AF37]/10 hover:text-[#1e3a8a] dark:hover:text-[#D4AF37]">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-[11px] font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest block mb-3 ml-1">Complaint Title</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter issue (e.g. Fee Issue, Result Error)"
                                    className="w-full bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/20 rounded-[1.5rem] p-5 font-black text-[#1e3a8a] dark:text-white focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest block mb-3 ml-1">Details</label>
                                <textarea 
                                    placeholder="Describe your issue in detail..."
                                    className="w-full bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/20 rounded-[1.5rem] p-5 font-black text-[#1e3a8a] dark:text-white focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all h-40 resize-none placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest block mb-3 ml-1">Attachments (Images/Videos)</label>
                                <div className="flex flex-wrap gap-3">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="relative w-20 h-20 bg-[#FCFBF8] dark:bg-slate-800/50 rounded-2xl border border-[#D4AF37]/20 flex items-center justify-center overflow-hidden">
                                            {file.type.startsWith('image/') ? (
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <VideoIcon size={24} className="text-[#1e3a8a]/30 dark:text-white/30" />
                                            )}
                                            <button 
                                                onClick={() => removeFile(idx)}
                                                className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="w-20 h-20 bg-[#FCFBF8] dark:bg-slate-800/50 border-2 border-dashed border-[#D4AF37]/30 rounded-2xl flex flex-col items-center justify-center text-[#1e3a8a]/40 dark:text-white/40 hover:border-[#D4AF37] hover:text-[#1e3a8a] dark:hover:text-[#D4AF37] transition-all cursor-pointer active:scale-90">
                                        <Plus size={20} />
                                        <span className="text-[8px] font-black uppercase mt-1">Add</span>
                                        <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>

                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting || !newTitle || !newDesc}
                                className="w-full py-6 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white font-black text-sm uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 border border-[#D4AF37]/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Complaints;
