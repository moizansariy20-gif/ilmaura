
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, MagnifyingGlass, Trash, CalendarBlank, CurrencyDollar, Wallet, 
  TrendUp, Funnel, Spinner, CheckCircle, Receipt, X, Bank,
  DownloadSimple, ArrowsClockwise, Lightning, CalendarPlus
} from 'phosphor-react';
import { addExpense, deleteExpense, subscribeToExpenses, logActivity } from '../../services/api.ts';
import { Expense, UserProfile } from '../../types.ts';
import { usePermissions } from '../../hooks/usePermissions.ts';

interface ExpenseManagementProps {
  profile: UserProfile;
  schoolId: string;
  view?: 'log' | 'recurring'; // Prop to control view
}

interface FixedExpenseTemplate {
  id: string;
  title: string;
  amount: number;
  category: string;
}

const CATEGORIES = ['Utilities', 'Maintenance', 'Salaries', 'Supplies', 'Refreshment', 'Other'];

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ profile, schoolId, view = 'log' }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const { canAdd, canEdit, canDelete } = usePermissions(profile);
  const sectionId = 'expenses';
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFixedModal, setShowFixedModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isSaving, setIsSaving] = useState(false);

  // Form State for One-Time Expense
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Fixed Expenses State
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseTemplate[]>(() => {
      const saved = localStorage.getItem(`fixed_expenses_${schoolId}`);
      return saved ? JSON.parse(saved) : [];
  });
  
  const [fixedForm, setFixedForm] = useState({ title: '', amount: '', category: 'Salaries' });

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    const unsub = subscribeToExpenses(schoolId, (data) => {
      setExpenses(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, [schoolId]);

  useEffect(() => {
      localStorage.setItem(`fixed_expenses_${schoolId}`, JSON.stringify(fixedExpenses));
  }, [fixedExpenses, schoolId]);

  // --- DERIVED DATA ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'All' || exp.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const todayTotal = expenses
      .filter(e => e.date === today)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const count = filteredExpenses.length;
    
    return { total, todayTotal, count };
  }, [expenses, filteredExpenses]);

  // --- ACTIONS ---

  const handleSave = async () => {
    if (!form.title || !form.amount || !form.date) {
      alert("Title, Amount and Date are required.");
      return;
    }
    
    setIsSaving(true);
    try {
      await addExpense(schoolId, {
        title: form.title,
        amount: Number(form.amount),
        category: form.category as any,
        date: form.date,
        notes: form.notes,
        recordedBy: 'Principal'
      });
      setShowAddModal(false);
      setForm({
        title: '',
        amount: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (e) {
      console.error(e);
      alert("Failed to save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFixedTemplate = () => {
      if (!fixedForm.title || !fixedForm.amount) return alert("Details required");
      const newTemplate: FixedExpenseTemplate = {
          id: Date.now().toString(),
          title: fixedForm.title,
          amount: Number(fixedForm.amount),
          category: fixedForm.category
      };
      setFixedExpenses([...fixedExpenses, newTemplate]);
      setFixedForm({ title: '', amount: '', category: 'Salaries' });
      setShowFixedModal(false);
  };

  const handleDeleteFixedTemplate = (id: string) => {
      if(window.confirm("Remove this recurring template?")) {
          setFixedExpenses(fixedExpenses.filter(f => f.id !== id));
      }
  };

  const handlePostFixedExpense = async (template: FixedExpenseTemplate) => {
      if (!window.confirm(`Post "${template.title}" expense for today?`)) return;
      
      try {
          await addExpense(schoolId, {
              title: template.title,
              amount: template.amount,
              category: template.category as any,
              date: new Date().toISOString().split('T')[0], // Post for today
              notes: 'Auto-posted from Recurring list',
              recordedBy: 'System'
          });
          alert("Expense posted successfully!");
          // Since we might be in 'recurring' view, user won't see it immediately in list. 
          // We could optionally switch views, but let's keep them where they are.
      } catch (e) {
          alert("Failed to post.");
      }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this expense record?")) {
      try {
        await deleteExpense(schoolId, id);
      } catch (e) {
        console.error(e);
        alert("Failed to delete.");
      }
    }
  };

  // --- STYLES (SHARP / BRUTALIST) ---
  const inputStyle = "w-full p-3 bg-slate-50 border-2 border-slate-200 focus:border-[#1e3a8a] outline-none font-bold text-slate-700 placeholder-slate-400 rounded-none transition-colors";
  const labelStyle = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block";
  const primaryBtnStyle = "px-6 py-3 bg-[#1e3a8a] text-white font-black uppercase tracking-widest hover:bg-[#172554] transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 active:translate-y-0.5";

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      
      {/* Header & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Spent - Navy */}
          <div className="bg-white dark:bg-slate-800 p-6 border-2 border-blue-900 shadow-sm flex flex-col justify-between h-36 relative transition-all">
              <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Total Spend</span>
                  <div className="p-2 bg-blue-900 text-white rounded-none">
                      <Wallet size={20} weight="fill" />
                  </div>
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white">
                  <span className="text-xl text-slate-400 mr-1">Rs.</span>
                  {stats.total.toLocaleString()}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">All Time</p>
              </div>
          </div>

          {/* Today's Expense - Rose */}
          <div className="bg-white dark:bg-slate-800 p-6 border-2 border-rose-600 shadow-sm flex flex-col justify-between h-36 relative transition-all">
              <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Today's Expense</span>
                  <div className="p-2 bg-rose-600 text-white rounded-none">
                      <TrendUp size={20} weight="fill" />
                  </div>
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white">
                    <span className="text-xl text-slate-400 mr-1">Rs.</span>
                    {stats.todayTotal.toLocaleString()}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Daily Report</p>
              </div>
          </div>

          {/* Recurring Templates - Emerald */}
          <div className="bg-white dark:bg-slate-800 p-6 border-2 border-emerald-600 shadow-sm flex flex-col justify-between h-36 relative transition-all">
              <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Recurring Items</span>
                  <div className="p-2 bg-emerald-600 text-white rounded-none">
                      <ArrowsClockwise size={20} weight="bold" />
                  </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{fixedExpenses.length}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Fixed Templates</p>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-xl flex flex-col min-h-[600px]">
          
          {/* Header */}
          <div className="p-6 border-b-2 border-slate-300 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {view === 'log' ? 'Daily Expense Log' : 'Fixed / Recurring Templates'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {view === 'log' ? 'Transaction History' : 'Automated Entry Tools'}
                  </p>
              </div>

              {view === 'log' && (
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 group">
                        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e3a8a]" size={18} weight="bold" />
                        <input 
                            type="text" 
                            placeholder="SEARCH..." 
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-[#1e3a8a] rounded-none font-bold text-slate-700 dark:text-slate-200 outline-none transition-all text-xs placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => {
                            if (!canAdd(sectionId)) {
                                alert("You don't have permission to add expenses.");
                                return;
                            }
                            setShowAddModal(true);
                        }} 
                        className={primaryBtnStyle + " py-3 text-xs"}
                    >
                        <Plus size={16} weight="bold" /> ADD NEW
                    </button>
                  </div>
              )}

              {view === 'recurring' && (
                   <button 
                      onClick={() => {
                          if (!canAdd(sectionId)) {
                              alert("You don't have permission to create templates.");
                              return;
                          }
                          setShowFixedModal(true);
                      }} 
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-none font-black text-xs uppercase tracking-widest hover:bg-emerald-700 active:translate-y-0.5 transition-all shadow-sm"
                  >
                      <CalendarPlus size={16} weight="bold" /> Create Template
                  </button>
              )}
          </div>

          {/* Content View */}
          <div className="flex-1 bg-white dark:bg-slate-800">
              
              {/* VIEW 1: EXPENSE LOG (Sharp Table) */}
              {view === 'log' && (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-[#1e3a8a] text-white border-b-2 border-slate-900">
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700">Expense Details</th>
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700 w-40">Category</th>
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700 w-40">Date</th>
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700 text-right w-40">Amount</th>
                                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center w-24">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-slate-100">
                              {filteredExpenses.map((exp, index) => (
                                  <tr key={exp.id} className={`group hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/30'}`}>
                                      <td className="p-4 border-r border-slate-200 dark:border-slate-700">
                                          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase">{exp.title}</p>
                                          {exp.notes && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 font-bold">{exp.notes}</p>}
                                      </td>
                                      <td className="p-4 border-r border-slate-200 dark:border-slate-700">
                                          <span className="px-2 py-1 bg-slate-200 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider border border-slate-300">
                                              {exp.category}
                                          </span>
                                      </td>
                                      <td className="p-4 border-r border-slate-200 dark:border-slate-700">
                                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                                              <CalendarBlank size={14} className="text-slate-400" weight="bold" />
                                              {new Date(exp.date).toLocaleDateString()}
                                          </div>
                                      </td>
                                      <td className="p-4 text-right border-r border-slate-200 dark:border-slate-700">
                                          <span className="font-black text-rose-600 text-sm font-mono">Rs. {exp.amount.toLocaleString()}</span>
                                      </td>
                                      <td className="p-4 text-center">
                                          {canDelete(sectionId) && (
                                              <button onClick={() => handleDelete(exp.id!)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all rounded-none">
                                                  <Trash size={16} weight="bold" />
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {filteredExpenses.length === 0 && (
                          <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center border-t-2 border-slate-200 dark:border-slate-700">
                              <Bank size={48} weight="duotone" className="mb-4 opacity-30" />
                              <p className="font-black text-xs uppercase tracking-widest">No expenses found.</p>
                          </div>
                      )}
                  </div>
              )}

              {/* VIEW 2: RECURRING EXPENSES (Sharp Cards) */}
              {view === 'recurring' && (
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {fixedExpenses.length > 0 ? fixedExpenses.map(item => (
                          <div key={item.id} className="bg-white dark:bg-slate-800 p-6 border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-emerald-500 transition-all group relative">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-2 bg-emerald-100 text-emerald-700 border border-emerald-200">
                                      <ArrowsClockwise size={20} weight="bold"/>
                                  </div>
                                  {canDelete(sectionId) && (
                                      <button onClick={() => handleDeleteFixedTemplate(item.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                                          <Trash size={16} weight="bold"/>
                                      </button>
                                  )}
                              </div>
                              <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{item.category}</p>
                              
                              <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-slate-100 dark:border-slate-800">
                                  <span className="font-black text-xl text-slate-900 dark:text-white font-mono">Rs. {item.amount.toLocaleString()}</span>
                                  <button 
                                      onClick={() => handlePostFixedExpense(item)}
                                      className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 active:translate-y-0.5 rounded-none"
                                  >
                                      <Lightning size={12} weight="fill"/> Post Now
                                  </button>
                              </div>
                          </div>
                      )) : (
                          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 flex items-center justify-center mb-4">
                                  <CalendarPlus size={32} className="text-slate-300" weight="duotone"/>
                              </div>
                              <h3 className="text-lg font-black text-slate-500 dark:text-slate-400 uppercase">No Recurring Templates</h3>
                              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide max-w-xs">
                                  Add fixed expenses like Salaries, Rent, or Bills.
                              </p>
                              <button onClick={() => setShowFixedModal(true)} className="mt-6 px-6 py-3 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all rounded-none">
                                  Create First Template
                              </button>
                          </div>
                      )}
                  </div>
              )}

          </div>
      </div>

      {/* --- ADD EXPENSE MODAL (SHARP) --- */}
      {showAddModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-none border-4 border-slate-800 p-0 relative z-10 animate-in zoom-in-95 shadow-2xl flex flex-col">
                  <div className="bg-slate-800 text-white p-6 flex justify-between items-center border-b-4 border-black">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Record Expense</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Financial Entry</p>
                      </div>
                      <button onClick={() => setShowAddModal(false)} className="p-2 bg-slate-700 hover:bg-slate-600 transition-colors"><X size={20} weight="bold"/></button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div>
                          <label className={labelStyle}>Expense Title</label>
                          <input type="text" placeholder="E.G. OFFICE STATIONERY" className={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className={labelStyle}>Amount (PKR)</label>
                              <div className="relative">
                                <CurrencyDollar size={16} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="number" placeholder="0" className={inputStyle + " pl-10"} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                              </div>
                          </div>
                          <div>
                              <label className={labelStyle}>Date</label>
                              <input type="date" className={inputStyle} value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                          </div>
                      </div>

                      <div>
                          <label className={labelStyle}>Category</label>
                          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputStyle}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className={labelStyle}>Notes (Optional)</label>
                          <textarea className={inputStyle + " h-24 resize-none"} placeholder="ADDITIONAL DETAILS..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                      </div>
                  </div>

                  <div className="p-6 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                        <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-300 text-slate-500 dark:text-slate-400 rounded-none font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="flex-[2] py-4 bg-[#1e3a8a] text-white rounded-none font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[#172554] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Spinner className="animate-spin" size={18} weight="bold"/> : <CheckCircle size={18} weight="fill"/>} 
                            Save Entry
                        </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- RECURRING TEMPLATE MODAL (SHARP) --- */}
      {showFixedModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowFixedModal(false)}></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-none border-4 border-slate-800 p-0 relative z-10 animate-in zoom-in-95 shadow-2xl flex flex-col">
                  <div className="bg-emerald-800 text-white p-6 flex justify-between items-center border-b-4 border-emerald-950">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Recurring Item</h3>
                        <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mt-1">Create Template</p>
                      </div>
                      <button onClick={() => setShowFixedModal(false)} className="p-2 bg-emerald-700 hover:bg-emerald-600 transition-colors"><X size={20} weight="bold"/></button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div>
                          <label className={labelStyle}>Template Name</label>
                          <input type="text" placeholder="E.G. STAFF SALARIES" className={inputStyle} value={fixedForm.title} onChange={e => setFixedForm({...fixedForm, title: e.target.value})} />
                      </div>
                      <div>
                          <label className={labelStyle}>Default Amount</label>
                          <input type="number" placeholder="0" className={inputStyle} value={fixedForm.amount} onChange={e => setFixedForm({...fixedForm, amount: e.target.value})} />
                      </div>
                      <div>
                          <label className={labelStyle}>Category</label>
                          <select value={fixedForm.category} onChange={e => setFixedForm({...fixedForm, category: e.target.value})} className={inputStyle}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="p-6 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                      <button onClick={() => setShowFixedModal(false)} className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-300 text-slate-500 dark:text-slate-400 rounded-none font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                          Cancel
                      </button>
                      <button 
                          onClick={handleSaveFixedTemplate} 
                          className="flex-[2] py-4 bg-emerald-600 text-white rounded-none font-black text-xs uppercase tracking-widest shadow-sm hover:bg-emerald-700 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                      >
                          <ArrowsClockwise size={18} weight="bold"/> Save Template
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ExpenseManagement;
