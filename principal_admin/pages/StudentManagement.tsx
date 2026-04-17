
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UserPlus, FileText, ListChecks, Printer, FloppyDisk, 
  CircleNotch, Plus, Trash, PencilSimple, X, Check, MagnifyingGlass,
  Funnel, CaretDown, CaretRight, Student as StudentIcon, DownloadSimple, UserCircle, Users,
  IdentificationCard, ChalkboardTeacher, Wallet, WarningCircle, TrendUp,
  GenderMale, GenderFemale, CalendarBlank, MapPin, Phone, Briefcase, GraduationCap,
  Hash, Money, HouseLine, Scroll, X as CloseIcon, Stamp, FileCsv, Table, UploadSimple, Eye,
  Asterisk, Minus, Gear, PlusCircle, Buildings, Camera, ArrowLeft
} from 'phosphor-react';
import imageCompression from 'browser-image-compression';
import Skeleton from '../../components/Skeleton.tsx';
import { Student, School, FormFieldConfig, FeeTransaction, UserProfile, StaffPermission, Parent, BUILTIN_ADMISSION_CONFIG } from '../../types.ts';
import { updateSchoolBranding, addStudent, updateStudent, deleteStudent, deleteParent, uploadFileToStorage, deleteFileFromStorage, extractPathFromStorageUrl, logActivity, subscribeToParents, addParent, generateLoginId } from '../../services/api.ts';
import { usePermissions } from '../../hooks/usePermissions.ts';
import Loader from '../../components/Loader.tsx';
import CameraCapture from '../../components/CameraCapture.tsx';
import StudentProfile from './StudentProfile.tsx';
import * as XLSX from 'xlsx';

interface StudentManagementProps {
  profile: UserProfile;
  schoolId: string;
  students: Student[];
  classes: any[];
  school: School;
  ledger: FeeTransaction[];
  searchTerm: string;
  view: 'directory' | 'admissions' | 'form_builder' | 'forms';
  onNavigate?: (tab: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

const DEFAULT_FORM_CONFIG: FormFieldConfig[] = BUILTIN_ADMISSION_CONFIG;

const INITIAL_SYSTEM_STATE = {
    admissionNo: '',
    classId: '',
    rollNo: '',
    admissionDate: new Date().toISOString().split('T')[0],
    monthlyFee: '',
    discount: '',
    status: 'Active'
};

// --- PRINTABLE ADMISSION FORM COMPONENT (Dynamic) ---
export const PrintableAdmissionForm: React.FC<{ school: School, config: FormFieldConfig[], isBlank?: boolean, showOverlays?: boolean, student?: Student }> = ({ school, config, isBlank, showOverlays = true, student }) => {
    const overlayConfig = school.admissionFormOverlayConfig || { templateUrl: '', pages: [], elements: {} };
    
    // If a custom overlay design exists, use it (just the images, no mapping)
    if (showOverlays && (overlayConfig?.templateUrl || (overlayConfig?.pages && overlayConfig.pages.length > 0))) {
        const pages = overlayConfig.pages || [overlayConfig.templateUrl].filter(Boolean);
        
        return (
            <div className="flex flex-col gap-8 print:gap-0">
                {pages.map((pageUrl, pageIdx) => (
                    <div 
                        key={pageIdx}
                        className="w-[210mm] mx-auto bg-white dark:bg-slate-800 relative shadow-2xl overflow-hidden print:shadow-none print:m-0 break-after-page" 
                        style={{ minHeight: '297mm' }}
                    >
                        <img src={pageUrl} className="w-full h-full absolute inset-0 object-fill" alt={`Form Template Page ${pageIdx + 1}`} />
                    </div>
                ))}
            </div>
        );
    }

    // Group fields by section for the built-in form
    const groupedFields = useMemo(() => {
        const groups: Record<string, FormFieldConfig[]> = {
            student: [],
            parent: [],
            academic: [],
            health: [],
            other: []
        };
        config.forEach(f => {
            if (!f.enabled) return;
            const sec = f.section || 'other';
            if (!groups[sec]) groups[sec] = [];
            groups[sec].push(f);
        });
        return groups;
    }, [config]);

    const sectionTitles: Record<string, string> = {
        student: 'Student Information',
        parent: 'Parent / Guardian Details',
        academic: 'Academic History',
        health: 'Health & Medical Information',
        other: 'Other Details'
    };

    return (
        <div className="w-[210mm] mx-auto bg-white dark:bg-slate-800 text-black p-10 shadow-2xl print:shadow-none print:m-0 print:p-8" style={{ minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
            {/* Minimal Classic Header Section */}
            <div className="flex items-start justify-between border-b-2 border-black pb-6 mb-8">
                {/* Logo */}
                <div className="w-28 h-28 flex-shrink-0 flex items-center justify-center">
                    {school.logoURL ? (
                        <img src={school.logoURL} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-20 h-20 border-2 border-black rounded-full flex items-center justify-center">
                            <Buildings size={32} className="text-black" />
                        </div>
                    )}
                </div>
                
                {/* School Info */}
                <div className="flex-1 text-center px-4 flex flex-col justify-center">
                    <h1 className="text-3xl font-bold uppercase text-black mb-1" style={{ fontFamily: 'Times New Roman, serif' }}>
                        {school.name}
                    </h1>
                    <p className="text-sm font-medium text-black mb-1">
                        {school.address || 'School Address Not Provided'}
                    </p>
                    {(school.phone || school.email) && (
                        <p className="text-xs text-black mb-4">
                            {school.phone} {school.phone && school.email && <span className="mx-2">|</span>} {school.email}
                        </p>
                    )}
                    <div className="inline-block border-2 border-black px-4 py-1 mx-auto">
                        <h2 className="text-lg font-bold uppercase tracking-widest text-black">
                            Admission Form
                        </h2>
                    </div>
                </div>

                {/* Photo Box */}
                <div className="w-28 flex-shrink-0 flex justify-end">
                    <div className="w-28 h-36 border-2 border-black flex flex-col items-center justify-center text-center relative overflow-hidden">
                        {student?.photoURL && !isBlank ? (
                            <img src={student.photoURL} alt="Student" className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                            <span className="text-[10px] uppercase text-gray-500 leading-tight p-2">
                                Affix<br/>Passport<br/>Size<br/>Photo
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-2">
                {/* Dynamic Sections */}
                <div className="space-y-6">
                    {Object.entries(groupedFields).map(([sectionKey, fields]) => {
                        if (fields.length === 0) return null;
                        return (
                            <div key={sectionKey} className="mb-6">
                                <h3 className="text-sm font-bold uppercase text-black border-b border-black mb-4 pb-1">
                                    {sectionTitles[sectionKey] || sectionKey}
                                </h3>
                                
                                <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                    {fields.map((field) => {
                                        let colSpan = 'col-span-6';
                                        if (field.type === 'textarea' || field.label.length > 30) {
                                            colSpan = 'col-span-12';
                                        } else if (field.type === 'date' || field.label.toLowerCase().includes('gender')) {
                                            colSpan = 'col-span-4';
                                        }

                                        if (field.type === 'image' || field.type === 'signature' || field.type === 'principal_signature') {
                                            return null;
                                        }

                                        return (
                                            <div key={field.id} className={`${colSpan} flex items-end`}>
                                                <span className="text-xs font-semibold text-black whitespace-nowrap mr-2">
                                                    {field.label}:
                                                </span>
                                                <div className="flex-1 border-b border-black border-dotted h-5 relative">
                                                    {!isBlank && student && (
                                                        <span className="absolute bottom-0 left-1 text-sm text-black font-medium">
                                                            {student.customData?.[field.id] || 
                                                             (field.id === 'name' ? student.name : 
                                                              field.id === 'fatherName' ? student.fatherName : 
                                                              field.id === 'phone' ? student.phone : 
                                                              field.id === 'rollNo' ? student.rollNo : 
                                                              field.id === 'admissionDate' ? student.admissionDate : '')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Declaration */}
                <div className="mt-12 p-4 border border-black">
                    <h3 className="text-xs font-bold uppercase mb-2 text-black">
                        Declaration by Parent / Guardian
                    </h3>
                    <p className="text-xs leading-relaxed text-justify text-black">
                        I hereby declare that the information given above is true and correct to the best of my knowledge and belief. 
                        I have read the rules and regulations of the school and agree to abide by them. I understand that if any information 
                        is found to be incorrect, the admission of my ward may be cancelled. I also agree to pay all school dues on time.
                    </p>
                </div>

                {/* Signatures */}
                <div className="mt-20 grid grid-cols-3 gap-12 px-4">
                    <div className="flex flex-col items-center">
                        <div className="w-full border-b border-black"></div>
                        <span className="text-[10px] font-bold uppercase mt-2 text-black">Date</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-full border-b border-black"></div>
                        <span className="text-[10px] font-bold uppercase mt-2 text-black">Signature of Parent/Guardian</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-full border-b border-black relative">
                            {school.feeConfig?.masterTemplate?.signatureURL && (
                                <img src={school.feeConfig.masterTemplate.signatureURL} alt="Principal Signature" className="absolute bottom-1 left-1/2 -translate-x-1/2 h-12 object-contain opacity-80" />
                            )}
                        </div>
                        <span className="text-[10px] font-bold uppercase mt-2 text-black">Signature of Principal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MEMOIZED COMPONENTS ---

const VirtualizedMobileRow = React.memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
    const s = data.students[index];
    if (!s) return null;
    return (
        <div style={{ ...style, padding: '0 12px 24px 12px' }}>
            <MobileStudentCard 
                student={s} 
                onViewProfile={data.onViewProfile} 
            />
        </div>
    );
});

const VirtualizedDesktopRow = React.memo(({ index, style, data }: { index: number, style: React.CSSProperties, data: any }) => {
    const s = data.students[index];
    if (!s) return null;
    return (
        <div style={style}>
            <StudentRow 
                student={s}
                index={index}
                visibleTableFields={data.visibleTableFields}
                allAvailableFields={data.allAvailableFields}
                selectedStudents={data.selectedStudents}
                onToggleSelect={data.onToggleSelect}
                getClassName={data.getClassName}
                onViewProfile={data.onViewProfile}
                onEdit={data.onEdit}
                onDelete={data.onDelete}
                canEdit={data.canEdit}
                canDelete={data.canDelete}
                sectionId={data.sectionId}
            />
        </div>
    );
});

const StudentRow = React.memo(({ 
    student: s, 
    index, 
    visibleTableFields, 
    allAvailableFields, 
    selectedStudents, 
    onToggleSelect, 
    getClassName, 
    onViewProfile, 
    onEdit, 
    onDelete,
    canEdit,
    canDelete,
    sectionId
}: {
    student: Student;
    index: number;
    visibleTableFields: string[];
    allAvailableFields: any[];
    selectedStudents: string[];
    onToggleSelect: (id: string, checked: boolean) => void;
    getClassName: (id: string) => string;
    onViewProfile: (id: string) => void;
    onEdit: (s: Student) => void;
    onDelete: (id: string) => void;
    canEdit: (id: string) => boolean;
    canDelete: (id: string) => boolean;
    sectionId: string;
}) => {
    const isSelected = selectedStudents.includes(s.id);
    const photoUrl = s.photoURL || s.customData?.photoURL;

    return (
        <tr className={`hover:bg-blue-50/50 transition-colors group border-b border-slate-200 dark:border-slate-700 ${isSelected ? 'bg-blue-50/30' : ''}`}>
            <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap text-center w-[50px]">
                <div className="flex items-center justify-center">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 cursor-pointer accent-[#1e3a8a]"
                        checked={isSelected}
                        onChange={(e) => onToggleSelect(s.id, e.target.checked)}
                    />
                </div>
            </td>
            {visibleTableFields.map(fieldId => {
                let value: any;
                if (fieldId === 'rollNo') value = index + 1;
                else if (fieldId === 'class') value = getClassName(s.classId);
                else if (fieldId === 'name') value = s.name;
                else if (fieldId === 'fatherName') value = s.fatherName;
                else if (fieldId === 'phone') value = s.phone;
                else if (fieldId === 'feeStatus') value = s.feeStatus;
                else value = s.customData?.[fieldId];

                // Determine column width
                let widthClass = "min-w-[150px]";
                if (fieldId === 'rollNo') widthClass = "w-[80px]";
                if (fieldId === 'feeStatus') widthClass = "w-[120px]";
                if (fieldId === 'class') widthClass = "w-[120px]";

                // Special rendering for Name field (with avatar)
                if (fieldId === 'name') {
                    return (
                        <td key={fieldId} className={`px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap ${widthClass}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt={s.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">{String(value || 'Unknown')}</p>
                                    {s.category === 'New' && <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">New</span>}
                                </div>
                            </div>
                        </td>
                    );
                }
                
                // Special rendering for class
                if (fieldId === 'class') {
                    return (
                        <td key={fieldId} className={`px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap ${widthClass}`}>
                            <div className="flex items-center">
                                <span className="text-[10px] font-black text-[#1e3a8a] bg-blue-50 px-2 py-1 border border-blue-100 uppercase tracking-tighter truncate">{String(value || 'Unknown')}</span>
                            </div>
                        </td>
                    );
                }

                // Special rendering for feeStatus
                if (fieldId === 'feeStatus') {
                    return (
                        <td key={fieldId} className={`px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-right whitespace-nowrap ${widthClass}`}>
                            <div className="flex items-center justify-end">
                                <span className={`text-[10px] font-black px-2 py-1 border uppercase tracking-tighter ${value === 'Paid' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100'}`}>
                                    {value}
                                </span>
                            </div>
                        </td>
                    );
                }

                return (
                    <td key={fieldId} className={`px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-300 text-sm border-r border-slate-200 dark:border-slate-700 whitespace-nowrap ${widthClass}`}>
                        <div className="flex items-center">
                            <span className="truncate">{String(value || '-')}</span>
                        </div>
                    </td>
                );
            })}
             <td className="px-4 py-3 text-right whitespace-nowrap w-[150px]">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onViewProfile(s.id)} 
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500 text-slate-400 transition-all shadow-sm"
                        title="View Profile"
                    >
                        <Eye size={14} weight="bold"/>
                    </button>
                    {canEdit(sectionId) && (
                      <button onClick={() => onEdit(s)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] hover:text-[#1e3a8a] text-slate-400 transition-all shadow-sm"><PencilSimple size={14} weight="bold"/></button>
                    )}
                    {canDelete(sectionId) && (
                      <button onClick={() => onDelete(s.id)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-500 text-slate-400 transition-all shadow-sm"><Trash size={14} weight="bold"/></button>
                    )}
                </div>
            </td>
        </tr>
    );
});

const MobileStudentCard = React.memo(({ 
    student: s, 
    onViewProfile 
}: { 
    student: Student; 
    onViewProfile: (id: string) => void;
}) => {
    const photoUrl = s.photoURL || s.customData?.photoURL;
    return (
        <div 
          onClick={() => onViewProfile(s.id)}
          className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-[#D4AF37]/20 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] flex flex-col gap-6 transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#1e3a8a] opacity-90 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex items-center justify-between relative z-10 pl-3">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#172554] flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg">
                  {photoUrl ? (
                    <img src={photoUrl} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-white font-black text-2xl">{s.name[0]}</span>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-black text-[#1e3a8a] dark:text-white text-xl leading-tight truncate tracking-tight uppercase">{s.name}</p>
              </div>
            </div>
            <CaretRight size={20} className="text-[#D4AF37]" weight="bold" />
          </div>
        </div>
    );
});

const StudentManagement: React.FC<StudentManagementProps> = ({ 
  profile, schoolId, students, classes, school, searchTerm, view, onNavigate, loading = false, onRefresh 
}) => {
  // --- STATE ---
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const activeStudents = useMemo(() => {
    const term = (localSearch || '').toLowerCase();
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(term) || s.rollNo.includes(term);
      const matchesClass = classFilter === 'all' || s.classId === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, localSearch, classFilter]);
  
  // Form Builder State
  const [formConfig, setFormConfig] = useState<FormFieldConfig[]>(() => {
      return (school.admissionFormConfig && school.admissionFormConfig.length > 0) ? school.admissionFormConfig : [];
  });
  const [pageSize, setPageSize] = useState<'a4' | 'legal'>(school.admissionFormSettings?.pageSize || 'a4');
  const [pageLayout, setPageLayout] = useState<'single' | 'double'>(school.admissionFormSettings?.pageLayout || 'single');
  const [showChecklist, setShowChecklist] = useState<boolean>(school.admissionFormSettings?.showChecklist || false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  // Custom Field State
  const [newField, setNewField] = useState<{label: string, type: string, section: string}>({ label: '', type: 'text', section: 'student' });
  const [isAddingField, setIsAddingField] = useState(false);

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>([]);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [isBulkAction, setIsBulkAction] = useState(false);

  // Edit State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Print State
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printBlankForm, setPrintBlankForm] = useState(false);

  // Admission State
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
  const [systemFormData, setSystemFormData] = useState(INITIAL_SYSTEM_STATE);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeySelected(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

  // Camera State
  const [showCamera, setShowCamera] = useState(false);

  // Bulk Import State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [importClassId, setImportClassId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Table Configuration State
  const builtInFields = [{ id: 'rollNo', label: 'S/No' }];
  const configurableFields = useMemo(() => {
      return [
          { id: 'class', label: 'Class' },
          { id: 'name', label: 'Name' },
          { id: 'fatherName', label: 'Father Name' },
          { id: 'phone', label: 'Phone' },
          { id: 'feeStatus', label: 'Fee Status' },
          ...formConfig.filter(f => f.enabled && !['rollNo', 'class', 'name', 'fatherName', 'phone', 'feeStatus'].includes(f.id)).map(f => ({ id: f.id, label: f.label }))
      ];
  }, [formConfig]);

  const allAvailableFields = useMemo(() => [...builtInFields, ...configurableFields], [configurableFields]);
  const [configError, setConfigError] = useState<string | null>(null);

  const [visibleTableFields, setVisibleTableFields] = useState<string[]>(() => ['rollNo', ...configurableFields.slice(0, 9).map(f => f.id)]);
  const [showTableConfigModal, setShowTableConfigModal] = useState(false);

  const [parents, setParents] = useState<Parent[]>([]);

  useEffect(() => {
    const unsub = subscribeToParents(schoolId, (data) => setParents(data));
    return () => unsub();
  }, [schoolId]);

  useEffect(() => {
    if (school.admissionFormConfig && school.admissionFormConfig.length > 0) {
        setFormConfig(school.admissionFormConfig);
    } else {
        setFormConfig([]);
    }
  }, [school.admissionFormConfig, schoolId]);

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploadingTemplate(true);
      try {
          const currentConfig = school.admissionFormOverlayConfig || { templateUrl: '', pages: [], elements: {} };
          const currentPages = Array.isArray(currentConfig.pages) ? currentConfig.pages : [];
          let updatedPages = [...currentPages];
          let lastUrl = currentConfig.templateUrl;

          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const path = `schools/${schoolId}/admission_templates/${Date.now()}_${file.name}`;
              const { publicUrl } = await uploadFileToStorage(file, path);
              updatedPages.push(publicUrl);
              lastUrl = publicUrl;
          }
          
          const newOverlayConfig = {
              ...currentConfig,
              templateUrl: lastUrl,
              pages: updatedPages,
              elements: currentConfig.elements || {}
          };

          await updateSchoolBranding(schoolId, { 
              admissionFormOverlayConfig: newOverlayConfig
          });
          
          alert(`Uploaded ${files.length} pages successfully!`);

          logAction('Upload Template', `Uploaded ${files.length} new paper form template pages`, 'Settings');
      } catch (error) {
          console.error("Template upload failed", error);
          alert("Failed to upload template.");
      } finally {
          setIsUploadingTemplate(false);
          if (templateInputRef.current) templateInputRef.current.value = '';
      }
  };

  const handleCameraCapture = (imageData: string) => {
    setPhotoPreview(imageData);
    // Convert base64 to File object for upload directly
    fetch(imageData)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "student_photo.png", { type: "image/png" });
        setPhotoFile(file);
      });
    setShowCamera(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });
        setPhotoFile(compressed);
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(compressed);
    } catch(e) { console.error(e); }
  };

  const { canAdd, canEdit, canDelete } = usePermissions(profile);
  const sectionId = 'students';

  const logAction = async (action: string, details: string, category: any = 'Student') => {
    await logActivity({
      schoolId,
      userId: profile.uid,
      userName: profile.name,
      userRole: profile.role,
      action,
      details,
      category
    });
  };

  const UserAvatar = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const addCustomField = () => {
      if (!newField.label) return alert("Please enter a field label");
      
      const id = newField.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      // Check duplicate
      if (formConfig.find(f => f.id === id)) return alert("A field with this name already exists");

      const field: FormFieldConfig = {
          id,
          label: newField.label,
          type: newField.type as any,
          section: newField.section as any,
          enabled: true,
          required: false
      };

      setFormConfig(prev => [...prev, field]);
      setNewField({ label: '', type: 'text', section: 'student' });
      setIsAddingField(false);
      alert("Field Added! Don't forget to save changes.");
  };

  const exportToExcel = () => {
    const exportData = activeStudents.map(s => {
      const row: any = {};
      
      if (selectedExportFields.includes('rollNo')) row['S/No'] = s.rollNo;
      if (selectedExportFields.includes('class')) row['Class'] = getClassName(s.classId);
      
      formConfig.filter(f => f.enabled).forEach(field => {
        if (selectedExportFields.includes(field.id)) {
          let value = s.customData?.[field.id];
          if (value === undefined || value === null) {
              const id = field.id.toLowerCase();
              if (id.includes('name') && !id.includes('father')) value = s.name;
              else if (id.includes('father')) value = s.fatherName;
              else if (id.includes('phone') || id.includes('contact') || id.includes('mobile')) value = s.phone;
          }
          row[field.label] = value || '-';
        }
      });

      if (selectedExportFields.includes('feeStatus')) row['Fee Status'] = s.feeStatus || 'Unpaid';
      
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `${school.name}_Students_${new Date().toLocaleDateString()}.xlsx`);
    setShowExportModal(false);
  };

  const downloadImportTemplate = () => {
      // Core fields
      const coreFields = ['Name', 'Father Name', 'Roll Number', 'Phone', 'Admission Date', 'Monthly Fee', 'Discount'];
      
      // Custom fields from formConfig
      const customFields = formConfig
          .filter(f => f.enabled && f.type !== 'image' && f.type !== 'signature' && f.type !== 'principal_signature')
          .map(f => f.required ? `${f.label} *` : f.label);
      
      // Only mark core fields as required if they are generally required (Name, Roll Number are usually required)
      const headers = [...coreFields.map(f => ['Name', 'Roll Number'].includes(f) ? `${f} *` : f), ...customFields];
      
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      XLSX.writeFile(wb, `Student_Import_Template.xlsx`);
  };

  const handleFilePreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !importClassId) return;

      setIsImporting(true);
      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          // Get headers directly from worksheet
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          const headers: string[] = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
              const cell = worksheet[XLSX.utils.encode_cell({c: C, r: range.s.r})];
              if (cell && cell.v) {
                  headers.push(cell.v.toString());
              }
          }
          const requiredHeaders = headers.filter(h => h.endsWith(' *'));

          const previewData: any[] = [];
          const errors: string[] = [];

          json.forEach((row, index) => {
              const rowNum = index + 2;
              const rowErrors: string[] = [];

              requiredHeaders.forEach(header => {
                  if (row[header] === undefined || row[header] === null || row[header].toString().trim() === '') {
                      rowErrors.push(`${header.replace(' *', '')} is required`);
                  }
              });

              if (rowErrors.length > 0) {
                  errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`);
              } else {
                  previewData.push(row);
              }
          });

          setImportPreviewData(previewData);
          setImportErrors(errors);
          setShowConfirmModal(true);
      } catch (error) {
          console.error("Bulk import error:", error);
          setImportErrors(["Failed to process the Excel file. Please ensure it matches the template."]);
      } finally {
          setIsImporting(false);
          if (e.target) e.target.value = '';
      }
  };

  const confirmBulkImport = async () => {
      setIsImporting(true);
      let successCount = 0;
      for (const row of importPreviewData) {
          try {
              const customData: Record<string, any> = {};
              formConfig.filter(f => f.enabled).forEach(f => {
                  const val = row[f.label] || row[`${f.label} *`];
                  if (val !== undefined) {
                      customData[f.id] = val;
                  }
              });

              const newStudent: Omit<Student, 'id'> = {
                  name: row['Name *'] || row['Name'],
                  fatherName: row['Father Name']?.toString() || '',
                  rollNo: row['Roll Number *'] || row['Roll Number'],
                  classId: importClassId,
                  phone: row['Phone *'] || row['Phone'],
                  admissionDate: row['Admission Date']?.toString() || new Date().toISOString().split('T')[0],
                  monthlyFee: row['Monthly Fee'] ? Number(row['Monthly Fee']) : 0,
                  discount: row['Discount'] ? Number(row['Discount']) : 0,
                  status: 'Active',
                  customData,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
              } as any;

              await addStudent(schoolId, newStudent);
              successCount++;
          } catch (err) {
              console.error("Error importing row:", err);
          }
      }
      alert(`Import complete! Successfully added ${successCount} students.`);
      setShowConfirmModal(false);
      setShowBulkImportModal(false);
      setImportClassId('');
      setImportPreviewData([]);
      setImportErrors([]);
      setIsImporting(false);
  };

  const exportToWord = async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } = await import('docx');
    
    const headers: string[] = [];
    if (selectedExportFields.includes('rollNo')) headers.push('S/No');
    if (selectedExportFields.includes('class')) headers.push('Class');
    
    formConfig.filter(f => f.enabled).forEach(field => {
      if (selectedExportFields.includes(field.id)) headers.push(field.label);
    });

    if (selectedExportFields.includes('feeStatus')) headers.push('Fee Status');

    const rows = activeStudents.map(s => {
      const row: any[] = [];
      if (selectedExportFields.includes('rollNo')) row.push(s.rollNo);
      if (selectedExportFields.includes('class')) row.push(getClassName(s.classId));
      
      formConfig.filter(f => f.enabled).forEach(field => {
        if (selectedExportFields.includes(field.id)) {
          let value = s.customData?.[field.id];
          if (value === undefined || value === null) {
              const id = field.id.toLowerCase();
              if (id.includes('name') && !id.includes('father')) value = s.name;
              else if (id.includes('father')) value = s.fatherName;
              else if (id.includes('phone') || id.includes('contact') || id.includes('mobile')) value = s.phone;
          }
          row.push(value || '-');
        }
      });

      if (selectedExportFields.includes('feeStatus')) row.push(s.feeStatus || 'Unpaid');
      return row;
    });

    const tableRows = [
        new TableRow({
            children: headers.map(header => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
            })),
        }),
        ...rows.map(row => new TableRow({
            children: row.map(cell => new TableCell({
                children: [new Paragraph({ children: [new TextRun(String(cell))] })],
            })),
        }))
    ];

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ children: [new TextRun({ text: `${school.name} - Student Directory`, bold: true, size: 32 })] }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: tableRows,
                }),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${school.name}_Students_${new Date().toLocaleDateString()}.docx`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const exportToCSV = () => {
    const headers: string[] = [];
    if (selectedExportFields.includes('rollNo')) headers.push('S/No');
    if (selectedExportFields.includes('class')) headers.push('Class');
    
    formConfig.filter(f => f.enabled).forEach(field => {
      if (selectedExportFields.includes(field.id)) headers.push(field.label);
    });

    if (selectedExportFields.includes('feeStatus')) headers.push('Fee Status');

    const rows = activeStudents.map(s => {
      const row: any[] = [];
      if (selectedExportFields.includes('rollNo')) row.push(s.rollNo);
      if (selectedExportFields.includes('class')) row.push(getClassName(s.classId));
      
      formConfig.filter(f => f.enabled).forEach(field => {
        if (selectedExportFields.includes(field.id)) {
          let value = s.customData?.[field.id];
          if (value === undefined || value === null) {
              const id = field.id.toLowerCase();
              if (id.includes('name') && !id.includes('father')) value = s.name;
              else if (id.includes('father')) value = s.fatherName;
              else if (id.includes('phone') || id.includes('contact') || id.includes('mobile')) value = s.phone;
          }
          row.push(value || '-');
        }
      });

      if (selectedExportFields.includes('feeStatus')) row.push(s.feeStatus || 'Unpaid');
      return row;
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${school.name}_Students_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.text(school.name, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Student Directory - ${new Date().toLocaleDateString()}`, 14, 30);

    const headers: string[] = [];
    if (selectedExportFields.includes('rollNo')) headers.push('S/No');
    if (selectedExportFields.includes('class')) headers.push('Class');
    
    formConfig.filter(f => f.enabled).forEach(field => {
      if (selectedExportFields.includes(field.id)) headers.push(field.label);
    });

    if (selectedExportFields.includes('feeStatus')) headers.push('Fee Status');

    const data = activeStudents.map(s => {
      const row: any[] = [];
      if (selectedExportFields.includes('rollNo')) row.push(s.rollNo);
      if (selectedExportFields.includes('class')) row.push(getClassName(s.classId));
      
      formConfig.filter(f => f.enabled).forEach(field => {
        if (selectedExportFields.includes(field.id)) {
          let value = s.customData?.[field.id];
          if (value === undefined || value === null) {
              const id = field.id.toLowerCase();
              if (id.includes('name') && !id.includes('father')) value = s.name;
              else if (id.includes('father')) value = s.fatherName;
              else if (id.includes('phone') || id.includes('contact') || id.includes('mobile')) value = s.phone;
          }
          row.push(value || '-');
        }
      });

      if (selectedExportFields.includes('feeStatus')) row.push(s.feeStatus || 'Unpaid');
      return row;
    });

    (doc as any).autoTable({
      head: [headers],
      body: data,
      startY: 40,
      theme: 'grid',
      headStyles: { fillStyle: '#1e3a8a', textColor: 255 },
      styles: { fontSize: 8 }
    });

    doc.save(`${school.name}_Students_${new Date().toLocaleDateString()}.pdf`);
    setShowExportModal(false);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setDynamicFormData(student.customData || {});
    setSystemFormData({
      admissionNo: student.admissionNo || '',
      classId: student.classId || '',
      rollNo: student.rollNo || '',
      admissionDate: student.admissionDate || new Date().toISOString().split('T')[0],
      monthlyFee: String(student.monthlyFee || ''),
      discount: String(student.discountAmount || ''),
      status: student.status || 'Active'
    });
    setPhotoPreview(student.photoURL || student.customData?.photoURL || null);
    setShowEditModal(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    setIsAdmitting(true);
    try {
      // 1. Upload Photo if changed
      let photoURL = editingStudent.photoURL || editingStudent.customData?.photoURL || '';
      if (photoFile) {
          const path = `schools/${schoolId}/students/${Date.now()}_${photoFile.name}`;
          const { publicUrl } = await uploadFileToStorage(photoFile, path);
          photoURL = publicUrl;
      }

      const findKey = (term: string) => Object.keys(dynamicFormData).find(k => k.toLowerCase().includes(term));
      const nameKey = findKey('student') || findKey('full') || findKey('name');
      const fatherKey = findKey('father') || findKey('guardian');
      const phoneKey = findKey('phone') || findKey('mobile') || findKey('contact');

      const fullName = nameKey ? dynamicFormData[nameKey] : editingStudent.name;
      const fatherName = fatherKey ? dynamicFormData[fatherKey] : editingStudent.fatherName;
      const phone = phoneKey ? dynamicFormData[phoneKey] : editingStudent.phone;

      await updateStudent(schoolId, editingStudent.id, {
        name: fullName,
        rollNo: systemFormData.rollNo,
        classId: systemFormData.classId,
        fatherName: fatherName,
        phone: phone,
        monthlyFee: Number(systemFormData.monthlyFee) || 0,
        discountAmount: Number(systemFormData.discount) || 0,
        status: systemFormData.status,
        photoURL: photoURL,
        customData: {
          ...editingStudent.customData,
          ...dynamicFormData,
          photoURL: photoURL
        }
      });
      
      logAction('Update Student', `Updated profile of ${fullName} (Roll: ${systemFormData.rollNo})`);
      
      alert("Student Updated Successfully!");
      setShowEditModal(false);
      setEditingStudent(null);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update student.");
    } finally {
      setIsAdmitting(false);
    }
  };

  const toggleExportField = (id: string) => {
    setSelectedExportFields(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if(searchTerm) setLocalSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    setVisibleCount(30); // Reset pagination on filter/search
  }, [localSearch, classFilter]);

  // --- ACTIONS ---

  const deleteFormConfiguration = async () => {
      alert('Testing delete...');
      setIsSavingConfig(true);
      try {
          await updateSchoolBranding(schoolId, {
              admissionFormConfig: [],
              admissionFormSettings: { pageSize: 'a4', pageLayout: 'single', showChecklist: false },
              admissionFormOverlayConfig: { templateUrl: '', pages: [], elements: {} }
          });
          setFormConfig([]);
          alert("Form deleted successfully!");
      } catch (error) {
          alert("Failed to delete configuration.");
      } finally {
          setIsSavingConfig(false);
      }
  };

  const saveFormConfiguration = async () => {
    setIsSavingConfig(true);
    try {
        await updateSchoolBranding(schoolId, {
            admissionFormConfig: formConfig,
            admissionFormSettings: { pageSize, pageLayout, showChecklist }
        });
        logAction('Update Form Schema', `Updated admission form configuration and layout`, 'Settings');
        alert("Form Schema Saved!");
    } catch (error) {
        alert("Failed to save configuration.");
    } finally {
        setIsSavingConfig(false);
    }
  };

  const toggleField = (id: string) => {
      setFormConfig(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const toggleRequired = (id: string) => {
      setFormConfig(prev => prev.map(f => f.id === id ? { ...f, required: !f.required } : f));
  };

  const toggleSection = (section: string, enabled: boolean) => {
      setFormConfig(prev => prev.map(f => (f.section || 'other') === section ? { ...f, enabled } : f));
  };

  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return 'N/A';
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };
  
  const handleDeleteStudent = (id: string) => {
    setIsBulkAction(false);
    setStudentToDelete(id);
    setShowDeleteModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedStudents.length === 0) return;
    setIsBulkAction(true);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!isBulkAction && !studentToDelete) return;
    if (isBulkAction && selectedStudents.length === 0) return;
    
    const idsToDelete = isBulkAction ? [...selectedStudents] : [studentToDelete!];
    
    // Optimistic Update: Remove from local view immediately
    // setActiveStudents(prev => prev.filter(s => !idsToDelete.includes(s.id)));
    setShowDeleteModal(false);

    try {
      const remainingStudents = students.filter(s => !idsToDelete.includes(s.id));
      
      for (const id of idsToDelete) {
        const student = students.find(s => s.id === id);
        if (student) {
          // Delete photo from storage if it exists
          const photoUrl = student.photoURL || student.customData?.photoURL;
          if (photoUrl) {
            const path = extractPathFromStorageUrl(photoUrl);
            if (path) {
              await deleteFileFromStorage(path);
            }
          }
          await deleteStudent(schoolId, id);
          logAction('Delete Student', `Deleted student ${student.name} (Roll: ${student.rollNo})`);

          // Cascade Delete: If this was the last student for a parent, delete the parent record too
          if (student.parentId) {
            const parentStillHasChildren = remainingStudents.some(s => s.parentId === student.parentId);
            if (!parentStillHasChildren) {
              // Double check if we haven't already deleted this parent in this loop
              // (though deleteParent is idempotent, it's cleaner)
              await deleteParent(schoolId, student.parentId);
              logAction('Cascade Delete Parent', `Deleted parent record as no more students were linked.`);
            }
          }
        }
      }
      
      if (isBulkAction) {
        setSelectedStudents([]);
      } else {
        setStudentToDelete(null);
      }
      setIsBulkAction(false);
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Failed to delete student record(s).");
    }
  };

  // --- KPI CALCULATIONS ---
  const totalCount = activeStudents.length;
  const boysCount = useMemo(() => activeStudents.filter(s => (s.gender || s.customData?.gender || '').toLowerCase() === 'male').length, [activeStudents]);
  const girlsCount = useMemo(() => activeStudents.filter(s => (s.gender || s.customData?.gender || '').toLowerCase() === 'female').length, [activeStudents]);


  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generatedCreds, setGeneratedCreds] = useState<{loginId: string, name: string, schoolId: string} | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // --- ADMISSION HANDLERS ---
  const handleDynamicChange = (id: string, value: any) => {
      const field = formConfig.find(f => f.id === id);
      let processedValue = value;

      if (field?.type === 'number') {
          // Strict integer validation: remove anything that isn't a digit
          processedValue = value.replace(/[^0-9]/g, '');
      }

      setDynamicFormData(prev => ({ ...prev, [id]: processedValue }));
      // Clear error when user types
      if (formErrors[id]) {
          setFormErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[id];
              return newErrors;
          });
      }
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setSystemFormData(prev => ({ ...prev, [name]: value }));
      // Clear error when user types
      if (formErrors[name]) {
          setFormErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[name];
              return newErrors;
          });
      }
  };

  const getFieldType = (field: FormFieldConfig) => {
    const label = field.label.toLowerCase();
    const id = field.id.toLowerCase();
    
    if (label.includes('gender') || id.includes('gender')) return 'select';
    if (label.includes('religion') || id.includes('religion')) return 'select';
    if (label.includes('phone') || id.includes('phone') || label.includes('mobile')) return 'tel';
    if (label.includes('email') || id.includes('email')) return 'email';
    if (label.includes('date') || id.includes('date')) return 'date';
    
    return field.type;
  };

  const getFieldOptions = (field: FormFieldConfig) => {
      const label = field.label.toLowerCase();
      const id = field.id.toLowerCase();
      
      if (label.includes('gender') || id.includes('gender')) return ['Male', 'Female', 'Other'];
      if (label.includes('religion') || id.includes('religion')) return ['Islam', 'Christianity', 'Hinduism', 'Other'];
      
      return field.options;
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          try {
              const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });
              const reader = new FileReader();
              reader.onload = (event) => {
                  const imageData = event.target?.result as string;
                  setPhotoPreview(imageData);
                  setPhotoFile(compressed);
              };
              reader.readAsDataURL(compressed);
          } catch (error) {
              console.error("Compression failed", error);
          }
      }
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
      try {
          const path = `schools/${schoolId}/students/uploads/${Date.now()}_${file.name}`;
          const { publicUrl } = await uploadFileToStorage(file, path);
          handleDynamicChange(fieldId, publicUrl);
      } catch (error) {
          console.error("File upload failed", error);
          alert("Failed to upload file.");
      }
  };

  const validateForm = () => {
      const errors: Record<string, string> = {};
      
      // System Fields Validation
      if (!systemFormData.classId) errors.classId = "Class is required";
      
      // Dynamic Fields Validation (Required fields)
      formConfig.forEach(field => {
          if (field.required && field.enabled && !dynamicFormData[field.id]) {
              errors[field.id] = `${field.label} is required`;
          }
      });

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const submitAdmission = async () => {
      if (!validateForm()) {
          alert("Please fill in all required fields.");
          return;
      }

      setIsAdmitting(true);
      try {
          // 1. Upload Photo if exists
          let photoURL = '';
          if (photoFile) {
              const path = `schools/${schoolId}/students/${Date.now()}_${photoFile.name}`;
              const { publicUrl } = await uploadFileToStorage(photoFile, path);
              photoURL = publicUrl;
          }

          const nameKey = Object.keys(dynamicFormData).find(k => k.toLowerCase().includes('name') && !k.toLowerCase().includes('father') && !k.toLowerCase().includes('mother'));
          const fatherNameKey = Object.keys(dynamicFormData).find(k => k.toLowerCase().includes('father') && k.toLowerCase().includes('name'));
          const phoneKey = Object.keys(dynamicFormData).find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile') || k.toLowerCase().includes('contact'));
          const cnicKey = Object.keys(dynamicFormData).find(k => k.toLowerCase().includes('cnic'));
          const addressKey = Object.keys(dynamicFormData).find(k => k.toLowerCase().includes('address'));
          const occupationKey = Object.keys(dynamicFormData).find(k => k.toLowerCase().includes('occupation'));

          const fullName = nameKey ? dynamicFormData[nameKey] : 'Unknown Student';
          const fatherName = fatherNameKey ? dynamicFormData[fatherNameKey] : '';
          const phone = phoneKey ? dynamicFormData[phoneKey] : '';
          const cnic = cnicKey ? dynamicFormData[cnicKey] : '';

          let parentId = '';
          if (cnic) {
              const existingParent = parents.find(p => p.cnic === cnic);
              if (existingParent) {
                  parentId = existingParent.id;
              } else {
                  // Create new parent automatically
                  try {
                      const newParent = await addParent(schoolId, {
                          fatherName: fatherName || 'Unknown Parent',
                          cnic: cnic,
                          phone: phone,
                          email: '',
                          address: addressKey ? dynamicFormData[addressKey] : '',
                          occupation: occupationKey ? dynamicFormData[occupationKey] : ''
                      });
                      parentId = newParent.id;
                  } catch (e) {
                      console.error("Failed to create parent automatically", e);
                  }
              }
          }

          const processedDynamicData = { ...dynamicFormData };
          formConfig.forEach(field => {
              if (field.type === 'number' && processedDynamicData[field.id]) {
                  processedDynamicData[field.id] = Number(processedDynamicData[field.id]);
              }
          });

          const loginId = processedDynamicData.studentId || generateLoginId(fullName);

          const payload = {
              name: fullName,
              rollNo: systemFormData.rollNo || `RN-${Date.now().toString().slice(-4)}`,
              classId: systemFormData.classId,
              fatherName: fatherName,
              phone: phone,
              feeStatus: 'Unpaid',
              monthlyFee: Number(systemFormData.monthlyFee) || 0,
              discountAmount: Number(systemFormData.discount) || 0,
              photoURL: photoURL,
              category: 'New', 
              admissionNo: systemFormData.admissionNo || `ADM-${Date.now().toString().slice(-6)}`,
              customData: {
                  ...processedDynamicData, 
                  photoURL: photoURL,
                  admissionDate: systemFormData.admissionDate
              },
              parentId: parentId || null,
              cnic: cnic,
              loginId: loginId
          };

          await addStudent(schoolId, payload);
          
          logAction('New Admission', `Admitted student ${fullName} (Roll: ${systemFormData.rollNo}) in class ${getClassName(systemFormData.classId)}`);
          
          // Show Success Modal with Login ID
          setGeneratedCreds({ loginId, name: fullName, schoolId: school?.schoolCode || schoolId.slice(0, 8) });
          
          // Reset Form
          setDynamicFormData({});
          setSystemFormData(INITIAL_SYSTEM_STATE);
          setPhotoFile(null);
          setPhotoPreview(null);
          setFormErrors({});
          
      } catch (error) {
          console.error("Admission Error:", error);
          alert("Failed to admit student. Please try again.");
      } finally {
          setIsAdmitting(false);
      }
  };

  // --- STYLES FOR DIGITAL FORM ---
  const paperInputStyle = "w-full p-2 bg-white border border-slate-300 rounded-none focus:border-black focus:ring-1 focus:ring-black outline-none font-bold text-slate-800 text-sm placeholder-slate-400 uppercase tracking-wide";
  const paperLabelStyle = "text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 block ml-1";
  const paperSectionTitle = "text-sm font-black text-white bg-slate-900 px-3 py-2 uppercase tracking-widest mb-4 flex items-center gap-2 shadow-sm";

  // Group fields by section for the digital form renderer
  const groupedFields = useMemo(() => {
    const groups: Record<string, FormFieldConfig[]> = {};
    formConfig.forEach(f => {
        if (!f.enabled) return;
        const sec = f.section || 'other';
        if (!groups[sec]) groups[sec] = [];
        groups[sec].push(f);
    });
    return groups;
  }, [formConfig]);

  // --- PRINT MODE ---
  if (showPrintPreview) {
      return (
          <div className="fixed inset-0 z-[2000] bg-slate-900 overflow-y-auto">
              <div className="sticky top-0 left-0 right-0 bg-slate-900 text-white p-4 flex justify-between items-center shadow-md print:hidden z-50">
                  <div className="flex items-center gap-4">
                      <button onClick={() => { setShowPrintPreview(false); setPrintBlankForm(false); }} className="p-2 hover:bg-white/10 dark:bg-slate-800/10 rounded-full transition-colors"><X size={24}/></button>
                      <h2 className="font-black uppercase tracking-widest text-sm">Print Preview</h2>
                  </div>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => {
                            localStorage.setItem('print_student_data', JSON.stringify({ 
                                school, 
                                formConfig, 
                                isBlank: printBlankForm, 
                                pageLayout 
                            }));
                            window.open('/print/admission-form', '_blank');
                        }}
                        className="px-8 py-3 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-3 rounded-lg shadow-lg shadow-emerald-900/20"
                      >
                          <Printer size={20} weight="bold"/> Print in New Tab
                      </button>
                  </div>
              </div>
              
              <div className="flex justify-center p-8 print:p-0" id="printable-form-container">
                  <div className="bg-white dark:bg-slate-800 shadow-2xl print:shadow-none">
                      <PrintableAdmissionForm school={school} config={formConfig} isBlank={printBlankForm} showOverlays={false} />
                      {pageLayout === 'double' && (
                        <>
                            <div className="border-t-2 border-dashed border-slate-300 my-8 no-print"></div>
                            <PrintableAdmissionForm school={school} config={formConfig} isBlank={printBlankForm} showOverlays={false} />
                        </>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER STUDENT PROFILE ---
  if (viewProfileId) {
      return (
          <StudentProfile 
              studentId={viewProfileId} 
              schoolId={schoolId} 
              school={school}
              classes={classes}
              formConfig={formConfig}
              onBack={() => setViewProfileId(null)} 
          />
      );
  }

  if (isMobile && view === 'directory') {
    return (
      <div className="bg-[#FCFBF8] dark:bg-slate-900 min-h-screen pb-32 font-sans">
        {/* Premium Mobile Header */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <button 
              onClick={() => onNavigate?.('dashboard')}
              className="w-10 h-10 rounded-xl bg-[#1e3a8a]/10 dark:bg-white/10 flex items-center justify-center text-[#1e3a8a] dark:text-white border border-[#1e3a8a]/20 active:scale-90 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-[#1e3a8a] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(30,58,138,0.1)' }}>
                Students
              </h1>
              <div className="flex flex-col mt-1">
                <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Principal App • Student Directory</p>
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
                    <UserCircle size={28} className="text-[#1e3a8a] dark:text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full border-2 border-[#1e3a8a] flex items-center justify-center shadow-lg">
                <Gear size={10} className="text-[#1e3a8a] dark:text-white" />
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH STUDENTS..."
                value={localSearch} 
                onChange={e => setLocalSearch(e.target.value)} 
                className="w-full p-4 pl-12 bg-[#FCFBF8] dark:bg-slate-900 shadow-[inset_0_2px_8px_rgba(30,58,138,0.04)] border border-[#E5E0D8] dark:border-slate-700 rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all"
              />
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        <div className="px-4 mt-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#D4AF37]/20 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-2 -top-2 w-12 h-12 bg-[#D4AF37]/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-1 relative z-10">Total</p>
              <p className="text-xl font-black text-[#1e3a8a] dark:text-white relative z-10">{totalCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#D4AF37]/20 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-2 -top-2 w-12 h-12 bg-cyan-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-[9px] font-black text-cyan-600/60 uppercase tracking-widest mb-1 relative z-10">Boys</p>
              <p className="text-xl font-black text-cyan-600 relative z-10">{boysCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#D4AF37]/20 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-2 -top-2 w-12 h-12 bg-pink-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-[9px] font-black text-pink-600/60 uppercase tracking-widest mb-1 relative z-10">Girls</p>
              <p className="text-xl font-black text-pink-600 relative z-10">{girlsCount}</p>
            </div>
          </div>

          {/* Filter Section */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => setClassFilter('all')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${classFilter === 'all' ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white dark:bg-slate-800 text-slate-400 border-[#D4AF37]/20'}`}
            >
              All Classes
            </button>
            {classes.map(c => (
              <button 
                key={c.id}
                onClick={() => setClassFilter(c.id)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${classFilter === c.id ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white dark:bg-slate-800 text-slate-400 border-[#D4AF37]/20'}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Student Photos Button */}
          <button
            onClick={() => onNavigate?.('students_gallery')}
            className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white p-4 rounded-2xl shadow-lg flex items-center justify-between active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Camera size={20} className="text-[#D4AF37]" weight="fill" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black tracking-wide">Student Photos</p>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Capture & Upload</p>
              </div>
            </div>
            <CaretRight size={20} className="text-[#D4AF37]" weight="bold" />
          </button>

          {/* List Section */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                Student Directory
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {activeStudents.length > 0 ? activeStudents.slice(0, visibleCount).map(s => (
                <MobileStudentCard 
                    key={s.id} 
                    student={s} 
                    onViewProfile={setViewProfileId} 
                />
              )) : (
                <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-[#D4AF37]/20 border-dashed">
                  <Users size={48} className="text-[#D4AF37]/40 mx-auto mb-4" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No students found</p>
                </div>
              )}
              
              {activeStudents.length > visibleCount && (
                <button 
                  onClick={() => setVisibleCount(prev => prev + 30)}
                  className="w-full py-6 text-[10px] font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
                >
                  Load More Records
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1920px] mx-auto animate-in fade-in duration-300 pb-20">
      {/* Success Modal for Credentials */}
      {generatedCreds && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-none shadow-2xl border border-slate-200 p-8 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <Check size={32} weight="bold" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Admission Successful!</h3>
            <p className="text-sm text-slate-500 mb-6">Student record has been added to the system. Please share these login details with the student for app access.</p>
            
            <div className="bg-slate-50 p-6 rounded-none text-left space-y-4 mb-8 border border-slate-200">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Student Name</p>
                <p className="font-bold text-slate-900">{generatedCreds.name}</p>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">School ID</p>
                <p className="font-mono font-black text-lg text-blue-600">{generatedCreds.schoolId}</p>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Login ID</p>
                <p className="font-mono font-black text-lg text-emerald-600">{generatedCreds.loginId}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setGeneratedCreds(null)}
              className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all rounded-none"
            >
              Done
            </button>
          </div>
        </div>
      )}
        
        {/* --- MAIN BASE CONTAINER --- */}
        <div className="bg-white dark:bg-slate-800 rounded-none shadow-sm border-2 border-slate-800 dark:border-slate-700 overflow-hidden flex flex-col min-h-[90vh]">
            
            {/* --- HEADER --- */}
            <div className="p-10 bg-gradient-to-br from-[#1e3a8a] to-[#172554] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 dark:bg-slate-800/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 dark:bg-slate-800/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md text-white flex items-center justify-center rounded-2xl shadow-lg border border-white/30">
                            {view === 'directory' && <Users size={40} weight="fill" />}
                            {view === 'admissions' && <IdentificationCard size={40} weight="fill" />}
                            {view === 'form_builder' && <Gear size={40} weight="fill" />}
                            {view === 'forms' && <FileText size={40} weight="fill" />}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase leading-none">
                                {view === 'directory' && 'Student Directory'}
                                {view === 'admissions' && 'New Admission'}
                                {view === 'form_builder' && 'Form Builder'}
                                {view === 'forms' && 'Printable Forms'}
                            </h1>
                            <p className="text-blue-200 text-xs font-bold mt-2 uppercase tracking-[0.2em]">
                                {view === 'directory' && 'Comprehensive Student Records Management'}
                                {view === 'admissions' && 'Enrollment & Registration Portal'}
                                {view === 'form_builder' && 'Custom Admission Form Configuration'}
                                {view === 'forms' && 'Official Document Templates'}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <span className="bg-white/20 dark:bg-slate-800/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                                    {view === 'directory' && `${totalCount} Records Found`}
                                    {view === 'admissions' && 'Academic Session 2024-25'}
                                    {view === 'form_builder' && 'Dynamic Fields Active'}
                                    {view === 'forms' && '5 Templates Ready'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- HEADER ACTIONS --- */}
                    <div className="flex items-center gap-4">
                        {view === 'admissions' && onNavigate && (
                            <>
                                <button 
                                    onClick={() => setShowBulkImportModal(true)}
                                    className="bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl flex items-center gap-3 active:scale-95"
                                >
                                    <UploadSimple size={20} weight="bold"/> Bulk Import
                                </button>
                                <button 
                                    onClick={() => onNavigate('students_form_builder')}
                                    className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-md text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 dark:bg-slate-800/20 transition-all border border-white/20 flex items-center gap-3 active:scale-95"
                                >
                                    <Gear size={20} weight="bold"/> Configure
                                </button>
                            </>
                        )}

                        {view === 'form_builder' && (
                          <div className="flex items-center gap-3">
                             {onNavigate && (
                                <button 
                                    onClick={() => onNavigate('students_admissions')}
                                    className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-md text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 dark:bg-slate-800/20 transition-all border border-white/20 active:scale-95"
                                >
                                    Back
                                </button>
                             )}
                             <button 
                                onClick={async () => {
                                    if (confirm('Are you sure you want to reset the form configuration to system defaults? This will overwrite your current settings.')) {
                                        setIsSavingConfig(true);
                                        try {
                                            await updateSchoolBranding(schoolId, { 
                                                admissionFormConfig: BUILTIN_ADMISSION_CONFIG,
                                                admissionFormOverlayConfig: []
                                            });
                                            setFormConfig(BUILTIN_ADMISSION_CONFIG);
                                            alert("Form configuration reset successfully!");
                                            logAction('Reset Form Config', 'Reverted admission form configuration to default', 'Settings');
                                        } catch (error) {
                                            console.error("Reset failed", error);
                                            alert("Failed to reset configuration.");
                                        } finally {
                                            setIsSavingConfig(false);
                                        }
                                    }
                                }}
                                className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-md text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500/20 transition-all border border-white/20 flex items-center gap-3 active:scale-95"
                             >
                                <WarningCircle size={20} weight="bold"/> Reset
                             </button>
                             <button onClick={saveFormConfiguration} disabled={isSavingConfig} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-3">
                                {isSavingConfig ? <CircleNotch className="animate-spin" size={20} weight="bold"/> : <FloppyDisk size={20} weight="bold"/>} Save Changes
                             </button>
                          </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CONTENT BODY --- */}
            <div className="p-8 bg-white dark:bg-slate-800 min-h-[500px]">

                {/* 1. FORM BUILDER VIEW */}
                {view === 'form_builder' && (
                    <div className="max-w-7xl mx-auto space-y-8">
                        
                        {/* --- PAPER FORM TEMPLATE UPLOAD (NEW) --- */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-[#1e3a8a] shadow-sm overflow-hidden">
                            <div className="bg-slate-900 p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 dark:bg-slate-800/10 rounded text-white"><IdentificationCard size={20} weight="fill"/></div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Paper Form Design</h3>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Upload your school's physical admission form to map digital fields onto it</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        ref={templateInputRef} 
                                        onChange={handleTemplateUpload} 
                                        className="hidden" 
                                        multiple
                                    />
                                    <button 
                                        onClick={() => templateInputRef.current?.click()}
                                        disabled={isUploadingTemplate}
                                        className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-1.5 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isUploadingTemplate ? <CircleNotch size={14} className="animate-spin" /> : <UploadSimple size={14} weight="bold"/>}
                                        {isUploadingTemplate ? 'Uploading...' : 'Upload Pages'}
                                    </button>
                                    <button 
                                        onClick={deleteFormConfiguration}
                                        className="bg-rose-600 text-white px-4 py-1.5 font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <Trash size={14} weight="bold"/> Delete Form
                                    </button>
                                </div>
                            </div>
                            
                            {school.admissionFormOverlayConfig?.pages && school.admissionFormOverlayConfig.pages.length > 0 ? (
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-4 overflow-x-auto pb-2">
                                        {school.admissionFormOverlayConfig.pages.map((page: string, idx: number) => (
                                            <div key={idx} className="w-24 h-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden rounded-lg flex-shrink-0 relative group">
                                                <img 
                                                    src={page} 
                                                    alt={`Page ${idx + 1}`} 
                                                    className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                    <span className="text-[10px] font-black text-white uppercase">Page {idx + 1}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-1">{school.admissionFormOverlayConfig.pages.length} Pages Uploaded</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed max-w-md">
                                            These pages will be used as the background for your admission form. You can map digital fields onto them manually.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/50/50 border-t border-slate-100 dark:border-slate-800">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                                        <IdentificationCard size={24} weight="thin" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No paper form design uploaded yet</p>
                                </div>
                            )}
                        </div>

                        {/* --- ADD CUSTOM FIELD CARD (REGISTER THEME) --- */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-[#1e3a8a] shadow-sm overflow-hidden">
                            <div className="bg-[#1e3a8a] p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 dark:bg-slate-800/10 rounded text-white"><PlusCircle size={20} weight="fill"/></div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Add Custom Fields</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsAddingField(!isAddingField)}
                                        className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-4 py-1.5 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-[#1e3a8a] shadow-sm active:scale-95"
                                    >
                                        {isAddingField ? 'Close Panel' : 'New Field'}
                                    </button>
                                </div>
                            </div>

                            {isAddingField && (
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t-2 border-[#1e3a8a] grid grid-cols-1 md:grid-cols-4 gap-6 items-end animate-in fade-in slide-in-from-top-2">
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Field Label</label>
                                        <input 
                                            type="text" 
                                            value={newField.label}
                                            onChange={e => setNewField({...newField, label: e.target.value})}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-bold text-sm focus:outline-none focus:border-[#1e3a8a] transition-colors"
                                            placeholder="E.G. TRANSPORT ROUTE"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Section</label>
                                        <select 
                                            value={newField.section}
                                            onChange={e => setNewField({...newField, section: e.target.value})}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-bold text-sm focus:outline-none focus:border-[#1e3a8a] transition-colors uppercase tracking-widest"
                                        >
                                            <option value="student">Student Info</option>
                                            <option value="academic">Academic Info</option>
                                            <option value="parent">Parent Info</option>
                                            <option value="other">Other Info</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Input Type</label>
                                        <select 
                                            value={newField.type}
                                            onChange={e => setNewField({...newField, type: e.target.value})}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-bold text-sm focus:outline-none focus:border-[#1e3a8a] transition-colors uppercase tracking-widest"
                                        >
                                            <option value="text">Text Input</option>
                                            <option value="number">Number</option>
                                            <option value="date">Date Picker</option>
                                            <option value="textarea">Text Area (Long)</option>
                                            <option value="select">Dropdown (Yes/No)</option>
                                            <option value="file">File Upload</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <button 
                                            onClick={addCustomField}
                                            className="w-full py-3 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest border border-[#1e3a8a] shadow-md hover:bg-blue-900 transition-all active:scale-95"
                                        >
                                            Add Field
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- FIELD CONFIGURATION GRID --- */}
                        <div className="space-y-6">
                            {['student', 'academic', 'parent', 'other'].map(section => {
                                const sectionFields = formConfig.filter(f => (f.section || 'other') === section);
                                if (sectionFields.length === 0) return null;

                                const allEnabled = sectionFields.every(f => f.enabled);
                                const someEnabled = sectionFields.some(f => f.enabled);
                                const isCollapsed = collapsedSections[section];

                                return (
                                    <div key={section} className="bg-white dark:bg-slate-800 border-2 border-[#1e3a8a] shadow-sm overflow-hidden">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b-2 border-[#1e3a8a] flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={() => setCollapsedSections(prev => ({...prev, [section]: !prev[section]}))}
                                                    className="p-2 bg-[#1e3a8a] text-white rounded-none hover:bg-blue-900 transition-colors"
                                                >
                                                    {isCollapsed ? <CaretRight size={18} weight="bold"/> : <CaretDown size={18} weight="bold"/>}
                                                </button>
                                                <div>
                                                    <h4 className="font-black text-[#1e3a8a] uppercase tracking-tighter text-lg flex items-center gap-2">
                                                        {section === 'student' && <StudentIcon size={20} weight="fill"/>}
                                                        {section === 'academic' && <GraduationCap size={20} weight="fill"/>}
                                                        {section === 'parent' && <Users size={20} weight="fill"/>}
                                                        {section === 'other' && <Gear size={20} weight="fill"/>}
                                                        {section === 'academic' ? 'Academic Information' : 
                                                         section === 'student' ? 'Student Information' :
                                                         section === 'parent' ? 'Parent Information' : 
                                                         section === 'other' ? 'Other Important Information' : section}
                                                    </h4>
                                                </div>
                                            </div>

                                            {/* SECTION TOGGLE */}
                                            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2">
                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Section Status</span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSection(section, !allEnabled);
                                                    }}
                                                    className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${allEnabled ? 'bg-blue-600' : someEnabled ? 'bg-blue-300' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white dark:bg-slate-800 rounded-full shadow-sm transition-transform duration-200 ${allEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {!isCollapsed && (
                                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                                                {sectionFields.map(field => (
                                                    <div 
                                                        key={field.id} 
                                                        className={`
                                                            relative p-4 border transition-all flex items-start justify-between group select-none
                                                            ${field.enabled 
                                                                ? 'bg-blue-50/30 border-[#1e3a8a] shadow-sm' 
                                                                : 'bg-white border-slate-200 opacity-60'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex-1 pr-4">
                                                            <div className="mb-2">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter block mb-1">Field Label</span>
                                                                <input 
                                                                    type="text" 
                                                                    value={field.label}
                                                                    onChange={(e) => {
                                                                        const newConfig = formConfig.map(f => 
                                                                            f.id === field.id ? { ...f, label: e.target.value } : f
                                                                        );
                                                                        setFormConfig(newConfig);
                                                                    }}
                                                                    className={`w-full bg-transparent font-bold text-xs uppercase tracking-tight outline-none border-b border-transparent focus:border-[#1e3a8a] transition-all ${field.enabled ? 'text-[#1e3a8a]' : 'text-slate-500 dark:text-slate-400'}`}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[9px] font-black px-2 py-0.5 border border-slate-200 uppercase tracking-widest ${field.enabled ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-500 dark:text-slate-400'}`}>
                                                                    {field.type}
                                                                </span>
                                                                {field.required ? (
                                                                    <span className="text-[9px] font-black text-rose-600 flex items-center gap-0.5 uppercase tracking-widest">
                                                                        <Asterisk size={10} weight="bold"/> Required
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] font-black text-slate-400 flex items-center gap-0.5 uppercase tracking-widest">
                                                                        Optional
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-3">
                                                            {/* Enabled Toggle */}
                                                            <div 
                                                                className="flex flex-col items-end gap-1 cursor-pointer"
                                                                onClick={() => toggleField(field.id)}
                                                                title={field.enabled ? "Disable Field" : "Enable Field"}
                                                            >
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Visible</span>
                                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${field.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                                                    <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white dark:bg-slate-800 rounded-full shadow-sm transition-transform ${field.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                                </div>
                                                            </div>

                                                            {/* Required Toggle */}
                                                            <div 
                                                                className="flex flex-col items-end gap-1 cursor-pointer"
                                                                onClick={() => toggleRequired(field.id)}
                                                                title={field.required ? "Make Optional" : "Make Required"}
                                                            >
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Required</span>
                                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${field.required ? 'bg-rose-600' : 'bg-slate-300'}`}>
                                                                    <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white dark:bg-slate-800 rounded-full shadow-sm transition-transform ${field.required ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 2. DIRECTORY VIEW */}
                {view === 'directory' && (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={`kpi-skeleton-${i}`} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-32 animate-pulse">
                                        <div className="flex justify-between items-start">
                                            <div className="w-24 h-3 bg-slate-100 rounded"></div>
                                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl"></div>
                                        </div>
                                        <div className="mt-4 w-16 h-8 bg-slate-100 rounded"></div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-none border-2 border-slate-800 dark:border-slate-800 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform"></div>
                                        <div className="relative z-10 flex justify-between items-start">
                                            <span className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Total Students</span>
                                            <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20"><Users size={24} weight="fill"/></div>
                                        </div>
                                        <div className="relative z-10"><h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{totalCount}</h3></div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-none border-2 border-slate-800 dark:border-slate-800 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-50 rounded-full group-hover:scale-150 transition-transform"></div>
                                        <div className="relative z-10 flex justify-between items-start">
                                            <span className="text-[10px] font-black text-cyan-700 uppercase tracking-[0.2em]">Male Students</span>
                                            <div className="w-12 h-12 bg-cyan-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-900/20"><GenderMale size={24} weight="fill"/></div>
                                        </div>
                                        <div className="relative z-10"><h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{boysCount}</h3></div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-none border-2 border-slate-800 dark:border-slate-800 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-xl transition-all">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-50 rounded-full group-hover:scale-150 transition-transform"></div>
                                        <div className="relative z-10 flex justify-between items-start">
                                            <span className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em]">Female Students</span>
                                            <div className="w-12 h-12 bg-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-900/20"><GenderFemale size={24} weight="fill"/></div>
                                        </div>
                                        <div className="relative z-10"><h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{girlsCount}</h3></div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Search & Table */}
                        <div className="bg-white dark:bg-slate-800 rounded-none shadow-sm border-2 border-slate-800 dark:border-slate-700 overflow-hidden flex flex-col mt-10">
                            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50/50 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#1e3a8a] text-white rounded-xl flex items-center justify-center shadow-lg">
                                        <ListChecks size={20} weight="fill"/>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Student Register</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage and filter student records</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-center lg:justify-end gap-3 w-full lg:w-auto">
                                    <button 
                                        onClick={() => setShowTableConfigModal(true)}
                                        className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95"
                                    >
                                        <Gear size={18} weight="bold"/> Configure
                                    </button>
                                    <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center w-full sm:w-48 shadow-sm">
                                        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full bg-transparent text-slate-700 dark:text-slate-200 font-black text-[10px] outline-none uppercase tracking-widest cursor-pointer">
                                            <option value="all">All Classes</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                                        </select>
                                        <Funnel size={16} weight="bold" className="text-slate-400 ml-2"/>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center w-full sm:w-64 shadow-sm">
                                        <input type="text" placeholder="SEARCH RECORDS..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="w-full bg-transparent text-slate-700 dark:text-slate-200 font-black text-[10px] outline-none uppercase tracking-widest placeholder-slate-300"/>
                                        <MagnifyingGlass size={16} weight="bold" className="text-slate-400 ml-2"/>
                                    </div>
                                    {selectedStudents.length > 0 && (
                                        <div className="flex gap-2">
                                            <div className="bg-blue-50 text-[#1e3a8a] px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center border border-blue-100 whitespace-nowrap">
                                                {selectedStudents.length} Selected
                                            </div>
                                            <button 
                                                onClick={handleBulkDelete}
                                                className="bg-rose-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 active:scale-95"
                                            >
                                                <Trash size={18} weight="bold"/> Delete
                                            </button>
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => {
                                            setSelectedExportFields(visibleTableFields);
                                            setShowExportModal(true);
                                        }} 
                                        className="bg-[#1e3a8a] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#172554] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95"
                                    >
                                        <Printer size={18} weight="bold"/> Export
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700">
                                <table className="w-full text-left border-collapse table-auto">
                                    <thead>
                                        <tr className="bg-slate-100 border-b-2 border-slate-300 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                            <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap w-[50px] text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 cursor-pointer accent-[#1e3a8a]"
                                                    checked={activeStudents.length > 0 && selectedStudents.length === activeStudents.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStudents(activeStudents.map(s => s.id));
                                                        } else {
                                                            setSelectedStudents([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                                {visibleTableFields.map(fieldId => {
                                                const field = allAvailableFields.find(f => f.id === fieldId);
                                                let widthClass = "min-w-[150px]";
                                                if (fieldId === 'rollNo') widthClass = "w-[80px]";
                                                if (fieldId === 'feeStatus') widthClass = "w-[120px]";
                                                if (fieldId === 'class') widthClass = "w-[120px]";
                                                
                                                return <th key={fieldId} className={`px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap ${widthClass}`}>{field?.label || fieldId}</th>
                                            })}
                                            <th className="px-4 py-4 text-right whitespace-nowrap w-[150px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={`skeleton-${i}`}>
                                                    <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap text-center">
                                                        <Skeleton variant="rect" className="w-4 h-4 mx-auto" />
                                                    </td>
                                                    {visibleTableFields.map(fieldId => (
                                                        <td key={`skeleton-field-${fieldId}-${i}`} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                {fieldId === 'name' && <Skeleton variant="circle" className="w-8 h-8 shrink-0" />}
                                                                <Skeleton variant="text" className="w-24 h-3" />
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Skeleton variant="rect" className="w-8 h-8" />
                                                            <Skeleton variant="rect" className="w-8 h-8" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : activeStudents.slice(0, visibleCount).map((s, index) => (
                                            <StudentRow 
                                                key={s.id}
                                                student={s}
                                                index={index}
                                                visibleTableFields={visibleTableFields}
                                                allAvailableFields={allAvailableFields}
                                                selectedStudents={selectedStudents}
                                                onToggleSelect={(id, checked) => {
                                                    if (checked) {
                                                        setSelectedStudents(prev => [...prev, id]);
                                                    } else {
                                                        setSelectedStudents(prev => prev.filter(item => item !== id));
                                                    }
                                                }}
                                                getClassName={getClassName}
                                                onViewProfile={setViewProfileId}
                                                onEdit={handleEditStudent}
                                                onDelete={handleDeleteStudent}
                                                canEdit={canEdit}
                                                canDelete={canDelete}
                                                sectionId={sectionId}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3">
                                {activeStudents.length > visibleCount && (
                                    <button 
                                        onClick={() => setVisibleCount(prev => prev + 30)}
                                        className="px-8 py-2 bg-[#1e3a8a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#172554] transition-all shadow-md active:translate-y-0.5"
                                    >
                                        Show More (+30)
                                    </button>
                                )}
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Showing {Math.min(visibleCount, activeStudents.length)} of {activeStudents.length} Records
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {/* 3. ADMISSIONS VIEW (Modern Principal Portal Theme) */}
                {view === 'admissions' && (
                    <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {/* Form Header */}
                            <div className="p-10 bg-gradient-to-br from-[#1e3a8a] to-[#172554] text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 dark:bg-slate-800/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 dark:bg-slate-800/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    <div className="flex items-center gap-6">
                                        {school.logoURL ? (
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                                                <img src={school.logoURL} alt="Logo" className="w-20 h-20 object-contain" />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 bg-white dark:bg-slate-800 text-[#1e3a8a] flex items-center justify-center font-black text-4xl rounded-2xl shadow-lg">
                                                {school.name[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-3xl font-black tracking-tight leading-none">{school.name}</h2>
                                            <p className="text-blue-200 text-sm font-bold mt-2 uppercase tracking-[0.2em]">Student Admission Form</p>
                                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                                 <span className="bg-white/20 dark:bg-slate-800/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Session 2024-25</span>
                                                 <div className="flex items-center gap-2 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md px-3 py-1 rounded-full">
                                                     <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Class:</span>
                                                     <select 
                                                         name="classId" 
                                                         value={systemFormData.classId || ''} 
                                                         onChange={handleSystemChange} 
                                                         className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                                                     >
                                                         <option value="" className="text-slate-800 dark:text-slate-100">Select Class</option>
                                                         {classes.map(c => <option key={c.id} value={c.id} className="text-slate-800 dark:text-slate-100">{c.name}</option>)}
                                                     </select>
                                                 </div>
                                                 <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                     <Check size={12} weight="bold" /> Official Form
                                                 </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Passport Photo Area */}
                                    <div className="flex flex-col items-center gap-4">
                                       <div 
                                           onClick={() => photoInputRef.current?.click()}
                                           className="w-32 h-40 bg-white/10 dark:bg-slate-800/10 backdrop-blur-md border-2 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/20 dark:bg-slate-800/20 transition-all relative group overflow-hidden shrink-0"
                                       >
                                           {photoPreview ? (
                                               <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                                           ) : (
                                               <div className="flex flex-col items-center gap-2">
                                                   <UserCircle size={40} weight="thin" className="text-blue-200" />
                                                   <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest px-4">Upload Student Photograph</p>
                                               </div>
                                           )}
                                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                               <Plus size={24} className="text-white" />
                                           </div>
                                           <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                                       </div>
                                       <div className="flex flex-col gap-2 w-full">
                                           <button 
                                               onClick={() => photoInputRef.current?.click()}
                                               className="w-full py-2 bg-white/10 dark:bg-slate-800/10 backdrop-blur-md text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/20 dark:bg-slate-800/20 transition-all border border-white/20 flex items-center justify-center gap-2 rounded-xl"
                                           >
                                               <UploadSimple size={14} weight="bold"/> Upload
                                           </button>
                                           <button 
                                               onClick={() => setShowCamera(true)}
                                               className="w-full py-2 bg-white/10 dark:bg-slate-800/10 backdrop-blur-md text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/20 dark:bg-slate-800/20 transition-all border border-white/20 flex items-center justify-center gap-2 rounded-xl"
                                           >
                                               <Camera size={14} weight="bold"/> Take Photo
                                           </button>
                                       </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Body - Modern Layout */}
                            <div className="p-10 space-y-12 bg-slate-50 dark:bg-slate-800/50/50">
                                {formConfig.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                                            <FileText size={40} weight="bold" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Admission Form Not Configured</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md mt-2">
                                            Please go to <span className="text-[#1e3a8a]">Form Builder</span> to upload your form design and configure fields.
                                        </p>
                                    </div>
                                ) : Object.entries(groupedFields).map(([sectionName, fields]) => {
                                    return (
                                        <div key={sectionName} className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a]/10 flex items-center justify-center text-[#1e3a8a]">
                                                    {sectionName === 'student' ? <UserCircle size={24} weight="bold" /> :
                                                     sectionName === 'academic' ? <GraduationCap size={24} weight="bold" /> :
                                                     sectionName === 'parent' ? <Users size={24} weight="bold" /> : 
                                                     <PlusCircle size={24} weight="bold" />}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                                                        {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Information
                                                    </h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Please provide accurate details below</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {(fields as FormFieldConfig[]).map((field) => {
                                                    const fieldType = getFieldType(field);
                                                    const fieldOptions = getFieldOptions(field) || field.options;
                                                    return (
                                                    <div key={field.id} className={`${fieldType === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                                                        </label>
                                                        {fieldType === 'select' ? (
                                                            <div className="relative">
                                                                <select 
                                                                    value={dynamicFormData[field.id] || ''}
                                                                    onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                                                    className={`w-full bg-white dark:bg-slate-800 border-2 p-4 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 transition-all appearance-none ${formErrors[field.id] ? 'border-rose-500 ring-rose-500/10' : 'border-slate-100 hover:border-slate-200 focus:border-[#1e3a8a]'}`}
                                                                >
                                                                    <option value="">Select Option</option>
                                                                    {fieldOptions?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                </select>
                                                                <CaretDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                            </div>
                                                        ) : fieldType === 'textarea' ? (
                                                            <textarea 
                                                                value={dynamicFormData[field.id] || ''}
                                                                onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                                                                className={`w-full bg-white dark:bg-slate-800 border-2 p-4 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 transition-all h-32 resize-none ${formErrors[field.id] ? 'border-rose-500 ring-rose-500/10' : 'border-slate-100 hover:border-slate-200 focus:border-[#1e3a8a]'}`} 
                                                            />
                                                        ) : fieldType === 'signature' || field.id.toLowerCase().includes('signature') ? (
                                                            <div className="flex items-center gap-4">
                                                                {dynamicFormData[field.id] ? (
                                                                    <div className="relative w-32 h-16 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                                                                        <img src={dynamicFormData[field.id]} alt="Signature" className="max-w-full max-h-full object-contain" />
                                                                        <button onClick={() => handleDynamicChange(field.id, '')} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600"><X size={12}/></button>
                                                                    </div>
                                                                ) : (
                                                                    <label className={`flex-1 flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed p-4 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors ${formErrors[field.id] ? 'border-rose-500' : 'border-slate-300'}`}>
                                                                        <UploadSimple size={20} className="text-slate-400" />
                                                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Upload Signature</span>
                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                            if (e.target.files && e.target.files[0]) handleFileUpload(field.id, e.target.files[0]);
                                                                        }} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <input 
                                                                type={fieldType}
                                                                value={dynamicFormData[field.id] || ''}
                                                                onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                                                                className={`w-full bg-white dark:bg-slate-800 border-2 p-4 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-[#1e3a8a]/10 transition-all ${formErrors[field.id] ? 'border-rose-500 ring-rose-500/10' : 'border-slate-100 hover:border-slate-200 focus:border-[#1e3a8a]'}`}
                                                                {...(fieldType === 'number' ? { 
                                                                    step: "1",
                                                                    inputMode: "numeric",
                                                                    pattern: "[0-9]*"
                                                                } : {})}
                                                            />
                                                        )}
                                                        {formErrors[field.id] && <p className="text-[10px] font-bold text-rose-500 mt-2 ml-1 flex items-center gap-1"><WarningCircle size={14} /> {formErrors[field.id]}</p>}
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Action Buttons */}
                                <div className="pt-10 flex flex-col md:flex-row gap-4">
                                    <button 
                                        onClick={() => onNavigate?.('directory')}
                                        className="flex-1 py-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                                    >
                                        Cancel & Go Back
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (!canAdd(sectionId)) {
                                                alert("You don't have permission to admit students.");
                                                return;
                                            }
                                            submitAdmission();
                                        }} 
                                        disabled={isAdmitting}
                                        className="flex-[2] py-5 bg-gradient-to-r from-[#1e3a8a] to-[#172554] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:shadow-2xl hover:shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isAdmitting ? (
                                            <>
                                                <CircleNotch size={20} className="animate-spin" />
                                                Processing Enrollment...
                                            </>
                                        ) : (
                                            <>
                                                <FloppyDisk size={20} weight="bold" />
                                                Complete Student Enrollment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. FORMS VIEW */}
                {view === 'forms' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10 bg-slate-50 dark:bg-slate-800/50/50 animate-in slide-in-from-bottom-4">
                        {['Admission Form', 'Fee Challan Template', 'Leaving Certificate', 'Character Certificate', 'Staff Employment Form'].map((formName, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-10 rounded-[40px] border border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] transition-all group cursor-pointer relative shadow-sm hover:shadow-2xl hover:-translate-y-2">
                                <div className="mb-8 w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-[#1e3a8a] transition-all">
                                    <FileText size={40} weight="duotone"/>
                                </div>
                                <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-none group-hover:text-[#1e3a8a] transition-colors">{formName}</h3>
                                <p className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-[0.2em]">Official School Template</p>
                                <div className="mt-10">
                                    <button 
                                        onClick={() => { if (formName === 'Admission Form') { setPrintBlankForm(true); setShowPrintPreview(true); } }} 
                                        className="w-full py-4 bg-[#1e3a8a] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#172554] transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 active:scale-95"
                                    >
                                        <Printer size={18} weight="bold"/> Print Template
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
        
        {/* --- EXPORT MODAL --- */}
        {showExportModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowExportModal(false)}></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-2xl border-4 border-slate-800 relative z-10 animate-in zoom-in-95 shadow-2xl flex flex-col max-h-[70vh]">
                    <div className="bg-slate-800 text-white p-4 flex justify-between items-center border-b-4 border-black">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-tight">Export Records</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select Columns & Format</p>
                        </div>
                        <button onClick={() => setShowExportModal(false)}><X size={18} weight="bold"/></button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto">
                        <div className="mb-4">
                            <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Select Columns to Include:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" checked={selectedExportFields.includes('rollNo')} onChange={() => toggleExportField('rollNo')} className="w-4 h-4 accent-[#1e3a8a]" />
                                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">S/No</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" checked={selectedExportFields.includes('class')} onChange={() => toggleExportField('class')} className="w-4 h-4 accent-[#1e3a8a]" />
                                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">Class</span>
                                </label>
                                {formConfig.filter(f => f.enabled).map(field => (
                                    <label key={field.id} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input type="checkbox" checked={selectedExportFields.includes(field.id)} onChange={() => toggleExportField(field.id)} className="w-4 h-4 accent-[#1e3a8a]" />
                                        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">{field.label}</span>
                                    </label>
                                ))}
                                <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" checked={selectedExportFields.includes('feeStatus')} onChange={() => toggleExportField('feeStatus')} className="w-4 h-4 accent-[#1e3a8a]" />
                                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">Fee Status</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button 
                                onClick={exportToExcel}
                                className="flex flex-col items-center justify-center p-6 bg-emerald-50 border-2 border-emerald-600 hover:bg-emerald-100 transition-all group"
                            >
                                <div className="p-3 bg-emerald-600 text-white mb-3"><Table size={24} weight="fill"/></div>
                                <p className="font-black text-emerald-900 uppercase text-[10px]">Excel (.xlsx)</p>
                            </button>

                            <button 
                                onClick={exportToWord}
                                className="flex flex-col items-center justify-center p-6 bg-purple-50 border-2 border-purple-600 hover:bg-purple-100 transition-all group"
                            >
                                <div className="p-3 bg-purple-600 text-white mb-3"><FileText size={24} weight="fill"/></div>
                                <p className="font-black text-purple-900 uppercase text-[10px]">Word (.docx)</p>
                            </button>

                            <button 
                                onClick={exportToPDF}
                                className="flex flex-col items-center justify-center p-6 bg-rose-50 border-2 border-rose-600 hover:bg-rose-100 transition-all group"
                            >
                                <div className="p-3 bg-rose-600 text-white mb-3"><FileText size={24} weight="fill"/></div>
                                <p className="font-black text-rose-900 uppercase text-[10px]">PDF Report</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- TABLE CONFIGURATION MODAL --- */}
        {showTableConfigModal && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowTableConfigModal(false)}></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-2xl border-4 border-slate-800 relative z-10 animate-in zoom-in-95 shadow-2xl flex flex-col max-h-[70vh]">
                    <div className="bg-[#1e3a8a] text-white p-4 flex items-center justify-between border-b-4 border-black">
                        <div className="flex items-center gap-3">
                            <Gear size={24} weight="fill"/>
                            <h3 className="font-black uppercase tracking-tight">Configure Table Fields</h3>
                        </div>
                        <button onClick={() => setShowTableConfigModal(false)} className="hover:text-blue-200 transition-colors">
                            <X size={24} weight="bold"/>
                        </button>
                    </div>
                    <div className="p-4 overflow-y-auto">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Select up to 11 fields to display in the student table.</p>
                        {configError && <p className="text-[10px] font-bold text-red-600 mb-3 bg-red-50 p-2 border border-red-200">{configError}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {allAvailableFields.map(field => {
                                const isBuiltIn = builtInFields.some(f => f.id === field.id);
                                return (
                                    <label key={field.id} className={`flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors ${isBuiltIn ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 accent-[#1e3a8a]"
                                            checked={visibleTableFields.includes(field.id)}
                                            disabled={isBuiltIn}
                                            onChange={() => {
                                                setConfigError(null);
                                                if (visibleTableFields.includes(field.id)) {
                                                    setVisibleTableFields(prev => prev.filter(f => f !== field.id));
                                                } else if (visibleTableFields.length < 11) {
                                                    setVisibleTableFields(prev => [...prev, field.id]);
                                                } else {
                                                    setConfigError("You can select a maximum of 11 fields.");
                                                }
                                            }}
                                        />
                                        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">{field.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- EDIT STUDENT MODAL --- */}
        {showEditModal && editingStudent && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-4xl border-4 border-slate-800 relative z-10 animate-in zoom-in-95 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="bg-slate-800 text-white p-5 flex justify-between items-center border-b-4 border-black sticky top-0 z-20">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Edit Student Record</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{editingStudent.name} • {editingStudent.rollNo}</p>
                        </div>
                        <button onClick={() => setShowEditModal(false)}><X size={20} weight="bold"/></button>
                    </div>
                    
                    <div className="p-8 space-y-10">
                        {/* Photo Upload for Edit */}
                        <div className="flex flex-col items-center gap-4 mb-6">
                             <div 
                                onClick={() => photoInputRef.current?.click()}
                                className="w-32 h-40 border-2 border-dashed border-slate-300 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-all relative group rounded-2xl overflow-hidden"
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <UserCircle size={32} className="text-slate-300 mb-2 group-hover:text-slate-500 dark:text-slate-400" />
                                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight px-2">Change Photo</p>
                                    </>
                                )}
                                <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                            </div>
                            <div className="flex gap-2 w-full max-w-[200px]">
                                <button 
                                    onClick={() => photoInputRef.current?.click()}
                                    className="flex-1 py-2 bg-slate-100 text-slate-700 dark:text-slate-200 font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 rounded-xl"
                                >
                                    <UploadSimple size={14} weight="bold"/> Upload
                                </button>
                                <button 
                                    onClick={() => setShowCamera(true)}
                                    className="flex-1 py-2 bg-slate-100 text-slate-700 dark:text-slate-200 font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 rounded-xl"
                                >
                                    <Camera size={14} weight="bold"/> Take Photo
                                </button>
                            </div>
                        </div>

                        {Object.entries(groupedFields).map(([sectionName, fields]) => (
                            <div key={sectionName}>
                                <h3 className={paperSectionTitle}>
                                    <StudentIcon size={18} weight="fill"/> {sectionName}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {(fields as FormFieldConfig[]).map(field => {
                                        const fieldType = getFieldType(field);
                                        const fieldOptions = getFieldOptions(field) || field.options;
                                        return (
                                        <div key={field.id} className={fieldType === 'textarea' ? 'md:col-span-2' : ''}>
                                            <label className={paperLabelStyle}>{field.label} {field.required && <span className="text-rose-500">*</span>}</label>
                                            {fieldType === 'select' ? (
                                                <select 
                                                    value={dynamicFormData[field.id] || ''}
                                                    onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                                    className={`${paperInputStyle} ${formErrors[field.id] ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                                                >
                                                    <option value="">Select Option</option>
                                                    {fieldOptions?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : fieldType === 'textarea' ? (
                                                <textarea 
                                                    value={dynamicFormData[field.id] || ''}
                                                    onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                                    className={`${paperInputStyle} h-20 resize-none ${formErrors[field.id] ? 'border-rose-500 ring-1 ring-rose-500' : ''}`} 
                                                    placeholder={`ENTER ${field.label.toUpperCase()}`}
                                                />
                                            ) : fieldType === 'signature' || field.id.toLowerCase().includes('signature') ? (
                                                <div className="flex items-center gap-4">
                                                    {dynamicFormData[field.id] ? (
                                                        <div className="relative w-32 h-16 border border-slate-300 bg-white dark:bg-slate-800 flex items-center justify-center">
                                                            <img src={dynamicFormData[field.id]} alt="Signature" className="max-w-full max-h-full object-contain" />
                                                            <button onClick={() => handleDynamicChange(field.id, '')} className="absolute top-1 right-1 bg-slate-800 text-white p-1 hover:bg-rose-600"><X size={10}/></button>
                                                        </div>
                                                    ) : (
                                                        <label className={`flex-1 flex items-center justify-center gap-2 bg-slate-50 border border-dashed p-3 cursor-pointer hover:bg-slate-100 transition-colors ${formErrors[field.id] ? 'border-rose-500' : 'border-slate-300'}`}>
                                                            <UploadSimple size={16} className="text-slate-500 dark:text-slate-400" />
                                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase">Upload Signature</span>
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) handleFileUpload(field.id, e.target.files[0]);
                                                            }} />
                                                        </label>
                                                    )}
                                                </div>
                                            ) : (
                                                <input 
                                                    type={fieldType}
                                                    value={dynamicFormData[field.id] || ''}
                                                    onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                                    className={`${paperInputStyle} ${formErrors[field.id] ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                                                    placeholder={`ENTER ${field.label.toUpperCase()}`}
                                                />
                                            )}
                                            {formErrors[field.id] && <p className="text-[10px] font-bold text-rose-500 mt-1">{formErrors[field.id]}</p>}
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="bg-slate-100 border-2 border-dashed border-slate-400 p-6 relative mt-8">
                            <div className="absolute -top-3 left-4 bg-slate-800 text-white text-[10px] font-black uppercase px-2 py-1 tracking-widest">
                                Office Records
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                                <div>
                                    <label className={paperLabelStyle}>Class</label>
                                    <select name="classId" value={systemFormData.classId || ''} onChange={handleSystemChange} className={paperInputStyle + " bg-white"}>
                                        <option value="">SELECT CLASS</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={paperLabelStyle}>Roll Number</label>
                                    <input type="text" name="rollNo" value={systemFormData.rollNo || ''} onChange={handleSystemChange} className={paperInputStyle + " bg-white"} placeholder="ASSIGN ROLL NO" />
                                </div>
                                <div>
                                    <label className={paperLabelStyle}>Monthly Fee</label>
                                    <input type="number" name="monthlyFee" value={systemFormData.monthlyFee || ''} onChange={handleSystemChange} className={paperInputStyle + " bg-white"} placeholder="0" />
                                </div>
                                <div>
                                    <label className={paperLabelStyle}>Discount</label>
                                    <input type="number" name="discount" value={systemFormData.discount || ''} onChange={handleSystemChange} className={paperInputStyle + " bg-white"} placeholder="0" />
                                </div>
                                <div>
                                    <label className={paperLabelStyle}>Status</label>
                                    <select name="status" value={systemFormData.status || ''} onChange={handleSystemChange} className={paperInputStyle + " bg-white"}>
                                        <option value="Active">ACTIVE</option>
                                        <option value="Pending">PENDING</option>
                                        <option value="Inactive">INACTIVE</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t-2 border-slate-900">
                            <button 
                                onClick={() => setShowEditModal(false)} 
                                className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-300 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all rounded-none"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdateStudent} 
                                disabled={isAdmitting}
                                className="flex-[2] py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest hover:bg-[#172554] shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 rounded-none"
                            >
                                {isAdmitting ? <CircleNotch className="animate-spin" size={16} weight="bold"/> : <Check size={16} weight="bold"/>}
                                Update Record
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {/* --- DELETE CONFIRMATION MODAL --- */}
        {showDeleteModal && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-sm border-4 border-slate-800 relative z-10 animate-in zoom-in-95 shadow-2xl">
                    <div className="bg-rose-600 text-white p-4 flex items-center gap-3 border-b-4 border-black">
                        <WarningCircle size={24} weight="fill"/>
                        <h3 className="font-black uppercase tracking-tight">Confirm Deletion</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight leading-relaxed">
                            {isBulkAction 
                                ? `Are you absolutely sure you want to delete ${selectedStudents.length} selected student records? This action cannot be undone.`
                                : "Are you absolutely sure you want to delete this student record? This action cannot be undone."
                            }
                        </p>
                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest border-2 border-rose-700 hover:bg-rose-700 shadow-lg active:translate-y-0.5 transition-all"
                            >
                                Delete Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {/* --- BULK IMPORT MODAL --- */}
        {showBulkImportModal && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => !isImporting && setShowBulkImportModal(false)}></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-lg border-4 border-slate-800 relative z-10 animate-in zoom-in-95 shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="bg-emerald-600 text-white p-4 flex items-center justify-between border-b-4 border-black">
                        <div className="flex items-center gap-3">
                            <UploadSimple size={24} weight="fill"/>
                            <h3 className="font-black uppercase tracking-tight">Bulk Import Students</h3>
                        </div>
                        <button onClick={() => !isImporting && setShowBulkImportModal(false)} className="hover:text-emerald-200 transition-colors">
                            <X size={24} weight="bold"/>
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                                <p className="text-sm font-bold text-blue-900 mb-2">Step 1: Select Class & Download Template</p>
                                <p className="text-xs text-blue-700 mb-4">Select the class for these students, then download the template. It automatically includes all your configured admission form fields.</p>
                                <select 
                                    value={importClassId} 
                                    onChange={(e) => setImportClassId(e.target.value)}
                                    className="w-full p-2 mb-4 border border-blue-300 rounded text-xs font-bold uppercase tracking-widest"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button 
                                    onClick={downloadImportTemplate}
                                    disabled={!importClassId}
                                    className="bg-blue-600 text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <DownloadSimple size={16} weight="bold" /> Download Template
                                </button>
                            </div>

                            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4">
                                <p className="text-sm font-bold text-emerald-900 mb-2">Step 2: Upload Data</p>
                                <p className="text-xs text-emerald-700 mb-4">Fill the downloaded template and upload it here.</p>
                                
                                <label className={`flex items-center justify-center w-full h-32 border-2 border-dashed border-emerald-300 bg-white dark:bg-slate-800 hover:bg-emerald-50 cursor-pointer transition-colors ${isImporting || !importClassId ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {isImporting ? (
                                            <CircleNotch size={32} className="text-emerald-500 animate-spin mb-2" />
                                        ) : (
                                            <UploadSimple size={32} className="text-emerald-500 mb-2" />
                                        )}
                                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                                            {isImporting ? 'Importing...' : 'Click to Upload Excel'}
                                        </p>
                                    </div>
                                    <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFilePreview} disabled={isImporting || !importClassId} />
                                </label>
                            </div>

                            {importErrors.length > 0 && (
                                <div className="bg-red-50 border-l-4 border-red-600 p-4">
                                    <p className="text-sm font-bold text-red-900 mb-2">Errors Found:</p>
                                    <ul className="text-xs text-red-700 list-disc pl-4">
                                        {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}
                            {importPreviewData.length > 0 && (
                                <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4">
                                    <p className="text-sm font-bold text-emerald-900 mb-2">Preview:</p>
                                    <p className="text-xs text-emerald-700">{importPreviewData.length} students found.</p>
                                    <button 
                                        onClick={confirmBulkImport}
                                        disabled={isImporting}
                                        className="mt-4 bg-emerald-600 text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isImporting ? <CircleNotch size={16} className="animate-spin" /> : 'Confirm Import'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Camera Modal */}
        {showCamera && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="w-full max-w-lg">
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setShowCamera(false)} className="text-white hover:text-rose-500 transition-colors">
                            <X size={32} weight="bold" />
                        </button>
                    </div>
                    <CameraCapture 
                        onCapture={handleCameraCapture}
                        onClose={() => setShowCamera(false)}
                    />
                </div>
            </div>
        )}

    </div>
  );
};

export default StudentManagement;
