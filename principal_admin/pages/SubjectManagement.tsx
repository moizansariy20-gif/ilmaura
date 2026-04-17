
import React, { useState, useRef } from 'react';
import {
  Book, Plus, Trash, CircleNotch, BookOpen, FloppyDisk, X, Camera,
  Calculator, Flask, Atom, TestTube, BookBookmark, Scroll, Globe, Palette, MusicNotes, Laptop, Warning
} from 'phosphor-react';
import { addSubject, deleteSubject, addClass } from '../../services/api.ts';
import { Subject } from '../../types.ts';

interface SubjectManagementProps {
  schoolId: string;
  subjects: Subject[];
  classes: any[];
}

// Visual mapping for subjects for a richer UI
const subjectVisuals: { [key: string]: { icon: React.FC<any>, color: string, bgColor: string } } = {
  math: { icon: Calculator, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  science: { icon: Flask, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  physics: { icon: Atom, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  chemistry: { icon: TestTube, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  english: { icon: BookBookmark, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  urdu: { icon: BookBookmark, color: 'text-green-700', bgColor: 'bg-green-50' },
  history: { icon: Scroll, color: 'text-amber-800', bgColor: 'bg-amber-50' },
  geography: { icon: Globe, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  art: { icon: Palette, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  music: { icon: MusicNotes, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  computer: { icon: Laptop, color: 'text-slate-700', bgColor: 'bg-slate-200' },
  islam: { icon: BookOpen, color: 'text-teal-700', bgColor: 'bg-teal-50' },
  default: { icon: Book, color: 'text-slate-500', bgColor: 'bg-slate-100' },
};

const getSubjectVisuals = (subjectName: string) => {
  const name = subjectName.toLowerCase();
  for (const key in subjectVisuals) {
    if (name.includes(key)) {
      return subjectVisuals[key];
    }
  }
  return subjectVisuals.default;
};

const SubjectManagement: React.FC<SubjectManagementProps> = ({ schoolId, subjects, classes }) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);

  // Quick Class State
  const [showQuickClass, setShowQuickClass] = useState(false);
  const [quickClassName, setQuickClassName] = useState('');
  const [isAddingQuickClass, setIsAddingQuickClass] = useState(false);

  const convertToWebP = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Optional: Resize if too large
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) {
            height = (MAX_WIDTH / width) * height;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP with 0.8 quality
          const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
          resolve(webpDataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const webpDataUrl = await convertToWebP(file);
      setCoverImage(webpDataUrl);
      setError(null);
    } catch (err) {
      console.error("Image conversion failed", err);
      setError("Failed to process image. Please try another one.");
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await addSubject(schoolId, { 
        name: newSubjectName.trim(), 
        schoolId,
        coverImageURL: coverImage,
        classId: selectedClassId || undefined,
        sectionId: selectedSectionId || undefined
      });
      setNewSubjectName('');
      setSelectedClassId('');
      setSelectedSectionId('');
      setCoverImage(null);
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add subject", error);
      setError("Failed to add subject. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleQuickAddClass = async () => {
    if (!quickClassName.trim() || isAddingQuickClass) return;
    setIsAddingQuickClass(true);
    try {
      await addClass(schoolId, { 
        name: quickClassName.trim(), 
        section: '',
        classTeacher: null,
        subjectAssignments: {},
        involvedTeachers: []
      });
      setQuickClassName('');
      setShowQuickClass(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingQuickClass(false);
    }
  };
  const handleDeleteSubject = (subjectId: string) => {
    setSubjectToDelete(subjectId);
  };

  const confirmDeleteSubject = async () => {
    if (subjectToDelete) {
      try {
        await deleteSubject(schoolId, subjectToDelete);
        setSubjectToDelete(null);
      } catch (err: any) {
        console.error("Failed to delete subject:", err);
        setError(err.message || "Failed to delete subject. It might be in use.");
        setSubjectToDelete(null);
      }
    }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
       
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">Subjects Catalog</h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                         Curriculum
                     </span>
                </div>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
               {!isAdding && (
                  <button 
                     onClick={() => setIsAdding(true)}
                     className="px-6 py-3 bg-white dark:bg-slate-800 text-[#1e3a8a] border-2 border-white font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2 rounded-none"
                  >
                     <Plus size={18} weight="fill"/> Add Subject
                  </button>
               )}
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="p-8">

          {error && (
            <div className="mb-8 p-4 bg-rose-50 border-2 border-rose-600 text-rose-700 text-xs font-black uppercase tracking-widest flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                    <Warning size={20} weight="fill"/> {error}
                </div>
                <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
                    <X size={16} weight="bold"/>
                </button>
            </div>
          )}

          {/* Add Form */}
          {isAdding && (
            <div className="bg-white dark:bg-slate-800 p-8 border-4 border-slate-800 mb-8 animate-in slide-in-from-top-4 shadow-xl">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                  <BookOpen size={20} weight="fill" className="text-[#1e3a8a]"/> New Subject Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Image Upload */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50 relative group">
                    {coverImage ? (
                        <div className="relative w-full aspect-[3/4] max-w-[200px] shadow-lg border-2 border-white">
                            <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                            <button 
                                onClick={() => setCoverImage(null)}
                                className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md hover:bg-rose-600 transition-colors"
                            >
                                <X size={16} weight="bold"/>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center gap-3 text-slate-400 hover:text-[#1e3a8a] transition-colors"
                        >
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center rounded-none group-hover:border-[#1e3a8a]">
                                <Camera size={32} weight="fill"/>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Upload Book Cover</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">(WebP Optimized)</span>
                        </button>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange}
                    />
                </div>

                {/* Right: Info */}
                <div className="md:col-span-2 flex flex-col justify-between">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Subject Name</label>
                        <input 
                            type="text" 
                            value={newSubjectName} 
                            onChange={e => setNewSubjectName(e.target.value)} 
                            placeholder="e.g. COMPUTER SCIENCE" 
                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-300 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] uppercase placeholder-slate-400 rounded-none mb-4"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                            autoFocus
                        />

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Assign to Class (Optional)</label>
                                    <button 
                                        onClick={() => setShowQuickClass(true)}
                                        className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest hover:underline"
                                    >
                                        + Quick Class
                                    </button>
                                </div>
                                
                                {showQuickClass && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Class Name" 
                                            className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-300 text-[10px] font-bold uppercase outline-none"
                                            value={quickClassName}
                                            onChange={e => setQuickClassName(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleQuickAddClass}
                                            disabled={isAddingQuickClass || !quickClassName.trim()}
                                            className="px-3 py-2 bg-[#1e3a8a] text-white text-[9px] font-black uppercase"
                                        >
                                            Add
                                        </button>
                                        <button onClick={() => setShowQuickClass(false)} className="text-slate-400"><X size={14}/></button>
                                    </div>
                                )}

                                <select 
                                    value={selectedClassId}
                                    onChange={e => setSelectedClassId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-300 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] uppercase rounded-none"
                                >
                                    <option value="">All Classes</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Section (Optional)</label>
                                <select 
                                    value={selectedSectionId}
                                    onChange={e => setSelectedSectionId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-300 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] uppercase rounded-none"
                                >
                                    <option value="">All Sections</option>
                                    {selectedClassId && classes.find(c => c.id === selectedClassId)?.section && (
                                        <option value={classes.find(c => c.id === selectedClassId).section}>
                                            Section {classes.find(c => c.id === selectedClassId).section}
                                        </option>
                                    )}
                                    {!selectedClassId && ['A', 'B', 'C', 'D'].map(s => (
                                        <option key={s} value={s}>Section {s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={handleAddSubject} disabled={isSaving || !newSubjectName.trim()} className="flex-1 py-4 bg-[#1e3a8a] text-white font-black rounded-none text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                            {isSaving ? <CircleNotch className="animate-spin" size={16} weight="bold"/> : <FloppyDisk size={16} weight="fill"/>} Save Subject
                        </button>
                        <button onClick={() => { setIsAdding(false); setNewSubjectName(''); setCoverImage(null); setError(null); }} className="px-8 py-4 bg-slate-100 text-slate-600 dark:text-slate-300 font-black rounded-none text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-200">
                            Cancel
                        </button>
                    </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {subjects.map((sub, index) => {
              const { icon: Icon, color, bgColor } = getSubjectVisuals(sub.name);
              return (
                <div 
                  key={sub.id} 
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] transition-all group relative shadow-sm hover:shadow-[4px_4px_0px_#1e3a8a] flex flex-col"
                >
                  {/* Subject Image / Icon */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden border-b-2 border-slate-100 dark:border-slate-800">
                    {sub.coverImageURL ? (
                        <img src={sub.coverImageURL} alt={sub.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className={`w-full h-full ${bgColor} flex items-center justify-center`}>
                            <Icon size={48} weight="duotone" className={color}/>
                        </div>
                    )}
                    
                    {/* Delete Overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleDeleteSubject(sub.id)} 
                            className="bg-white/90 dark:bg-slate-800/90 text-rose-600 p-2 border-2 border-rose-100 hover:bg-rose-600 hover:text-white transition-colors shadow-sm"
                            title="Delete Subject"
                        >
                            <Trash size={16} weight="bold" />
                        </button>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-2">{sub.name}</h3>
                    <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Academic Course</span>
                        {sub.classId && (
                            <span className="text-[9px] font-black text-[#1e3a8a] bg-blue-50 px-2 py-0.5 uppercase tracking-widest border border-blue-100">
                                {classes.find(c => c.id === sub.classId)?.name || 'Unknown Class'}
                                {sub.sectionId && ` - SEC ${sub.sectionId}`}
                            </span>
                        )}
                        {!sub.classId && sub.sectionId && (
                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 uppercase tracking-widest border border-amber-100">
                                Section {sub.sectionId}
                            </span>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {subjects.length === 0 && !isAdding && (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300">
              <BookOpen size={48} className="text-slate-300 mx-auto mb-4" weight="fill"/>
              <h3 className="font-black text-xl text-slate-400 uppercase tracking-widest">No Subjects</h3>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Add your first subject to begin.</p>
            </div>
          )}
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full border-2 border-rose-600 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="bg-rose-600 text-white p-4 flex items-center gap-3">
              <Trash size={24} weight="fill" />
              <h3 className="font-black uppercase tracking-widest">Delete Subject</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-200 font-bold mb-6">
                Are you sure you want to delete this subject? This will remove the subject from the entire school and cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setSubjectToDelete(null)}
                  className="px-6 py-2 bg-slate-100 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteSubject}
                  className="px-6 py-2 bg-rose-600 text-white font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                  <Trash size={16} weight="bold" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
