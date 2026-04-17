
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash, PencilSimple, BookOpen, X, CircleNotch, Warning, 
  FloppyDisk, Stack, ChalkboardTeacher, Student, Funnel, MagnifyingGlass,
  UsersThree, ArrowLeft as LArrowLeft, Sparkle as LSparkles, Gear as LSettings,
  Users as LUsers, Check as LCheck, Phone as LPhone, Student as LStudent,
  UserCircle
} from 'phosphor-react';
import { deleteClass } from '../../services/api.ts';
import { Class, Subject, Teacher } from '../../types.ts';

interface ClassManagementProps {
  schoolId: string;
  classes: Class[];
  teachers: Teacher[];
  students: any[];
  subjects: Subject[];
  profile?: any;
  onNavigate?: (path: string) => void;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ schoolId, classes, teachers, students, subjects, profile, onNavigate }) => {
  const navigate = useNavigate();
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openTeacherDropdown, setOpenTeacherDropdown] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBack = () => {
    navigate('/principal/dashboard');
  };

  // --- METRICS ---
  const totalStudents = students.length;
  const totalClasses = classes.length;
  const staffInvolved = new Set(classes.flatMap(c => c.involvedTeachers || [])).size;
  const totalSubjects = subjects.length;

  const handleExecuteDelete = async () => {
    if (!confirmDeleteTarget) return;
    try {
      await deleteClass(schoolId, confirmDeleteTarget.id);
      setConfirmDeleteTarget(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter classes
  const filteredClasses = classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isMobile) {
    return (
      <div className="bg-[#FCFBF8] dark:bg-slate-900 min-h-screen pb-32 font-sans">
        {/* Premium Mobile Header */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-[#1e3a8a]/10 dark:bg-white/10 flex items-center justify-center text-[#1e3a8a] dark:text-white border border-[#1e3a8a]/20 active:scale-90 transition-transform"
            >
              <LArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-[#1e3a8a] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(30,58,138,0.1)' }}>
                Classes
              </h1>
              <div className="flex flex-col mt-1">
                <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Principal App • Class Directory</p>
              </div>
            </div>
            <div className="flex p-1.5 bg-gradient-to-br from-[#1e3a8a] to-[#172554] shadow-[0_10px_25px_-5px_rgba(30,58,138,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-slate-800/10 flex items-center justify-center relative z-10">
                {profile?.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-white">
                    <LSparkles size={28} className="text-[#1e3a8a] dark:text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full border-2 border-[#1e3a8a] flex items-center justify-center shadow-lg">
                <LSettings size={10} className="text-[#1e3a8a] dark:text-white" />
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH CLASSES..."
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full p-4 pl-12 bg-[#FCFBF8] dark:bg-slate-900 shadow-[inset_0_2px_8px_rgba(30,58,138,0.04)] border border-[#E5E0D8] dark:border-slate-700 rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all"
              />
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        <div className="px-4 mt-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(30,58,138,0.05)] border border-[#E5E0D8] dark:border-slate-700 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <Stack size={24} className="drop-shadow-sm" weight="fill" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-3xl text-[#1e3a8a] dark:text-white leading-none drop-shadow-sm">{totalClasses}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Classes</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative z-10">
                  <Student size={24} className="drop-shadow-sm" weight="fill" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-3xl text-emerald-600 leading-none drop-shadow-sm">{totalStudents}</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest mt-2">Students</p>
                </div>
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                Class Directory
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {filteredClasses.length > 0 ? (
                filteredClasses.slice(0, visibleCount).map(cls => {
                  const classStudents = students.filter(s => s.classId === cls.id);
                  const classTeachers = cls.involvedTeachers?.map(id => teachers.find(t => t.id === id)).filter(Boolean) || [];
                  
                  return (
                    <div key={cls.id} className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border border-[#D4AF37]/20 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] flex flex-col gap-6 transition-all duration-300 relative overflow-hidden group`}>
                      <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#1e3a8a] opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                      
                      <div className="flex items-center justify-between relative z-10 pl-3">
                        <div className="flex items-center gap-5">
                          <div className="relative shrink-0">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#172554] text-white flex items-center justify-center font-black text-2xl shrink-0 border-2 border-white dark:border-slate-700 shadow-lg`}>
                                {cls.name[0]?.toUpperCase() || '?'}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-[#1e3a8a] dark:text-white text-xl leading-tight truncate tracking-tight">{cls.name}</p>
                            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mt-1 flex items-center gap-1">
                              <BookOpen size={10} /> {Object.keys(cls.subjectAssignments || {}).length} Subjects
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 pl-3 relative z-10">
                        <div className="bg-[#FCFBF8] dark:bg-slate-900/50 p-3 rounded-2xl border border-[#E5E0D8] dark:border-slate-700">
                          <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Students</p>
                          <p className="text-xs font-bold text-[#1e3a8a] dark:text-white truncate">{classStudents.length}</p>
                        </div>
                        <div className="bg-[#FCFBF8] dark:bg-slate-900/50 p-3 rounded-2xl border border-[#E5E0D8] dark:border-slate-700">
                          <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Teachers</p>
                          <p className="text-xs font-bold text-[#1e3a8a] dark:text-white truncate">{classTeachers.length}</p>
                        </div>
                      </div>

                      {/* Linked Teachers */}
                      <div className="pl-3 relative z-10">
                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <ChalkboardTeacher size={14} /> Assigned Teachers ({classTeachers.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {classTeachers.length > 0 ? classTeachers.map((t: any) => (
                            <div key={t.id} className="flex items-center gap-2 bg-[#FCFBF8] dark:bg-slate-900 p-2 rounded-xl border border-[#E5E0D8] dark:border-slate-700 shadow-sm">
                              <div className="w-6 h-6 rounded-lg overflow-hidden border border-[#D4AF37]/30">
                                {t.photoURL ? (
                                  <img src={t.photoURL} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#1e3a8a] to-[#172554] flex items-center justify-center text-white text-[8px] font-black">
                                    {t.name[0]}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black text-[#1e3a8a] dark:text-white leading-none">{t.name}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No teachers assigned</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-24 rounded-3xl bg-white dark:bg-slate-800 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                  <Stack size={48} className="text-[#D4AF37] mx-auto mb-4 opacity-50" weight="fill" />
                  <p className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">No Classes Found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
        
        {/* --- MAIN BASE CONTAINER --- */}
        <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
            
            {/* --- DASHBOARD HEADER --- */}
            <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Class Management</h1>
                    <div className="flex items-center gap-4 mt-2">
                         <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">Academic</span>
                         <span className="text-sm font-bold opacity-80">Manage Classes & Teachers</span>
                    </div>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                     <button 
                        onClick={() => navigate('/classes/add')}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-[#1e3a8a] text-xs font-black uppercase hover:bg-slate-200 transition-colors border-2 border-white shadow-sm rounded-none"
                     >
                        <Plus size={18} weight="fill"/> Add New Class
                     </button>
                </div>
            </div>

            {/* --- CONTENT BODY --- */}
            <div className="p-8 space-y-8">

                {/* --- METRICS GRID (Matches Dashboard) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Metric 1 */}
                    <div className="bg-white dark:bg-slate-800 p-6 border-2 border-blue-900 shadow-sm flex flex-col justify-between h-36 relative">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Total Classes</span>
                            <div className="p-2 bg-blue-900 text-white rounded-none">
                                <Stack size={20} weight="fill"/>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white">{totalClasses}</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Sections</span>
                        </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="bg-white dark:bg-slate-800 p-6 border-2 border-indigo-700 shadow-sm flex flex-col justify-between h-36 relative">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Students</span>
                            <div className="p-2 bg-indigo-700 text-white rounded-none">
                                <Student size={20} weight="fill"/>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white">{totalStudents}</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
                        </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="bg-white dark:bg-slate-800 p-6 border-2 border-slate-700 shadow-sm flex flex-col justify-between h-36 relative">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Teachers</span>
                            <div className="p-2 bg-slate-700 text-white rounded-none">
                                <ChalkboardTeacher size={20} weight="fill"/>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white">{staffInvolved}</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned to Classes</span>
                        </div>
                    </div>

                    {/* Metric 4 */}
                    <div className="bg-white dark:bg-slate-800 p-6 border-2 border-emerald-600 shadow-sm flex flex-col justify-between h-36 relative">
                         <div className="flex justify-between items-start">
                            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Subjects</span>
                            <div className="p-2 bg-emerald-600 text-white rounded-none">
                                <BookOpen size={20} weight="fill"/>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white">{totalSubjects}</h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taught in School</span>
                        </div>
                    </div>

                </div>

                {/* --- TOOLBAR --- */}
                <div className="bg-slate-800 p-4 border-b-4 border-slate-900 flex justify-between items-center shadow-sm">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Funnel size={18} weight="fill"/> Filter Classes
                    </h3>
                    <div className="relative w-64">
                         <input 
                            type="text" 
                            placeholder="SEARCH BY NAME..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white placeholder-slate-400 text-xs font-bold uppercase tracking-widest border border-slate-600 focus:border-white outline-none rounded-none"
                         />
                         <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" weight="bold"/>
                    </div>
                </div>

                {/* --- CLASSES GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredClasses.map((cls, idx) => {
                        const studentCount = students.filter(s => s.classId === cls.id).length;
                        const specialistCount = cls.subjectAssignments ? Object.keys(cls.subjectAssignments).length : 0;
                        
                        // Look up teacher photo from the master teachers list to ensure it's current
                        const teacherInList = teachers.find(t => t.id === cls.classTeacher?.id);
                        // Priority: 1. Master list photo, 2. Snapshot photo, 3. Fallback to name initial
                        const displayPhoto = teacherInList?.photoURL || cls.classTeacher?.photoURL;
                        const teacherName = teacherInList?.name || cls.classTeacher?.name || cls.name;

                        return (
                          <div key={cls.id} style={{ animationDelay: `${idx * 50}ms` }} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-[#1e3a8a] transition-all group relative animate-in slide-in-from-bottom-4 flex flex-col justify-between">
                             
                             <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                                            {cls.name} {cls.section && <span className="text-blue-600">({cls.section})</span>}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1 uppercase tracking-wider">
                                            {studentCount} Students Enrolled
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-slate-100 overflow-hidden border-2 border-slate-200 dark:border-slate-700 rounded-none group-hover:border-[#1e3a8a] transition-colors flex items-center justify-center">
                                         {displayPhoto ? (
                                             <img 
                                                src={displayPhoto} 
                                                alt={teacherName} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // If image fails to load, hide it to show the initial
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                             />
                                         ) : (
                                             <span className="text-slate-500 dark:text-slate-400 font-black text-lg group-hover:text-[#1e3a8a]">{cls.name[0]}</span>
                                         )}
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group-hover:border-blue-100 transition-colors">
                                        <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Class Teacher</span>
                                        <div className="flex items-center gap-2">
                                            {cls.classTeacher?.photoURL && (
                                                <img src={cls.classTeacher.photoURL} className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700" alt="" />
                                            )}
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{cls.classTeacher?.name || 'Not Assigned'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* NEW: Operational Fields */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-emerald-50 border border-emerald-100">
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block">Attendance</span>
                                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100">P: -- / A: --</span>
                                        </div>
                                        <div className="p-2 bg-amber-50 border border-amber-100">
                                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider block">Fee Status</span>
                                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100">P: -- / U: --</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] items-center">
                                            <span className="text-slate-600 dark:text-slate-300 font-bold">Monitor:</span>
                                            {cls.classMonitor ? (() => {
                                                const monitor = students.find(s => s.id === cls.classMonitor);
                                                return monitor ? (
                                                    <div className="flex items-center gap-1">
                                                        {monitor.photoURL ? (
                                                            <img src={monitor.photoURL} alt={monitor.name} className="w-4 h-4 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 dark:text-slate-400">
                                                                {monitor.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="text-slate-800 dark:text-slate-100 font-black">{monitor.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-800 dark:text-slate-100 font-black">N/A</span>
                                                );
                                            })() : (
                                                <span className="text-slate-800 dark:text-slate-100 font-black">N/A</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-600 dark:text-slate-300 font-bold">Room:</span>
                                            <span className="text-slate-800 dark:text-slate-100 font-black">{cls.roomNumber || 'N/A'} {cls.floor ? `(${cls.floor})` : ''}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-600 dark:text-slate-300 font-bold">Timing:</span>
                                            <span className="text-slate-800 dark:text-slate-100 font-black">{cls.startTime && cls.endTime ? `${cls.startTime} - ${cls.endTime}` : 'N/A'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <div 
                                            onClick={() => setOpenTeacherDropdown(openTeacherDropdown === cls.id ? null : cls.id)}
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-colors cursor-pointer"
                                        >
                                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Teacher Count</span>
                                            <span className="text-xs font-bold text-indigo-600">{cls.involvedTeachers?.length || 0} Assigned</span>
                                        </div>
                                        
                                        {/* Dropdown */}
                                        {openTeacherDropdown === cls.id && cls.involvedTeachers && cls.involvedTeachers.length > 0 && (
                                            <div className="absolute bottom-full left-0 w-full mb-2 z-10">
                                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-md overflow-hidden max-h-48 overflow-y-auto">
                                                    {cls.involvedTeachers.map(teacherId => {
                                                        const teacher = teachers.find(t => t.id === teacherId);
                                                        if (!teacher) return null;
                                                        
                                                        // Determine designation in this class
                                                        let role = "Subject Teacher";
                                                        if (cls.classTeacher?.id === teacherId) {
                                                            role = "Class Teacher";
                                                        }
                                                        
                                                        return (
                                                            <div key={teacherId} className="flex items-center gap-3 p-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 dark:bg-slate-800/50">
                                                                {teacher.photoURL ? (
                                                                    <img src={teacher.photoURL} alt={teacher.name} className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400">
                                                                        {teacher.name.charAt(0)}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{teacher.name}</span>
                                                                    <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{role}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             </div>

                             <div className="flex border-t-2 border-slate-100 dark:border-slate-800">
                                <button 
                                    onClick={() => navigate('/classes/edit', { state: { editClassId: cls.id } })} 
                                    className="flex-1 py-4 bg-[#1e3a8a] text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PencilSimple size={14} weight="bold"/> Edit
                                </button>
                                <div className="w-0.5 bg-slate-100"></div>
                                <button 
                                    onClick={() => setConfirmDeleteTarget(cls)} 
                                    className="px-6 py-4 bg-white dark:bg-slate-800 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-colors"
                                >
                                    <Trash size={14} weight="bold"/>
                                </button>
                             </div>
                          </div>
                        );
                    })}

                    {filteredClasses.length === 0 && (
                        <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <p className="font-black text-slate-300 text-xl uppercase tracking-widest">No Classes Found</p>
                            <p className="text-slate-400 text-xs font-bold mt-2">Add a new class to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDeleteTarget && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setConfirmDeleteTarget(null)}></div>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-none border-4 border-rose-600 p-0 relative z-10 shadow-2xl animate-in zoom-in-95">
                <div className="bg-rose-600 p-6 text-white text-center">
                    <Warning size={40} className="mx-auto mb-2" weight="bold"/>
                    <h3 className="text-xl font-black uppercase tracking-tight">Delete Class</h3>
                </div>
                <div className="p-8 text-center">
                    <p className="text-slate-600 dark:text-slate-300 font-bold text-sm leading-relaxed">
                        Are you sure you want to delete <span className="text-slate-900 dark:text-white font-black uppercase">{confirmDeleteTarget.name}</span>? 
                        <br/><br/>
                        <span className="text-rose-600 text-xs uppercase tracking-widest">This cannot be undone.</span>
                    </p>
                </div>
                <div className="flex border-t-2 border-slate-100 dark:border-slate-800">
                    <button onClick={() => setConfirmDeleteTarget(null)} className="flex-1 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">Cancel</button>
                    <button onClick={handleExecuteDelete} className="flex-1 py-4 bg-white dark:bg-slate-800 text-rose-600 font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-colors border-l-2 border-slate-100 dark:border-slate-800">Yes, Delete</button>
                </div>
            </div>
            </div>
        )}

    </div>
  );
};

export default ClassManagement;
