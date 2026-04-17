
import React, { useState, useRef } from 'react';
import { 
  MagnifyingGlass, UploadSimple, Trash, FileText, 
  CircleNotch, Eye, FolderOpen, DownloadSimple, User, Files
} from 'phosphor-react';
import { Student, StudentDocument } from '../../types.ts';
import { addStudentDocument, removeStudentDocument, uploadFileToStorage } from '../../services/api.ts';
import ImageWithTempUrl from '../../components/ImageWithTempUrl.tsx';

interface StudentDocumentsProps {
  schoolId: string;
  students: Student[];
  classes: any[];
}

const DOCUMENT_TYPES = [
  "B-Form",
  "Father's CNIC",
  "Birth Certificate",
  "Previous School Certificate",
  "Medical Record",
  "Passport Copy",
  "Other"
];

const StudentDocuments: React.FC<StudentDocumentsProps> = ({ schoolId, students, classes }) => {
  // --- STATE ---
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [customDocName, setCustomDocName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FILTERING ---
  const filteredStudents = students.filter(s => {
    const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.includes(searchTerm);
    return matchClass && matchSearch;
  });

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setDocType(DOCUMENT_TYPES[0]);
    setCustomDocName('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;

    setUploading(true);
    try {
        const finalDocName = docType === 'Other' && customDocName ? customDocName : docType;
        
        // 1. Upload to Storage
        const path = `schools/${schoolId}/students/${selectedStudent.id}/documents/${Date.now()}_${file.name}`;
        const { publicUrl } = await uploadFileToStorage(file, path);

        // 2. Prepare Document Object
        const newDoc: StudentDocument = {
            id: `doc_${Date.now()}`,
            name: finalDocName,
            url: publicUrl,
            type: file.type,
            uploadedAt: new Date().toISOString()
        };

        // 3. Update DB
        const updatedDocs = await addStudentDocument(schoolId, selectedStudent.id, newDoc);
        
        // 4. Update Local State
        setSelectedStudent(prev => prev ? { ...prev, documents: updatedDocs } : null);
        
        // Reset
        if (fileInputRef.current) fileInputRef.current.value = '';
        setCustomDocName('');
        
    } catch (err) {
        console.error(err);
        alert("Failed to upload document.");
    } finally {
        setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
      if (!selectedStudent || !window.confirm("Are you sure you want to delete this document?")) return;
      
      try {
          const updatedDocs = await removeStudentDocument(schoolId, selectedStudent.id, docId);
          setSelectedStudent(prev => prev ? { ...prev, documents: updatedDocs } : null);
      } catch (err) {
          alert("Failed to delete document.");
      }
  };

  const getClassName = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return id;
    return cls.section ? `${cls.name} (${cls.section})` : cls.name;
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">Student Documents</h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                         Student Archives
                     </span>
                </div>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Storage Status</p>
                  <p className="text-sm font-bold">Secure • Encrypted</p>
               </div>
               <div className="w-10 h-10 border-2 border-white/20 flex items-center justify-center bg-white/10 dark:bg-slate-800/10 text-white rounded-none">
                  <FolderOpen size={20} weight="fill"/>
               </div>
            </div>
        </div>

        {/* --- SPLIT CONTENT --- */}
        <div className="flex flex-col lg:flex-row h-[800px] border-b-2 border-slate-200 dark:border-slate-700">
            
            {/* LEFT: STUDENT SELECTOR */}
            <div className="w-full lg:w-1/3 bg-slate-50 dark:bg-slate-800/50 border-r-2 border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Select Student</h3>
                    <div className="space-y-2">
                        <div className="flex items-center bg-slate-100 border-2 border-slate-200 dark:border-slate-700 p-1">
                             <MagnifyingGlass size={16} weight="bold" className="text-slate-400 ml-2"/>
                             <input 
                                type="text" 
                                placeholder="SEARCH NAME/ROLL..." 
                                className="w-full bg-transparent p-2 text-xs font-bold uppercase tracking-wide outline-none placeholder-slate-400"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                             />
                        </div>
                        <select 
                            value={selectedClassId} 
                            onChange={e => setSelectedClassId(e.target.value)}
                            className="w-full p-2 bg-slate-100 border-2 border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wide outline-none"
                        >
                            <option value="all">ALL CLASSES</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredStudents.map(student => (
                        <button 
                            key={student.id}
                            onClick={() => handleStudentClick(student)}
                            className={`w-full text-left p-4 border-b border-slate-200 flex items-center justify-between group transition-all ${
                                selectedStudent?.id === student.id 
                                ? 'bg-[#1e3a8a] text-white' 
                                : 'bg-white hover:bg-slate-100 text-slate-700'
                            }`}
                        >
                            <div>
                                <p className="font-black text-xs uppercase tracking-wide">{student.name}</p>
                                <p className={`text-[10px] font-bold uppercase mt-1 ${selectedStudent?.id === student.id ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {student.rollNo} • {getClassName(student.classId)}
                                </p>
                            </div>
                            {(student.documents?.length || 0) > 0 && (
                                <div className={`px-2 py-1 text-[9px] font-black flex items-center gap-1 border ${selectedStudent?.id === student.id ? 'bg-blue-900 border-blue-800' : 'bg-slate-100 border-slate-200'}`}>
                                    <Files size={12} weight="fill"/> {student.documents?.length}
                                </div>
                            )}
                        </button>
                    ))}
                    {filteredStudents.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No students found</div>
                    )}
                </div>
            </div>

            {/* RIGHT: DOCUMENT MANAGER */}
            <div className="flex-1 bg-white dark:bg-slate-800 flex flex-col relative">
                {selectedStudent ? (
                    <>
                        {/* Action Bar */}
                        <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row items-center gap-6 justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <User size={24} weight="fill" className="text-[#1e3a8a]"/> 
                                    {selectedStudent.name}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                                    {selectedStudent.documents?.length || 0} Files Archived
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <select 
                                    value={docType} 
                                    onChange={e => setDocType(e.target.value)}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:border-[#1e3a8a] transition-colors"
                                >
                                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                </select>
                                
                                {docType === 'Other' && (
                                    <input 
                                        type="text" 
                                        placeholder="DOC NAME" 
                                        value={customDocName}
                                        onChange={e => setCustomDocName(e.target.value)}
                                        className="w-32 px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 text-[10px] font-black outline-none uppercase"
                                    />
                                )}

                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    disabled={uploading}
                                    className="px-6 py-2 bg-[#1e3a8a] text-white border-2 border-[#1e3a8a] text-[10px] font-black uppercase tracking-widest hover:bg-white dark:bg-slate-800 hover:text-[#1e3a8a] transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {uploading ? <CircleNotch className="animate-spin" size={14} weight="bold"/> : <UploadSimple size={14} weight="fill"/>} 
                                    Upload
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                            </div>
                        </div>

                        {/* Document Grid */}
                        <div className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                            {selectedStudent.documents && selectedStudent.documents.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {selectedStudent.documents.map((doc) => (
                                        <div key={doc.id} className="group bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-[#1e3a8a] transition-all relative shadow-sm hover:shadow-[4px_4px_0px_#1e3a8a]">
                                            <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 relative flex items-center justify-center overflow-hidden">
                                                {doc.type.includes('image') ? (
                                                    <ImageWithTempUrl fileName={doc.url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FileText size={48} className="text-slate-300" weight="duotone" />
                                                )}
                                                
                                                {/* Hover Actions */}
                                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-slate-800 text-black hover:bg-blue-50 transition-colors border-2 border-white">
                                                        <Eye size={16} weight="bold" />
                                                    </a>
                                                    <button onClick={() => handleDelete(doc.id)} className="p-2 bg-rose-600 text-white hover:bg-rose-700 transition-colors border-2 border-rose-600">
                                                        <Trash size={16} weight="bold" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="p-3">
                                                <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs truncate uppercase tracking-tight" title={doc.name}>{doc.name}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                    <FolderOpen size={64} className="mb-4 opacity-20" weight="fill"/>
                                    <p className="font-black text-xl text-slate-400 uppercase tracking-widest">No Documents</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mt-2">Upload student records here</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <MagnifyingGlass size={64} className="mb-4 opacity-20" weight="fill"/>
                        <p className="font-black text-2xl text-slate-400 uppercase tracking-tight">Select a Student</p>
                        <p className="text-xs font-bold uppercase tracking-widest mt-2">Choose from the list on the left</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDocuments;
