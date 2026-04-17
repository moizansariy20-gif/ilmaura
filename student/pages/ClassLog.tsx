
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft01Icon as ChevronLeft, 
  ArrowRight01Icon as ChevronRight, 
  Bookmark01Icon as Bookmark,
  Loading01Icon as Loader2,
  Cancel01Icon as X,
  Download01Icon as Download,
  Book01Icon as BookOpen,
  Calendar01Icon as CalendarIcon,
  Clock01Icon as Clock,
  CheckmarkCircle01Icon as CheckCircle2,
  DashboardSquare01Icon as Layout,
  ArrowLeft01Icon as ArrowLeft
} from 'hugeicons-react';
import { ClassLog as ClassLogType } from '../../types.ts';
import { subscribeToClassLogs } from '../../services/api.ts';
import ImageWithTempUrl from '../../components/ImageWithTempUrl.tsx';
import { motion, AnimatePresence } from 'motion/react';

// --- UTILS ---
const downloadFile = async (url: string, name: string) => {
    try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        return true;
    } catch (e) {
        console.error("Download error", e);
        // Fallback
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = name;
        link.click();
        return false;
    }
};

// --- SINGLE IMAGE COMPONENT (For 1-2 Images) ---
const SingleImageItem = ({ file, idx, onOpen }: { file: string, idx: number, onOpen: () => void }) => {
    const [status, setStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (status === 'downloaded') {
            onOpen();
            return;
        }
        setStatus('downloading');
        await downloadFile(file, `classwork_${idx + 1}.jpg`);
        // Artificial delay for UX
        await new Promise(r => setTimeout(r, 1000));
        setStatus('downloaded');
        onOpen();
    };

    return (
        <div 
            onClick={handleDownload}
            className="relative w-full h-full cursor-pointer group rounded-2xl overflow-hidden border border-[#D4AF37]/10 shadow-sm transition-all hover:shadow-md"
        >
            <ImageWithTempUrl 
                fileName={file} 
                className={`w-full h-full object-cover transition-all duration-500 ${status === 'idle' ? 'blur-[2px] brightness-90' : ''}`}
                alt="Classwork"
            />
            <div className={`absolute inset-0 flex items-center justify-center transition-all ${status === 'downloaded' ? 'bg-transparent' : 'bg-black/20'}`}>
                {status === 'idle' && (
                    <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white shadow-lg hover:bg-black/60 hover:scale-110 transition-all">
                        <Download size={20} strokeWidth={2.5} />
                    </div>
                )}
                {status === 'downloading' && (
                    <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white shadow-lg">
                        <Loader2 size={20} className="animate-spin text-white" strokeWidth={3} />
                    </div>
                )}
            </div>
        </div>
    );
};

// --- BULK IMAGE COMPONENT (For > 2 Images) ---
const BulkImageGroup = ({ images, onOpen }: { images: string[], onOpen: (idx: number) => void }) => {
    const [status, setStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');
    const [progress, setProgress] = useState(0);

    const handleBulkDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (status === 'downloaded') {
            onOpen(0);
            return;
        }

        setStatus('downloading');
        for (let i = 0; i < images.length; i++) {
            setProgress(Math.round(((i + 1) / images.length) * 100));
            await downloadFile(images[i], `classwork_set_${i + 1}.jpg`);
            // Stagger downloads slightly
            await new Promise(r => setTimeout(r, 800));
        }
        setStatus('downloaded');
        onOpen(0);
    };

    return (
        <div className="relative">
            <div className="grid grid-cols-2 gap-3">
                {images.map((img, idx) => (
                    <div 
                        key={idx}
                        className={`relative aspect-square rounded-2xl overflow-hidden border border-[#D4AF37]/10 shadow-sm ${
                            images.length === 3 && idx === 0 ? 'col-span-2' : ''
                        }`}
                        onClick={status === 'downloaded' ? () => onOpen(idx) : undefined} 
                    >
                        <ImageWithTempUrl 
                            fileName={img} 
                            className={`w-full h-full object-cover transition-all duration-500 ${status !== 'downloaded' ? 'blur-[3px] brightness-75' : ''}`}
                            alt="Classwork"
                        />
                        {idx === 3 && images.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-xl z-10">
                                +{images.length - 4}
                            </div>
                        )}
                    </div>
                )).slice(0, 4)}
            </div>

            {status !== 'downloaded' && (
                <div 
                    onClick={handleBulkDownload}
                    className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer group"
                >
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-full border-2 border-white/20 text-white shadow-2xl flex flex-col items-center justify-center w-24 h-24 hover:scale-105 transition-transform active:scale-95">
                        {status === 'idle' ? (
                            <>
                                <Download size={32} strokeWidth={2.5} />
                                <span className="text-[9px] font-black uppercase mt-1">Download All</span>
                                <span className="text-[8px] font-bold opacity-70">{images.length} Photos</span>
                            </>
                        ) : (
                            <>
                                <Loader2 size={32} className="animate-spin" strokeWidth={2.5} />
                                <span className="text-[10px] font-black uppercase mt-1">{progress}%</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- PREMIUIM IMAGE VIEWER ---
const ImageViewer = ({ fileNames, initialIndex, onClose }: { fileNames: string[], initialIndex: number, onClose: () => void }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    return (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onClose} 
                        className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/10"
                    >
                        <X size={24}/>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-white text-base font-black tracking-tight">Classwork Gallery</span>
                        <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Viewing {currentIndex + 1} of {fileNames.length}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative overflow-hidden p-4">
                <div className="relative max-h-[80vh] max-w-full flex items-center justify-center">
                    <ImageWithTempUrl 
                        fileName={fileNames[currentIndex]} 
                        className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
                        alt="Full View"
                    />
                </div>
            </div>

            <div className="h-32 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center gap-4 px-6 overflow-x-auto no-scrollbar shrink-0 pb-8 pt-2 z-50">
                {fileNames.map((file, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setCurrentIndex(idx)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all border-2 ${idx === currentIndex ? 'border-[#D4AF37] scale-110 shadow-lg shadow-[#D4AF37]/20 z-10' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                    >
                        <ImageWithTempUrl 
                            fileName={file} 
                            className="w-full h-full object-cover" 
                            alt={`Thumb ${idx}`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};

interface ClassLogProps {
  profile: any;
  subjects: any[];
  currentClass?: any;
}

const ClassLog: React.FC<ClassLogProps> = ({ profile, subjects, currentClass }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<ClassLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerState, setViewerState] = useState<{ files: string[], index: number } | null>(null);

  useEffect(() => {
    if (!profile.classId || !profile.schoolId) return;
    
    setIsLoading(true);
    const unsub = subscribeToClassLogs(profile.schoolId, profile.classId, (fetchedLogs) => {
        setLogs(fetchedLogs.filter((l: any) => l.type === 'classwork'));
        setIsLoading(false);
    }, (err) => {
        console.error(err);
        setIsLoading(false);
    });

    return () => unsub();
  }, [profile.classId, profile.schoolId]);

  const getSubjectName = (id: string) => {
      const found = subjects.find(s => s.id === id);
      if (found) return found.name;
      return 'General Subject';
  };
  
  const formatDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const groupedLogs = useMemo(() => {
      const key = formatDateKey(currentDate);
      const daysLogs = logs.filter(log => log.date === key);
      
      const grouped: { [key: string]: { subjectId: string, content: string, images: string[], timestamp: any } } = {};
      
      daysLogs.forEach(log => {
          if (!grouped[log.subjectId]) {
              grouped[log.subjectId] = {
                  subjectId: log.subjectId,
                  content: "",
                  images: [],
                  timestamp: log.createdAt
              };
          }
          if (log.content) {
              grouped[log.subjectId].content += (grouped[log.subjectId].content ? "\n\n" : "") + log.content;
          }
          if (log.b2File?.fileName) {
              grouped[log.subjectId].images.push(log.b2File.fileName);
          }
      });
      
      return Object.values(grouped);
  }, [logs, currentDate]);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const dateDisplay = currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const isToday = formatDateKey(currentDate) === formatDateKey(new Date());

  return (
    <div className="min-h-full bg-white dark:bg-slate-900 pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* TOP NAV BAR */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
          <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 active:scale-90 transition-transform"
          >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-3">
              <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Student</p>
                  <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{profile?.name || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-white shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                  {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                      profile?.name?.charAt(0) || 'S'
                  )}
              </div>
          </div>
      </div>

      {/* Header Section - Matches Attendance/Fees Page */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">Classwork</h1>
            <div className="flex flex-col mt-1 md:mt-2">
              <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Daily Board</p>
              <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                Review your daily classroom notes
              </p>
            </div>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Layout size={32} className="text-[#D4AF37] relative z-10" />
          </div>
        </div>
      </div>

      {viewerState && (
          <ImageViewer 
            fileNames={viewerState.files} 
            initialIndex={viewerState.index} 
            onClose={() => setViewerState(null)} 
          />
      )}

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-10">
        
        {/* Date Navigator - Premium Style */}
        <div className="bg-[#FCFBF8] dark:bg-slate-800/50 border border-[#D4AF37]/10 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <button onClick={handlePrevDay} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white rounded-2xl border border-[#D4AF37]/20 shadow-sm active:scale-95 transition-all">
                <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            
            <div className="text-center">
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-0.5 leading-none">
                    {isToday ? "Today's Board" : "Viewing Date"}
                </p>
                <h3 className="text-base font-black text-[#1e3a8a] dark:text-white leading-tight uppercase tracking-tight">{dateDisplay}</h3>
            </div>

            <button onClick={handleNextDay} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-white rounded-2xl border border-[#D4AF37]/20 shadow-sm active:scale-95 transition-all">
                <ChevronRight size={24} strokeWidth={2.5} />
            </button>
        </div>

        {/* Entries */}
        <div className="space-y-8">
            {isLoading ? (
                <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#1e3a8a] dark:text-[#D4AF37]"/></div>
            ) : groupedLogs.length > 0 ? (
                <AnimatePresence mode="popLayout">
                    {groupedLogs.map((log, index) => {
                        const subjectName = getSubjectName(log.subjectId);
                        const hasImages = log.images.length > 0;
                        const isBulk = log.images.length > 2;

                        return (
                            <motion.div 
                                key={log.subjectId} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-[#FCFBF8] dark:bg-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-sm border border-[#D4AF37]/10"
                            >
                                <div className="p-6 border-b border-[#D4AF37]/10 bg-gradient-to-r from-[#1e3a8a]/5 to-transparent flex justify-between items-center">
                                    <h4 className="font-black text-[#1e3a8a] dark:text-[#D4AF37] uppercase tracking-widest text-sm">{subjectName}</h4>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon size={12} className="text-[#D4AF37]" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">
                                    {log.content && (
                                        <div className="text-[#1e3a8a] dark:text-slate-200 text-base leading-relaxed whitespace-pre-wrap font-medium">
                                            {log.content}
                                        </div>
                                    )}

                                    {hasImages && (
                                        <div className="space-y-4">
                                            {isBulk ? (
                                                <BulkImageGroup 
                                                    images={log.images} 
                                                    onOpen={(idx) => setViewerState({ files: log.images, index: idx })}
                                                />
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {log.images.map((img, imgIdx) => (
                                                        <div key={imgIdx} className="aspect-square">
                                                            <SingleImageItem 
                                                                file={img} 
                                                                idx={imgIdx} 
                                                                onOpen={() => setViewerState({ files: log.images, index: imgIdx })}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-end gap-2">
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                    {log.images.length} {log.images.length === 1 ? 'Image' : 'Images'} Attached
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {!log.content && !hasImages && (
                                        <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                                            <Clock size={24} className="text-slate-300 mb-2" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No notes recorded for this subject</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-[#FCFBF8] dark:bg-slate-800/50 rounded-[3rem] border border-[#D4AF37]/10 border-dashed">
                    <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border-4 border-[#FCFBF8]">
                        <Bookmark size={48} className="text-slate-200" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-[#1e3a8a] dark:text-white tracking-tight uppercase">No Classwork</h3>
                        <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mx-auto mt-2 leading-relaxed uppercase tracking-widest">
                            Nothing recorded for this day. Check back later!
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClassLog;
