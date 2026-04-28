
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar01Icon as CalendarCheck2, 
  CheckmarkCircle01Icon as Check, 
  Cancel01Icon as X, 
  Clock01Icon as Clock, 
  Calendar01Icon as CalendarIcon, 
  ArrowLeft01Icon as ChevronLeft, 
  ArrowRight01Icon as ChevronRight, 
  ChartLineData01Icon as TrendingUp, 
  PieChartIcon as PieChart, 
  AlertCircleIcon as AlertCircle, 
  Coffee01Icon as Coffee, 
  Loading01Icon as Loader2, 
  SparklesIcon as Sparkles, 
  ArrowDown01Icon as ChevronDown, 
  FilterIcon as ListFilter, 
  Sun01Icon as Sun, 
  ChartBarLineIcon as BarChart3, 
  Target01Icon as Target, 
  ArrowRight01Icon as ArrowRight, 
  UserGroupIcon as Users, 
  CheckmarkCircle01Icon as CheckCircle, 
  UserRemove01Icon as UserX, 
  UserCheck01Icon as UserCheck, 
  UserCircleIcon as UserCircle,
  ArrowLeft01Icon as ArrowLeft
} from 'hugeicons-react';
import { PartyPopper } from 'lucide-react';
import { fetchPublicHolidays } from '../../services/calendarService.ts';
import { motion, AnimatePresence } from 'motion/react';

interface AttendanceProps {
  attendance?: any[]; 
  exams?: any[]; 
  marks?: any[]; 
  subjects?: any[];
  profile?: any; 
  currentClass?: any; 
  loading?: boolean;
}

// --- Premium Minimal Icons (Glassmorphism Style) ---

const GlassIcon = ({ children, color = "#D4AF37" }: { children: React.ReactNode, color?: string }) => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <div className="absolute inset-0 bg-white rounded-xl border-2 border-slate-100 shadow-lg"></div>
    <div style={{ color }} className="relative z-10">
      {children}
    </div>
  </div>
);

const Attendance: React.FC<AttendanceProps> = ({ attendance = [], profile, currentClass, loading }) => {
  const navigate = useNavigate();
  const today = new Date(); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(true);
  const [showFullMonthHistory, setShowFullMonthHistory] = useState(false);

  useEffect(() => {
    const loadHolidays = async () => {
      setIsLoadingHolidays(true);
      const year = currentDate.getFullYear();
      const fetchedHolidays = await fetchPublicHolidays(year);
      setHolidays(prev => ({ ...prev, ...fetchedHolidays }));
      setIsLoadingHolidays(false);
    };
    loadHolidays();
  }, [currentDate.getFullYear()]);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getStartDayOfWeek = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDateKey = (year: number, month: number, day: number) => 
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const daysInMonth = getDaysInMonth(currentDate);
  const startDay = getStartDayOfWeek(currentDate);
  
  const currentMonthDbRecords = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === year && recordDate.getMonth() === month;
    });
  }, [attendance, currentDate]);

  const presentCount = currentMonthDbRecords.filter(r => r.status === 'Present').length;
  const absentCount = currentMonthDbRecords.filter(r => r.status === 'Absent').length;
  const leaveCount = currentMonthDbRecords.filter(r => r.status === 'Leave').length;
  
  const totalMarkedDays = presentCount + absentCount + leaveCount;
  const monthlyPercentage = totalMarkedDays > 0 ? Math.round((presentCount / totalMarkedDays) * 100) : 0;

  const { workingDaysInMonth, totalOffDaysInMonth, workingDaysPassedInMonth } = useMemo(() => {
    let off = 0;
    let workPassed = 0;
    const isCurrentActiveMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    const checkDayLimit = isCurrentActiveMonth ? today.getDate() : daysInMonth;

    for (let d = 1; d <= daysInMonth; d++) {
        const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
        const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), d);
        const isSunday = tempDate.getDay() === 0;
        const isHoliday = !!holidays[dateKey];

        if (isSunday || isHoliday) {
            off++;
        } else {
            if (d <= checkDayLimit) {
                if (currentDate < today || isCurrentActiveMonth) workPassed++;
            }
        }
    }
    if (currentDate > today && !isCurrentActiveMonth) workPassed = 0;
    return { workingDaysInMonth: daysInMonth - off, totalOffDaysInMonth: off, workingDaysPassedInMonth: workPassed };
  }, [currentDate, daysInMonth, holidays]); 

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setShowFullMonthHistory(false);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setShowFullMonthHistory(false);
  };
  
  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), d);
      const record = attendance.find(r => r.date === dateKey);
      const isToday = d === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
      const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      const isSunday = tempDate.getDay() === 0;
      const holidayName = holidays[dateKey];

      let bgColor = 'bg-slate-50 dark:bg-[#0f172a]';
      let textColor = 'text-slate-400';
      let borderStyle = 'border-transparent';

      if (record?.status === 'Present') { bgColor = 'bg-emerald-500'; textColor = 'text-white'; }
      else if (record?.status === 'Absent') { bgColor = 'bg-rose-500'; textColor = 'text-white'; }
      else if (record?.status === 'Leave') { bgColor = 'bg-amber-500'; textColor = 'text-white'; }
      else if (isSunday) { bgColor = 'bg-[#D4AF37]/20'; textColor = 'text-[#D4AF37]'; }
      else if (holidayName) { bgColor = 'bg-purple-500/20'; textColor = 'text-purple-600'; }
      
      if (isToday) borderStyle = 'ring-2 ring-[#D4AF37] ring-offset-2 dark:ring-offset-slate-900';

      days.push(
        <div 
          key={d} 
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${bgColor} ${textColor} ${borderStyle} relative group cursor-default`}
        >
          {d}
          {record && (
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white border border-slate-100 shadow-sm"></div>
          )}
        </div>
      );
    }
    return days;
  };

  const generatedTimeline = useMemo(() => {
      const timeline = [];
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())) return [];
      const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
      const limitDay = isCurrentMonth ? today.getDate() : daysInMonth;

      for (let d = limitDay; d >= 1; d--) {
          const dateKey = formatDateKey(year, month, d);
          const dateObj = new Date(year, month, d);
          const isSunday = dateObj.getDay() === 0;
          const holidayName = holidays[dateKey];
          const record = attendance.find(r => r.date === dateKey);

          let status = 'Unknown';
          let type = 'normal';

          if (holidayName) { status = holidayName; type = 'holiday'; }
          else if (isSunday) { status = 'Sunday Holiday'; type = 'sunday'; }
          else if (record) { status = record.status; type = 'record'; }
          else {
              if (d === today.getDate() && isCurrentMonth) { status = 'Pending'; type = 'pending'; }
              else { status = 'Not Recorded'; type = 'missing'; }
          }

          timeline.push({ date: dateObj, day: d, status, type, rawRecord: record });
      }
      return timeline;
  }, [currentDate, holidays, attendance, daysInMonth]);

  const displayedActivities = showFullMonthHistory ? generatedTimeline : generatedTimeline.slice(0, 7);

  return (
    <div className="min-h-full bg-white dark:bg-[#020617] pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* TOP NAV BAR */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
          <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e293b] shadow-sm flex items-center justify-center border border-slate-100 dark:border-[#1e293b] active:scale-90 transition-transform"
          >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-3">
              <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Student</p>
                  <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{profile?.name || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-white shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                  {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                      profile?.name?.charAt(0) || 'S'
                  )}
              </div>
          </div>
      </div>

      {/* Header Section - Matches Settings/Fees Page */}
      <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">Attendance</h1>
            <div className="flex flex-col mt-1 md:mt-2">
              <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Daily Tracking</p>
              <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                Track your presence and punctuality
              </p>
            </div>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CalendarCheck2 size={32} className="text-[#D4AF37] relative z-10" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-10">
        
        {/* Stats Overview - Settings Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: loading ? '...' : presentCount, icon: <UserCheck size={18} />, color: 'text-emerald-500' },
            { label: 'Absent', value: loading ? '...' : absentCount, icon: <UserX size={18} />, color: 'text-rose-500' },
            { label: 'Leaves', value: loading ? '...' : leaveCount, icon: <Coffee size={18} />, color: 'text-amber-500' },
            { label: 'Percentage', value: loading ? '...' : `${monthlyPercentage}%`, icon: <TrendingUp size={18} />, color: 'text-[#D4AF37]' }
          ].map((stat, i) => (
            <div key={i} className={`p-5 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl shadow-sm flex flex-col items-center text-center ${loading ? 'animate-pulse' : ''}`}>
              <div className={`${stat.color} mb-3`}>{stat.icon}</div>
              <p className="text-lg font-black text-[#1e3a8a] dark:text-white tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Efficiency Section */}
        <div className={`bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-3xl p-8 shadow-sm ${loading ? 'animate-pulse' : ''}`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                <motion.circle 
                  cx="64" cy="64" r="58" stroke="#D4AF37" strokeWidth="10" fill="transparent" 
                  strokeDasharray={364.4}
                  initial={{ strokeDashoffset: 364.4 }}
                  animate={{ strokeDashoffset: loading ? 364.4 : 364.4 - (364.4 * monthlyPercentage) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[#1e3a8a] dark:text-white leading-none tracking-tighter">{loading ? '...' : `${monthlyPercentage}%`}</span>
              </div>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Efficiency</p>
                  <h3 className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">
                    {loading ? 'Calculating...' : (monthlyPercentage > 80 ? 'Elite Performance' : monthlyPercentage > 60 ? 'Strong Presence' : 'Needs Focus')}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Status</p>
                  <p className="text-sm font-black text-[#1e3a8a] dark:text-white uppercase">{loading ? '...' : (monthlyPercentage > 80 ? 'Excellent' : 'Good')}</p>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: loading ? 0 : `${monthlyPercentage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#D4AF37] rounded-full"
                ></motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Monthly Calendar</h2>
            <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
          </div>

          <div className="bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white rounded-xl border border-[#D4AF37]/20 shadow-sm active:scale-95 transition-all"><ChevronLeft size={18} /></button>
              <div className="text-center">
                <h3 className="text-base font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest">{currentDate.toLocaleString('default', { month: 'long' })}</h3>
                <p className="text-[10px] font-black text-[#D4AF37] tracking-widest uppercase">{currentDate.getFullYear()}</p>
              </div>
              <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white rounded-xl border border-[#D4AF37]/20 shadow-sm active:scale-95 transition-all"><ChevronRight size={18} /></button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['S','M','T','W','T','F','S'].map((day, i) => (
                <div key={i} className={`text-[10px] font-black uppercase tracking-widest ${i===0 ? 'text-[#D4AF37]' : 'text-slate-400'}`}>{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2 justify-items-center mb-8 relative">
              {isLoadingHolidays && (
                <div className="absolute inset-0 z-10 bg-white/40 dark:bg-[#1e293b]/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                  <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                </div>
              )}
              {renderCalendarDays()}
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 pt-6 border-t border-[#D4AF37]/10">
              {[
                { label: 'Present', color: 'bg-emerald-500' },
                { label: 'Absent', color: 'bg-rose-500' },
                { label: 'Leave', color: 'bg-amber-500' },
                { label: 'Sunday', color: 'bg-[#D4AF37]/20' },
                { label: 'Holiday', color: 'bg-purple-500/20' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color} border border-[#D4AF37]/10`}></div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Recent Activity</h2>
              <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
            </div>
            {!showFullMonthHistory && generatedTimeline.length > 7 && (
              <button onClick={() => setShowFullMonthHistory(true)} className="ml-4 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest hover:underline">View All</button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayedActivities.length > 0 ? (
                displayedActivities.map((log, i) => (
                  <motion.div 
                    key={log.date.getTime()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#FCFBF8] dark:bg-[#0f172a] p-4 rounded-2xl border border-[#D4AF37]/10 flex items-center justify-between group shadow-sm hover:border-[#1e3a8a]/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border border-[#D4AF37]/10 ${
                        log.type === 'sunday' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                        log.type === 'holiday' ? 'bg-purple-500/10 text-purple-600' :
                        'bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white'
                      }`}>
                        <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                          {log.date.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black leading-none mt-0.5">{log.date.getDate()}</span>
                      </div>
                      
                      <div>
                        <p className="text-sm font-black text-[#1e3a8a] dark:text-white tracking-tight">
                          {log.status === 'Present' ? 'Marked Present' : log.status}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {log.date.toLocaleDateString('en-US', { weekday: 'long' })}
                          {log.status === 'Present' && log.rawRecord?.timestamp && ` • ${new Date(log.rawRecord.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      {log.status === 'Present' ? (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                          <Check size={14} strokeWidth={4} />
                        </div>
                      ) : log.status === 'Absent' ? (
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 border border-rose-500/20">
                          <X size={14} strokeWidth={4} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-600">
                          <Clock size={14} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-10 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl text-center">
                  <Clock size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No recent activity</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
