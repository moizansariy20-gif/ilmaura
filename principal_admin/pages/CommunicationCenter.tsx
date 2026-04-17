
import React, { useState, useMemo, useRef } from 'react';
import { 
  WhatsappLogo, 
  MagnifyingGlass, 
  Funnel, 
  UserList, 
  ChatText, 
  PaperPlaneTilt, 
  CheckCircle, 
  Clock, 
  X, 
  ArrowRight,
  ShieldCheck,
  Info,
  Warning,
  CalendarBlank,
  CurrencyDollar,
  UserCircle,
  Paperclip,
  CircleNotch,
  FileText as FileIcon
} from 'phosphor-react';
import { uploadFileToStorage } from '../../services/api.ts';

interface CommunicationCenterProps {
  schoolId: string;
  students: any[];
  classes: any[];
  school: any;
}

const CommunicationCenter: React.FC<CommunicationCenterProps> = ({ schoolId, students, classes, school }) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sendingQueue, setSendingQueue] = useState<any[]>([]);
  const [sentStatus, setSentStatus] = useState<Record<string, boolean>>({});
  const [sendMethod, setSendMethod] = useState<'web' | 'app'>('app'); // Default to App for best experience

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string, url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FILE UPLOAD HANDLER ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const path = `schools/${schoolId}/communication/${Date.now()}_${file.name}`;
      const { publicUrl } = await uploadFileToStorage(file, path);
      setUploadedFile({ name: file.name, url: publicUrl });
      
      // Automatically add file link tag to message if not present
      if (!message.includes('{file_link}')) {
        setMessage(prev => prev + "\n\nFile Link: {file_link}");
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- FILTERING ---
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = selectedClass === 'all' || s.classId === selectedClass;
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.rollNo?.toString().includes(searchTerm);
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClass, searchTerm]);

  // --- SELECTION ---
  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  // --- MESSAGE COMPOSER ---
  const insertTag = (tag: string) => {
    setMessage(prev => prev + ` {${tag}} `);
  };

  const templates = [
    { 
      name: 'Fee Reminder', 
      icon: <CurrencyDollar />, 
      text: 'Assalam-o-Alaikum! Dear Parent of {student_name}, this is a gentle reminder regarding the pending fees. Please clear the dues at your earliest convenience to avoid any inconvenience. Regards, {school_name}' 
    },
    { 
      name: 'Attendance Alert', 
      icon: <Clock />, 
      text: 'Dear Parent, {student_name} is absent from school today without prior notice. Please ensure regular attendance for better academic progress. Regards, {school_name}' 
    },
    { 
      name: 'Meeting Invite', 
      icon: <UserList />, 
      text: 'Dear Parent, you are cordially invited to the Parent-Teacher Meeting on {date} at {time}. Your presence is vital for discussing {student_name}\'s progress. Regards, {school_name}' 
    },
    { 
      name: 'Holiday Notice', 
      icon: <CalendarBlank />, 
      text: 'Dear Parent, please be informed that the school will remain closed on {date} on account of {reason}. Regular classes will resume from {resume_date}. Regards, {school_name}' 
    }
  ];

  // --- SENDING LOGIC ---
  const generateQueue = () => {
    if (selectedStudents.length === 0 || !message.trim()) return;

    const queue = selectedStudents.map(id => {
      const student = students.find(s => s.id === id);
      if (!student) return null;

      let personalizedMsg = message
        .replace(/{student_name}/g, student.name)
        .replace(/{parent_name}/g, student.fatherName || 'Parent')
        .replace(/{school_name}/g, school.name)
        .replace(/{roll_no}/g, student.rollNo || 'N/A')
        .replace(/{file_link}/g, uploadedFile?.url || '');

      // Check multiple possible fields for phone number
      const phone = student.phone || 
                    student.contact || 
                    student.customData?.contact || 
                    student.customData?.phone || 
                    student.customData?.mobile || 
                    student.customData?.whatsapp || 
                    student.fatherPhone ||
                    student.customData?.father_phone ||
                    student.customData?.parent_phone;
      
      return {
        id: student.id,
        name: student.name,
        phone: phone,
        message: personalizedMsg,
        status: 'pending'
      };
    }).filter(Boolean);

    setSendingQueue(queue);
  };

  const sendToWhatsApp = (item: any) => {
    if (!item.phone) {
      alert(`Phone number missing for ${item.name}! Please update it in Student Management.`);
      return;
    }

    // Clean phone number (remove spaces, dashes, ensure country code)
    let cleanPhone = item.phone.toString().replace(/\D/g, '');
    
    // Handle Pakistani numbers specifically if they start with 0 or are 10 digits
    if (cleanPhone.length === 10) {
      cleanPhone = '92' + cleanPhone;
    } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = '92' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('92')) {
      // If it's 11 digits but doesn't start with 92, it might be 03xxxxxxxxx
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '92' + cleanPhone.substring(1);
      }
    }

    const encodedMsg = encodeURIComponent(item.message);
    
    if (sendMethod === 'app') {
      // Direct to Desktop App (NO NEW TABS!)
      const url = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
      window.location.href = url;
    } else {
      // Web Fallback with <a> tag trick for better tab reuse
      const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}&type=phone_number&app_absent=0`;
      const link = document.createElement('a');
      link.href = url;
      link.target = 'whatsapp_portal';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Mark as sent in local state
    setSentStatus(prev => ({ ...prev, [item.id]: true }));
  };

  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return 'N/A';
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-slate-900">
              <WhatsappLogo size={36} weight="fill" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Communication Center</h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600" weight="fill" /> Semi-Automatic WhatsApp Alerts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 border-2 border-slate-900">
              <button 
                onClick={() => setSendMethod('app')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${sendMethod === 'app' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-white'}`}
              >
                Desktop App
              </button>
              <button 
                onClick={() => setSendMethod('web')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${sendMethod === 'web' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-white'}`}
              >
                Web Browser
              </button>
            </div>
            {sendMethod === 'web' && (
              <button 
                onClick={() => window.open('https://web.whatsapp.com', 'whatsapp_portal')}
                className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-900 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <WhatsappLogo size={18} weight="fill" className="text-emerald-600" /> Open Web
              </button>
            )}
            <div className="px-4 py-2 bg-slate-100 border-2 border-slate-900 text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">
              {students.length} Total Students
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT: Selection Panel */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col h-[700px]">
            <div className="p-6 border-b-2 border-slate-900 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <UserList size={18} weight="fill" /> Select Recipients
              </h3>
              <span className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-0.5 text-[10px] font-black">{selectedStudents.length} Selected</span>
            </div>

            {/* Filters */}
            <div className="p-4 border-b-2 border-slate-100 dark:border-slate-800 space-y-3">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search name or roll no..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-slate-900 outline-none text-xs font-bold transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Funnel size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-slate-900 outline-none text-[10px] font-black uppercase appearance-none"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button 
                  onClick={selectAll}
                  className="px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase hover:bg-slate-800 transition-colors"
                >
                  {selectedStudents.length === filteredStudents.length ? 'Unselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <div 
                    key={student.id} 
                    onClick={() => toggleStudent(student.id)}
                    className={`p-4 border-b border-slate-100 flex items-center gap-4 cursor-pointer transition-colors hover:bg-slate-50 ${selectedStudents.includes(student.id) ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600' : ''}`}
                  >
                    <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${selectedStudents.includes(student.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'}`}>
                      {selectedStudents.includes(student.id) && <CheckCircle size={14} weight="fill" className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{student.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {getClassName(student.classId)} • Roll: {student.rollNo}
                      </p>
                    </div>
                    {sentStatus[student.id] && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Sent</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-10 text-center">
                  <p className="text-xs font-bold text-slate-400 italic">No students found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Composer & Queue */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          
          {/* Composer */}
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col">
            <div className="p-6 border-b-2 border-slate-900 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ChatText size={18} weight="fill" /> Message Composer
              </h3>
              <div className="flex gap-2">
                {['student_name', 'parent_name', 'school_name', 'roll_no', 'file_link'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => insertTag(tag)}
                    className="px-2 py-1 bg-white/10 dark:bg-slate-800/10 hover:bg-white/20 dark:bg-slate-800/20 text-[9px] font-black uppercase tracking-tighter border border-white/20 transition-all"
                  >
                    +{tag.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload Section */}
              <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Attachment (Optional)</p>
                  {uploadedFile ? (
                    <div className="flex items-center gap-3 text-emerald-600">
                      <FileIcon size={20} weight="fill" />
                      <span className="text-xs font-bold truncate max-w-[200px]">{uploadedFile.name}</span>
                      <button onClick={() => setUploadedFile(null)} className="text-slate-400 hover:text-rose-500">
                        <X size={14} weight="bold" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic">No file attached. You can upload a PDF or Image to share.</p>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {isUploading ? <CircleNotch size={14} className="animate-spin" /> : <Paperclip size={14} weight="bold" />}
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
              {/* Templates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {templates.map(t => (
                  <button 
                    key={t.name}
                    onClick={() => setMessage(t.text)}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-50 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-900 hover:bg-white dark:bg-slate-800 transition-all group"
                  >
                    <div className="text-slate-400 group-hover:text-slate-900 dark:text-white transition-colors">
                      {t.icon}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:text-white">{t.name}</span>
                  </button>
                ))}
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea 
                  className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-slate-900 outline-none text-sm font-bold transition-all resize-none placeholder:text-slate-300"
                  placeholder="Type your message here... Use tags like {student_name} for personalization."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
                <div className="absolute bottom-4 right-4 text-[10px] font-black text-slate-400 uppercase">
                  {message.length} Characters
                </div>
              </div>

              <button 
                onClick={generateQueue}
                disabled={selectedStudents.length === 0 || !message.trim()}
                className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                <PaperPlaneTilt size={20} weight="fill" /> Generate Sending Queue
              </button>
            </div>
          </div>

          {/* Sending Queue */}
          {sendingQueue.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col animate-in slide-in-from-bottom-4">
              <div className="p-6 border-b-2 border-slate-900 bg-emerald-600 text-white flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <PaperPlaneTilt size={18} weight="fill" /> Sending Queue ({sendingQueue.length})
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSentStatus({})}
                    className="px-3 py-1 bg-white/10 dark:bg-slate-800/10 hover:bg-white/20 dark:bg-slate-800/20 text-[9px] font-black uppercase tracking-widest border border-white/20 transition-all"
                  >
                    Reset Status
                  </button>
                  <button onClick={() => setSendingQueue([])} className="p-1 hover:bg-white/20 dark:bg-slate-800/20 transition-colors">
                    <X size={18} weight="bold" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-amber-50 border-2 border-amber-200 p-4 flex gap-4 items-start mb-6">
                  <Info size={24} className="text-amber-600 shrink-0" weight="fill" />
                  <div>
                    <p className="text-xs font-black text-amber-900 uppercase">
                      {sendMethod === 'app' ? 'Desktop App Mode (Fastest)' : 'Web Browser Mode'}
                    </p>
                    <p className="text-[11px] font-bold text-amber-700 mt-1">
                      {sendMethod === 'app' 
                        ? 'Click "Send" and it will directly open your WhatsApp Desktop App without opening any new browser tabs. Just press Enter to send!' 
                        : 'Click "Send" to open WhatsApp Web. If it opens a new tab every time, please switch to "Desktop App" mode above for a much faster experience.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {sendingQueue.map((item, index) => (
                    <div key={item.id} className={`p-4 border-2 flex items-center justify-between transition-all ${sentStatus[item.id] ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white dark:bg-slate-800 border-slate-900 shadow-sm'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 dark:text-slate-400">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.phone || 'No Phone'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {!item.phone ? (
                          <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase bg-rose-50 px-3 py-2 border border-rose-100">
                            <Warning size={14} weight="fill" /> Missing Number
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {sentStatus[item.id] && (
                              <div className="flex items-center gap-1 text-emerald-600 font-black text-[9px] uppercase">
                                <CheckCircle size={14} weight="fill" /> Sent
                              </div>
                            )}
                            <button 
                              onClick={() => sendToWhatsApp(item)}
                              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${sentStatus[item.id] ? 'bg-slate-200 text-slate-600 dark:text-slate-300 hover:bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                            >
                              {sentStatus[item.id] ? 'Resend' : 'Send'} <ArrowRight size={14} weight="bold" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Information Notice */}
          <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 bg-white/10 dark:bg-slate-800/10 flex items-center justify-center shrink-0">
              <Warning size={40} className="text-amber-400" weight="fill" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-amber-400">Security & Safety Notice</h4>
              <p className="text-[11px] font-bold text-slate-400 mt-2 leading-relaxed">
                This semi-automatic system is designed to keep your personal WhatsApp number safe. 
                By opening each chat individually, WhatsApp recognizes this as human activity, 
                significantly reducing the risk of your account being flagged for spam compared to fully automated scripts.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CommunicationCenter;
