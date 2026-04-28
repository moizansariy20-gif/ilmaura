import React, { useState, useEffect } from 'react';
import { VideoCamera, Plus, Trash, MonitorPlay, X, WarningCircle } from 'phosphor-react';
import { supabase } from '../../services/supabase.ts';
import { usePermissions } from '../../hooks/usePermissions.ts';

interface Camera {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
}

interface CCTVCamerasProps {
  schoolId: string;
  profile?: any;
}

const CCTVCameras: React.FC<CCTVCamerasProps> = ({ schoolId, profile }) => {
  const { canAdd, canDelete } = usePermissions(profile);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCam, setNewCam] = useState({ name: '', url: '' });
  const [activeCamera, setActiveCamera] = useState<Camera | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCameras();
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, [schoolId]);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cctv_cameras')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data) {
        const formattedCameras: Camera[] = data.map(cam => ({
          id: cam.id,
          name: cam.name,
          url: cam.stream_url,
          status: cam.status as 'online' | 'offline'
        }));
        setCameras(formattedCameras);
      }
    } catch (error) {
      console.error('Error fetching cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCam.name || !newCam.url) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data, error } = await supabase
        .from('cctv_cameras')
        .insert([{
          school_id: schoolId,
          name: newCam.name,
          stream_url: newCam.url,
          status: 'online',
          created_by: userId
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCameras([...cameras, { id: data.id, name: data.name, url: data.stream_url, status: data.status as 'online' | 'offline' }]);
        setIsAdding(false);
        setNewCam({ name: '', url: '' });
      }
    } catch (error) {
      console.error('Error adding camera:', error);
      // Removed alert, using console.error instead
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cctv_cameras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCameras(cameras.filter(c => c.id !== id));
      if (activeCamera?.id === id) setActiveCamera(null);
    } catch (error) {
      console.error('Error deleting camera:', error);
      // Removed alert, using console.error instead
    }
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-[#1e293b] border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
              <VideoCamera size={32} weight="fill" />
              Live Surveillance
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-white dark:bg-[#1e293b] text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                School CCTV Network
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            {canAdd('cctv') && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-colors border-2 border-white/20 shadow-sm"
              >
                <Plus size={18} weight="bold" />
                Add Camera
              </button>
            )}
          </div>
        </div>

        {/* --- GRID --- */}
        <div className="p-6 md:p-8 bg-slate-50 dark:bg-[#0f172a] flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div>
            </div>
          ) : cameras.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
              <VideoCamera size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-bold uppercase tracking-widest">No Cameras Added</p>
              <p className="text-sm">Click "Add Camera" to connect a live stream.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cameras.map(cam => (
              <div key={cam.id} className="bg-white dark:bg-[#1e293b] border-2 border-slate-300 flex flex-col overflow-hidden relative group hover:border-[#1e3a8a] hover:shadow-[4px_4px_0px_#1e3a8a] transition-all">
                <div className="p-3 bg-slate-100 flex justify-between items-center border-b-2 border-slate-200 dark:border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cam.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                    <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest">{cam.name}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setActiveCamera(cam)} className="text-slate-500 dark:text-slate-400 hover:text-[#1e3a8a] transition-colors bg-white dark:bg-[#1e293b] border-2 border-slate-300 p-1">
                      <MonitorPlay size={16} weight="fill" />
                    </button>
                    {canDelete('cctv') && (
                      <button onClick={() => handleDelete(cam.id)} className="text-slate-500 dark:text-slate-400 hover:text-rose-600 transition-colors bg-white dark:bg-[#1e293b] border-2 border-slate-300 p-1">
                        <Trash size={16} weight="fill" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                  {cam.status === 'online' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Real Video Feed (Demo) */}
                      <iframe 
                        src={cam.url} 
                        className="w-full h-full scale-[1.35]" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                      <div className="absolute inset-0 bg-blue-900/10 pointer-events-none"></div>
                      
                      {/* Overlay Elements */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                        <span className="text-white/90 font-black tracking-widest text-[10px] uppercase">REC</span>
                      </div>
                      <div className="absolute bottom-3 right-3 text-white/90 font-mono text-[10px] tracking-wider bg-black/60 px-2 py-0.5 border border-white/20">
                        {currentTime}
                      </div>
                      <div className="absolute bottom-3 left-3 text-white/70 font-mono text-[10px] tracking-wider font-bold">
                        CAM-{cam.id.padStart(2, '0')}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                      <WarningCircle size={32} weight="duotone" className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Camera Offline</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

      </div>

      {/* Add Camera Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] border-4 border-slate-900 shadow-[8px_8px_0px_#1e3a8a] w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 bg-[#1e3a8a] text-white border-b-4 border-slate-900">
              <h3 className="text-xl font-black uppercase tracking-tight">Add New Camera</h3>
              <button onClick={() => setIsAdding(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={24} weight="bold" />
              </button>
            </div>
            <form onSubmit={handleAddCamera} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Camera Name / Location</label>
                <input
                  type="text"
                  required
                  value={newCam.name}
                  onChange={e => setNewCam({...newCam, name: e.target.value})}
                  placeholder="e.g. Main Gate"
                  className="w-full bg-slate-50 border-2 border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#1e3a8a] focus:bg-white dark:bg-[#1e293b] transition-colors uppercase tracking-wide"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Stream URL (RTSP / Cloud Link)</label>
                <input
                  type="url"
                  required
                  value={newCam.url}
                  onChange={e => setNewCam({...newCam, url: e.target.value})}
                  placeholder="rtsp://..."
                  className="w-full bg-slate-50 border-2 border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#1e3a8a] focus:bg-white dark:bg-[#1e293b] transition-colors"
                />
              </div>
              <div className="pt-2 flex gap-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-white dark:bg-[#1e293b] border-2 border-slate-300 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs py-3 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-[#1e3a8a] border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs py-3 hover:bg-blue-900 transition-colors shadow-[4px_4px_0px_#0f172a]">
                  Save Camera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Camera View */}
      {activeCamera && (
        <div className="fixed inset-0 z-[300] flex flex-col bg-slate-950 animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-4 bg-slate-900 border-b-2 border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest">{activeCamera.name} <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">LIVE</span></h3>
            </div>
            <button onClick={() => setActiveCamera(null)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 border-2 border-slate-700">
              <X size={20} weight="bold" />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
             {/* Real Video Feed Fullscreen */}
             <div className="w-full max-w-6xl aspect-video bg-black relative border-4 border-slate-800 shadow-2xl overflow-hidden">
                <iframe 
                  src={activeCamera.url} 
                  className="w-full h-full scale-[1.15]" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
                <div className="absolute inset-0 bg-blue-900/10 pointer-events-none"></div>
                
                {/* Fullscreen Overlays */}
                <div className="absolute top-6 right-6 text-white font-mono text-xl bg-black/60 px-4 py-1.5 border-2 border-white/20 tracking-wider">
                  {currentTime}
                </div>
                <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 px-4 py-1.5 border-2 border-white/20">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-white font-black tracking-widest text-sm uppercase">REC</span>
                </div>
                <div className="absolute bottom-6 left-6 text-white/90 font-mono text-lg tracking-wider bg-black/60 px-3 py-1 border-2 border-white/20">
                  CAM-{activeCamera.id.padStart(2, '0')}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CCTVCameras;
