
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MagnifyingGlass, Funnel, Printer, CreditCard, CheckCircle, XCircle, 
  User, Camera, CircleNotch, Sliders, Image, X, SquaresFour, List, IdentificationCard, WarningCircle, ArrowsLeftRight, DownloadSimple, Info
} from 'phosphor-react';
import { updateStudent, saveIssuedCard, uploadFileToStorage } from '../../services/api.ts';
import IDCardRenderer from '../../components/IDCardRenderer.tsx';
import imageCompression from 'browser-image-compression';
import CameraCapture from '../../components/CameraCapture.tsx';
import { Student, School } from '../../types.ts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface IdCardManagementProps {
  schoolId: string;
  students: Student[];
  classes: any[];
  school: School;
  onRefresh?: () => void;
}

const IdCardManagement: React.FC<IdCardManagementProps> = ({ schoolId, students, classes, school, onRefresh }) => {
  // --- STATE ---
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'issued' | 'pending'>('all');
  
  // Issuing State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [issueData, setIssueData] = useState<Record<string, string>>({});
  const [issuePhoto, setIssuePhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Image Tools
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print Mode
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printSelection, setPrintSelection] = useState<string[]>([]); // Student IDs to print
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Custom Print Size
  const isLandscape = school?.idCardConfig?.orientation === 'landscape';
  const [printWidth, setPrintWidth] = useState<number>(isLandscape ? 86 : 54);
  const [printHeight, setPrintHeight] = useState<number>(isLandscape ? 54 : 86);

  useEffect(() => {
    if (school?.idCardConfig?.orientation) {
      const isL = school.idCardConfig.orientation === 'landscape';
      setPrintWidth(isL ? 86 : 54);
      setPrintHeight(isL ? 54 : 86);
    }
  }, [school?.idCardConfig?.orientation]);

  // Calculate scale factors for custom print size
  const cardWidthPx = isLandscape ? 856 : 540;
  const cardHeightPx = isLandscape ? 540 : 856;
  const scaleX = (printWidth * 3.779527559) / cardWidthPx;
  const scaleY = (printHeight * 3.779527559) / cardHeightPx;

  // --- FILTERING ---
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.includes(searchTerm);
      const isIssued = !!s.issuedIdCard;
      const matchStatus = filterStatus === 'all' 
        ? true 
        : filterStatus === 'issued' ? isIssued : !isIssued;

      return matchClass && matchSearch && matchStatus;
    });
  }, [students, selectedClassId, searchTerm, filterStatus]);

  const issuedCount = students.filter(s => s.issuedIdCard).length;
  const pendingCount = students.length - issuedCount;

  // --- HANDLERS ---

  const handleOpenIssue = (student: Student) => {
    const className = classes.find(c => c.id === student.classId)?.name || '';
    const configElements = school.idCardConfig?.elements || {};
    
    // Default Config Sizes for Photo
    const defaultConfig = configElements.photo || { width: 35, height: 40 };

    // Initialize with existing issued data OR start fresh
    const initialData: Record<string, string> = student.issuedIdCard ? { ...student.issuedIdCard } : {};

    // SMART AUTO-FILL:
    // Only fill fields that are visible on the card and not already set
    
    // 1. Name
    if (configElements['name']?.visible && !initialData['name']) {
        initialData['name'] = student.name;
    }
    // 2. Class
    if (configElements['class']?.visible && !initialData['class']) {
        initialData['class'] = className;
    }
    // 3. Roll No
    if (configElements['rollNo']?.visible && !initialData['rollNo']) {
        initialData['rollNo'] = student.rollNo;
    }
    // 4. Father Name
    if (configElements['fatherName']?.visible && !initialData['fatherName']) {
        initialData['fatherName'] = student.fatherName;
    }
    // 5. Phone
    if (configElements['phone']?.visible && !initialData['phone']) {
        initialData['phone'] = student.phone || '';
    }
    // 6. DOB
    if (configElements['dob']?.visible && !initialData['dob']) {
        initialData['dob'] = student.dob || '';
    }
    // 7. Address
    if ((configElements['address']?.visible || configElements['address_school']?.visible || configElements['address_student']?.visible) && !initialData['address']) {
        initialData['address'] = student.customData?.address || '';
    }
    // 8. Emergency
    if (configElements['emergency']?.visible && !initialData['emergency']) {
        initialData['emergency'] = student.customData?.emergencyContact || '';
    }
    // 9. Blood Group
    if (configElements['bloodGroup']?.visible && !initialData['bloodGroup']) {
        initialData['bloodGroup'] = student.customData?.bloodGroup || '';
    }

    // Ensure photo dimensions are set
    if (!initialData.photoWidth) initialData.photoWidth = String(defaultConfig.width || 35);
    if (!initialData.photoHeight) initialData.photoHeight = String(defaultConfig.height || 40);

    setCurrentStudent(student);
    setIssueData(initialData);
    setIssuePhoto(initialData.photo || student.photoURL || null);
    setShowIssueModal(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setIssuePhoto(result);
            setIssueData(prev => ({ ...prev, photo: result }));
        };
        reader.readAsDataURL(compressed);
    } catch(e) { console.error(e); }
  };

  const handleCameraCapture = (imageData: string) => {
    setIssuePhoto(imageData);
    setIssueData(prev => ({ ...prev, photo: imageData }));
    setShowCamera(false);
  };

  const handleSaveCard = async () => {
      if (!currentStudent) return;
      setIsSaving(true);
      try {
          let finalPhotoUrl = issuePhoto;
          
          // Upload if Base64
          if (finalPhotoUrl && finalPhotoUrl.startsWith('data:')) {
              const blob = await (await fetch(finalPhotoUrl)).blob();
              const file = new File([blob], `id_photo_${currentStudent.id}.png`, { type: "image/png" });
              const { publicUrl } = await uploadFileToStorage(file, `schools/${schoolId}/students/${currentStudent.id}/id_photo_${Date.now()}.png`);
              finalPhotoUrl = publicUrl;
          }

          const finalData = { ...issueData, photo: finalPhotoUrl || '' };
          await saveIssuedCard(schoolId, currentStudent.id, finalData);
          
          // Also update the student's main photoURL so it shows up in the gallery
          if (finalPhotoUrl) {
              await updateStudent(schoolId, currentStudent.id, {
                  photoURL: finalPhotoUrl
              });
          }
          
          if (onRefresh) onRefresh();
          setShowIssueModal(false);
          // Optional: Show toast
      } catch (err: any) {
          console.error(err);
          // Assuming API handles validation, if this fails, likely missing column
          alert(`Failed to save ID Card: ${err.message || 'Unknown error'}`);
      } finally {
          setIsSaving(false);
      }
  };

  const togglePrintSelection = (studentId: string) => {
      setPrintSelection(prev => 
          prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
      );
  };

  const handleSelectAllForPrint = () => {
      if (printSelection.length === filteredStudents.length) {
          setPrintSelection([]);
      } else {
          setPrintSelection(filteredStudents.map(s => s.id));
      }
  };

          const handlePrint = () => {
    window.print();
  };

  // --- STYLES ---
  const inputStyle = "w-full p-3 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-slate-700 placeholder-slate-400 rounded-xl transition-all text-sm backdrop-blur-sm";
  const labelStyle = "text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1";

  const printStyles = `
      @media print {
      body > *:not(#print-area) {
        display: none !important;
      }
      #print-area {
        position: static !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        z-index: auto !important;
        background: white !important;
      }
      .print-header {
        display: none !important;
      }
      .print-card-wrapper {
        width: ${printWidth}mm !important;
        height: ${printHeight}mm !important;
        overflow: hidden !important;
        position: relative !important;
        display: inline-block !important;
        margin: 2mm !important;
        page-break-inside: avoid !important;
      }
      .print-card-inner {
        transform: scale(${scaleX}, ${scaleY}) !important;
        transform-origin: top left !important;
      }
      @page { margin: 0.5cm; size: A4; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  `;

  useEffect(() => {
    if (isPrintMode) {
      const styleElement = document.createElement('style');
      styleElement.id = 'print-styles';
      styleElement.innerHTML = printStyles;
      document.head.appendChild(styleElement);

      return () => {
        const existingStyle = document.getElementById('print-styles');
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }
  }, [isPrintMode, printStyles]);

  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    // Initialize PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    
    let currentY = margin;
    
    // Get list of IDs
    const studentsToPrint = students.filter(s => printSelection.includes(s.id));

    try {
        for (let i = 0; i < studentsToPrint.length; i++) {
            const student = studentsToPrint[i];
            const element = document.getElementById(`card-${student.id}`);
            
            if (element) {
                // High quality canvas capture
                const canvas = await html2canvas(element, { 
                    scale: 2, 
                    useCORS: true, 
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/png');
                
                // Calculate dimensions to fit width (leaving margins)
                // ID Card pair (Front + Back) aspect ratio
                const imgProps = pdf.getImageProperties(imgData);
                
                // Use custom print height, and scale width proportionally
                const pdfImgHeight = printHeight;
                const pdfImgWidth = (imgProps.width * pdfImgHeight) / imgProps.height;
                
                // Check for page break
                if (currentY + pdfImgHeight > pageHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }
                
                pdf.addImage(imgData, 'PNG', margin, currentY, pdfImgWidth, pdfImgHeight);
                
                // Add spacing
                currentY += pdfImgHeight + 5;
            }
        }
        
        pdf.save(`ID_Cards_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
        console.error("PDF Generation Error:", err);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        setIsDownloadingPdf(false);
    }
  };

  // --- PRINT MODE RENDERER ---
  if (isPrintMode) {
      const studentsToPrint = students.filter(s => printSelection.includes(s.id));
      
      return (
        <>
          <div id="print-area" className="fixed inset-0 bg-white dark:bg-slate-800 z-[9999] overflow-y-auto">
            <div className="print-header fixed top-0 left-0 right-0 bg-slate-900 text-white p-6 shadow-xl flex flex-col md:flex-row justify-between items-center z-50 print:hidden border-b border-white/10 backdrop-blur-md bg-slate-900/90 gap-4">
              <div className="flex items-center gap-5">
                <button onClick={() => setIsPrintMode(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 dark:bg-slate-800/10 hover:bg-white/20 dark:bg-slate-800/20 rounded-xl transition-all"><X weight="bold" size={20}/></button>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Print Preview</h2>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{studentsToPrint.length} Cards Selected</p>
                </div>
              </div>

              {/* Custom Size Inputs */}
              <div className="flex flex-col items-center md:items-end gap-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Width (mm)</label>
                    <input type="number" value={printWidth} onChange={e => setPrintWidth(Number(e.target.value))} className="w-20 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Height (mm)</label>
                    <input type="number" value={printHeight} onChange={e => setPrintHeight(Number(e.target.value))} className="w-20 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Note: Recommended size is {isLandscape ? '86mm x 54mm' : '54mm x 86mm'}. Adjusting this will scale the printed cards.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleDownloadPDF} disabled={isDownloadingPdf} className="px-6 py-2.5 bg-white/10 dark:bg-slate-800/10 hover:bg-white/20 dark:bg-slate-800/20 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-white/20 disabled:opacity-50">
                  {isDownloadingPdf ? <CircleNotch size={18} className="animate-spin"/> : <DownloadSimple size={18} weight="bold"/>} 
                  {isDownloadingPdf ? 'Generating...' : 'Download PDF'}
                </button>
                <button onClick={handlePrint} className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25">
                  <Printer size={18} weight="bold"/> Print Now
                </button>
              </div>
            </div>

            <div className="p-8 pt-32 print:p-0 print:pt-0">
              <div className="print-content-area">
                <div className="flex flex-wrap gap-8 justify-center print:block">
                  {studentsToPrint.map((student) => (
                    <div id={`card-${student.id}`} key={student.id} className="print:inline-block print:m-2 print:break-inside-avoid relative mb-8 print:mb-4 bg-white dark:bg-slate-800 p-2">
                      <div className="flex gap-5 print:gap-0 items-center">
                        <div className="print-card-wrapper print:border-none print:m-1" style={{ width: `${printWidth}mm`, height: `${printHeight}mm`, overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0' }}>
                          <div className="print-card-inner" style={{ transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: 'top left' }}>
                            <IDCardRenderer school={school} data={student.issuedIdCard || {}} side="front" student={student} />
                          </div>
                        </div>
                        <div className="print-card-wrapper print:border-none print:m-1" style={{ width: `${printWidth}mm`, height: `${printHeight}mm`, overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0' }}>
                          <div className="print-card-inner" style={{ transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: 'top left' }}>
                            <IDCardRenderer school={school} data={student.issuedIdCard || {}} side="back" student={student} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <style>{printStyles}</style>
        </>
      );
    }

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-50 dark:bg-slate-800/50 min-h-screen">
        
        {/* --- HEADER --- */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
            
            <div className="max-w-[1600px] mx-auto px-6 py-10 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/10 dark:bg-slate-800/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                            <IdentificationCard size={32} className="text-indigo-300" weight="duotone" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">ID Card Management</h1>
                            <p className="text-indigo-200/70 text-sm mt-1 font-medium">Design, Manage and Issue Student Identification Cards</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white/10 dark:bg-slate-800/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Production Ready</span>
                        </div>
                        {printSelection.length > 0 && (
                            <button 
                                onClick={() => setIsPrintMode(true)} 
                                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95"
                            >
                                <Printer size={18} weight="bold"/> Print Selected ({printSelection.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- CONTENT BODY --- */}
        <div className="max-w-[1600px] mx-auto px-6 -mt-8 space-y-8 relative z-20">
            
            {/* --- KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Issued Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cards Issued</span>
                            <h3 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{issuedCount}</h3>
                            <div className="flex items-center gap-1.5 mt-2">
                                <CheckCircle size={14} className="text-emerald-500" weight="fill" />
                                <span className="text-xs font-semibold text-emerald-600">Verified Students</span>
                            </div>
                        </div>
                        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                            <IdentificationCard size={24} weight="duotone"/>
                        </div>
                    </div>
                </div>

                {/* Pending Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pending Generation</span>
                            <h3 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{pendingCount}</h3>
                            <div className="flex items-center gap-1.5 mt-2">
                                <WarningCircle size={14} className="text-rose-500" weight="fill" />
                                <span className="text-xs font-semibold text-rose-600">Requires Action</span>
                            </div>
                        </div>
                        <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                            <WarningCircle size={24} weight="duotone"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN REGISTRY SECTION --- */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* TOOLBAR */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <List size={20} weight="bold"/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Card Registry</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage student ID cards and issuance status</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Class Filter */}
                        <div className="relative flex-1 min-w-[160px]">
                            <Funnel size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select 
                                value={selectedClassId} 
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all appearance-none"
                            >
                                <option value="all">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="relative flex-1 min-w-[140px]">
                            <Sliders size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all appearance-none"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="issued">Issued</option>
                            </select>
                        </div>

                        {/* Search */}
                        <div className="relative flex-[2] min-w-[240px]">
                            <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by name or roll number..." 
                                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button 
                            onClick={handleSelectAllForPrint}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                        >
                            <ArrowsLeftRight size={16} weight="bold"/>
                            {printSelection.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                </div>

                {/* --- STUDENT GRID --- */}
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredStudents.map(student => {
                            const isIssued = !!student.issuedIdCard;
                            const isSelected = printSelection.includes(student.id);

                            return (
                                <div 
                                    key={student.id} 
                                    onClick={() => togglePrintSelection(student.id)}
                                    className={`bg-white p-5 rounded-3xl border-2 transition-all relative group cursor-pointer ${
                                        isSelected 
                                        ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 ring-4 ring-indigo-500/5' 
                                        : 'border-slate-100 hover:border-indigo-200 hover:shadow-lg'
                                    }`}
                                >
                                    <div className="absolute top-4 right-4 z-10">
                                        {isSelected ? (
                                            <div className="w-6 h-6 bg-indigo-500 text-white flex items-center justify-center rounded-full shadow-lg shadow-indigo-500/30 ring-2 ring-white">
                                                <CheckCircle size={16} weight="fill"/>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-full group-hover:border-indigo-300 transition-colors"></div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                            {student.photoURL ? (
                                                <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={28} className="text-slate-300" weight="duotone" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate leading-tight">{student.name}</h3>
                                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Roll: {student.rollNo}</p>
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isIssued ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isIssued ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isIssued ? 'Issued' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenIssue(student); }} 
                                        className={`w-full py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                                            isIssued 
                                            ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200' 
                                            : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                                        }`}
                                    >
                                        <CreditCard size={18} weight="duotone"/> 
                                        {isIssued ? 'Update Card' : 'Generate ID'}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                    {filteredStudents.length === 0 && (
                        <div className="text-center py-24">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MagnifyingGlass size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-400">No students found</h3>
                            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search term</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- ISSUE CARD MODAL --- */}
        {showIssueModal && currentStudent && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowIssueModal(false)}></div>
                <div className="bg-white dark:bg-slate-800 w-full max-w-3xl h-[90vh] md:h-[85vh] rounded-[2.5rem] border border-slate-200 dark:border-slate-700 relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
                    
                    {/* Configuration */}
                    <div className="w-full flex flex-col bg-white dark:bg-slate-800 h-full">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Issue ID Card</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Configure student details for {currentStudent.name}</p>
                            </div>
                            <button 
                                onClick={() => setShowIssueModal(false)} 
                                className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center"
                            >
                                <X weight="bold" size={20}/>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                            {/* Photo Section */}
                            <div className="bg-slate-50 dark:bg-slate-800/50/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-28 h-36 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 overflow-hidden relative group transition-all shrink-0"
                                    >
                                        {issuePhoto ? (
                                            <img src={issuePhoto} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <Camera className="text-slate-300 mx-auto mb-2" size={28} weight="duotone"/>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-indigo-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                            <p className="text-white text-xs font-bold uppercase tracking-widest text-center px-2">Change Photo</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">Passport Photo</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">High-quality portrait required for official identification.</p>
                                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                            <button 
                                                onClick={() => fileInputRef.current?.click()} 
                                                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                Browse Files
                                            </button>
                                            <button 
                                                onClick={() => setShowCamera(true)} 
                                                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
                                            >
                                                <Camera size={16} weight="bold"/> Take Photo
                                            </button>
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                    </div>
                                </div>

                                {/* Sliders */}
                                <div className="mt-8 space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700/60">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <Sliders size={18} weight="bold"/>
                                        <span className="text-sm font-bold">Photo Dimensions</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                                <span>Width</span>
                                                <span className="text-indigo-600">{issueData.photoWidth}%</span>
                                            </div>
                                            <input 
                                                type="range" min="10" max="100" 
                                                value={issueData.photoWidth || '35'} 
                                                onChange={(e) => setIssueData({...issueData, photoWidth: e.target.value})}
                                                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                                <span>Height</span>
                                                <span className="text-indigo-600">{issueData.photoHeight}%</span>
                                            </div>
                                            <input 
                                                type="range" min="10" max="100" 
                                                value={issueData.photoHeight || '40'} 
                                                onChange={(e) => setIssueData({...issueData, photoHeight: e.target.value})}
                                                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Text Fields */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                        <CreditCard size={18} weight="bold"/>
                                    </div>
                                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Card Information</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {Object.keys(school.idCardConfig?.elements || {}).map(key => {
                                        const el = school.idCardConfig!.elements[key];
                                        if (!el.visible || el.type === 'image' || key === 'photo' || key.startsWith('label_') || key.startsWith('school') || key === 'logo' || key === 'signature') return null;

                                        const commonMap: Record<string, string> = {
                                            'fatherName': 'label_father',
                                            'address_student': 'label_address'
                                        };
                                        
                                        const labelLayerKey = commonMap[key] || `label_${key}`;
                                        const labelLayer = school.idCardConfig?.elements[labelLayerKey];
                                        
                                        let formLabel = key;
                                        
                                        if (labelLayer && labelLayer.label) {
                                            formLabel = labelLayer.label;
                                        } else if (el.label && el.label !== `Value: ${key}` && !el.label.startsWith('Value:')) {
                                            formLabel = el.label;
                                        } else if (el.prefix) {
                                            formLabel = el.prefix.replace(/[:]/g, '').trim();
                                        } else {
                                            formLabel = key.replace(/([A-Z])/g, ' $1').trim();
                                        }

                                        return (
                                            <div key={key}>
                                                <label className={labelStyle}>{formLabel}</label>
                                                <input 
                                                    type="text" 
                                                    value={issueData[key] || ''}
                                                    onChange={e => setIssueData({...issueData, [key]: e.target.value})}
                                                    className={inputStyle}
                                                    placeholder={`Enter ${formLabel.toLowerCase()}...`}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                    <WarningCircle size={20} weight="bold" />
                                </div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[200px]">Review all information carefully before issuing the card.</p>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => setShowIssueModal(false)} 
                                    className="flex-1 sm:flex-none px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveCard} 
                                    disabled={isSaving}
                                    className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                >
                                    {isSaving ? <CircleNotch className="animate-spin" size={18} weight="bold"/> : <CheckCircle size={18} weight="fill"/>}
                                    {isSaving ? 'Processing...' : 'Issue ID Card'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- CAMERA MODAL --- */}
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

export default IdCardManagement;
