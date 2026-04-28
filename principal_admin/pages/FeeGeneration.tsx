import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CurrencyDollar, Calendar, PlusCircle, CheckCircle, WarningCircle } from 'phosphor-react';
import { bulkRecordFeeStatus, getExistingPendingFeeRecords, logActivity, updateFeeConfig } from '../../services/api.ts';

export const FeeGeneration: React.FC<{
  profile: any;
  schoolId: string;
  classes: any[];
  currentStudents: any[];
  feeSettings: any;
  onNavigate: any;
}> = ({ profile, schoolId, classes, currentStudents, feeSettings, onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const defaultMonth = `${new Date().toLocaleString('default', { month: 'long' })} ${currentYear}`;
  const [bulkForm, setBulkForm] = useState({ 
    classIds: [] as string[], 
    month: defaultMonth, 
    startingChallanNo: (feeSettings?.lastChallanNo ? feeSettings.lastChallanNo + 1 : 1001).toString(), 
    dueDate: '' 
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  const handleBulkGenerateChallans = async () => {
    if (bulkForm.classIds.length === 0 || !bulkForm.startingChallanNo) {
        setBulkError("Please select classes and starting challan number");
        return;
    }
    
    setIsGenerating(true);
    setBulkError('');
    setBulkSuccess('');

    try {
        let currentChallan = parseInt(bulkForm.startingChallanNo);
        
        const existing = await getExistingPendingFeeRecords(schoolId, bulkForm.month);
        const existingStudentIds = existing?.map(r => r.student_id) || [];

        const studentsToBill = currentStudents.filter(s => {
             const matchClass = bulkForm.classIds.includes('all') || bulkForm.classIds.includes(s.classId);
             const active = s.status !== 'Inactive';
             const isNew = !existingStudentIds.includes(s.id);
             return matchClass && active && isNew;
        });

        if (studentsToBill.length === 0) {
            setBulkSuccess(`No new records to generate. All selected students already billed for ${bulkForm.month}.`);
            setIsGenerating(false);
            return;
        }

        const statusUpdates = studentsToBill.map(student => ({
            studentId: student.id,
            studentName: student.name,
            classId: student.classId,
            month: bulkForm.month,
            amount: feeSettings.classFees[student.classId] || 0,
            status: 'Pending',
            challanNo: `${currentChallan++}`,
            dueDate: bulkForm.dueDate,
        }));
        
        // Pass profile info to satisfy RLS
        await bulkRecordFeeStatus(schoolId, statusUpdates, profile.name); 

        // Update lastChallanNo in feeConfig
        await updateFeeConfig(schoolId, {
            ...feeSettings,
            lastChallanNo: currentChallan - 1
        });

        await logActivity({ schoolId: schoolId, action: 'Bulk Generate Records', details: `Generated ${statusUpdates.length} pending fee records for ${bulkForm.month}`, role: 'Principal' } as any);
        
        if ((window as any).refreshPrincipalData) {
            (window as any).refreshPrincipalData();
        }
        
        setBulkSuccess(`Successfully generated ${statusUpdates.length} new unpaid records!`);
    } catch (err) {
        console.error(err);
        setBulkError("Failed to generate records");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      <div className="w-full max-w-[1200px] mx-auto bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col min-h-[70vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">
                    Fee Generation
                </h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="bg-white dark:bg-[#1e293b] text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                         Bulk Fees
                     </span>
                </div>
            </div>
            <div className="mt-4 md:mt-0">
                <button 
                  onClick={() => onNavigate('fees_ledger')}
                  className="px-6 py-2 bg-white text-[#1e3a8a] font-black text-xs uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  View Ledger
                </button>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="p-8 bg-slate-50 dark:bg-[#020617]/50 flex flex-col items-center justify-center flex-1">
            
            <div className="w-full max-w-2xl bg-white dark:bg-[#1e293b] border-4 border-slate-900 p-8 shadow-sm">
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-rose-600 text-white flex items-center justify-center border-2 border-slate-900">
                        <CurrencyDollar size={24} weight="fill" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">Fee Generation</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Create monthly fees for all students</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1 ml-1">Select Classes</label>
                        <select 
                            multiple 
                            value={bulkForm.classIds}
                            onChange={e => setBulkForm({...bulkForm, classIds: Array.from(e.target.selectedOptions, option => option.value)})}
                            className="w-full p-3 bg-slate-100 border-2 border-slate-900 font-bold outline-none text-sm min-h-[120px] focus:bg-white transition-colors"
                        >
                            <option value="all" className="font-black uppercase py-2">--- ALL CLASSES ---</option>
                            {classes.map(c => <option key={c.id} value={c.id} className="py-1 font-bold uppercase">{c.name}</option>)}
                        </select>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-2 ml-1">Hold Ctrl (Cmd) to select multiple classes</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1 ml-1">Fees Month</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select 
                                    value={bulkForm.month} 
                                    onChange={e => setBulkForm({...bulkForm, month: e.target.value})} 
                                    className="w-full pl-10 p-3 bg-slate-100 border-2 border-slate-900 font-black outline-none text-sm uppercase appearance-none"
                                >
                                    {[-1, 0, 1, 2].map(yearOffset => {
                                        const year = new Date().getFullYear() + yearOffset;
                                        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => {
                                            const monthName = new Date(year, m, 1).toLocaleString('default', { month: 'long' });
                                            const value = `${monthName} ${year}`;
                                            return <option key={value} value={value}>{value}</option>;
                                        });
                                    })}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1 ml-1">Due Date</label>
                            <input 
                                type="date" 
                                value={bulkForm.dueDate} 
                                onChange={e => setBulkForm({...bulkForm, dueDate: e.target.value})} 
                                className="w-full p-3 bg-slate-100 border-2 border-slate-900 font-black outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1 ml-1">Starting Invoice #</label>
                        <input 
                            type="number" 
                            value={bulkForm.startingChallanNo} 
                            onChange={e => setBulkForm({...bulkForm, startingChallanNo: e.target.value})} 
                            className="w-full p-3 bg-slate-100 border-2 border-slate-900 font-black outline-none text-sm"
                            placeholder="E.G. 1001"
                        />
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={handleBulkGenerateChallans}
                            disabled={isGenerating}
                            className="w-full py-5 bg-[#1e3a8a] text-white font-black text-sm uppercase tracking-widest border-b-4 border-r-4 border-slate-950 active:translate-x-[2px] active:translate-y-[2px] active:border-b-0 active:border-r-0 hover:bg-blue-900 transition-all flex items-center justify-center gap-3"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={22} weight="fill" />
                                    Create Fees Now
                                </>
                            )}
                        </button>
                    </div>

                    {bulkError && (
                        <div className="bg-rose-50 border-2 border-rose-600 p-4 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-rose-700">
                                <WarningCircle size={20} weight="fill" />
                                <span className="font-black text-xs uppercase tracking-tight">{bulkError}</span>
                            </div>
                        </div>
                    )}

                    {bulkSuccess && (
                        <div className="bg-emerald-50 border-2 border-emerald-600 p-4 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle size={20} weight="fill" />
                                <span className="font-black text-xs uppercase tracking-tight">{bulkSuccess}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-[#1e3a8a] border-dashed">
                    <p className="text-[10px] font-bold text-[#1e3a8a] dark:text-blue-300 uppercase leading-relaxed text-center">
                        Note: This process will generate "Unpaid" records for all selected students who haven't been billed for the selected month yet.
                    </p>
                </div>
            </div>

            <div className="mt-12 text-center text-slate-400">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Fee Control v2.0</p>
            </div>
        </div>
      </div>
    </div>
  );
};
