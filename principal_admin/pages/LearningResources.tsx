
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Loader2, Link as LinkIcon, BookOpen, Library, Youtube, Sparkles, AlertTriangle } from 'lucide-react';
import { addResource, deleteResource } from '../../services/api.ts';
import { Resource, Class, Subject } from '../../types.ts';

interface LearningResourcesProps {
  schoolId: string;
  resources: Resource[];
  classes: Class[];
  subjects: Subject[];
}

const INITIAL_FORM_STATE = { id: '', title: '', url: '', description: '', classId: '', subjectId: '', type: 'link' as const };

const LearningResources: React.FC<LearningResourcesProps> = ({ schoolId, resources, classes, subjects }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'N/A';
  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return 'N/A';
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };
  
  const handleSave = async () => {
    if (!form.title || !form.url || !form.classId || !form.subjectId) {
      setError("Title, URL, Class, and Subject are required.");
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const payload: Omit<Resource, 'id' | 'schoolId'> = {
        title: form.title,
        url: form.url,
        description: form.description,
        classId: form.classId,
        subjectId: form.subjectId,
        type: form.type,
        teacherId: 'principal', 
      };
      await addResource(schoolId, payload);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save the resource. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setForm(INITIAL_FORM_STATE);
    setShowModal(true);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this learning resource?")) {
        try {
            await deleteResource(schoolId, id);
        } catch (error) {
            alert("Failed to delete resource.");
        }
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Learning Library</h1>
          <p className="text-slate-400 font-bold mt-3 text-xs uppercase tracking-[0.3em]">Curated educational content for students</p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
          <Plus size={20} /> Add Resource
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {resources.map(res => (
          <div key={res.id} className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group relative">
             <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleDelete(res.id)} className="p-3 bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-rose-600 rounded-2xl hover:bg-rose-50 transition-all shadow-sm"><Trash2 size={18}/></button>
            </div>
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner border border-slate-100 ${res.type === 'youtube_playlist' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
              {res.type === 'youtube_playlist' ? <Youtube size={32}/> : <LinkIcon size={32}/>}
            </div>
            <h3 className="font-black text-slate-900 dark:text-white text-xl leading-tight line-clamp-2 h-14">{res.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 h-12">{res.description}</p>
            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase">{getClassName(res.classId)}</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase">{getSubjectName(res.subjectId)}</span>
            </div>
          </div>
        ))}
        {resources.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white dark:bg-slate-800 rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                <Library size={80} className="mx-auto text-slate-100 mb-8" />
                <h3 className="text-2xl font-black text-slate-300">Library is Empty</h3>
                <p className="text-sm font-bold text-slate-300 mt-2 uppercase tracking-widest">Add your first learning resource to get started</p>
            </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={() => !isSaving && setShowModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[4rem] p-6 md:p-12 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center mb-12">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">New Resource</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Add to Learning Library</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-14 h-14 bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-slate-900 dark:text-white rounded-[1.5rem] flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 active:scale-90 transition-all"><X size={24}/></button>
             </div>
             <div className="space-y-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resource Title</label>
                    <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-6 py-4 bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-slate-100" placeholder="e.g. Physics Chapter 1 Notes" />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Link URL</label>
                    <input type="url" placeholder="https://..." className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-50 rounded-[2rem] text-sm font-bold focus:border-indigo-100 outline-none transition-all" value={form.url} onChange={e => setForm({...form, url: e.target.value})} />
                </div>
                
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-6 py-4 bg-white/80 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm h-24 resize-none" placeholder="Brief details about this resource..." />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Assign to Class</label>
                        <select value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-50 rounded-xl font-bold outline-none cursor-pointer focus:border-indigo-100 appearance-none text-sm">
                            <option value="">Choose Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Assign to Subject</label>
                        <select value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-50 rounded-xl font-bold outline-none cursor-pointer focus:border-indigo-100 appearance-none text-sm">
                            <option value="">Choose Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                {error && <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-bold text-center flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}
                <div className="pt-4">
                    <button onClick={handleSave} disabled={isSaving} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 disabled:opacity-50 active:scale-95 transition-all">
                        {isSaving ? 'Saving...' : 'Add to Library'}
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningResources;
