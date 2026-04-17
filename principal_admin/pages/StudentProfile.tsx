
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, CalendarCheck, CurrencyDollar, WarningCircle, 
  ArrowLeft, Phone, Envelope, MapPin, IdentificationCard,
  Clock, CheckCircle, XCircle, TrendUp, FileText, Printer,
  Student as StudentIcon, ChalkboardTeacher, CaretRight,
  Money, Check, UserCircle, Receipt, ChartBar, Camera, UploadSimple, X, Plus
} from 'phosphor-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell 
} from 'recharts';
import { getStudent, getStudentAttendance, getStudentFeeLedger, updateStudent, uploadFileToStorage } from '../../services/api.ts';
import { Student, AttendanceRecord, FeeTransaction, School } from '../../types.ts';
import Loader from '../../components/Loader.tsx';
import { PrintableAdmissionForm } from './StudentManagement.tsx';
import CameraCapture from '../../components/CameraCapture.tsx';
// import SmartIdProcessor from '../../components/SmartIdProcessor.tsx';

interface StudentProfileProps {
  studentId: string;
  onBack: () => void;
  schoolId: string;
  school: School;
  classes: any[];
  formConfig?: any[];
}

const COLORS = ['#1e3a8a', '#ef4444', '#f59e0b']; // Navy, Red, Orange

const StudentProfile: React.FC<StudentProfileProps> = ({ studentId, onBack, schoolId, school, classes, formConfig }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [ledger, setLedger] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'fees'>('profile');
  
  // Photo Update State
  const [showCamera, setShowCamera] = useState(false);
  const [imageToProcess, setImageToProcess] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentData, attendanceData, ledgerData] = await Promise.all([
          getStudent(schoolId, studentId),
          getStudentAttendance(schoolId, studentId),
          getStudentFeeLedger(schoolId, studentId)
        ]);
        
        setStudent(studentData);
        setAttendance(attendanceData);
        setLedger(ledgerData);
      } catch (error) {
        console.error("Failed to fetch student profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId && schoolId) {
      fetchData();
    }
  }, [studentId, schoolId]);

  const handleCameraCapture = (imageData: string) => {
    handleSavePhoto(imageData);
    setShowCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleSavePhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = async (imageData: string) => {
    if (!student) return;
    
    setIsProcessingPhoto(true);
    try {
      const res = await fetch(imageData);
      const blob = await res.blob();
      const file = new File([blob], `student_${student.id}_photo.jpg`, { type: 'image/jpeg' });

      const fileName = `student_photos/${schoolId}/${student.id}_${Date.now()}.jpg`;
      const { publicUrl } = await uploadFileToStorage(file, fileName);

      await updateStudent(schoolId, student.id, { photoURL: publicUrl });
      
      setStudent(prev => prev ? { ...prev, photoURL: publicUrl } : null);
      alert("Photo updated successfully!");
      setIsProcessingPhoto(false);
      setImageToProcess(null);
    } catch (error) {
      console.error("Error updating photo:", error);
      alert("Failed to update photo. Please try again.");
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return <Loader />;
  if (!student) return <div className="p-8 text-center">Student not found</div>;

  // --- HELPERS ---
  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return id;
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };

  // --- CALCULATIONS ---
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'Present').length;
  const absentDays = attendance.filter(a => a.status === 'Absent').length;
  const leaveDays = attendance.filter(a => a.status === 'Leave').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const totalPaid = ledger.filter(t => t.type === 'payment').reduce((sum, t) => (sum + (t.amount || 0)), 0);
  const totalDue = ledger.filter(t => t.type === 'challan').reduce((sum, t) => (sum + (t.amount || 0)), 0);
  const balance = totalDue - totalPaid;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
        {/* TOP NAV BAR */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
            <button 
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 active:scale-90 transition-transform"
            >
                <ArrowLeft size={20} className="text-[#1e3a8a] dark:text-[#D4AF37]" />
            </button>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Principal</p>
                    <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{student.name.split(' ')[0]}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37]/40 shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                    {student.photoURL ? (
                        <img src={student.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        student.name.charAt(0)
                    )}
                </div>
            </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 relative z-10 mt-4">
          {/* Header Section - Student/Teacher App Style */}
          <div className="w-full bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] p-8 pt-12 pb-10 shadow-2xl relative overflow-hidden border-b-4 border-[#D4AF37] rounded-b-[3rem] -mt-4">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.3em]">Student Profile</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">{student.name.split(' ')[0]}</h1>
                  <p className="text-white/60 text-sm mt-2 font-medium">Roll: {student.rollNo} • {getClassName(student.classId)}</p>
                </div>
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-xl overflow-hidden">
                  {student.photoURL ? (
                    <img src={student.photoURL} className="w-full h-full object-cover" alt="Student" />
                  ) : (
                    <StudentIcon size={32} className="text-[#D4AF37]" weight="fill" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="px-4">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm flex gap-1">
              {['profile', 'attendance', 'fees'].map((tabId) => {
                const isActive = activeTab === tabId;
                const labels: any = { profile: 'Details', attendance: 'Attendance', fees: 'Fees' };
                return (
                  <button 
                    key={tabId}
                    onClick={() => setActiveTab(tabId as any)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-slate-400'}`}
                  >
                    {labels[tabId]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 md:px-6 space-y-8">
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                {/* Personal Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Personal Info</h2>
                    <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm">
                      <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest mb-1">Full Name</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{student.name}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm">
                      <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest mb-1">Father Name</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{student.fatherName}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm">
                      <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest mb-1">Phone</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{student.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Academic Details</h2>
                    <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm">
                      <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest mb-1">Admission No</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{student.admissionNo}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm">
                      <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest mb-1">Status</p>
                      <p className={`text-sm font-black ${student.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>{student.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm text-center">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Present</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{presentDays}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm text-center">
                    <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-1">Absent</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{absentDays}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 shadow-sm text-center">
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Rate</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{attendanceRate}%</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border-4 border-[#D4AF37] shadow-xl text-center space-y-2">
                  <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest">Outstanding Balance</p>
                  <p className="text-4xl font-black text-[#1e3a8a] dark:text-white">Rs {balance.toLocaleString()}</p>
                  <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${balance <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {balance <= 0 ? 'Fully Paid' : 'Payment Pending'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- STYLES ---
  const paperLabelStyle = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block";
  const paperValueStyle = "text-sm font-bold text-slate-900 border-b-2 border-slate-100 pb-1 w-full block bg-slate-50/50 px-2 py-1";
  const sectionHeaderStyle = "text-sm font-black text-white bg-slate-900 px-4 py-2 uppercase tracking-tight flex items-center gap-2 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]";

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-4 font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-r-2 border-slate-900 last:border-r-0 ${
        activeTab === id 
          ? 'bg-[#1e3a8a] text-white' 
          : 'bg-white text-slate-400 hover:bg-slate-50'
      }`}
    >
      <Icon size={18} weight={activeTab === id ? "fill" : "bold"} />
      {label}
    </button>
  );

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
        
        {/* --- MAIN BASE CONTAINER --- */}
        <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
            
            {/* --- HEADER (Matches StudentManagement Directory Header) --- */}
            <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
                <div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onBack}
                            className="p-2 hover:bg-white/10 dark:bg-slate-800/10 rounded-full transition-colors text-white"
                        >
                            <ArrowLeft size={24} weight="bold" />
                        </button>
                        <h1 className="text-3xl font-black tracking-tight uppercase">
                            Student Profile
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 mt-2 ml-12">
                         <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                             {student.name}
                         </span>
                         <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">
                             Roll No: {student.rollNo} • Class: {getClassName(student.classId)}
                         </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <button 
                        onClick={() => {
                            localStorage.setItem('print_student_data', JSON.stringify({ student, school, formConfig }));
                            window.open('/print/admission-form', '_blank');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-[4px_4px_0px_0px_rgba(37,99,235,0.3)] flex items-center gap-2"
                    >
                        <FileText size={18} weight="fill"/> Print Admission Form
                    </button>
                    <button 
                        onClick={onBack}
                        className="bg-slate-700 text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-[4px_4px_0px_0px_rgba(51,65,85,0.3)] flex items-center gap-2"
                    >
                        <ArrowLeft size={18} weight="bold"/> Back
                    </button>
                </div>
            </div>

            {/* --- TABS NAVIGATION (Matches StudentManagement View Switcher) --- */}
            <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                {['profile', 'attendance', 'fees'].map((tabId) => {
                    const isActive = activeTab === tabId;
                    const labels: any = { profile: 'Directory Details', attendance: 'Attendance Register', fees: 'Fees Record' };
                    const icons: any = { profile: User, attendance: CalendarCheck, fees: Money };
                    const Icon = icons[tabId];
                    
                    return (
                        <button 
                            key={tabId}
                            onClick={() => setActiveTab(tabId as any)}
                            className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                isActive 
                                    ? 'bg-[#1e3a8a] text-white shadow-md' 
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Icon size={16} weight={isActive ? "fill" : "bold"} />
                            {labels[tabId]}
                        </button>
                    );
                })}
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="p-6 md:p-8 flex-1">
                
                {/* 1. PERSONAL DETAILS TAB */}
                {activeTab === 'profile' && (
                    <div className="animate-in fade-in duration-500 space-y-8">
                        <div className="flex flex-col md:flex-row gap-10 items-start">
                            {/* Photo Section */}
                            <div className="flex flex-col items-center gap-4 shrink-0">
                                <div className="w-48 h-56 bg-white dark:bg-slate-800 border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.1)] overflow-hidden flex items-center justify-center relative group">
                                    {student.photoURL ? (
                                        <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <UserCircle size={64} weight="duotone" />
                                            <span className="text-[10px] font-black uppercase">No Photo</span>
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border-b-2 border-l-2 border-slate-900 ${student.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            {student.status || 'Active'}
                                        </span>
                                    </div>
                                    <div 
                                        onClick={() => photoInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                    >
                                        <Plus size={32} className="text-white" />
                                    </div>
                                    <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <button 
                                        onClick={() => photoInputRef.current?.click()}
                                        className="w-full py-2 bg-white dark:bg-slate-800 border-2 border-slate-900 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.1)]"
                                    >
                                        <UploadSimple size={16} weight="bold"/> Upload Photo
                                    </button>
                                    <button 
                                        onClick={() => setShowCamera(true)}
                                        className="w-full py-2 bg-white dark:bg-slate-800 border-2 border-slate-900 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.1)]"
                                    >
                                        <Camera size={16} weight="bold"/> Take Photo
                                    </button>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-5 bg-[#1e3a8a]"></div> Student Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-1">{student.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Father's Name</label>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-1">{student.fatherName || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll Number</label>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-1">{student.rollNo}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class / Grade</label>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-1">{getClassName(student.classId)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-1">{student.phone || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission Date</label>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-1">{student.admissionDate || '-'}</p>
                                    </div>
                                </div>

                                {/* Custom Data Grouped by Section */}
                                {formConfig && (
                                    <div className="mt-12 space-y-10">
                                        {['student', 'parent', 'contact', 'academic', 'health', 'transport', 'siblings', 'documents', 'other'].map(section => {
                                            const sectionFields = formConfig.filter(f => (f.section || 'other') === section && f.enabled);
                                            const hasData = sectionFields.some(f => student.customData?.[f.id]);
                                            
                                            if (!hasData) return null;

                                            return (
                                                <div key={section}>
                                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                                        <div className="w-1.5 h-5 bg-[#1e3a8a]"></div> 
                                                        {section === 'academic' ? 'Academic / Registration' : 
                                                         section === 'health' ? 'Health & Medical' :
                                                         section === 'transport' ? 'Transport & Logistics' :
                                                         section === 'siblings' ? 'Sibling' : section} Information
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                        {sectionFields.map(field => {
                                                            const val = student.customData?.[field.id];
                                                            if (!val) return null;
                                                            return (
                                                                <div key={field.id} className="space-y-1">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-1">{String(val)}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Fallback for any other custom data not in config */}
                                {student.customData && Object.keys(student.customData).length > 0 && (
                                    <div className="mt-12">
                                        {!formConfig && (
                                            <>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <div className="w-1.5 h-5 bg-[#1e3a8a]"></div> Additional Details
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                    {Object.entries(student.customData).map(([key, value]) => {
                                                        if (key === 'photoURL' || !value) return null;
                                                        return (
                                                            <div key={key} className="space-y-1">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</label>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-1">{String(value)}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ATTENDANCE REGISTER TAB */}
                {activeTab === 'attendance' && (
                    <div className="animate-in fade-in duration-500 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-5 border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Days</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-white">{totalDays}</p>
                            </div>
                            <div className="bg-emerald-50 p-5 border-2 border-emerald-100 shadow-sm">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Present</p>
                                <p className="text-3xl font-black text-emerald-700">{presentDays}</p>
                            </div>
                            <div className="bg-rose-50 p-5 border-2 border-rose-100 shadow-sm">
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Absent</p>
                                <p className="text-3xl font-black text-rose-700">{absentDays}</p>
                            </div>
                            <div className="bg-[#1e3a8a] p-5 border-2 border-blue-900 shadow-sm text-white">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Attendance Rate</p>
                                <p className="text-3xl font-black">{attendanceRate}%</p>
                            </div>
                        </div>

                        <div className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700">
                                    <tr className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Day</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Time In</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {attendance.length === 0 ? (
                                        <tr><td colSpan={4} className="p-16 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">No attendance records found</td></tr>
                                    ) : (
                                        attendance.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                                            <tr key={record.id} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                                                <td className="p-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{record.date}</td>
                                                <td className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2 ${
                                                        record.status === 'Present' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                        record.status === 'Absent' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                        'bg-amber-100 text-amber-700 border-amber-200'
                                                    }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">{record.timeIn || '--:--'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. FEES RECORD TAB */}
                {activeTab === 'fees' && (
                    <div className="animate-in fade-in duration-500 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-center bg-[#1e3a8a] text-white p-8 shadow-xl border-b-4 border-slate-900">
                            <div>
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Current Account Balance</p>
                                <p className={`text-4xl font-black ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    Rs. {Math.abs(balance).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right mt-4 md:mt-0">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Payment Status</p>
                                <span className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-2 ${balance > 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500'}`}>
                                    {balance > 0 ? 'Pending Arrears' : 'Account Clear'}
                                </span>
                            </div>
                        </div>

                        <div className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700">
                                    <tr className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4 text-right">Fee (Debit)</th>
                                        <th className="p-4 text-right">Paid (Credit)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ledger.length === 0 ? (
                                        <tr><td colSpan={4} className="p-16 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">No financial transactions found</td></tr>
                                    ) : (
                                        ledger.sort((a,b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime()).map((trans, idx) => (
                                            <tr key={trans.id || idx} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                                                <td className="p-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{trans.date || trans.timestamp?.split('T')[0]}</td>
                                                <td className="p-4">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{trans.description || trans.month || 'Fee Transaction'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{trans.type || trans.paymentMethod}</p>
                                                </td>
                                                <td className="p-4 text-right font-mono text-xs font-black text-rose-600">
                                                    {trans.type === 'challan' ? (trans.amount || 0).toLocaleString() : '-'}
                                                </td>
                                                <td className="p-4 text-right font-mono text-xs font-black text-emerald-600">
                                                    {trans.type === 'payment' ? (trans.amount || trans.amountPaid || 0).toLocaleString() : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* --- FOOTER --- */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1e3a8a] text-white flex items-center justify-center font-black text-sm border-2 border-slate-900 overflow-hidden">
                        {school.logoURL ? (
                            <img src={school.logoURL} alt="Logo" className="w-full h-full object-contain p-1 bg-white dark:bg-slate-800" />
                        ) : (
                            school.name[0]
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">{school.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Official Student Record System</p>
                    </div>
                </div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Generated: {new Date().toLocaleString()}</p>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="w-full max-w-lg">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setShowCamera(false)} className="text-white hover:text-rose-500 transition-colors">
                                <X size={32} weight="bold" />
                            </button>
                        </div>
                        <CameraCapture 
                            onCapture={handleCameraCapture}
                            onClose={() => setShowCamera(false)}
                        />
                    </div>
                </div>
            )}

            {/* AI Processing Modal */}
            {isProcessingPhoto && imageToProcess && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                        <div className="bg-[#1e3a8a] p-6 text-white text-center">
                            <h3 className="text-xl font-black uppercase tracking-tight">Photo Update</h3>
                            <p className="text-blue-200 text-xs font-bold mt-1 uppercase tracking-widest">Processing Image...</p>
                        </div>
                        <div className="p-6 flex flex-col items-center justify-center">
                            <Loader />
                            <p className="mt-4 text-[#1e3a8a] font-black uppercase tracking-widest text-xs">Uploading to Cloud...</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default StudentProfile;
