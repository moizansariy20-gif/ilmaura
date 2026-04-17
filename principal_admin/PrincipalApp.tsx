
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home01Icon,
  DashboardSquare01Icon,
  Settings01Icon
} from 'hugeicons-react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  subscribeToSchoolDetails, 
  subscribeToTeachers, 
  subscribeToStudents, 
  subscribeToClasses, 
  subscribeToAttendanceByDate, 
  subscribeToSubjects, 
  subscribeToResources, 
  subscribeToFeeLedger, 
  subscribeToExpenses,
  subscribeToEnquiries,
  subscribeToTeacherAttendanceByDate,
  subscribeToAnnouncementsBySchool
} from '../services/api.ts';
import { 
  SquaresFour,
  ChalkboardTeacher,
  Student,
  Chalkboard,
  Books,
  CalendarCheck,
  Clock,
  CurrencyDollar,
  IdentificationCard,
  Gear,
  SignOut,
  List,
  MagnifyingGlass,
  Bell,
  CaretDown,
  CaretUp,
  Palette,
  Receipt,
  CreditCard,
  ChartPieSlice,
  Table,
  Sliders,
  UserPlus,
  AddressBook,
  Megaphone,
  UserList,
  Circle,
  Funnel,
  FolderOpen,
  FileText,
  PencilSimple,
  Key,
  ListChecks,
  Wallet,
  ArrowsClockwise,
  WarningCircle,
  Broadcast,
  Sparkle,
  GraduationCap,
  Exam,
  TrendUp,
  ShieldCheck,
  Lifebuoy,
  Info,
  ArrowRight,
  Users,
  ShareNetwork,
  VideoCamera,
  Plus,
  HandPointing,
  QrCode,
  Scan,
  Lightning,
  Sun,
  Moon
} from 'phosphor-react';
// Lazy load sub-pages for performance
const TeacherAvailability = lazy(() => import('./pages/TeacherAvailability.tsx'));
const PeriodEngagement = lazy(() => import('./pages/PeriodEngagement.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const TeacherManagement = lazy(() => import('./pages/TeacherManagement.tsx'));
const StudentManagement = lazy(() => import('./pages/StudentManagement.tsx'));
const FeeManagement = lazy(() => import('./pages/FeeManagement.tsx').then(m => ({ default: m.FeeManagement })));
const SchoolBranding = lazy(() => import('./pages/SchoolBranding.tsx'));
const ClassManagement = lazy(() => import('./pages/ClassManagement.tsx'));
const ClassDetails = lazy(() => import('./pages/ClassDetails.tsx'));
const AddClass = lazy(() => import('./pages/AddClass.tsx'));
const AttendanceManagement = lazy(() => import('./pages/AttendanceManagement.tsx'));
const TimetableManagement = lazy(() => import('./pages/TimetableManagement.tsx'));
const SubjectManagement = lazy(() => import('./pages/SubjectManagement.tsx'));
const ProfilePage = lazy(() => import('./pages/Profile.tsx'));
const IdCardManagement = lazy(() => import('./pages/IdCardManagement.tsx'));
const ManualAttendance = lazy(() => import('./pages/ManualAttendance.tsx'));
const QRAttendance = lazy(() => import('./pages/QRAttendance.tsx'));
const FaceAttendance = lazy(() => import('./pages/FaceAttendance.tsx'));
const EnquiryManagement = lazy(() => import('./pages/EnquiryManagement.tsx'));
const StudentDocuments = lazy(() => import('./pages/StudentDocuments.tsx'));
const TeacherDocuments = lazy(() => import('./pages/TeacherDocuments.tsx'));
const TeacherCredentials = lazy(() => import('./pages/TeacherCredentials.tsx'));
const AppCredentials = lazy(() => import('./pages/AppCredentials.tsx'));
const ExpenseManagement = lazy(() => import('./pages/ExpenseManagement.tsx'));
const TeacherAttendance = lazy(() => import('./pages/TeacherAttendance.tsx'));
const ComplaintsManagement = lazy(() => import('./pages/ComplaintsManagement.tsx'));
const NoticesManagement = lazy(() => import('./pages/NoticesManagement.tsx'));
const CommunicationCenter = lazy(() => import('./pages/CommunicationCenter.tsx'));
const AIReports = lazy(() => import('./pages/AIReports.tsx'));
const OtherStaffManagement = lazy(() => import('./pages/OtherStaffManagement.tsx'));
const PayrollManagement = lazy(() => import('./pages/PayrollManagement.tsx'));
const ActivityLogPage = lazy(() => import('./pages/ActivityLog.tsx'));
const StaffAccessPage = lazy(() => import('./pages/StaffAccess.tsx'));
const HelpSupport = lazy(() => import('./pages/HelpSupport.tsx'));
const SystemInfo = lazy(() => import('./pages/SystemInfo.tsx'));
const StudentPromotion = lazy(() => import('./pages/StudentPromotion.tsx'));
const ParentManagement = lazy(() => import('./pages/ParentManagement.tsx'));
const SocialMediaManagement = lazy(() => import('./pages/SocialMediaManagement.tsx'));
const CCTVCameras = lazy(() => import('./pages/CCTVCameras.tsx'));
const StudentImagesGallery = lazy(() => import('./pages/StudentImagesGallery.tsx'));
const MyTools = lazy(() => import('./pages/MyTools.tsx'));

import { AttendanceRecord, FeeTransaction, Complaint } from '../types.ts';
import PrincipalSkeleton from './components/PrincipalSkeleton.tsx';
import CustomCursor from '../src/components/CustomCursor.tsx';
import { usePermissions } from '../hooks/usePermissions.ts';
import { subscribeToComplaints } from '../services/api.ts';

interface PrincipalAppProps {
  profile: any;
  onLogout: () => void;
  onClearSchoolId?: () => void;
}

const PrincipalApp: React.FC<PrincipalAppProps> = ({ profile: initialProfile, onLogout, onClearSchoolId }) => {
  const [profile, setProfile] = useState(initialProfile);
  
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const { canView } = usePermissions(profile);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL path
  const activeTab = location.pathname.replace(/^\//, '') || 'dashboard';

  const [expandedMenus, setExpandedMenus] = useState<string[]>([]); 
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [todaysAttendance, setTodaysAttendance] = useState<AttendanceRecord[]>([]);
  const [todaysTeacherAttendance, setTodaysTeacherAttendance] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ledger, setLedger] = useState<FeeTransaction[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  
  // GLOBAL SEARCH STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [isCustomCursorEnabled, setIsCustomCursorEnabled] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear search when switching tabs
  useEffect(() => {
    setSearchTerm('');
  }, [location.pathname]);

    const [isSchoolLoaded, setIsSchoolLoaded] = useState(false);
    const [isTeachersLoaded, setIsTeachersLoaded] = useState(false);
    const [isStudentsLoaded, setIsStudentsLoaded] = useState(false);
    const [isClassesLoaded, setIsClassesLoaded] = useState(false);
    const [isAttendanceLoaded, setIsAttendanceLoaded] = useState(false);
    const [isTeacherAttendanceLoaded, setIsTeacherAttendanceLoaded] = useState(false);
    const [isExpensesLoaded, setIsExpensesLoaded] = useState(false);
    const [isLedgerLoaded, setIsLedgerLoaded] = useState(false);
    const [isEnquiriesLoaded, setIsEnquiriesLoaded] = useState(false);

    // Check if all critical data is loaded
    useEffect(() => {
        if (
            isSchoolLoaded && 
            isTeachersLoaded && 
            isStudentsLoaded && 
            isClassesLoaded &&
            isAttendanceLoaded &&
            isTeacherAttendanceLoaded &&
            isExpensesLoaded &&
            isLedgerLoaded &&
            isEnquiriesLoaded
        ) {
            setLoading(false);
        }
    }, [
        isSchoolLoaded, isTeachersLoaded, isStudentsLoaded, isClassesLoaded,
        isAttendanceLoaded, isTeacherAttendanceLoaded, isExpensesLoaded, isLedgerLoaded, isEnquiriesLoaded
    ]);

    useEffect(() => {
    if (!profile?.schoolId) {
      setLoading(false);
      setError("No school context found. Please log in again.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setIsSchoolLoaded(false);
    setIsTeachersLoaded(false);
    setIsStudentsLoaded(false);
    setIsClassesLoaded(false);
    setIsAttendanceLoaded(false);
    setIsTeacherAttendanceLoaded(false);
    setIsExpensesLoaded(false);
    setIsLedgerLoaded(false);
    setIsEnquiriesLoaded(false);

    // Safety Timeout: If data doesn't load in 45 seconds, show error
    const timeout = setTimeout(() => {
      console.warn("PrincipalApp: Data fetch timeout reached (45s).");
      setError("The portal is taking longer than expected to load. This might be due to a slow connection or a system issue. Please try again.");
      setLoading(false);
    }, 45000);

    const today = new Date().toISOString().split('T')[0];
    
    const handleSchoolData = (d: any) => {
      setSchool(d); 
      setIsSchoolLoaded(true);
      clearTimeout(timeout);
    };

    const handleSchoolError = (e: any) => {
      console.error("PrincipalApp: School Details Error:", e);
      if (e?.message?.includes('Failed to fetch')) {
          setError("CRITICAL ERROR: Failed to connect to Supabase. Your SUPABASE_ANON_KEY in services/supabase.ts is invalid (it looks like a Stripe key, not a Supabase JWT). Please update it with the correct Anon Key from your Supabase Project Settings > API.");
      } else {
          setError("Failed to load school details. Your session might have expired or the school ID is invalid.");
      }
      setLoading(false);
      clearTimeout(timeout);
    };

    const unsubs = [
      subscribeToSchoolDetails(profile.schoolId, handleSchoolData, handleSchoolError),
      subscribeToTeachers(profile.schoolId, (data) => { setTeachers(data); setIsTeachersLoaded(true); }, (e: any) => { console.error("Teachers Error:", e); setIsTeachersLoaded(true); }),
      subscribeToStudents(profile.schoolId, (data) => { setStudents(data); setIsStudentsLoaded(true); }, (e: any) => { console.error("Students Error:", e); setIsStudentsLoaded(true); }),
      subscribeToClasses(profile.schoolId, (data) => { setClasses(data); setIsClassesLoaded(true); }, (e: any) => { console.error("Classes Error:", e); setIsClassesLoaded(true); }),
      subscribeToSubjects(profile.schoolId, setSubjects, (e: any) => console.error("Subjects Error:", e)),
      subscribeToResources(profile.schoolId, setResources, (e: any) => console.error("Resources Error:", e)),
      subscribeToAttendanceByDate(profile.schoolId, today, (data) => { setTodaysAttendance(data); setIsAttendanceLoaded(true); }, (e: any) => { console.error("Attendance Error:", e); setIsAttendanceLoaded(true); }),
      subscribeToTeacherAttendanceByDate(profile.schoolId, today, (data) => { setTodaysTeacherAttendance(data); setIsTeacherAttendanceLoaded(true); }, (e: any) => { console.error("Teacher Attendance Error:", e); setIsTeacherAttendanceLoaded(true); }),
      subscribeToFeeLedger(profile.schoolId, (data) => { setLedger(data); setIsLedgerLoaded(true); }, (e: any) => { console.error("Ledger subscription error:", e); setIsLedgerLoaded(true); }),
      subscribeToExpenses(profile.schoolId, (data) => { setExpenses(data); setIsExpensesLoaded(true); }, (e: any) => { console.error("Expenses Error:", e); setIsExpensesLoaded(true); }),
      subscribeToEnquiries(profile.schoolId, (data) => { setEnquiries(data); setIsEnquiriesLoaded(true); }, (e: any) => { console.error("Enquiries Error:", e); setIsEnquiriesLoaded(true); }),
      subscribeToComplaints(profile.schoolId, (data) => setComplaints(data), console.error),
    ];

    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };
    
    (window as any).refreshPrincipalData = refreshData;
    
    return () => {
      unsubs.forEach(unsub => unsub());
      clearTimeout(timeout);
    };
  }, [profile?.schoolId, refreshKey]); // Only re-run if schoolId or refreshKey changes

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <WarningCircle size={32} weight="fill" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Portal Access Error</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-md mb-6">{error}</p>
        <div className="flex gap-3">
          <button 
            onClick={() => { setError(null); setRefreshKey(prev => prev + 1); }} 
            className="px-6 py-2 bg-[#1e3a8a] text-white font-bold rounded-md hover:bg-[#172554] transition-colors flex items-center gap-2"
          >
            <ArrowsClockwise size={18} /> Retry
          </button>
          <button 
            onClick={() => {
              if (onClearSchoolId) onClearSchoolId();
              onLogout();
            }} 
            className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 text-slate-700 dark:text-slate-200 font-bold rounded-md hover:bg-slate-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (loading || !school) return <PrincipalSkeleton />;

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const setActiveTab = (tab: string) => {
    navigate(`/${tab}`);
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const toggleCustomCursor = () => {
    setIsCustomCursorEnabled(!isCustomCursorEnabled);
  };

  // --- DATA PROCESSING FOR KPI CARDS ---
  const presentStudents = todaysAttendance.filter(rec => rec.status === 'Present').length;
  const totalStudentsCount = students.length;
  const attendanceRate = totalStudentsCount > 0 ? Math.round((presentStudents / totalStudentsCount) * 100) : 0;
  
  const staffPresent = todaysTeacherAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const totalStaff = teachers.length;
  const staffAbsent = totalStaff - staffPresent;

  const financialStats = (() => {
    let totalCollectible = 0;
    let totalCollected = 0;
    
    students.forEach(student => {
        const classFee = school.feeConfig?.classFees?.[student.classId] || 0;
        totalCollectible += classFee;
        if (student.feeStatus === 'Paid') {
            totalCollected += classFee;
        }
    });

    const totalPending = totalCollectible - totalCollected;
    const todaysExpenses = expenses
        .filter(exp => exp.date === new Date().toISOString().split('T')[0])
        .reduce((acc, exp) => acc + (exp.amount || 0), 0);

    return { totalCollectible, totalCollected, totalPending, todaysExpenses };
  })();

  const todaysBirthdayStudentsCount = (() => {
    const todayStr = new Date().toISOString().slice(5, 10); // MM-DD
    return students.filter(s => {
        const dob = s.dob || s.customData?.dob;
        return dob && dob.endsWith(todayStr);
    }).length;
  })();

  const openComplaintsCount = complaints.filter(c => c.status === 'Open').length;

  // SOLID ICONS CONFIGURATION (Font Awesome Style)
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: <SquaresFour size={20} weight="regular" /> },
    { 
      id: 'students', 
      label: 'Students', 
      icon: <Student size={20} weight="regular" />,
      children: [
        { id: 'students_directory', label: 'Student Register', icon: <AddressBook size={16} weight="regular" /> },
        { id: 'students_admissions', label: 'New Admissions', icon: <UserPlus size={16} weight="regular" /> },
        { id: 'students_form_builder', label: 'Form Builder', icon: <ListChecks size={16} weight="regular" /> },
        { id: 'students_credentials', label: 'App Logins', icon: <Key size={16} weight="regular" /> },
        { id: 'students_forms', label: 'Printable Forms', icon: <FileText size={16} weight="regular" /> },
        { id: 'students_idcards', label: 'Identity Cards', icon: <IdentificationCard size={16} weight="regular" /> },
        { id: 'students_gallery', label: 'Student Photos', icon: <Palette size={16} weight="regular" /> },
        { id: 'students_documents', label: 'Documents', icon: <FolderOpen size={16} weight="regular" /> },
        { id: 'students_promotion', label: 'Promote Students', icon: <ArrowRight size={16} weight="regular" /> }
      ]
    },
    { 
      id: 'parents', 
      label: 'Parents', 
      icon: <Users size={20} weight="regular" />,
      children: [
        { id: 'parents_directory', label: 'Parent Register', icon: <AddressBook size={16} weight="regular" /> },
        { id: 'parents_communication', label: 'Communication', icon: <Broadcast size={16} weight="regular" /> },
        { id: 'parents_settings', label: 'Matching Settings', icon: <Gear size={16} weight="regular" /> },
      ]
    },
    { 
      id: 'teachers', 
      label: 'Teachers', 
      icon: <ChalkboardTeacher size={20} weight="regular" />,
      children: [
        { id: 'teachers_directory', label: 'Teacher Register', icon: <AddressBook size={16} weight="regular" /> },
        { id: 'teachers_add', label: 'Add Teacher', icon: <UserPlus size={16} weight="regular" /> },
        { id: 'teachers_credentials', label: 'App Logins', icon: <Key size={16} weight="regular" /> },
      ]
    },
    { 
      id: 'academics', 
      label: 'Academics', 
      icon: <GraduationCap size={20} weight="regular" />,
      children: [
        { id: 'subjects', label: 'Subjects', icon: <Books size={16} weight="regular" /> },
        { id: 'academics_exams', label: 'Exams & Results', icon: <Exam size={16} weight="regular" /> },
        { id: 'academics_tracking', label: 'Student Tracking', icon: <TrendUp size={16} weight="regular" /> }
      ]
    },
    { 
      id: 'classes', 
      label: 'Classes', 
      icon: <Chalkboard size={20} weight="regular" />,
      children: [
        { id: 'classes', label: 'All Classes', icon: <Chalkboard size={16} weight="regular" /> },
        { id: 'classes/add', label: 'Add Class', icon: <Plus size={16} weight="regular" /> },
        { id: 'academics_timetable', label: 'Timetable', icon: <Clock size={16} weight="regular" /> },
        { id: 'teacher_availability', label: 'Teacher Availability', icon: <Clock size={16} weight="regular" /> },
        { id: 'period_engagement', label: 'Period Engagement', icon: <ListChecks size={16} weight="regular" /> }
      ]
    },
    { 
      id: 'attendance', 
      label: 'Attendance', 
      icon: <CalendarCheck size={20} weight="regular" />,
      children: [
        { id: 'attendance_manual', label: 'Manual Entry', icon: <HandPointing size={16} weight="regular" /> },
        { id: 'attendance_qr', label: 'QR/Barcode Scanner', icon: <QrCode size={16} weight="regular" /> },
        { id: 'attendance_face', label: 'Face Recognition', icon: <Scan size={16} weight="regular" /> },
        { id: 'attendance_staff', label: 'Staff Attendance', icon: <UserList size={16} weight="regular" /> },
      ]
    },
    { 
      id: 'fees', 
      label: 'Fees', 
      icon: <CurrencyDollar size={20} weight="regular" />,
      children: [
        { id: 'fees_dashboard', label: 'Fee Dashboard', icon: <ChartPieSlice size={16} weight="regular" /> },
        { id: 'fees_students', label: 'Student Fees', icon: <Student size={16} weight="regular" /> },
        { id: 'fees_ledger', label: 'Ledger', icon: <Table size={16} weight="regular" /> },
        { id: 'fees_structure', label: 'Fee Structure', icon: <Sliders size={16} weight="regular" /> }
      ]
    },
    {
      id: 'hr_payroll',
      label: 'HR & Payroll',
      icon: <Wallet size={20} weight="regular" />,
      children: [
        { id: 'teachers_other_staff', label: 'Staff Register', icon: <UserList size={16} weight="regular" /> },
        { id: 'teachers_add_staff', label: 'Add Other Staff', icon: <UserPlus size={16} weight="regular" /> },
        { id: 'teachers_payroll', label: 'Salary Management', icon: <Wallet size={16} weight="regular" /> },
        { id: 'staff_access', label: 'Staff Access', icon: <ShieldCheck size={16} weight="regular" /> },
        { id: 'teachers_documents', label: 'Staff Documents', icon: <FolderOpen size={16} weight="regular" /> }
      ]
    },
    { 
      id: 'expenses', 
      label: 'Expenses', 
      icon: <Wallet size={20} weight="regular" />,
      children: [
        { id: 'expenses_daily', label: 'Daily Log', icon: <Receipt size={16} weight="regular" /> },
        { id: 'expenses_recurring', label: 'Recurring', icon: <ArrowsClockwise size={16} weight="regular" /> }
      ]
    },
    { id: 'enquiries', label: 'Inquiries', icon: <Funnel size={20} weight="regular" /> },
    { id: 'communication', label: 'Communication', icon: <Broadcast size={20} weight="regular" /> },
    { id: 'social_media', label: 'Social Media', icon: <ShareNetwork size={20} weight="regular" /> },
    ...(canView('cctv') ? [{ id: 'cctv_cameras', label: 'CCTV Cameras', icon: <VideoCamera size={20} weight="regular" /> }] : []),
    { id: 'notices', label: 'Notice Board', icon: <Broadcast size={20} weight="regular" /> },
    { id: 'complaints', label: 'Complaints', icon: <WarningCircle size={20} weight="regular" /> },
    { id: 'ai_reports', label: 'AI Reports', icon: <Sparkle size={20} weight="regular" /> },
    { id: 'activity_log', label: 'Activity Log', icon: <Clock size={20} weight="regular" /> },
    { id: 'help_support', label: 'Help & Support', icon: <Lifebuoy size={20} weight="regular" /> },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Gear size={20} weight="regular" />,
      children: [
        { id: 'settings_design', label: 'Design Center', icon: <Palette size={16} weight="regular" /> }
      ]
    },
  ];
  
  const renderContent = () => {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div></div>}>
        <Routes>
          <Route path="/dashboard" element={
            <Dashboard 
              school={school} 
              teachers={teachers} 
              students={students} 
              classes={classes} 
              todaysAttendance={todaysAttendance}
              todaysTeacherAttendance={todaysTeacherAttendance}
              expenses={expenses}
              enquiries={enquiries}
              announcements={announcements}
              onNavigate={setActiveTab}
            />
          } />

          <Route path="/tools" element={
            <MyTools 
              onNavigate={setActiveTab}
            />
          } />
          
          <Route path="/teacher_availability" element={<TeacherAvailability schoolId={profile.schoolId} school={school} teachers={teachers} classes={classes} subjects={subjects} />} />
          <Route path="/period_engagement" element={<PeriodEngagement schoolId={profile.schoolId} school={school} teachers={teachers} classes={classes} subjects={subjects} />} />
          
          {/* Breakdown of Students */}
          <Route path="/students_directory" element={<StudentManagement profile={profile} schoolId={profile.schoolId} students={students} classes={classes} school={school} ledger={ledger} searchTerm={searchTerm} view="directory" onNavigate={setActiveTab} onRefresh={() => (window as any).refreshPrincipalData?.()} />} />
          <Route path="/students_admissions" element={<StudentManagement profile={profile} schoolId={profile.schoolId} students={students} classes={classes} school={school} ledger={ledger} searchTerm={searchTerm} view="admissions" onNavigate={setActiveTab} onRefresh={() => (window as any).refreshPrincipalData?.()} />} />
          <Route path="/parents_directory" element={<ParentManagement profile={profile} schoolId={profile.schoolId} school={school} classes={classes} onNavigate={setActiveTab} />} />
          <Route path="/parents_communication" element={<CommunicationCenter schoolId={profile.schoolId} students={students} classes={classes} school={school} />} />
          <Route path="/parents_settings" element={<ParentManagement profile={profile} schoolId={profile.schoolId} school={school} classes={classes} initialShowConfig={true} onNavigate={setActiveTab} />} />
          <Route path="/students_form_builder" element={<StudentManagement profile={profile} schoolId={profile.schoolId} students={students} classes={classes} school={school} ledger={ledger} searchTerm={searchTerm} view="form_builder" onNavigate={setActiveTab} onRefresh={() => (window as any).refreshPrincipalData?.()} />} />
          <Route path="/students_credentials" element={<AppCredentials schoolId={profile.schoolId} students={students} classes={classes} school={school} />} />
          <Route path="/students_forms" element={<StudentManagement profile={profile} schoolId={profile.schoolId} students={students} classes={classes} school={school} ledger={ledger} searchTerm={searchTerm} view="forms" onNavigate={setActiveTab} onRefresh={() => (window as any).refreshPrincipalData?.()} />} />
          <Route path="/students_idcards" element={<IdCardManagement schoolId={profile.schoolId} students={students} classes={classes} school={school} onRefresh={() => (window as any).refreshPrincipalData?.()} />} />
          <Route path="/students_gallery" element={<StudentImagesGallery schoolId={profile.schoolId} students={students} classes={classes} school={school} profile={profile} onRefresh={() => (window as any).refreshPrincipalData?.()} onNavigate={setActiveTab} />} />
          <Route path="/students_documents" element={<StudentDocuments schoolId={profile.schoolId} students={students} classes={classes} />} />
          <Route path="/students_promotion" element={<StudentPromotion schoolId={profile.schoolId} classes={classes} students={students} />} />

          {/* Breakdown of Teachers */}
          <Route path="/teachers_directory" element={<TeacherManagement profile={profile} school={school} schoolId={profile.schoolId} teachers={teachers} searchTerm={searchTerm} view="directory" onNavigate={setActiveTab} />} />
          <Route path="/teachers_credentials" element={<TeacherCredentials schoolId={profile.schoolId} teachers={teachers} school={school} />} />
          <Route path="/teachers_add" element={<TeacherManagement profile={profile} school={school} schoolId={profile.schoolId} teachers={teachers} searchTerm={searchTerm} view="hiring" onNavigate={setActiveTab} />} />
          <Route path="/teachers_other_staff" element={<OtherStaffManagement schoolId={profile.schoolId} view="directory" />} />
          <Route path="/teachers_add_staff" element={<OtherStaffManagement schoolId={profile.schoolId} view="add" />} />
          <Route path="/teachers_payroll" element={<PayrollManagement schoolId={profile.schoolId} />} />
          <Route path="/teachers_documents" element={<TeacherDocuments schoolId={profile.schoolId} teachers={teachers} />} />

          {/* New Enquiry Page */}
          <Route path="/enquiries" element={<EnquiryManagement schoolId={profile.schoolId} classes={classes} />} />
          
          {/* New Pages */}
          <Route path="/complaints" element={<ComplaintsManagement schoolId={profile.schoolId} profile={profile} onNavigate={setActiveTab} />} />
          <Route path="/notices" element={<NoticesManagement schoolId={profile.schoolId} classes={classes} school={school} />} />
          <Route path="/communication" element={<CommunicationCenter schoolId={profile.schoolId} students={students} classes={classes} school={school} />} />
          <Route path="/social_media" element={<SocialMediaManagement school={school} onUpdate={() => {}} />} />
          <Route path="/cctv_cameras" element={<CCTVCameras schoolId={profile.schoolId} profile={profile} />} />
          <Route path="/ai_reports" element={<AIReports 
                                      schoolId={profile.schoolId} 
                                      school={school} 
                                      students={students} 
                                      teachers={teachers} 
                                      classes={classes} 
                                      ledger={ledger} 
                                      expenses={expenses} 
                                    />} />
          <Route path="/activity_log" element={<ActivityLogPage schoolId={profile.schoolId} profile={profile} onNavigate={setActiveTab} />} />
          <Route path="/staff_access" element={<StaffAccessPage schoolId={profile.schoolId} principalProfile={profile} />} />

          <Route path="/classes" element={<ClassManagement schoolId={profile.schoolId} classes={classes} teachers={teachers} students={students} subjects={subjects} profile={profile} onNavigate={setActiveTab} />} />
          <Route path="/classes/:classId" element={<ClassDetails />} />
          <Route path="/classes/add" element={<AddClass schoolId={profile.schoolId} classes={classes} teachers={teachers} subjects={subjects} students={students} />} />
          <Route path="/classes/edit" element={<AddClass schoolId={profile.schoolId} classes={classes} teachers={teachers} subjects={subjects} students={students} />} />
          <Route path="/subjects" element={<SubjectManagement schoolId={profile.schoolId} subjects={subjects} classes={classes} />} />
          <Route path="/attendance" element={<AttendanceManagement schoolId={profile.schoolId} students={students} classes={classes} profile={profile} teachers={teachers} onNavigate={setActiveTab} />} />
          <Route path="/attendance_manual" element={<ManualAttendance schoolId={profile.schoolId} students={students} classes={classes} profile={profile} teachers={teachers} />} />
          <Route path="/attendance_qr" element={<QRAttendance schoolId={profile.schoolId} students={students} classes={classes} profile={profile} />} />
          <Route path="/attendance_face" element={<FaceAttendance schoolId={profile.schoolId} students={students} classes={classes} profile={profile} />} />
          <Route path="/attendance_staff" element={<TeacherAttendance schoolId={profile.schoolId} teachers={teachers} />} />

          {/* Academics Sub-pages */}
          <Route path="/academics_timetable" element={<TimetableManagement school={school} schoolId={profile.schoolId} classes={classes} teachers={teachers} subjects={subjects} />} />
          <Route path="/academics_exams" element={<div className="p-12 text-center bg-white dark:bg-slate-800 border-2 border-slate-300">
                                    <Exam size={64} className="mx-auto text-slate-300 mb-4" />
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Exam Management</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">This module is being prepared for your school.</p>
                                  </div>} />
          <Route path="/academics_tracking" element={<div className="p-12 text-center bg-white dark:bg-slate-800 border-2 border-slate-300">
                                    <TrendUp size={64} className="mx-auto text-slate-300 mb-4" />
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Student Tracking</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">Academic progress tracking will be available soon.</p>
                                  </div>} />
          
          {/* Breakdown of Fees */}
          <Route path="/fees_dashboard" element={<FeeManagement profile={profile} students={students} classes={classes} schoolId={profile.schoolId} school={school} ledger={ledger} view="fees-dashboard" />} />
          <Route path="/fees_students" element={<FeeManagement profile={profile} students={students} classes={classes} schoolId={profile.schoolId} school={school} ledger={ledger} view="overview" />} />
          <Route path="/fees_ledger" element={<FeeManagement profile={profile} students={students} classes={classes} schoolId={profile.schoolId} school={school} ledger={ledger} view="ledger" />} />
          <Route path="/fees_structure" element={<FeeManagement profile={profile} students={students} classes={classes} schoolId={profile.schoolId} school={school} ledger={ledger} view="config" />} />

          {/* EXPENSES (Split) */}
          <Route path="/expenses_daily" element={<ExpenseManagement profile={profile} schoolId={profile.schoolId} view="log" />} />
          <Route path="/expenses_recurring" element={<ExpenseManagement profile={profile} schoolId={profile.schoolId} view="recurring" />} />

          {/* Breakdown of School Settings */}
          <Route path="/settings_design" element={<SchoolBranding school={school} />} />
          <Route path="/help_support" element={<HelpSupport profile={profile} />} />
          
          <Route path="/profile" element={<ProfilePage profile={profile} school={school} onProfileUpdate={setProfile} />} />
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 overflow-hidden font-sans text-slate-900 dark:text-zinc-100">
        {isSidebarOpen && window.innerWidth < 1280 && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Minimal Software Sidebar */}
      <aside className={`fixed xl:static inset-y-0 left-0 z-[210] flex flex-col bg-slate-950 dark:bg-black border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-[260px] translate-x-0 shadow-2xl xl:shadow-none' : 'w-0 -translate-x-full xl:w-[72px] xl:translate-x-0'}`}>
        <div className="h-16 flex items-center px-4 shrink-0 border-b border-slate-200 dark:border-zinc-800">
          <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-md overflow-hidden bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm">
            {school.logoURL ? (
              <img src={school.logoURL} className="w-full h-full object-contain p-1" alt="School Logo" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-slate-900 dark:text-zinc-100 text-sm">{school.name[0]}</div>
            )}
          </div>
          {(isSidebarOpen || window.innerWidth < 1280) && (
             <div className="ml-3 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
               <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{school.name}</p>
               <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] leading-none mt-0.5">ERP Software</p>
             </div>
          )}
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map(item => {
            // Only Principal can see Staff Access
            if (item.id === 'staff_access' && profile.role !== 'principal') return null;

            if (item.children) {
              const isExpanded = expandedMenus.includes(item.id);
              const isActiveParent = item.children.some(child => child.id === activeTab);
              const showSubMenu = isExpanded && (isSidebarOpen || window.innerWidth < 1280);
              
              return (
                <div key={item.id} className="space-y-0.5">
                  <button 
                    onClick={() => { toggleMenu(item.id); if(!isExpanded && !isSidebarOpen) setSidebarOpen(true); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all group ${isActiveParent ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`shrink-0 ${isActiveParent ? 'text-white' : 'text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100'}`}>{item.icon}</div>
                      {(isSidebarOpen || window.innerWidth < 1280) && <span className="text-sm font-semibold">{item.label}</span>}
                    </div>
                    {(isSidebarOpen || window.innerWidth < 1280) && (
                      <div className={`transition-transform duration-200 ${isActiveParent ? 'text-white' : 'text-slate-500 dark:text-zinc-400'} ${isExpanded ? 'rotate-180' : ''}`}>
                        <CaretDown size={14} weight="bold"/>
                      </div>
                    )}
                  </button>
                  
                  {/* Nested Items */}
                  <div className={`overflow-hidden transition-all duration-200 ease-in-out ${showSubMenu ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-8 space-y-0.5 mt-0.5 border-l border-slate-200 dark:border-zinc-700 pl-2">
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => { setActiveTab(child.id); if(window.innerWidth < 1280) setSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-all group ${activeTab === child.id ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                        >
                          <span className="text-[13px]">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id); if(window.innerWidth < 1280) setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md font-bold' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100'}`}
              >
                <div className={`shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100'}`}>{item.icon}</div> 
                {(isSidebarOpen || window.innerWidth < 1280) && <span className="text-sm font-semibold">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-zinc-800">
             <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-all group">
                <SignOut size={20} weight="regular" className="shrink-0" />
                {(isSidebarOpen || window.innerWidth < 1280) && <span className="text-sm font-semibold">Logout</span>}
             </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-zinc-900">
        <header className="hidden md:flex h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 items-center justify-between px-6 shrink-0 z-[100] sticky top-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1.5 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors flex items-center justify-center">
                <List size={20} weight="regular" />
             </button>
             <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 capitalize hidden sm:block">
                  {activeTab === 'dashboard' ? 'Overview' : activeTab.replace(/students_|teachers_|fees_|settings_/g, '').replace(/_/g, ' ')}
                </h2>
             </div>
          </div>

          <div className="flex items-center gap-4">
            {activeTab !== 'dashboard' && !activeTab.startsWith('settings') && !activeTab.startsWith('fees') && activeTab !== 'students_admissions' && !activeTab.startsWith('teachers_') && activeTab !== 'enquiries' && activeTab !== 'students_credentials' && activeTab !== 'students_form_builder' && (
                <div className="hidden lg:flex items-center bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md px-3 py-1.5 w-64 focus-within:bg-white dark:focus-within:bg-zinc-800 focus-within:border-blue-500 transition-all group">
                    <MagnifyingGlass size={16} weight="regular" className="text-slate-400 dark:text-zinc-500 group-focus-within:text-blue-500" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="bg-transparent border-none text-sm ml-2 focus:ring-0 text-slate-700 dark:text-zinc-200 w-full placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            <div className="flex items-center gap-3">
                <button 
                  onClick={toggleDarkMode}
                  className="p-1.5 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors flex items-center justify-center"
                  title="Toggle Dark Mode"
                >
                  {isDarkMode ? <Sun size={20} weight="regular" /> : <Moon size={20} weight="regular" />}
                </button>

                <button 
                  onClick={toggleCustomCursor}
                  className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${isCustomCursorEnabled ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                  title="Toggle Custom Cursor"
                >
                  <HandPointing size={20} weight={isCustomCursorEnabled ? 'fill' : 'regular'} />
                </button>

                <button 
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  className="p-1.5 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors flex items-center justify-center"
                  title="Reload Page"
                >
                    <ArrowsClockwise size={20} weight="regular" />
                </button>

                <button className="p-1.5 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md relative transition-colors">
                    <Bell size={20} weight="regular" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white dark:border-zinc-950"></span>
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>

                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-md transition-all border ${activeTab === 'profile' ? 'bg-blue-600 border-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-zinc-800 border-transparent text-slate-700 dark:text-zinc-200'}`}
                >
                    <div className={`w-7 h-7 flex items-center justify-center font-bold text-xs overflow-hidden border ${activeTab === 'profile' ? 'bg-white text-blue-600 border-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 border-slate-300 dark:border-zinc-600'}`}>
                        {profile.photoURL ? (
                          <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                          <span>{profile.name[0]}</span>
                        )}
                    </div>
                    <div className="hidden md:block text-left mr-1">
                        <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${activeTab === 'profile' ? 'text-white' : 'text-slate-700 dark:text-zinc-200'}`}>
                          {profile.name.split(' ')[0]}
                        </p>
                    </div>
                </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-0 md:p-6 xl:p-8 custom-scrollbar">
            <div className="max-w-[1500px] mx-auto pb-24 md:pb-0">
              <div key={activeTab} className="animate-in fade-in-50 duration-200">
                {renderContent()}
              </div>
            </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 w-full z-[100] bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] transition-colors duration-300">
            <div className="flex items-center justify-around w-full h-20 px-4 pb-2">
                <button onClick={() => setActiveTab('dashboard')} className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all">
                    <div className={`p-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#1e3a8a] text-white -translate-y-2 shadow-lg shadow-[#1e3a8a]/30' : 'text-slate-600 dark:text-slate-400'}`}>
                        <Home01Icon size={24} />
                    </div>
                    <span className={`text-[10px] font-black uppercase transition-all ${activeTab === 'dashboard' ? 'text-[#1e3a8a] dark:text-[#D4AF37] opacity-100' : 'text-slate-700 dark:text-slate-400 opacity-100'}`}>Home</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('activity_log')} 
                  className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all"
                >
                    <div className={`p-2 rounded-xl transition-all ${activeTab === 'activity_log' ? 'bg-[#1e3a8a] text-white -translate-y-2 shadow-lg shadow-[#1e3a8a]/30' : 'text-slate-600 dark:text-slate-400'}`}>
                        <Lightning size={24} weight={activeTab === 'activity_log' ? 'fill' : 'regular'} />
                    </div>
                    <span className={`text-[10px] font-black uppercase transition-all ${activeTab === 'activity_log' ? 'text-[#1e3a8a] dark:text-[#D4AF37] opacity-100' : 'text-slate-700 dark:text-slate-400 opacity-100'}`}>Activity</span>
                </button>

                <button 
                  onClick={() => setActiveTab('complaints')} 
                  className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all"
                >
                    <div className={`p-2 rounded-xl transition-all ${activeTab === 'complaints' ? 'bg-[#1e3a8a] text-white -translate-y-2 shadow-lg shadow-[#1e3a8a]/30' : 'text-slate-600 dark:text-slate-400'}`}>
                        <WarningCircle size={24} weight={activeTab === 'complaints' ? 'fill' : 'regular'} />
                    </div>
                    <span className={`text-[10px] font-black uppercase transition-all ${activeTab === 'complaints' ? 'text-[#1e3a8a] dark:text-[#D4AF37] opacity-100' : 'text-slate-700 dark:text-slate-400 opacity-100'}`}>Issues</span>
                </button>

                <button onClick={() => setActiveTab('students_directory')} className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all">
                    <div className={`p-2 rounded-xl transition-all ${activeTab === 'students_directory' ? 'bg-[#1e3a8a] text-white -translate-y-2 shadow-lg shadow-[#1e3a8a]/30' : 'text-slate-600 dark:text-slate-400'}`}>
                        <Users size={24} weight={activeTab === 'students_directory' ? 'fill' : 'regular'} />
                    </div>
                    <span className={`text-[10px] font-black uppercase transition-all ${activeTab === 'students_directory' ? 'text-[#1e3a8a] dark:text-[#D4AF37] opacity-100' : 'text-slate-700 dark:text-slate-400 opacity-100'}`}>Students</span>
                </button>

                <button onClick={() => setActiveTab('profile')} className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all">
                    <div className={`p-2 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-[#1e3a8a] text-white -translate-y-2 shadow-lg shadow-[#1e3a8a]/30' : 'text-slate-600 dark:text-slate-400'}`}>
                        <Settings01Icon size={24} />
                    </div>
                    <span className={`text-[10px] font-black uppercase transition-all ${activeTab === 'profile' ? 'text-[#1e3a8a] dark:text-[#D4AF37] opacity-100' : 'text-slate-700 dark:text-slate-400 opacity-100'}`}>Profile</span>
                </button>
            </div>
        </div>
      </main>
      {isCustomCursorEnabled && <CustomCursor color={isDarkMode ? '#60a5fa' : '#2563eb'} />}
    </div>
    </motion.div>
  );
};

export default PrincipalApp;
