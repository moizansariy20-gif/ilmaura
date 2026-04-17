import React from 'react';
import { ShieldAlert, Unlock, Lock, Info } from 'lucide-react';
import { SchoolStatus } from '../../types.ts';

interface AccessControlProps {
  schools: any[];
  onUpdateStatus: (id: string, status: SchoolStatus, isLocked: boolean) => void;
}

const AccessControl: React.FC<AccessControlProps> = ({ schools, onUpdateStatus }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-start gap-4 bg-blue-50 border border-blue-200 p-6 rounded-sm shadow-sm">
        <div className="w-10 h-10 bg-blue-600 rounded-sm flex items-center justify-center text-white shrink-0">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-blue-900">School Access Control</h3>
          <p className="text-sm text-blue-800 mt-1">
            Suspending a school will immediately block access for all its users (Principals, Teachers, Parents, Students). Use this carefully.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {schools.map((school) => (
            <div key={school.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${!school.isAccessLocked ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                  {!school.isAccessLocked ? <Unlock size={18} /> : <Lock size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{school.name}</h4>
                    <span className="text-xs font-mono text-slate-500 px-2 py-0.5 bg-slate-100 rounded-sm border border-slate-200">{school.id}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold ${school.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>Status: {school.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6">
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Access</p>
                  <p className={`text-sm font-bold ${!school.isAccessLocked ? 'text-emerald-600' : 'text-rose-600'}`}>{!school.isAccessLocked ? 'Allowed' : 'Blocked'}</p>
                </div>
                
                <button 
                  onClick={() => onUpdateStatus(school.id, !school.isAccessLocked ? SchoolStatus.SUSPENDED : SchoolStatus.ACTIVE, !school.isAccessLocked)}
                  className={`px-4 py-2 rounded-sm font-medium text-sm transition-colors ${
                    !school.isAccessLocked 
                      ? 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {!school.isAccessLocked ? 'Suspend Access' : 'Restore Access'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-slate-500 text-xs font-medium">
          <Info size={14} />
          <span>All access changes are logged for security purposes.</span>
        </div>
      </div>
    </div>
  );
};

export default AccessControl;