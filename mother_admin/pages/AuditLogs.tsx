import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, RefreshCw } from 'lucide-react';
import { getAuditLogsPaginated, subscribeToAllActivityLogs } from '../../services/api.ts';
import { ActivityLog } from '../../types.ts';
import { supabase } from '../../services/supabase.ts';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  const fetchLogs = async (pageNum: number, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const { logs: newLogs, totalCount } = await getAuditLogsPaginated(pageNum, PAGE_SIZE);
      
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
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);

    // Real-time subscription for NEW audit logs
    const channel = supabase.channel('all_audit_logs_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'audit_logs' 
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
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchLogs(page + 1, true);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.schoolId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-slate-200 p-6 rounded-none shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Track all actions performed across the platform.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-sm text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Download size={16} /> Download CSV
        </button>
      </div>

      <div className="bg-white rounded-none border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-4 bg-slate-50">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by user, action, or school ID..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-none text-sm focus:outline-none focus:border-blue-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-none text-sm font-medium text-slate-600 hover:bg-slate-50 w-full sm:w-auto justify-center">
            <Calendar size={16} /> All Time
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">School ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 font-medium">
                      <RefreshCw size={20} className="animate-spin" />
                      Loading logs...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{log.userName}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{log.userRole}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{log.action}</span>
                        <span className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{log.details}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-600">{log.schoolId}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-none text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.category}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No logs found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
          <p className="text-sm text-slate-600">
            Showing <span className="font-bold text-slate-900">{logs.length}</span> logs
          </p>
          
          {hasMore && (
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-none hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Load More
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;