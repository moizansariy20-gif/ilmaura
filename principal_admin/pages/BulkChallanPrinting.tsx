
import React, { useState, useMemo, useRef } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  Funnel, 
  FilePdf,
  WarningCircle,
  DownloadSimple,
  Archive,
  File
} from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Student, School, FeeTransaction } from '../../types.ts';
import FeeChallan from '../components/FeeChallan';

interface BulkChallanPrintingProps {
  students: Student[];
  classes: any[];
  school: School;
  ledger: FeeTransaction[];
}

const BulkChallanPrinting: React.FC<BulkChallanPrintingProps> = ({ students, classes, school, ledger }) => {
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
  });
  
  const [generatedChallans, setGeneratedChallans] = useState<{student: Student, transaction: FeeTransaction}[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const challanRefs = useRef<(HTMLDivElement | null)[]>([]);

  const months = useMemo(() => {
    const list = Array.from(new Set(ledger.map(t => t.month).filter(Boolean)));
    if (list.length === 0) {
       const d = new Date();
       list.push(`${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`);
    }
    return list.sort();
  }, [ledger]);

  const generateChallans = () => {
    const data = students
      .filter(s => selectedClassId === 'all' || s.classId === selectedClassId)
      .map(s => {
        const record = ledger.find(t => t.studentId === s.id && t.month === selectedMonth && (t.status === 'Pending' || t.status === 'Partial'));
        return { student: s, transaction: record };
      })
      .filter(item => item.transaction !== undefined);

    setGeneratedChallans(data as {student: Student, transaction: FeeTransaction}[]);
  };

  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    return cls ? cls.name : 'N/A';
  };

  const exportPDFs = async (type: 'single' | 'zip') => {
    setShowExportModal(false);
    setIsExporting(true);
    
    const canvasOptions = { scale: 2, useCORS: true, allowTaint: true };

    try {
        if (type === 'single') {
            const pdf = new jsPDF('l', 'mm', 'a4');
            for (let i = 0; i < challanRefs.current.length; i++) {
                const el = challanRefs.current[i];
                if (el) {
                    const canvas = await html2canvas(el, canvasOptions);
                    const imgData = canvas.toDataURL('image/png');
                    if (i > 0) pdf.addPage();
                    const imgWidth = 297;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                }
            }
            pdf.save(`challans_${selectedClassId}_${selectedMonth}.pdf`);
        } else {
            const zip = new JSZip();
            for (let i = 0; i < challanRefs.current.length; i++) {
                const el = challanRefs.current[i];
                const student = generatedChallans[i].student;
                if (el) {
                    const canvas = await html2canvas(el, canvasOptions);
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('l', 'mm', 'a4');
                    const imgWidth = 297;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                    zip.file(`challan_${student.name.replace(/\s+/g, '_')}.pdf`, pdf.output('blob'));
                }
            }
            const content = await zip.generateAsync({type: 'blob'});
            saveAs(content, `challans_${selectedClassId}_${selectedMonth}.zip`);
        }
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans pb-20">
      
      {/* Header */}
      <div className="no-print bg-white dark:bg-[#1e293b] border-b-2 border-slate-200 dark:border-[#334155] p-8 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#1e3a8a] dark:text-[#93c5fd] font-black uppercase text-[10px] tracking-widest mb-2 hover:translate-x-[-4px] transition-transform"
            >
              <ArrowLeft size={16} weight="bold"/> Back to Ledger
            </button>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1e3a8a] text-white flex items-center justify-center shadow-lg">
                <Printer size={28} weight="fill"/>
              </div>
              Bulk Challan Print
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 mt-10">
        {/* Controls */}
        <div className="bg-white dark:bg-[#1e293b] border-2 border-[#1e3a8a] shadow-sm flex flex-wrap items-center p-4 mb-8 gap-4">
            <div className="w-48">
             <select 
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
               className="w-full p-2 border-2 border-slate-200 dark:border-[#1e293b] font-bold text-xs uppercase tracking-widest outline-none bg-slate-50 dark:bg-[#020617]"
             >
               {months.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
             </div>
             
             <select 
               value={selectedClassId}
               onChange={(e) => setSelectedClassId(e.target.value)}
               className="w-48 p-2 border-2 border-slate-200 dark:border-[#1e293b] font-bold text-xs uppercase tracking-widest outline-none bg-slate-50 dark:bg-[#020617]"
             >
               <option value="all">All Classes</option>
               {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             
             <button 
                onClick={generateChallans}
                className="h-10 px-6 bg-[#1e3a8a] text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#1e40af] transition-colors"
             >
                Generate Challans
             </button>

             {generatedChallans.length > 0 && (
                <button 
                  onClick={() => setShowExportModal(true)}
                  disabled={isExporting}
                  className={`h-10 px-6 font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 ${isExporting ? 'bg-slate-400 text-slate-100 cursor-wait' : 'bg-[#10b981] text-white hover:bg-[#059669]'}`}
                >
                  {isExporting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></div>
                        Exporting...
                    </>
                  ) : (
                    <>
                        <DownloadSimple size={16} weight="bold"/> Export PDF
                    </>
                  )}
                </button>
             )}
        </div>

        {/* Previews */}
        <div className="flex flex-col gap-8">
            {generatedChallans.map(({ student, transaction }, idx) => (
                <div key={student.id} ref={el => { challanRefs.current[idx] = el; }} className="bg-white mx-auto w-[297mm] min-h-[210mm] shadow-lg border border-slate-200">
                    <FeeChallan 
                        student={{...student, className: getClassName(student.classId)}}
                        school={school}
                        transaction={transaction}
                    />
                </div>
            ))}

            {generatedChallans.length === 0 && (
                <div className="text-center py-20 opacity-30">
                    <Printer size={64} weight="thin" className="mx-auto mb-4"/>
                    <p className="font-black uppercase tracking-widest">Select filters and generate challans to see preview</p>
                </div>
            )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#0f172a] p-8 max-w-md w-full shadow-2xl border-4 border-[#1e3a8a]">
                <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Select Export Method</h2>
                <div className="flex flex-col gap-4">
                    <button 
                        onClick={() => exportPDFs('single')}
                        className="p-6 border-2 border-slate-200 hover:border-[#1e3a8a] text-left flex items-center gap-4 transition-colors group"
                    >
                        <File size={32} className="text-[#1e3a8a]"/>
                        <div>
                            <p className="font-black uppercase text-sm">Single PDF File</p>
                            <p className="text-[10px] text-slate-500 font-bold">Export all class challans into one document</p>
                        </div>
                    </button>
                    <button 
                        onClick={() => exportPDFs('zip')}
                        className="p-6 border-2 border-slate-200 hover:border-[#1e3a8a] text-left flex items-center gap-4 transition-colors group"
                    >
                        <Archive size={32} className="text-[#1e3a8a]"/>
                        <div>
                            <p className="font-black uppercase text-sm">Individual (ZIP Archive)</p>
                            <p className="text-[10px] text-slate-500 font-bold">Save each student's challan as separate PDF</p>
                        </div>
                    </button>
                </div>
                <button 
                    onClick={() => setShowExportModal(false)}
                    className="mt-8 w-full p-3 bg-slate-100 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200"
                >
                    Cancel
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default BulkChallanPrinting;
