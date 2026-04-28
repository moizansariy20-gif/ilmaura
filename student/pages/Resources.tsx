
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Link as LinkIcon, Download, ExternalLink, Library, Bookmark } from 'lucide-react';
import { ArrowLeft01Icon as ArrowLeft, FolderOpenIcon } from 'hugeicons-react';

interface ResourcesProps {
  resources: any[];
  subjects: any[];
  profile?: any;
  currentClass?: any;
}

const Resources: React.FC<ResourcesProps> = ({ resources, subjects, profile, currentClass }) => {
  const navigate = useNavigate();
  const getSubjectName = (subjectId: string) => subjects.find(s => s.id === subjectId)?.name || 'General';

  return (
    <div className="min-h-full bg-white dark:bg-[#020617] pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      {/* TOP NAV BAR */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
          <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e293b] shadow-sm flex items-center justify-center border border-slate-100 dark:border-[#1e293b] active:scale-90 transition-transform"
          >
              <ArrowLeft size={20} className="text-[#1e3a8a] dark:text-[#D4AF37]" />
          </button>
          <div className="flex items-center gap-3">
              <div className="text-right">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Student</p>
                  <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{profile?.name || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37]/40 shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                  {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                      profile?.name?.charAt(0) || 'S'
                  )}
              </div>
          </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 mt-4">
        {/* Header Section */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">Digital Library</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Resources</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Access notes, books & links
                </p>
              </div>
            </div>
            
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <FolderOpenIcon size={32} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 space-y-8">
          
          {/* Section Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest drop-shadow-sm">Recent Uploads</h2>
              <div className="h-px bg-gradient-to-r from-[#D4AF37]/40 to-transparent flex-1"></div>
              <span className="text-[10px] font-bold text-[#1e3a8a] dark:text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
                  {resources.length} Items
              </span>
            </div>

            {resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((res, index) => (
                    <a 
                    key={res.id} 
                    href={res.type === 'book' ? res.fileURL : res.url}
                    download={res.type === 'book' ? res.fileName : undefined}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="group flex gap-4 p-5 bg-[#FCFBF8] dark:bg-[#0f172a] rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:shadow-lg transition-all relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent rounded-bl-full pointer-events-none"></div>
                      
                      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {res.type === 'book' ? <BookOpen size={24} className="text-[#1e3a8a] dark:text-[#D4AF37]" /> : <LinkIcon size={24} className="text-[#1e3a8a] dark:text-[#D4AF37]" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#1e3a8a] dark:text-[#D4AF37] rounded-lg text-[9px] font-black uppercase tracking-widest">{getSubjectName(res.subjectId)}</span>
                        </div>
                        <h4 className="font-black text-[#1e3a8a] dark:text-white text-lg leading-tight truncate group-hover:text-[#D4AF37] transition-colors">
                          {res.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-bold text-[#1e3a8a]/70 dark:text-[#D4AF37]/80 flex items-center gap-1 uppercase tracking-widest bg-[#D4AF37]/10 px-2 py-1 rounded-md">
                            {res.type === 'link' ? <ExternalLink size={12}/> : <Download size={12}/>}
                            {res.type === 'link' ? 'External Web Link' : res.fileName || 'PDF Document'}
                          </span>
                        </div>
                      </div>
                    </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-[#FCFBF8] dark:bg-[#0f172a] rounded-2xl border border-[#D4AF37]/20 border-dashed">
                  <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#D4AF37]/10">
                      <Library size={32} className="text-[#D4AF37]" />
                  </div>
                  <p className="font-black text-[#1e3a8a] dark:text-white text-lg">Empty Library</p>
                  <p className="text-[10px] text-[#1e3a8a]/60 dark:text-[#D4AF37]/60 mt-1 font-bold uppercase tracking-widest">Resources will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
