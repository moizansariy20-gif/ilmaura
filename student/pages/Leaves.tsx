import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Calendar03Icon, CheckmarkCircle01Icon, Cancel01Icon, Clock01Icon, File01Icon, PlusSignIcon, Loading01Icon, ArrowLeft01Icon as ArrowLeft, Delete02Icon } from 'hugeicons-react';

interface LeavesProps {
  profile: any;
  currentClass: any;
  school?: any;
}

const Leaves: React.FC<LeavesProps> = ({ profile, currentClass, school }) => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(today);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile?.schoolId && profile?.classId && profile?.studentDocId) {
      fetchLeaves();
    }
  }, [profile]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_applications')
        .select('*')
        .eq('school_id', profile.schoolId)
        .eq('class_id', profile.classId)
        .eq('student_id', profile.studentDocId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const deletedIds = JSON.parse(localStorage.getItem('deletedLeaves') || '[]');
      const filteredData = (data || []).filter(leave => !deletedIds.includes(leave.id));
      
      setLeaves(filteredData);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (type: 'sick' | 'urgent') => {
    const schoolName = school?.name || '[School Name]';
    const className = currentClass?.name || '[Your Class]';
    const studentName = profile?.name || '[Your Name]';
    const startDate = formData.startDate || '[Start Date]';
    const endDate = formData.endDate || '[End Date]';
    const currentDate = new Date().toLocaleDateString('en-GB');

    let daysText = '[Number of Days] days';
    let dateRangeText = `from ${startDate} to ${endDate}`;

    if (formData.startDate && formData.endDate) {
      if (formData.startDate === formData.endDate) {
        daysText = '1 day';
        dateRangeText = `on ${startDate}`;
      } else {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        daysText = `${diffDays} days`;
      }
    }

    let template = '';

    if (type === 'sick') {
      template = `To,
The Principal,
${schoolName}, [City Name].

Subject: Application for Sick Leave

Respected Sir/Madam,

With due respect, it is stated that I am a student of Class ${className} in your school. I have been suffering from a high fever and flu since last night. The doctor has advised me to take complete bed rest for ${daysText}.

Therefore, I cannot attend school ${dateRangeText}. Kindly grant me leave for this period. I shall be very grateful to you.

Yours obediently,

Name: ${studentName}
Class: ${className}
Date: ${currentDate}`;
    } else if (type === 'urgent') {
      template = `To,
The Principal,
${schoolName}, [City Name].

Subject: Application for Urgent Piece of Work

Respected Sir/Madam,

With due respect, it is stated that I am a student of Class ${className} in your school. I have an urgent piece of work at home today.

Therefore, I cannot attend school ${dateRangeText}. Kindly grant me leave for this period. I shall be very grateful to you.

Yours obediently,

Name: ${studentName}
Class: ${className}
Date: ${currentDate}`;
    }

    setFormData(prev => ({ ...prev, reason: template }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      alert('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('leave_applications')
        .insert([{
          school_id: profile.schoolId,
          class_id: profile.classId,
          student_id: profile.studentDocId,
          start_date: formData.startDate,
          end_date: formData.endDate,
          reason: formData.reason,
          status: 'pending'
        }]);

      if (error) throw error;
      
      setFormData({ startDate: '', endDate: '', reason: '' });
      setShowForm(false);
      fetchLeaves();
    } catch (error) {
      console.error('Error submitting leave:', error);
      alert('Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800"><CheckmarkCircle01Icon size={14} /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-200 dark:border-rose-800"><Cancel01Icon size={14} /> Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800"><Clock01Icon size={14} /> Pending</span>;
    }
  };

  const confirmDelete = async () => {
    if (!leaveToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('leave_applications')
        .delete()
        .eq('id', leaveToDelete);
      if (error) throw error;
      
      const deletedIds = JSON.parse(localStorage.getItem('deletedLeaves') || '[]');
      if (!deletedIds.includes(leaveToDelete)) {
        localStorage.setItem('deletedLeaves', JSON.stringify([...deletedIds, leaveToDelete]));
      }
      
      setLeaves(prev => prev.filter(leave => leave.id !== leaveToDelete));
    } catch (error) {
      console.error('Error deleting leave:', error);
    } finally {
      setIsDeleting(false);
      setLeaveToDelete(null);
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    if (!filterDate) return true;
    return leave.start_date <= filterDate && leave.end_date >= filterDate;
  });

  return (
    <div className="min-h-full bg-white dark:bg-[#020617] pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      {/* TOP NAV BAR */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
          <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e293b] shadow-sm flex items-center justify-center border border-slate-100 dark:border-[#1e293b] active:scale-90 transition-transform"
          >
              <ArrowLeft size={20} className="text-[#1e3a8a] dark:text-[#D4AF37]" />
          </button>
          <div className="flex items-center gap-3">
              <div className="text-right">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Student</p>
                  <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{profile?.name || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37]/40 shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                  {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                      profile?.name?.charAt(0) || 'S'
                  )}
              </div>
          </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8 relative z-10 mt-4">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">Leaves</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Leave Management</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Apply and track your leaves
                </p>
              </div>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Calendar03Icon size={32} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          
          {/* Action Button */}
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="w-full py-4 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg border border-[#1e40af] hover:from-[#2563eb] hover:to-[#1d4ed8] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <PlusSignIcon size={16} /> Apply for Leave
            </button>
          )}

          {/* Leave Application Form */}
          {showForm && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">New Application</h2>
                <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
              </div>

              <form onSubmit={handleSubmit} className="p-5 md:p-6 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      className="w-full px-4 py-4 bg-white dark:bg-[#1e293b] border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#1e3a8a]/30 focus:ring-2 focus:ring-[#1e3a8a]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                      className="w-full px-4 py-4 bg-white dark:bg-[#1e293b] border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#1e3a8a]/30 focus:ring-2 focus:ring-[#1e3a8a]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">Reason for Leave</label>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => applyTemplate('sick')}
                        className="text-[9px] font-bold bg-[#D4AF37]/10 text-[#1e3a8a] dark:text-[#D4AF37] px-2 py-1 rounded-md border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors"
                      >
                        Sick Leave
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyTemplate('urgent')}
                        className="text-[9px] font-bold bg-[#D4AF37]/10 text-[#1e3a8a] dark:text-[#D4AF37] px-2 py-1 rounded-md border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors"
                      >
                        Urgent Work
                      </button>
                    </div>
                  </div>
                  <textarea
                    required
                    rows={12}
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Please explain why you need leave..."
                    className="w-full px-4 py-4 bg-white dark:bg-[#1e293b] border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#1e3a8a]/30 focus:ring-2 focus:ring-[#1e3a8a]/10 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none"
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-4 bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm border border-slate-200 dark:border-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg border border-[#1e40af] hover:from-[#2563eb] hover:to-[#1d4ed8] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loading01Icon className="animate-spin" size={16} /> : <CheckmarkCircle01Icon size={16} />}
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Past Applications */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Past Applications</h2>
                <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1 hidden sm:block"></div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 rounded-xl text-xs font-bold text-slate-700 dark:text-white focus:border-[#1e3a8a]/30 focus:ring-2 focus:ring-[#1e3a8a]/10 outline-none shadow-sm transition-all flex-1 sm:flex-none"
                />
                {filterDate && (
                  <button 
                    onClick={() => setFilterDate('')}
                    className="p-2 bg-slate-100 dark:bg-[#1e293b] text-slate-500 hover:text-rose-500 rounded-xl transition-colors"
                  >
                    <Cancel01Icon size={16} />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loading01Icon className="animate-spin text-[#D4AF37]" size={32} />
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="text-center py-16 bg-[#FCFBF8] dark:bg-[#0f172a] rounded-3xl border border-[#D4AF37]/10 shadow-sm">
                <File01Icon className="w-16 h-16 text-[#D4AF37]/40 mx-auto mb-4" />
                <p className="text-[#1e3a8a] dark:text-white font-black text-lg">No leave applications</p>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  {filterDate ? 'No leaves found for the selected date.' : "You haven't applied for any leaves yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredLeaves.map((leave) => (
                  <div key={leave.id} className="bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-2xl border border-[#D4AF37]/20 shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex flex-col gap-4 group hover:border-[#D4AF37]/50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest mb-1">Date Range</p>
                        <p className="font-black text-slate-900 dark:text-white text-base md:text-lg">
                          {new Date(leave.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} 
                          {leave.start_date !== leave.end_date && ` - ${new Date(leave.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(leave.status)}
                        <button
                          onClick={() => setLeaveToDelete(leave.id)}
                          className="p-1.5 rounded-lg transition-all bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:bg-[#1e293b] dark:text-slate-500 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                          title="Delete application"
                        >
                          <Delete02Icon size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-[#020617]/50 p-4 rounded-xl border border-slate-100 dark:border-[#334155]">
                      <p className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest mb-1">Reason</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm font-medium whitespace-pre-wrap">{leave.reason}</p>
                    </div>

                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      Applied on {new Date(leave.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {leaveToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#020617] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-[#334155] animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4 mx-auto">
              <Delete02Icon className="text-rose-600 dark:text-rose-400" size={24} />
            </div>
            <h3 className="text-lg font-black text-center text-slate-900 dark:text-white mb-2">Delete Application?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Are you sure you want to delete this leave application? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLeaveToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loading01Icon className="animate-spin" size={16} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
