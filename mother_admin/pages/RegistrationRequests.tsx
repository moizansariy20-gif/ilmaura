
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, Info, Globe, Phone, WhatsappLogo, Envelope, 
  MapPin, Buildings, User, Calendar, ShieldCheck, MagnifyingGlass, Funnel,
  ArrowsClockwise,
  Crown,
  Sparkle
} from 'phosphor-react';
import { subscribeToRegistrationRequests, updateRegistrationRequestStatus, addSchoolFirestore, subscribeToPlanRequests, updatePlanRequestStatus } from '../../services/api.ts';
import { motion, AnimatePresence } from 'motion/react';
import { PlanRequest } from '../../types.ts';

interface RegistrationRequestsProps {
  refreshKey?: number;
}

const RegistrationRequests: React.FC<RegistrationRequestsProps> = ({ refreshKey }) => {
  const [activeTab, setActiveTab] = useState<'registrations' | 'planRequests'>('planRequests');
  const [requests, setRequests] = useState<any[]>([]);
  const [planRequests, setPlanRequests] = useState<PlanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    show: boolean;
    type: 'confirm' | 'success' | 'error' | 'progress';
    title: string;
    message: string;
    action?: () => void;
    data?: any;
  }>({ show: false, type: 'confirm', title: '', message: '' });

  useEffect(() => {
    setLoading(true);
    const unsubReg = subscribeToRegistrationRequests((data) => {
      setRequests(data);
      if (activeTab === 'registrations') setLoading(false);
    });

    const unsubPlan = subscribeToPlanRequests((data) => {
      setPlanRequests(data);
      if (activeTab === 'planRequests') setLoading(false);
    });

    return () => {
      unsubReg();
      unsubPlan();
    };
  }, [refreshKey, activeTab]);

  const handleApprove = async (request: any) => {
    setModal({
      show: true,
      type: 'confirm',
      title: 'Approve Registration',
      message: `Are you sure you want to approve "${request.school_name}"? This will create a new school portal and grant them access.`,
      action: async () => {
        setModal({ show: true, type: 'progress', title: 'Approving...', message: 'Step 1: Creating school database record...' });
        setActionLoading(request.id);
        
        try {
          // 1. Create the school
          console.log("EduControl: Step 1 - Creating school...");
          const newSchool = await addSchoolFirestore({
            name: request.school_name,
            subdomain: request.subdomain,
            logoURL: request.logo_url,
            country: request.country,
            state: request.state,
            city: request.city,
            address: request.address,
            email: request.email,
            contactName: request.contact_name,
            phone: request.mobile,
            whatsapp: request.whatsapp,
            status: 'active'
          });

          // 2. Update status
          console.log("EduControl: Step 2 - Updating request status...");
          setModal({ show: true, type: 'progress', title: 'Updating Status...', message: 'Step 2: Marking registration as approved...' });
          await updateRegistrationRequestStatus(request.id, 'approved');
          
          setModal({
            show: true,
            type: 'success',
            title: 'Approval Successful',
            message: `${request.school_name} has been approved. The school code is: ${newSchool.schoolCode}. You can now find it in the Schools list.`,
          });
          setSelectedRequest(null);
        } catch (err: any) {
          console.error("EduControl: Detailed Approval Error:", err);
          setModal({
            show: true,
            type: 'error',
            title: 'Approval Failed',
            message: err.message || "An unexpected error occurred while processing the request.",
            data: err
          });
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleReject = async (request: any) => {
    setModal({
      show: true,
      type: 'confirm',
      title: 'Reject Registration',
      message: `Are you sure you want to reject "${request.school_name}"?`,
      action: async () => {
        setActionLoading(request.id);
        try {
          await updateRegistrationRequestStatus(request.id, 'rejected');
          setModal({
            show: true,
            type: 'success',
            title: 'Request Rejected',
            message: `${request.school_name}'s registration has been rejected.`,
          });
        } catch (err: any) {
          setModal({
            show: true,
            type: 'error',
            title: 'Rejection Failed',
            message: err.message || "Failed to update status."
          });
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleApprovePlan = async (request: PlanRequest) => {
    setModal({
      show: true,
      type: 'confirm',
      title: `Approve ${request.type === 'trial' ? 'Trial' : 'Upgrade'}`,
      message: `Are you sure you want to approve the "${request.type}" request for "${request.schoolName}"?`,
      action: async () => {
        setActionLoading(request.id);
        try {
          await updatePlanRequestStatus(request.id, 'approved');
          setModal({
            show: true,
            type: 'success',
            title: 'Request Approved',
            message: `The ${request.type} request has been approved. Please update the school plan manually in the Schools List.`,
          });
        } catch (err: any) {
          setModal({
            show: true,
            type: 'error',
            title: 'Approval Failed',
            message: err.message || "Failed to update status."
          });
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleRejectPlan = async (request: PlanRequest) => {
    setModal({
      show: true,
      type: 'confirm',
      title: 'Reject Plan Request',
      message: `Are you sure you want to reject the "${request.type}" request for "${request.schoolName}"?`,
      action: async () => {
        setActionLoading(request.id);
        try {
          await updatePlanRequestStatus(request.id, 'rejected');
          setModal({
            show: true,
            type: 'success',
            title: 'Request Rejected',
            message: 'The plan request has been rejected.',
          });
        } catch (err: any) {
          setModal({
            show: true,
            type: 'error',
            title: 'Rejection Failed',
            message: err.message || "Failed to update status."
          });
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const filteredItems = activeTab === 'registrations' 
    ? requests.filter(req => {
        const matchesFilter = filter === 'all' || req.status === filter;
        const matchesSearch = req.school_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
      })
    : planRequests.filter(req => {
        const matchesFilter = filter === 'all' || req.status === filter;
        const matchesSearch = req.schoolName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
      });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-sm border border-slate-200 shadow-sm w-fit">
        <button 
          onClick={() => { setActiveTab('planRequests'); setFilter('pending'); }}
          className={`px-6 py-2.5 rounded-sm text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'planRequests' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Crown size={18} /> Plan Requests
        </button>
        <button 
          onClick={() => { setActiveTab('registrations'); setFilter('pending'); }}
          className={`px-6 py-2.5 rounded-sm text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'registrations' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Buildings size={18} /> Registrations
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-sm text-xs font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-slate-100 text-slate-900 border border-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-blue-500 transition-all font-bold"
          />
        </div>
      </div>

      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">School</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">{activeTab === 'registrations' ? 'Contact' : 'Request Type'}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-900">{activeTab === 'registrations' ? item.school_name : item.schoolName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{activeTab === 'registrations' ? item.subdomain : item.schoolId}</p>
                  </td>
                  <td className="px-6 py-4">
                    {activeTab === 'registrations' ? (
                      <p className="text-sm font-medium text-slate-700">{item.contact_name}</p>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        item.type === 'trial' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.type}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">
                    {new Date(item.created_at || item.requestDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                      item.status === 'pending' ? 'text-amber-600' : 
                      item.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => activeTab === 'registrations' ? handleApprove(item) : handleApprovePlan(item)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-sm transition-colors"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => activeTab === 'registrations' ? handleReject(item) : handleRejectPlan(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-sm transition-colors"
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
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Custom Action Modal */}
       <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => modal.type !== 'progress' && setModal({ ...modal, show: false })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                  {modal.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-8">
                  {modal.message}
                </p>
                <div className="flex items-center gap-3 w-full">
                  {modal.type === 'confirm' ? (
                    <>
                      <button onClick={() => setModal({ ...modal, show: false })} className="flex-1 py-3 border border-slate-200 font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                      <button onClick={() => { modal.action?.(); setModal({ ...modal, show: false }); }} className="flex-1 py-3 bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px]">Confirm</button>
                    </>
                  ) : <button onClick={() => setModal({ ...modal, show: false })} className="w-full py-3 bg-slate-100 font-bold uppercase tracking-widest text-[10px]">Dismiss</button>}
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
