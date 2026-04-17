
import React, { useState } from 'react';
import { Wallet, Receipt, CheckCircle, Clock, WarningCircle, MagnifyingGlass, DownloadSimple, ArrowsClockwise } from 'phosphor-react';

interface PayrollRecord {
  id: string;
  name: string;
  role: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'Paid' | 'Pending' | 'Processing';
  month: string;
}

const PayrollManagement: React.FC<{ schoolId: string }> = ({ schoolId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([
    { id: 'T-101', name: 'Zeeshan Ahmed', role: 'Senior Teacher', basicSalary: 45000, allowances: 5000, deductions: 2000, netSalary: 48000, status: 'Paid', month: 'May 2024' },
    { id: 'T-102', name: 'Sana Khan', role: 'Junior Teacher', basicSalary: 35000, allowances: 3000, deductions: 1000, netSalary: 37000, status: 'Paid', month: 'May 2024' },
    { id: 'S-001', name: 'Ahmed Khan', role: 'Accountant', basicSalary: 40000, allowances: 4000, deductions: 1500, netSalary: 42500, status: 'Pending', month: 'May 2024' },
    { id: 'T-105', name: 'Bilal Hussain', role: 'Subject Specialist', basicSalary: 55000, allowances: 6000, deductions: 3000, netSalary: 58000, status: 'Processing', month: 'May 2024' },
  ]);

  const filteredPayroll = payrollData.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayroll = payrollData.reduce((acc, p) => acc + p.netSalary, 0);

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen">
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[80vh]">
        
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Payroll Management</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                Staff Salaries & Payslips
              </span>
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-4 py-3 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors border-2 border-white flex items-center gap-2 shadow-lg">
              <DownloadSimple size={18} weight="bold" /> Export Report
            </button>
            <button className="bg-emerald-500 text-white px-6 py-3 font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors border-2 border-emerald-400 shadow-lg active:translate-y-0.5 flex items-center gap-2">
              <ArrowsClockwise size={18} weight="bold" /> Generate Monthly Payroll
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 bg-white dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 p-6 border-2 border-[#1e3a8a] shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1e3a8a] text-white flex items-center justify-center border-2 border-slate-900">
                <Wallet size={24} weight="bold" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Net Salary</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">Rs. {totalPayroll.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 border-2 border-emerald-600 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 text-white flex items-center justify-center border-2 border-emerald-800">
                <CheckCircle size={24} weight="bold" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Personnel</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">2 / {payrollData.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 border-2 border-amber-600 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-600 text-white flex items-center justify-center border-2 border-amber-800">
                <Clock size={24} weight="bold" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Payments</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">Rs. {payrollData.filter(p => p.status !== 'Paid').reduce((acc, p) => acc + p.netSalary, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="SEARCH BY NAME OR ID..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-none text-sm font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all uppercase placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
               <select className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-none px-4 py-3 text-xs font-black text-slate-700 dark:text-slate-200 outline-none focus:border-black uppercase tracking-widest">
                  <option>May 2024</option>
                  <option>April 2024</option>
                  <option>March 2024</option>
               </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border-2 border-[#1e3a8a] shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-[#1e3a8a] border-b-2 border-[#1e3a8a] flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                <Receipt size={18} weight="fill"/> Payroll Roster
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Employee</th>
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Basic</th>
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Allowances</th>
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap text-rose-600">Deductions</th>
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Net Salary</th>
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Status</th>
                    <th className="px-4 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayroll.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{p.name}</p>
                          <p className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest">{p.id} • {p.role}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Rs. {p.basicSalary.toLocaleString()}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 whitespace-nowrap">+Rs. {p.allowances.toLocaleString()}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-500 whitespace-nowrap">-Rs. {p.deductions.toLocaleString()}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">Rs. {p.netSalary.toLocaleString()}</td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black text-white px-2 py-1 uppercase shadow-sm ${
                          p.status === 'Paid' ? 'bg-emerald-600' : 
                          p.status === 'Processing' ? 'bg-blue-600' : 
                          'bg-amber-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] hover:text-[#1e3a8a] text-slate-400 transition-all shadow-sm" title="View Payslip">
                            <Receipt size={14} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredPayroll.length} Payroll Records</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollManagement;
