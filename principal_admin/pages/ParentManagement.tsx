import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, MagnifyingGlass, Plus, PencilSimple, Trash, 
  Phone, IdentificationCard, HouseLine, CaretRight, X, Check, CircleNotch,
  WarningCircle, Student as StudentIcon, CaretDown, Sparkle, ListChecks,
  Gear, FloppyDisk
} from 'phosphor-react';
import { 
  Users as LUsers, 
  Sparkles as LSparkles, 
  Clock as LClock, 
  Check as LCheck, 
  X as LX,
  Coffee as LCoffee,
  UserX as LUserX,
  Search as LSearch,
  Plus as LPlus,
  Pencil as LPencil,
  Trash2 as LTrash,
  Phone as LPhone,
  CreditCard as LCard,
  MapPin as LMap,
  Briefcase as LBriefcase,
  GraduationCap as LStudent,
  Settings as LSettings,
  ChevronRight as LChevronRight,
  ArrowLeft as LArrowLeft
} from 'lucide-react';
import { Parent, Student, School, UserProfile, BUILTIN_ADMISSION_CONFIG } from '../../types';
import { subscribeToParents, addParent, updateParent, deleteParent, subscribeToStudents, updateStudent, updateSchoolBranding } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import Loader from '../../components/Loader';

interface ParentManagementProps {
  profile: UserProfile;
  schoolId: string;
  school: School;
  classes: any[];
  initialShowConfig?: boolean;
  onNavigate?: (tab: string) => void;
}

const ParentManagement: React.FC<ParentManagementProps> = ({ profile, schoolId, school, classes, initialShowConfig = false, onNavigate }) => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [formData, setFormData] = useState({
    fatherName: '',
    cnic: '',
    phone: '',
    email: '',
    address: '',
    occupation: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Smart Link State
  const [showSmartLinkModal, setShowSmartLinkModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(['fatherName', 'cnic', 'phone']);
  const [isLinking, setIsLinking] = useState(false);
  const [linkProgress, setLinkProgress] = useState(0);
  const [linkStatus, setLinkStatus] = useState('');

  // Dynamic Columns & Matching State
  const matchingFields = useMemo(() => school.parentMatchingFields || ['fatherName', 'cnic', 'phone'], [school.parentMatchingFields]);
  const [tempMatchingFields, setTempMatchingFields] = useState<string[]>([]);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [showConfig, setShowConfig] = useState(initialShowConfig);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [parentToDelete, setParentToDelete] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      window.history.back();
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (initialShowConfig) {
      setShowConfig(true);
    }
  }, [initialShowConfig]);

  useEffect(() => {
    if (showConfig) {
      setTempMatchingFields(matchingFields);
    }
  }, [showConfig, matchingFields]);

  const allAvailableFields = useMemo(() => {
    const config = school.admissionFormConfig || BUILTIN_ADMISSION_CONFIG;
    return config.filter(f => f.enabled).map(f => ({ id: f.id, label: f.label }));
  }, [school.admissionFormConfig]);

  const visibleColumns = useMemo(() => {
    return [...matchingFields, 'children'];
  }, [matchingFields]);

  const { canAdd, canEdit, canDelete } = usePermissions(profile);
  const sectionId = 'students'; // Reuse student permissions for now

  const getClassName = (id: string) => {
    const cls = classes.find(c => (c as any).id === id);
    if (!cls) return 'N/A';
    return (cls as any).section ? `${(cls as any).name} (${(cls as any).section})` : (cls as any).name;
  };

  useEffect(() => {
    const unsubParents = subscribeToParents(schoolId, (data) => {
      setParents(data);
      setLoading(false);
    });
    const unsubStudents = subscribeToStudents(schoolId, (data) => {
        setStudents(data);
    });
    return () => {
      unsubParents();
      unsubStudents();
    };
  }, [schoolId]);

  const [processedParents, setProcessedParents] = useState<(Parent & { isVirtual?: boolean, linkedStudents: Student[] })[]>([]);

  useEffect(() => {
    // 1. Start with Real Parents
    const parentMap = new Map<string, Parent & { isVirtual?: boolean, linkedStudents: Student[] }>();
    
    parents.forEach(p => {
        parentMap.set(p.id, { ...p, linkedStudents: [] });
    });

    // 2. Process Students
    const unlinkedStudents: Student[] = [];

    students.forEach(s => {
        if (s.parentId && parentMap.has(s.parentId)) {
            parentMap.get(s.parentId)!.linkedStudents.push(s);
        } else {
            unlinkedStudents.push(s);
        }
    });

    // 3. Group Unlinked Students to form Virtual Parents based on school.parentMatchingFields
    unlinkedStudents.forEach(s => {
        // Try to find a match in Real Parents first based on matching fields
        let matchedParentId: string | undefined;
        
        for (const [pid, p] of parentMap.entries()) {
            if (!p.isVirtual) { 
                const isMatch = matchingFields.every(fieldId => {
                    // Map common IDs to student record fields
                    let actualFieldId = fieldId;
                    if (fieldId === 'guardianName') actualFieldId = 'fatherName';
                    if (fieldId === 'guardianPhone') actualFieldId = 'phone';
                    if (fieldId === 'guardianEmail') actualFieldId = 'email';

                    const sVal = (s as any)[actualFieldId] || (s.customData?.[fieldId]);
                    const pVal = (p as any)[actualFieldId];
                    if (!sVal || !pVal) return false;
                    return String(sVal).toLowerCase().trim() === String(pVal).toLowerCase().trim();
                });
                if (isMatch) {
                    matchedParentId = pid;
                    break;
                }
            }
        }

        if (matchedParentId) {
            parentMap.get(matchedParentId)!.linkedStudents.push(s);
        } else {
            // Create or find Virtual Parent based on matching fields
            const keyParts = matchingFields.map(fieldId => {
                let actualFieldId = fieldId;
                if (fieldId === 'guardianName') actualFieldId = 'fatherName';
                if (fieldId === 'guardianPhone') actualFieldId = 'phone';
                if (fieldId === 'guardianEmail') actualFieldId = 'email';

                const val = (s as any)[actualFieldId] || (s.customData?.[fieldId]);
                return val ? String(val).toLowerCase().trim() : 'null';
            });

            // If all matching fields are null, we can't group them reliably, so treat as individual
            const key = keyParts.every(p => p === 'null') ? `unknown:${s.id}` : `group:${keyParts.join('|')}`;
            const virtualId = `temp_${key}`;
            
            if (!parentMap.has(virtualId)) {
                const virtualParent: any = {
                    id: virtualId,
                    schoolId: schoolId,
                    childrenIds: [],
                    isVirtual: true,
                    linkedStudents: []
                };
                // Populate virtual parent with matching field values from the first student
                matchingFields.forEach(fieldId => {
                    let actualFieldId = fieldId;
                    if (fieldId === 'guardianName') actualFieldId = 'fatherName';
                    if (fieldId === 'guardianPhone') actualFieldId = 'phone';
                    if (fieldId === 'guardianEmail') actualFieldId = 'email';

                    virtualParent[actualFieldId] = (s as any)[actualFieldId] || (s.customData?.[fieldId]) || '';
                });
                // Fallback for fatherName if not in matching fields but exists in student
                if (!virtualParent.fatherName && s.fatherName) virtualParent.fatherName = s.fatherName;

                parentMap.set(virtualId, virtualParent);
            }
            parentMap.get(virtualId)!.linkedStudents.push(s);
        }
    });

    // 4. Filter out Real Parents with zero students (Orphaned)
    const finalParents = Array.from(parentMap.values()).filter(p => p.linkedStudents.length > 0);

    setProcessedParents(finalParents);

  }, [parents, students, matchingFields]);

  const filteredParents = processedParents.filter(p => 
    p.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cnic.includes(searchTerm) ||
    p.phone.includes(searchTerm)
  );

  const handleSave = async () => {
    if (!formData.fatherName || !formData.cnic || !formData.phone) {
      alert("Name, CNIC and Phone are required.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingParent) {
        if (editingParent.id.startsWith('temp_')) {
            // CONVERT VIRTUAL TO REAL
            const newParent = await addParent(schoolId, formData);
            
            // Link the students that were grouped under this virtual parent
            // We need to find them again or use the ones we stored in state if we trust it
            // Better to rely on the 'linkedStudents' property we added to the editingParent object
            const studentsToLink = (editingParent as any).linkedStudents || [];
            
            for (const s of studentsToLink) {
                await updateStudent(schoolId, s.id, { parentId: newParent.id });
            }
        } else {
            // UPDATE REAL
            await updateParent(schoolId, editingParent.id, formData);
        }
      } else {
        // CREATE NEW
        await addParent(schoolId, formData);
      }
      setShowModal(false);
      setEditingParent(null);
      setFormData({ fatherName: '', cnic: '', phone: '', email: '', address: '', occupation: '' });
    } catch (error) {
      console.error(error);
      alert("Failed to save parent record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent);
    setFormData({
      fatherName: parent.fatherName,
      cnic: parent.cnic,
      phone: parent.phone,
      email: parent.email || '',
      address: parent.address || '',
      occupation: parent.occupation || ''
    });
    setShowModal(true);
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleUpdateMatchingFields = async (fields: string[]) => {
    setIsUpdatingConfig(true);
    try {
      await updateSchoolBranding(schoolId, { parentMatchingFields: fields });
      setShowConfig(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update configuration.");
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const handleDelete = async () => {
    if (!parentToDelete) return;
    
    // Optimistic Update
    const originalParents = [...processedParents];
    setProcessedParents(prev => prev.filter(p => p.id !== parentToDelete));
    setShowDeleteConfirmModal(false);

    try {
      await deleteParent(schoolId, parentToDelete);
      setParentToDelete(null);
    } catch (error) {
      // Rollback
      setProcessedParents(originalParents);
      alert("Failed to delete parent.");
    }
  };

  const [visibleCount, setVisibleCount] = useState(20);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  const totalParents = processedParents.length;
  const totalLinked = processedParents.filter(p => !p.isVirtual).length;
  const totalUnlinked = processedParents.filter(p => p.isVirtual).length;
  const totalStudentsLinked = processedParents.reduce((acc, p) => acc + p.linkedStudents.length, 0);

  if (isMobile) {
    return (
      <div className="bg-[#FCFBF8] dark:bg-slate-900 min-h-screen pb-32 font-sans">
        {/* Premium Mobile Header */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-[#1e3a8a]/10 dark:bg-white/10 flex items-center justify-center text-[#1e3a8a] dark:text-white border border-[#1e3a8a]/20 active:scale-90 transition-transform"
            >
              <LArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-[#1e3a8a] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(30,58,138,0.1)' }}>
                Parents
              </h1>
              <div className="flex flex-col mt-1">
                <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Principal App • Parent Directory</p>
              </div>
            </div>
            <div className="flex p-1.5 bg-gradient-to-br from-[#1e3a8a] to-[#172554] shadow-[0_10px_25px_-5px_rgba(30,58,138,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-slate-800/10 flex items-center justify-center relative z-10">
                {profile.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FCFBF8] to-white">
                    <LSparkles size={28} className="text-[#1e3a8a] dark:text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full border-2 border-[#1e3a8a] flex items-center justify-center shadow-lg">
                <LSettings size={10} className="text-[#1e3a8a] dark:text-white" />
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH PARENTS..."
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full p-4 pl-12 bg-[#FCFBF8] dark:bg-slate-900 shadow-[inset_0_2px_8px_rgba(30,58,138,0.04)] border border-[#E5E0D8] dark:border-slate-700 rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all"
              />
              <LSearch size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        <div className="px-4 mt-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(30,58,138,0.05)] border border-[#E5E0D8] dark:border-slate-700 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                  <LUsers size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-3xl text-[#1e3a8a] dark:text-white leading-none drop-shadow-sm">{totalParents}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Total</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative z-10">
                  <LCheck size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-3xl text-emerald-600 leading-none drop-shadow-sm">{totalLinked}</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest mt-2">Linked</p>
                </div>
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                Parent Directory
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-24 rounded-3xl bg-white dark:bg-slate-800 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                  <CircleNotch size={48} className="animate-spin text-[#D4AF37] mx-auto mb-4" />
                  <p className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">Loading Parents...</p>
                </div>
              ) : filteredParents.length > 0 ? (
                filteredParents.slice(0, visibleCount).map(parent => {
                  const linkedStudents = (parent as any).linkedStudents || [];
                  const isVirtual = (parent as any).isVirtual;
                  
                  return (
                    <div key={parent.id} className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border ${isVirtual ? 'border-amber-200' : 'border-[#D4AF37]/20'} shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] flex flex-col gap-6 transition-all duration-300 relative overflow-hidden group`}>
                      <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${isVirtual ? 'from-amber-400 to-amber-600' : 'from-[#D4AF37] to-[#1e3a8a]'} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                      
                      <div className="flex items-center justify-between relative z-10 pl-3">
                        <div className="flex items-center gap-5">
                          <div className="relative shrink-0">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${isVirtual ? 'from-amber-100 to-amber-200 text-amber-600' : 'from-[#1e3a8a] to-[#172554] text-white'} flex items-center justify-center font-black text-2xl shrink-0 border-2 border-white dark:border-slate-700 shadow-lg`}>
                                {parent.fatherName[0]?.toUpperCase() || '?'}
                            </div>
                            {isVirtual && (
                              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                                UNLINKED
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-[#1e3a8a] dark:text-white text-xl leading-tight truncate tracking-tight">{parent.fatherName}</p>
                            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mt-1 flex items-center gap-1">
                              <LPhone size={10} /> {parent.phone}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 pl-3 relative z-10">
                        <div className="bg-[#FCFBF8] dark:bg-slate-900/50 p-3 rounded-2xl border border-[#E5E0D8] dark:border-slate-700">
                          <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">CNIC</p>
                          <p className="text-xs font-bold text-[#1e3a8a] dark:text-white truncate">{parent.cnic || 'N/A'}</p>
                        </div>
                        <div className="bg-[#FCFBF8] dark:bg-slate-900/50 p-3 rounded-2xl border border-[#E5E0D8] dark:border-slate-700">
                          <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Occupation</p>
                          <p className="text-xs font-bold text-[#1e3a8a] dark:text-white truncate">{parent.occupation || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Linked Students */}
                      <div className="pl-3 relative z-10">
                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <LStudent size={14} /> Linked Students ({linkedStudents.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {linkedStudents.length > 0 ? linkedStudents.map((s: Student) => (
                            <div key={s.id} className="flex items-center gap-2 bg-[#FCFBF8] dark:bg-slate-900 p-2 rounded-xl border border-[#E5E0D8] dark:border-slate-700 shadow-sm">
                              <div className="w-6 h-6 rounded-lg overflow-hidden border border-[#D4AF37]/30">
                                {s.photoURL ? (
                                  <img src={s.photoURL} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#1e3a8a] to-[#172554] flex items-center justify-center text-white text-[8px] font-black">
                                    {s.name[0]}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black text-[#1e3a8a] dark:text-white leading-none">{s.name}</p>
                                <p className="text-[8px] font-bold text-[#D4AF37] uppercase mt-0.5">{getClassName(s.classId)}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-[10px] text-slate-400 italic font-bold">No students linked</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-24 rounded-3xl text-[#D4AF37] bg-white dark:bg-slate-800 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FCFBF8] to-white dark:from-slate-700 dark:to-slate-800 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(30,58,138,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/20">
                    <LUsers size={36} className="text-[#D4AF37]" />
                  </div>
                  <p className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">No Parents Found</p>
                </div>
              )}
            </div>
            
            {filteredParents.length > visibleCount && (
              <button 
                onClick={handleLoadMore}
                className="w-full py-5 bg-white dark:bg-slate-800 border-2 border-[#D4AF37]/30 rounded-3xl text-[11px] font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
              >
                Load More Records
              </button>
            )}
          </div>
        </div>

        {/* Modals - Reusing existing logic but can be styled further if needed */}
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-lg border-4 border-[#1e3a8a] relative z-10 animate-in zoom-in-95 shadow-2xl rounded-3xl overflow-hidden">
                  <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white p-5 flex justify-between items-center border-b-4 border-[#D4AF37]/30">
                      <h3 className="text-lg font-black uppercase tracking-tight">{editingParent ? 'Edit Parent' : 'Add New Parent'}</h3>
                      <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                        <LX size={20} />
                      </button>
                  </div>
                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      <div>
                          <label className="text-[10px] font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest mb-1 block">Father Name *</label>
                          <input type="text" value={formData.fatherName || ''} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full p-4 bg-[#FCFBF8] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 rounded-xl font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"/>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                          <div>
                              <label className="text-[10px] font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest mb-1 block">CNIC *</label>
                              <input type="text" value={formData.cnic || ''} onChange={e => setFormData({...formData, cnic: e.target.value})} className="w-full p-4 bg-[#FCFBF8] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 rounded-xl font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]" placeholder="XXXXX-XXXXXXX-X"/>
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest mb-1 block">Phone *</label>
                              <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-[#FCFBF8] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 rounded-xl font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]" placeholder="03XX-XXXXXXX"/>
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest mb-1 block">Email (Optional)</label>
                          <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-[#FCFBF8] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"/>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest mb-1 block">Address</label>
                          <textarea value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-4 bg-[#FCFBF8] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 rounded-xl font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] h-24 resize-none"/>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-[#1e3a8a] dark:text-white uppercase tracking-widest mb-1 block">Occupation</label>
                          <input type="text" value={formData.occupation || ''} onChange={e => setFormData({...formData, occupation: e.target.value})} className="w-full p-4 bg-[#FCFBF8] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 rounded-xl font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"/>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-[#FCFBF8] dark:bg-slate-900 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl border border-[#E5E0D8] dark:border-slate-700">Cancel</button>
                          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2">
                              {isSaving ? <CircleNotch className="animate-spin" size={16}/> : <LCheck size={16} />} Save Record
                          </button>
                      </div>
                  </div>
              </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirmModal(false)}></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-md border-4 border-rose-600 relative z-10 animate-in zoom-in-95 shadow-2xl rounded-3xl overflow-hidden">
                  <div className="bg-rose-600 text-white p-5 flex items-center gap-3 border-b-4 border-black/10">
                      <WarningCircle size={24} weight="fill"/>
                      <h3 className="text-lg font-black uppercase tracking-tight">Confirm Deletion</h3>
                  </div>
                  <div className="p-6">
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6 uppercase tracking-tight leading-relaxed">
                        Are you sure you want to delete this parent record? This will unlink all students currently associated with this parent.
                      </p>
                      <div className="flex gap-3">
                          <button onClick={() => setShowDeleteConfirmModal(false)} className="flex-1 py-4 bg-[#FCFBF8] dark:bg-slate-900 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl border border-[#E5E0D8] dark:border-slate-700">Cancel</button>
                          <button onClick={handleDelete} className="flex-1 py-4 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-200">Delete Now</button>
                      </div>
                  </div>
              </div>
          </div>
        )}

        {/* Config Modal for Mobile */}
        {showConfig && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowConfig(false)}></div>
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg border-4 border-[#1e3a8a] relative z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl rounded-3xl overflow-hidden">
              <div className="bg-[#1e3a8a] text-white p-5 flex justify-between items-center border-b-4 border-[#D4AF37]/30">
                <h3 className="text-lg font-black uppercase tracking-tight">Configure Matching</h3>
                <button onClick={() => setShowConfig(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <LX size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest leading-relaxed">
                    Select fields from student form to identify and group parents automatically. System will group students whenever these fields match.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {allAvailableFields.map(field => (
                    <label 
                      key={field.id} 
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        tempMatchingFields.includes(field.id) 
                        ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-lg' 
                        : 'bg-[#FCFBF8] dark:bg-slate-900 border-[#E5E0D8] dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={tempMatchingFields.includes(field.id)}
                        onChange={() => {
                          const newFields = tempMatchingFields.includes(field.id)
                            ? tempMatchingFields.filter(id => id !== field.id)
                            : [...tempMatchingFields, field.id];
                          setTempMatchingFields(newFields);
                        }}
                      />
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${tempMatchingFields.includes(field.id) ? 'border-white bg-white/20' : 'border-[#D4AF37]/30'}`}>
                        {tempMatchingFields.includes(field.id) && <LCheck size={12} strokeWidth={4} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider truncate">{field.label}</span>
                    </label>
                  ))}
                </div>
                <button 
                  onClick={() => handleUpdateMatchingFields(tempMatchingFields)}
                  disabled={isUpdatingConfig || tempMatchingFields.length === 0}
                  className="w-full py-5 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 border border-white/20 disabled:opacity-50"
                >
                  {isUpdatingConfig ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="fill"/>}
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">Parent Management</h1>
                <p className="text-xs font-bold text-blue-200 mt-1 uppercase tracking-widest">Manage Guardians & Siblings</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-3 font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors border-2 border-blue-600 flex items-center gap-2 shadow-lg"
                >
                    <Gear size={16} weight="fill"/> {showConfig ? 'Close Config' : 'Configure Matching'}
                </button>
                <button 
                    onClick={() => { setEditingParent(null); setFormData({ fatherName: '', cnic: '', phone: '', email: '', address: '', occupation: '' }); setShowModal(true); }}
                    className="mt-4 md:mt-0 bg-white dark:bg-slate-800 text-[#1e3a8a] px-6 py-3 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors border-2 border-white flex items-center gap-2 shadow-lg"
                >
                    <Plus size={16} weight="fill"/> Add New Parent
                </button>
            </div>
        </div>

        {/* Configuration Box */}
        {(showConfig || matchingFields.length === 0) && (
            <div className="p-6 bg-blue-50 border-b-4 border-blue-200 animate-in slide-in-from-top duration-300">
                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200">
                        <ListChecks size={24} weight="bold" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight">Configure Parent Matching</h2>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Select fields from student form to identify and group parents automatically</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                    {allAvailableFields.map(field => (
                        <label 
                            key={field.id} 
                            className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-all duration-200 ${
                                tempMatchingFields.includes(field.id) 
                                ? 'bg-blue-600 border-blue-700 text-white shadow-md transform -translate-y-0.5' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                            }`}
                        >
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={tempMatchingFields.includes(field.id)}
                                onChange={() => {
                                    const newFields = tempMatchingFields.includes(field.id)
                                        ? tempMatchingFields.filter(id => id !== field.id)
                                        : [...tempMatchingFields, field.id];
                                    setTempMatchingFields(newFields);
                                }}
                            />
                            <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${tempMatchingFields.includes(field.id) ? 'border-white bg-white/20 dark:bg-slate-800/20' : 'border-slate-300'}`}>
                                {tempMatchingFields.includes(field.id) && <Check size={12} weight="bold" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider truncate">{field.label}</span>
                        </label>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-800/50 border border-blue-200 rounded-lg flex-1">
                        <Sparkle size={18} className="text-blue-600" weight="fill" />
                        <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">
                            System will automatically group students into parent records whenever these fields match. No manual linking required.
                        </p>
                    </div>
                    <button 
                        onClick={() => handleUpdateMatchingFields(tempMatchingFields)}
                        disabled={isUpdatingConfig || tempMatchingFields.length === 0}
                        className="bg-blue-600 text-white px-8 py-4 font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors border-2 border-blue-600 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 min-w-[200px]"
                    >
                        {isUpdatingConfig ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="fill"/>}
                        Save Configuration
                    </button>
                </div>
            </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Users size={24} weight="fill" />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total Parents</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalParents}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Check size={24} weight="bold" />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Registered Parents</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalLinked}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                    <WarningCircle size={24} weight="fill" />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Unlinked / Virtual</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalUnlinked}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <StudentIcon size={24} weight="fill" />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Students Linked</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalStudentsLinked}</p>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-6">
            {/* Search & Columns */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center bg-white dark:bg-slate-800 border-2 border-[#1e3a8a] p-2 w-full max-w-md shadow-sm">
                    <MagnifyingGlass size={20} className="text-slate-400 mr-2" weight="bold"/>
                    <input 
                        type="text" 
                        placeholder="SEARCH BY NAME, CNIC OR PHONE..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent outline-none font-bold text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200 placeholder-slate-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-700 mb-4">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {visibleColumns.map(colId => (
                                <th key={colId} className="p-4 border-r border-slate-200 dark:border-slate-700">
                                    {allAvailableFields.find(f => f.id === colId)?.label}
                                </th>
                            ))}
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {loading ? (
                            <tr>
                                <td colSpan={visibleColumns.length + 1} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <CircleNotch size={32} className="animate-spin text-[#1e3a8a]" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Records...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredParents.length > 0 ? (
                            filteredParents.slice(0, visibleCount).map(parent => {
                                const linkedStudents = (parent as any).linkedStudents || [];
                                const isVirtual = (parent as any).isVirtual;
                                
                                return (
                                    <tr key={parent.id} className={`border-b border-slate-100 hover:bg-blue-50 transition-colors group ${isVirtual ? 'bg-slate-50/50' : ''}`}>
                                        {visibleColumns.map(colId => {
                                            if (colId === 'children') {
                                                return (
                                                    <td key={colId} className="p-4 border-r border-slate-100 dark:border-slate-800 group-hover:border-blue-100">
                                                        <div className="flex flex-wrap gap-2">
                                                            {linkedStudents.length > 0 ? linkedStudents.map((s: Student) => (
                                                                <div key={s.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 px-2 py-1 rounded shadow-sm">
                                                                    {s.photoURL ? (
                                                                        <img 
                                                                            src={s.photoURL} 
                                                                            alt={s.name} 
                                                                            className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                                            referrerPolicy="no-referrer"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                            {s.name[0]?.toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">
                                                                        {s.name} ({getClassName(s.classId)})
                                                                    </span>
                                                                </div>
                                                            )) : (
                                                                <span className="text-slate-400 text-[10px] italic uppercase">No children linked</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // Map common IDs to student record fields for display
                                            let actualFieldId = colId;
                                            if (colId === 'guardianName') actualFieldId = 'fatherName';
                                            if (colId === 'guardianPhone') actualFieldId = 'phone';
                                            if (colId === 'guardianEmail') actualFieldId = 'email';

                                            // Try to get value from parent record, then from the first linked student
                                            let value = (parent as any)[actualFieldId];
                                            if (!value && linkedStudents.length > 0) {
                                                const firstStudent = linkedStudents[0];
                                                value = (firstStudent as any)[actualFieldId] || (firstStudent.customData?.[colId]);
                                            }
                                            
                                            value = value || '-';
                                            const label = allAvailableFields.find(f => f.id === colId)?.label || colId;

                                            return (
                                                <td key={colId} className="p-4 border-r border-slate-100 dark:border-slate-800 group-hover:border-blue-100">
                                                    <div className="flex flex-col">
                                                        {colId === matchingFields[0] ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full font-black ${isVirtual ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500 dark:text-slate-400'}`}>
                                                                    {String(value)[0]?.toUpperCase() || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="uppercase flex items-center gap-2 font-black text-slate-900 dark:text-white">
                                                                        {value}
                                                                        {isVirtual && <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded border border-orange-200">UNLINKED</span>}
                                                                    </p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{label}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-200">{value}</span>
                                                                <span className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">{label}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(parent)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title={isVirtual ? "Create Parent Record" : "Edit Parent"}>
                                                    {isVirtual ? <Plus size={18} weight="bold"/> : <PencilSimple size={18} weight="bold"/>}
                                                </button>
                                                {!isVirtual && (
                                                    <button onClick={() => { setParentToDelete(parent.id); setShowDeleteConfirmModal(true); }} className="p-2 text-rose-600 hover:bg-rose-100 rounded-full transition-colors" title="Delete Parent">
                                                        <Trash size={18} weight="bold"/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">No parents found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Load More Button */}
            {filteredParents.length > visibleCount && (
                <div className="flex justify-center mt-6">
                    <button 
                        onClick={handleLoadMore}
                        className="bg-white dark:bg-slate-800 border-2 border-slate-300 text-slate-600 dark:text-slate-300 px-8 py-3 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        Load More Records <CaretDown size={16} weight="bold"/>
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg border-4 border-slate-800 relative z-10 animate-in zoom-in-95 shadow-2xl">
                <div className="bg-slate-800 text-white p-5 flex justify-between items-center border-b-4 border-black">
                    <h3 className="text-lg font-black uppercase tracking-tight">{editingParent ? 'Edit Parent' : 'Add New Parent'}</h3>
                    <button onClick={() => setShowModal(false)}><X size={20} weight="bold"/></button>
                </div>
                <div className="p-8 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 block">Father Name *</label>
                        <input type="text" value={formData.fatherName || ''} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 font-bold text-sm uppercase outline-none focus:border-[#1e3a8a]"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 block">CNIC *</label>
                            <input type="text" value={formData.cnic || ''} onChange={e => setFormData({...formData, cnic: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 font-bold text-sm uppercase outline-none focus:border-[#1e3a8a]" placeholder="XXXXX-XXXXXXX-X"/>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 block">Phone *</label>
                            <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 font-bold text-sm uppercase outline-none focus:border-[#1e3a8a]" placeholder="03XX-XXXXXXX"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 block">Email (Optional)</label>
                        <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 font-bold text-sm outline-none focus:border-[#1e3a8a]"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 block">Address</label>
                        <textarea value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 font-bold text-sm uppercase outline-none focus:border-[#1e3a8a] h-20 resize-none"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 block">Occupation</label>
                        <input type="text" value={formData.occupation || ''} onChange={e => setFormData({...formData, occupation: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 font-bold text-sm uppercase outline-none focus:border-[#1e3a8a]"/>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest hover:bg-[#172554] transition-colors flex items-center justify-center gap-2">
                            {isSaving ? <CircleNotch className="animate-spin" size={16}/> : <Check size={16} weight="bold"/>} Save Record
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirmModal(false)}></div>
            <div className="bg-white dark:bg-slate-800 w-full max-w-md border-4 border-slate-800 relative z-10 animate-in zoom-in-95 shadow-2xl">
                <div className="bg-rose-600 text-white p-4 flex items-center gap-3 border-b-4 border-black">
                    <WarningCircle size={24} weight="fill"/>
                    <h3 className="text-lg font-black uppercase tracking-tight">Confirm Deletion</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6 uppercase tracking-tight">
                        Are you sure you want to delete this parent record? This will unlink all students currently associated with this parent.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteConfirmModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={handleDelete} className="flex-1 py-3 bg-rose-600 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-colors">Delete Now</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ParentManagement;
