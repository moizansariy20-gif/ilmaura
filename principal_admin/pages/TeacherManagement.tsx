
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Plus, Trash, PencilSimple, X, MagnifyingGlass, CheckCircle, WarningCircle, 
    Briefcase, FileCsv, Gear, ChalkboardTeacher, UserPlus, UsersThree, 
    Funnel, CircleNotch, ShieldCheck, ListChecks, Printer, Clock, Camera,
    Table, FileText, CaretDown, Check
} from 'phosphor-react';
import { ArrowLeft as LArrowLeft, Sparkles as LSparkles, Settings as LSettings, Phone as LPhone } from 'lucide-react';
import { onboardTeacher, updateTeacher, deleteTeacher, updateSchoolBranding, provisionTeacherAccount, logActivity, deleteFileFromStorage, extractPathFromStorageUrl, uploadFileToStorage } from '../../services/api.ts';
import { CustomFieldDef, UserProfile, StaffPermission, School, FormFieldConfig, Teacher, BUILTIN_TEACHER_CONFIG } from '../../types.ts';
import { usePermissions } from '../../hooks/usePermissions.ts';
import * as XLSX from 'xlsx';
import imageCompression from 'browser-image-compression';
// import ImageStudio from '../../components/ImageStudio.tsx';

interface TeacherManagementProps {
  profile: UserProfile;
  school: any;
  schoolId: string;
  teachers: any[];
  searchTerm?: string;
  view?: 'directory' | 'hiring' | 'form_builder' | 'forms';
  onNavigate?: (tab: string) => void;
}

const INITIAL_FORM = { id: '', customData: {} as Record<string, any> };

const DEFAULT_FORM_CONFIG: FormFieldConfig[] = [];

// --- PRINTABLE TEACHER FORM COMPONENT (Dynamic) ---
export const PrintableTeacherForm: React.FC<{ school: School, config: FormFieldConfig[], isBlank?: boolean, showOverlays?: boolean, teacher?: Teacher }> = ({ school, config, isBlank, showOverlays = true, teacher }) => {
    const overlayConfig = school.teacherFormOverlayConfig || { templateUrl: '', pages: [], elements: {} };
    
    if (showOverlays && (overlayConfig?.templateUrl || (overlayConfig?.pages && overlayConfig.pages.length > 0))) {
        const pages = overlayConfig.pages || [overlayConfig.templateUrl].filter(Boolean);
        return (
            <div className="flex flex-col gap-8 print:gap-0">
                {pages.map((pageUrl, pageIdx) => (
                    <div key={pageIdx} className="w-[210mm] mx-auto bg-white dark:bg-slate-800 relative shadow-2xl overflow-hidden print:shadow-none print:m-0 break-after-page" style={{ minHeight: '297mm' }}>
                        <img src={pageUrl} className="w-full h-full absolute inset-0 object-fill" alt={`Form Template Page ${pageIdx + 1}`} />
                    </div>
                ))}
            </div>
        );
    }

    const groupedFields = useMemo(() => {
        const groups: Record<string, FormFieldConfig[]> = { student: [], parent: [], academic: [], health: [], other: [], contact: [], registration: [] };
        config.forEach(f => {
            if (!f.enabled) return;
            const sec = f.section || 'other';
            if (!groups[sec]) groups[sec] = [];
            groups[sec].push(f);
        });
        return groups;
    }, [config]);

    const sectionTitles: Record<string, string> = {
        student: 'Personal Information',
        academic: 'Academic & Professional',
        contact: 'Contact Details',
        registration: 'Registration Details',
        other: 'Other Details'
    };

    return (
        <div className="w-[210mm] mx-auto bg-white dark:bg-slate-800 text-black p-10 shadow-2xl print:shadow-none print:m-0 print:p-8" style={{ minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
            <div className="flex items-start justify-between border-b-2 border-black pb-6 mb-8">
                <div className="w-28 h-28 flex-shrink-0 flex items-center justify-center">
                    {school.logoURL ? <img src={school.logoURL} alt="Logo" className="max-w-full max-h-full object-contain" /> : <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs text-center">No Logo</div>}
                </div>
                <div className="flex-1 text-center px-4">
                    <h1 className="text-3xl font-black uppercase tracking-widest mb-2">{school.name}</h1>
                    <p className="text-sm text-gray-600 uppercase tracking-widest">{school.address || 'School Address Not Provided'}</p>
                    <p className="text-sm text-gray-600 uppercase tracking-widest">Tel: {school.phone || 'N/A'} | Email: {school.email || 'N/A'}</p>
                </div>
                <div className="w-28 h-32 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-xs text-center p-2">
                    {teacher?.photoURL && !isBlank ? <img src={teacher.photoURL} className="w-full h-full object-cover" /> : 'Paste 1x1 Photo Here'}
                </div>
            </div>
            <div className="text-center mb-8">
                <h2 className="inline-block text-xl font-black uppercase tracking-widest border-b-2 border-black pb-1">Teacher Registration Form</h2>
            </div>
            <div className="space-y-8">
                {Object.entries(groupedFields).map(([section, fields]) => {
                    if (fields.length === 0) return null;
                    return (
                        <div key={section} className="mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest bg-gray-100 p-2 border-l-4 border-black mb-4">{sectionTitles[section] || section}</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                {fields.map(field => {
                                    let val = '';
                                    if (!isBlank && teacher) {
                                        if (field.id === 'teacherName') val = teacher.name;
                                        else if (field.id === 'email') val = teacher.email || '';
                                        else if (field.id === 'phone') val = teacher.phone || '';
                                        else if (field.id === 'designation') val = teacher.designation;
                                        else if (field.id === 'gender') val = teacher.gender || '';
                                        else val = teacher.customData?.[field.id] || '';
                                    }
                                    return (
                                        <div key={field.id} className={`flex flex-col ${field.type === 'textarea' ? 'col-span-2' : ''}`}>
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">{field.label}</span>
                                            <div className="border-b border-gray-400 pb-1 min-h-[24px] text-sm font-medium">{val}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-16 pt-8 border-t-2 border-black flex justify-between">
                <div className="text-center w-48">
                    <div className="border-b border-black h-12 mb-2"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">Applicant Signature</span>
                </div>
                <div className="text-center w-48">
                    <div className="border-b border-black h-12 mb-2"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">Principal Signature</span>
                </div>
            </div>
        </div>
    );
};

const TeacherManagement: React.FC<TeacherManagementProps> = ({ profile, school, schoolId, teachers, searchTerm, view = 'directory', onNavigate }) => {
  const [localSearch, setLocalSearch] = useState('');
  const globalSearchTerm = searchTerm || localSearch;
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null);
  const [isBulkAction, setIsBulkAction] = useState(false);

  const [form, setForm] = useState<any>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [generatedCreds, setGeneratedCreds] = useState<{email: string, name: string, password: string} | null>(null);

  const MaleAvatar = () => (
    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2 text-blue-600">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );

  const FemaleAvatar = () => (
    <div className="w-full h-full bg-rose-100 flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2 text-rose-600">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );

  // Configuration State
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);

  // Table Configuration State
  const builtInFields = useMemo(() => [{ id: 'staffInfo', label: 'Staff Info' }], []);
  const configurableFields = useMemo(() => {
      return [
          { id: 'designation', label: 'Designation' },
          { id: 'status', label: 'Status' },
          ...customFields.filter(f => !['name', 'staffInfo', 'designation', 'status'].includes(f.id)).map(f => ({ id: f.id, label: f.label }))
      ];
  }, [customFields]);

  const allAvailableFields = useMemo(() => [...builtInFields, ...configurableFields], [builtInFields, configurableFields]);
  const [configError, setConfigError] = useState<string | null>(null);

  const [visibleTableFields, setVisibleTableFields] = useState<string[]>(() => ['staffInfo', 'designation', ...customFields.slice(2, 4).map(f => f.id), 'status']);
  const [showTableConfigModal, setShowTableConfigModal] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(30);

  // Update visible fields if customFields changes and visible fields are empty (initial load)
  useEffect(() => {
      if (visibleTableFields.length <= 3 && customFields.length > 0) {
          setVisibleTableFields(['staffInfo', 'designation', ...customFields.slice(2, 4).map(f => f.id), 'status']);
      }
  }, [customFields]);

  useEffect(() => {
    if (selectedExportFields.length === 0 && visibleTableFields.length > 0) {
        setSelectedExportFields(visibleTableFields);
    }
  }, [visibleTableFields]);

  const toggleExportField = (fieldId: string) => {
      setSelectedExportFields(prev => 
          prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
      );
  };

  // Import State
  const [importData, setImportData] = useState<any[]>([]);
  const importFileRef = useRef<HTMLInputElement>(null);

  const { canAdd, canEdit, canDelete } = usePermissions(profile);
  const sectionId = 'teachers';

  const logAction = async (action: string, details: string, category: any = 'Teacher') => {
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

  // Initialize Config or Defaults
  useEffect(() => {
      if (school) {
          if (school.teacherFieldConfig && school.teacherFieldConfig.length > 0) {
              setCustomFields(school.teacherFieldConfig);
          } else {
              setCustomFields([
                  { id: 'name', label: 'Full Name', type: 'text', required: true },
                  { id: 'designation', label: 'Designation', type: 'select', options: ['Teacher', 'Senior Teacher', 'HOD', 'Coordinator', 'Vice Principal'], required: true },
                  { id: 'phone', label: 'Mobile Number', type: 'number', required: true },
                  { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
                  { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: true },
                  { id: 'qualification', label: 'Qualification', type: 'text', required: false }
              ]);
          }
      }
  }, [school]);

  const displayedTeachers = teachers.filter(t => {
    const term = (globalSearchTerm || '').toLowerCase();
    return t.name?.toLowerCase().includes(term) || t.email?.toLowerCase().includes(term);
  });

  const totalTeachers = teachers.length;

  const handleSave = async () => {
    // Validate Required Dynamic Fields
    for (const field of customFields) {
        if (field.required && !form.customData[field.id]) {
            setErrorMsg(`${field.label} is required.`);
            return;
        }
    }
    
    setIsSaving(true);
    setErrorMsg('');

    try {
      let photoURL = form.customData['photoURL'] || '';

      if (photoFile) {
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 800,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(photoFile, options);
        const fileName = `teachers/${schoolId}/${Date.now()}_${photoFile.name}`;
        const uploadResult = await uploadFileToStorage(compressedFile, fileName);
        photoURL = uploadResult.publicUrl;
      }

      // Map crucial legacy fields from customData to system columns
      const systemName = form.customData['name'] || 'Faculty';
      const systemPhone = form.customData['phone'] || '';
      const systemDesignation = form.customData['designation'] || 'Teacher';
      const systemDob = form.customData['dob'] || '';
      const systemGender = form.customData['gender'] || 'Male';
      
      // Generate Login ID (3 letters + 4 numbers)
      const prefix = systemName.substring(0, 3).toUpperCase().padEnd(3, 'X');
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const loginId = `${prefix}${randomId}`;

      const payload: any = {
          name: systemName,
          phone: systemPhone,
          designation: systemDesignation,
          dob: systemDob,
          gender: systemGender,
          loginId: loginId,
          photoURL: photoURL,
          customData: { ...form.customData }
      };

      if (isEditing) {
        await updateTeacher(schoolId, form.id, payload);
        logAction('Update Teacher', `Updated profile of ${systemName}`);
        setShowModal(false);
      } else {
        const newTeacher = await onboardTeacher(schoolId, payload);
        
        logAction('Onboard Teacher', `Added new teacher ${systemName} with designation ${systemDesignation}`);
        // Show Login ID and School ID to principal
        setGeneratedCreds({ email: loginId, name: systemName, password: `School ID: ${schoolId}` });
        setShowModal(false);
      }
      setForm(INITIAL_FORM);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Operation failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfig = async () => {
      setIsSaving(true);
      try {
          await updateSchoolBranding(schoolId, { teacherFieldConfig: customFields });
          setShowConfigModal(false);
      } catch (err) {
          alert("Failed to save field configuration.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleDelete = async () => {
    if (!isBulkAction && !teacherToDelete) return;
    if (isBulkAction && selectedTeachers.length === 0) return;

    setIsSaving(true);
    try {
      const idsToDelete = isBulkAction ? [...selectedTeachers] : [teacherToDelete.id];
      
      for (const id of idsToDelete) {
        const teacher = teachers.find(t => t.id === id);
        if (teacher) {
            // Delete photo from storage if exists
            if (teacher.photoURL) {
                const path = extractPathFromStorageUrl(teacher.photoURL);
                if (path) {
                    await deleteFileFromStorage(path).catch(err => console.error("Failed to delete teacher photo:", err));
                }
            }
            await deleteTeacher(schoolId, id);
            logAction('Delete Teacher', `Deleted teacher ${teacher.name || 'Unknown'}`);
        }
      }

      if (isBulkAction) {
          setSelectedTeachers([]);
      } else {
          setTeacherToDelete(null);
      }
      setShowDeleteModal(false);
    } catch (e) {
      console.error("Delete Error:", e);
      alert("Failed to delete teacher(s).");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (teacher: any) => {
    setIsBulkAction(false);
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedTeachers.length === 0) return;
    setIsBulkAction(true);
    setShowDeleteModal(true);
  };

  const exportToExcel = () => {
    const data = displayedTeachers.map(t => {
        const row: any = {};
        selectedExportFields.forEach(fieldId => {
            const field = allAvailableFields.find(f => f.id === fieldId);
            if (fieldId === 'staffInfo') {
                row['Name'] = t.name;
                row['Designation'] = t.designation || 'Faculty Member';
            } else if (fieldId === 'designation') {
                row['Designation'] = t.customData?.designation || t.designation || 'Teacher';
            } else if (fieldId === 'status') {
                row['Status'] = t.status || 'Inactive';
            } else {
                row[field?.label || fieldId] = t.customData?.[fieldId] || t[fieldId] || '-';
            }
        });
        return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    XLSX.writeFile(wb, `Teachers_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportModal(false);
  };

  const exportToWord = async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } = await import('docx');
    
    const headers: string[] = [];
    selectedExportFields.forEach(fieldId => {
        const field = allAvailableFields.find(f => f.id === fieldId);
        if (fieldId === 'staffInfo') {
            headers.push('Name', 'Designation');
        } else {
            headers.push(field?.label || fieldId);
        }
    });

    const rows = displayedTeachers.map(t => {
        const row: any[] = [];
        selectedExportFields.forEach(fieldId => {
            if (fieldId === 'staffInfo') {
                row.push(t.name || '-', t.designation || 'Faculty Member');
            } else if (fieldId === 'designation') {
                row.push(t.customData?.designation || t.designation || 'Teacher');
            } else if (fieldId === 'status') {
                row.push(t.status || 'Inactive');
            } else {
                row.push(t.customData?.[fieldId] || t[fieldId] || '-');
            }
        });
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
                new Paragraph({ children: [new TextRun({ text: school.name, bold: true, size: 36 })] }),
                new Paragraph({ children: [new TextRun({ text: `Teacher Directory - ${new Date().toLocaleDateString()}`, size: 24 })] }),
                new Paragraph({ text: "" }),
                new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                }),
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = `${school.name}_Teachers_${new Date().toLocaleDateString()}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
    });
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
    doc.text(`Teacher Directory - ${new Date().toLocaleDateString()}`, 14, 30);

    const headers: string[] = [];
    selectedExportFields.forEach(fieldId => {
        const field = allAvailableFields.find(f => f.id === fieldId);
        if (fieldId === 'staffInfo') {
            headers.push('Name', 'Designation');
        } else {
            headers.push(field?.label || fieldId);
        }
    });

    const data = displayedTeachers.map(t => {
        const row: any[] = [];
        selectedExportFields.forEach(fieldId => {
            if (fieldId === 'staffInfo') {
                row.push(t.name || '-', t.designation || 'Faculty Member');
            } else if (fieldId === 'designation') {
                row.push(t.customData?.designation || t.designation || 'Teacher');
            } else if (fieldId === 'status') {
                row.push(t.status || 'Inactive');
            } else {
                row.push(t.customData?.[fieldId] || t[fieldId] || '-');
            }
        });
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

    doc.save(`${school.name}_Teachers_${new Date().toLocaleDateString()}.pdf`);
    setShowExportModal(false);
  };

  // --- IMPORT LOGIC ---
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws);
              setImportData(data);
          } catch (err) {
              console.error(err);
              alert("Failed to parse file. Ensure it is a valid Excel or CSV file.");
          }
      };
      reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
      if (importData.length === 0) return alert("No data to import.");

      setIsSaving(true);
      try {
          for (const row of importData) {
              const customData: any = {};
              customFields.forEach(field => {
                  const key = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g,'') === field.label.toLowerCase().replace(/\s/g,'') || k.toLowerCase() === field.id.toLowerCase());
                  if (key) customData[field.id] = row[key];
              });
              
              const systemName = customData['name'] || row['Name'] || row['Full Name'] || row['Teacher Name'] || row['Staff Name'] || row['Teacher'] || 'Faculty';
              
              // Auto-generate Email and Password for Import
              const randomId = Math.floor(1000 + Math.random() * 9000);
              const systemEmail = customData['email'] || row['Email'] || row['Email Address'] || `${systemName.toLowerCase().replace(/\s/g, '.')}.${randomId}@ilmaura.com`;
              const systemPassword = customData['password'] || row['Password'] || `Tch@${randomId}`;

              const newTeacher = await onboardTeacher(schoolId, {
                  name: systemName,
                  email: systemEmail,
                  phone: customData['phone'] || row['Phone'] || row['Mobile'] || row['Contact'] || '',
                  designation: customData['designation'] || row['Designation'] || row['Role'] || 'Teacher',
                  dob: customData['dob'] || row['DOB'] || row['Date of Birth'] || '2000-01-01',
                  gender: customData['gender'] || row['Gender'] || 'Male',
                  customData: { ...row, ...customData, mirror_password: systemPassword }
              });

              if (systemEmail) {
                  await provisionTeacherAccount(schoolId, newTeacher.id, newTeacher, {
                      email: systemEmail,
                      password: systemPassword
                  });
              }
          }

          alert(`Successfully imported ${importData.length} teachers!`);
          logAction('Bulk Import Teachers', `Imported ${importData.length} teachers via Excel`);
          setShowImportModal(false);
          setImportData([]);
      } catch (err: any) {
          alert("Import failed: " + err.message);
      } finally {
          setIsSaving(false);
      }
  };


  const openAddModal = () => {
    setForm({ ...INITIAL_FORM, customData: {} });
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsEditing(false);
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (t: any) => {
    const mergedCustomData = { ...t.customData };
    if (t.name) mergedCustomData['name'] = t.name;
    if (t.phone) mergedCustomData['phone'] = t.phone;
    if (t.designation) mergedCustomData['designation'] = t.designation;
    if (t.dob) mergedCustomData['dob'] = t.dob;
    if (t.gender) mergedCustomData['gender'] = t.gender;

    setForm({
      id: t.id,
      customData: mergedCustomData
    });
    setPhotoFile(null);
    setPhotoPreview(t.photoURL || null);
    setIsEditing(true);
    setErrorMsg('');
    setShowModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = async (croppedDataUrl: string) => {
    const response = await fetch(croppedDataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'teacher_photo.jpg', { type: 'image/jpeg' });
    setPhotoFile(file);
    setPhotoPreview(croppedDataUrl);
    setImageToCrop(null);
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
      setForm((prev: any) => ({
          ...prev,
          customData: { ...prev.customData, [fieldId]: value }
      }));
  };

  // --- FIELD CONFIG MANAGER ---
  const FieldManager = () => {
      const [tempLabel, setTempLabel] = useState('');
      const [tempType, setTempType] = useState<'text' | 'number' | 'date' | 'select'>('text');
      const [tempOptions, setTempOptions] = useState('');

      const addField = () => {
          if (!tempLabel.trim()) return;
          const newId = tempLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (customFields.some(f => f.id === newId)) {
              alert("Field already exists.");
              return;
          }
          
          setCustomFields([...customFields, {
              id: newId,
              label: tempLabel,
              type: tempType,
              required: false,
              options: tempType === 'select' ? tempOptions.split(',').map(s => s.trim()) : undefined
          }]);
          setTempLabel('');
          setTempOptions('');
      };

      return (
          <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                  <div className="flex gap-2">
                      <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Field Label</label>
                          <input type="text" value={tempLabel} onChange={e => setTempLabel(e.target.value)} className="w-full p-2 border-2 border-slate-200 dark:border-slate-700 text-sm font-bold rounded-none outline-none focus:border-[#1e3a8a]" placeholder="e.g. Salary"/>
                      </div>
                      <div className="w-1/3">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Type</label>
                          <select value={tempType} onChange={e => setTempType(e.target.value as any)} className="w-full p-2 border-2 border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 rounded-none outline-none focus:border-[#1e3a8a]">
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="select">Dropdown</option>
                          </select>
                      </div>
                  </div>
                  {tempType === 'select' && (
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase">Options (Comma Separated)</label>
                          <input type="text" value={tempOptions} onChange={e => setTempOptions(e.target.value)} className="w-full p-2 border-2 border-slate-200 dark:border-slate-700 text-sm rounded-none outline-none" placeholder="Option A, Option B"/>
                      </div>
                  )}
                  <button onClick={addField} className="w-full py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black rounded-none">
                      <Plus size={14} className="inline mr-1"/> Add Field
                  </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {customFields.map((f) => (
                      <div key={f.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div>
                              <p className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase">{f.label} {f.required && <span className="text-rose-500">*</span>}</p>
                              <p className="text-[10px] text-slate-400 uppercase">{f.type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <button onClick={() => setCustomFields(prev => prev.map(field => field.id === f.id ? {...field, required: !field.required} : field))} className={`text-[10px] font-bold px-2 py-1 uppercase ${f.required ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500 dark:text-slate-400'}`}>
                                  {f.required ? 'Req' : 'Opt'}
                              </button>
                              <button onClick={() => setCustomFields(customFields.filter(field => field.id !== f.id))} className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50"><Trash size={16} weight="bold"/></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const renderMobileView = () => (
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
              Faculty
            </h1>
            <div className="flex flex-col mt-1">
              <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Principal App • Staff Directory</p>
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
              placeholder="SEARCH FACULTY..."
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#FCFBF8] to-white shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_4px_10px_rgba(30,58,138,0.05)] border border-[#E5E0D8] dark:border-slate-700 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                <ChalkboardTeacher size={24} className="drop-shadow-sm" />
              </div>
              <div className="relative z-10">
                  <p className="font-black text-3xl text-[#1e3a8a] dark:text-white leading-none drop-shadow-sm">{teachers.length}</p>
                  <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Total Staff</p>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative z-10">
                <ShieldCheck size={24} className="drop-shadow-sm" />
              </div>
              <div className="relative z-10">
                  <p className="font-black text-3xl text-emerald-600 leading-none drop-shadow-sm">{teachers.filter(t => t.status === 'Active').length}</p>
                  <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest mt-2">Active</p>
              </div>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-6 relative z-0">
          <div className="flex items-center gap-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
              Faculty Directory
            </h2>
            <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {displayedTeachers.length > 0 ? displayedTeachers.map(teacher => (
              <div key={teacher.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-[#D4AF37]/20 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] flex flex-col gap-6 transition-all duration-300 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${teacher.status === 'Active' ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600'} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                
                <div className="flex items-center justify-between relative z-10 pl-3">
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#172554] flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg">
                        {teacher.photoURL ? (
                          <img src={teacher.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-white font-black text-2xl">{teacher.name[0]}</span>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${teacher.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#1e3a8a] dark:text-white text-xl leading-tight truncate tracking-tight">{teacher.name}</p>
                      <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mt-1 flex items-center gap-1">
                        <LPhone size={10} /> {teacher.phone || 'No Phone'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 pl-3 relative z-10">
                  <div className="bg-[#FCFBF8] dark:bg-slate-900/50 p-3 rounded-2xl border border-[#E5E0D8] dark:border-slate-700">
                    <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Designation</p>
                    <p className="text-xs font-bold text-[#1e3a8a] dark:text-white truncate">{teacher.designation || 'Faculty'}</p>
                  </div>
                  <div className="bg-[#FCFBF8] dark:bg-slate-900/50 p-3 rounded-2xl border border-[#E5E0D8] dark:border-slate-700">
                    <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Gender</p>
                    <p className="text-xs font-bold text-[#1e3a8a] dark:text-white truncate uppercase">{teacher.gender || '-'}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-[#D4AF37]/20 border-dashed">
                <UsersThree size={48} className="text-[#D4AF37]/40 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No faculty found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) return renderMobileView();

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      <input 
        type="file" 
        ref={photoInputRef} 
        onChange={handlePhotoChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      {/* --- MAIN BASE BACKGROUND CONTAINER --- */}
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
          
          {/* --- HEADER --- */}
          <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
              <div>
                  <h1 className="text-3xl font-black tracking-tight uppercase">
                      {view === 'hiring' ? 'Add Teacher' : 'Teacher Register'}
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                      <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                          {view === 'hiring' ? 'Staff Onboarding' : 'Staff Records'}
                      </span>
                  </div>
              </div>
              
              {/* KPI Cards (Mini) */}
              <div className="flex gap-4 mt-4 md:mt-0">
                 <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Staff</p>
                        <p className="text-xl font-black leading-none">{totalTeachers}</p>
                    </div>
                    <div className="w-10 h-10 border-2 border-white/20 flex items-center justify-center bg-blue-500 text-white rounded-none">
                        <ChalkboardTeacher size={20} weight="fill"/>
                    </div>
                 </div>
              </div>
          </div>

          <div className="p-8 bg-white dark:bg-slate-800 min-h-[500px]">
              
              {/* --- HIRING VIEW --- */}
              {view === 'hiring' ? (
                 <div className="max-w-6xl mx-auto">
                    
                    <div className="flex justify-between items-center mb-8 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2"><Briefcase size={24} weight="fill" className="text-[#1e3a8a]"/> New Teacher</h3>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Digital Onboarding Form</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setShowImportModal(true)} className="px-5 py-3 bg-emerald-600 text-white border-2 border-emerald-700 font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 rounded-none">
                                <FileCsv size={16} weight="fill"/> Import
                             </button>
                             <button onClick={() => setShowConfigModal(true)} className="px-5 py-3 bg-slate-100 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2 rounded-none">
                                <Gear size={16} weight="fill"/> Configure Fields
                             </button>
                        </div>
                    </div>

                    <div className="p-8 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        {/* PHOTO UPLOAD */}
                        <div className="flex flex-col items-center mb-8 pb-8 border-b-2 border-slate-200 dark:border-slate-700">
                            <div 
                                className="w-40 h-40 bg-white dark:bg-slate-800 border-4 border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#1e3a8a] transition-all group relative shadow-sm rounded-full"
                                onClick={() => photoInputRef.current?.click()}
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center w-full h-full flex flex-col items-center justify-center">
                                        <div className="absolute inset-0 opacity-40">
                                            {form.customData.gender?.toLowerCase() === 'female' ? <FemaleAvatar /> : <MaleAvatar />}
                                        </div>
                                        <Camera size={40} className="mx-auto text-slate-300 group-hover:text-[#1e3a8a] mb-2 relative z-10"/>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Upload Profile Photo</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                                    <PencilSimple size={24} className="text-white" />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Professional Headshot Preferred (JPG/PNG)</p>
                        </div>

                        {customFields.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {customFields.map(field => (
                                    <div key={field.id} className={field.type === 'text' && (field.id === 'name') ? 'md:col-span-2' : ''}>
                                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 block mb-1">
                                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                                        </label>
                                        {field.type === 'select' ? (
                                            <select
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] rounded-none text-sm uppercase"
                                                value={form.customData[field.id] || ''}
                                                onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                            >
                                                <option value="">Select {field.label}</option>
                                                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type={field.type} 
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] rounded-none text-sm uppercase placeholder-slate-400"
                                                value={form.customData[field.id] || ''}
                                                onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                                placeholder={`ENTER ${field.label}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <p className="font-bold text-slate-400 uppercase tracking-widest">No fields configured.</p>
                                <button onClick={() => setShowConfigModal(true)} className="text-[#1e3a8a] text-xs font-black uppercase tracking-widest mt-2 hover:underline">Setup Configuration</button>
                            </div>
                        )}
                        
                        {errorMsg && <p className="text-xs font-bold text-rose-600 text-center bg-rose-50 p-3 mt-4 border border-rose-200 uppercase tracking-wide">{errorMsg}</p>}
                        
                        <button 
                            disabled={isSaving || customFields.length === 0} 
                            onClick={() => {
                                if (!canAdd(sectionId)) {
                                    alert("You don't have permission to create accounts.");
                                    return;
                                }
                                handleSave();
                            }} 
                            className="w-full py-4 bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-widest shadow-sm hover:bg-[#172554] transition-all disabled:opacity-50 mt-8 flex items-center justify-center gap-2 rounded-none border-2 border-slate-900"
                        >
                            {isSaving ? <CircleNotch className="animate-spin" size={18}/> : <ShieldCheck size={18} weight="fill"/>} 
                            Enroll Teacher
                        </button>
                    </div>

                 </div>
              ) : (
                /* --- DIRECTORY VIEW --- */
                <div className="space-y-6">
                    
                    {/* Toolbar & Table Container */}
                    <div className="bg-white dark:bg-slate-800 border-2 border-[#1e3a8a] shadow-sm overflow-hidden flex flex-col mt-6">
                        <div className="px-6 py-4 bg-[#1e3a8a] border-b-2 border-[#1e3a8a] flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                                <ListChecks size={18} weight="fill"/> Faculty Roster
                            </h3>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => setShowTableConfigModal(true)}
                                    className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-4 py-2 font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border border-[#1e3a8a]/20"
                                >
                                    <Gear size={16} weight="fill"/> Configure Table
                                </button>
                                <div className="bg-white dark:bg-slate-800 p-1 flex items-center w-full md:w-64">
                                    <input 
                                        type="text" 
                                        placeholder="SEARCH NAME/ID..." 
                                        value={localSearch} 
                                        onChange={(e) => setLocalSearch(e.target.value)}
                                        className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest placeholder-slate-400"
                                    />
                                    <MagnifyingGlass size={14} weight="bold" className="text-slate-400 mr-2"/>
                                </div>
                                {selectedTeachers.length > 0 && (
                                    <div className="flex gap-2">
                                        <div className="bg-blue-50 text-[#1e3a8a] px-4 py-2 font-black text-xs uppercase tracking-widest flex items-center justify-center border border-blue-200 whitespace-nowrap">
                                            {selectedTeachers.length} Selected
                                        </div>
                                        <button 
                                            onClick={handleBulkDelete}
                                            className="bg-rose-600 text-white px-4 py-2 font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 border border-rose-700 shadow-sm"
                                        >
                                            <Trash size={16} weight="fill"/> Bulk Delete
                                        </button>
                                    </div>
                                )}
                                <button 
                                    onClick={() => {
                                        setSelectedExportFields(visibleTableFields);
                                        setShowExportModal(true);
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
                                        <th className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap w-10 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 cursor-pointer accent-[#1e3a8a]"
                                                checked={displayedTeachers.length > 0 && selectedTeachers.length === displayedTeachers.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTeachers(displayedTeachers.map(t => t.id));
                                                    } else {
                                                        setSelectedTeachers([]);
                                                    }
                                                }}
                                            />
                                        </th>
                                        {visibleTableFields.map(fieldId => {
                                            const field = allAvailableFields.find(f => f.id === fieldId);
                                            return <th key={fieldId} className="px-4 py-4 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">{field?.label || fieldId}</th>
                                        })}
                                        <th className="px-4 py-4 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {displayedTeachers.slice(0, visibleCount).map((t) => (
                                        <tr key={t.id} className={`hover:bg-blue-50/50 transition-colors group ${selectedTeachers.includes(t.id) ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 cursor-pointer accent-[#1e3a8a]"
                                                    checked={selectedTeachers.includes(t.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedTeachers(prev => [...prev, t.id]);
                                                        } else {
                                                            setSelectedTeachers(prev => prev.filter(id => id !== t.id));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            {visibleTableFields.map(fieldId => {
                                                if (fieldId === 'staffInfo') {
                                                    return (
                                                        <td key={fieldId} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-white dark:bg-slate-800 flex items-center justify-center border-2 border-slate-900 shrink-0 shadow-sm overflow-hidden rounded-full">
                                                                    {t.photoURL ? (
                                                                        <img src={t.photoURL} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        t.gender?.toLowerCase() === 'female' ? <FemaleAvatar /> : <MaleAvatar />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-tight">{t.name}</p>
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.designation || 'Faculty Member'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                }
                                                if (fieldId === 'designation') {
                                                    return (
                                                        <td key={fieldId} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                            <span className="text-[10px] font-black text-[#1e3a8a] bg-blue-50 px-2 py-1 border border-blue-100 uppercase tracking-tighter">
                                                                {t.customData?.designation || t.designation || 'Teacher'}
                                                            </span>
                                                        </td>
                                                    );
                                                }
                                                if (fieldId === 'status') {
                                                    return (
                                                        <td key={fieldId} className="px-4 py-3 text-right border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1 text-[9px] font-black text-white px-2 py-1 uppercase shadow-sm ${t.status === 'Active' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                                                                {t.status === 'Active' ? 'Active' : 'Pending'}
                                                            </span>
                                                        </td>
                                                    );
                                                }
                                                // Custom fields
                                                return (
                                                    <td key={fieldId} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                        {t.customData?.[fieldId] || t[fieldId] || '-'}
                                                    </td>
                                                );
                                            })}
                                             <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canEdit(sectionId) && (
                                                        <button onClick={() => openEditModal(t)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] hover:text-[#1e3a8a] text-slate-400 transition-all shadow-sm" title="Edit">
                                                            <PencilSimple size={14} weight="bold" />
                                                        </button>
                                                    )}
                                                    {canDelete(sectionId) && (
                                                        <button onClick={() => confirmDelete(t)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-500 text-slate-400 transition-all shadow-sm" title="Delete">
                                                            <Trash size={14} weight="bold" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayedTeachers.length === 0 && (
                                        <tr>
                                            <td colSpan={5 + customFields.slice(2, 4).length} className="px-4 py-20 text-center">
                                                <UsersThree size={48} weight="duotone" className="mx-auto mb-2 opacity-30 text-slate-400"/>
                                                <p className="font-black text-sm uppercase tracking-widest text-slate-400">No teachers found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3">
                            {displayedTeachers.length > visibleCount && (
                                <button 
                                    onClick={() => setVisibleCount(prev => prev + 30)}
                                    className="px-8 py-2 bg-[#1e3a8a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#172554] transition-all shadow-md active:translate-y-0.5"
                                >
                                    Show More (+30)
                                </button>
                            )}
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Showing {Math.min(visibleCount, displayedTeachers.length)} of {displayedTeachers.length} Staff Records
                            </p>
                        </div>
                    </div>
                </div>
              )}

          </div>
      </div>

      {/* SHARP CONFIG MODAL */}
      {showConfigModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowConfigModal(false)}></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-lg border-4 border-slate-800 p-0 relative z-10 animate-in zoom-in-95 shadow-2xl">
                  <div className="bg-slate-800 text-white p-5 flex justify-between items-center border-b-4 border-black">
                      <h3 className="text-lg font-black uppercase tracking-tight">Form Configuration</h3>
                      <button onClick={() => setShowConfigModal(false)}><X size={20} weight="bold"/></button>
                  </div>
                  <div className="p-8">
                      <FieldManager />
                      <div className="mt-6 pt-4 border-t-2 border-slate-100 dark:border-slate-800 flex justify-end">
                          <button onClick={handleSaveConfig} disabled={isSaving} className="px-6 py-3 bg-[#1e3a8a] text-white border-2 border-slate-900 font-black text-xs uppercase tracking-widest hover:bg-[#172554] transition-all rounded-none shadow-sm">
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* TABLE CONFIG MODAL */}
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
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Select up to 11 fields to display in the teacher table.</p>
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
                                          onChange={(e) => {
                                              if (e.target.checked) {
                                                  if (visibleTableFields.length >= 11) {
                                                      setConfigError("Maximum 11 fields allowed.");
                                                      return;
                                                  }
                                                  setConfigError(null);
                                                  setVisibleTableFields([...visibleTableFields, field.id]);
                                              } else {
                                                  setConfigError(null);
                                                  setVisibleTableFields(visibleTableFields.filter(id => id !== field.id));
                                              }
                                          }}
                                      />
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{field.label}</span>
                                  </label>
                              );
                          })}
                      </div>
                  </div>
                  <div className="p-4 bg-slate-100 border-t-4 border-slate-800 flex justify-end">
                      <button onClick={() => setShowTableConfigModal(false)} className="px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-colors">
                          Done
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SHARP EXPORT MODAL */}
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
                              {allAvailableFields.map(field => (
                                  <label key={field.id} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                                      <input type="checkbox" checked={selectedExportFields.includes(field.id)} onChange={() => toggleExportField(field.id)} className="w-4 h-4 accent-[#1e3a8a]" />
                                      <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">{field.label}</span>
                                  </label>
                              ))}
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

      {/* SHARP IMPORT MODAL */}
      {showImportModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-lg border-4 border-slate-800 p-0 relative z-10 animate-in zoom-in-95 shadow-2xl">
                  <div className="bg-slate-800 text-white p-5 flex justify-between items-center border-b-4 border-black">
                      <h3 className="text-lg font-black uppercase tracking-tight">Import Faculty</h3>
                      <button onClick={() => setShowImportModal(false)}><X size={20} weight="bold"/></button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="border-2 border-dashed border-slate-300 bg-slate-50 dark:bg-slate-800/50 p-10 text-center cursor-pointer hover:border-[#1e3a8a] hover:bg-blue-50 transition-all group" onClick={() => importFileRef.current?.click()}>
                          <FileCsv size={40} weight="duotone" className="mx-auto text-slate-400 group-hover:text-[#1e3a8a] mb-2 transition-colors"/>
                          <p className="font-bold text-xs text-slate-600 dark:text-slate-300 uppercase tracking-widest">Click to Upload Excel / CSV</p>
                          <input type="file" ref={importFileRef} onChange={handleFileImport} accept=".csv, .xlsx, .xls" className="hidden"/>
                      </div>

                      {importData.length > 0 && (
                          <div className="bg-emerald-50 border-2 border-emerald-100 text-emerald-700 p-4 text-xs font-bold uppercase tracking-wide flex items-center justify-between">
                              <span>{importData.length} records loaded.</span>
                              <button onClick={() => setImportData([])} className="underline">Clear</button>
                          </div>
                      )}

                      <button 
                        onClick={handleBulkSubmit} 
                        disabled={isSaving || importData.length === 0}
                        className="w-full py-4 bg-[#1e3a8a] text-white border-2 border-slate-900 font-black text-xs uppercase tracking-widest hover:bg-[#172554] transition-all disabled:opacity-50 rounded-none shadow-sm"
                      >
                          {isSaving ? 'Importing...' : 'Start Import'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SHARP EDIT MODAL */}
      {showModal && view === 'directory' && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg border-4 border-slate-800 p-0 relative z-10 animate-in zoom-in-95 shadow-2xl h-[90vh] flex flex-col">
            <div className="bg-slate-800 text-white p-5 flex justify-between items-center border-b-4 border-black shrink-0">
                <h3 className="text-lg font-black uppercase tracking-tight">{isEditing ? 'Update Teacher' : 'New Teacher'}</h3>
                <button onClick={() => setShowModal(false)}><X size={20} weight="bold"/></button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              
               {/* PHOTO UPLOAD */}
              <div className="flex flex-col items-center mb-8">
                <div 
                  className="w-32 h-32 bg-slate-100 border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#1e3a8a] transition-all group relative rounded-full"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center w-full h-full flex flex-col items-center justify-center">
                      <div className="absolute inset-0 opacity-40">
                        {form.customData.gender?.toLowerCase() === 'female' ? <FemaleAvatar /> : <MaleAvatar />}
                      </div>
                      <Camera size={32} className="mx-auto text-slate-400 group-hover:text-[#1e3a8a] mb-1 relative z-10"/>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest relative z-10">Upload Photo</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                    <PencilSimple size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Professional Headshot Preferred</p>
              </div>

              {/* DYNAMIC FORM */}
              {customFields.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {customFields.map(field => (
                          <div key={field.id} className={field.type === 'text' && (field.id === 'name') ? 'md:col-span-2' : ''}>
                              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 block mb-1">
                                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                              </label>
                              {field.type === 'select' ? (
                                  <select
                                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] rounded-none text-sm uppercase"
                                      value={form.customData[field.id] || ''}
                                      onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                  >
                                      <option value="">Select {field.label}</option>
                                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                              ) : (
                                  <input 
                                      type={field.type} 
                                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a] rounded-none text-sm uppercase placeholder-slate-400"
                                      value={form.customData[field.id] || ''}
                                      onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                      placeholder={`ENTER ${field.label}`}
                                  />
                              )}
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No fields configured.</p>
                  </div>
              )}
              
              {errorMsg && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 border border-rose-200 mt-4 text-center uppercase tracking-wide">{errorMsg}</p>}
            </div>

            <div className="p-6 border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                <button disabled={isSaving} onClick={handleSave} className="w-full py-4 bg-[#1e3a8a] text-white border-2 border-slate-900 font-black text-xs uppercase tracking-widest hover:bg-[#172554] transition-all disabled:opacity-50 rounded-none shadow-sm flex items-center justify-center gap-2">
                    {isSaving ? <CircleNotch className="animate-spin" size={18}/> : <ShieldCheck size={18} weight="fill"/>} 
                    {isEditing ? 'Save Changes' : 'Enroll Teacher'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARP SUCCESS MODAL */}
      {generatedCreds && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
              <div className="bg-white dark:bg-slate-800 w-full max-w-sm border-4 border-slate-800 p-0 relative z-10 animate-in zoom-in-95 shadow-2xl">
                  <div className="bg-emerald-600 text-white p-8 text-center border-b-4 border-emerald-800">
                      <UserPlus size={48} weight="fill" className="mx-auto mb-2"/>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Teacher Enrolled!</h3>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-bold text-center uppercase tracking-wider mb-4">Share these details with the teacher.</p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 p-6 space-y-4 relative">
                          <div className="absolute top-0 right-0 bg-slate-800 text-white text-[9px] font-black uppercase px-2 py-1">Credentials</div>
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Email</p>
                              <p className="text-xl font-black text-[#1e3a8a] tracking-tight">{generatedCreds.email}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Password</p>
                              <p className="text-base font-bold text-slate-700 dark:text-slate-200">{generatedCreds.password}</p>
                          </div>
                      </div>
                      
                      <button onClick={() => setGeneratedCreds(null)} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all rounded-none border-2 border-black">Done</button>
                  </div>
              </div>
          </div>
      )}

      {/* ImageStudio Removed */}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-md border-4 border-slate-800 p-0 relative z-10 animate-in zoom-in-95 shadow-2xl">
            <div className="bg-rose-600 text-white p-5 flex justify-between items-center border-b-4 border-black">
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <WarningCircle size={24} weight="fill"/> Confirm Deletion
                </h3>
                <button onClick={() => setShowDeleteModal(false)}><X size={20} weight="bold"/></button>
            </div>
            <div className="p-8 text-center">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-6">
                    {isBulkAction 
                        ? `Are you absolutely sure you want to delete ${selectedTeachers.length} selected teacher records? This action cannot be undone.`
                        : <>Are you sure you want to delete <span className="text-slate-900 dark:text-white font-black underline">{teacherToDelete?.name}</span>? This action is permanent and cannot be undone.</>
                    }
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all rounded-none"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="flex-1 py-3 bg-rose-600 text-white border-2 border-rose-700 font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all rounded-none shadow-sm flex items-center justify-center gap-2"
                    >
                        {isSaving ? <CircleNotch className="animate-spin" size={16}/> : <Trash size={16} weight="fill"/>}
                        Delete Now
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherManagement;
