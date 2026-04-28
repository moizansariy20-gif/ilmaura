
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Funnel, 
  MagnifyingGlass, 
  Trash, 
  PencilSimple, 
  UserPlus, 
  FileText, 
  CurrencyDollar, 
  Gear, 
  WarningCircle,
  CalendarCheck,
  ArrowsClockwise,
  UserList,
  IdentificationCard,
  ListChecks,
  Info,
  CircleNotch,
  ArrowLeft as LArrowLeft,
  Sparkle as LSparkles,
  Gear as LSettings
} from 'phosphor-react';
import { getActivityLogsPaginated, subscribeToActivityLogs } from '../../services/api.ts';
import { ActivityLog } from '../../types.ts';
import Loader from '../../components/Loader.tsx';
import { supabase } from '../../services/supabase.ts';

interface ActivityLogPageProps {
  schoolId: string;
  profile?: any;
  onNavigate?: (path: string) => void;
}

const ActivityLogPage: React.FC<ActivityLogPageProps> = ({ schoolId, profile, onNavigate }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  const fetchLogs = async (pageNum: number, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const { logs: newLogs, totalCount } = await getActivityLogsPaginated(schoolId, pageNum, PAGE_SIZE);
      
      if (isLoadMore) {
        setLogs(prev => {
          const updated = [...prev, ...newLogs];
          setHasMore(updated.length < totalCount);
          return updated;
        });
      } else {
        setLogs(newLogs);
        setHasMore(newLogs.length < totalCount);
      }

      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);

    // Real-time subscription for NEW logs only
    const channel = supabase.channel(`activity_logs_realtime_${schoolId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_logs', 
        filter: `school_id=eq.${schoolId}` 
      }, (payload) => {
        const newLog: ActivityLog = {
          id: payload.new.id,
          schoolId: payload.new.school_id,
          userId: payload.new.user_id,
          userName: payload.new.user_name,
          userRole: payload.new.user_role,
          action: payload.new.action,
          details: payload.new.details,
          category: payload.new.category,
          timestamp: payload.new.timestamp
        };
        setLogs(prev => [newLog, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchLogs(page + 1, true);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.userName?.toLowerCase() || '').includes(term) ||
      (log.action?.toLowerCase() || '').includes(term) ||
      (log.details?.toLowerCase() || '').includes(term);
    
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesRole = roleFilter === 'all' || (log.userRole?.toLowerCase() || '') === roleFilter.toLowerCase();
    
    const matchesDate = !dateFilter || (log.timestamp ? new Date(log.timestamp).toISOString().split('T')[0] === dateFilter : true);
    
    return matchesSearch && matchesCategory && matchesRole && matchesDate;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Student': return <User size={16} className="text-blue-600" />;
      case 'Teacher': return <UserList size={16} className="text-emerald-600" />;
      case 'Fee': return <CurrencyDollar size={16} className="text-amber-600" />;
      case 'Academic': return <FileText size={16} className="text-indigo-600" />;
      case 'System': return <Gear size={16} className="text-slate-600 dark:text-slate-300" />;
      case 'Settings': return <Gear size={16} className="text-rose-600" />;
      case 'Expense': return <CurrencyDollar size={16} className="text-rose-600" />;
      case 'Enquiry': return <Funnel size={16} className="text-cyan-600" />;
      case 'Attendance': return <CalendarCheck size={16} className="text-orange-600" />;
      default: return <Info size={16} className="text-slate-400" />;
    }
  };

  const getActionColor = (action: string) => {
    if (!action) return 'text-slate-600 bg-slate-50 border-slate-200';
    const act = action.toLowerCase();
    if (act.includes('delete') || act.includes('remove')) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (act.includes('add') || act.includes('create') || act.includes('enroll')) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (act.includes('update') || act.includes('edit') || act.includes('change')) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  if (isMobile) {
    return (
      <div className="bg-[#FCFBF8] dark:bg-[#020617] min-h-screen pb-32 font-sans">
        {/* Premium Mobile Header */}
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <button 
              onClick={() => onNavigate?.('dashboard')}
              className="w-10 h-10 rounded-xl bg-[#1e3a8a]/10 dark:bg-white/10 flex items-center justify-center text-[#1e3a8a] dark:text-white border border-[#1e3a8a]/20 active:scale-90 transition-transform"
            >
              <LArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-[#1e3a8a] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(30,58,138,0.1)' }}>
                Activity
              </h1>
              <div className="flex flex-col mt-1">
                <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Principal App • Live Feed</p>
              </div>
            </div>
            <div className="flex p-1.5 bg-gradient-to-br from-[#1e3a8a] to-[#172554] shadow-[0_10px_25px_-5px_rgba(30,58,138,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-[#1e293b]/10 flex items-center justify-center relative z-10">
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

          <div className="relative z-10 space-y-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH ACTIVITIES..."
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full p-4 pl-12 bg-[#FCFBF8] dark:bg-[#020617] shadow-[inset_0_2px_8px_rgba(30,58,138,0.04)] border border-[#E5E0D8] dark:border-[#1e293b] rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all"
              />
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
            </div>
            <div className="relative">
              <input 
                type="date" 
                value={dateFilter} 
                onChange={e => setDateFilter(e.target.value)} 
                className="w-full p-4 pl-12 bg-[#FCFBF8] dark:bg-[#020617] shadow-[inset_0_2px_8px_rgba(30,58,138,0.04)] border border-[#E5E0D8] dark:border-[#1e293b] rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all uppercase"
              />
              <Funnel size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        <div className="px-4 mt-8 space-y-8">
          {/* List Section */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                Recent Activities
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {loading && logs.length === 0 ? (
                <div className="flex justify-center py-12">
                  <CircleNotch size={32} className="animate-spin text-[#D4AF37]" />
                </div>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <div key={log.id} className="bg-white dark:bg-[#1e293b] p-4 rounded-3xl border border-[#D4AF37]/20 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] flex items-start gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] to-[#1e3a8a] opacity-90"></div>
                    
                    <div className="w-12 h-12 rounded-2xl bg-[#FCFBF8] dark:bg-[#020617] border border-[#E5E0D8] dark:border-[#1e293b] flex items-center justify-center shrink-0 shadow-sm relative z-10">
                      {getCategoryIcon(log.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#1e3a8a] dark:text-white leading-snug mb-1">{log.details}</p>
                      <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1">
                        <User size={12} /> {log.userName} ({log.userRole})
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 rounded-3xl bg-white dark:bg-[#1e293b] shadow-[0_10px_40px_-10px_rgba(30,58,138,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                  <ListChecks size={48} className="text-[#D4AF37] mx-auto mb-4 opacity-50" weight="fill" />
                  <p className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">No Activities Found</p>
                </div>
              )}
              
              {hasMore && (
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-4 mt-2 rounded-2xl bg-[#1e3a8a]/5 dark:bg-white/5 border border-[#1e3a8a]/10 dark:border-white/10 text-[#1e3a8a] dark:text-white font-black text-xs uppercase tracking-widest hover:bg-[#1e3a8a]/10 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingMore ? <CircleNotch size={16} className="animate-spin" /> : <ArrowsClockwise size={16} />}
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
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
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
              <Clock size={32} weight="fill" className="text-white" />
              Activity History
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-white dark:bg-[#1e293b] text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                History Tracking Active
              </span>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wide">Complete record of all portal activities</p>
            </div>
          </div>
        </div>

        {/* --- FILTERS BAR --- */}
        <div className="bg-white dark:bg-[#1e293b] border-b-2 border-slate-200 dark:border-[#1e293b] p-4 flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300" />
            <input 
              type="text" 
              placeholder="SEARCH BY NAME, ACTION OR DETAILS..."
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 dark:border-[#1e293b] focus:border-[#1e3a8a] outline-none font-bold text-xs uppercase tracking-widest transition-all placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-[#1e293b] p-1 px-3">
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Activity Type:</span>
              <select 
                className="bg-transparent py-2 outline-none font-black text-[10px] uppercase tracking-widest text-[#1e3a8a]"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Activities</option>
                <option value="Student">Students</option>
                <option value="Teacher">Teachers</option>
                <option value="Fee">Fees</option>
                <option value="Academic">Academics</option>
                <option value="Attendance">Attendance</option>
                <option value="Expense">Expenses</option>
                <option value="Enquiry">Enquiries</option>
                <option value="System">System</option>
                <option value="Settings">Settings</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-[#1e293b] p-1 px-3">
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">User Role:</span>
              <select 
                className="bg-transparent py-2 outline-none font-black text-[10px] uppercase tracking-widest text-[#1e3a8a]"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="principal">Principal</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-[#1e293b] p-1 px-3">
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Date:</span>
              <input 
                type="date"
                className="bg-transparent py-2 outline-none font-black text-[10px] uppercase tracking-widest text-[#1e3a8a]"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* --- CONTENT BODY --- */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0f172a] text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b-2 border-slate-200 dark:border-[#1e293b]">
                  <th className="px-6 py-4 border-r-2 border-slate-100 dark:border-[#334155]">Time & Date</th>
                  <th className="px-6 py-4 border-r-2 border-slate-100 dark:border-[#334155]">Performed By</th>
                  <th className="px-6 py-4 border-r-2 border-slate-100 dark:border-[#334155]">Action Taken</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <CircleNotch size={40} className="animate-spin text-[#1e3a8a]" />
                        <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fetching Logs...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="group hover:bg-slate-50 dark:bg-[#0f172a] transition-colors">
                      <td className="px-6 py-4 border-r-2 border-slate-100 dark:border-[#334155] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                            {new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r-2 border-slate-100 dark:border-[#334155] whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 flex items-center justify-center text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-[#1e293b]">
                            <User size={18} weight="bold" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.userName}</p>
                            <span className="text-[9px] font-black text-[#1e3a8a] bg-blue-50 px-2 py-0.5 border border-blue-100 uppercase tracking-widest">
                              {log.userRole}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r-2 border-slate-100 dark:border-[#334155] whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(log.category)}
                            <span className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{log.category}</span>
                          </div>
                          <span className={`text-[10px] font-black px-3 py-1 border-2 uppercase tracking-widest inline-block ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl uppercase tracking-wide">
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center text-slate-400 border-4 border-dashed border-slate-200 dark:border-[#1e293b]">
                          <Clock size={40} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">No records found</p>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Check your search or filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- FOOTER STATS & LOAD MORE --- */}
        <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border-t-4 border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
            Showing <span className="text-slate-900 dark:text-white">{logs.length}</span> Activities | Filtered: <span className="text-[#1e3a8a]">{filteredLogs.length}</span>
          </p>

          {hasMore && (
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] text-white text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              {loadingMore ? (
                <>
                  <CircleNotch size={14} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ArrowsClockwise size={14} weight="bold" />
                  Load More Activities
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogPage;
