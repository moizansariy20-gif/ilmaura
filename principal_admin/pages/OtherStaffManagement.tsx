
import React, { useState } from 'react';
import { 
  UserList, MagnifyingGlass, Plus, PencilSimple, Trash, IdentificationCard, 
  Phone, Envelope, UsersThree, CheckCircle, Clock, ListChecks, Funnel, 
  Printer, UserPlus, CircleNotch, ShieldCheck, CaretDown 
} from 'phosphor-react';
import * as XLSX from 'xlsx';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  joiningDate: string;
  status: 'Active' | 'On Leave' | 'Resigned';
}

interface OtherStaffManagementProps {
  schoolId: string;
  view: 'directory' | 'add';
}

const OtherStaffManagement: React.FC<OtherStaffManagementProps> = ({ schoolId, view }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  
  // Dummy Data
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 'S-001', name: 'Ahmed Khan', role: 'Accountant', phone: '0300-1234567', email: 'ahmed@example.com', joiningDate: '2023-01-15', status: 'Active' },
    { id: 'S-002', name: 'Sajid Ali', role: 'Security Guard', phone: '0321-7654321', email: 'sajid@example.com', joiningDate: '2022-05-10', status: 'Active' },
    { id: 'S-003', name: 'Maria Bibi', role: 'Cleaner', phone: '0311-1112223', email: 'maria@example.com', joiningDate: '2023-03-20', status: 'Active' },
    { id: 'S-004', name: 'Zahid Hussain', role: 'Driver', phone: '0345-9998887', email: 'zahid@example.com', joiningDate: '2021-11-05', status: 'On Leave' },
  ]);

  // Form State
  const [form, setForm] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    joiningDate: '',
    status: 'Active'
  });
  const [isSaving, setIsSaving] = useState(false);

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'active' ? s.status === 'Active' : s.status !== 'Active';
    return matchesSearch && matchesTab;
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      const newStaff: StaffMember = {
        id: `S-00${staff.length + 1}`,
        ...form,
        status: form.status as any
      };
      setStaff([...staff, newStaff]);
      setIsSaving(false);
      alert("Staff member added successfully!");
      setForm({ name: '', role: '', phone: '', email: '', joiningDate: '', status: 'Active' });
    }, 1000);
  };

  if (view === 'add') {
    return (
      <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm">
          <div className="bg-[#1e3a8a] text-white p-6 border-b-4 border-slate-900 flex justify-between items-center">
             <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">Add New Staff</h1>
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mt-1">Onboard Non-Teaching Personnel</p>
             </div>
             <div className="p-3 bg-white/10 dark:bg-slate-800/10 rounded-none border-2 border-white/20">
                <UserPlus size={24} weight="fill" />
             </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] focus:bg-white dark:bg-slate-800 transition-all rounded-none text-sm uppercase placeholder-slate-400"
                  placeholder="ENTER FULL NAME"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Role / Designation</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] focus:bg-white dark:bg-slate-800 transition-all rounded-none text-sm uppercase"
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}
                >
                  <option value="">Select Role</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Admin Staff">Admin Staff</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Driver">Driver</option>
                  <option value="Peon">Peon</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] focus:bg-white dark:bg-slate-800 transition-all rounded-none text-sm uppercase placeholder-slate-400"
                  placeholder="03XX-XXXXXXX"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] focus:bg-white dark:bg-slate-800 transition-all rounded-none text-sm uppercase placeholder-slate-400"
                  placeholder="EMAIL (OPTIONAL)"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Joining Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] focus:bg-white dark:bg-slate-800 transition-all rounded-none text-sm uppercase"
                  value={form.joiningDate}
                  onChange={e => setForm({...form, joiningDate: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Status</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] focus:bg-white dark:bg-slate-800 transition-all rounded-none text-sm uppercase"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving || !form.name || !form.role}
              className="w-full py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[#172554] transition-all disabled:opacity-50 mt-8 flex items-center justify-center gap-2 rounded-none border-2 border-slate-900"
            >
                {isSaving ? <CircleNotch className="animate-spin" size={18}/> : <ShieldCheck size={18} weight="fill"/>} 
                Add Staff Member
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Other Staff Management</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                Non-Teaching Staff
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Department Status</p>
                  <p className="text-sm font-bold">Operational</p>
               </div>
               <div className="w-10 h-10 border-2 border-white/20 flex items-center justify-center bg-white/10 dark:bg-slate-800/10 text-white rounded-none">
                  <UserList size={20} weight="fill"/>
               </div>
            </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-8">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 border-2 border-blue-900 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                  <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Total Staff</span>
                      <div className="p-2 bg-blue-900 text-white rounded-none"><UsersThree size={20} weight="fill"/></div>
                  </div>
                  <div><h3 className="text-4xl font-black text-slate-900 dark:text-white">{staff.length}</h3></div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 border-2 border-emerald-600 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                  <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Active</span>
                      <div className="p-2 bg-emerald-600 text-white rounded-none"><CheckCircle size={20} weight="fill"/></div>
                  </div>
                  <div><h3 className="text-4xl font-black text-slate-900 dark:text-white">{staff.filter(s => s.status === 'Active').length}</h3></div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 border-2 border-amber-500 shadow-sm flex flex-col justify-between h-32 relative transition-all">
                  <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-amber-600 uppercase tracking-widest">On Leave / Inactive</span>
                      <div className="p-2 bg-amber-500 text-white rounded-none"><Clock size={20} weight="fill"/></div>
                  </div>
                  <div><h3 className="text-4xl font-black text-slate-900 dark:text-white">{staff.filter(s => s.status !== 'Active').length}</h3></div>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border-2 border-[#1e3a8a] shadow-sm overflow-hidden flex flex-col mt-6">
            <div className="px-6 py-4 bg-[#1e3a8a] border-b-2 border-[#1e3a8a] flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                <ListChecks size={18} weight="fill"/> Staff Roster
              </h3>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="bg-white dark:bg-slate-800 p-1 flex items-center w-full md:w-48">
                    <select 
                        value={activeTab} 
                        onChange={(e) => setActiveTab(e.target.value as 'active' | 'inactive')} 
                        className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest"
                    >
                        <option value="active">Active Staff</option>
                        <option value="inactive">Inactive / Leave</option>
                    </select>
                    <Funnel size={14} weight="fill" className="text-slate-400 mr-2"/>
                </div>

                <div className="bg-white dark:bg-slate-800 p-1 flex items-center w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="SEARCH STAFF..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest placeholder-slate-400"
                    />
                    <MagnifyingGlass size={14} weight="bold" className="text-slate-400 mr-2"/>
                </div>

                <button 
                    onClick={() => {
                        const data = filteredStaff.map(s => ({
                            'Name': s.name,
                            'Role': s.role,
                            'Phone': s.phone,
                            'Email': s.email,
                            'Status': s.status
                        }));
                        const ws = XLSX.utils.json_to_sheet(data);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Other_Staff");
                        XLSX.writeFile(wb, `Other_Staff_${new Date().toISOString().split('T')[0]}.xlsx`);
                    }} 
                    className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-4 py-2 font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border border-[#1e3a8a]/20"
                >
                    <Printer size={16} weight="fill"/> Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Staff Info</th>
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Role</th>
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Contact Details</th>
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Joining Date</th>
                    <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Status</th>
                    <th className="px-4 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1e3a8a] text-white flex items-center justify-center border-2 border-slate-900 shrink-0 shadow-sm">
                            <IdentificationCard size={20} weight="bold" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{member.name}</p>
                            <p className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest">{member.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        <span className="text-[10px] font-black text-[#1e3a8a] bg-blue-50 px-2 py-1 border border-blue-100 uppercase tracking-tighter">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            <Phone size={12} weight="bold" className="text-[#1e3a8a]" /> {member.phone}
                          </div>
                          {member.email && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              <Envelope size={12} weight="bold" className="text-[#1e3a8a]" /> {member.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                        {member.joiningDate}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black text-white px-2 py-1 uppercase shadow-sm ${
                          member.status === 'Active' ? 'bg-emerald-600' : 
                          member.status === 'On Leave' ? 'bg-amber-600' : 
                          'bg-rose-600'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] hover:text-[#1e3a8a] text-slate-400 transition-all shadow-sm" title="Edit">
                            <PencilSimple size={14} weight="bold" />
                          </button>
                          <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-500 text-slate-400 transition-all shadow-sm" title="Delete">
                            <Trash size={14} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-4 py-20 text-center">
                            <UsersThree size={48} weight="duotone" className="mx-auto mb-2 opacity-30 text-slate-400"/>
                            <p className="font-black text-sm uppercase tracking-widest text-slate-400">No staff records found</p>
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredStaff.length} Personnel Records</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherStaffManagement;
