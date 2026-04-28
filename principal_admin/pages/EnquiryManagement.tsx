
import React, { useState, useEffect } from 'react';
import { 
  Plus, MagnifyingGlass, Phone, CalendarBlank, User, 
  Trash, PencilSimple, Check, X, FloppyDisk, 
  CircleNotch, ClipboardText, Funnel, UserPlus, PhoneCall, CheckCircle, Clock
} from 'phosphor-react';
import { addEnquiry, updateEnquiry, deleteEnquiry, subscribeToEnquiries } from '../../services/api.ts';
import { Enquiry, Class } from '../../types.ts';

interface EnquiryManagementProps {
  schoolId: string;
  classes: Class[];
}

const INITIAL_FORM = {
  id: '',
  studentName: '',
  parentName: '',
  phone: '',
  previousSchool: '',
  classInterested: '',
  status: 'New' as Enquiry['status'],
  source: 'Walk-in' as Enquiry['source'],
  notes: '',
  followUpDate: ''
};

const EnquiryManagement: React.FC<EnquiryManagementProps> = ({ schoolId, classes }) => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const unsub = subscribeToEnquiries(schoolId, setEnquiries);
    return () => unsub();
  }, [schoolId]);

  const handleSave = async () => {
    if (!form.studentName || !form.parentName || !form.phone) {
      alert("Please fill name and phone number.");
      return;
    }
    
    setIsSaving(true);
    try {
      const payload: any = {
        studentName: form.studentName,
        parentName: form.parentName,
        phone: form.phone,
        previousSchool: form.previousSchool,
        classInterested: form.classInterested,
        status: form.status,
        source: form.source,
        notes: form.notes,
        followUpDate: form.followUpDate
      };

      if (isEditing && form.id) {
        await updateEnquiry(schoolId, form.id, payload);
      } else {
        await addEnquiry(schoolId, payload);
      }
      setShowModal(false);
      setForm(INITIAL_FORM);
    } catch (e) {
      console.error(e);
      alert("Failed to save entry.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatusUpdate = async (enq: Enquiry, newStatus: string) => {
      try {
          await updateEnquiry(schoolId, enq.id!, { status: newStatus as any });
      } catch (e) {
          console.error(e);
      }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove this visitor from logs?")) {
      await deleteEnquiry(schoolId, id);
    }
  };
  
  const handleEdit = (enq: Enquiry) => {
    setForm({
        id: enq.id || '',
        studentName: enq.studentName,
        parentName: enq.parentName,
        phone: enq.phone,
        previousSchool: enq.previousSchool || '',
        classInterested: enq.classInterested,
        status: enq.status,
        source: enq.source || 'Walk-in',
        notes: enq.notes || '',
        followUpDate: enq.followUpDate || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };
  
  const filteredEnquiries = enquiries.filter(enq => {
      return enq.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             enq.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             enq.phone.includes(searchTerm);
  });

  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return id || 'Not Decided';
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };

  // --- STYLES ---
  const inputStyle = "w-full p-3 bg-slate-50 border-2 border-slate-200 focus:border-[#1e3a8a] outline-none font-bold text-slate-700 placeholder-slate-400 rounded-none transition-colors text-sm";
  const labelStyle = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block ml-1";

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">School Reception</h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="bg-white dark:bg-[#1e293b] text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                         Visitor Log
                     </span>
                </div>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
               <button 
                  onClick={() => { setForm(INITIAL_FORM); setIsEditing(false); setShowModal(true); }}
                  className="px-6 py-3 bg-white dark:bg-[#1e293b] text-[#1e3a8a] border-2 border-white font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2 rounded-none"
               >
                  <UserPlus size={18} weight="fill"/> Add Visitor
               </button>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="p-8 space-y-8">
            
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-blue-900 shadow-sm flex flex-col justify-between h-32 relative">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Total Inquiries</span>
                        <div className="p-2 bg-blue-900 text-white rounded-none">
                            <ClipboardText size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{enquiries.length}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Time</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-emerald-600 shadow-sm flex flex-col justify-between h-32 relative">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Admitted</span>
                        <div className="p-2 bg-emerald-600 text-white rounded-none">
                            <CheckCircle size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{enquiries.filter(e => e.status === 'Admitted').length}</h3>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Conversion</span>
                    </div>
                </div>
            </div>

            {/* --- LIST TABLE --- */}
            <div className="bg-white dark:bg-[#1e293b] border-2 border-[#1e3a8a] shadow-sm flex flex-col">
                <div className="px-6 py-4 bg-[#1e3a8a] border-b-2 border-[#1e3a8a] flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                        <UserPlus size={18} weight="fill"/> Walk-in Register
                    </h3>
                    <div className="relative w-full md:w-64 bg-white dark:bg-[#1e293b] p-1">
                         <input 
                            type="text" 
                            placeholder="SEARCH PARENT..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest placeholder-slate-400"
                         />
                         <MagnifyingGlass size={14} weight="bold" className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2"/>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0f172a] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b-2 border-slate-200 dark:border-[#1e293b]">
                                <th className="p-4">Visitor / Student</th>
                                <th className="p-4">Contact Info</th>
                                <th className="p-4">Interest</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                            {filteredEnquiries.map((enq) => (
                                <tr key={enq.id} className="group hover:bg-slate-50 dark:bg-[#0f172a] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 border-2 border-slate-200 dark:border-[#1e293b] flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-xs">
                                                {enq.parentName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm uppercase">{enq.parentName}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Child: {enq.studentName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 font-mono font-bold text-slate-600 dark:text-slate-300 text-xs">
                                            <Phone size={14} weight="bold" className="text-slate-400"/> {enq.phone}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">{enq.source || 'Walk-in'}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-100 border border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase">
                                            {getClassName(enq.classInterested)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            {enq.status === 'New' && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase">New</span>}
                                            {enq.status === 'Follow Up' && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase">Follow Up</span>}
                                            {enq.status === 'Admitted' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase">Admitted</span>}
                                            {enq.status === 'Rejected' && <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[9px] font-black uppercase">Dropped</span>}
                                            {enq.status === 'Interview' && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[9px] font-black uppercase">Interview</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {enq.status !== 'Admitted' && (
                                                <button onClick={() => handleQuickStatusUpdate(enq, 'Admitted')} className="p-2 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-[#1e293b] text-emerald-600 hover:border-emerald-600 transition-colors" title="Mark Admitted">
                                                    <Check size={14} weight="bold"/>
                                                </button>
                                            )}
                                            <button onClick={() => handleEdit(enq)} className="p-2 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-[#1e293b] text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors">
                                                <PencilSimple size={14} weight="bold"/>
                                            </button>
                                            <button onClick={() => handleDelete(enq.id!)} className="p-2 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-[#1e293b] text-rose-500 hover:border-rose-500 transition-colors">
                                                <Trash size={14} weight="bold"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredEnquiries.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <ClipboardText size={48} className="mx-auto mb-4 opacity-20" weight="duotone"/>
                            <p className="font-bold text-sm uppercase tracking-widest">No visitors recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* SHARP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => !isSaving && setShowModal(false)}></div>
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg border-4 border-slate-800 p-0 relative z-10 animate-in zoom-in-95 shadow-2xl h-[85vh] flex flex-col">
                <div className="bg-slate-800 text-white p-6 flex justify-between items-center border-b-4 border-black shrink-0">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Visitor Entry</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">New Enquiry</p>
                    </div>
                    <button onClick={() => setShowModal(false)}><X size={20} weight="bold"/></button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide border-b-2 border-slate-100 dark:border-[#334155] pb-2 flex items-center gap-2">
                           <User size={16} weight="fill"/> Guardian Details
                        </h4>
                        <div>
                            <label className={labelStyle}>Parent Name</label>
                            <input type="text" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} className={inputStyle} placeholder="ENTER NAME"/>
                        </div>
                        <div>
                            <label className={labelStyle}>Mobile Number</label>
                            <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputStyle} placeholder="03XX..."/>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide border-b-2 border-slate-100 dark:border-[#334155] pb-2 flex items-center gap-2">
                           <UserPlus size={16} weight="fill"/> Student Interest
                        </h4>
                        <div>
                            <label className={labelStyle}>Student Name</label>
                            <input type="text" value={form.studentName} onChange={e => setForm({...form, studentName: e.target.value})} className={inputStyle} placeholder="STUDENT NAME"/>
                        </div>
                        <div>
                            <label className={labelStyle}>Class Interested</label>
                            <select value={form.classInterested} onChange={e => setForm({...form, classInterested: e.target.value})} className={inputStyle}>
                                 <option value="">SELECT CLASS...</option>
                                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className={labelStyle}>Status</label>
                            <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className={inputStyle}>
                                {['New', 'Follow Up', 'Interview', 'Admitted', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className={labelStyle}>Source</label>
                            <select value={form.source} onChange={e => setForm({...form, source: e.target.value as any})} className={inputStyle}>
                                {['Walk-in', 'Phone', 'Referral', 'Social Media'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                    </div>

                    <div>
                        <label className={labelStyle}>Notes</label>
                        <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={`${inputStyle} h-24 resize-none`} placeholder="COMMENTS..."/>
                    </div>
                </div>

                <div className="p-6 border-t-2 border-slate-100 dark:border-[#334155] bg-slate-50 dark:bg-[#0f172a] flex gap-3 shrink-0">
                    <button disabled={isSaving} onClick={handleSave} className="w-full py-4 bg-[#1e3a8a] text-white rounded-none font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[#172554] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {isSaving ? <CircleNotch className="animate-spin" size={18} weight="bold"/> : <FloppyDisk size={18} weight="fill"/>} 
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default EnquiryManagement;
