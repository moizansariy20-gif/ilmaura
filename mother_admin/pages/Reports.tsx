import React from 'react';
import { Download, FileText, ChevronRight, PieChart } from 'lucide-react';

interface ReportsProps {
  schools: any[];
}

const Reports: React.FC<ReportsProps> = ({ schools }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Reports Hub</h1>
        <p className="text-slate-500 dark:text-slate-400">Global summary and detailed exports for {schools.length} schools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-64">
          <div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
              <PieChart size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Network Statistics</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Generate a complete PDF summary of all school operations.</p>
          </div>
          <button className="flex items-center gap-2 text-blue-600 font-bold text-sm">
            Download PDF Summary <ChevronRight size={16} />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-64">
          <div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Revenue Ledger</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Export CSV ledger for current month's collection.</p>
          </div>
          <button className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            Export CSV <Download size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-black text-slate-900 dark:text-white">School Attendance Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4">School</th>
                <th className="px-8 py-4">Avg Attendance</th>
                <th className="px-8 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {schools.map((school, i) => (
                <tr key={i}>
                  <td className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-white">{school.name}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${school.attendance}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{school.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button className="text-blue-600 text-xs font-black uppercase">Report</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;