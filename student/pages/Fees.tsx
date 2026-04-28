
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarCircleIcon as DollarSign, 
  ReceiptDollarIcon as Receipt, 
  Clock01Icon as Clock, 
  QrCodeIcon as QrCode, 
  AlertCircleIcon as AlertTriangle, 
  CheckmarkCircle01Icon as CheckCircle2, 
  Bookmark01Icon as Bookmark, 
  ArrowRight01Icon as ArrowRight, 
  Wallet01Icon as Wallet, 
  Loading01Icon as Loader2, 
  Cancel01Icon as X, 
  SmartPhone01Icon as Smartphone, 
  LockIcon as Lock, 
  ChartLineData01Icon as TrendingUp, 
  CreditCardIcon as CreditCard, 
  Time01Icon as History, 
  UserCircleIcon as UserCircle, 
  Calendar01Icon as CalendarIcon, 
  ArrowLeft01Icon as ArrowLeft 
} from 'hugeicons-react';
import { ShieldCheck } from 'lucide-react';
import { subscribeToFeeLedger, updateFeeTransaction, updateStudent } from '../../services/api.ts';
import { generateEasyPaisaPaymentLink } from '../../services/easypaisaService.ts';
import { FeeTransaction, UserProfile, School } from '../../types.ts';
import Loader from '../../components/Loader.tsx';
import StudentPageHeader from '../components/StudentPageHeader.tsx';

interface FeesProps {
  profile: UserProfile;
  school: School;
  currentClass?: any;
}

const Fees: React.FC<FeesProps> = ({ profile, school, currentClass }) => {
  const navigate = useNavigate();
  const [feeLedger, setFeeLedger] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<FeeTransaction | null>(null);
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'processing' | 'success' | 'failed'>('confirm');
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    // We try to use the profile's student ID, but if it's missing, we still load ledger 
    // by using the schoolId. However, real security rules would prevent reading others' data.
    // For this view, we filter by studentId if available.
    
    if (!profile.schoolId) {
      setLoading(false); 
      return;
    }

    const unsub = subscribeToFeeLedger(profile.schoolId, (transactions) => {
      // Filter transactions for this student. 
      // Robustness: Check against profile.studentDocId OR profile.uid if stored differently
      
      if (profile.studentDocId) {
          setFeeLedger(transactions.filter(t => t.studentId === profile.studentDocId));
      } else {
          // Fallback or empty if we can't identify the student yet
          setFeeLedger([]);
      }
      setLoading(false);
    }, (e) => { console.error(e); setLoading(false); });
    
    return () => unsub();
  }, [profile.schoolId, profile.studentDocId]);

  // Filter logic
  const dbPendingBills = feeLedger.filter((t) => t.status === 'Pending');
  
  // Virtual Bill Logic: If student status is 'Unpaid', generate a virtual bill for the current month
  // if it's not already in the ledger
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const hasCurrentMonthInLedger = feeLedger.some(t => {
      if (!t.month) return false;
      // Normalizing comparison to avoid issues with extra spaces/case
      return t.month.toLowerCase().trim() === currentMonthName.toLowerCase().trim();
  });
  
  const pendingBills: FeeTransaction[] = [...dbPendingBills];
  
  const studentProfile = profile as any;
  if (studentProfile.feeStatus === 'Unpaid' && !hasCurrentMonthInLedger) {
    const studentFee = studentProfile.monthlyFee || school.feeConfig?.classFees[studentProfile.classId!] || 0;
    pendingBills.push({
      id: 'virtual-current',
      studentId: studentProfile.studentDocId!,
      studentName: studentProfile.name,
      classId: studentProfile.classId!,
      month: currentMonthName,
      amountPaid: studentFee,
      fineAmount: 0,
      discountAmount: studentProfile.discountAmount || 0,
      paymentMethod: 'Challan',
      receiptNo: 'NEW',
      status: 'Pending',
      recordedBy: 'System Virtual',
      timestamp: new Date(),
      type: 'challan'
    });
  }
  
  const paymentHistory = feeLedger.filter((t) => t.status === 'Success');
  
  const easyPaisaConfig = school.easyPaisaConfig;
  const isEasyPaisaEnabled = easyPaisaConfig?.enabled;

  const initiatePayment = (bill: FeeTransaction) => {
      if (!easyPaisaConfig?.enabled) {
          alert("Online payments are disabled.");
          return;
      }

      if (easyPaisaConfig.sandboxMode) {
          // Open Custom Simulator
          setSelectedBill(bill);
          setPaymentStep('confirm');
          setShowPaymentModal(true);
      } else {
          // Real Production Link
          if (bill.easyPaisaPaymentUrl) {
              window.open(bill.easyPaisaPaymentUrl, '_blank');
          } else {
              const linkData = generateEasyPaisaPaymentLink(
                  easyPaisaConfig as any,
                  { id: profile.studentDocId!, name: profile.name, rollNo: 'N/A', classId: profile.classId! },
                  profile.schoolId!,
                  bill.amountPaid,
                  `Fee Payment for ${bill.month}`
              );
              if (linkData) {
                  window.open(linkData.paymentUrl, '_blank');
              } else {
                  alert("Could not generate payment link.");
              }
          }
      }
  };

  const handleSimulatePayment = async () => {
      if (!selectedBill) return;
      
      setPaymentStep('processing');
      setPaymentError('');

      try {
          // 1. Fake Network Delay
          await new Promise(resolve => setTimeout(resolve, 2000));

          // 2. Perform DB Updates
          // FIX: Use selectedBill.studentId as the fallback if profile.studentDocId is missing/undefined
          const targetStudentId = profile.studentDocId || selectedBill.studentId;
          
          if (selectedBill.id && profile.schoolId && targetStudentId) {
                
                // A. Update the EXISTING pending transaction to Success
                // This removes it from 'Pending' list and moves it to 'History' list automatically
                await updateFeeTransaction(profile.schoolId, selectedBill.id, {
                    status: 'Success',
                    paymentMethod: 'EasyPaisa',
                    recordedBy: 'EasyPaisa Sandbox',
                    timestamp: new Date() // Update timestamp to show as recent activity
                });
                
                // B. Update the Student Status (This updates Principal Overview)
                await updateStudent(profile.schoolId, targetStudentId, { feeStatus: 'Paid' });
                
                // C. Update UI Step
                setPaymentStep('success');
          } else {
              console.error("Missing Data:", { 
                  billId: selectedBill.id, 
                  schoolId: profile.schoolId, 
                  studentId: targetStudentId 
              });
              throw new Error("System Error: Missing student or bill identification.");
          }
      } catch (err: any) {
          console.error("Payment failed", err);
          setPaymentError(err.message || "Simulation Failed");
          setPaymentStep('failed');
      }
  };

  // Calculate stats for the grid
  const totalDues = feeLedger.reduce((acc, curr) => acc + (curr.status === 'Pending' ? curr.amountPaid : 0), 0);
  const totalPaid = feeLedger.reduce((acc, curr) => acc + (curr.status === 'Success' ? curr.amountPaid : 0), 0);
  const lastPayment = paymentHistory.length > 0 ? paymentHistory[0].amountPaid : 0;
  const pendingCount = pendingBills.length;

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

      {/* Header Section - Matches Settings Page */}
      <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">My Fees</h1>
            <div className="flex flex-col mt-1 md:mt-2">
              <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Financial Ledger</p>
              <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                Manage your dues and payments
              </p>
            </div>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <DollarSign size={32} className="text-[#D4AF37] relative z-10" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-10">
        
        {/* Stats Overview - Settings Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending Dues', value: `₨${totalDues.toLocaleString()}`, icon: <AlertTriangle size={18} />, color: 'text-rose-500' },
            { label: 'Total Paid', value: `₨${totalPaid.toLocaleString()}`, icon: <CheckCircle2 size={18} />, color: 'text-emerald-500' },
            { label: 'Last Payment', value: `₨${lastPayment.toLocaleString()}`, icon: <History size={18} />, color: 'text-[#D4AF37]' },
            { label: 'Unpaid Bills', value: pendingCount, icon: <Receipt size={18} />, color: 'text-[#1e3a8a] dark:text-[#D4AF37]' }
          ].map((stat, i) => (
            <div key={i} className="p-5 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl shadow-sm flex flex-col items-center text-center">
              <div className={`${stat.color} mb-3`}>{stat.icon}</div>
              <p className="text-lg font-black text-[#1e3a8a] dark:text-white tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pending Dues Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Pending Dues</h2>
            <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2].map((i) => (
                <div key={i} className="p-6 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl shadow-sm space-y-6 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="w-32 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                    <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
              ))
            ) : pendingBills.length > 0 ? (
              pendingBills.map((bill) => (
                <div key={bill.id} className="p-6 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl shadow-sm space-y-6 relative overflow-hidden group">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-rose-500/20">Unpaid</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">#{bill.receiptNo}</span>
                      </div>
                      <h3 className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">{bill.month}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tuition & Annual Charges</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-rose-600 tracking-tighter">₨ {bill.amountPaid.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#D4AF37]/10">
                    {isEasyPaisaEnabled ? (
                      <button 
                        onClick={() => initiatePayment(bill)}
                        className="w-full py-4 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg border border-[#1e40af] hover:from-[#2563eb] hover:to-[#1d4ed8] active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <QrCode size={16} className="text-[#D4AF37]" />
                        {easyPaisaConfig?.sandboxMode ? 'Test Pay (Sandbox)' : 'Pay Securely Now'}
                      </button>
                    ) : (
                      <div className="w-full py-4 bg-white dark:bg-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 dark:border-slate-600 flex items-center justify-center gap-2">
                        <Wallet size={16} /> Pay at Admin Office
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl text-center">
                <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-4" />
                <p className="text-sm font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest">All Cleared!</p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">No pending dues at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Payment History</h2>
            <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl shadow-sm flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))
            ) : paymentHistory.length > 0 ? (
              paymentHistory.map((t) => (
                <div key={t.id} className="p-4 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl shadow-sm flex items-center justify-between group hover:border-[#1e3a8a]/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center border border-[#D4AF37]/10 shadow-sm">
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-black text-[#1e3a8a] dark:text-white text-sm tracking-tight">{t.month}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.paymentMethod}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#1e3a8a] dark:text-white text-base tracking-tighter">₨ {t.amountPaid.toLocaleString()}</p>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 bg-[#FCFBF8] dark:bg-[#0f172a] border border-[#D4AF37]/10 rounded-2xl text-center">
                <History size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No history available</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Payment Modal - Settings Style */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-[#D4AF37]/20"
          >
            <div className="p-6 border-b border-[#D4AF37]/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center">
                  <Smartphone size={20} className="text-[#D4AF37]" />
                </div>
                <h3 className="font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest text-sm">EasyPaisa Pay</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              {paymentStep === 'confirm' && (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-[#FCFBF8] dark:bg-[#020617]/50 rounded-2xl border border-[#D4AF37]/10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount for {selectedBill.month}</p>
                    <h3 className="text-3xl font-black text-[#1e3a8a] dark:text-white tracking-tighter">₨ {selectedBill.amountPaid.toLocaleString()}</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">Account Number</label>
                      <div className="relative">
                        <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                        <input type="text" defaultValue="03001234567" className="w-full pl-14 pr-6 py-4 bg-white dark:bg-[#1e293b] border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#1e3a8a]/30 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 uppercase tracking-widest ml-1">Secret PIN</label>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={18} />
                        <input type="password" placeholder="•••••" className="w-full pl-14 pr-6 py-4 bg-white dark:bg-[#1e293b] border border-[#1e3a8a]/10 dark:border-[#D4AF37]/20 rounded-2xl text-sm font-bold text-slate-700 dark:text-white focus:border-[#1e3a8a]/30 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSimulatePayment}
                    className="w-full py-4 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg border border-[#1e40af] hover:from-[#2563eb] hover:to-[#1d4ed8] active:scale-95 transition-all"
                  >
                    Confirm & Pay Now
                  </button>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-12 text-center space-y-6">
                  <Loader2 size={48} className="text-[#1e3a8a] animate-spin mx-auto" />
                  <div>
                    <h3 className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">Processing Payment</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Please do not close this window</p>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="text-center space-y-6 py-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1e3a8a] dark:text-white tracking-tight">Payment Successful</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Transaction ID: {`TXN-${Date.now().toString().slice(-6)}`}</p>
                  </div>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full py-4 bg-[#1e3a8a] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg"
                  >
                    Close Receipt
                  </button>
                </div>
              )}

              {paymentStep === 'failed' && (
                <div className="text-center space-y-6 py-4">
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                    <AlertTriangle size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-rose-600 tracking-tight">Payment Failed</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">{paymentError}</p>
                  </div>
                  <button 
                    onClick={() => setPaymentStep('confirm')}
                    className="w-full py-4 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-slate-200"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default Fees;
