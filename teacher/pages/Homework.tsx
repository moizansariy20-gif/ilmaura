
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FilePen, Calendar, Book, Image as ImageIcon, X, Trash2, Loader2, CheckCircle, Upload, Plus, Users, Sparkles, Clock, ShieldAlert, User } from 'lucide-react';
import { UserProfile, Class, Subject, ClassLog as ClassLogType } from '../../types.ts';
import { subscribeToClassLogs, addClassLog, deleteClassLog } from '../../services/api.ts';
import { FirestoreError } from 'firebase/firestore';

interface HomeworkProps {
  profile: UserProfile;
  classes: Class[];
  subjects: Subject[];
}

const Homework: React.FC<HomeworkProps> = ({ profile, classes, subjects }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  
  const [logs, setLogs] = useState<ClassLogType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<ClassLogType | null>(null);
  
  // File Upload State
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setLogs([]);
        return;
    }
    
    setIsLoading(true);
    const unsub = subscribeToClassLogs(profile.schoolId, selectedClassId, 
      (fetchedLogs: ClassLogType[]) => {
        setLogs(fetchedLogs.filter(log => log.type === 'homework'));
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error(err);
        setError('Failed to load homework entries.');
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [selectedClassId, profile.schoolId]);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || '...';
  
  const filteredLogs = useMemo(() => {
      return logs.filter(log => log.date === date);
  }, [logs, date]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          setFiles(prev => [...prev, ...newFiles]);
      }
  };

  const removeFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedSubjectId) {
      alert("Please select a subject.");
      return;
    }
    if (!content.trim() && files.length === 0) {
      alert("Please write a note or upload images.");
      return;
    }
    setIsSaving(true);
    setError('');

    try {
      const baseData = {
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        teacherId: profile.teacherId!,
        date: date,
        type: 'homework' as const,
      };

      const promises = [];

      if (files.length > 0) {
          files.forEach((file, index) => {
              const logContent = index === 0 ? content : ""; 
              promises.push(addClassLog(profile.schoolId!, {
                  ...baseData,
                  content: logContent,
                  file: file
              }));
          });
      } else {
          promises.push(addClassLog(profile.schoolId!, {
              ...baseData,
              content: content
          }));
      }
      
      await Promise.all(promises);
      
      setContent('');
      setFiles([]);
      if(fileInputRef.current) fileInputRef.current.value = '';
      setShowSuccessModal(true);

    } catch (err: any) {
        console.error("Homework submission error:", err);
        setError(`Failed to save: ${err.message || 'An unknown error occurred.'}`);
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDelete = (log: ClassLogType) => {
    setConfirmDeleteTarget(log);
  };
  
  const executeDelete = async () => {
    if (!confirmDeleteTarget) return;
    try {
      console.log("Deleting log with ID:", confirmDeleteTarget.id, "School ID:", profile.schoolId);
      await deleteClassLog(profile.schoolId!, confirmDeleteTarget.id!);
      setConfirmDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete log:", err);
      setError("Failed to delete homework entry.");
      setConfirmDeleteTarget(null);
    }
  };
  
  const subjectsForClass = useMemo(() => {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass?.subjectAssignments) return [];
    
    const assignedSubjectIds = Object.keys(selectedClass.subjectAssignments);
    return subjects.filter(s => assignedSubjectIds.includes(s.id));
  }, [selectedClassId, classes, subjects]);

  return (
    <div className="min-h-full bg-white dark:bg-[#1e293b] pb-32 font-sans relative overflow-hidden">
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header & Filters Combined - No Roundness, Maroon Text */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>Homework</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • Manage Daily Tasks</p>
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

          <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10">
            <div className="group">
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Select Class</label>
              <div className="relative">
                <select 
                  value={selectedClassId} 
                  onChange={e => setSelectedClassId(e.target.value)} 
                  className="w-full p-4 bg-white dark:bg-[#1e293b] shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                  <svg width="14" height="10" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
            <div className="group">
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Select Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full p-4 bg-white dark:bg-[#1e293b] shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <Book size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{filteredLogs.length}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Entries</p>
                </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-[#1e293b] text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <ImageIcon size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{filteredLogs.filter(l => l.b2File).length}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Images</p>
                </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 md:p-8 shadow-[0_15px_50px_-12px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 relative z-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
            <div className="flex items-center gap-4 mb-8 ml-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_10px_rgba(107,29,47,0.3)] flex items-center justify-center text-[#D4AF37]">
                <Sparkles size={22} />
              </div>
              <h3 className="text-2xl font-black text-[#6B1D2F] dark:text-white tracking-tight">Assign New Homework</h3>
            </div>
            
            <div className="space-y-6">
              <div className="relative group">
                <select 
                  value={selectedSubjectId} 
                  onChange={e => setSelectedSubjectId(e.target.value)} 
                  className="w-full p-4 bg-white dark:bg-[#1e293b] shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50 rounded-2xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                >
                  <option value="" disabled>Select Subject</option>
                  {subjectsForClass.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37] transition-colors">
                  <svg width="14" height="10" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="Write homework details, page numbers, or instructions here..." 
                className="w-full p-5 bg-white dark:bg-[#1e293b] shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-[#1e293b] hover:border-[#D4AF37]/50 rounded-2xl text-sm font-medium text-[#6B1D2F] dark:text-white h-40 focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all resize-none placeholder:text-[#A89F91] placeholder:font-medium leading-relaxed"
              />

              <div className="bg-[#FCFBF8] dark:bg-[#020617] p-6 rounded-2xl border-2 border-[#D4AF37]/30 border-dashed shadow-[inset_0_4px_10px_rgba(107,29,47,0.02)]">
                <div className="flex flex-wrap gap-4">
                  {files.map((f, i) => (
                    <div key={i} className="relative group w-24 h-24">
                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover rounded-xl border-2 border-white shadow-[0_4px_10px_rgba(107,29,47,0.1)]" alt="preview" />
                      <button onClick={() => removeFile(i)} className="absolute -top-2 -right-2 bg-white dark:bg-[#1e293b] text-[#6B1D2F] dark:text-white rounded-full p-1.5 shadow-md border border-[#E5E0D8] dark:border-[#1e293b] hover:bg-[#6B1D2F] hover:text-white transition-all"><X size={14} strokeWidth={3}/></button>
                    </div>
                  ))}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 bg-white dark:bg-[#1e293b] border border-[#E5E0D8] dark:border-[#1e293b] shadow-[0_2px_8px_rgba(107,29,47,0.05)] rounded-xl flex flex-col items-center justify-center text-[#A89F91] dark:text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37] hover:shadow-[0_4px_12px_rgba(212,175,55,0.15)] transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FCFBF8] dark:bg-[#020617] group-hover:bg-[#D4AF37]/10 flex items-center justify-center mb-2 transition-colors">
                      <Plus size={20} className="text-[#A89F91] dark:text-slate-400 group-hover:text-[#D4AF37]"/>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Add Image</span>
                  </button>
                </div>
                <input type="file" multiple ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={isSaving || !selectedSubjectId || (!content.trim() && files.length === 0)} 
                className="w-full py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-bold text-sm hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(107,29,47,0.3)] border border-[#4A1420] active:scale-[0.98]"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20} />}
                <span className="tracking-wide uppercase text-xs">{files.length > 0 ? `Post with ${files.length} Images` : 'Post Homework'}</span>
              </button>
              
              {error && (
                <div className="bg-white dark:bg-[#1e293b] border-l-4 border-[#6B1D2F] shadow-sm p-4 rounded-r-xl flex items-center gap-3">
                  <ShieldAlert size={18} className="text-[#6B1D2F] dark:text-white" />
                  <p className="text-[#6B1D2F] dark:text-white text-xs font-bold">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* List */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                Assigned for {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>
            ) : (
              filteredLogs.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {filteredLogs.map(log => (
                    <div key={log.id} className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_15px_50px_-12px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#6B1D2F] opacity-90 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex justify-between items-start gap-4 pl-3">
                        <div className="space-y-5 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-4 py-1.5 bg-gradient-to-r from-[#6B1D2F] to-[#8B253D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(107,29,47,0.2)] border border-[#4A1420]">
                              {getSubjectName(log.subjectId)}
                            </span>
                            <span className="px-4 py-1.5 bg-white dark:bg-[#1e293b] text-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#D4AF37]/30 shadow-sm">
                              {classes.find(c => c.id === log.classId)?.name || '...'}
                            </span>
                            <span className="text-[11px] font-bold text-[#D4AF37] ml-2 flex items-center gap-1.5 bg-[#FCFBF8] dark:bg-[#020617] px-3 py-1 rounded-lg border border-[#D4AF37]/20">
                              <Clock size={14} className="text-[#D4AF37]" />
                              {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          {log.content && (
                            <div className="bg-gradient-to-br from-[#FCFBF8] to-white p-5 rounded-2xl border border-[#D4AF37]/20 shadow-[inset_0_2px_4px_rgba(107,29,47,0.02)]">
                              <p className="text-sm text-[#6B1D2F] dark:text-white font-semibold whitespace-pre-wrap leading-relaxed">{log.content}</p>
                            </div>
                          )}
                          {log.b2File && (
                            <div className="mt-5 group/img relative inline-block">
                              <img src={log.b2File.fileName} alt="Homework" className="h-48 w-48 object-cover rounded-2xl border-2 border-white shadow-[0_8px_20px_rgba(107,29,47,0.15)] transition-transform duration-500 group-hover/img:scale-[1.03]" />
                              <a href={log.b2File.fileName} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-[#6B1D2F]/30 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-[2px]">
                                <span className="bg-white dark:bg-[#1e293b] text-[#6B1D2F] dark:text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl transform translate-y-4 group-hover/img:translate-y-0 transition-transform duration-300">View Full</span>
                              </a>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => handleDelete(log)} 
                          className="p-3 text-[#D4AF37] hover:text-white hover:bg-[#6B1D2F] transition-all rounded-xl border border-[#D4AF37]/20 hover:border-[#4A1420] shadow-sm hover:shadow-[0_4px_12px_rgba(107,29,47,0.2)] bg-white dark:bg-[#1e293b]"
                        >
                          <Trash2 size={20}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 rounded-3xl text-[#D4AF37] bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(107,29,47,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#D4AF37]/20">
                    <Book size={32} className="text-[#D4AF37]" />
                  </div>
                  <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">No homework entries for this day.</p>
                  <p className="text-sm font-bold text-[#D4AF37] mt-2">Select a different date or assign new homework above.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 bg-[#6B1D2F]/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] p-8 md:p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(107,29,47,0.4)] border border-[#D4AF37]/30 w-full max-w-sm transform scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-[#FCFBF8] to-white rounded-2xl flex items-center justify-center mb-6 border border-[#D4AF37]/20 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)]">
              <Trash2 size={28} className="text-[#6B1D2F] dark:text-white" />
            </div>
            <h2 className="text-3xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm">Delete Entry?</h2>
            <p className="text-sm text-[#6B1D2F] dark:text-white/80 mt-3 font-bold leading-relaxed">Are you sure you want to delete this homework entry? This action cannot be undone.</p>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setConfirmDeleteTarget(null)} className="flex-1 py-4 bg-white dark:bg-[#1e293b] shadow-[0_2px_8px_rgba(107,29,47,0.05)] border border-[#D4AF37]/30 text-[#6B1D2F] dark:text-white rounded-2xl font-black text-sm hover:bg-[#FCFBF8] transition-all">Cancel</button>
              <button onClick={executeDelete} className="flex-1 py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-black text-sm hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all shadow-[0_8px_20px_rgba(107,29,47,0.25)] border border-[#4A1420]">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-[#6B1D2F]/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(107,29,47,0.4)] border border-[#D4AF37]/30 w-full max-w-sm flex flex-col items-center text-center transform scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#6B1D2F] to-[#D4AF37]"></div>
            <div className="p-5 bg-gradient-to-br from-[#FCFBF8] to-white border border-[#D4AF37]/30 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] rounded-2xl mb-6">
              <CheckCircle size={48} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-3xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm">Success!</h2>
            <p className="text-sm font-bold text-[#D4AF37] mt-2">Homework posted successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homework;


