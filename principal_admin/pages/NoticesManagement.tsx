
import React, { useState, useEffect, useRef } from 'react';
import { 
    Broadcast, Megaphone, PaperPlaneRight, Trash, CalendarBlank, ArrowsClockwise, Image as ImageIcon, VideoCamera, X
} from 'phosphor-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { postAnnouncement, subscribeToAnnouncementsBySchool, deleteAnnouncement, postToFacebook } from '../../services/api.ts';
import { uploadFileToSupabase } from '../../services/supabase.ts';
import { School } from '../../types.ts';

interface Notice {
    id: string;
    message: string;
    target: string; // 'All', 'Teachers', 'Students'
    date: string;
}

const NoticesManagement: React.FC<{ schoolId: string, classes: any[], school?: School }> = ({ schoolId, classes, school }) => {
    const [endDate, setEndDate] = useState('');
    const [notices, setNotices] = useState<any[]>([]);
    const [heading, setHeading] = useState('');
    const [message, setMessage] = useState('');
    const [targetGroup, setTargetGroup] = useState('All');
    const [isPosting, setIsPosting] = useState(false);
    const [isPopup, setIsPopup] = useState(false);
    const [postToFb, setPostToFb] = useState(false);
    const [startDate, setStartDate] = useState('');

    const fbConfig = school?.socialMediaConfig?.facebook;

    useEffect(() => {
        if (!schoolId) return;
        const unsub = subscribeToAnnouncementsBySchool(schoolId, (data) => {
            setNotices(data);
        });
        return () => unsub();
    }, [schoolId]);

    const handlePost = async () => {
        if(!message.trim() && !heading.trim()) return;
        setIsPosting(true);
        
        try {
            // Find classId if targetGroup is a class name
            const selectedClass = classes.find(c => c.name === targetGroup);
            const classId = selectedClass ? selectedClass.id : null; // null for all

            const combinedContent = `
                <h1 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; color: #1e3a8a; text-transform: uppercase;">${heading}</h1>
                <div>${message}</div>
            `;

            await postAnnouncement(schoolId, {
                content: combinedContent,
                classId: classId,
                teacher_id: null,
                is_popup: isPopup,
                media_url: null,
                media_type: null,
                start_date: startDate || null,
                end_date: endDate || null
            });

            // Post to Facebook if selected and configured
            if (postToFb && fbConfig) {
                try {
                    // Strip HTML tags for Facebook post
                    const plainTextMessage = message.replace(/<[^>]+>/g, '');
                    const fbMessage = `${heading}\n\n${plainTextMessage}`;
                    await postToFacebook(fbConfig.pageId, fbConfig.accessToken, fbMessage);
                } catch (fbErr) {
                    console.error("Failed to post to Facebook:", fbErr);
                    alert("Notice saved, but failed to post to Facebook.");
                }
            }
            
            setHeading('');
            setMessage('');
            setIsPopup(false);
            setPostToFb(false);
            setStartDate('');
            setEndDate('');
        } catch (err) {
            console.error("Failed to post notice:", err);
            alert("Failed to post notice.");
        } finally {
            setIsPosting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this notice?")) return;
        try {
            await deleteAnnouncement(id);
        } catch (err) {
            console.error("Failed to delete notice:", err);
            alert("Failed to delete notice.");
        }
    };

    return (
        <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
            <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Digital Noticeboard</h1>
                        <div className="flex items-center gap-4 mt-2">
                             <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">Announcements</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 xl:grid-cols-4 gap-8 bg-slate-50 dark:bg-slate-800/50 min-h-[600px]">
                    
                    {/* Left: Compose */}
                    <div className="xl:col-span-1">
                        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-6 sticky top-6 shadow-sm">
                             <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 mb-6">
                                <Megaphone size={20} weight="fill" className="text-rose-600"/> Compose Alert
                             </h3>
                             
                             <div className="space-y-4">
                                 <div>
                                     <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Target Audience</label>
                                     <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 font-bold outline-none text-sm uppercase">
                                         <option value="All">Everyone (Global)</option>
                                         <option value="Teachers">Faculty Only</option>
                                         <option value="Students">Students Only</option>
                                         {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                     </select>
                                 </div>
                                 
                                 <div>
                                     <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Notice Heading</label>
                                     <input 
                                        type="text"
                                        value={heading}
                                        onChange={e => setHeading(e.target.value)}
                                        placeholder="ENTER HEADING..."
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 font-black outline-none text-sm uppercase tracking-tight"
                                     />
                                 </div>
                                 
                                 <div>
                                     <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Notice Content</label>
                                     <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 min-h-[250px]">
                                         <ReactQuill 
                                             theme="snow"
                                             value={message}
                                             onChange={setMessage}
                                             placeholder="TYPE ANNOUNCEMENT BODY..."
                                             className="h-full"
                                             modules={{
                                                 toolbar: [
                                                     ['bold', 'italic', 'underline', 'strike'],
                                                     [{ 'color': [] }, { 'background': [] }],
                                                     [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                     [{ 'align': [] }],
                                                     ['link', 'image'],
                                                     ['clean']
                                                 ],
                                             }}
                                         />
                                     </div>
                                 </div>

                                 <div className="flex items-center gap-2">
                                     <input 
                                         type="checkbox" 
                                         id="isPopup" 
                                         checked={isPopup} 
                                         onChange={(e) => setIsPopup(e.target.checked)}
                                         className="w-4 h-4 text-[#1e3a8a] border-slate-300 rounded focus:ring-[#1e3a8a]"
                                     />
                                     <label htmlFor="isPopup" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                         Show as Popup Notification
                                     </label>
                                 </div>

                                 {fbConfig && (
                                     <div className="flex items-center gap-2">
                                         <input 
                                             type="checkbox" 
                                             id="postToFb" 
                                             checked={postToFb} 
                                             onChange={(e) => setPostToFb(e.target.checked)}
                                             className="w-4 h-4 text-[#1877F2] border-slate-300 rounded focus:ring-[#1877F2]"
                                         />
                                         <label htmlFor="postToFb" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1">
                                             Post to Facebook Page <span className="text-[10px] text-slate-400 font-normal">({fbConfig.pageName})</span>
                                         </label>
                                     </div>
                                 )}

                                 {isPopup && (
                                     <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 shadow-inner">
                                         <div>
                                             <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Start Date</label>
                                             <input 
                                                 type="date" 
                                                 value={startDate}
                                                 onChange={e => setStartDate(e.target.value)}
                                                 className="w-full p-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-bold outline-none text-xs"
                                             />
                                         </div>
                                         <div>
                                             <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">End Date</label>
                                             <input 
                                                 type="date" 
                                                 value={endDate}
                                                 onChange={e => setEndDate(e.target.value)}
                                                 className="w-full p-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-bold outline-none text-xs"
                                             />
                                         </div>
                                         <p className="col-span-2 text-[9px] text-slate-400 font-bold italic uppercase tracking-tighter">Popup will only be visible to students during this period.</p>
                                     </div>
                                 )}

                                 <button onClick={handlePost} disabled={isPosting} className="w-full py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest hover:bg-[#172554] transition-all flex items-center justify-center gap-2">
                                     <PaperPlaneRight size={18} weight="fill"/> {isPosting ? 'Posting...' : 'Broadcast Now'}
                                 </button>
                             </div>
                        </div>
                    </div>

                    {/* Middle: Live Preview */}
                    <div className="xl:col-span-2">
                        <div className="sticky top-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 mb-6">
                                <Broadcast size={20} weight="fill" className="text-blue-600"/> Live Preview
                            </h3>
                            
                            <div className="bg-slate-200/50 border-4 border-dashed border-slate-300 rounded-[2rem] p-8 min-h-[500px] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute top-4 left-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student App View</div>
                                
                                {/* Mock Student Dashboard Background */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none">
                                    <div className="w-full h-full bg-[#1e3a8a]"></div>
                                </div>

                                {/* The Notice Modal Preview */}
                                <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 z-10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80%]">
                                    <div className="relative flex-1 overflow-y-auto custom-scrollbar">
                                        <div className="p-8 text-center">
                                            <div className="prose prose-slate max-w-none">
                                                {heading || message ? (
                                                    <div className="text-slate-900 dark:text-white">
                                                        {heading && <h1 className="text-2xl font-black text-[#1e3a8a] mb-4 uppercase tracking-tight">{heading}</h1>}
                                                        <div 
                                                            className="text-slate-800 dark:text-slate-100 font-medium leading-relaxed text-lg text-left"
                                                            dangerouslySetInnerHTML={{ __html: message }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-300 italic text-lg">Your notice will appear here...</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 pt-0">
                                        <button 
                                            className="w-full py-5 bg-[#1e3a8a] text-white font-bold text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20"
                                        >
                                            Close Notice
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: History */}
                    <div className="xl:col-span-1">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Active Notices</h3>
                        <div className="space-y-4">
                            {notices.map((n, i) => (
                                <div key={n.id || i} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-6 flex justify-between items-start group hover:border-[#1e3a8a] transition-all shadow-sm">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 ${!n.classId ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {!n.classId ? 'Everyone' : (classes.find(c => c.id === n.classId)?.name || 'Class Specific')}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <CalendarBlank size={12} weight="bold"/> {new Date(n.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-relaxed prose prose-sm max-w-none line-clamp-3 overflow-hidden" dangerouslySetInnerHTML={{ __html: n.content }} />
                                    </div>
                                    <button onClick={() => handleDelete(n.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-4">
                                        <Trash size={18} weight="bold"/>
                                    </button>
                                </div>
                            ))}
                            {notices.length === 0 && (
                                <div className="text-center py-20 text-slate-400 font-black text-sm uppercase tracking-widest">
                                    No active notices
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NoticesManagement;
