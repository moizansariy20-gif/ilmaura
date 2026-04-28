import React, { useMemo, useState, useEffect } from 'react';
import { Carousel } from '@/components/Carousel.tsx';
import { 
  Student, ChalkboardTeacher, Wallet, WarningCircle, ChartBar, Bank, 
  UserPlus, Receipt, BellRinging, Coins, ListBullets, 
  DownloadSimple, UsersThree, ChartPie, CalendarCheck, CaretDown,
  ArrowRight, ShieldWarning, Chalkboard, UserMinus, CaretLeft, CaretRight, Star, CalendarBlank,
  GenderMale, GenderFemale, Briefcase, IdentificationCard, Clock, FileText, TrendUp, Target, Cake, Gift,
  Megaphone, CheckCircle, ClockCounterClockwise, CalendarPlus, RadioButton, UserList, X, FileCsv, FilePdf, FileXls, Check, Books,
  SquaresFour, Users, GraduationCap, Palette
} from 'phosphor-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import {
  UserCircleIcon,
  Calendar03Icon,
  Book01Icon,
  Note01Icon,
  Wallet01Icon,
  CreditCardIcon,
  Notification01Icon,
  Award01Icon,
  Home01Icon,
  DashboardSquare01Icon,
  Settings01Icon,
  Clock01Icon,
  Megaphone01Icon,
  UserBlock01Icon,
  Coins01Icon
} from 'hugeicons-react';
import { motion } from 'motion/react';
import { AttendanceRecord, Complaint } from '../../types.ts';
import { fetchPublicHolidays } from '../../services/calendarService.ts';
import { subscribeToComplaints } from '../../services/api.ts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PrincipalDashboardProps {
  school: any;
  teachers: any[];
  students: any[];
  classes: any[];
  todaysAttendance: AttendanceRecord[];
  todaysTeacherAttendance: any[];
  expenses: any[];
  enquiries: any[];
  announcements: any[];
  ledger: any[];
  dashboardSummary?: any;
  onNavigate: (tab: string) => void;
}

// Solid, Deep Colors for Charts
const COLORS = ['#0f172a', '#1e3a8a', '#1d4ed8', '#0369a1', '#047857', '#b91c1c', '#1e3a8a', '#D4AF37'];

// Mock Complaints Data
const MOCK_COMPLAINTS = [
    { id: 1, type: 'Facility', subject: 'AC not cooling in Grade 5', status: 'Open', date: 'Today', priority: 'High' },
    { id: 2, type: 'Transport', subject: 'Bus Route 4 Late Arrival', status: 'Pending', date: 'Yesterday', priority: 'Medium' },
    { id: 3, type: 'Academic', subject: 'Math Syllabus Lagging', status: 'Resolved', date: '2 days ago', priority: 'Low' },
    { id: 4, type: 'Parent', subject: 'Fee Challan Correction', status: 'Open', date: '3 days ago', priority: 'High' },
];

// Mock Events Data
const MOCK_EVENTS = [
    { id: 1, title: 'Annual Sports Day 2024', date: '2024-03-15', type: 'Event', status: 'Upcoming', audience: 'All Students' },
    { id: 2, title: 'Parent-Teacher Meeting (Term 1)', date: '2024-03-20', type: 'Meeting', status: 'Scheduled', audience: 'Parents' },
    { id: 3, title: 'Ramadan Timings Notification', date: '2024-03-10', type: 'Notice', status: 'Active', audience: 'All Staff & Students' },
    { id: 4, title: 'Science Exhibition Setup', date: '2024-04-05', type: 'Activity', status: 'Planning', audience: 'Science Dept' },
];

// --- MEMOIZED SUB-COMPONENTS ---

// SAFELIST FOR TAILWIND: border-blue-900 border-emerald-600 border-slate-700 border-rose-900 border-indigo-700 border-cyan-600 border-pink-500 border-orange-600 border-amber-500 border-[#1e3a8a] border-[#7c3aed] border-[#ea580c]

// SAFELIST FOR TAILWIND: border-blue-900 border-emerald-600 border-slate-700 border-rose-900 border-indigo-700 border-cyan-600 border-pink-500 border-orange-600 border-amber-500 border-[#1e3a8a] border-[#7c3aed] border-[#ea580c]

const StatCard = React.memo(({ icon: Icon, label, value, color, onClick }: any) => {
  const borderColor = color.replace('bg-', 'border-');
  return (
    <button 
      onClick={onClick}
      className={`bg-white dark:bg-[#1e293b] p-6 min-h-[120px] rounded-none border-2 ${borderColor} transition-all flex items-center gap-4 group text-left w-full hover:shadow-md`}
    >
      <div className={`w-14 h-14 rounded-none ${color} flex items-center justify-center text-white transition-all`}>
        <Icon size={28} weight="fill" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
      </div>
    </button>
  );
});

const MobileStatCard = React.memo(({ icon: Icon, label, value, onClick }: any) => {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-b from-white to-slate-50 border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:scale-95 transition-all w-full"
    >
      <Icon size={24} weight="fill" className="text-[#1e3a8a] mb-1" />
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 text-center leading-tight">{label}</p>
      <p className="text-xs font-black leading-none text-[#1e3a8a] mt-1">{value}</p>
    </button>
  );
});

const ChartContainer = React.memo(({ title, icon: Icon, children, extra }: any) => (
  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#1e293b] shadow-sm rounded-none p-6 flex flex-col h-full">
    <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-[#1e293b] pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-none flex items-center justify-center text-[#1e3a8a] dark:text-blue-400">
          <Icon size={20} weight="bold" />
        </div>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{title}</h3>
      </div>
      {extra}
    </div>
    <div className="flex-1 min-h-[300px]">
      {children}
    </div>
  </div>
));

const AttendancePieChart = React.memo(({ data, rate }: any) => (
  <div className="h-full w-full relative">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={110}
          paddingAngle={8}
          dataKey="value"
          stroke="none"
        >
          <Cell fill="#1e3a8a" />
          <Cell fill="#cbd5e1" />
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-4xl font-black text-[#1e3a8a] dark:text-white leading-none">{rate}%</span>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Present</span>
    </div>
  </div>
));

const ClassAttendanceBarChart = React.memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
      <XAxis type="number" hide />
      <YAxis 
        dataKey="name" 
        type="category" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
        width={60}
      />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} />
    </BarChart>
  </ResponsiveContainer>
));

const CustomTooltip = React.memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#1e293b] p-3 shadow-xl rounded-none">
        <p className="font-bold text-slate-900 dark:text-white uppercase text-xs mb-1">{label || payload[0].name}</p>
        {payload.map((p: any, index: number) => (
           <p key={index} className="text-slate-700 dark:text-slate-300 font-bold text-xs">
              {p.name}: {p.value.toLocaleString()}
           </p>
        ))}
      </div>
    );
  }
  return null;
});

const RevenueBarChart = React.memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis 
        dataKey="name" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
      />
      <YAxis 
        axisLine={false} 
        tickLine={false} 
        tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
      />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
      <Bar dataKey="Collected" fill="#047857" radius={[4, 4, 0, 0]} barSize={30} />
      <Bar dataKey="Pending" fill="#be123c" radius={[4, 4, 0, 0]} barSize={30} />
    </BarChart>
  </ResponsiveContainer>
));

const GenderDistributionChart = React.memo(({ data }: any) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={90}
        paddingAngle={5}
        dataKey="value"
        stroke="none"
      >
        {data.map((entry: any, index: number) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
    </PieChart>
  </ResponsiveContainer>
));

const Dashboard: React.FC<PrincipalDashboardProps> = ({ 
  school, teachers, students, classes, todaysAttendance, 
  todaysTeacherAttendance, expenses, enquiries, announcements, ledger, 
  dashboardSummary, onNavigate 
}) => {
  
  const handleNavigate = React.useCallback((tab: string) => {
    onNavigate(tab);
  }, [onNavigate]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState<string>('all');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  
  // --- CALENDAR STATE ---
  const [viewDate, setViewDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Record<string, string>>({});

  // --- EXPORT MODAL STATE ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [exportOptions, setExportOptions] = useState({
      students: true,
      teachers: true,
      fees: true,
      attendance: true,
      expenses: true
  });

  useEffect(() => {
    if (!school?.id) return;
    const unsub = subscribeToComplaints(school.id, (data) => {
        setComplaints(data);
    }, console.error);
    return () => unsub();
  }, [school?.id]);

  useEffect(() => {
    const loadHolidays = async () => {
        const hols = await fetchPublicHolidays(viewDate.getFullYear());
        setHolidays(hols);
    };
    loadHolidays();
  }, [viewDate.getFullYear()]);

  // --- OPTIMIZED LOOKUP MAPS (O(1) Performance) ---
  const studentMap = useMemo(() => {
    const map = new Map();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  const teacherMap = useMemo(() => {
    const map = new Map();
    teachers.forEach(t => map.set(t.id, t));
    return map;
  }, [teachers]);

  const classMap = useMemo(() => {
    const map = new Map();
    classes.forEach(c => map.set(c.id, c));
    return map;
  }, [classes]);

  // --- DATA PROCESSING ---
  const presentStudents = useMemo(() => dashboardSummary?.count_present_today ?? todaysAttendance.filter(rec => rec.status === 'Present').length, [dashboardSummary, todaysAttendance]);
  const totalStudents = useMemo(() => dashboardSummary?.count_students ?? students.length, [dashboardSummary, students]);
  const absentStudents = totalStudents - presentStudents; 
  const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

  const attendancePieData = useMemo(() => [
      { name: 'Present', value: presentStudents },
      { name: 'Absent', value: absentStudents }
  ], [presentStudents, absentStudents]);

  // 2. Class-wise Attendance
  const classAttendanceGraphData = useMemo(() => {
    if (selectedAttendanceClass === 'all') {
        return classes
          .map((cls, index) => {
            const presentInClass = todaysAttendance.filter(r => r.classId === cls.id && r.status === 'Present').length;
            return {
              name: cls.name.replace('Class', '').replace('Grade', '').trim(), 
              value: presentInClass,
              fill: COLORS[index % COLORS.length]
            };
          })
          .filter(d => d.value > 0)
          .sort((a, b) => b.value - a.value);
    } else {
        const studentsInClass = students.filter(s => s.classId === selectedAttendanceClass);
        const total = studentsInClass.length;
        const present = todaysAttendance.filter(r => r.classId === selectedAttendanceClass && r.status === 'Present').length;
        const absent = total - present;
        
        return [
            { name: 'Present', value: present, fill: '#1e3a8a' }, // Solid Navy
            { name: 'Absent', value: absent, fill: '#1e3a8a' }  // Solid Navy
        ];
    }
  }, [classes, todaysAttendance, selectedAttendanceClass, students]);


  // Staff Stats
  const staffPresent = todaysTeacherAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const totalStaff = dashboardSummary?.count_staff ?? teachers.length;
  const staffAbsent = totalStaff - staffPresent;

  // 3. Gender Data (SHARP)
  const boysCount = useMemo(() => students.filter(s => s.customData?.gender === 'Male' || !s.customData?.gender).length, [students]);
  const girlsCount = useMemo(() => students.filter(s => s.customData?.gender === 'Female').length, [students]);
  const genderData = useMemo(() => [
      { name: 'Boys', value: boysCount, color: '#1e3a8a' }, // Deep Navy
      { name: 'Girls', value: girlsCount, color: '#be123c' } // Deep Rose
  ], [boysCount, girlsCount]);

  // 4. Financials (Month-Aware)
  const financialStats = useMemo(() => {
    // 1. Determine the "Active Month" for the dashboard
    // We'll pick the most recent month present in the ledger
    let targetMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (ledger && ledger.length > 0) {
        // Find the most recent transaction/challan
        const sortedLedger = [...ledger].sort((a, b) => {
            const dateA = a.timestamp?.seconds || a.timestamp?.toDate?.()?.getTime() || 0;
            const dateB = b.timestamp?.seconds || b.timestamp?.toDate?.()?.getTime() || 0;
            return dateB - dateA;
        });
        if (sortedLedger[0]?.month) {
            targetMonth = sortedLedger[0].month;
        }
    }

    // 2. Filter transactions for this month
    const monthTransactions = ledger.filter(t => t.month === targetMonth);

    // 3. Calculate stats for this month
    let totalCollectible = 0;
    let totalCollected = 0;

    monthTransactions.forEach(t => {
        if (t.type === 'challan' || !t.type) { 
            totalCollectible += (t.amount || t.amountPaid || 0);
        }
        if (t.status === 'Success' && t.amountPaid > 0) {
            totalCollected += t.amountPaid;
        }
    });

    const totalPending = totalCollectible - totalCollected;
    
    const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    const todaysExpenses = expenses
        .filter(exp => exp.date === new Date().toISOString().split('T')[0])
        .reduce((acc, exp) => acc + (exp.amount || 0), 0);

    const cashInHand = totalCollected - totalExpenses;

    return { 
        totalCollectible, 
        totalCollected, 
        totalPending, 
        totalExpenses, 
        todaysExpenses, 
        cashInHand,
        activeMonth: targetMonth
    };
  }, [students, school.feeConfig, expenses, ledger]);

  // 5. Birthdays
  const todaysBirthdayStudents = useMemo(() => {
    const todayStr = new Date().toISOString().slice(5, 10); // MM-DD
    return students.filter(s => {
        const dob = s.dob || s.customData?.dob;
        return dob && dob.endsWith(todayStr);
    });
  }, [students]);

  const todaysBirthdayStudentsCount = dashboardSummary?.count_birthdays ?? todaysBirthdayStudents.length;
  const openComplaintsCount = dashboardSummary?.count_complaints ?? complaints.filter(c => c.status === 'Open').length;

  // 6. Revenue Bar Chart (Month-Aware)
  const classFeeData = useMemo(() => {
      const targetMonth = financialStats.activeMonth;
      const monthTransactions = ledger.filter(t => t.month === targetMonth);

      return classes
        .sort((a,b) => a.name.localeCompare(b.name))
        .map(cls => {
          const classTrans = monthTransactions.filter(t => t.classId === cls.id);
          
          let collected = 0;
          let pending = 0;

          classTrans.forEach(t => {
              if (t.status === 'Success' && t.amountPaid > 0) {
                  collected += t.amountPaid;
              } else if (t.status === 'Pending') {
                  pending += (t.amount || t.amountPaid || 0);
              }
          });

          return {
              name: cls.name.replace('Class', '').replace('Grade', '').trim(), 
              Collected: collected,
              Pending: pending
          };
      });
  }, [classes, students, school.feeConfig, ledger, financialStats.activeMonth]);

  // 7. Defaulters (Month-Aware)
  const unpaidStudents = useMemo(() => {
    const targetMonth = financialStats.activeMonth;
    const pendingTrans = ledger.filter(t => t.month === targetMonth && t.status === 'Pending');
    
    return pendingTrans.map(t => {
        const student = studentMap.get(t.studentId);
        return {
            ...student,
            pendingAmount: t.amount || t.amountPaid || 0,
            month: t.month
        };
    }).filter(s => s && s.id); 
  }, [ledger, studentMap, financialStats.activeMonth]);

  const topDefaulters = unpaidStudents.slice(0, 8);

  // 8. New Chart Data (Month-Aware)
  const { paidCount, pendingCountForMonth } = useMemo(() => {
    const paidCount = ledger.filter(t => t.month === financialStats.activeMonth && t.status === 'Success').length;
    const pendingCountForMonth = ledger.filter(t => t.month === financialStats.activeMonth && t.status === 'Pending').length;
    return { paidCount, pendingCountForMonth };
  }, [ledger, financialStats.activeMonth]);

  // Fee Status Donut
  const feeStatusData = useMemo(() => [
      { name: 'Paid', value: paidCount, color: '#047857' }, // Emerald
      { name: 'Pending', value: pendingCountForMonth, color: '#be123c' } // Rose
  ], [paidCount, pendingCountForMonth]);

  // Complaints Donut
  const { openCount, resolvedCount } = useMemo(() => {
    const openCount = complaints.filter(c => c.status === 'Open').length;
    const resolvedCount = complaints.length - openCount;
    return { openCount, resolvedCount };
  }, [complaints]);

  const complaintChartData = useMemo(() => [
      { name: 'Open', value: openCount, color: '#f97316' }, // Orange
      { name: 'Resolved', value: resolvedCount, color: '#64748b' } // Slate
  ], [openCount, resolvedCount]);

  // Enrollment Donut (New vs Old)
  const { newStudents, oldStudents } = useMemo(() => {
    const newStudents = students.filter(s => s.category === 'New').length;
    const oldStudents = students.length - newStudents;
    return { newStudents, oldStudents };
  }, [students]);

  const enrollmentData = useMemo(() => [
      { name: 'New Adm', value: newStudents, color: '#7c3aed' }, // Violet
      { name: 'Returning', value: oldStudents, color: '#1e3a8a' } // Navy
  ], [newStudents, oldStudents]);
  

  // --- EXPORT FUNCTIONALITY ---
  const handleExport = () => {
      try {
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `School_Backup_${timestamp}`;

        // Prepare Data
        const dataToExport: any = {};

        // Helper to flatten objects (handle nested customData)
        const flattenObject = (obj: any, prefix = '') => {
            return Object.keys(obj).reduce((acc: any, k) => {
            const pre = prefix.length ? prefix + ' ' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof Date)) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
            }, {});
        };

        if (exportOptions.students) {
            dataToExport['Students'] = students.map(s => {
                const flatStudent = flattenObject(s);
                flatStudent['Class Name'] = classes.find(c => c.id === s.classId)?.name || s.classId;
                return flatStudent;
            });
        }

        if (exportOptions.teachers) {
            dataToExport['Teachers'] = teachers.map(t => flattenObject(t));
        }

        if (exportOptions.fees) {
            dataToExport['Fees_Summary'] = classFeeData.map(c => ({
                "Class": c.name,
                "Collected": c.Collected,
                "Pending": c.Pending,
                "Total": c.Collected + c.Pending
            }));
        }

        if (exportOptions.expenses) {
            dataToExport['Expenses'] = expenses.map(e => flattenObject(e));
        }

        if (exportOptions.attendance) {
            dataToExport['Attendance_Today'] = todaysAttendance.map(a => {
                const flatAtt = flattenObject(a);
                flatAtt['Class Name'] = classes.find(c => c.id === a.classId)?.name || a.classId;
                flatAtt['Time'] = a.timeIn || '-';
                return flatAtt;
            });
        }

        // EXPORT LOGIC
        if (exportFormat === 'xlsx') {
            const wb = XLSX.utils.book_new();
            Object.keys(dataToExport).forEach(sheetName => {
                const data = dataToExport[sheetName];
                if (data && data.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(data);
                    const colWidths = Object.keys(data[0]).map(key => ({ wch: Math.max(key.length, 15) }));
                    ws['!cols'] = colWidths;
                    XLSX.utils.book_append_sheet(wb, ws, sheetName);
                }
            });
            XLSX.writeFile(wb, `${fileName}.xlsx`);
        } 
        else if (exportFormat === 'csv') {
            const firstKey = Object.keys(dataToExport)[0];
            if (firstKey) {
                const ws = XLSX.utils.json_to_sheet(dataToExport[firstKey]);
                const csv = XLSX.utils.sheet_to_csv(ws);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `${fileName}_${firstKey}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        else if (exportFormat === 'pdf') {
            const doc = new jsPDF('l', 'mm', 'a4'); 
            
            // Header
            doc.setFillColor(30, 58, 138); 
            doc.rect(0, 0, 297, 30, 'F'); 
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(school.name || "School Report", 14, 15);
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
            doc.text("Confidential Report", 280, 22, { align: 'right' });

            let yPos = 40;

            Object.keys(dataToExport).forEach((key) => {
                const data = dataToExport[key];
                if (data.length > 0) {
                    if (yPos > 180) { doc.addPage(); yPos = 20; }
                    
                    doc.setTextColor(30, 58, 138);
                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");
                    doc.text(key.replace('_', ' '), 14, yPos);
                    yPos += 5;
                    
                    const allKeys = Array.from(new Set(data.flatMap((obj: any) => Object.keys(obj)))) as string[];
                    
                    const rows = data.map((row: any) => allKeys.map(k => {
                        const val = row[k];
                        return (val === null || val === undefined) ? '-' : String(val);
                    }));

                    (doc as any).autoTable({
                        startY: yPos,
                        head: [allKeys],
                        body: rows,
                        theme: 'striped',
                        headStyles: { 
                            fillColor: [30, 58, 138], 
                            textColor: 255, 
                            fontStyle: 'bold',
                            halign: 'center',
                            fontSize: 6 
                        },
                        bodyStyles: { 
                            textColor: 50,
                            fontSize: 6,
                            cellPadding: 1,
                            overflow: 'linebreak'
                        },
                        alternateRowStyles: {
                            fillColor: [241, 245, 249]
                        },
                        styles: { 
                            lineColor: [203, 213, 225],
                            lineWidth: 0.1,
                            cellWidth: 'wrap' // Allow wrapping
                        },
                        horizontalPageBreak: true, // Split columns across pages if needed
                        horizontalPageBreakRepeat: 0, // Repeat header on new pages
                        margin: { top: 20 }
                    });

                    yPos = (doc as any).lastAutoTable.finalY + 15;
                }
            });

            const pageCount = (doc as any).internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount}`, 148, 200, { align: 'center' });
            }

            doc.save(`${fileName}.pdf`);
        }

        setShowExportModal(false);
      } catch (error) {
          console.error("Export failed:", error);
          alert("Export failed! The data might be too large for PDF. Please try exporting as Excel.");
      }
  };

  // --- CALENDAR RENDERER ---
  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Headers
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Empty Slots
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        const isHoliday = !!holidays[dateStr];
        const holidayName = holidays[dateStr];

        days.push(
            <button 
                key={d}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                    w-8 h-8 flex flex-col items-center justify-center text-xs font-bold transition-all relative group rounded-none border border-slate-100
                    ${isSelected ? 'bg-[#1e3a8a] text-white shadow-lg z-10' : 'text-slate-600 hover:bg-slate-200'}
                    ${isToday && !isSelected ? 'border-2 border-[#1e3a8a] text-[#1e3a8a]' : ''}
                    ${isHoliday && !isSelected ? 'bg-purple-100 text-purple-700' : ''}
                `}
            >
                {d}
                {isHoliday && <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500"></div>}
                
                {/* Tooltip for Holiday */}
                {holidayName && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-20">
                        {holidayName}
                    </div>
                )}
            </button>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded-none"><CaretLeft size={16}/></button>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded-none"><CaretRight size={16}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekDays.map(wd => <span key={wd} className="text-[9px] font-black text-slate-400 uppercase">{wd}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 justify-items-center">
                {days}
            </div>
        </div>
    );
  };

  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return id;
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };

  const calculateAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex flex-col bg-[#FCFBF8] dark:bg-[#020617] transition-colors duration-300 pb-0"
      >
        {/* Welcome Banner - Skeuomorphic & Premium (Navy Blue Theme) */}
        <div className="w-full h-[250px] bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-b-none shadow-[0_15px_40px_rgba(30,58,138,0.4)] relative z-10 shrink-0 flex flex-col justify-between px-6 pt-6 pb-8 overflow-hidden border-b-4 border-[#D4AF37]">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full z-0"></div>
          <div className="relative z-20 w-full h-full">
            <div className="absolute top-0 left-0 flex flex-col items-start gap-0 pl-1 pt-1">
              <h1 className="text-4xl font-black font-heading text-white tracking-tight leading-none drop-shadow-sm flex items-center gap-2">
                Principal 👋
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#D4AF37] text-[#1e3a8a] text-xs font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.3)] border border-white/20">Principal</span>
                <span className="inline-block px-4 py-1.5 rounded-full bg-white text-[#1e3a8a] text-xs font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 border-[#D4AF37]">
                  App
                </span>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 z-20">
              <div className="w-24 h-24 rounded-full p-1 bg-white shadow-[0_10px_25px_rgba(0,0,0,0.3)] border-2 border-[#D4AF37] overflow-hidden">
                {school.logoURL ? (
                  <img src={school.logoURL} className="w-full h-full rounded-full object-cover shadow-inner" alt="Logo" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#1e3a8a] flex items-center justify-center text-white shadow-inner">
                    <Bank size={52} className="text-[#D4AF37]" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 relative z-20 mt-auto">
            <div className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-b from-white to-slate-50 border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
              <TrendUp size={24} className="text-[#1e3a8a] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Attendance</p>
              <p className="text-sm font-black leading-none text-[#1e3a8a] mt-1">{attendanceRate}%</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-b from-white to-slate-50 border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
              <UsersThree size={24} className="text-[#1e3a8a] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-center leading-tight">Total Students</p>
              <p className="text-sm font-black leading-none text-[#1e3a8a] mt-1">{totalStudents}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-b from-white to-slate-50 border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
              <Wallet size={24} className="text-[#1e3a8a] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-center leading-tight">Fees Pending</p>
              <p className="text-sm font-black leading-none text-[#1e3a8a] mt-1">Rs {(financialStats.totalPending / 1000).toFixed(0)}k</p>
            </div>
          </div>
        </div>

        {/* Notification Bar - Patti Numa Card (Capsule Style) */}
        <div className="flex justify-center mt-6 -mb-2">
          <button 
            onClick={() => onNavigate('complaints')}
            className="w-[85%] bg-white border-2 border-[#D4AF37] rounded-full py-2 px-3 flex items-center shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="flex items-center w-full relative z-10">
              {/* Icon Container */}
              <div className="w-10 flex justify-start">
                <div className={`w-8 h-8 rounded-full bg-[#1e3a8a] flex items-center justify-center text-[#D4AF37] shadow-md shrink-0 ${complaints.filter(c => c.status !== 'Resolved').length > 0 ? 'animate-[shake_0.5s_infinite]' : ''}`}>
                  <BellRinging size={18} weight="fill" />
                </div>
              </div>

              {/* Text Container */}
              <div className="flex-1 text-center">
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#1e3a8a]">Notification</span>
              </div>

              {/* Badge Container */}
              <div className="w-10 flex justify-end">
                <div className="bg-[#1e3a8a] text-[#D4AF37] text-[10px] font-black w-7 h-7 rounded-full shadow-md flex items-center justify-center border border-[#D4AF37]/30">
                  {complaints.filter(c => c.status !== 'Resolved').length}
                </div>
              </div>
            </div>
          </button>
        </div>

        <style>{`
          @keyframes shake {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(15deg); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(-15deg); }
            100% { transform: rotate(0deg); }
          }
        `}</style>

        {/* School Banner (Skeuomorphic or Custom) */}
        <div className="mx-6 mt-8 mb-8 w-[calc(100%-3rem)] relative group">
        {school.bannerURLs && school.bannerURLs.length > 0 ? (
            <div className="w-full p-3 bg-gradient-to-br from-[#b5835a] via-[#8b5a2b] to-[#5c3a21] rounded-none shadow-[0_15px_35px_rgba(0,0,0,0.25),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-[#5c3a21]/50">
              <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0.02turn, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px), repeating-linear-gradient(-0.01turn, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)' }}></div>
              <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'repeating-radial-gradient(ellipse at 50% 150%, transparent, transparent 10px, rgba(0,0,0,0.4) 10px, rgba(0,0,0,0.4) 20px)' }}></div>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none mix-blend-overlay"></div>
              <div className="w-full aspect-video rounded-none shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] border-2 border-[#D4AF37] flex items-center justify-center relative overflow-hidden z-10">
                <Carousel images={school.bannerURLs} className="w-full h-full" currentIndex={bannerIndex} setCurrentIndex={setBannerIndex} />
              </div>
            </div>
          ) : (
            <div className="w-full p-3 bg-gradient-to-br from-[#b5835a] via-[#8b5a2b] to-[#5c3a21] rounded-none shadow-[0_15px_35px_rgba(0,0,0,0.25),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-[#5c3a21]/50">
              <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0.02turn, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px), repeating-linear-gradient(-0.01turn, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)' }}></div>
              <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'repeating-radial-gradient(ellipse at 50% 150%, transparent, transparent 10px, rgba(0,0,0,0.4) 10px, rgba(0,0,0,0.4) 20px)' }}></div>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none mix-blend-overlay"></div>
              <div className="w-full h-36 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] rounded-none shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] border-2 border-[#D4AF37] flex items-center justify-center relative overflow-hidden z-10">
                <div className="text-center text-white z-20 p-4 relative">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-[#D4AF37] shadow-xl"><Bank size={24} className="text-[#D4AF37] drop-shadow-md" /></div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-1">School Campus</p>
                  <p className="font-bold font-heading text-xl leading-tight text-white drop-shadow-md">{school.name}</p>
                </div>
              </div>
            </div>
          )}
          {school.bannerURLs && school.bannerURLs.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {school.bannerURLs.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setBannerIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === bannerIndex ? 'bg-[#D4AF37] w-4' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* KPI Overview Section (Replaces Visual Analytics) */}
        <div className="px-6 mt-8">
          <div className="flex justify-between items-center mb-5 px-2">
            <h2 className="text-xs font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
              <ChartPie size={16} weight="fill" /> Performance Overview
            </h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <MobileStatCard icon={UsersThree} label="Students" value={totalStudents} onClick={() => handleNavigate('students_directory')} />
            <MobileStatCard icon={TrendUp} label="Attendance" value={`${attendanceRate}%`} onClick={() => handleNavigate('attendance')} />
            <MobileStatCard icon={UsersThree} label="Staff Pres" value={staffPresent} onClick={() => handleNavigate('teachers_directory')} />
            <MobileStatCard icon={UserMinus} label="Staff Abs" value={staffAbsent} onClick={() => handleNavigate('teachers_directory')} />
            <MobileStatCard icon={Chalkboard} label="Classes" value={classes.length} onClick={() => handleNavigate('classes')} />
            <MobileStatCard icon={UserPlus} label="Enquiries" value={dashboardSummary?.count_enquiries ?? enquiries.length} onClick={() => handleNavigate('enquiries')} />
            <MobileStatCard icon={Cake} label="Birthdays" value={todaysBirthdayStudentsCount} />
            <MobileStatCard icon={Megaphone} label="Complaint" value={openComplaintsCount} onClick={() => handleNavigate('complaints')} />
            <MobileStatCard icon={Receipt} label="Today Exp" value={`Rs ${financialStats.todaysExpenses.toLocaleString()}`} onClick={() => handleNavigate('expenses_daily')} />
          </div>
        </div>

          {/* Donut Charts Section */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Attendance Donut */}
            <div className="bg-white dark:bg-[#1e293b] p-4 rounded-none border-2 border-[#D4AF37] shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex flex-col items-center">
              <h3 className="text-[10px] font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest mb-2">Attendance</h3>
              <div className="h-32 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Present', value: attendanceRate },
                        { name: 'Absent', value: 100 - attendanceRate }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#1e3a8a" />
                      <Cell fill="#cbd5e1" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{attendanceRate}%</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-2 w-full">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#1e3a8a]"></div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Absent</span>
                </div>
              </div>
            </div>

            {/* Fee Collection Donut */}
            <div className="bg-white dark:bg-[#1e293b] p-4 rounded-none border-2 border-[#D4AF37] shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex flex-col items-center">
              <h3 className="text-[10px] font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest mb-2">Fee Collection</h3>
              <div className="h-32 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Collected', value: financialStats.totalCollected },
                        { name: 'Pending', value: financialStats.totalPending }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#047857" />
                      <Cell fill="#be123c" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">
                    {financialStats.totalCollectible > 0 ? Math.round((financialStats.totalCollected / financialStats.totalCollectible) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-2 w-full">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#047857]"></div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Collected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#be123c]"></div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Pending</span>
                </div>
              </div>
            </div>
          </div>

        {/* Principal Tools Section */}
        <div className="hidden md:block w-full bg-white dark:bg-[#1e293b] rounded-t-none p-8 pb-8 border-t-4 border-[#D4AF37] shadow-[0_-15px_35px_rgba(30,58,138,0.08)] transition-colors duration-300 mt-8">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-xs font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
              <SquaresFour size={16} weight="fill" /> Principal Tools
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Students */}
            <button onClick={() => onNavigate('students_directory')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <Student size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Students</p>
            </button>

            {/* Parents */}
            <button onClick={() => onNavigate('parents_directory')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <Users size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Parents</p>
            </button>

            {/* Teachers */}
            <button onClick={() => onNavigate('teachers_directory')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <ChalkboardTeacher size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Teachers</p>
            </button>

            {/* Academics */}
            <button onClick={() => onNavigate('academics_timetable')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <GraduationCap size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Academics</p>
            </button>

            {/* Classes */}
            <button onClick={() => onNavigate('classes')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <Chalkboard size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Classes</p>
            </button>

            {/* Attendance */}
            <button onClick={() => onNavigate('attendance')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <CalendarCheck size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Attendance</p>
            </button>

            {/* Fees */}
            <button onClick={() => onNavigate('fees_dashboard')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <Wallet size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Fees</p>
            </button>

            {/* HR & Payroll */}
            <button onClick={() => onNavigate('teachers_payroll')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <IdentificationCard size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">HR & Payroll</p>
            </button>

            {/* Expenses */}
            <button onClick={() => onNavigate('expenses_daily')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <Receipt size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Expenses</p>
            </button>

            {/* Inquiries */}
            <button onClick={() => onNavigate('enquiries')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <UserList size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Inquiries</p>
            </button>

            {/* Complaints */}
            <button onClick={() => onNavigate('complaints')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <Megaphone size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Complaints</p>
            </button>

            {/* Student Photos */}
            <button onClick={() => onNavigate('students_gallery')} className="flex flex-col items-center justify-center p-3 rounded-none bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37] h-24 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all active:scale-95">
              <Palette size={24} weight="fill" className="text-[#D4AF37] mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight">Photos</p>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="font-sans text-slate-900 dark:text-white pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
        
        {/* --- MAIN BASE BACKGROUND CONTAINER --- */}
        <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-[#1e293b] rounded-none shadow-sm flex flex-col min-h-[90vh]">
            
            {/* --- HEADER (Moved Inside) --- */}
            <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between rounded-none">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">{school.name}</h1>
                    <div className="flex items-center gap-4 mt-2">
                         <span className="bg-white dark:bg-[#1e293b] text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider rounded-none">Dashboard</span>
                         <span className="text-sm font-bold opacity-80">{new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}</span>
                    </div>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                     <button 
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-2 px-5 py-2 bg-white dark:bg-[#1e293b] text-[#1e3a8a] text-xs font-black uppercase hover:bg-slate-200 transition-colors shadow-sm rounded-none"
                     >
                        <DownloadSimple size={18} weight="fill"/> Export
                     </button>
                     <button className="flex items-center gap-2 px-5 py-2 bg-[#1e3a8a] text-white text-xs font-black uppercase hover:bg-[#1e40af] transition-colors shadow-sm rounded-none">
                        <BellRinging size={18} weight="fill"/> Alerts
                     </button>
                </div>
            </div>

            {/* --- DASHBOARD CONTENT BODY --- */}
            <div className="p-8 space-y-8">

                {/* --- METRICS GRID (12 Cards - 4 Columns) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                    <StatCard icon={UsersThree} label="Total Students" value={totalStudents} color="bg-blue-900" onClick={() => handleNavigate('students_directory')} />
                    <StatCard icon={TrendUp} label="Attendance" value={`${attendanceRate}%`} color="bg-emerald-600" onClick={() => handleNavigate('attendance')} />
                    <StatCard icon={ChalkboardTeacher} label="Teachers" value={`${staffPresent}/${totalStaff}`} color="bg-slate-700" onClick={() => handleNavigate('teachers_directory')} />
                    <StatCard icon={Chalkboard} label="Total Classes" value={classes.length} color="bg-indigo-700" onClick={() => handleNavigate('classes')} />
                    <StatCard icon={Cake} label="Birthdays Today" value={todaysBirthdayStudentsCount} color="bg-pink-500" />
                    <StatCard icon={Wallet} label={`Collected (${financialStats.activeMonth})`} value={`Rs. ${(financialStats.totalCollected / 1000).toFixed(0)}k`} color="bg-[#1e3a8a]" onClick={() => handleNavigate('fees_dashboard')} />
                    <StatCard icon={WarningCircle} label={`Unpaid (${financialStats.activeMonth})`} value={`Rs. ${(financialStats.totalPending / 1000).toFixed(0)}k`} color="bg-[#1e3a8a]" onClick={() => handleNavigate('fees_dashboard')} />
                    <StatCard icon={Target} label={`Total Fees (${financialStats.activeMonth})`} value={`Rs. ${(financialStats.totalCollectible / 1000).toFixed(0)}k`} color="bg-[#7c3aed]" onClick={() => handleNavigate('fees_dashboard')} />
                    <StatCard icon={Megaphone} label="Issues" value={openComplaintsCount} color="bg-[#ea580c]" onClick={() => handleNavigate('complaints')} />
                    <StatCard icon={UserList} label="Visitors" value={dashboardSummary?.count_enquiries ?? enquiries.length} color="bg-cyan-600" onClick={() => handleNavigate('enquiries')} />
                    <StatCard icon={UserMinus} label="Absent Staff" value={staffAbsent} color="bg-rose-900" onClick={() => handleNavigate('teachers_directory')} />
                    <StatCard icon={Receipt} label="Expenses" value={`Rs. ${financialStats.todaysExpenses.toLocaleString()}`} color="bg-amber-500" onClick={() => handleNavigate('expenses_daily')} />
                </div>

                {/* --- ROW 1: FINANCE & ACTIONS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* 1. REVENUE CHART */}
                    <div className="lg:col-span-2">
                        <ChartContainer title="Fees Overview" icon={ChartBar}>
                            <RevenueBarChart data={classFeeData} />
                        </ChartContainer>
                    </div>

                    {/* 2. SHARP QUICK ACTIONS */}
                    <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col">
                        <div className="px-6 py-4 border-b-2 border-slate-300 bg-slate-800">
                            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <ListBullets size={18} weight="fill"/> Shortcuts
                            </h3>
                        </div>
                        
                        <div className="p-6 grid grid-cols-2 gap-4 flex-1">
                            <button 
                                onClick={() => onNavigate('students_admissions')}
                                className="flex flex-col items-center justify-center p-6 bg-[#1e3a8a] text-white hover:bg-[#172554] transition-all shadow-lg active:scale-95 group rounded-none"
                            >
                                <UserPlus size={28} weight="fill" className="mb-2 text-white"/>
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Add Student</span>
                            </button>
                            
                            <button 
                                onClick={() => onNavigate('fees_collect')}
                                className="flex flex-col items-center justify-center p-6 bg-[#047857] text-white hover:bg-[#065f46] transition-all shadow-lg active:scale-95 group rounded-none"
                            >
                                <Coins size={28} weight="fill" className="mb-2 text-white"/>
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Collect Fee</span>
                            </button>
                            
                            <button 
                                onClick={() => onNavigate('expenses_daily')}
                                className="flex flex-col items-center justify-center p-6 bg-[#d97706] text-white hover:bg-[#b45309] transition-all shadow-lg active:scale-95 group rounded-none"
                            >
                                <Receipt size={28} weight="fill" className="mb-2 text-white"/>
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Add Expense</span>
                            </button>
                            
                            <button 
                                onClick={() => onNavigate('communication')}
                                className="flex flex-col items-center justify-center p-6 bg-[#be123c] text-white hover:bg-[#9f1239] transition-all shadow-lg active:scale-95 group rounded-none"
                            >
                                <BellRinging size={28} weight="fill" className="mb-2 text-white"/>
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Send SMS</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- ROW 2: ATTENDANCE & CALENDAR --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* 3. CALENDAR WIDGET */}
                    <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col">
                        <div className="px-6 py-4 border-b-2 border-slate-300 flex justify-between items-center bg-slate-800">
                            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <CalendarBlank size={18} weight="fill"/> Calendar
                            </h3>
                            {selectedDate !== new Date().toISOString().split('T')[0] && (
                                <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="text-[9px] font-bold bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white px-2 py-0.5 rounded uppercase hover:bg-slate-200">
                                    Reset
                                </button>
                            )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-center">
                            {renderCalendar()}
                        </div>
                    </div>

                    {/* 4. ATTENDANCE PIE */}
                    <ChartContainer title="Overall Attendance" icon={ChartPie}>
                        <AttendancePieChart attendanceRate={attendanceRate} />
                    </ChartContainer>

                    {/* 5. CLASS ATTENDANCE LIST */}
                    <ChartContainer title="Class Attendance" icon={ChartPie}>
                        <ClassAttendanceBarChart data={classAttendanceGraphData} />
                    </ChartContainer>
                </div>

                {/* --- ROW 3: LEDGER & DEMOGRAPHICS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* 6. FINANCIAL LEDGER */}
                    <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b-2 border-slate-300 bg-slate-800">
                            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <Bank size={18} weight="fill"/> Income vs Expense
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 divide-x-2 divide-slate-200 h-full items-center">
                            <div className="p-8 text-center hover:bg-slate-50 dark:bg-[#0f172a] transition-colors">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Revenue</p>
                                <p className="text-3xl font-black text-[#1e3a8a] font-mono tracking-tight">Rs. {financialStats.totalCollected.toLocaleString()}</p>
                            </div>
                            <div className="p-8 text-center hover:bg-slate-50 dark:bg-[#0f172a] transition-colors">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expenses</p>
                                <p className="text-3xl font-black text-[#D4AF37] font-mono tracking-tight">Rs. {financialStats.totalExpenses.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    {/* 7. STUDENT DEMOGRAPHICS (SHARPENED DONUT) */}
                    <ChartContainer title="Student Composition" icon={UsersThree}>
                        <GenderDistributionChart boysCount={boysCount} girlsCount={girlsCount} totalStudents={students.length} data={genderData} />
                    </ChartContainer>
                </div>
                </div>

                {/* --- ROW 4: DUES & DEFAULTERS --- */}
                <div className="bg-white dark:bg-[#1e293b] border-2 border-[#1e3a8a] shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 bg-[#1e3a8a] border-b-2 border-[#1e3a8a] flex justify-between items-center">
                        <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                            <ShieldWarning size={18} weight="fill"/> Unpaid Fee List
                        </h3>
                        <span className="text-[10px] font-black uppercase bg-white dark:bg-[#1e293b] px-3 py-1 text-[#D4AF37] shadow-sm">{unpaidStudents.length} Pending</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        {topDefaulters.length > 0 ? (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-[#1e293b] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-[#0f172a]">
                                        <th className="px-6 py-3">Student Name</th>
                                        <th className="px-6 py-3">Class</th>
                                        <th className="px-6 py-3">Month</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {topDefaulters.map((s: any, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:bg-[#0f172a] transition-colors">
                                            <td className="px-6 py-3">
                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{s.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.fatherName}</p>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 px-2 py-1">
                                                    {getClassName(s.classId)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-xs font-bold text-slate-500">
                                                {s.month}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-rose-600 px-2 py-1 uppercase border border-rose-700">
                                                    Rs. {s.pendingAmount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center flex flex-col items-center justify-center text-emerald-700">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                    <Coins size={32} weight="fill"/>
                                </div>
                                <h3 className="text-xl font-black">All Clear!</h3>
                                <p className="text-sm font-bold opacity-70 mt-1 uppercase tracking-widest">No outstanding dues recorded.</p>
                            </div>
                        )}
                        {unpaidStudents.length > 8 && (
                            <div className="p-3 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-[#1e293b] text-center">
                                <button onClick={() => onNavigate('fees_due')} className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:underline">View All {unpaidStudents.length} Defaulters</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- ROW 5: BIRTHDAYS & COMPLAINTS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* BIRTHDAY TABLE */}
                    <div className="bg-white dark:bg-[#1e293b] border-2 border-pink-500 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-pink-500 border-b-2 border-pink-500 flex justify-between items-center">
                            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <Gift size={18} weight="fill"/> Birthdays
                            </h3>
                            <span className="text-[10px] font-black uppercase bg-white dark:bg-[#1e293b] px-3 py-1 text-pink-600 shadow-sm">{todaysBirthdayStudents.length} Today</span>
                        </div>
                        
                        <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                            {todaysBirthdayStudents.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-[#1e293b] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-[#0f172a]">
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Class</th>
                                            <th className="px-6 py-3 text-right">Age</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {todaysBirthdayStudents.map((s, i) => {
                                            // Calculate Age
                                            const dob = s.dob || s.customData?.dob;
                                            const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 'N/A';

                                            return (
                                                <tr key={i} className="hover:bg-pink-50/50 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                                                                <Cake size={16} weight="fill" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{s.name}</p>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.fatherName}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 px-2 py-1 rounded">
                                                            {getClassName(s.classId)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-pink-500 px-2 py-1 uppercase rounded-full">
                                                            {age} Yrs
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Cake size={32} weight="fill" className="text-slate-300"/>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-500 dark:text-slate-400">No Birthdays</h3>
                                    <p className="text-xs font-bold opacity-70 mt-1 uppercase tracking-widest">Check back tomorrow!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COMPLAINTS TABLE (NEW) */}
                    <div className="bg-white dark:bg-[#1e293b] border-2 border-orange-500 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-orange-500 border-b-2 border-orange-500 flex justify-between items-center">
                            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <Megaphone size={18} weight="fill"/> Complaints
                            </h3>
                            <span className="text-[10px] font-black uppercase bg-white dark:bg-[#1e293b] px-3 py-1 text-orange-600 shadow-sm">
                                {complaints.filter(c => c.status === 'Open').length} Open
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                            {complaints.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-[#1e293b] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-[#0f172a]">
                                            <th className="px-6 py-3">Subject</th>
                                            <th className="px-6 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {complaints.slice(0, 10).map((c, i) => (
                                            <tr key={i} className="hover:bg-orange-50/50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{c.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{c.date || new Date(c.createdAt).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    {c.status === 'Open' && <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-[#1e3a8a] px-2 py-1 uppercase rounded-full"><ClockCounterClockwise size={10} weight="bold"/> Open</span>}
                                                    {c.status === 'In Progress' && <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-amber-500 px-2 py-1 uppercase rounded-full"><Clock size={10} weight="bold"/> Pending</span>}
                                                    {c.status === 'Resolved' && <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-emerald-500 px-2 py-1 uppercase rounded-full"><CheckCircle size={10} weight="bold"/> Done</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                                    <h3 className="text-lg font-black text-slate-500 dark:text-slate-400">No Complaints</h3>
                                    <p className="text-xs font-bold opacity-70 mt-1 uppercase tracking-widest">Everything is running smoothly.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* --- ROW 6: EVENTS & ANNOUNCEMENTS --- */}
                <div className="bg-white dark:bg-[#1e293b] border-2 border-violet-600 shadow-sm overflow-hidden flex flex-col mt-6">
                    <div className="px-6 py-4 bg-violet-600 border-b-2 border-violet-600 flex justify-between items-center">
                        <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                            <CalendarPlus size={18} weight="fill"/> Notice Board
                        </h3>
                        <span className="text-[10px] font-black uppercase bg-white dark:bg-[#1e293b] px-3 py-1 text-violet-700 shadow-sm">
                            {announcements.length} Active
                        </span>
                    </div>
                    
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                        {announcements.length > 0 ? (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-[#1e293b] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-[#0f172a]">
                                        <th className="px-6 py-3">Notice</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Audience</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {announcements.map((e, i) => (
                                        <tr key={i} className="hover:bg-violet-50/50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 bg-amber-500`}>
                                                        <Megaphone size={14} weight="fill"/>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{e.content}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 px-2 py-1 rounded border border-slate-200 dark:border-[#1e293b]">
                                                    {new Date(e.timestamp || e.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                    {!e.classId ? 'Everyone' : (classes.find(c => c.id === e.classId)?.name || 'Class Specific')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <CalendarBlank size={32} weight="fill" className="text-slate-300"/>
                                </div>
                                <h3 className="text-lg font-black text-slate-500 dark:text-slate-400">No Active Notices</h3>
                                <p className="text-xs font-bold opacity-70 mt-1 uppercase tracking-widest">Notice board is clear.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- ROW 7: NEW BOTTOM CHARTS (Fees, Complaints, Enrollment) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                    
                    {/* 1. FEE STATUS DONUT */}
                    <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col">
                        <div className="px-6 py-4 border-b-2 border-slate-300 bg-slate-800">
                            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <ChartPie size={18} weight="fill"/> Fee Summary
                            </h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-center items-center">
                            <div className="w-full h-[150px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={feeStatusData}
                                            innerRadius={50}
                                            outerRadius={65}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={0}
                                        >
                                            {feeStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-4 mt-2 justify-center">
                                <div className="text-center">
                                    <span className="block text-xl font-black text-[#047857]">{paidCount}</span>
                                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">Paid</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl font-black text-[#D4AF37]">{pendingCountForMonth}</span>
                                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. COMPLAINTS RESOLUTION DONUT */}
                    <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col">
                        <div className="px-6 py-4 border-b-2 border-slate-300 bg-slate-800">
                            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <Megaphone size={18} weight="fill"/> Complaints Summary
                            </h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-center items-center">
                            <div className="w-full h-[150px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={complaintChartData}
                                            innerRadius={50}
                                            outerRadius={65}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={0}
                                        >
                                            {complaintChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                             <div className="flex gap-4 mt-2 justify-center">
                                <div className="text-center">
                                    <span className="block text-xl font-black text-[#f97316]">{openCount}</span>
                                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">Open</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl font-black text-[#64748b]">{resolvedCount}</span>
                                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">Solved</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. ENROLLMENT DONUT */}
                    <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col">
                        <div className="px-6 py-4 border-b-2 border-slate-300 bg-slate-800">
                            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <UserPlus size={18} weight="fill"/> Admissions
                            </h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-center items-center">
                            <div className="w-full h-[150px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={enrollmentData}
                                            innerRadius={50}
                                            outerRadius={65}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={0}
                                        >
                                            {enrollmentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                             <div className="flex gap-4 mt-2 justify-center">
                                <div className="text-center">
                                    <span className="block text-xl font-black text-[#7c3aed]">{newStudents}</span>
                                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">New</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xl font-black text-[#1e3a8a]">{oldStudents}</span>
                                    <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">Return</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
            {/* --- EXPORT MODAL --- */}
            {showExportModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowExportModal(false)}></div>
                    <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-none relative z-10 animate-in zoom-in-95 shadow-2xl overflow-hidden">
                        <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <DownloadSimple size={24} weight="fill"/> Export Data
                            </h3>
                            <button onClick={() => setShowExportModal(false)}><X size={20} weight="bold"/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            
                            {/* 1. SELECT DATA */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Data to Export</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.keys(exportOptions).map(key => (
                                        <label key={key} className="flex items-center gap-3 p-3 border-2 border-slate-200 dark:border-[#1e293b] hover:border-blue-500 cursor-pointer transition-colors bg-slate-50 dark:bg-[#0f172a]">
                                            <div className={`w-5 h-5 border-2 flex items-center justify-center ${exportOptions[key as keyof typeof exportOptions] ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                {exportOptions[key as keyof typeof exportOptions] && <Check size={14} weight="bold" className="text-white"/>}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden"
                                                checked={exportOptions[key as keyof typeof exportOptions]}
                                                onChange={() => setExportOptions({...exportOptions, [key]: !exportOptions[key as keyof typeof exportOptions]})}
                                            />
                                            <span className="text-sm font-bold uppercase text-slate-700 dark:text-slate-200">{key}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 2. SELECT FORMAT */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Format</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <button 
                                        onClick={() => setExportFormat('xlsx')}
                                        className={`flex flex-col items-center justify-center p-4 border-2 transition-all ${exportFormat === 'xlsx' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 hover:border-slate-400 text-slate-500 dark:text-slate-400'}`}
                                    >
                                        <FileXls size={32} weight="fill" className="mb-2"/>
                                        <span className="text-[10px] font-black uppercase">Excel</span>
                                    </button>
                                    <button 
                                        onClick={() => setExportFormat('csv')}
                                        className={`flex flex-col items-center justify-center p-4 border-2 transition-all ${exportFormat === 'csv' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-400 text-slate-500 dark:text-slate-400'}`}
                                    >
                                        <FileCsv size={32} weight="fill" className="mb-2"/>
                                        <span className="text-[10px] font-black uppercase">CSV</span>
                                    </button>
                                    <button 
                                        onClick={() => setExportFormat('pdf')}
                                        className={`flex flex-col items-center justify-center p-4 border-2 transition-all ${exportFormat === 'pdf' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 hover:border-slate-400 text-slate-500 dark:text-slate-400'}`}
                                    >
                                        <FilePdf size={32} weight="fill" className="mb-2"/>
                                        <span className="text-[10px] font-black uppercase">PDF</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={handleExport} className="flex-1 py-3 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest hover:bg-[#172554] transition-colors flex items-center justify-center gap-2">
                                    <DownloadSimple size={18} weight="bold"/> Download File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </motion.div>
  );
};

export default Dashboard;
