
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusSignIcon as Plus, Delete01Icon as Trash2, Edit01Icon as Edit2, Cancel01Icon as X, FloppyDiskIcon as Save, Note01Icon as StickyNote, ArrowLeft01Icon as ArrowLeft } from 'hugeicons-react';
import { useAuth } from '../../hooks/useAuth.ts';
import { subscribeToStudentNotes, addStudentNote, updateStudentNote, deleteStudentNote } from '../../services/api.ts';
import { StudentNote } from '../../types.ts';
import Loader from '../../components/Loader.tsx';

interface NotesProps {
  profile: any;
  currentClass?: any;
}

const COLORS = [
  { id: 'white', bg: 'bg-[#FCFBF8] dark:bg-slate-800', border: 'border-[#D4AF37]/20' },
  { id: 'yellow', bg: 'bg-[#D4AF37]/10 dark:bg-[#D4AF37]/5', border: 'border-[#D4AF37]/40' },
  { id: 'blue', bg: 'bg-[#1e3a8a]/5 dark:bg-[#1e3a8a]/20', border: 'border-[#1e3a8a]/20' },
  { id: 'rose', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800/50' },
  { id: 'green', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/50' },
];

const Notes: React.FC<NotesProps> = ({ profile, currentClass }) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<StudentNote>>({ title: '', content: '', color: 'white' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile.schoolId && profile.studentDocId) {
      const unsub = subscribeToStudentNotes(
        profile.schoolId,
        profile.studentDocId,
        (data) => {
          setNotes(data);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setLoading(false);
        }
      );
      return () => unsub();
    } else {
        setLoading(false);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!currentNote.title || !currentNote.content) return;
    
    try {
      if (isEditing && currentNote.id) {
        await updateStudentNote(profile.schoolId, profile.studentDocId, currentNote.id, {
            title: currentNote.title,
            content: currentNote.content,
            color: currentNote.color
        });
      } else {
        await addStudentNote(profile.schoolId, profile.studentDocId, {
            title: currentNote.title!,
            content: currentNote.content!,
            color: currentNote.color as any || 'white'
        });
      }
      setShowModal(false);
      setCurrentNote({ title: '', content: '', color: 'white' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this note?")) {
      await deleteStudentNote(profile.schoolId, profile.studentDocId, id);
    }
  };

  const openEdit = (note: StudentNote) => {
    setCurrentNote(note);
    setIsEditing(true);
    setShowModal(true);
  };

  const openNew = () => {
    setCurrentNote({ title: '', content: '', color: 'white' });
    setIsEditing(false);
    setShowModal(true);
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
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">My Notes</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Academics</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Personal Study Notes
                </p>
              </div>
            </div>
            
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <StickyNote size={32} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-8">
          {loading ? (
            <Loader message="Loading Notes..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Add New Note Card */}
              <div 
                  onClick={openNew}
                  className="min-h-[200px] flex flex-col items-center justify-center bg-[#FCFBF8] dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-[#D4AF37]/30 text-[#1e3a8a]/40 dark:text-white/40 cursor-pointer hover:bg-[#D4AF37]/5 hover:border-[#D4AF37] hover:text-[#1e3a8a] dark:hover:text-[#D4AF37] transition-all group"
              >
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform border border-[#D4AF37]/20">
                      <Plus size={24} className="text-[#D4AF37]" />
                  </div>
                  <span className="font-bold text-sm">Create New Note</span>
              </div>

              {notes.map((note) => {
                  const theme = COLORS.find(c => c.id === note.color) || COLORS[0];
                  return (
                      <div key={note.id} className={`p-5 rounded-2xl border ${theme.border} ${theme.bg} shadow-sm relative group flex flex-col min-h-[200px] transition-all hover:shadow-md`}>
                          <div className="flex justify-between items-start mb-3">
                              <h3 className="font-black text-[#1e3a8a] dark:text-white text-lg leading-tight">{note.title}</h3>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); openEdit(note); }} className="p-1.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-full text-[#1e3a8a] dark:text-white"><Edit2 size={14}/></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id!); }} className="p-1.5 bg-white/50 dark:bg-slate-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-full text-rose-500"><Trash2 size={14}/></button>
                              </div>
                          </div>
                          <p className="text-sm text-[#1e3a8a]/70 dark:text-white/70 whitespace-pre-wrap flex-1">{note.content}</p>
                          <p className="text-[10px] text-[#D4AF37] mt-4 font-bold text-right">
                              {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'Just now'}
                          </p>
                      </div>
                  );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Note Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className={`w-full max-w-lg rounded-[2rem] p-6 relative z-10 shadow-2xl animate-in zoom-in-95 transition-colors duration-300 ${COLORS.find(c => c.id === currentNote.color)?.bg || 'bg-[#FCFBF8] dark:bg-slate-800'} border border-[#D4AF37]/20`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-[#1e3a8a] dark:text-white">{isEditing ? 'Edit Note' : 'New Note'}</h3>
                    <button onClick={() => setShowModal(false)} className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-[#1e3a8a] dark:text-white"><X size={20}/></button>
                </div>
                
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Title" 
                        className="w-full bg-transparent text-xl font-black placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30 text-[#1e3a8a] dark:text-white outline-none border-b border-[#D4AF37]/20 pb-2"
                        value={currentNote.title}
                        onChange={e => setCurrentNote({...currentNote, title: e.target.value})}
                    />
                    <textarea 
                        placeholder="Write your note here..." 
                        className="w-full bg-transparent text-sm font-medium placeholder:text-[#1e3a8a]/30 dark:placeholder:text-white/30 text-[#1e3a8a]/80 dark:text-white/80 outline-none h-40 resize-none"
                        value={currentNote.content}
                        onChange={e => setCurrentNote({...currentNote, content: e.target.value})}
                    />
                    
                    <div className="flex items-center justify-between pt-4 border-t border-[#D4AF37]/20">
                        <div className="flex gap-2">
                            {COLORS.map(c => (
                                <button 
                                    key={c.id} 
                                    onClick={() => setCurrentNote({...currentNote, color: c.id as any})}
                                    className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 ${c.bg} ${currentNote.color === c.id ? 'ring-2 ring-[#D4AF37] ring-offset-2 dark:ring-offset-slate-800' : ''}`}
                                />
                            ))}
                        </div>
                        <button onClick={handleSave} className="px-6 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2 border border-[#D4AF37]/30">
                            <Save size={16} /> Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
