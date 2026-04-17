
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  ShieldCheck, 
  Eye, 
  Plus, 
  PencilSimple, 
  Trash, 
  Check, 
  X,
  Users,
  IdentificationBadge,
  Lock,
  FloppyDisk,
  WarningCircle,
  MagnifyingGlass,
  CircleNotch
} from 'phosphor-react';
import { subscribeToStaff, updateStaffPermissions, deleteStaffUser, logActivity } from '../../services/api.ts';
import { UserProfile, StaffPermission } from '../../types.ts';
import Loader from '../../components/Loader.tsx';

interface StaffAccessPageProps {
  schoolId: string;
  principalProfile: UserProfile;
}

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'students', label: 'Student Management' },
  { id: 'teachers', label: 'Teacher Management' },
  { id: 'fees', label: 'Fee Management' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'classes', label: 'Class & Subjects' },
  { id: 'timetable', label: 'Timetable' },
  { id: 'expenses', label: 'Expense Management' },
  { id: 'enquiries', label: 'Enquiry/Leads' },
  { id: 'notices', label: 'Notices & Announcements' },
  { id: 'documents', label: 'Document Vault' },
  { id: 'activity_log', label: 'Activity History' },
  { id: 'cctv', label: 'CCTV Cameras' },
];

const DEFAULT_PERMISSION: StaffPermission = { view: true, add: false, edit: false, delete: false };

const StaffAccessPage: React.FC<StaffAccessPageProps> = ({ schoolId, principalProfile }) => {
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [designation, setDesignation] = useState('');
  const [permissions, setPermissions] = useState<Record<string, StaffPermission>>({});

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToStaff(schoolId, (data) => {
      setStaff(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, [schoolId]);

  const handleSelectStaff = (member: UserProfile) => {
    setSelectedStaff(member);
    setDesignation(member.designation || '');
    
    // Initialize permissions with defaults for missing sections
    const initialPermissions: Record<string, StaffPermission> = {};
    SECTIONS.forEach(section => {
      initialPermissions[section.id] = member.staffPermissions?.[section.id] || { ...DEFAULT_PERMISSION };
    });
    setPermissions(initialPermissions);
    setIsEditing(false);
  };

  const handleTogglePermission = (sectionId: string, type: keyof StaffPermission) => {
    if (!isEditing) return;
    
    setPermissions(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [type]: !prev[sectionId][type]
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedStaff) return;
    
    try {
      await updateStaffPermissions(selectedStaff.uid, permissions, designation);
      
      await logActivity({
        schoolId,
        userId: principalProfile.uid,
        userName: principalProfile.name,
        userRole: 'Principal',
        action: 'Update Staff Permissions',
        details: `Updated permissions for ${selectedStaff.name} (${designation})`,
        category: 'System'
      });
      
      setIsEditing(false);
      alert("Permissions updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update permissions.");
    }
  };

  const handleDelete = async (uid: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove access for ${name}?`)) return;
    
    try {
      await deleteStaffUser(uid);
      
      await logActivity({
        schoolId,
        userId: principalProfile.uid,
        userName: principalProfile.name,
        userRole: 'Principal',
        action: 'Remove Staff Access',
        details: `Removed staff access for ${name}`,
        category: 'System'
      });
      
      setSelectedStaff(null);
      alert("Staff access removed.");
    } catch (err) {
      console.error(err);
      alert("Failed to remove staff access.");
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
              <ShieldCheck size={32} weight="fill" className="text-white" />
              User & Role Management
            </h1>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-wide mt-1">Control staff access levels and permissions</p>
          </div>
          
          <div className="mt-4 md:mt-0">
             <div className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-slate-900 flex items-center gap-2">
                <Users size={18} weight="bold" />
                Staff Access Control
             </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1">
          
          {/* --- LEFT SIDEBAR: STAFF LIST --- */}
          <div className="w-full lg:w-80 border-r-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col">
            <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700">
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="SEARCH STAFF..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 dark:border-slate-700 focus:border-[#1e3a8a] outline-none font-bold text-[10px] uppercase tracking-widest"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-4">
                  <CircleNotch size={32} className="animate-spin text-[#1e3a8a]" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Staff...</p>
                </div>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map(member => (
                  <button 
                    key={member.uid}
                    onClick={() => handleSelectStaff(member)}
                    className={`w-full text-left p-4 border-b border-slate-200 transition-colors flex items-center gap-3 ${selectedStaff?.uid === member.uid ? 'bg-white dark:bg-slate-800 border-l-4 border-l-[#1e3a8a]' : 'hover:bg-slate-100'}`}
                  >
                    <div className="w-10 h-10 bg-slate-200 flex items-center justify-center text-slate-600 dark:text-slate-300 border-2 border-slate-300">
                      <IdentificationBadge size={20} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{member.name}</p>
                      <p className="text-[9px] font-bold text-[#1e3a8a] uppercase tracking-wider">{member.designation || 'No Designation'}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No staff users found</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Create staff accounts to manage access</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
               <div className="p-3 bg-blue-50 border-2 border-blue-100 rounded text-[9px] font-bold text-blue-700 leading-relaxed">
                  <WarningCircle size={14} className="inline mr-1 mb-0.5" />
                  Note: Staff accounts are created by Mother Admin. Principal can only manage their permissions here.
               </div>
            </div>
          </div>

          {/* --- RIGHT CONTENT: PERMISSIONS EDITOR --- */}
          <div className="flex-1 bg-white dark:bg-slate-800 flex flex-col">
            {selectedStaff ? (
              <>
                {/* STAFF HEADER */}
                <div className="p-6 border-b-2 border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-slate-200 dark:border-slate-700">
                      <Users size={32} weight="bold" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedStaff.name}</h2>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{selectedStaff.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {isEditing ? (
                          <input 
                            type="text"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="ENTER DESIGNATION (e.g. Accountant)"
                            className="px-3 py-1 border-2 border-[#1e3a8a] outline-none text-[10px] font-black uppercase tracking-widest w-64"
                          />
                        ) : (
                          <span className="bg-blue-50 text-[#1e3a8a] px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-blue-200">
                            {selectedStaff.designation || 'NOT ASSIGNED'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2"
                        >
                          <X size={16} weight="bold" /> Cancel
                        </button>
                        <button 
                          onClick={handleSave}
                          className="px-6 py-2 bg-[#1e3a8a] text-white text-xs font-black uppercase tracking-widest hover:bg-[#172554] flex items-center gap-2 shadow-lg"
                        >
                          <FloppyDisk size={16} weight="bold" /> Save Changes
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleDelete(selectedStaff.uid, selectedStaff.name)}
                          className="px-4 py-2 border-2 border-rose-200 text-rose-600 text-xs font-black uppercase tracking-widest hover:bg-rose-50 flex items-center gap-2"
                        >
                          <Trash size={16} weight="bold" /> Remove Access
                        </button>
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="px-6 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black flex items-center gap-2"
                        >
                          <PencilSimple size={16} weight="bold" /> Edit Permissions
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* PERMISSIONS GRID */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Lock size={20} weight="fill" className="text-slate-400" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Access Control Matrix</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {SECTIONS.map(section => (
                      <div key={section.id} className={`border-2 p-4 transition-all ${isEditing ? 'border-slate-200 hover:border-[#1e3a8a]' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{section.label}</span>
                          <div className={`w-2 h-2 rounded-full ${permissions[section.id]?.view ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <PermissionToggle 
                            label="View" 
                            active={permissions[section.id]?.view} 
                            onClick={() => handleTogglePermission(section.id, 'view')}
                            isEditing={isEditing}
                            icon={<Eye size={12} />}
                          />
                          <PermissionToggle 
                            label="Add" 
                            active={permissions[section.id]?.add} 
                            onClick={() => handleTogglePermission(section.id, 'add')}
                            isEditing={isEditing}
                            icon={<Plus size={12} />}
                          />
                          <PermissionToggle 
                            label="Edit" 
                            active={permissions[section.id]?.edit} 
                            onClick={() => handleTogglePermission(section.id, 'edit')}
                            isEditing={isEditing}
                            icon={<PencilSimple size={12} />}
                          />
                          <PermissionToggle 
                            label="Delete" 
                            active={permissions[section.id]?.delete} 
                            onClick={() => handleTogglePermission(section.id, 'delete')}
                            isEditing={isEditing}
                            icon={<Trash size={12} />}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-800/50/50">
                <div className="w-24 h-24 bg-white dark:bg-slate-800 border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-200 mb-6">
                  <ShieldCheck size={48} />
                </div>
                <h2 className="text-xl font-black text-slate-300 uppercase tracking-widest">Select a staff member</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest max-w-xs leading-relaxed">
                  Choose a user from the sidebar to manage their portal access and permissions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PermissionToggleProps {
  label: string;
  active: boolean;
  onClick: () => void;
  isEditing: boolean;
  icon: React.ReactNode;
}

const PermissionToggle: React.FC<PermissionToggleProps> = ({ label, active, onClick, isEditing, icon }) => {
  return (
    <button 
      onClick={onClick}
      disabled={!isEditing}
      className={`flex items-center justify-between px-3 py-2 border-2 text-[9px] font-black uppercase tracking-widest transition-all ${
        active 
          ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white' 
          : 'bg-white border-slate-200 text-slate-400'
      } ${isEditing ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default opacity-80'}`}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      {active ? <Check size={10} weight="bold" /> : <X size={10} weight="bold" />}
    </button>
  );
};

export default StaffAccessPage;
