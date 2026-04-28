
import React, { useState, useMemo } from 'react';
import { 
  Lock, Eye, Printer, MagnifyingGlass, FileCsv, Key, CheckCircle, 
  ArrowsClockwise, DownloadSimple, ShieldWarning, MagicWand, CircleNotch,
  Funnel, CaretDown, UsersThree, WarningCircle, FileText, Table,
  IdentificationBadge, ListNumbers
} from 'phosphor-react';
import { Student, Class, School } from '../../types.ts';
import { updateStudentCredentialsRecord, provisionStudentPortalAccount } from '../../services/api.ts';
import * as XLSX from 'xlsx';

interface AppCredentialsProps {
  schoolId: string;
  students: Student[];
  classes: Class[];
  school: School; 
}

const AppCredentials: React.FC<AppCredentialsProps> = ({ schoolId, students, classes, school }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [showExportModal, setShowExportModal] = useState(false);
  
  const [studentToReset, setStudentToReset] = useState<Student | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [studentsToProcessCount, setStudentsToProcessCount] = useState(0);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // --- DERIVED STATE ---
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.includes(searchTerm);
      
      const isActive = !!s.customData?.mirror_password;
      const matchStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'active' ? isActive : !isActive;

      return matchClass && matchSearch && matchStatus;
    });
  }, [students, selectedClassId, searchTerm, statusFilter]);

  const totalStudents = students.length;
  const activeCount = students.filter(s => !!s.customData?.mirror_password).length;
  const inactiveCount = students.length - activeCount;
  const coveragePercent = totalStudents > 0 ? Math.round((activeCount / totalStudents) * 100) : 0;

  // --- HELPERS ---
  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return id;
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };

  const getAppEmail = (student: Student) => {
      return student.email || null;
  };

  const getAppPassword = (student: Student) => {
      return student.customData?.mirror_password || null;
  };

  // --- ACTIONS ---

  const handleExportExcel = () => {
      const data = filteredStudents.map(s => ({
          'S/No': s.rollNo,
          'Student Name': s.name,
          'Class': getClassName(s.classId),
          'School ID': school.schoolCode || schoolId.slice(0, 8),
          'Login ID': s.loginId || 'N/A',
          'App Email': getAppEmail(s) || 'Not Set',
          'App Password': getAppPassword(s) || 'Not Set'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Credentials");
      XLSX.writeFile(wb, `Student_Credentials_${new Date().toISOString().split('T')[0]}.xlsx`);
      setShowExportModal(false);
  };

  const handleExportPDF = async () => {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF('l', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.text(school.name, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Student App Credentials - ${new Date().toLocaleDateString()}`, 14, 30);

      const headers = ['S/No', 'Student Name', 'Class', 'School ID', 'Login ID', 'App Email', 'App Password'];
      const data = filteredStudents.map(s => [
          s.rollNo,
          s.name,
          getClassName(s.classId),
          school.schoolCode || schoolId.slice(0, 8),
          s.loginId || 'N/A',
          getAppEmail(s) || 'Not Set',
          getAppPassword(s) || 'Not Set'
      ]);

      (doc as any).autoTable({
          head: [headers],
          body: data,
          startY: 40,
          theme: 'grid',
          headStyles: { fillStyle: '#1e3a8a', textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9 }
      });

      doc.save(`Student_Credentials_${new Date().toISOString().split('T')[0]}.pdf`);
      setShowExportModal(false);
  };

  const handlePrintGuides = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = filteredStudents.map(s => `
      <div class="guide-card">
        <div class="header">
          <div class="branding">
            <h1 class="school-name">${school.name}</h1>
            <p class="guide-title">OFFICIAL STUDENT ACCESS GUIDE</p>
          </div>
          <div class="student-photo-box">
            ${s.photoURL ? 
              `<img src="${s.photoURL}" alt="${s.name}" class="student-img" />` : 
              `<div class="photo-placeholder">${s.name[0]}</div>`
            }
          </div>
        </div>

        <div class="student-identity">
            <div class="i-field">
                <span class="i-label">Student Name</span>
                <span class="i-value">${s.name}</span>
            </div>
            <div class="i-field">
                <span class="i-label">Roll Number</span>
                <span class="i-value">${s.rollNo}</span>
            </div>
        </div>

        <div class="creds-section">
          <div class="cred-item">
            <span class="c-label">PORTAL WEB ADDRESS</span>
            <span class="c-value" style="font-size: 14px; color: #ef4444;">${window.location.host}</span>
          </div>
          <div class="cred-item">
            <span class="c-label">SCHOOL ID</span>
            <span class="c-value">${school.schoolCode || schoolId.slice(0, 8)}</span>
          </div>
          <div class="cred-item" style="background: #f8fafc; color: #1e3a8a; border: 2px solid #1e3a8a;">
            <span class="c-label" style="color: #64748b;">YOUR LOGIN ID</span>
            <span class="c-value">${s.loginId || 'N/A'}</span>
          </div>
        </div>

        <div class="roadmap">
          <h3>FIRST TIME ACTIVATION STEPS</h3>
          <div class="step">
            <div class="step-num">01</div>
            <div class="step-txt">
              Open <strong>${window.location.host}</strong> in your mobile browser.
            </div>
          </div>
          <div class="step">
            <div class="step-num">02</div>
            <div class="step-txt">
              Click on <strong>"Create Access"</strong> and enter your <strong>Login ID</strong>.
            </div>
          </div>
          <div class="step">
            <div class="step-num">03</div>
            <div class="step-txt">
              Once your profile appears, click it and set your <strong>Email & Password</strong>.
            </div>
          </div>
          <div class="step">
            <div class="step-num">04</div>
            <div class="step-txt">
              Install the app via browser menu and login using your new credentials!
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="brand">Powered by <strong>${school.name}</strong> Digital Ecosystem</div>
          <div class="tagline tracking-widest">SMART EDUCATION HUB</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Access Guides - ${school.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@400;700;900&display=swap');
            
            body { 
              font-family: 'Inter', sans-serif; 
              margin: 0; 
              padding: 0; 
              background: #f8fafc;
            }

            @page {
              size: A4;
              margin: 10mm;
            }

            .container {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
            }

            .guide-card { 
              background: white; 
              width: 100%; 
              max-width: 170mm; 
              min-height: 125mm; /* Flexible height to prevent overflow */
              margin-bottom: 5mm;
              border: 3px solid #1e3a8a; 
              padding: 25px; /* Slightly reduced padding */
              box-sizing: border-box;
              position: relative;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
              overflow: hidden;
            }

            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 25px;
              border-bottom: 2px solid #eff6ff;
              padding-bottom: 15px;
            }

            .school-name { 
              margin: 0; 
              font-family: 'Space Grotesk', sans-serif;
              font-size: 24px; 
              font-weight: 900; 
              color: #1e3a8a; 
              text-transform: uppercase;
              letter-spacing: -1px;
            }

            .guide-title { 
              margin: 5px 0 0 0; 
              font-size: 11px; 
              font-weight: 900; 
              color: #64748b; 
              letter-spacing: 2px;
            }

            .student-photo-box {
              width: 80px;
              height: 80px;
              border: 3px solid #1e3a8a;
              background: #f1f5f9;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }

            .student-img {
              width: 100%;
              height: 100%;
              object-cover: cover;
            }

            .photo-placeholder {
              font-size: 32px;
              font-weight: 900;
              color: #cbd5e1;
            }

            .student-identity {
                display: flex;
                gap: 40px;
                margin-bottom: 20px;
            }

            .i-label { 
                display: block; 
                font-size: 10px; 
                font-weight: 900; 
                color: #94a3b8; 
                text-transform: uppercase;
                margin-bottom: 3px;
            }

            .i-value { 
                display: block; 
                font-size: 16px; 
                font-weight: 900; 
                color: #1e293b; 
            }

            .creds-section { 
              display: flex; 
              gap: 15px; 
              margin-bottom: 25px;
            }

            .cred-item { 
              flex: 1; 
              background: #1e3a8a; 
              padding: 12px 15px;
              color: white;
            }

            .c-label { 
              display: block; 
              font-size: 9px; 
              font-weight: 900; 
              color: #bfdbfe; 
              margin-bottom: 4px;
              letter-spacing: 1px;
            }

            .c-value { 
              display: block; 
              font-size: 18px; 
              font-weight: 900; 
              font-family: monospace; 
            }

            .roadmap h3 { 
              font-size: 11px; 
              font-weight: 900; 
              color: #1e3a8a; 
              background: #eff6ff;
              padding: 6px 12px;
              margin: 0 0 15px 0;
              letter-spacing: 1px;
              display: inline-block;
            }

            .step { 
              display: flex; 
              gap: 12px; 
              margin-bottom: 8px; 
            }

            .step-num { 
              font-size: 14px; 
              font-weight: 900; 
              color: #1e3a8a; 
              opacity: 0.3;
              flex-shrink: 0; 
            }

            .step-txt { 
              font-size: 12px; 
              line-height: 1.4; 
              color: #475569; 
            }

            .step-txt strong { color: #1e3a8a; }

            .footer { 
              margin-top: auto;
              border-top: 1px solid #e2e8f0; 
              padding-top: 15px; 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
            }

            .brand { font-size: 11px; color: #64748b; }
            .brand strong { color: #1e3a8a; }
            .tagline { font-size: 9px; font-weight: 900; color: #cbd5e1; letter-spacing: 3px; }

            @media print {
              body { background: white; }
              .guide-card { 
                box-shadow: none; 
                border-width: 2px;
                margin-bottom: 0px;
              }
              .guide-card:nth-child(even) { page-break-after: always; }
              .guide-card:not(:last-child) { margin-bottom: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${cardsHtml}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowExportModal(false);
  };

  const handleExportWord = async () => {
      const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } = await import('docx');
      
      const headers = ['S/No', 'Student Name', 'Class', 'School ID', 'Login ID', 'App Email', 'App Password'];
      const rows = filteredStudents.map(s => [
          s.rollNo,
          s.name,
          getClassName(s.classId),
          school.schoolCode || schoolId.slice(0, 8),
          s.loginId || 'N/A',
          getAppEmail(s) || 'Not Set',
          getAppPassword(s) || 'Not Set'
      ]);

      const tableRows = [
          new TableRow({
              children: headers.map(header => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
              })),
          }),
          ...rows.map(row => new TableRow({
              children: row.map(cell => new TableCell({
                  children: [new Paragraph({ children: [new TextRun(String(cell))] })],
              })),
          }))
      ];

      const doc = new Document({
          sections: [{
              children: [
                  new Paragraph({ children: [new TextRun({ text: `${school.name} - Student App Credentials`, bold: true, size: 32 })] }),
                  new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      rows: tableRows,
                  }),
              ],
          }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Student_Credentials_${new Date().toISOString().split('T')[0]}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
  };

  const openResetModal = (student: Student) => {
      setStudentToReset(student);
      const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      setNewPasswordInput(`${firstName}@${rand}`);
      setShowResetModal(true);
  };

  const handleSavePassword = async () => {
      if (!studentToReset || !newPasswordInput) return;
      setIsUpdating(true);
      try {
          await updateStudentCredentialsRecord(schoolId, studentToReset.id, newPasswordInput);
          alert(`Password record updated to: ${newPasswordInput}\n\nIMPORTANT: If the student account is already active, they must use the 'Forgot Password' feature or you must update their Auth password manually. This list is for record-keeping.`);
          setShowResetModal(false);
          setStudentToReset(null);
      } catch (e) {
          console.error(e);
          alert("Failed to update record.");
      } finally {
          setIsUpdating(false);
      }
  };
  
  const handleBulkGenerate = () => {
      console.log("Bulk generate button clicked");
      const toProcess = filteredStudents.filter(s => !s.customData?.mirror_password);
      
      if (toProcess.length === 0) {
          alert("No students in current view need credentials.");
          return;
      }

      setStudentsToProcessCount(toProcess.length);
      setShowBulkConfirm(true);
  };

  const startBulkGeneration = async () => {
      setShowBulkConfirm(false);
      const studentsToProcess = filteredStudents.filter(s => !s.customData?.mirror_password);
      
      if (studentsToProcess.length === 0) return;

      setIsBulkGenerating(true);
      setBulkProgress(0);

      let successCount = 0;
      let failCount = 0;
      let lastError = '';

      const schoolPrefix = school.schoolCode 
        ? school.schoolCode.split('-')[0].toLowerCase().replace(/[^a-z0-9]/g, '') 
        : school.name.substring(0,3).toLowerCase().replace(/[^a-z0-9]/g, '');

      console.log(`Starting bulk generation for ${studentsToProcess.length} students`);

      for (let i = 0; i < studentsToProcess.length; i++) {
          const student = studentsToProcess[i];
          const rawId = (student.rollNo && student.rollNo !== 'N/A') ? student.rollNo : Math.floor(1000 + Math.random() * 9000).toString();
          
          // Sanitize ID for email: remove slashes, dots, spaces etc.
          const sanitizedId = rawId.replace(/[^a-zA-Z0-9]/g, '');
          
          // Ensure we have a valid ID, otherwise use a random one
          const finalId = sanitizedId || Math.floor(100000 + Math.random() * 900000).toString();
          
          const autoEmail = `s.${finalId}.${schoolPrefix}@ilmaura.com`.toLowerCase();
          const autoPassword = `${finalId}123`;

          try {
              console.log(`Provisioning ${student.name} with email ${autoEmail}`);
              await provisionStudentPortalAccount(
                  schoolId,
                  student.id,
                  student,
                  { email: autoEmail, password: autoPassword }
              );
              successCount++;
          } catch (err: any) {
              console.error(`Failed to provision ${student.name}:`, err);
              // Store the first error to show the user
              if (!lastError) lastError = err.message || JSON.stringify(err);
              failCount++;
          }
          
          setBulkProgress(Math.round(((i + 1) / studentsToProcess.length) * 100));
      }

      setIsBulkGenerating(false);
      
      if (failCount > 0) {
          alert(`Bulk generation finished with errors.\n\n✅ Success: ${successCount}\n❌ Failed: ${failCount}\n\nLast Error: ${lastError}\n\nCheck console for details.`);
      } else {
          alert(`Success! Generated credentials for ${successCount} students.`);
      }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">App Access</h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="bg-white dark:bg-[#1e293b] text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                         Student Credentials
                     </span>
                </div>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">System Status</p>
                  <p className="text-sm font-bold">Secure • Encrypted</p>
               </div>
               <div className="w-10 h-10 border-2 border-white/20 flex items-center justify-center bg-white/10 dark:bg-[#1e293b]/10 text-white rounded-none">
                  <Lock size={20} weight="fill"/>
               </div>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="p-8 space-y-8">
            
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Students */}
                <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-blue-900 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Total Students</span>
                        <div className="p-2 bg-blue-900 text-white rounded-none">
                            <UsersThree size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{totalStudents}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Enrollment Base
                        </span>
                    </div>
                </div>

                {/* Active Access */}
                <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-emerald-600 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Active Accounts</span>
                        <div className="p-2 bg-emerald-600 text-white rounded-none">
                            <CheckCircle size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{activeCount}</h3>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                            {coveragePercent}% Coverage
                        </span>
                    </div>
                </div>

                {/* Pending Access */}
                <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-rose-600 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-rose-700 uppercase tracking-widest">Missing Access</span>
                        <div className="p-2 bg-rose-600 text-white rounded-none">
                            <WarningCircle size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{inactiveCount}</h3>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                            Action Required
                        </span>
                    </div>
                </div>
            </div>

            {/* --- TABLE CONTAINER --- */}
            <div className="bg-white dark:bg-[#1e293b] border-2 border-[#1e3a8a] shadow-sm overflow-hidden flex flex-col">
                
                {/* TOOLBAR */}
                <div className="px-6 py-4 bg-[#1e3a8a] border-b-2 border-[#1e3a8a] flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                        <Key size={18} weight="fill"/> Access Manager
                    </h3>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        
                        {/* Filters */}
                        <div className="bg-white dark:bg-[#1e293b] p-1 flex items-center w-full md:w-auto">
                             <select 
                                value={selectedClassId} 
                                onChange={e => setSelectedClassId(e.target.value)}
                                className="bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest w-32"
                             >
                                <option value="all">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                             <Funnel size={14} weight="fill" className="text-slate-400 mr-2"/>
                        </div>

                         <div className="bg-white dark:bg-[#1e293b] p-1 flex items-center w-full md:w-auto">
                             <select 
                                value={statusFilter} 
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className="bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest w-24"
                             >
                                <option value="all">Status: All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Missing</option>
                             </select>
                        </div>

                        {/* Search */}
                        <div className="bg-white dark:bg-[#1e293b] p-1 flex items-center w-full md:w-64">
                            <input 
                                type="text" 
                                placeholder="SEARCH..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest placeholder-slate-400"
                            />
                            <MagnifyingGlass size={14} weight="bold" className="text-slate-400 mr-2"/>
                        </div>

                        {/* Actions */}
                        <button onClick={() => setShowExportModal(true)} className="bg-white dark:bg-[#1e293b] text-[#1e3a8a] px-4 py-2 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-colors flex items-center gap-2">
                            <DownloadSimple size={14} weight="fill"/> Export
                        </button>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-[#1e293b] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-3">Student Name</th>
                                <th className="px-6 py-3">School ID</th>
                                <th className="px-6 py-3">Login ID</th>
                                <th className="px-6 py-3">Class</th>
                                <th className="px-6 py-3">App Email</th>
                                <th className="px-6 py-3">App Password</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student) => {
                                const password = getAppPassword(student);
                                const appEmail = getAppEmail(student);
                                const isActive = !!password;

                                return (
                                    <tr key={student.id} className="hover:bg-slate-50 dark:bg-[#0f172a] transition-colors group">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 flex items-center justify-center text-xs font-black border-2 border-slate-200 ${isActive ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-slate-100 text-slate-400'}`}>
                                                    {student.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{student.name}</p>
                                                    <p className="text-[10px] font-mono font-bold text-slate-400"></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 px-2 py-1 border border-slate-200 dark:border-[#1e293b] uppercase tracking-tighter">
                                                {school.schoolCode || schoolId.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[10px] font-black text-[#007bff] bg-blue-50 px-2 py-1 border border-blue-100 uppercase tracking-widest w-fit">
                                                {student.loginId || 'Not Set'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 px-2 py-1 border border-slate-200 dark:border-[#1e293b] uppercase">
                                                {getClassName(student.classId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`font-mono text-xs font-bold ${appEmail ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 italic'}`}>
                                                {appEmail || 'Not Provisioned'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                             {password ? (
                                                <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-1">
                                                    {password}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 uppercase">
                                                    Not Set
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredStudents.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <ShieldWarning size={32} className="mx-auto mb-2 opacity-50"/>
                        <h3 className="text-sm font-black uppercase tracking-widest">No Students Found</h3>
                    </div>
                )}
                
                <div className="p-3 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-[#1e293b] text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing {filteredStudents.length} Records
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowExportModal(false)}></div>
              <div className="bg-white dark:bg-[#1e293b] w-full max-w-md border-4 border-slate-800 p-0 relative z-10 shadow-2xl animate-in zoom-in-95">
                  <div className="bg-[#1e3a8a] text-white p-6 flex justify-between items-center border-b-4 border-black">
                      <div>
                          <h3 className="text-xl font-black uppercase tracking-tight">Export Records</h3>
                          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">Choose Format</p>
                      </div>
                      <button onClick={() => setShowExportModal(false)} className="text-white hover:rotate-90 transition-transform">
                          <WarningCircle size={24} weight="bold"/>
                      </button>
                  </div>
                  
                  <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button 
                              onClick={handleExportExcel}
                              className="flex flex-col items-center justify-center p-6 bg-emerald-50 border-2 border-emerald-600 hover:bg-emerald-100 transition-all group"
                          >
                              <div className="p-3 bg-emerald-600 text-white mb-3"><Table size={24} weight="fill"/></div>
                              <p className="font-black text-emerald-900 uppercase text-[10px]">Excel (.xlsx)</p>
                          </button>

                          <button 
                              onClick={handleExportWord}
                              className="flex flex-col items-center justify-center p-6 bg-purple-50 border-2 border-purple-600 hover:bg-purple-100 transition-all group"
                          >
                              <div className="p-3 bg-purple-600 text-white mb-3"><FileText size={24} weight="fill"/></div>
                              <p className="font-black text-purple-900 uppercase text-[10px]">Word (.docx)</p>
                          </button>

                          <button 
                              onClick={handleExportPDF}
                              className="flex flex-col items-center justify-center p-6 bg-rose-50 border-2 border-rose-600 hover:bg-rose-100 transition-all group"
                          >
                              <div className="p-3 bg-rose-600 text-white mb-3"><Printer size={24} weight="fill"/></div>
                              <p className="font-black text-rose-900 uppercase text-[10px]">PDF (.pdf)</p>
                          </button>

                          <button 
                              onClick={handlePrintGuides}
                              className="flex flex-col items-center justify-center p-6 bg-blue-50 border-2 border-blue-600 hover:bg-blue-100 transition-all group"
                          >
                              <div className="p-3 bg-blue-600 text-white mb-3"><IdentificationBadge size={24} weight="fill"/></div>
                              <p className="font-black text-blue-900 uppercase text-[10px]">Login Guides</p>
                          </button>
                      </div>
                  </div>

                  <div className="p-6 border-t-2 border-slate-100 dark:border-[#334155] bg-slate-50 dark:bg-[#0f172a] text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Exporting {filteredStudents.length} Records</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AppCredentials;
