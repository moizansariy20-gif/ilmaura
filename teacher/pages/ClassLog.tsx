import React, { useState, useEffect, useMemo } from 'react';
import { BookCheck, Calendar, Book, Image as ImageIcon, X, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { UserProfile, Class, Subject, ClassLog as ClassLogType } from '../../types.ts';
import { subscribeToClassLogs, addClassLog, deleteClassLog } from '../../services/api.ts';
import { FirestoreError } from 'firebase/firestore';

interface ClassworkProps {
  profile: UserProfile;
  classes: Class[];
  subjects: Subject[];
}

const Classwork: React.FC<ClassworkProps> = ({ profile, classes, subjects }) => {
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
        setLogs(fetchedLogs.filter(log => log.type === 'classwork'));
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error(err);
        setError('Failed to load classwork entries.');
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [selectedClassId, profile.schoolId]);
  
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || '...';
  
  const filteredLogs = useMemo(() => {
      return logs.filter(log => log.date === date);
  }, [logs, date]);

  const handleSubmit = async () => {
    if (!selectedSubjectId) {
      alert("Please select a subject to post to.");
      return;
    }
    if (!content.trim()) {
      alert("Please write a note.");
      return;
    }
    setIsSaving(true);
    setError('');

    try {
      const logData: any = {
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        teacherId: profile.teacherId!,
        date: date,
        content: content,
        type: 'classwork',
      };
      
      await addClassLog(profile.schoolId!, logData);
      
      setContent('');
      setSelectedSubjectId('');
      setShowSuccessModal(true);

    } catch (err: any) {
        console.error("Classwork submission error:", err);
        setError(`Failed to save classwork: ${err.message || 'An unknown error occurred.'}`);
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDelete = (log: ClassLogType) => {
    setConfirmDeleteTarget(log);
  };

  const executeDelete = async () => {
    if (!confirmDeleteTarget) return;
    await deleteClassLog(profile.schoolId!, confirmDeleteTarget.id!);
    setConfirmDeleteTarget(null);
  };
  
  const subjectsForClass = useMemo(() => {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass?.subjectAssignments) return [];
    
    const assignedSubjectIds = Object.keys(selectedClass.subjectAssignments);
    return subjects.filter(s => assignedSubjectIds.includes(s.id));
  }, [selectedClassId, classes, subjects]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Daily Classwork Log</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-b from-white to-[#6B1D2F]/5 p-4 rounded-2xl border border-[#6B1D2F]/10 dark:border-slate-700 border-b-4 border-b-[#6B1D2F]/20 shadow-[0_8px_15px_rgba(107,29,47,0.08),0_3px_6px_rgba(107,29,47,0.04),inset_0_2px_0_rgba(255,255,255,1)]">
          <label className="text-xs font-bold text-slate-400">Class</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border-[#6B1D2F]/10 dark:border-slate-700 border rounded-lg font-bold text-sm shadow-inner outline-none focus:ring-2 focus:ring-[#6B1D2F]/10">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="bg-gradient-to-b from-white to-[#6B1D2F]/5 p-4 rounded-2xl border border-[#6B1D2F]/10 dark:border-slate-700 border-b-4 border-b-[#6B1D2F]/20 shadow-[0_8px_15px_rgba(107,29,47,0.08),0_3px_6px_rgba(107,29,47,0.04),inset_0_2px_0_rgba(255,255,255,1)]">
          <label className="text-xs font-bold text-slate-400">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 p-2 bg-white dark:bg-slate-800 border-[#6B1D2F]/10 dark:border-slate-700 border rounded-lg font-bold text-sm shadow-inner outline-none focus:ring-2 focus:ring-[#6B1D2F]/10" />
        </div>
      </div>
      
      <div className="bg-gradient-to-b from-white to-[#6B1D2F]/5 p-6 rounded-2xl border border-[#6B1D2F]/10 dark:border-slate-700 border-b-4 border-b-[#6B1D2F]/20 shadow-[0_8px_15px_rgba(107,29,47,0.08),0_3px_6px_rgba(107,29,47,0.04),inset_0_2px_0_rgba(255,255,255,1)]">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Post New Classwork</h3>
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What did you cover in class today?" className="w-full mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg h-24 text-sm"/>
        
        <div className="mt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-not-allowed">
              <ImageIcon size={14}/> 
              <span>Attach a Photo (Coming Soon)</span>
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="w-full sm:w-auto p-2 bg-slate-100 border-slate-200 dark:border-slate-700 border rounded-lg font-bold text-xs">
            <option value="">-- Select Subject --</option>
            {subjectsForClass.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
          <button onClick={handleSubmit} disabled={isSaving || !selectedSubjectId || !content.trim()} className="w-full sm:w-auto px-6 py-3 bg-[#6B1D2F] text-white rounded-lg text-xs font-black hover:bg-[#4A1421] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#6B1D2F]/20">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <BookCheck size={16}/>}
            Post to Class
          </button>
        </div>
        {error && (
          <div className="p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold mt-4">
            <p>{error}</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4">Posted for {date}</h2>
        {isLoading ? <Loader2 className="animate-spin text-slate-400" /> : (
            filteredLogs.length > 0 ? (
                <div className="space-y-4">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="bg-gradient-to-b from-white to-[#6B1D2F]/5 p-4 rounded-2xl border border-[#6B1D2F]/10 dark:border-slate-700 border-b-4 border-b-[#6B1D2F]/20 shadow-[0_8px_15px_rgba(107,29,47,0.08),0_3px_6px_rgba(107,29,47,0.04),inset_0_2px_0_rgba(255,255,255,1)] group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="px-2 py-1 bg-[#6B1D2F]/5 text-[#6B1D2F] dark:text-white rounded-md text-xs font-black">{getSubjectName(log.subjectId)}</span>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 mt-3 whitespace-pre-wrap">{log.content}</p>
                                </div>
                                <button onClick={() => handleDelete(log)} className="p-2 text-slate-300 hover:text-[#6B1D2F] dark:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg text-center">No classwork entries found for this day.</p>
        )}
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-10 animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><CheckCircle size={32} /></div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Posted!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">The classwork has been successfully posted for students to view.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-[#6B1D2F] text-white rounded-xl font-bold hover:bg-[#4A1421] transition-colors">
              Done
            </button>
          </div>
        </div>
      )}

      {confirmDeleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmDeleteTarget(null)}></div>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-10 animate-in zoom-in-95 text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
                    <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Delete Entry?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Are you sure you want to permanently delete this classwork log? This action cannot be undone.
                </p>
                <div className="mt-8 flex gap-3">
                    <button 
                        onClick={() => setConfirmDeleteTarget(null)}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={executeDelete}
                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Classwork;
