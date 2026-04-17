import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface RevenueControlProps {
  schools: any[];
}

const RevenueControl: React.FC<RevenueControlProps> = ({ schools }) => {
  const totalStudents = schools.reduce((acc, s) => acc + s.actualStudents, 0);
  const totalRev = totalStudents * 500;
  const totalReceivables = schools.filter(s => s.status === 'Suspended').reduce((acc, s) => acc + (s.actualStudents * 500), 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Financial Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Billing orchestrated across {schools.length} institute nodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Monthly Yield</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">₨ {(totalRev / 1000).toFixed(0)}k</h3>
            <div className="text-emerald-600 text-xs font-black bg-emerald-50 px-3 py-1 rounded-full">+12%</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending (In Arrears)</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">₨ {(totalReceivables / 1000).toFixed(0)}k</h3>
            <div className="text-rose-600 text-xs font-black bg-rose-50 px-3 py-1 rounded-full">Alert</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Network MRR Target</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">₨ 5.0M</h3>
            <TrendingUp size={24} className="text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/30">
          <h3 className="font-black text-slate-900 dark:text-white">Billing Ledger (₨ 500/std)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left responsive-table">
            <thead>
              <tr className="bg-white dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-8 py-5">Institute</th>
                <th className="px-8 py-5">Student Base</th>
                <th className="px-8 py-5">Platform Bill</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {schools.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:bg-slate-800/50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">{row.name}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300">{row.actualStudents}</td>
                  <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">₨ {(row.actualStudents * 500).toLocaleString()}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${row.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{row.status === 'Active' ? 'Paid' : 'Pending'}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-blue-600 text-xs font-black uppercase">Invoice</button>
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

export default RevenueControl;