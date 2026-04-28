import React, { useState, useEffect, useMemo } from 'react';
import { 
  Books, Plus, Trash, PencilSimple, MagnifyingGlass, GraduationCap, 
  CheckCircle, Clock, WarningCircle, Funnel, TrashSimple, FileCsv, 
  CaretRight, ArrowsClockwise, SquaresFour, ListBullets,
  ChalkboardTeacher, IdentificationCard, UserList, ChartBar
} from 'phosphor-react';
import { Course, Subject, Class, Teacher } from '../../types.ts';
import { subscribeToCourses, addCourse, updateCourse, deleteCourse, updateClass } from '../../services/api.ts';
import { motion, AnimatePresence } from 'motion/react';

interface CourseManagementProps {
  schoolId: string;
  subjects: Subject[];
  classes: Class[];
  teachers: Teacher[];
}

const CourseManagement: React.FC<CourseManagementProps> = ({ schoolId, subjects, classes, teachers }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<'programs' | 'mapping'>('programs');
  const [mappingView, setMappingView] = useState<'class' | 'teacher'>('class');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Draft' | 'Archived'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeSubj, setActiveSubj] = useState<Subject | null>(null);
  const [activeClassId, setActiveClassId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    department: '',
    level: '',
    duration: '',
    subjectIds: [] as string[],
    status: 'Active' as 'Active' | 'Draft' | 'Archived'
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToCourses(schoolId, (data) => {
      setCourses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: courses.length,
    active: courses.filter(c => c.status === 'Active').length,
    draft: courses.filter(c => c.status === 'Draft').length,
    totalClasses: classes.length,
    totalTeachers: teachers.length
  }), [courses, classes, teachers]);

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        code: course.code,
        description: course.description || '',
        department: course.department || '',
        level: course.level || '',
        duration: course.duration || '',
        subjectIds: course.subjectIds || [],
        status: course.status
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        code: '',
        description: '',
        department: '',
        level: '',
        duration: '',
        subjectIds: [],
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
      } else {
        await addCourse({ ...formData, schoolId });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving course:", err);
      alert("Failed to save course. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await deleteCourse(id);
      } catch (err) {
        console.error("Error deleting course:", err);
      }
    }
  };

  // --- MAPPING DATA CALCULATION ---
  const teacherStatMap = useMemo(() => {
    const map = new Map<string, { subjects: Set<string>, classes: Set<string> }>();
    classes.forEach(cls => {
      if (cls.subjectAssignments) {
        Object.entries(cls.subjectAssignments).forEach(([subjId, teacherInst]) => {
          if (teacherInst?.id) {
            if (!map.has(teacherInst.id)) map.set(teacherInst.id, { subjects: new Set(), classes: new Set() });
            map.get(teacherInst.id)!.subjects.add(subjId);
            map.get(teacherInst.id)!.classes.add(cls.id);
          }
        });
      }
    });
    return map;
  }, [classes]);

  const handleAssignTeacher = async (teacher: Teacher) => {
    if (!activeSubj || !activeClassId) return;
    
    setIsUpdating(true);
    try {
      const targetClass = classes.find(c => c.id === activeClassId);
      if (!targetClass) return;

      const newAssignments = { ...(targetClass.subjectAssignments || {}) };
      newAssignments[activeSubj.id] = {
        id: teacher.id,
        name: teacher.name,
        photoURL: teacher.photoURL
      };

      await updateClass(schoolId, activeClassId, {
        subjectAssignments: newAssignments
      });
      
      setIsAssignModalOpen(false);
      setActiveSubj(null);
    } catch (err) {
      console.error(err);
      alert("Failed to assign teacher. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveAssignment = async (classId: string, subjectId: string) => {
    try {
      const targetClass = classes.find(c => c.id === classId);
      if (!targetClass) return;

      const newAssignments = { ...(targetClass.subjectAssignments || {}) };
      delete newAssignments[subjectId];

      await updateClass(schoolId, classId, {
        subjectAssignments: newAssignments
      });
    } catch (err) {
      console.error(err);
      alert("Failed to remove assignment.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
            <GraduationCap size={36} weight="fill" className="text-[#1e3a8a]" />
            Academic Management
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage institutional programs, teacher workloads, and subject mapping.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('programs')}
            className={`px-6 py-3 font-black uppercase text-xs tracking-widest transition-all border-2 ${activeTab === 'programs' ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white dark:bg-[#1e293b] text-slate-400 border-slate-200 dark:border-[#1e293b] hover:text-slate-600'}`}
          >
            Programs
          </button>
          <button 
            onClick={() => setActiveTab('mapping')}
            className={`px-6 py-3 font-black uppercase text-xs tracking-widest transition-all border-2 ${activeTab === 'mapping' ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white dark:bg-[#1e293b] text-slate-400 border-slate-200 dark:border-[#1e293b] hover:text-slate-600'}`}
          >
            Academic Mapping
          </button>
        </div>
      </div>

      {activeTab === 'programs' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-slate-200 dark:border-[#1e293b] flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-[#1e3a8a] dark:text-blue-400 flex items-center justify-center border-2 border-blue-100 dark:border-blue-900/50">
                <Books size={24} weight="fill" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Courses</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-emerald-200 dark:border-emerald-900 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-2 border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle size={24} weight="fill" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Programs</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.active}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-amber-200 dark:border-amber-900 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border-2 border-amber-100 dark:border-amber-900/50">
                <Clock size={24} weight="fill" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Draft / Review</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.draft}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-[#1e293b] overflow-hidden">
            <div className="p-4 border-b-2 border-slate-100 dark:border-[#1e293b] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search courses..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#020617] text-sm focus:border-[#1e3a8a] dark:focus:border-blue-500 outline-none w-full sm:w-64 font-medium"
                  />
                </div>
                <div className="flex bg-white dark:bg-[#020617] border-2 border-slate-200 dark:border-[#1e293b] p-1">
                  {(['All', 'Active', 'Draft'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-[#1e3a8a] text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-800 transition-all shadow-lg active:scale-95"
              >
                <Plus size={16} weight="bold" />
                Add New Course
              </button>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin h-10 w-10 border-4 border-[#1e3a8a] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Repository...</p>
                </div>
              ) : filteredCourses.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#020617]/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-100 dark:border-[#1e293b]">
                      <th className="px-6 py-4">Course Details</th>
                      <th className="px-6 py-4">Department / Level</th>
                      <th className="px-6 py-4 text-center">Subjects</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-slate-100 dark:border-[#1e293b]">
                    {filteredCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                              <Books size={24} className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-[#1e3a8a] dark:text-blue-400 uppercase tracking-widest mb-0.5">{course.code}</p>
                              <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{course.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{course.department || 'N/A'}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{course.level || 'Standard'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-none">
                             {course.subjectIds?.length || 0} Modules
                           </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${
                            course.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            course.status === 'Draft' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${course.status === 'Active' ? 'bg-emerald-600' : course.status === 'Draft' ? 'bg-amber-600' : 'bg-slate-600'}`}></div>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(course)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 rounded-none"><PencilSimple size={18} weight="bold" /></button>
                            <button onClick={() => handleDelete(course.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 rounded-none"><Trash size={18} weight="bold" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-20 text-center">
                  <WarningCircle size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">No matching courses found in registry</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Mapping Header & View Switcher */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-4 border-2 border-slate-200 dark:border-[#1e293b]">
            <div className="flex items-center gap-4">
               <div className="flex p-1 bg-slate-100 dark:bg-[#020617] border border-slate-200 dark:border-[#1e293b]">
                  <button 
                    onClick={() => setMappingView('class')}
                    className={`px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mappingView === 'class' ? 'bg-white dark:bg-[#1e293b] text-[#1e3a8a] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <SquaresFour size={16} weight="bold" /> Class-wise Mapping
                  </button>
                  <button 
                    onClick={() => setMappingView('teacher')}
                    className={`px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mappingView === 'teacher' ? 'bg-white dark:bg-[#1e293b] text-[#1e3a8a] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <UserList size={16} weight="bold" /> Teacher Workload
                  </button>
               </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Classes</p>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stats.totalClasses}</p>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Faculty</p>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stats.totalTeachers}</p>
              </div>
            </div>
          </div>

          {mappingView === 'class' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {classes.map(cls => {
                const classSubjects = subjects.filter(s => 
                  s.classId === cls.id || 
                  (cls.subjectAssignments && Object.keys(cls.subjectAssignments).includes(s.id))
                );
                const assignedCount = Object.keys(cls.subjectAssignments || {}).length;
                
                return (
                  <div key={cls.id} className="bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-[#1e293b] flex flex-col group overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-[#020617]/50 border-b-2 border-slate-100 dark:border-[#1e293b] flex items-center justify-between">
                       <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1e3a8a] text-white flex items-center justify-center font-black text-lg shadow-inner">
                          {cls.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{cls.name} {cls.section ? `- ${cls.section}` : ''}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{cls.classTeacher?.name || 'No Class Teacher'}</p>
                        </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                          <p className="text-xs font-black text-[#1e3a8a] dark:text-blue-400">{assignedCount}/{classSubjects.length || 0}</p>
                       </div>
                    </div>
                    
                    <div className="p-4 flex-1 space-y-3">
                      {classSubjects.length > 0 ? classSubjects.map(sub => {
                        const assignedTeacher = cls.subjectAssignments?.[sub.id];
                        return (
                          <div key={sub.id} className="flex items-center justify-between gap-4 p-2.5 bg-slate-50/50 dark:bg-[#020617]/20 border border-slate-100 dark:border-[#1e293b] group/item hover:bg-white dark:hover:bg-slate-900 transition-all duration-200">
                             <div className="flex items-center gap-2 min-w-0">
                               <Books size={16} className="text-slate-400 shrink-0" />
                               <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{sub.name}</p>
                             </div>
                             <div className="flex items-center gap-2 shrink-0">
                               {assignedTeacher ? (
                                 <div className="flex items-center gap-2">
                                   <div className="w-6 h-6 rounded-none border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1e293b] flex items-center justify-center text-[10px] font-black text-[#1e3a8a] overflow-hidden">
                                     {assignedTeacher.name[0]}
                                   </div>
                                   <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate max-w-[60px]">{assignedTeacher.name}</p>
                                   <button 
                                      onClick={() => { setActiveSubj(sub); setActiveClassId(cls.id); setIsAssignModalOpen(true); }}
                                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover/item:opacity-100"
                                      title="Change Teacher"
                                   >
                                      <ArrowsClockwise size={12} />
                                   </button>
                                   <button 
                                      onClick={() => handleRemoveAssignment(cls.id, sub.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover/item:opacity-100"
                                      title="Remove"
                                   >
                                      <TrashSimple size={12} />
                                   </button>
                                 </div>
                               ) : (
                                 <button 
                                   onClick={() => { setActiveSubj(sub); setActiveClassId(cls.id); setIsAssignModalOpen(true); }}
                                   className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                 >
                                   <Plus size={10} weight="bold" />
                                   Assign Teacher
                                 </button>
                               )}
                             </div>
                          </div>
                        );
                      }) : (
                        <div className="py-8 text-center border-2 border-dashed border-slate-100 dark:border-[#334155]">
                          <WarningCircle size={24} className="mx-auto text-slate-200 mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase italic">No subjects configured</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teachers.map(teacher => {
                const stats = teacherStatMap.get(teacher.id) || { subjects: new Set(), classes: new Set() };
                const workload = stats.subjects.size;
                
                return (
                  <div key={teacher.id} className="bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-[#1e293b] flex flex-col md:flex-row group hover:shadow-xl transition-all duration-300">
                    <div className="w-full md:w-48 bg-slate-50 dark:bg-[#020617]/50 border-b-2 md:border-b-0 md:border-r-2 border-slate-100 dark:border-[#1e293b] p-6 flex flex-col items-center text-center justify-center">
                       <div className="w-20 h-20 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center text-3xl font-black text-[#1e3a8a] dark:text-blue-400 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                         {teacher.name[0]}
                       </div>
                       <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{teacher.name}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{teacher.designation || 'Faculty'}</p>
                       
                       <div className="mt-6 w-full flex items-center justify-around">
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Classes</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{stats.classes.size}</p>
                          </div>
                          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                          <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Labs/Subjects</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{workload}</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex-1 p-6 space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-[#334155] pb-2 flex items-center gap-2">
                         <ChartBar size={14} weight="bold" /> Assignment Logs
                       </h4>
                       <div className="space-y-2">
                         {Array.from(stats.classes).map(classId => {
                           const cls = classes.find(c => c.id === classId);
                           const assignedSubjects = Object.entries(cls?.subjectAssignments || {})
                             .filter(([_, t]) => t?.id === teacher.id)
                             .map(([subjId]) => subjects.find(s => s.id === subjId)?.name)
                             .filter(Boolean);
                           
                           return (
                             <div key={classId} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-[#020617]/30 border border-slate-100 dark:border-[#1e293b]">
                               <div className="w-2 h-2 rounded-full bg-[#1e3a8a] mt-1.5 shrink-0"></div>
                               <div>
                                 <p className="text-[11px] font-black text-slate-800 dark:text-zinc-200 uppercase tracking-tight">
                                   Teaching in {cls?.name} {cls?.section ? `(${cls.section})` : ''}
                                 </p>
                                 <div className="flex flex-wrap gap-1 mt-1.5">
                                   {assignedSubjects.map((sName, i) => (
                                     <span key={i} className="px-2 py-0.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-zinc-700 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                       {sName}
                                     </span>
                                   ))}
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                         {workload === 0 && (
                           <div className="py-12 text-center">
                              <UserList size={32} className="mx-auto text-slate-100 mb-2" />
                              <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">No Active Workload Assigned</p>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Course Creation/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#1e293b] border-4 border-slate-900 dark:border-zinc-700 p-0 shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 p-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                  <Plus size={20} weight="bold" />
                  {editingCourse ? 'Update Course Registry' : 'New Course Registration'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <Plus size={24} weight="bold" className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Title *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#020617] text-sm font-bold focus:border-[#1e3a8a] outline-none"
                        placeholder="e.g. Advanced Mathematics"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Code *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#020617] text-sm font-bold focus:border-[#1e3a8a] outline-none uppercase"
                        placeholder="e.g. AMATH-101"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                      <select 
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#020617] text-sm font-bold focus:border-[#1e3a8a] outline-none"
                      >
                        <option value="">Select Department</option>
                        <option value="Sciences">Sciences</option>
                        <option value="Humanities">Humanities</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Arts">Arts</option>
                        <option value="Sports">Sports</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Duration</label>
                      <input 
                        type="text" 
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#020617] text-sm font-bold focus:border-[#1e3a8a] outline-none"
                        placeholder="e.g. 1 Year / Semester"
                      />
                    </div>
                  </div>

                  {/* Advanced settings */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Modules</label>
                      <div className="border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#020617] h-32 overflow-y-auto p-2 space-y-2">
                        {subjects.length > 0 ? subjects.map(s => (
                          <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                            <input 
                              type="checkbox" 
                              checked={formData.subjectIds.includes(s.id)}
                              onChange={(e) => {
                                const newIds = e.target.checked 
                                  ? [...formData.subjectIds, s.id]
                                  : formData.subjectIds.filter(id => id !== s.id);
                                setFormData({...formData, subjectIds: newIds});
                              }}
                              className="w-4 h-4 border-2 border-slate-300 rounded-none checked:bg-[#1e3a8a]"
                            />
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">{s.name}</span>
                          </label>
                        )) : (
                          <p className="text-[10px] text-slate-400 italic p-4 text-center">No subjects found in school repository.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Level</label>
                      <input 
                        type="text" 
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#020617] text-sm font-bold focus:border-[#1e3a8a] outline-none"
                        placeholder="e.g. Secondary / Grade 10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="w-full px-4 py-2 border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#020617] text-sm font-bold focus:border-[#1e3a8a] outline-none"
                      >
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#020617] text-sm font-bold focus:border-[#1e3a8a] outline-none h-20 resize-none"
                      placeholder="Enter program details, goals or prerequisites..."
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 border-t-2 border-slate-100 dark:border-[#1e293b] pt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-10 py-3 bg-[#1e3a8a] text-white font-black uppercase text-[10px] tracking-widest hover:bg-blue-800 transition-all shadow-lg active:scale-95"
                  >
                    {editingCourse ? 'Commit Changes' : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Teacher Assignment Modal */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#020617] border-4 border-slate-900 dark:border-zinc-800 p-0 shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-950 p-6 flex flex-col gap-1 border-b-2 border-slate-900">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                     <ChalkboardTeacher size={24} weight="fill" className="text-blue-500" />
                     Assign Faculty to Unit
                   </h3>
                   <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                      <Plus size={24} weight="bold" className="rotate-45" />
                   </button>
                </div>
                <div className="flex items-center gap-2">
                   <span className="px-2 py-0.5 bg-blue-600 text-[9px] font-black text-white uppercase tracking-widest">{activeSubj?.name}</span>
                   <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Faculty Selection</span>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-black/20">
                 {teachers.length > 0 ? (
                   <div className="grid grid-cols-1 gap-2">
                      {teachers.map(teacher => (
                        <button
                          key={teacher.id}
                          disabled={isUpdating}
                          onClick={() => handleAssignTeacher(teacher)}
                          className="flex items-center gap-4 p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-100 dark:border-[#1e293b] hover:border-blue-600 group transition-all text-left relative overflow-hidden active:scale-[0.98]"
                        >
                           <div className="w-12 h-12 bg-slate-50 dark:bg-[#020617] border-2 border-slate-200 dark:border-[#1e293b] flex items-center justify-center text-xl font-black text-[#1e3a8a] dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                              {teacher.name[0]}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tight leading-none mb-1">{teacher.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{teacher.designation || 'Staff'}</p>
                           </div>
                           <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="text-blue-600" size={20} weight="bold" />
                           </div>
                        </button>
                      ))}
                   </div>
                 ) : (
                   <div className="p-12 text-center">
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No teachers available in registry.</p>
                   </div>
                 )}
              </div>

              <div className="p-4 border-t-2 border-slate-100 dark:border-[#334155] bg-white dark:bg-[#020617] flex justify-end">
                  <button 
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-all"
                  >
                    Cancel Selection
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseManagement;
