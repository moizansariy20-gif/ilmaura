import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash, PencilSimple, BookOpen, X, CircleNotch, Warning, 
  FloppyDisk, Stack, ChalkboardTeacher, Student, Funnel, MagnifyingGlass,
  UsersThree, CheckCircle
} from 'phosphor-react';
import { addClass, updateClass, addSubject } from '../../services/api.ts';
import { Class, Subject, Teacher, TeacherReference } from '../../types.ts';

interface AddClassProps {
  schoolId: string;
  classes: Class[];
  teachers: Teacher[];
  subjects: Subject[];
  students: any[];
}

const INITIAL_FORM_STATE = { 
  id: '', 
  name: '', 
  section: '', 
  classTeacher: null as TeacherReference | null,
  classMonitor: '',
  roomNumber: '',
  floor: '',
  startTime: '',
  endTime: ''
};

const SearchableTeacherSelect = ({ 
  teachers, 
  value, 
  onChange, 
  placeholder = "-- Select Teacher --" 
}: { 
  teachers: Teacher[], 
  value: string, 
  onChange: (id: string) => void,
  placeholder?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  
  const selectedTeacher = teachers.find(t => t.id === value);
  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.designation || '').toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = (event: Event) => {
      // Don't close if scrolling inside the dropdown itself
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      
      // Calculate position immediately when opened
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const shouldOpenUpwards = spaceBelow < 250 && spaceAbove > spaceBelow;
        setOpenUpwards(shouldOpenUpwards);
        
        setDropdownStyle({
          position: 'fixed',
          top: shouldOpenUpwards ? 'auto' : `${rect.bottom + 4}px`,
          bottom: shouldOpenUpwards ? `${window.innerHeight - rect.top + 4}px` : 'auto',
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: 9999,
        });
      }

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      }, 50);
    } else {
      setSearch('');
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Remove the separate useEffect for dropdownStyle calculation
  // as it's now handled inside the isOpen useEffect for better synchronization.

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={`w-full bg-white dark:bg-slate-800 border-2 p-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none rounded-none cursor-pointer flex justify-between items-center transition-colors ${isOpen ? 'border-[#1e3a8a] ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedTeacher && selectedTeacher.photoURL ? (
            <img src={selectedTeacher.photoURL} alt={selectedTeacher.name} className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
          ) : selectedTeacher ? (
            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400">
              {selectedTeacher.name.charAt(0)}
            </div>
          ) : null}
          <span className="truncate pr-2">
            {selectedTeacher ? (
              <>
                <span className="text-[#1e3a8a]">{selectedTeacher.name}</span>
                {selectedTeacher.designation && <span className="text-slate-400 font-normal ml-1">({selectedTeacher.designation})</span>}
              </>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {value && (
            <button 
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors"
            >
              <X size={14} weight="bold" />
            </button>
          )}
          <span className={`text-[10px] text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>
      
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className={`fixed bg-white dark:bg-slate-800 border-2 border-[#1e3a8a] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-100 ${openUpwards ? 'rounded-t-md' : 'rounded-b-md'}`}
          style={{ ...dropdownStyle, maxHeight: '300px' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-3 border-b-2 border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 shrink-0">
            <MagnifyingGlass size={18} className="text-[#1e3a8a]" weight="bold" />
            <input 
              ref={inputRef}
              type="text" 
              className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              placeholder="Search by name or designation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50">
                <X size={16} weight="bold" />
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div 
              className={`p-4 text-sm font-bold cursor-pointer hover:bg-slate-100 transition-colors flex items-center gap-3 ${!value ? 'bg-blue-50 text-[#1e3a8a]' : 'text-slate-500 dark:text-slate-400'}`}
              onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                <X size={14} weight="bold" />
              </div>
              {placeholder}
            </div>
            {filteredTeachers.length === 0 ? (
              <div className="p-8 text-sm font-bold text-slate-400 text-center flex flex-col items-center gap-2">
                <Warning size={32} className="text-slate-300" />
                No teachers found matching "{search}"
              </div>
            ) : (
              filteredTeachers.map(t => (
                <div 
                  key={t.id}
                  className={`p-4 text-sm font-bold cursor-pointer hover:bg-slate-50 border-t border-slate-50 transition-colors flex items-center gap-4 ${value === t.id ? 'bg-blue-50 text-[#1e3a8a]' : 'text-slate-700 dark:text-slate-200'}`}
                  onClick={(e) => { e.stopPropagation(); onChange(t.id); setIsOpen(false); setSearch(''); }}
                >
                  {t.photoURL ? (
                    <img src={t.photoURL} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-slate-500 dark:text-slate-400">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span>{t.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">{t.designation || 'Staff'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const AddClass: React.FC<AddClassProps> = ({ schoolId, classes, teachers, subjects, students }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editClassId = location.state?.editClassId;
  const isEditing = !!editClassId;

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [modalSubjectAssignments, setModalSubjectAssignments] = useState<{ [subjectId: string]: TeacherReference | null }>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Quick Subject State
  const [showQuickSubject, setShowQuickSubject] = useState(false);
  const [quickSubjectName, setQuickSubjectName] = useState('');
  const [quickSubjectCoverImage, setQuickSubjectCoverImage] = useState<string | null>(null);
  const [isAddingQuick, setIsAddingQuick] = useState(false);

  useEffect(() => {
    if (isEditing && editClassId) {
      const cls = classes.find(c => c.id === editClassId);
      if (cls) {
        setForm({
          id: cls.id,
          name: cls.name,
          section: cls.section || '',
          classTeacher: cls.classTeacher || null,
          classMonitor: cls.classMonitor || '',
          roomNumber: cls.roomNumber || '',
          floor: cls.floor || '',
          startTime: cls.startTime || '',
          endTime: cls.endTime || ''
        });
        const assignments: { [subjectId: string]: TeacherReference | null } = cls.subjectAssignments || {};
        setSelectedSubjectIds(Object.keys(assignments));
        setModalSubjectAssignments(assignments);
      }
    }
  }, [isEditing, editClassId, classes]);

  const convertToWebP = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error("Could not get canvas context"));
          ctx.drawImage(img, 0, 0);
          const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
          resolve(webpDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleQuickSubjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webpUrl = await convertToWebP(file);
      setQuickSubjectCoverImage(webpUrl);
    } catch (error) {
      console.error("Error converting image:", error);
      alert("Failed to process image.");
    }
  };

  const handleAddQuickSubject = async () => {
    if (!quickSubjectName.trim()) return;
    setIsAddingQuick(true);
    try {
      const newSub = await addSubject(schoolId, {
        name: quickSubjectName.trim(),
        coverImageURL: quickSubjectCoverImage || undefined
      });
      setSelectedSubjectIds(prev => [...prev, newSub.id]);
      setQuickSubjectName('');
      setQuickSubjectCoverImage(null);
      setShowQuickSubject(false);
    } catch (error) {
      console.error("Error adding quick subject:", error);
      alert("Failed to add subject.");
    } finally {
      setIsAddingQuick(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds(prev => {
        if (prev.includes(subjectId)) {
            const newAssignments = { ...modalSubjectAssignments };
            delete newAssignments[subjectId];
            setModalSubjectAssignments(newAssignments);
            return prev.filter(id => id !== subjectId);
        } else {
            return [...prev, subjectId];
        }
    });
  };

  const handleSubjectTeacherChange = (subjectId: string, teacherId: string) => {
      const selectedTeacher = teachers.find(t => t.id === teacherId);
      setModalSubjectAssignments(prev => ({
          ...prev,
          [subjectId]: selectedTeacher ? { id: selectedTeacher.id, name: selectedTeacher.name, photoURL: selectedTeacher.photoURL } : null
      }));
  };

  const handleSave = async () => {
      if (!form.name.trim()) {
          setSaveError('Class name is required.');
          return;
      }
      setIsSaving(true);
      setSaveError('');

      try {
          const involvedSet = new Set<string>();
          
          const finalAssignments: { [subjectId: string]: TeacherReference | null } = {};
          selectedSubjectIds.forEach(sid => {
              const assignment = modalSubjectAssignments[sid];
              if (assignment?.id) {
                  const t = teachers.find(teach => teach.id === assignment.id);
                  finalAssignments[sid] = { id: assignment.id, name: assignment.name, photoURL: t?.photoURL };
                  involvedSet.add(assignment.id);
              } else {
                  finalAssignments[sid] = null;
              }
          });

          let finalClassTeacher = null;
          if (form.classTeacher?.id) {
              const t = teachers.find(teach => teach.id === form.classTeacher!.id);
              finalClassTeacher = { id: form.classTeacher.id, name: form.classTeacher.name, photoURL: t?.photoURL };
              involvedSet.add(form.classTeacher.id);
          }

          const finalData = {
              name: form.name.trim(),
              section: form.section.trim(),
              classTeacher: finalClassTeacher,
              subjectAssignments: finalAssignments,
              involvedTeachers: Array.from(involvedSet),
              classMonitor: form.classMonitor.trim(),
              roomNumber: form.roomNumber.trim(),
              floor: form.floor.trim(),
              startTime: form.startTime.trim(),
              endTime: form.endTime.trim()
          };

          if (isEditing) {
              await updateClass(schoolId, form.id, finalData);
          } else {
              await addClass(schoolId, finalData);
          }
          
          navigate('/classes');
      } catch (error: any) {
          console.error("Error saving class:", error);
          setSaveError(error.message || 'Failed to save class.');
      } finally {
          setIsSaving(false);
      }
  };

  const inputStyle = "w-full bg-white border-2 border-slate-200 p-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1e3a8a] rounded-none transition-colors";
  const labelStyle = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block";

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 shrink-0">
        {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors ${currentStep >= step ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    {currentStep > step ? <CheckCircle size={16} weight="bold" /> : step}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${currentStep >= step ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                    {step === 1 ? 'Details' : step === 2 ? 'Subjects' : step === 3 ? 'Class Teacher' : 'Subject Teachers'}
                </span>
                {step < 4 && <div className={`w-12 h-0.5 transition-colors ${currentStep > step ? 'bg-[#1e3a8a]' : 'bg-slate-200'}`}></div>}
            </div>
        ))}
    </div>
  );

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen">
        
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900 mb-8">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/classes')}
                    className="w-10 h-10 bg-white dark:bg-slate-800 border-2 border-white flex items-center justify-center text-[#1e3a8a] hover:bg-slate-200 transition-all"
                >
                    <ArrowLeft size={20} weight="bold" />
                </button>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">
                        {isEditing ? 'Edit Class' : 'Create New Class'}
                    </h1>
                    <p className="text-xs font-black opacity-80 uppercase tracking-widest mt-1">
                        Configure class details, subjects, and teachers
                    </p>
                </div>
            </div>
        </div>

        {/* Main Form Container */}
        <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[60vh]">
            {renderStepIndicator()}

            <div className="p-8 md:p-12 flex-1">
                {saveError && (
                    <div className="mb-8 p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
                        <Warning size={20} weight="bold" />
                        {saveError}
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-8">
                            <Stack size={24} className="text-[#1e3a8a]" weight="bold"/>
                            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Step 1: Class Details</h4>
                        </div>
                        
                        {/* Basic Info Group */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700 mb-8">
                            <h5 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Basic Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className={labelStyle}>Class Name</label>
                                    <input type="text" placeholder="e.g. Grade 9" className={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoFocus />
                                </div>
                                <div>
                                    <label className={labelStyle}>Section (Optional)</label>
                                    <input type="text" placeholder="e.g. A, B, C" className={inputStyle} value={form.section} onChange={e => setForm({...form, section: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Operational Info Group */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700">
                            <h5 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">Operational Details (Optional)</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className={labelStyle}>Class Monitor</label>
                                    {isEditing ? (
                                        <select 
                                            className={inputStyle} 
                                            value={form.classMonitor} 
                                            onChange={e => setForm({...form, classMonitor: e.target.value})}
                                        >
                                            <option value="">-- No Monitor Assigned --</option>
                                            {students.filter(s => s.classId === editClassId).map(student => (
                                                <option key={student.id} value={student.id}>
                                                    {student.name} {student.rollNo ? `(${student.rollNo})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="w-full bg-slate-100 border-2 border-slate-200 dark:border-slate-700 p-4 text-sm font-bold text-slate-400 cursor-not-allowed">
                                            Save class first to add students
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className={labelStyle}>Room Number</label>
                                    <input type="text" placeholder="e.g. Room 101" className={inputStyle} value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Floor</label>
                                    <input type="text" placeholder="e.g. Ground Floor" className={inputStyle} value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyle}>Start Time</label>
                                        <input type="time" className={inputStyle} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>End Time</label>
                                        <input type="time" className={inputStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <BookOpen size={24} className="text-[#1e3a8a]" weight="bold"/>
                                <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Step 2: Select Subjects</h4>
                            </div>
                            <button 
                                onClick={() => setShowQuickSubject(!showQuickSubject)}
                                className="text-xs font-bold text-[#1e3a8a] hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest bg-blue-50 px-4 py-2 border border-blue-100"
                            >
                                <Plus size={14} weight="bold" /> Add New Subject
                            </button>
                        </div>

                        {showQuickSubject && (
                            <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                                <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Quick Add Subject</h5>
                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                    <div className="flex-1 w-full">
                                        <input 
                                            type="text" 
                                            placeholder="Subject Name" 
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#1e3a8a]"
                                            value={quickSubjectName}
                                            onChange={e => setQuickSubjectName(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 w-full flex items-center gap-4">
                                        <label className="cursor-pointer bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex-1 text-center">
                                            {quickSubjectCoverImage ? 'Change Image' : 'Upload Cover (Opt)'}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleQuickSubjectImageUpload} />
                                        </label>
                                        {quickSubjectCoverImage && (
                                            <img src={quickSubjectCoverImage} alt="Preview" className="w-12 h-12 object-cover border-2 border-slate-200 dark:border-slate-700" />
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleAddQuickSubject}
                                        disabled={!quickSubjectName.trim() || isAddingQuick}
                                        className="bg-[#1e3a8a] text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-blue-900 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {isAddingQuick ? 'Adding...' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {subjects.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {subjects.map(sub => {
                                    const isSelected = selectedSubjectIds.includes(sub.id);
                                    return (
                                        <div 
                                            key={sub.id} 
                                            onClick={() => handleSubjectToggle(sub.id)}
                                            className={`cursor-pointer border-2 p-4 flex flex-col items-center justify-center text-center gap-3 transition-all ${isSelected ? 'border-[#1e3a8a] bg-blue-50' : 'border-slate-200 bg-white dark:bg-slate-800 hover:border-slate-300'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 overflow-hidden ${isSelected ? 'border-[#1e3a8a] bg-white dark:bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                                                {sub.coverImageURL ? (
                                                    <img src={sub.coverImageURL} alt={sub.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <BookOpen size={20} className={isSelected ? 'text-[#1e3a8a]' : 'text-slate-400'} weight="bold"/>
                                                )}
                                            </div>
                                            <span className={`text-xs font-bold ${isSelected ? 'text-[#1e3a8a]' : 'text-slate-600 dark:text-slate-300'}`}>{sub.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No global subjects found.</p>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="animate-in slide-in-from-right-4 duration-300 max-w-2xl">
                        <div className="flex items-center gap-3 mb-8">
                            <ChalkboardTeacher size={24} className="text-[#1e3a8a]" weight="bold"/>
                            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Step 3: Assign Class Teacher</h4>
                        </div>
                        <div>
                            <label className={labelStyle}>Head Faculty / Class In-charge</label>
                            <SearchableTeacherSelect 
                                teachers={teachers}
                                value={form.classTeacher?.id || ''}
                                onChange={(teacherId) => {
                                    const t = teachers.find(teach => teach.id === teacherId);
                                    setForm({...form, classTeacher: t ? { id: t.id, name: t.name, photoURL: t.photoURL } : null});
                                }}
                                placeholder="-- Select Teacher --"
                            />
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3 mb-8">
                            <UsersThree size={24} className="text-[#1e3a8a]" weight="bold"/>
                            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Step 4: Assign Subject Teachers</h4>
                        </div>
                        
                        {selectedSubjectIds.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {selectedSubjectIds.map(sid => {
                                    const subject = subjects.find(s => s.id === sid);
                                    const assignedTeacherId = modalSubjectAssignments[sid]?.id || '';
                                    return (
                                        <div key={sid} className="p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                                    {subject?.coverImageURL ? (
                                                        <img src={subject.coverImageURL} alt={subject.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <BookOpen size={16} className="text-slate-400" weight="bold"/>
                                                    )}
                                                </div>
                                                <label className="text-sm font-black text-[#1e3a8a] uppercase tracking-widest">{subject?.name}</label>
                                            </div>
                                            <SearchableTeacherSelect 
                                                teachers={teachers}
                                                value={assignedTeacherId}
                                                onChange={(teacherId) => handleSubjectTeacherChange(sid, teacherId)}
                                                placeholder="-- No Teacher --"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No subjects selected in Step 2.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                <button 
                    onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('/classes')}
                    className="px-6 py-3 text-xs font-black text-slate-500 hover:text-slate-800 dark:text-slate-100 uppercase tracking-widest transition-colors"
                >
                    {currentStep === 1 ? 'Cancel' : 'Back'}
                </button>
                
                {currentStep < 4 ? (
                    <button 
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={currentStep === 1 && !form.name.trim()}
                        className="bg-slate-800 text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-colors disabled:opacity-50"
                    >
                        Next Step
                    </button>
                ) : (
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#1e3a8a] text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? <CircleNotch size={16} className="animate-spin" weight="bold" /> : <FloppyDisk size={16} weight="bold" />}
                        {isEditing ? 'Update Class' : 'Save Class'}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default AddClass;
