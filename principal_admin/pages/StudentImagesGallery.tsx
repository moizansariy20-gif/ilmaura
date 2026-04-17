import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DownloadSimple, Image as ImageIcon, MagnifyingGlass, Funnel, UserCircle, CircleNotch, IdentificationCard, X, CheckSquare, Square, Palette, Camera, PencilSimple, UploadSimple, ArrowClockwise, MagicWand, ArrowLeft as LArrowLeft, Sparkle as LSparkles, Gear as LSettings, Users as LUsers, Check as LCheck, Phone as LPhone, Student as LStudent } from 'phosphor-react';
import { Student, Class, School } from '../../types';
import jsPDF from 'jspdf';
import CameraCapture from '../../components/CameraCapture.tsx';
import SmartIdProcessor from '../../components/SmartIdProcessor.tsx';
import { updateStudent, uploadFileToStorage } from '../../services/api.ts';

interface StudentImagesGalleryProps {
  schoolId: string;
  students: Student[];
  classes: Class[];
  school: School;
  profile?: any;
  onRefresh?: () => void;
  onNavigate?: (path: string) => void;
}

const StudentImagesGallery: React.FC<StudentImagesGalleryProps> = ({ schoolId, students, classes, school, profile, onRefresh, onNavigate }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [passportSize, setPassportSize] = useState<'standard' | 'large' | 'small' | 'wallet' | 'stamp' | 'custom'>('standard');
  const [customWidth, setCustomWidth] = useState<number>(35);
  const [customHeight, setCustomHeight] = useState<number>(45);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Photo Update State
  const [updatingStudent, setUpdatingStudent] = useState<Student | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [imageToProcess, setImageToProcess] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [useAIProcessing, setUseAIProcessing] = useState(true);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert image URL to base64 for PDF
  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg');
        resolve(dataURL);
      };
      img.onerror = error => reject(error);
      img.src = imageUrl;
    });
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClass, searchTerm]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleExportPDF = async () => {
    const studentsToExport = selectedStudentIds.size > 0 
      ? filteredStudents.filter(s => selectedStudentIds.has(s.id))
      : filteredStudents;

    if (studentsToExport.length === 0) {
      alert("No students to export.");
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Passport dimensions in mm
      const sizes = {
        standard: { w: 35, h: 45 },
        large: { w: 50.8, h: 50.8 }, // 2x2 inch
        small: { w: 25, h: 35 },
        wallet: { w: 64, h: 89 },
        stamp: { w: 20, h: 25 },
        custom: { w: customWidth, h: customHeight }
      };
      
      const { w: photoWidth, h: photoHeight } = sizes[passportSize];
      
      const marginX = 10;
      const marginY = 10;
      const spacingX = 5;
      const spacingY = 5;
      
      const cols = Math.floor((pageWidth - marginX * 2 + spacingX) / (photoWidth + spacingX));
      const rows = Math.floor((pageHeight - marginY * 2 + spacingY) / (photoHeight + spacingY));

      let currentStudentIndex = 0;

      while (currentStudentIndex < studentsToExport.length) {
        if (currentStudentIndex > 0) {
          doc.addPage();
        }

        for (let row = 0; row < rows; row++) {
          if (currentStudentIndex >= studentsToExport.length) break;
          for (let col = 0; col < cols; col++) {
            if (currentStudentIndex >= studentsToExport.length) break;

            const student = studentsToExport[currentStudentIndex];
            const x = marginX + col * (photoWidth + spacingX);
            const y = marginY + row * (photoHeight + spacingY);

            // Draw Photo
            const photoUrl = student.photoURL || student.customData?.photoURL;
            if (photoUrl) {
              try {
                const base64Img = await getBase64ImageFromUrl(photoUrl);
                doc.addImage(base64Img, 'JPEG', x, y, photoWidth, photoHeight);
              } catch (e) {
                doc.setDrawColor(200, 200, 200);
                doc.rect(x, y, photoWidth, photoHeight);
                doc.setFontSize(8);
                doc.text("Error Loading", x + photoWidth/2, y + photoHeight/2, { align: 'center' });
              }
            } else {
              doc.setDrawColor(200, 200, 200);
              doc.setFillColor(245, 245, 245);
              doc.rect(x, y, photoWidth, photoHeight, 'FD');
              doc.setTextColor(150, 150, 150);
              doc.setFontSize(8);
              doc.text("No Photo", x + photoWidth/2, y + photoHeight/2, { align: 'center' });
            }

            currentStudentIndex++;
          }
        }
      }

      const fileName = `Student_Photos_${selectedClass === 'all' ? 'All' : selectedClass}_${passportSize}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSingle = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, '_')}_photo.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed", error);
      // Fallback
      window.open(url, '_blank');
    }
  };

  const handleCameraCapture = (imageData: string) => {
    setShowCamera(false);
    if (useAIProcessing) {
      setImageToProcess(imageData);
      setIsProcessingPhoto(true);
    } else {
      handleProcessedPhoto(imageData);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        if (useAIProcessing) {
          setImageToProcess(imageData);
          setIsProcessingPhoto(true);
        } else {
          handleProcessedPhoto(imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessedPhoto = async (processedImageData: string) => {
    if (!updatingStudent) return;
    
    setIsUploading(true);
    try {
      // 1. Convert base64 to blob
      const res = await fetch(processedImageData);
      const blob = await res.blob();
      const file = new File([blob], `student_${updatingStudent.id}_photo.jpg`, { type: 'image/jpeg' });

      // 2. Upload to storage
      const fileName = `student_photos/${schoolId}/${updatingStudent.id}_${Date.now()}.jpg`;
      const { publicUrl } = await uploadFileToStorage(file, fileName);

      // 3. Update student record
      await updateStudent(schoolId, updatingStudent.id, { photoURL: publicUrl });
      
      // 4. Trigger refresh to show the new photo in real-time
      if (onRefresh) {
        onRefresh();
      } else if ((window as any).refreshPrincipalData) {
        (window as any).refreshPrincipalData();
      }

      alert("Photo updated successfully!");
      setIsProcessingPhoto(false);
      setUpdatingStudent(null);
      setImageToProcess(null);
    } catch (error) {
      console.error("Error updating photo:", error);
      alert("Failed to update photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isMobile) {
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
              <LArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-[#1e3a8a] dark:text-white tracking-tight drop-shadow-sm" style={{ textShadow: '0 2px 4px rgba(30,58,138,0.1)' }}>
                Directory
              </h1>
              <div className="flex flex-col mt-1">
                <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase">Principal App • Student Photos</p>
              </div>
            </div>
            <div className="flex p-1.5 bg-gradient-to-br from-[#1e3a8a] to-[#172554] shadow-[0_10px_25px_-5px_rgba(30,58,138,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] rounded-2xl border-2 border-[#D4AF37]/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-white/10 dark:bg-slate-800/10 flex items-center justify-center relative z-10">
                {profile?.photoURL ? (
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

          <div className="relative z-10 space-y-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH STUDENTS..."
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full p-4 pl-12 bg-[#FCFBF8] dark:bg-slate-900 shadow-[inset_0_2px_8px_rgba(30,58,138,0.04)] border border-[#E5E0D8] dark:border-slate-700 rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all"
              />
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
            </div>
            <div className="relative">
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-4 pl-12 bg-[#FCFBF8] dark:bg-slate-900 shadow-[inset_0_2px_8px_rgba(30,58,138,0.04)] border border-[#E5E0D8] dark:border-slate-700 rounded-xl text-sm font-bold text-[#1e3a8a] dark:text-white focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] outline-none transition-all appearance-none uppercase"
              >
                <option value="all">ALL CLASSES</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Funnel size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
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
                    <p className="font-black text-3xl text-[#1e3a8a] dark:text-white leading-none drop-shadow-sm">{filteredStudents.length}</p>
                    <p className="text-[10px] font-bold uppercase text-[#D4AF37] tracking-widest mt-2">Students</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_-6px_rgba(30,58,138,0.08)] border border-[#D4AF37]/20 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative z-10">
                  <ImageIcon size={24} className="drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                    <p className="font-black text-3xl text-emerald-600 leading-none drop-shadow-sm">{filteredStudents.filter(s => s.photoURL || s.customData?.photoURL).length}</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest mt-2">With Photos</p>
                </div>
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-6 relative z-0">
            <div className="flex items-center gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
              <h2 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest px-2 drop-shadow-sm">
                Student Directory
              </h2>
              <div className="h-px bg-gradient-to-l from-transparent via-[#D4AF37]/40 to-[#D4AF37]/40 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const photoUrl = student.photoURL || student.customData?.photoURL;
                  const studentClass = classes.find(c => c.id === student.classId);
                  
                  return (
                    <div key={student.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-[#D4AF37]/20 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] flex items-center justify-between gap-4 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] to-[#1e3a8a] opacity-90"></div>
                      
                      <div className="flex items-center gap-4 pl-2">
                        <div 
                          className="relative shrink-0 cursor-pointer"
                          onClick={() => photoUrl && setPreviewImage(photoUrl)}
                        >
                          <div className={`w-14 h-14 rounded-2xl ${!photoUrl ? 'bg-gradient-to-br from-[#1e3a8a] to-[#172554] text-white' : 'bg-slate-100'} flex items-center justify-center font-black text-xl shrink-0 border-2 border-white dark:border-slate-700 shadow-lg overflow-hidden`}>
                              {photoUrl ? (
                                <img src={photoUrl} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                student.name[0]?.toUpperCase() || '?'
                              )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[#1e3a8a] dark:text-white text-lg leading-tight truncate tracking-tight">{student.name}</p>
                          <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mt-1 flex items-center gap-1">
                            {studentClass?.name || 'Unknown Class'} • Roll: {student.rollNo}
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setUpdatingStudent(student);
                          setImageToProcess(null);
                        }}
                        className="w-10 h-10 rounded-xl bg-[#FCFBF8] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 flex items-center justify-center text-[#1e3a8a] dark:text-white shadow-sm active:scale-95 transition-transform shrink-0"
                      >
                        <Camera size={20} weight="fill" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-16 rounded-3xl bg-white dark:bg-slate-800 shadow-[0_10px_40px_-10px_rgba(30,58,138,0.05)] border-2 border-[#D4AF37]/30 border-dashed">
                  <LStudent size={48} className="text-[#D4AF37] mx-auto mb-4 opacity-50" weight="fill" />
                  <p className="text-xl font-black text-[#1e3a8a] dark:text-white tracking-tight">No Students Found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Update Photo Modal */}
        {updatingStudent && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border-t-4 sm:border-4 border-[#1e3a8a] relative z-10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95">
              <div className="bg-[#1e3a8a] text-white p-5 flex justify-between items-center border-b-4 border-[#D4AF37]/30">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Update Photo</h3>
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-0.5">{updatingStudent.name}</p>
                </div>
                <button onClick={() => { setUpdatingStudent(null); setShowCamera(false); setImageToProcess(null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                {isUploading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-[#1e3a8a] dark:text-white">
                    <CircleNotch size={48} className="animate-spin mb-4 text-[#D4AF37]" />
                    <p className="font-black uppercase tracking-widest text-sm">Uploading Photo...</p>
                  </div>
                ) : imageToProcess ? (
                  <div className="space-y-4">
                    <SmartIdProcessor 
                      originalImage={imageToProcess}
                      uniformUrl=""
                      backgroundColor="#0000FF"
                      onComplete={handleProcessedPhoto}
                      onError={(err) => {
                        alert(err);
                        setImageToProcess(null);
                      }}
                    />
                  </div>
                ) : showCamera ? (
                  <div className="space-y-4">
                    <CameraCapture 
                      onCapture={(img) => {
                        setImageToProcess(img);
                        setShowCamera(false);
                      }}
                      onClose={() => setShowCamera(false)}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isMobile && (
                      <button 
                        onClick={() => setShowCamera(true)}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-[#FCFBF8] dark:bg-slate-900 border-2 border-[#E5E0D8] dark:border-slate-700 rounded-2xl hover:border-[#D4AF37] hover:shadow-lg transition-all group"
                      >
                        <div className="w-16 h-16 rounded-full bg-[#1e3a8a]/10 dark:bg-white/10 flex items-center justify-center text-[#1e3a8a] dark:text-white group-hover:scale-110 transition-transform">
                          <Camera size={32} weight="fill" />
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest text-[#1e3a8a] dark:text-white">Take Photo</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => photoInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-3 p-6 bg-[#FCFBF8] dark:bg-slate-900 border-2 border-[#E5E0D8] dark:border-slate-700 rounded-2xl hover:border-[#D4AF37] hover:shadow-lg transition-all group ${!isMobile ? 'col-span-full' : ''}`}
                    >
                      <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform">
                        <UploadSimple size={32} weight="fill" />
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest text-[#1e3a8a] dark:text-white">Upload File</span>
                    </button>
                    <input 
                      type="file" 
                      ref={photoInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => setImageToProcess(e.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <button 
                className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
                onClick={() => setPreviewImage(null)}
              >
                <X size={32} />
              </button>
              <img src={previewImage} alt="Preview" className="max-w-full max-h-[75vh] object-contain border-4 border-white shadow-2xl" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X size={32} />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[75vh] object-contain border-4 border-white shadow-2xl" />
            <button 
              className="mt-6 px-8 py-3 bg-[#1e3a8a] hover:bg-blue-800 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors"
              onClick={() => handleDownloadSingle(previewImage, "Student")}
            >
              <DownloadSimple size={20} weight="bold" /> Download Image
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN BASE CONTAINER --- */}
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">

        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white dark:bg-slate-800 text-[#1e3a8a] border-2 border-slate-900 shadow-sm">
              <IdentificationCard size={32} weight="fill" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">
                Student Photos
              </h1>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-1">
                Official Student Image Registry
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={toggleSelectAll}
              className="px-6 py-4 bg-blue-900/50 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all border-2 border-blue-400 flex items-center justify-center gap-2"
            >
              {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                <><Square size={18} /> Deselect All</>
              ) : (
                <><CheckSquare size={18} weight="fill" /> Select All</>
              )}
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting || filteredStudents.length === 0}
              className="px-8 py-4 bg-white dark:bg-slate-800 text-[#1e3a8a] font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all border-2 border-slate-900 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExporting ? <CircleNotch size={18} className="animate-spin" /> : <DownloadSimple size={18} weight="fill" />}
              {isExporting ? 'Exporting...' : selectedStudentIds.size > 0 ? `Export Selected (${selectedStudentIds.size})` : 'Export All'}
            </button>
          </div>
        </div>

        {/* --- TOOLBAR --- */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Refresh Button */}
            <button 
              onClick={() => onRefresh?.()}
              className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-2 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm group"
              title="Refresh Data"
            >
              <div className="p-1.5 bg-blue-600 text-white border border-slate-900 group-hover:rotate-180 transition-transform duration-500">
                <ArrowClockwise size={14} weight="bold" />
              </div>
            </button>

            {/* Class Filter */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-2 flex items-center w-full md:w-48 shadow-sm">
              <div className="p-1.5 bg-[#1e3a8a] text-white mr-2 border border-slate-900">
                <Funnel size={14} weight="fill" />
              </div>
              <select 
                value={selectedClass} 
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStudentIds(new Set()); // Reset selection on class change
                }}
                className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest"
              >
                <option value="all">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Passport Size Selector */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-2 flex items-center w-full md:w-56 shadow-sm">
              <div className="p-1.5 bg-[#10b981] text-white mr-2 border border-slate-900">
                <Palette size={14} weight="fill" />
              </div>
              <select 
                value={passportSize} 
                onChange={(e) => setPassportSize(e.target.value as any)}
                className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest"
              >
                <option value="standard">Standard (35x45mm)</option>
                <option value="large">Large (2x2 inch)</option>
                <option value="small">Small (25x35mm)</option>
                <option value="wallet">Wallet (64x89mm)</option>
                <option value="stamp">Stamp (20x25mm)</option>
                <option value="custom">Custom Size (mm)</option>
              </select>
            </div>

            {passportSize === 'custom' && (
              <div className="flex gap-2 items-center bg-white dark:bg-slate-800 border-2 border-slate-300 p-2 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">W:</span>
                  <input 
                    type="number" 
                    value={customWidth} 
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs outline-none px-1"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">H:</span>
                  <input 
                    type="number" 
                    value={customHeight} 
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs outline-none px-1"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">mm</span>
              </div>
            )}

            {/* Search */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-2 flex items-center w-full md:w-64 shadow-sm">
              <div className="p-1.5 bg-[#be123c] text-white mr-2 border border-slate-900">
                <MagnifyingGlass size={14} weight="bold" />
              </div>
              <input 
                type="text" 
                placeholder="SEARCH STUDENT..." 
                className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none px-2 uppercase tracking-widest placeholder-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* AI Processing Toggle */}
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 p-2 flex items-center shadow-sm gap-2">
              <div className={`p-1.5 text-white border border-slate-900 transition-colors ${useAIProcessing ? 'bg-purple-600' : 'bg-slate-400'}`}>
                <MagicWand size={14} weight="fill" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useAIProcessing}
                  onChange={(e) => setUseAIProcessing(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
                <span className="text-slate-900 dark:text-white font-bold text-[10px] uppercase tracking-widest">
                  AI Processing
                </span>
              </label>
            </div>
          </div>
          
          <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Showing {filteredStudents.length} Students
          </div>
          
          {passportSize === 'custom' && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 font-medium">
              <span className="font-bold">NOTE:</span> Images will be printed at {customWidth}x{customHeight}mm. 
              Recommended size is up to 100x150mm for best quality. Larger sizes may cause the image to pixelate or "collapse" (phat jayegi/toot jayegi).
            </div>
          )}
        </div>

        {/* --- CONTENT GRID --- */}
        <div className="p-8">
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredStudents.map(student => {
                const isSelected = selectedStudentIds.has(student.id);
                const photoUrl = student.photoURL || student.customData?.photoURL;
                
                return (
                  <div 
                    key={student.id} 
                    className={`group relative bg-white border-2 p-2 transition-all cursor-pointer ${
                      isSelected ? 'border-[#10b981] shadow-md ring-2 ring-[#10b981]/50' : 'border-slate-200 hover:border-[#1e3a8a]'
                    }`}
                    onClick={() => toggleSelection(student.id)}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3 z-10 bg-white dark:bg-slate-800 rounded-sm shadow-sm">
                      {isSelected ? (
                        <CheckSquare size={24} weight="fill" className="text-[#10b981]" />
                      ) : (
                        <Square size={24} className="text-slate-300 group-hover:text-slate-400" />
                      )}
                    </div>

                    <div className={`bg-slate-100 border border-slate-200 overflow-hidden relative ${
                      passportSize === 'large' ? 'aspect-square' : 'aspect-[7/9]'
                    }`}>
                      {photoUrl ? (
                        <>
                          <img 
                            src={photoUrl} 
                            alt={student.name} 
                            className={`w-full h-full object-cover transition-transform duration-300 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
                            referrerPolicy="no-referrer"
                          />
                          {/* View Overlay */}
                          <div 
                            className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex flex-col items-center justify-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="flex gap-2">
                              <button 
                                className="opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(photoUrl);
                                }}
                                title="View Large"
                              >
                                <MagnifyingGlass size={18} weight="bold" />
                              </button>
                              <button 
                                className="opacity-0 group-hover:opacity-100 bg-[#1e3a8a] text-white p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all hover:bg-blue-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUpdatingStudent(student);
                                  setShowCamera(true);
                                }}
                                title="Take Photo"
                              >
                                <Camera size={18} weight="fill" />
                              </button>
                              <button 
                                className="opacity-0 group-hover:opacity-100 bg-[#10b981] text-white p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all hover:bg-emerald-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUpdatingStudent(student);
                                  photoInputRef.current?.click();
                                }}
                                title="Upload Photo"
                              >
                                <UploadSimple size={18} weight="bold" />
                              </button>
                            </div>
                            <span className="opacity-0 group-hover:opacity-100 text-[8px] font-black text-white uppercase tracking-widest bg-slate-900/60 px-2 py-0.5 rounded-full">
                              Update Photo
                            </span>
                          </div>
                        </>
                      ) : (
                        <div 
                          className="w-full h-full flex flex-col items-center justify-center text-slate-300 group-hover:bg-slate-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpdatingStudent(student);
                            setShowCamera(true);
                          }}
                        >
                          <UserCircle size={48} weight="fill" />
                          <span className="text-[8px] font-bold uppercase mt-1">No Photo</span>
                          <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-1 bg-[#1e3a8a] text-white rounded-full"><Camera size={12} /></div>
                            <div className="p-1 bg-[#10b981] text-white rounded-full"><UploadSimple size={12} /></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate leading-tight" title={student.name}>
                        {student.name}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                        Roll: {student.rollNo}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <ImageIcon size={64} weight="fill" />
              <p className="mt-4 font-black text-xs uppercase tracking-widest">No students found</p>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={photoInputRef}
          className="hidden" 
          accept="image/*"
          onChange={handleFileUpload}
        />

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl border-4 border-slate-900">
              <div className="bg-[#1e3a8a] text-white p-4 flex justify-between items-center border-b-2 border-slate-900">
                <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                  <Camera size={20} weight="fill" /> Capture Student Photo
                </h3>
                <button onClick={() => setShowCamera(false)} className="hover:text-red-200 transition-colors">
                  <X size={24} weight="bold" />
                </button>
              </div>
              <div className="p-4">
                <CameraCapture 
                  onCapture={handleCameraCapture}
                  onClose={() => setShowCamera(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Processing Modal */}
        {isProcessingPhoto && imageToProcess && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md overflow-hidden shadow-2xl border-4 border-slate-900 rounded-3xl">
              <SmartIdProcessor 
                originalImage={imageToProcess}
                uniformUrl=""
                backgroundColor="#0000FF"
                onComplete={handleProcessedPhoto}
                onError={(err) => {
                  alert(err);
                  setIsProcessingPhoto(false);
                  setImageToProcess(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Uploading Overlay */}
        {isUploading && (
          <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
            <CircleNotch size={48} className="animate-spin text-blue-500 mb-4" />
            <h2 className="text-xl font-black uppercase tracking-widest">Uploading Photo...</h2>
            <p className="text-sm text-slate-300 mt-2">Please wait while the image is saved.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentImagesGallery;
