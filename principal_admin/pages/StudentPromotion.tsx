import React, { useState, useEffect } from 'react';
import { 
  CaretRight, 
  CheckCircle, 
  XCircle, 
  UserMinus, 
  ArrowRight, 
  Funnel,
  Users,
  WarningCircle,
  CaretDown
} from 'phosphor-react';
import { supabase } from '../../services/supabase.ts';

interface StudentPromotionProps {
  schoolId: string;
  classes: any[];
  students: any[];
}

const StudentPromotion: React.FC<StudentPromotionProps> = ({ schoolId, classes, students }) => {
  const [fromClassId, setFromClassId] = useState<string>('');
  const [toClassId, setToClassId] = useState<string>('');
  const [allClassStudents, setAllClassStudents] = useState<any[]>([]);
  const [visibleStudents, setVisibleStudents] = useState<any[]>([]);
  const [promotionStatus, setPromotionStatus] = useState<Record<string, 'promote' | 'retain' | 'left'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const STUDENTS_PER_PAGE = 30;

  // Filter students when "From Class" changes
  useEffect(() => {
    if (fromClassId) {
      const classStudents = students.filter(s => s.classId === fromClassId && s.status !== 'Inactive');
      setAllClassStudents(classStudents);
      
      // Reset Pagination
      setPage(1);
      setVisibleStudents(classStudents.slice(0, STUDENTS_PER_PAGE));

      // Default all to 'promote'
      const initialStatus: Record<string, 'promote' | 'retain' | 'left'> = {};
      classStudents.forEach(s => {
        initialStatus[s.id] = 'promote';
      });
      setPromotionStatus(initialStatus);
    } else {
      setAllClassStudents([]);
      setVisibleStudents([]);
      setPromotionStatus({});
    }
  }, [fromClassId, students]);

  const loadMoreStudents = () => {
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * STUDENTS_PER_PAGE;
    const newBatch = allClassStudents.slice(startIndex, startIndex + STUDENTS_PER_PAGE);
    
    setVisibleStudents(prev => [...prev, ...newBatch]);
    setPage(nextPage);
  };

  const handleStatusChange = (studentId: string, status: 'promote' | 'retain' | 'left') => {
    setPromotionStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBulkPromote = async () => {
    if (!fromClassId) {
      setError("Please select a source class.");
      return;
    }
    if (!toClassId && Object.values(promotionStatus).some(s => s === 'promote')) {
      setError("Please select a destination class for promoted students.");
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      // Process ALL students, not just visible ones
      const updates = allClassStudents.map(student => {
        const action = promotionStatus[student.id];
        
        if (action === 'promote') {
          return {
            id: student.id,
            class_id: toClassId,
            // Optional: Update roll number logic here if needed
          };
        } else if (action === 'left') {
          return {
            id: student.id,
            status: 'Inactive',
            class_id: null // Remove from class
          };
        } else {
          // Retain: Do nothing or explicitly set same class
          return null; 
        }
      }).filter(Boolean); // Remove nulls

      if (updates.length === 0) {
        setSuccessMessage("No changes to apply.");
        setIsSubmitting(false);
        return;
      }

      // Perform updates in Supabase
      // We'll do this in a loop for now as Supabase JS doesn't have a simple bulk update for different values
      // For a real production app with thousands of students, we'd use an RPC function.
      
      const promises = updates.map(update => {
        return supabase
          .from('students')
          .update(update)
          .eq('id', update!.id)
          .eq('school_id', schoolId);
      });

      await Promise.all(promises);

      setSuccessMessage(`Successfully processed ${updates.length} students.`);
      setFromClassId('');
      setToClassId('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err: any) {
      console.error("Promotion Error:", err);
      setError("Failed to promote students. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return 'Unknown Class';
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-24 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Student Promotion</h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">Promote students to the next academic session in bulk</p>
        </div>
      </div>

      {/* Selection Card */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          
          {/* From Class */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Promote From</label>
            <div className="relative group">
              <select
                value={fromClassId}
                onChange={(e) => setFromClassId(e.target.value)}
                className="w-full pl-10 pr-10 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] rounded-none uppercase text-sm appearance-none transition-all cursor-pointer hover:bg-slate-100"
              >
                <option value="">-- Select Current Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Funnel size={20} className="absolute left-3 top-4 text-slate-400 group-hover:text-[#1e3a8a] transition-colors" />
              <CaretDown size={16} className="absolute right-3 top-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Arrow Icon */}
          <div className="hidden md:flex justify-center pb-4 text-slate-300">
            <ArrowRight size={32} weight="bold" className="text-slate-300" />
          </div>

          {/* To Class */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Promote To</label>
            <div className="relative group">
              <select
                value={toClassId}
                onChange={(e) => setToClassId(e.target.value)}
                className="w-full pl-10 pr-10 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#1e3a8a] rounded-none uppercase text-sm appearance-none transition-all cursor-pointer hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!fromClassId}
              >
                <option value="">-- Select Next Class --</option>
                {classes.filter(c => c.id !== fromClassId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Users size={20} className="absolute left-3 top-4 text-slate-400 group-hover:text-[#1e3a8a] transition-colors" />
              <CaretDown size={16} className="absolute right-3 top-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 flex items-center gap-3 text-rose-800 shadow-sm">
          <WarningCircle size={24} weight="fill" />
          <p className="font-bold uppercase text-xs tracking-wide">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 flex items-center gap-3 text-emerald-800 shadow-sm">
          <CheckCircle size={24} weight="fill" />
          <p className="font-bold uppercase text-xs tracking-wide">{successMessage}</p>
        </div>
      )}

      {/* Student List */}
      {fromClassId && visibleStudents.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1e3a8a] flex items-center justify-center text-white shadow-sm">
                    <Users size={24} weight="fill" />
                </div>
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xl uppercase tracking-tight">
                    Students in {getClassName(fromClassId)}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                        Total: {allClassStudents.length} Students
                    </p>
                </div>
            </div>
            
            <div className="px-6 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
              Target: <span className="text-[#1e3a8a] ml-2">{toClassId ? getClassName(toClassId) : 'Not Selected'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                  <th className="p-4 border-r border-slate-200 dark:border-slate-700 w-32">Roll No</th>
                  <th className="p-4 border-r border-slate-200 dark:border-slate-700">Student Name</th>
                  <th className="p-4 border-r border-slate-200 dark:border-slate-700">Father Name</th>
                  <th className="p-4 text-center w-[450px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visibleStudents.map(student => (
                  <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4 font-mono text-slate-600 font-bold text-sm border-r border-slate-200 dark:border-slate-700 group-hover:text-slate-900 dark:text-white">{student.rollNo || '-'}</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wide border-r border-slate-200 dark:border-slate-700 group-hover:text-[#1e3a8a] transition-colors">{student.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wide border-r border-slate-200 dark:border-slate-700">{student.fatherName}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3">
                        
                        {/* Promote Option */}
                        <button
                          onClick={() => handleStatusChange(student.id, 'promote')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            promotionStatus[student.id] === 'promote'
                              ? 'bg-emerald-600 text-white border-emerald-800 shadow-md'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <CheckCircle size={16} weight="fill" />
                          Promote
                        </button>

                        {/* Retain Option */}
                        <button
                          onClick={() => handleStatusChange(student.id, 'retain')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            promotionStatus[student.id] === 'retain'
                              ? 'bg-amber-500 text-white border-amber-700 shadow-md'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <XCircle size={16} weight="fill" />
                          Retain
                        </button>

                        {/* Left Option */}
                        <button
                          onClick={() => handleStatusChange(student.id, 'left')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            promotionStatus[student.id] === 'left'
                              ? 'bg-rose-600 text-white border-rose-800 shadow-md'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <UserMinus size={16} weight="fill" />
                          Left
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {visibleStudents.length < allClassStudents.length && (
            <div className="p-4 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
                <button 
                    onClick={loadMoreStudents}
                    className="px-8 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 dark:text-white transition-all flex items-center gap-2 rounded-none"
                >
                    Load More Students ({allClassStudents.length - visibleStudents.length} remaining)
                    <CaretDown weight="bold" />
                </button>
            </div>
          )}

          <div className="p-6 bg-slate-100 border-t-2 border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              onClick={handleBulkPromote}
              disabled={isSubmitting || !toClassId}
              className={`px-10 py-4 font-black text-xs uppercase tracking-widest text-white border-2 border-slate-900 shadow-lg transition-all flex items-center gap-3 rounded-none ${
                isSubmitting || !toClassId
                  ? 'bg-slate-400 cursor-not-allowed opacity-70 border-slate-500'
                  : 'bg-[#1e3a8a] hover:bg-[#172554] hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  Confirm Promotion <CaretRight size={16} weight="bold" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {fromClassId && allClassStudents.length === 0 && (
        <div className="text-center py-24 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300">
          <div className="w-20 h-20 bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400 border-2 border-slate-200 dark:border-slate-700">
            <Users size={40} weight="fill" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">No Students Found</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">There are no active students in the selected class</p>
        </div>
      )}

    </div>
  );
};

export default StudentPromotion;
