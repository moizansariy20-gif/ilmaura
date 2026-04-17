import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutGrid, ChevronDown, User, Sparkles, Clock } from 'lucide-react';
import { UserProfile } from '../../types.ts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface TimetableProps {
  profile: UserProfile;
  timetable: any[];
  subjects: any[];
  classes: any[];
  school?: any;
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

import { translations, Language } from '../../services/translations.ts';

const Timetable: React.FC<TimetableProps> = ({ profile, timetable, subjects, classes, school }) => {
  const currentLang = (profile?.preferences?.language as Language) || 'English';
  const t = translations[currentLang];

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);
  
  const configSlots = school?.timetableConfig?.slots || DEFAULT_SLOTS;
  const fullHolidays = school?.timetableConfig?.fullHolidays || {};
  const masterStructure = school?.timetableConfig?.masterStructure || [];
  const dayStructures = school?.timetableConfig?.dayStructures || {};

  const DAYS = [t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];
  const DAYS_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  const timetableMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    DAYS_KEYS.forEach(day => {
      map[day] = {};
    });
    timetable
      .filter(slot => slot.classId === selectedClassId)
      .forEach(slot => {
        if (map[slot.day]) {
          map[slot.day][slot.timeSlot] = slot;
        }
    });
    return map;
  }, [timetable, selectedClassId]);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || t.subject;
  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return t.selectClass;
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    const className = classes.find(c => c.id === selectedClassId)?.name || 'Class';
    
    // Temporarily show the print section off-screen
    const printElement = printRef.current;
    const originalStyle = printElement.getAttribute('style') || '';
    
    printElement.style.display = 'block';
    printElement.style.position = 'absolute';
    printElement.style.left = '-9999px';
    printElement.style.top = '0';
    
    try {
      const canvas = await html2canvas(printElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Timetable_${className.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      printElement.setAttribute('style', originalStyle);
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header & Filters Combined - Same as Homework */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6B1D2F] via-[#D4AF37] to-[#6B1D2F]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#6B1D2F] dark:text-[#D4AF37] tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(107,29,47,0.1)' }}>{t.timetable}</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">{t.teacherPortal} • {t.officialSchedule}</p>
                <p className="text-[11px] md:text-sm text-[#6B1D2F] dark:text-white font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  {profile.name}
                </p>
              </div>
            </div>
            <div className="flex p-1.5 md:p-2 bg-gradient-to-br from-[#6B1D2F] to-[#4A1420] shadow-[0_10px_25px_-5px_rgba(107,29,47,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-slate-800/10 flex items-center justify-center relative z-10">
                {profile.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-[#E5E0D8] dark:from-slate-700 dark:to-slate-800">
                    <User size={28} className="text-[#6B1D2F] dark:text-[#D4AF37] md:hidden" />
                    <User size={36} className="text-[#6B1D2F] dark:text-[#D4AF37] hidden md:block" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#D4AF37] rounded-full border-2 border-[#6B1D2F] flex items-center justify-center shadow-lg">
                <Sparkles size={10} className="text-[#6B1D2F] dark:text-white md:hidden" />
                <Sparkles size={12} className="text-[#6B1D2F] dark:text-white hidden md:block" />
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <label className="block text-[11px] font-bold text-[#6B1D2F] dark:text-[#D4AF37] uppercase tracking-widest mb-2 ml-1">{t.selectClass}</label>
            <div className="relative">
              <select 
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full appearance-none pl-6 pr-12 py-4 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-[#D4AF37]/20 hover:border-[#D4AF37]/50 rounded-xl text-sm font-bold text-[#6B1D2F] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all shadow-[inset_0_2px_8px_rgba(107,29,47,0.04),0_1px_2px_rgba(255,255,255,1)]"
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]" />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-10">
          {DAYS_KEYS.map((dayKey, index) => {
            const dayLabel = DAYS[index];
            const isHoliday = fullHolidays[dayKey];
            return (
              <div key={dayKey} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-[#6B1D2F] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">{dayLabel}</h2>
                  <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
                  {isHoliday && <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100 shadow-sm">{t.holiday}</span>}
                </div>

                {isHoliday ? (
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-dashed border-[#D4AF37]/30 text-center shadow-sm">
                    <p className="text-[#A89F91] dark:text-slate-400 font-black uppercase tracking-[0.3em] text-sm">{t.noClassesScheduled}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {configSlots.map((slotConfig: any) => {
                      const slot = timetableMap[dayKey]?.[slotConfig.label];
                      const isBreak = slotConfig.type === 'break';
                      
                      return (
                        <div 
                          key={`${dayKey}-${slotConfig.label}`}
                          className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
                            isBreak 
                              ? 'bg-[#FCFBF8] dark:bg-slate-800/50 border-[#D4AF37]/20 shadow-sm' 
                              : slot 
                                ? 'bg-white dark:bg-slate-800 border-[#D4AF37]/20 shadow-[0_10px_40px_-10px_rgba(107,29,47,0.1)] hover:shadow-[0_15px_50px_-12px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50'
                                : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700 opacity-60'
                          }`}
                        >
                          {slot && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] to-[#6B1D2F]"></div>}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                                isBreak 
                                  ? 'bg-white dark:bg-slate-700 text-[#D4AF37] border-[#D4AF37]/20' 
                                  : 'bg-[#FCFBF8] dark:bg-slate-700 text-[#6B1D2F] dark:text-[#D4AF37] border-[#D4AF37]/10'
                              }`}>
                                {isBreak ? <Clock size={20} /> : <LayoutGrid size={20} />}
                              </div>
                              <div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${
                                  isBreak 
                                    ? 'bg-white dark:bg-slate-700 text-[#D4AF37] border-[#D4AF37]/20' 
                                    : 'bg-[#FCFBF8] dark:bg-slate-700 text-[#6B1D2F]/60 dark:text-[#D4AF37]/60 border-[#D4AF37]/10'
                                }`}>
                                  {slotConfig.label}
                                </span>
                                <div className="mt-1">
                                  {isBreak ? (
                                    <p className="text-lg font-black text-[#D4AF37] uppercase tracking-widest italic">{t.recessPeriod}</p>
                                  ) : slot ? (
                                    <p className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">{getSubjectName(slot.subjectId)}</p>
                                  ) : (
                                    <p className="text-sm font-bold text-slate-300 dark:text-slate-600 italic">{t.freePeriod}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {!isBreak && slot && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-[#FCFBF8] dark:bg-slate-700 rounded-xl border border-[#D4AF37]/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
                                <p className="text-[10px] font-black text-[#6B1D2F]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest">{t.roomAssigned}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-10 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FCFBF8] dark:bg-slate-800 rounded-xl flex items-center justify-center border border-[#D4AF37]/20 shadow-sm">
                <LayoutGrid size={20} className="text-[#D4AF37]" />
              </div>
              <p className="text-[10px] font-black text-[#A89F91] dark:text-slate-400 uppercase tracking-widest">{t.teachersOfficialCopy}</p>
            </div>
            <button onClick={handleDownloadPDF} className="w-full sm:w-auto px-10 py-5 bg-gradient-to-b from-[#6B1D2F] to-[#4A1421] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(107,29,47,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] border border-[#4A1421] hover:from-[#7C2236] hover:to-[#5A1828] active:scale-95 transition-all flex items-center justify-center gap-3">
              Download Timetable
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print Section */}
      <div ref={printRef} style={{ display: 'none', width: '794px', padding: '40px', background: 'white', fontFamily: 'sans-serif' }}>
        <div className="border border-slate-200 dark:border-slate-700 p-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6 mb-8">
            <div className="flex items-center gap-4">
              {school?.logoURL ? (
                <img src={school.logoURL} alt="Logo" className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">LOGO</div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{school?.name || 'SCHOOL NAME'}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Academic Session 2025-26</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-light text-slate-900 dark:text-white uppercase tracking-widest">TIME TABLE</h2>
              <div className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                CLASS: {classes.find(c => c.id === selectedClassId)?.name || '---'}
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-slate-200 dark:border-slate-700 mb-10">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="border border-slate-200 dark:border-slate-700 p-3 text-xs font-bold uppercase text-slate-700 dark:text-slate-200">Day</th>
                {masterStructure.map((m: any, i: number) => (
                  <th key={i} className="border border-slate-200 dark:border-slate-700 p-3 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-200">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{m.startTime}-{m.endTime}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                const currentStructure = dayStructures[day] || masterStructure;
                return (
                  <tr key={day}>
                    <td className="border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 font-bold uppercase text-center text-slate-800 dark:text-slate-100 text-xs">{day}</td>
                    {masterStructure.map((_: any, i: number) => {
                      const mSlot = currentStructure[i];
                      if (!mSlot) return <td key={i} className="border border-slate-200 dark:border-slate-700 p-3 text-center text-slate-200">-</td>;
                      
                      const timeString = `${mSlot.startTime} - ${mSlot.endTime}`;
                      const slot = timetable.find(s => s.day === day && s.timeSlot === timeString && s.classId === selectedClassId);
                      
                      if (mSlot.isBreak) {
                        return (
                          <td key={i} className="border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">BREAK</span>
                          </td>
                        );
                      }
                      
                      if (slot) {
                        const subject = subjects.find(s => s.id === slot.subjectId);
                        // In teacher portal, we might not have all teachers, but we know it's this teacher's class if they are viewing it, or we just show the subject.
                        // Actually, the teacher portal timetable shows the timetable for a specific class.
                        // Let's just show the subject name.
                        return (
                          <td key={i} className="border border-slate-200 dark:border-slate-700 p-3 text-center">
                            <div className="font-bold text-slate-900 dark:text-white text-[10px] uppercase leading-tight">{subject?.name || '---'}</div>
                          </td>
                        );
                      }
                      
                      return <td key={i} className="border border-slate-200 dark:border-slate-700 p-3 text-center text-slate-200">-</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Class Discipline & Manners / آداب اور نظم و ضبط</h3>
              <ul className="space-y-2 text-[10px] text-slate-700 dark:text-slate-200">
                <li className="flex justify-between"><span>1. Be Punctual & Respectful</span> <span dir="rtl">وقت کی پابندی اور احترام کریں</span></li>
                <li className="flex justify-between"><span>2. Maintain Cleanliness</span> <span dir="rtl">صفائی کا خاص خیال رکھیں</span></li>
                <li className="flex justify-between"><span>3. Listen Attentively</span> <span dir="rtl">توجہ سے سنیں اور عمل کریں</span></li>
                <li className="flex justify-between"><span>4. Be Kind to Peers</span> <span dir="rtl">ساتھیوں کے ساتھ حسن سلوک کریں</span></li>
              </ul>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-100 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Important Instructions / ضروری ہدایات</h3>
              <ul className="space-y-2 text-[10px] text-slate-700 dark:text-slate-200">
                <li className="flex justify-between"><span>• Arrive before the bell rings</span> <span dir="rtl">گھنٹی بجنے سے پہلے کلاس میں پہنچیں</span></li>
                <li className="flex justify-between"><span>• Follow the timetable strictly</span> <span dir="rtl">ٹائم ٹیبل کی سختی سے پابندی کریں</span></li>
                <li className="flex justify-between"><span>• Keep your books organized</span> <span dir="rtl">اپنی کتابیں ترتیب سے رکھیں</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Timetable;
