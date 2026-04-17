
import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertCircle, MessageSquare, BrainCircuit, Activity } from 'lucide-react';

interface AIInsightsPanelProps {
  schools: any[];
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ schools }) => {
  const warnings = schools.filter(s => !s.licenseStatus).length;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex items-center gap-3">
        <Activity className="text-emerald-600" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time status of all connected schools.</p>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-sm shadow-sm relative overflow-hidden border border-slate-800">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">System Status</span>
          </div>
          <p className="text-xl font-medium leading-relaxed">All systems operational. Network stability is 100%.</p>
          <div className="flex flex-wrap gap-3 pt-2">
             <div className="bg-white/10 px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-2 border border-white/5">
                <TrendingUp size={14} className="text-emerald-400" /> Performance Normal
             </div>
             {warnings > 0 && (
                <div className="bg-rose-500/20 px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-2 border border-rose-500/30 text-rose-200">
                    <AlertCircle size={14} className="text-rose-400" /> {warnings} School Warning(s)
                </div>
             )}
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Activity size={100} className="text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <MessageSquare className="text-slate-400" size={20} />
              <h3 className="font-bold text-slate-900">Recent Alerts</h3>
           </div>
           <div className="space-y-3">
              {[
                "Database backup completed successfully.",
                "New version v1.2.0 deployed.",
                "Server load is within normal limits."
              ].map((remark, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-sm text-sm text-slate-700 border border-slate-100">
                  {remark}
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm">
           <div className="border-b border-slate-100 pb-4 mb-4">
             <h3 className="font-bold text-slate-900">Automated Reminders</h3>
           </div>
           <div className="space-y-2">
              {[
                { target: "All Principals", msg: "Term end report due", date: "Today" },
                { target: "SCH-003 Principal", msg: "Renewal reminder sent", date: "Yesterday" },
                { target: "Finance Dept", msg: "Monthly salary sync", date: "2d ago" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-slate-100 rounded-sm hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.target}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.msg}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{item.date}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
