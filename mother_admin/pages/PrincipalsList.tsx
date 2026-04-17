
import React, { useState } from 'react';
import { UserPlus, Key, ShieldX, Link as LinkIcon, Search, X, Lock, Trash2, CheckCircle, Info } from 'lucide-react';
import { createPrincipalAccount } from '../../services/api.ts';

interface PrincipalsListProps {
  principals: any[];
  schools: any[];
  onUpdatePrincipal: (id: string, status: string) => void;
  onDeletePrincipal: (id: string) => void;
}

const PrincipalsList: React.FC<PrincipalsListProps> = ({ principals, schools, onUpdatePrincipal, onDeletePrincipal }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPrincipals = principals.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete Principal ${name}? This is permanent.`)) {
      await onDeletePrincipal(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Principals List</h1>
          <p className="text-slate-500 text-sm mt-1">Manage accounts for {principals.length} school principals.</p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-sm">
           <Info size={16} className="text-blue-600 shrink-0" />
           <p className="text-xs text-blue-800 font-medium">To add a new Principal, use the 'Add New School' button in the <span className="font-bold">Schools</span> tab.</p>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 relative bg-slate-50">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-blue-500 transition-colors" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Principal Details</th>
                <th className="px-6 py-4">Admin ID</th>
                <th className="px-6 py-4">Assigned School</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrincipals.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-[#007bff] bg-blue-50 px-2 py-1 border border-blue-100 uppercase tracking-widest">
                      {p.login_id || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{schools.find(s=>s.id === p.schoolId)?.name || 'Unassigned'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-sm text-xs font-semibold ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onUpdatePrincipal(p.id, p.status === 'Active' ? 'Disabled' : 'Active')} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-sm transition-colors" title={p.status === 'Active' ? 'Disable' : 'Enable'}><ShieldX size={16} /></button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrincipalsList;
