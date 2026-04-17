
import React, { useMemo, useState, useRef } from 'react';
import { Calendar01Icon as Calendar, Clock01Icon as Clock, Book01Icon as Book, Download01Icon as Download, Coffee01Icon as Coffee, AlertCircleIcon as AlertCircle } from 'hugeicons-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TimetableProps {
  timetable: any[];
  subjects: any[];
  school?: any;
  profile?: any;
  currentClass?: any;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_SLOTS = [
  { label: '08:00 - 09:00', type: 'lecture' },
  { label: '09:00 - 10:00', type: 'lecture' },
  { label: '10:00 - 11:00', type: 'lecture' },
  { label: '11:00 - 11:30', type: 'break' },
  { label: '11:30 - 12:30', type: 'lecture' },
  { label: '12:30 - 01:30', type: 'lecture' }
];

const Timetable: React.FC<TimetableProps> = ({ timetable, subjects, school, profile, currentClass }) => {
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [isDownloading, setIsDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const configSlots = school?.timetableConfig?.slots || DEFAULT_SLOTS;
  const fullHolidays = school?.timetableConfig?.fullHolidays || {};

  const timetableMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    DAYS.forEach(day => {
      map[day] = {};
    });
    timetable.forEach(slot => {
      if (map[slot.day]) {
        map[slot.day][slot.timeSlot] = slot;
      }
    });
    return map;
  }, [timetable]);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Subject';

  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
      const element = printRef.current;
      // Temporarily make it visible for canvas rendering
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '-9999px';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${profile?.name || 'Student'}_Timetable.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to download timetable. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">Timetable</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Schedule</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Class: {currentClass?.name || 'N/A'}
                </p>
              </div>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Calendar size={32} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Weekly Schedule</h2>
              <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
            </div>
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#1e3a8a]/20 disabled:opacity-70"
            >
              {isDownloading ? <span className="animate-pulse">Generating PDF...</span> : <><Download size={16} /> Download PDF</>}
            </button>
          </div>

          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar snap-x">
            {DAYS.map(day => (
              <button 
                key={day}
                onClick={() => setSelectedDay(day)} 
                className={`snap-start shrink-0 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${selectedDay === day ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md' : 'bg-[#FCFBF8] dark:bg-slate-800/50 text-[#1e3a8a]/60 dark:text-white/60 border-[#D4AF37]/20 hover:border-[#D4AF37]/50'}`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Cards Layout */}
          <div className="space-y-4 mt-4">
            {fullHolidays[selectedDay] ? (
              <div className="text-center py-20 bg-[#FCFBF8] dark:bg-slate-800/50 rounded-2xl border border-[#D4AF37]/10 border-dashed">
                  <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#D4AF37]/20">
                      <AlertCircle size={32} className="text-[#D4AF37]" />
                  </div>
                  <p className="font-black text-[#1e3a8a] dark:text-white text-lg">Holiday</p>
                  <p className="text-[10px] text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 mt-1 font-bold uppercase tracking-widest">No classes scheduled for today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {configSlots.map((slotConfig: any, index: number) => {
                  const isBreak = slotConfig.type === 'break';
                  const slotData = timetableMap[selectedDay]?.[slotConfig.label];
                  
                  if (isBreak) {
                    return (
                      <div key={index} className="md:col-span-2 flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <Coffee size={24} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-sm">Break Time</h4>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={12}/> {slotConfig.label}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="group flex gap-4 p-5 bg-[#FCFBF8] dark:bg-slate-800/50 rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:shadow-lg transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent rounded-bl-full pointer-events-none"></div>
                      
                      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <Book size={24} className="text-[#1e3a8a] dark:text-[#D4AF37]" />
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="font-black text-[#1e3a8a] dark:text-white text-lg leading-tight truncate">
                          {slotData ? getSubjectName(slotData.subjectId) : 'Free Period'}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-bold text-[#1e3a8a]/70 dark:text-[#D4AF37]/80 flex items-center gap-1 uppercase tracking-widest bg-[#D4AF37]/10 px-2 py-1 rounded-md">
                            <Clock size={12} /> {slotConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hidden Printable Timetable */}
        <div style={{ display: 'none' }}>
          <div ref={printRef} className="bg-white p-8 w-[1123px] text-black font-sans">
            <div className="text-center mb-8 border-b-4 border-[#1e3a8a] pb-6">
              <h1 className="text-4xl font-black text-[#1e3a8a] uppercase tracking-widest">Weekly Time Table</h1>
              <h2 className="text-2xl font-bold text-slate-700 mt-2">Student: {profile?.name || 'Student'} | Class: {currentClass?.name || 'N/A'}</h2>
            </div>

            <table className="w-full border-collapse border-2 border-slate-300 text-center">
              <thead>
                <tr>
                  <th className="border-2 border-slate-300 p-4 text-lg font-black bg-[#1e3a8a] text-white w-48">Time / Day</th>
                  {DAYS.map(day => (
                    <th key={day} className="border-2 border-slate-300 p-4 text-lg font-black bg-[#1e3a8a] text-white">
                      {day.substring(0, 3).toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {configSlots.map((slotConfig: any) => {
                  if (slotConfig.type === 'break') {
                    return (
                      <tr key={slotConfig.label}>
                        <td className="border-2 border-slate-300 p-4 text-md font-bold whitespace-nowrap bg-slate-100 text-slate-700">
                          {slotConfig.label}
                        </td>
                        <td colSpan={DAYS.length} className="border-2 border-slate-300 p-4 text-xl font-black uppercase tracking-[0.5em] bg-slate-200 text-slate-500">
                          Break Time
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={slotConfig.label}>
                      <td className="border-2 border-slate-300 p-4 text-md font-bold whitespace-nowrap bg-slate-100 text-slate-700">
                        {slotConfig.label}
                      </td>
                      {DAYS.map(day => {
                        if (fullHolidays[day]) {
                          return (
                            <td key={`${day}-${slotConfig.label}`} className="border-2 border-slate-300 p-4 text-md font-bold bg-slate-50 text-slate-400">
                              HOLIDAY
                            </td>
                          );
                        }

                        const slot = timetableMap[day]?.[slotConfig.label];
                        return (
                          <td key={`${day}-${slotConfig.label}`} className="border-2 border-slate-300 p-4 text-lg font-bold text-[#1e3a8a]">
                            {slot ? getSubjectName(slot.subjectId) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="mt-8 text-right text-sm font-bold text-slate-400">
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Timetable;
