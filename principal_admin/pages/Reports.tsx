import React from 'react';
import { Download, Users, DollarSign, ChevronRight } from 'lucide-react';

interface PrincipalReportsProps {
  students: any[];
  classes: any[];
  teachers: any[];
}

const Reports: React.FC<PrincipalReportsProps> = ({ students, classes, teachers }) => {
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return 'N/A';
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };
  
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleStudentExport = () => {
    const dataToExport = students.map(s => ({
      roll_number: s.rollNo,
      student_name: s.name,
      class: getClassName(s.classId),
      father_name: s.fatherName,
      parent_phone: s.phone,
      monthly_fee: s.monthlyFee,
      fee_status: s.feeStatus
    }));
    downloadCSV(dataToExport, `student-registry-${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const handleFeeExport = () => {
    const dataToExport = students.map(s => ({
      roll_number: s.rollNo,
      student_name: s.name,
      class: getClassName(s.classId),
      monthly_fee: s.monthlyFee,
      status: s.feeStatus,
    }));
    downloadCSV(dataToExport, `fee-ledger-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Reports Hub</h1>
        <p className="text-slate-500 dark:text-slate-400">Generate and download detailed operational data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Complete Student Registry</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Export a CSV file of all enrolled students with their complete details.</p>
          </div>
          <button onClick={handleStudentExport} className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-sm">
            Download Registry <Download size={16} />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
              <DollarSign size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Monthly Fee Ledger</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Export a CSV containing fee status for every student this month.</p>
          </div>
          <button onClick={handleFeeExport} className="mt-6 flex items-center gap-2 text-emerald-600 font-black text-sm">
            Download Ledger <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
