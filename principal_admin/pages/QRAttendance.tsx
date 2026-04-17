
import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, QrCode, Scan, WarningCircle, ClockCounterClockwise, Student, Clock
} from 'phosphor-react';
import { subscribeToAttendanceByDate, setAttendance } from '../../services/api.ts';
import { AttendanceRecord } from '../../types.ts';
import { FirestoreError } from 'firebase/firestore';
import SmartScanner from '../components/SmartScanner.tsx';

interface QRAttendanceProps {
  schoolId: string;
  students: any[];
  classes: any[];
  profile: any;
}

const QRAttendance: React.FC<QRAttendanceProps> = ({ schoolId, students, classes, profile }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [lastScannedStudent, setLastScannedStudent] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  // Fetch Data
  useEffect(() => {
    if (!schoolId || !selectedDate) return;
    const unsub = subscribeToAttendanceByDate(schoolId, selectedDate, setAttendanceRecords, (err: FirestoreError) => console.error(err));
    return () => unsub();
  }, [schoolId, selectedDate]);

  const handleMarkAttendance = async (studentId: string, classId: string) => {
    try {
      await setAttendance(schoolId, {
        studentId,
        classId,
        teacher_id: profile.id,
        date: selectedDate,
        status: 'Present'
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const handleScan = (scannedData: string) => {
    let idToSearch = scannedData;
    if (scannedData.includes('/')) {
        const parts = scannedData.split('/');
        idToSearch = parts[parts.length - 1];
    }

    const student = students.find(s => s.rollNo === idToSearch || s.id === idToSearch);
    if (student) {
      handleMarkAttendance(student.id, student.classId);
      setScannedStudent(student);
      setLastScannedStudent(student);
      setScanHistory(prev => [student, ...prev].slice(0, 10));
      setTimeout(() => setScannedStudent(null), 3000);
    } else {
      console.warn(`Student not found: ${idToSearch}`);
    }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      <div className="w-full max-w-[1920px] mx-auto flex flex-col lg:flex-row gap-6 min-h-[90vh]">
        
        {/* --- LEFT: SCANNER AREA --- */}
        <div className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col">
            <div className="bg-[#1e3a8a] text-white p-6 border-b-4 border-slate-900 flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 text-[#1e3a8a] flex items-center justify-center border-2 border-slate-900">
                    <QrCode size={28} weight="fill" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">QR / Barcode Scanner</h1>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Kiosk Mode Attendance System</p>
                </div>
            </div>

            <div className="p-8 flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-800/50 border-4 border-slate-200 dark:border-slate-700 p-2 relative">
                    <SmartScanner onScan={handleScan} mode="qr" />
                    
                    {/* Scanner Overlay */}
                    <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent">
                        <div className="w-full h-full border-2 border-blue-500/30 animate-pulse flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-blue-500/50 rounded-3xl" />
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <div className="flex items-center gap-2 justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        <Scan size={16} />
                        Position Card within the frame to scan
                    </div>
                </div>
            </div>

            {/* --- SCAN FEEDBACK TOAST --- */}
            {scannedStudent && (
                <div className="fixed top-24 right-10 z-[100] bg-emerald-600 text-white border-4 border-slate-900 shadow-[8px_8px_0px_#1e3a8a] p-6 animate-in slide-in-from-right-12 fade-in duration-300 w-96">
                    <div className="flex gap-6 items-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-2xl shrink-0 overflow-hidden">
                            {scannedStudent.photoURL ? <img src={scannedStudent.photoURL} className="w-full h-full object-cover"/> : scannedStudent.name[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle size={20} weight="fill" />
                                <span className="text-xs font-black uppercase tracking-widest">Attendance Marked</span>
                            </div>
                            <h3 className="text-xl font-black uppercase truncate">{scannedStudent.name}</h3>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest truncate mt-1">
                                {classes.find(c => c.id === scannedStudent.classId)?.name || 'N/A'} • {scannedStudent.rollNo}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* --- RIGHT: RECENT ACTIVITY --- */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
            {/* Last Scanned */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                    <Clock size={20} weight="bold" className="text-[#1e3a8a]" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Last Scanned</h2>
                </div>

                {lastScannedStudent ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-slate-100 border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-4xl mb-4 overflow-hidden">
                            {lastScannedStudent.photoURL ? <img src={lastScannedStudent.photoURL} className="w-full h-full object-cover"/> : lastScannedStudent.name[0]}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">{lastScannedStudent.name}</h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                            {classes.find(c => c.id === lastScannedStudent.classId)?.name || 'N/A'}
                        </p>
                        <div className="mt-4 px-4 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                            Present
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center text-slate-300">
                        <WarningCircle size={48} weight="duotone" className="mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Waiting for scan...</p>
                    </div>
                )}
            </div>

            {/* History */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-6 shadow-sm flex-1">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                    <ClockCounterClockwise size={20} weight="bold" className="text-[#1e3a8a]" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Recent History</h2>
                </div>

                <div className="space-y-4">
                    {scanHistory.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 border-b border-slate-50 last:border-0">
                            <div className="w-8 h-8 bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-[10px] shrink-0 overflow-hidden">
                                {s.photoURL ? <img src={s.photoURL} className="w-full h-full object-cover"/> : s.name[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase truncate">{s.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.rollNo}</p>
                            </div>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        </div>
                    ))}
                    {scanHistory.length === 0 && (
                        <p className="text-center py-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No scans yet today</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QRAttendance;

