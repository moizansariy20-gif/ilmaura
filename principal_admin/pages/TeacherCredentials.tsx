
import React, { useState, useMemo } from 'react';
import { 
  Lock, Eye, Printer, MagnifyingGlass, FileCsv, Key, CheckCircle, 
  ArrowsClockwise, DownloadSimple, ShieldWarning, MagicWand, CircleNotch,
  Funnel, CaretDown, UsersThree, WarningCircle, IdentificationBadge, 
  ListNumbers, FileText, Table
} from 'phosphor-react';
import { Teacher, School } from '../../types.ts';
import { updateTeacher, provisionTeacherAccount } from '../../services/api.ts';
import * as XLSX from 'xlsx';

interface TeacherCredentialsProps {
  schoolId: string;
  teachers: Teacher[];
  school: School; 
}

const TeacherCredentials: React.FC<TeacherCredentialsProps> = ({ schoolId, teachers, school }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Reset Password Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [teacherToReset, setTeacherToReset] = useState<Teacher | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Bulk Generation State
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [teachersToProcessCount, setTeachersToProcessCount] = useState(0);

  // --- DERIVED STATE ---
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isActive = !!t.customData?.mirror_password;
      const matchStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'active' ? isActive : !isActive;

      return matchSearch && matchStatus;
    });
  }, [teachers, searchTerm, statusFilter]);

  const totalTeachers = teachers.length;
  const activeCount = teachers.filter(t => !!t.customData?.mirror_password).length;
  const inactiveCount = teachers.length - activeCount;
  const coveragePercent = totalTeachers > 0 ? Math.round((activeCount / totalTeachers) * 100) : 0;

  // --- HELPERS ---
  const getLoginEmail = (teacher: Teacher) => {
      return teacher.email || 'Not Provisioned';
  };

  const getPassword = (teacher: Teacher) => {
      return teacher.customData?.mirror_password || null;
  };

  // --- ACTIONS ---

  const handleExport = () => {
      const data = filteredTeachers.map(t => ({
          'Teacher Name': t.name,
          'Designation': t.designation,
          'Login Email': getLoginEmail(t),
          'Password': getPassword(t) || 'Not Set'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Teacher Credentials");
      XLSX.writeFile(wb, `Teacher_Credentials_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const openResetModal = (teacher: Teacher) => {
      setTeacherToReset(teacher);
      const firstName = teacher.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      setNewPasswordInput(`Tch@${rand}`);
      setShowResetModal(true);
  };

  const handleSavePassword = async () => {
      if (!teacherToReset || !newPasswordInput) return;
      setIsUpdating(true);
      try {
          const payload = {
              customData: { ...teacherToReset.customData, mirror_password: newPasswordInput }
          };
          await updateTeacher(schoolId, teacherToReset.id, payload);
          alert(`Password record updated to: ${newPasswordInput}\n\nNote: If the account is already active, the teacher should use 'Forgot Password' or you must update their Auth password manually.`);
          setShowResetModal(false);
          setTeacherToReset(null);
      } catch (e) {
          console.error(e);
          alert("Failed to update record.");
      } finally {
          setIsUpdating(false);
      }
  };
  
  const handleBulkGenerate = () => {
      const toProcess = filteredTeachers.filter(t => !t.customData?.mirror_password);
      
      if (toProcess.length === 0) {
          alert("No teachers in current view need credentials.");
          return;
      }

      setTeachersToProcessCount(toProcess.length);
      setShowBulkConfirm(true);
  };

  const startBulkGeneration = async () => {
      setShowBulkConfirm(false);
      const teachersToProcess = filteredTeachers.filter(t => !t.customData?.mirror_password);
      
      if (teachersToProcess.length === 0) return;

      setIsBulkGenerating(true);
      setBulkProgress(0);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < teachersToProcess.length; i++) {
          const teacher = teachersToProcess[i];
          const randomId = Math.floor(1000 + Math.random() * 9000);
          const autoEmail = teacher.email || `${teacher.name.toLowerCase().replace(/\s/g, '.')}.${randomId}@ilmaura.com`;
          const autoPassword = `Tch@${randomId}`;

          try {
              await provisionTeacherAccount(
                  schoolId,
                  teacher.id,
                  teacher,
                  { email: autoEmail, password: autoPassword }
              );
              successCount++;
          } catch (err: any) {
              console.error(`Failed to provision ${teacher.name}:`, err);
              failCount++;
          }
          
          setBulkProgress(Math.round(((i + 1) / teachersToProcess.length) * 100));
      }

      setIsBulkGenerating(false);
      alert(`Finished! Success: ${successCount}, Failed: ${failCount}`);
  };

  const handlePrintGuides = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = filteredTeachers.map(t => `
      <div class="guide-card">
        <div class="header">
          <div class="branding">
            <h1 class="school-name">${school.name}</h1>
            <p class="guide-title">STAFF PORTAL ACCESS GUIDE</p>
          </div>
          <div class="student-photo-box">
            ${t.photoURL ? 
              `<img src="${t.photoURL}" alt="${t.name}" class="student-img" />` : 
              `<div class="photo-placeholder">${t.name[0]}</div>`
            }
          </div>
        </div>

        <div class="student-identity">
            <div class="i-field">
                <span class="i-label">Teacher Name</span>
                <span class="i-value">${t.name}</span>
            </div>
            <div class="i-field">
                <span class="i-label">Designation</span>
                <span class="i-value">${t.designation}</span>
            </div>
        </div>

        <div class="creds-section">
          <div class="cred-item">
            <span class="c-label">PORTAL URL</span>
            <span class="c-value">${window.location.host}</span>
          </div>
          <div class="cred-item">
            <span class="c-label">SCHOOL ID</span>
            <span class="c-value">${school.schoolCode || schoolId.slice(0, 8)}</span>
          </div>
          <div class="cred-item">
            <span class="c-label">LOGIN ID</span>
            <span class="c-value">${t.loginId || 'N/A'}</span>
          </div>
        </div>

        <div class="roadmap">
          <h3>ACTIVATION ROADMAP</h3>
          <div class="step">
            <div class="step-num">01</div>
            <div class="step-txt">
              Visit <strong>${window.location.host}</strong> in your phone browser.
            </div>
          </div>
          <div class="step">
            <div class="step-num">02</div>
            <div class="step-txt">
              Tap <strong>"Create Access"</strong> and enter your <strong>Login ID</strong>.
            </div>
          </div>
          <div class="step">
            <div class="step-num">03</div>
            <div class="step-txt">
              Verify your profile & set your <strong>Email/Password</strong> for permanent access.
            </div>
          </div>
          <div class="step">
            <div class="step-num">04</div>
            <div class="step-txt">
              Install the App & start managing your classes digitally!
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="brand">Powered by <strong>${school.name}</strong> Digital Ecosystem</div>
          <div class="tagline tracking-widest">FACULTY SMART HUB</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Staff Login Guides - ${school.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
            @page { size: A4; margin: 10mm; }
            .container { display: flex; flex-direction: column; align-items: center; padding: 20px; }
            .guide-card { 
              background: white; width: 100%; max-width: 170mm; min-height: 125mm; margin-bottom: 5mm; border: 3px solid #1e3a8a; 
              padding: 25px; box-sizing: border-box; position: relative; page-break-inside: avoid; display: flex; flex-direction: column;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); overflow: hidden;
            }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 2px solid #eff6ff; padding-bottom: 15px; }
            .school-name { margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: -1px; }
            .guide-title { margin: 5px 0 0 0; font-size: 11px; font-weight: 900; color: #64748b; letter-spacing: 2px; }
            .student-photo-box { width: 80px; height: 80px; border: 3px solid #1e3a8a; background: #f1f5f9; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .student-img { width: 100%; height: 100%; object-fit: cover; }
            .photo-placeholder { font-size: 32px; font-weight: 900; color: #cbd5e1; }
            .student-identity { display: flex; gap: 40px; margin-bottom: 20px; }
            .i-label { display: block; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px; }
            .i-value { display: block; font-size: 16px; font-weight: 900; color: #1e293b; }
            .creds-section { display: flex; gap: 15px; margin-bottom: 25px; }
            .cred-item { flex: 1; border: 2px solid #1e3a8a; padding: 12px 15px; }
            .c-label { display: block; font-size: 9px; font-weight: 900; color: #64748b; margin-bottom: 4px; letter-spacing: 1px; }
            .c-value { display: block; font-size: 16px; font-weight: 900; color: #1e3a8a; font-family: monospace; word-break: break-all; }
            .roadmap h3 { font-size: 11px; font-weight: 900; color: #1e3a8a; background: #eff6ff; padding: 6px 12px; margin: 0 0 15px 0; letter-spacing: 1px; display: inline-block; }
            .step { display: flex; gap: 12px; margin-bottom: 8px; }
            .step-num { font-size: 14px; font-weight: 900; color: #1e3a8a; opacity: 0.3; flex-shrink: 0; }
            .step-txt { font-size: 12px; line-height: 1.4; color: #475569; }
            .step-txt strong { color: #1e3a8a; }
            .footer { margin-top: auto; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; }
            .brand { font-size: 11px; color: #64748b; }
            .tagline { font-size: 9px; font-weight: 900; color: #cbd5e1; letter-spacing: 3px; }
            @media print {
              body { background: white; }
              .guide-card { box-shadow: none; border-width: 2px; margin-bottom: 0px; }
              .guide-card:nth-child(even) { page-break-after: always; }
              .guide-card:not(:last-child) { margin-bottom: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="container">${cardsHtml}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowExportModal(false);
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">Staff Access</h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                         Teacher App Logins
                     </span>
                </div>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Security Status</p>
                  <p className="text-sm font-bold">Verified • Active</p>
               </div>
               <div className="w-10 h-10 border-2 border-white/20 flex items-center justify-center bg-white/10 dark:bg-slate-800/10 text-white rounded-none">
                  <Lock size={20} weight="fill"/>
               </div>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="p-8 space-y-8">
            
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 border-2 border-blue-900 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Total Staff</span>
                        <div className="p-2 bg-blue-900 text-white rounded-none">
                            <UsersThree size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{totalTeachers}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Faculty</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 border-2 border-emerald-600 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Active App Access</span>
                        <div className="p-2 bg-emerald-600 text-white rounded-none">
                            <CheckCircle size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{activeCount}</h3>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{coveragePercent}% Coverage</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 border-2 border-rose-600 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-rose-700 uppercase tracking-widest">Missing Access</span>
                        <div className="p-2 bg-rose-600 text-white rounded-none">
                            <WarningCircle size={20} weight="fill"/>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{inactiveCount}</h3>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Action Required</span>
                    </div>
                </div>
            </div>

            {/* --- TABLE CONTAINER --- */}
            <div className="bg-white dark:bg-slate-800 border-2 border-[#1e3a8a] shadow-sm overflow-hidden flex flex-col">
                
                {/* TOOLBAR */}
                <div className="px-6 py-4 bg-[#1e3a8a] border-b-2 border-[#1e3a8a] flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                        <Key size={18} weight="fill"/> Staff Login Manager
                    </h3>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                         <div className="bg-white dark:bg-slate-800 p-1 flex items-center w-full md:w-auto">
                             <select 
                                value={statusFilter} 
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className="bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest w-32"
                             >
                                <option value="all">All Status</option>
                                <option value="active">Active Access</option>
                                <option value="inactive">Missing Access</option>
                             </select>
                             <Funnel size={14} weight="fill" className="text-slate-400 mr-2"/>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-1 flex items-center w-full md:w-64">
                            <input 
                                type="text" 
                                placeholder="SEARCH TEACHER..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest placeholder-slate-400"
                            />
                            <MagnifyingGlass size={14} weight="bold" className="text-slate-400 mr-2"/>
                        </div>

                        <button 
                            onClick={handleBulkGenerate} 
                            disabled={isBulkGenerating}
                            className="bg-[#1e3a8a] border-2 border-white text-white px-4 py-2 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:bg-slate-800 hover:text-[#1e3a8a] transition-colors flex items-center gap-2"
                        >
                            {isBulkGenerating ? <CircleNotch size={14} className="animate-spin"/> : <MagicWand size={14} weight="fill"/>}
                            {isBulkGenerating ? `${bulkProgress}%` : 'Auto-Gen'}
                        </button>
                        
                        <button onClick={() => setShowExportModal(true)} className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-4 py-2 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-colors flex items-center gap-2">
                            <DownloadSimple size={14} weight="fill"/> Export
                        </button>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-3">Teacher Name</th>
                                <th className="px-6 py-3">School ID</th>
                                <th className="px-6 py-3">Teacher ID</th>
                                <th className="px-6 py-3">Designation</th>
                                <th className="px-6 py-3">Login Email</th>
                                <th className="px-6 py-3">Password</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTeachers.map((teacher) => {
                                const password = getPassword(teacher);
                                const email = getLoginEmail(teacher);
                                const isActive = !!password;

                                return (
                                    <tr key={teacher.id} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 flex items-center justify-center text-xs font-black border-2 border-slate-200 shrink-0 overflow-hidden rounded-full ${isActive ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-slate-100 text-slate-400'}`}>
                                                    {teacher.photoURL ? (
                                                        <img src={teacher.photoURL} className="w-full h-full object-cover" />
                                                    ) : (
                                                        teacher.name[0]
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{teacher.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">UID: {teacher.id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 px-2 py-1 border border-slate-200 dark:border-slate-700 uppercase tracking-tighter">
                                                {school.schoolCode || schoolId.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[10px] font-black text-[#007bff] bg-blue-50 px-2 py-1 border border-blue-100 uppercase tracking-widest">
                                                {teacher.loginId || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 px-2 py-1 border border-slate-200 dark:border-slate-700 uppercase">
                                                {teacher.designation}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`font-mono text-xs font-bold ${isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 italic'}`}>
                                                {email}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                             {password ? (
                                                <span className="font-mono text-xs font-black text-[#1e3a8a] bg-blue-50 px-2 py-1 border border-blue-100">
                                                    {password}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 uppercase">
                                                    Missing
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button 
                                                onClick={() => openResetModal(teacher)}
                                                className="px-3 py-1.5 border-2 border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] text-slate-400 hover:text-[#1e3a8a] transition-all text-[10px] font-black uppercase tracking-wider"
                                            >
                                                Reset
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredTeachers.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <ShieldWarning size={32} className="mx-auto mb-2 opacity-50"/>
                        <h3 className="text-sm font-black uppercase tracking-widest">No Teachers Found</h3>
                    </div>
                )}
                
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing {filteredTeachers.length} Staff Members
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowExportModal(false)}></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-sm border-4 border-slate-800 p-0 relative z-10 shadow-2xl animate-in zoom-in-95">
                  <div className="bg-[#1e3a8a] text-white p-6 flex justify-between items-center border-b-4 border-black">
                      <h3 className="text-xl font-black uppercase tracking-tight">Export Credentials</h3>
                      <button onClick={() => setShowExportModal(false)} className="text-white opacity-50 hover:opacity-100">×</button>
                  </div>
                  
                  <div className="p-8">
                      <div className="grid grid-cols-2 gap-4">
                          <button 
                              onClick={handleExport}
                              className="flex flex-col items-center justify-center p-6 bg-emerald-50 border-2 border-emerald-600 hover:bg-emerald-100 transition-all group"
                          >
                              <div className="p-3 bg-emerald-600 text-white mb-3"><FileCsv size={24} weight="fill"/></div>
                              <p className="font-black text-emerald-900 uppercase text-[10px]">Excel (.xlsx)</p>
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
              </div>
          </div>
      )}

      {/* RESET MODAL */}
      {showResetModal && teacherToReset && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowResetModal(false)}></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-sm border-4 border-slate-800 p-0 relative z-10 shadow-2xl animate-in zoom-in-95">
                  <div className="bg-slate-800 text-white p-6 flex justify-between items-center border-b-4 border-black">
                      <div>
                          <h3 className="text-xl font-black uppercase tracking-tight">Reset Password</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">For {teacherToReset.name}</p>
                      </div>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">New Password</label>
                          <div className="flex gap-2">
                              <input 
                                  type="text" 
                                  value={newPasswordInput} 
                                  onChange={e => setNewPasswordInput(e.target.value)} 
                                  className="flex-1 p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-300 font-mono font-bold text-lg text-center text-[#1e3a8a] outline-none focus:border-[#1e3a8a]"
                              />
                              <button 
                                  onClick={() => {
                                      const rand = Math.floor(1000 + Math.random() * 9000);
                                      setNewPasswordInput(`Tch@${rand}`);
                                  }}
                                  className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-600 dark:text-slate-300"
                              >
                                  <ArrowsClockwise size={20} weight="bold"/>
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                      <button onClick={() => setShowResetModal(false)} className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-300 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                          Cancel
                      </button>
                      <button 
                          onClick={handleSavePassword} 
                          disabled={isUpdating}
                          className="flex-[2] py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[#172554] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* BULK CONFIRM MODAL */}
      {showBulkConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowBulkConfirm(false)}></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-sm border-4 border-slate-800 p-0 relative z-10 shadow-2xl animate-in zoom-in-95">
                  <div className="bg-[#1e3a8a] text-white p-6 flex justify-between items-center border-b-4 border-black">
                      <div>
                          <h3 className="text-xl font-black uppercase tracking-tight">Bulk Generate</h3>
                          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">Action Required</p>
                      </div>
                  </div>
                  
                  <div className="p-8 space-y-4 text-center">
                      <div className="w-16 h-16 bg-blue-50 text-[#1e3a8a] rounded-full flex items-center justify-center mx-auto border-2 border-[#1e3a8a]">
                          <MagicWand size={32} weight="fill"/>
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight leading-relaxed">
                          Generate login credentials for <span className="text-[#1e3a8a] font-black">{teachersToProcessCount} teachers</span>?
                      </p>
                  </div>

                  <div className="p-6 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                      <button onClick={() => setShowBulkConfirm(false)} className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-300 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                          Cancel
                      </button>
                      <button 
                          onClick={startBulkGeneration}
                          className="flex-[2] py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[#172554] transition-all"
                      >
                          Confirm & Generate
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TeacherCredentials;
