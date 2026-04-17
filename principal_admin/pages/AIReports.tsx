import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkle, 
  ChartBar, 
  DownloadSimple, 
  WarningCircle, 
  CircleNotch, 
  FilePdf,
  CalendarBlank,
  Target,
  TrendUp,
  Clock,
  ArrowRight
} from 'phosphor-react';
import Markdown from 'react-markdown';
import { generateAIReport } from '../../geminiService.ts';
import { getAttendanceByRange, getTeacherAttendanceByRange } from '../../services/api.ts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AIReportsProps {
  schoolId: string;
  school: any;
  students: any[];
  teachers: any[];
  classes: any[];
  ledger: any[];
  expenses: any[];
}

const AIReports: React.FC<AIReportsProps> = ({ schoolId, school, students, teachers, classes, ledger, expenses }) => {
  const [reportType, setReportType] = useState('General Performance');
  const [timeframe, setTimeframe] = useState('Monthly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);
  const DAILY_LIMIT = 3;

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const key = `ai_usage_${schoolId}_${today}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    setUsageCount(count);
  }, [schoolId]);

  const incrementUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `ai_usage_${schoolId}_${today}`;
    const newCount = usageCount + 1;
    localStorage.setItem(key, newCount.toString());
    setUsageCount(newCount);
  };

  const handleGenerate = async () => {
    if (usageCount >= DAILY_LIMIT) {
      alert("Daily limit reached. You can generate up to 3 reports per day.");
      return;
    }

    setIsGenerating(true);
    setReport(null);

    try {
      const now = new Date();
      let startDate = new Date();
      
      if (timeframe === 'Daily') startDate.setDate(now.getDate() - 1);
      else if (timeframe === 'Weekly') startDate.setDate(now.getDate() - 7);
      else if (timeframe === 'Monthly') startDate.setMonth(now.getMonth() - 1);
      else if (timeframe === 'Yearly') startDate.setFullYear(now.getFullYear() - 1);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];

      const [attendanceRange, teacherAttendanceRange] = await Promise.all([
        getAttendanceByRange(schoolId, startDateStr, endDateStr),
        getTeacherAttendanceByRange(schoolId, startDateStr, endDateStr)
      ]);

      const reportData = {
        schoolName: school.name,
        reportType,
        timeframe,
        period: { from: startDateStr, to: endDateStr },
        stats: {
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalClasses: classes.length,
        },
        attendance: {
          studentAttendanceSummary: attendanceRange.reduce((acc: any, curr: any) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
          }, {}),
          teacherAttendanceSummary: teacherAttendanceRange.reduce((acc: any, curr: any) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
          }, {})
        },
        financials: {
          totalFeesCollected: ledger.reduce((sum, t) => sum + (t.amountPaid || 0), 0),
          totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
          recentTransactions: ledger.slice(0, 20).map(t => ({ amount: t.amountPaid, status: t.status, date: t.timestamp })),
          recentExpenses: expenses.slice(0, 20).map(e => ({ amount: e.amount, category: e.category, date: e.date }))
        }
      };

      const result = await generateAIReport(reportType, timeframe, reportData);
      setReport(result);
      incrementUsage();
    } catch (error) {
      console.error(error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${school.name}-${reportType}-${timeframe}-Report.pdf`);
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen">
      
      {/* Main Container matching Student Register style */}
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* Header matching Student Register style */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">
              School Reports
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                Report System
              </span>
              <span className="text-sm font-bold opacity-80 uppercase tracking-wide">
                Limit: {usageCount}/{DAILY_LIMIT} Used Today
              </span>
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            {report && (
              <button 
                onClick={exportPDF}
                className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-4 py-3 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors border-2 border-white flex items-center gap-2"
              >
                <FilePdf size={16} weight="fill"/> Export PDF
              </button>
            )}
            <button 
              onClick={() => window.print()}
              className="bg-[#be123c] text-white px-6 py-3 font-black text-xs uppercase tracking-widest hover:bg-[#9f1239] transition-colors border-2 border-[#be123c] shadow-lg flex items-center gap-2"
            >
              <DownloadSimple size={16} weight="fill"/> Print Report
            </button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Parameters Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col">
              <div className="px-6 py-4 border-b-2 border-slate-300 bg-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <Target size={18} weight="fill"/> Report Parameters
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Report Type</label>
                  <select 
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-none text-xs font-black p-3 focus:border-[#1e3a8a] outline-none uppercase"
                  >
                    <option>General Performance</option>
                    <option>Financial Health</option>
                    <option>Attendance Analysis</option>
                    <option>Academic Progress</option>
                    <option>Operational Efficiency</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Timeframe</label>
                  <select 
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-none text-xs font-black p-3 focus:border-[#1e3a8a] outline-none uppercase"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Yearly</option>
                  </select>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || usageCount >= DAILY_LIMIT}
                  className={`w-full py-4 text-white font-black uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2 rounded-none border-2 ${isGenerating || usageCount >= DAILY_LIMIT ? 'bg-slate-200 border-slate-200 cursor-not-allowed' : 'bg-[#1e3a8a] border-[#1e3a8a] hover:bg-[#172554]'}`}
                >
                  {isGenerating ? (
                    <>
                      <CircleNotch className="animate-spin" size={18} weight="bold" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FilePdf size={18} weight="fill" />
                      Generate Report
                    </>
                  )}
                </button>

                {usageCount >= DAILY_LIMIT && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-600">
                    <WarningCircle size={16} weight="fill" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Daily limit reached</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 border-2 border-blue-900 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Total Students</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{students.length}</h3>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 border-2 border-emerald-600 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Total Teachers</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{teachers.length}</h3>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <WarningCircle className="text-amber-600 shrink-0" size={20} weight="fill" />
                <div>
                  <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Note</h4>
                  <p className="text-[10px] text-amber-700 mt-1 leading-relaxed font-bold uppercase">
                    Reports are generated based on current system records. Ensure all data is updated for accuracy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm min-h-[700px] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b-2 border-slate-300 flex justify-between items-center bg-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <ChartBar size={18} weight="fill"/> Report Output
                </h3>
                {report && <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Generation Complete</span>}
              </div>

              <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-[#fcfcfc]">
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-slate-100 dark:border-slate-800 border-t-[#1e3a8a] rounded-none animate-spin"></div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Generating Report...</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 font-bold text-sm uppercase">Please wait while the system processes the school records.</p>
                    </div>
                  </div>
                ) : report ? (
                  <div ref={reportRef} className="bg-white dark:bg-slate-800 p-10 border border-slate-200 dark:border-slate-700 shadow-inner">
                    {/* Report Header */}
                    <div className="mb-10 pb-6 border-b-4 border-slate-900 flex justify-between items-end">
                      <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{school.name}</h2>
                        <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">School Operational Report</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="prose prose-slate max-w-none 
                      prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-slate-900
                      prose-h1:text-4xl prose-h1:border-b-2 prose-h1:border-slate-200 prose-h1:pb-4
                      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:text-[#1e3a8a]
                      prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-lg
                      prose-li:text-slate-700 prose-li:text-lg
                      prose-table:border-2 prose-table:border-slate-300
                      prose-th:bg-slate-800 prose-th:text-white prose-th:p-3 prose-th:uppercase prose-th:text-xs
                      prose-td:p-3 prose-td:border prose-td:border-slate-200 prose-td:text-sm
                      prose-strong:text-slate-900 prose-strong:font-black
                    ">
                      <Markdown>{report}</Markdown>
                    </div>

                    {/* Report Footer */}
                    <div className="mt-20 pt-6 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center opacity-50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reporting System</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confidential Administration Report</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <div className="w-40 h-40 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-8 border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <FilePdf size={80} className="text-slate-200" weight="fill" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-300 uppercase tracking-tighter italic">No Report Generated</h3>
                    <p className="text-slate-300 max-w-xs mx-auto mt-2 font-bold text-sm uppercase tracking-widest">Select parameters and click generate to view the report.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReports;
