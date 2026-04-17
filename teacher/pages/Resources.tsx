import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FilePen, 
  Book, 
  Link as LinkIcon, 
  FileText, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  Upload, 
  Users, 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  User,
  Search,
  Download,
  ExternalLink,
  Filter,
  X
} from 'lucide-react';
import { UserProfile, Class, Subject, Resource } from '../../types.ts';
import { addResource, deleteResource } from '../../services/api.ts';

interface ResourcesProps {
  profile: UserProfile;
  classes: Class[];
  subjects: Subject[];
  resources: Resource[];
}

const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  type: 'link' as 'link' | 'book',
  url: '',
  classId: '',
  subjectId: '',
};

const Resources: React.FC<ResourcesProps> = ({ profile, classes, subjects, resources: initialResources }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<Resource | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
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
      setForm(prev => ({ ...prev, classId: classes[0].id }));
    }
  }, [classes]);

  const filteredResources = useMemo(() => {
    return initialResources.filter(r => {
      const classMatch = !selectedClassId || r.classId === selectedClassId;
      const subjectMatch = !selectedSubjectId || r.subjectId === selectedSubjectId;
      return classMatch && subjectMatch;
    });
  }, [initialResources, selectedClassId, selectedSubjectId]);

  const subjectsForClass = useMemo(() => {
    const targetClassId = form.classId || selectedClassId;
    const selectedClass = classes.find(c => c.id === targetClassId);
    if (!selectedClass?.subjectAssignments) return [];
    
    const assignedSubjectIds = Object.keys(selectedClass.subjectAssignments);
    return subjects.filter(s => assignedSubjectIds.includes(s.id));
  }, [form.classId, selectedClassId, classes, subjects]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!form.classId || !form.subjectId) {
      setError("Please select class and subject.");
      return;
    }
    if (form.type === 'link' && !form.url.trim()) {
      setError("Please enter a link.");
      return;
    }
    if (form.type === 'book' && !file) {
      setError("Please upload a PDF file.");
      return;
    }

    setIsSaving(true);
    setError('');
    setUploadProgress(0);

    try {
      await addResource(profile.schoolId!, {
        ...form,
        teacherId: profile.teacherId!,
        file: file || undefined,
        createdAt: Date.now(),
      }, (progress) => setUploadProgress(progress));
      
      setForm(INITIAL_FORM_STATE);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowSuccessModal(true);
      setUploadProgress(null);
    } catch (err: any) {
      console.error("Resource submission error:", err);
      setError(`Failed to save: ${err.message || 'An unknown error occurred.'}`);
      setUploadProgress(null);
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDeleteTarget) return;
    try {
      await deleteResource(profile.schoolId!, confirmDeleteTarget.id!);
      setConfirmDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete resource:", err);
      setError("Failed to delete resource.");
      setConfirmDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-slate-800 pb-32 font-sans relative overflow-hidden">
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header & Filters */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>Resources</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Teacher App • Learning Materials</p>
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
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Filter Class</label>
              <div className="relative">
                <select 
                  value={selectedClassId} 
                  onChange={e => setSelectedClassId(e.target.value)} 
                  className="w-full p-4 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                >
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                  <Filter size={16} />
                </div>
              </div>
            </div>
            <div className="group">
              <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-white uppercase tracking-widest mb-2 ml-1">Filter Subject</label>
              <div className="relative">
                <select 
                  value={selectedSubjectId} 
                  onChange={e => setSelectedSubjectId(e.target.value)} 
                  className="w-full p-4 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                  <Search size={16} />
                </div>
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
                <Book size={24} className="drop-shadow-sm" />
              </div>
              <div className="relative z-10">
                <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{filteredResources.length}</p>
                <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Materials</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(107,29,47,0.08)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_12px_40px_-8px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(107,29,47,0.05)] border border-[#E5E0D8] dark:border-slate-700 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                <Users size={24} className="drop-shadow-sm" />
              </div>
              <div className="relative z-10">
                <p className="font-black text-4xl text-[#6B1D2F] dark:text-white leading-none drop-shadow-sm">{classes.length}</p>
                <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Classes</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-[0_15px_50px_-12px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 relative z-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
            <div className="flex items-center gap-4 mb-8 ml-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_10px_rgba(107,29,47,0.3)] flex items-center justify-center text-[#D4AF37]">
                <Plus size={22} />
              </div>
              <h3 className="text-2xl font-black text-[#6B1D2F] dark:text-white tracking-tight">Add New Material</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setForm(prev => ({ ...prev, type: 'link' }))}
                  className={`py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${form.type === 'link' ? 'bg-[#6B1D2F] text-white border-[#4A1420] shadow-lg' : 'bg-white dark:bg-slate-800 text-[#6B1D2F] dark:text-white border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <LinkIcon size={16} />
                    Link
                  </div>
                </button>
                <button 
                  onClick={() => setForm(prev => ({ ...prev, type: 'book' }))}
                  className={`py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${form.type === 'book' ? 'bg-[#6B1D2F] text-white border-[#4A1420] shadow-lg' : 'bg-white dark:bg-slate-800 text-[#6B1D2F] dark:text-white border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={16} />
                    PDF File
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <select 
                    value={form.classId} 
                    onChange={e => setForm(prev => ({ ...prev, classId: e.target.value, subjectId: '' }))} 
                    className="w-full p-4 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-2xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                  >
                    <option value="" disabled>Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <select 
                    value={form.subjectId} 
                    onChange={e => setForm(prev => ({ ...prev, subjectId: e.target.value }))} 
                    className="w-full p-4 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-2xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none"
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjectsForClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <input 
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Material Title (e.g. Chapter 1 Notes)"
                className="w-full p-4 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-2xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all"
              />

              {form.type === 'link' ? (
                <input 
                  type="url"
                  value={form.url}
                  onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Paste URL here (e.g. YouTube, Drive, Website)"
                  className="w-full p-4 bg-white dark:bg-slate-800 shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)] border border-[#E5E0D8] dark:border-slate-700 hover:border-[#D4AF37]/50 rounded-2xl text-sm font-medium text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all"
                />
              ) : (
                <div className="bg-[#FCFBF8] dark:bg-slate-900 p-6 rounded-2xl border-2 border-[#D4AF37]/30 border-dashed shadow-[inset_0_4px_10px_rgba(107,29,47,0.02)] flex flex-col items-center justify-center">
                  {file ? (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-[#D4AF37]/20 shadow-sm">
                      <FileText className="text-[#6B1D2F] dark:text-white" />
                      <span className="text-xs font-bold text-[#6B1D2F] dark:text-white truncate max-w-[200px]">{file.name}</span>
                      <button onClick={() => setFile(null)} className="text-[#6B1D2F] dark:text-white hover:text-red-500"><Plus className="rotate-45" size={18} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 text-[#A89F91] dark:text-slate-400 hover:text-[#D4AF37] transition-colors"
                    >
                      <Upload size={32} />
                      <span className="text-xs font-bold uppercase tracking-wider">Click to Upload PDF</span>
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileSelect} />
                </div>
              )}

              <button 
                onClick={handleSubmit} 
                disabled={isSaving || !form.title || (form.type === 'link' ? !form.url : !file)} 
                className="w-full py-4 bg-gradient-to-r from-[#6B1D2F] via-[#8B253D] to-[#6B1D2F] text-white rounded-2xl font-bold text-sm hover:from-[#5A1827] hover:to-[#6B1D2F] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(107,29,47,0.3)] border border-[#4A1420] active:scale-[0.98]"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20} />}
                <span className="tracking-wide uppercase text-xs">{isSaving ? 'Uploading...' : 'Publish Material'}</span>
              </button>
              
              {uploadProgress !== null && (
                <div className="w-full bg-[#FCFBF8] dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-[#D4AF37]/20">
                  <div className="bg-[#D4AF37] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              {error && (
                <div className="bg-white dark:bg-slate-800 border-l-4 border-[#6B1D2F] shadow-sm p-4 rounded-r-xl flex items-center gap-3">
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
                Learning Materials
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
            
            {filteredResources.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredResources.map(resource => (
                  <div key={resource.id} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border border-[#D4AF37]/20 transition-all hover:shadow-[0_15px_50px_-12px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#6B1D2F] opacity-90 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start gap-4 pl-3">
                      <div className="space-y-5 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="px-4 py-1.5 bg-gradient-to-r from-[#6B1D2F] to-[#8B253D] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(107,29,47,0.2)] border border-[#4A1420]">
                            {subjects.find(s => s.id === resource.subjectId)?.name || '...'}
                          </span>
                          <span className="px-4 py-1.5 bg-white dark:bg-slate-800 text-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#D4AF37]/30 shadow-sm">
                            {classes.find(c => c.id === resource.classId)?.name || '...'}
                          </span>
                          <span className="text-[11px] font-bold text-[#D4AF37] ml-2 flex items-center gap-1.5 bg-[#FCFBF8] dark:bg-slate-900 px-3 py-1 rounded-lg border border-[#D4AF37]/20">
                            <Clock size={14} className="text-[#D4AF37]" />
                            {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#FCFBF8] to-white p-5 rounded-2xl border border-[#D4AF37]/20 shadow-[inset_0_2px_4px_rgba(107,29,47,0.02)]">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-[#E5E0D8] dark:border-slate-700 flex items-center justify-center text-[#D4AF37] shrink-0">
                              {resource.type === 'link' ? <LinkIcon size={24} /> : <FileText size={24} />}
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-[#6B1D2F] dark:text-white tracking-tight">{resource.title}</h4>
                              {resource.description && <p className="text-sm text-[#6B1D2F] dark:text-white/70 font-medium mt-1">{resource.description}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {resource.type === 'link' ? (
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-6 py-3 bg-[#6B1D2F] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#5A1827] transition-all shadow-md"
                            >
                              <ExternalLink size={16} />
                              Open Link
                            </a>
                          ) : (
                            <a 
                              href={resource.fileURL} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-[#6B1D2F] dark:text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#C4A027] transition-all shadow-md"
                            >
                              <Download size={16} />
                              Download PDF
                            </a>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider ml-auto">
                            <Download size={14} />
                            {resource.downloadCount || 0} Views
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setConfirmDeleteTarget(resource)} 
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
                  <Book size={32} className="text-[#D4AF37]" />
                </div>
                <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">No materials found.</p>
                <p className="text-sm font-bold text-[#D4AF37] mt-2">Add your first learning resource above.</p>
              </div>
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
            <h2 className="text-3xl font-black text-[#6B1D2F] dark:text-white tracking-tight drop-shadow-sm">Delete Resource?</h2>
            <p className="text-sm text-[#6B1D2F] dark:text-white/80 mt-3 font-bold leading-relaxed">Are you sure you want to delete this material? This action cannot be undone.</p>
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
            <p className="text-sm font-bold text-[#D4AF37] mt-2">Material published successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
