
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, Info, Globe, Phone, WhatsappLogo, Envelope, 
  MapPin, Buildings, User, Calendar, ShieldCheck, MagnifyingGlass, Funnel
} from 'phosphor-react';
import { subscribeToRegistrationRequests, updateRegistrationRequestStatus, addSchoolFirestore } from '../../services/api.ts';
import { motion, AnimatePresence } from 'motion/react';

const RegistrationRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToRegistrationRequests((data) => {
      setRequests(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (request: any) => {
    if (!confirm(`Are you sure you want to approve ${request.school_name}? This will create a new school portal.`)) return;
    
    setActionLoading(request.id);
    try {
      // 1. Create the school in the main schools table
      await addSchoolFirestore({
        name: request.school_name,
        subdomain: request.subdomain,
        logoUrl: request.logo_url,
        country: request.country,
        state: request.state,
        city: request.city,
        address: request.address,
        principalEmail: request.email,
        principalName: request.contact_name,
        principalMobile: request.mobile,
        status: 'active'
      });

      // 2. Update request status
      await updateRegistrationRequestStatus(request.id, 'approved');
      
      alert(`${request.school_name} has been approved and created successfully!`);
      setSelectedRequest(null);
    } catch (err) {
      console.error("Approval Error:", err);
      alert("Failed to approve school. Please check logs.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request: any) => {
    if (!confirm(`Are you sure you want to reject ${request.school_name}?`)) return;
    
    setActionLoading(request.id);
    try {
      await updateRegistrationRequestStatus(request.id, 'rejected');
      setSelectedRequest(null);
    } catch (err) {
      console.error("Rejection Error:", err);
      alert("Failed to reject request.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = 
      req.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.subdomain?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Requests</p>
          <h3 className="text-2xl font-bold text-slate-900">{requests.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
          <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">Pending</p>
          <h3 className="text-2xl font-bold text-amber-700">{requests.filter(r => r.status === 'pending').length}</h3>
        </div>
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">Approved</p>
          <h3 className="text-2xl font-bold text-emerald-700">{requests.filter(r => r.status === 'approved').length}</h3>
        </div>
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm">
          <p className="text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">Rejected</p>
          <h3 className="text-2xl font-bold text-rose-700">{requests.filter(r => r.status === 'rejected').length}</h3>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-sm text-xs font-medium capitalize transition-all ${filter === t ? 'bg-slate-100 text-slate-900 border border-slate-300' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">School / Subdomain</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                        {req.logo_url ? (
                          <img src={req.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Buildings size={20} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{req.school_name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Globe size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-500">{req.subdomain}.ilmaura.com</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-700">{req.contact_name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Envelope size={12} /> {req.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      {req.city}, {req.state}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold capitalize ${
                      req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {req.status === 'pending' && <Clock size={12} />}
                      {req.status === 'approved' && <CheckCircle size={12} />}
                      {req.status === 'rejected' && <XCircle size={12} />}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
                        title="View Details"
                      >
                        <Info size={18} />
                      </button>
                      {req.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(req)}
                            disabled={actionLoading === req.id}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-sm transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleReject(req)}
                            disabled={actionLoading === req.id}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-sm transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Buildings size={32} className="text-slate-300" />
                      <p className="text-slate-500 text-sm">No registration requests found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-sm shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-sm shadow-sm flex items-center justify-center overflow-hidden border border-slate-200">
                    {selectedRequest.logo_url ? (
                      <img src={selectedRequest.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Buildings size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedRequest.school_name}</h3>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Registration Details</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-sm transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact Info</p>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <User size={16} className="text-slate-400" />
                          {selectedRequest.contact_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Envelope size={16} className="text-slate-400" />
                          {selectedRequest.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone size={16} className="text-slate-400" />
                          {selectedRequest.mobile}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <WhatsappLogo size={16} className="text-slate-400" />
                          {selectedRequest.whatsapp}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Portal Link</p>
                      <div className="p-3 bg-slate-50 rounded-sm border border-slate-200">
                        <p className="text-xs text-slate-500 mb-0.5">Subdomain</p>
                        <p className="text-sm font-bold text-slate-900">{selectedRequest.subdomain}.ilmaura.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Location</p>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Globe size={16} className="text-slate-400" />
                          {selectedRequest.country}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin size={16} className="text-slate-400" />
                          {selectedRequest.city}, {selectedRequest.state}
                        </div>
                        <div className="text-xs text-slate-500 pl-6">
                          {selectedRequest.address}
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Submitted On</p>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Calendar size={16} className="text-slate-400" />
                        {new Date(selectedRequest.created_at).toLocaleDateString('en-US', { 
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Review carefully before approving</span>
                </div>
                <div className="flex items-center gap-3">
                  {selectedRequest.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleReject(selectedRequest)}
                        className="px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-medium rounded-sm hover:bg-slate-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleApprove(selectedRequest)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-sm hover:bg-blue-700 transition-colors"
                      >
                        Approve & Create
                      </button>
                    </>
                  ) : (
                    <div className="text-sm font-medium text-slate-500 capitalize">
                      Status: {selectedRequest.status}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegistrationRequests;
