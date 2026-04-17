
import React, { useState } from 'react';
import { Award, Plus, X, Edit, Save } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { addExam } from '../../services/api.ts';
import { Exam } from '../../types.ts';

interface ExamsProps {
  profile: any;
  classes: any[];
  subjects: any[];
  exams: Exam[];
  students: any[];
}

const INITIAL_FORM_STATE = { title: '', classId: '', subjectId: '', date: '', totalMarks: 100 };

const Exams: React.FC<ExamsProps> = ({ profile, classes, subjects, exams, students }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const handleSave = () => {
    if (!form.title || !form.classId || !form.subjectId || !form.date) {
      alert("Please fill all fields.");
      return;
    }
    addExam(profile.schoolId, {
      ...form,
      totalMarks: Number(form.totalMarks),
      date: new Date(form.date),
      teacherId: profile.teacherId,
    });
    setShowModal(false);
    setForm(INITIAL_FORM_STATE);
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || '...';
  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return '...';
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };
  
  const studentsForSelectedExam = selectedExam ? students.filter(s => s.classId === selectedExam.classId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Exams & Marks" 
          subtitle="Create exams and manage student marks." 
          icon={<Award size={32} className="text-[#D4AF37] drop-shadow-md" />}
        />
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white rounded-xl text-xs font-black shadow-[0_4px_10px_rgba(107,29,47,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#4A1421] hover:from-[#4A1421] hover:to-[#2D0D14] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)] active:translate-y-[1px] transition-all">
          <Plus size={16} className="text-[#D4AF37]" /> Create Exam
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-b from-white to-[#FCFBF8] p-6 rounded-[2rem] border border-[#E5E0D8] dark:border-slate-700 shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] relative overflow-hidden">
           {/* Decorative elements */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           
           <h3 className="font-black text-[#6B1D2F] dark:text-white/40 uppercase tracking-widest text-[10px] mb-4 relative z-10">Created Exams</h3>
           <div className="space-y-3 relative z-10">
            {exams.map(exam => (
                <button key={exam.id} onClick={() => setSelectedExam(exam)} className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${selectedExam?.id === exam.id ? 'bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] text-white border-[#4A1421] shadow-[0_4px_15px_rgba(107,29,47,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]' : 'bg-white dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#D4AF37]/30 hover:shadow-md shadow-sm'}`}>
                    <p className={`font-black text-base ${selectedExam?.id === exam.id ? 'text-white' : 'text-[#6B1D2F] dark:text-white'}`}>{exam.title}</p>
                    <p className={`text-xs font-bold mt-1 ${selectedExam?.id === exam.id ? 'text-[#D4AF37]' : 'text-[#6B1D2F] dark:text-white/60'}`}>{getClassName(exam.classId)} &bull; {getSubjectName(exam.subjectId)}</p>
                </button>
            ))}
           </div>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-b from-white to-[#FCFBF8] p-6 rounded-[2rem] border border-[#E5E0D8] dark:border-slate-700 shadow-[0_8px_30px_rgba(107,29,47,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] relative overflow-hidden flex flex-col">
            {/* Decorative elements */}
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            
            {selectedExam ? (
                <div className="flex-1 flex flex-col relative z-10">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E0D8] dark:border-slate-700">
                        <div>
                            <h3 className="font-black text-xl text-[#6B1D2F] dark:text-white">{selectedExam.title}</h3>
                            <p className="text-xs font-bold text-[#6B1D2F] dark:text-white/40 uppercase tracking-widest mt-1">Enter Marks</p>
                        </div>
                        <div className="px-4 py-2 bg-[#FCFBF8] dark:bg-slate-900 rounded-xl border border-[#D4AF37]/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                            <span className="text-xs font-black text-[#6B1D2F] dark:text-white">Total: {selectedExam.totalMarks}</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {studentsForSelectedExam.map((student, index) => (
                            <div key={student.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FCFBF8] to-[#E5E0D8] text-[#6B1D2F] dark:text-white flex items-center justify-center font-black text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#E5E0D8] dark:border-slate-700/50">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-[#6B1D2F] dark:text-white">{student.name}</p>
                                        <p className="font-mono text-[10px] font-bold text-[#6B1D2F] dark:text-white/40 mt-0.5">{student.rollNo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-[#FCFBF8] dark:bg-slate-900 p-1.5 rounded-xl border border-[#E5E0D8] dark:border-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                    <input type="number" max={selectedExam.totalMarks} placeholder="0" className="w-16 p-2 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg text-sm text-center font-black text-[#6B1D2F] dark:text-white focus:border-[#D4AF37] outline-none shadow-sm transition-all" />
                                    <span className="text-xs font-black text-[#6B1D2F] dark:text-white/40 pr-2">/ {selectedExam.totalMarks}</span>
                                </div>
                            </div>
                        ))}
                        {studentsForSelectedExam.length === 0 && (
                            <div className="text-center py-12 text-[#6B1D2F] dark:text-white/40 font-bold text-sm bg-[#FCFBF8] dark:bg-slate-900 rounded-2xl border border-dashed border-[#E5E0D8] dark:border-slate-700">
                                No students found for this class.
                            </div>
                        )}
                    </div>
                     <button className="w-full mt-6 py-4 bg-gradient-to-r from-[#6B1D2F] to-[#4A1421] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(107,29,47,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#4A1421] hover:from-[#4A1421] hover:to-[#2D0D14] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)] active:translate-y-[1px] transition-all flex items-center justify-center gap-2">
                        <Save size={18} className="text-[#D4AF37]"/> Save All Marks
                     </button>
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full text-[#6B1D2F] dark:text-white/40 text-center p-10 relative z-10">
                    <div className="w-20 h-20 rounded-full bg-[#FCFBF8] dark:bg-slate-900 flex items-center justify-center mb-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] border border-[#E5E0D8] dark:border-slate-700">
                        <Award size={40} className="text-[#D4AF37]/40"/>
                    </div>
                    <p className="font-black text-lg text-[#6B1D2F] dark:text-white">No Exam Selected</p>
                    <p className="text-sm font-bold mt-1">Select an exam from the left panel to start entering marks.</p>
                </div>
            )}
        </div>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2D0D14]/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-gradient-to-b from-white to-[#FCFBF8] w-full max-w-lg rounded-[2.5rem] p-8 relative z-10 border border-[#D4AF37]/20 shadow-[0_20px_60px_rgba(107,29,47,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B1D2F] to-[#4A1421] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(107,29,47,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#4A1421]">
                        <Award size={24} className="text-[#D4AF37]" />
                    </div>
                    <h3 className="text-2xl font-black text-[#6B1D2F] dark:text-white tracking-tight">New Exam</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FCFBF8] dark:bg-slate-900 text-[#6B1D2F] dark:text-white/40 hover:bg-rose-50 hover:text-[#6B1D2F] dark:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
            
            <div className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white/40 uppercase tracking-widest ml-1">Exam Title</label>
                  <input type="text" placeholder="e.g., Mid-Term Physics" className="w-full p-4 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-2xl font-bold text-[#6B1D2F] dark:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:border-[#D4AF37] transition-all placeholder:text-[#6B1D2F] dark:text-white/20" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white/40 uppercase tracking-widest ml-1">Class</label>
                      <select className="w-full p-4 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-2xl font-bold text-[#6B1D2F] dark:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:border-[#D4AF37] transition-all appearance-none cursor-pointer" value={form.classId} onChange={e => setForm({...form, classId: e.target.value})}>
                          <option value="">Select Class</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white/40 uppercase tracking-widest ml-1">Subject</label>
                      <select className="w-full p-4 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-2xl font-bold text-[#6B1D2F] dark:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:border-[#D4AF37] transition-all appearance-none cursor-pointer" value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})}>
                          <option value="">Select Subject</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white/40 uppercase tracking-widest ml-1">Exam Date</label>
                    <input type="date" className="w-full p-4 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-2xl font-bold text-[#6B1D2F] dark:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:border-[#D4AF37] transition-all" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#6B1D2F] dark:text-white/40 uppercase tracking-widest ml-1">Total Marks</label>
                    <input type="number" className="w-full p-4 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-2xl font-bold text-[#6B1D2F] dark:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none focus:border-[#D4AF37] transition-all" value={form.totalMarks} onChange={e => setForm({...form, totalMarks: Number(e.target.value)})} />
                 </div>
              </div>
              <button onClick={handleSave} className="w-full mt-4 py-4 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(107,29,47,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#4A1421] hover:from-[#4A1421] hover:to-[#2D0D14] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)] active:translate-y-[1px] transition-all flex items-center justify-center gap-2">
                <Award size={18} className="text-[#D4AF37]"/> Create Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
