import React, { useEffect, useRef, useState } from 'react';
import { X, User, ListVideo, AlertTriangle, ExternalLink } from 'lucide-react';
import { LearningResource } from '../../types.ts';

interface CoursePlayerProps {
  course: LearningResource;
  onClose: () => void;
}

const YouTubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 20" fill="none" className="w-auto h-5 shrink-0">
    <path fill="#FF0000" d="M27.4 3.1s-.3-2.2-1.2-3C25.1.3 24 .3 22.9.3 18.9 0 14 0 14 0S9.1 0 5.1.3C4 .3 2.9.3 1.8.7.9 1.5.6 3.1.6 3.1S0 5.1 0 9.1v1.8c0 4 1 6 1 6s.3 2.2 1.2 3c1.1.4 2.6.5 3.7.5 4.5.3 9.4.3 9.4.3s4.9 0 8.9-.3c1.1 0 2.2 0 3.3-.4 1-.8 1.2-2.4 1.2-2.4s.6-2 .6-6V9.1c0-4-.6-6-.6-6Z"/>
    <path fill="#fff" d="m11.2 13.7 7.4-4.2-7.4-4.2v8.4Z"/>
  </svg>
);

const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, onClose }) => {
  const playerRef = useRef<any>(null);
  const [playerError, setPlayerError] = useState(false);
  const playlistId = new URL(course.url).searchParams.get('list');

  useEffect(() => {
    setPlayerError(false); // Reset error state on new course

    const createPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = new (window as any).YT.Player('youtube-player-container', {
        height: '100%',
        width: '100%',
        playerVars: {
          listType: 'playlist',
          list: playlistId,
          autoplay: 1,
          origin: window.location.origin,
        },
        events: {
          'onError': (error: any) => {
            console.error("YouTube Player Error:", error.data);
            setPlayerError(true);
          }
        }
      });
    };

    if (!(window as any).YT || !(window as any).YT.Player) {
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    } else {
      createPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      (window as any).onYouTubeIframeAPIReady = undefined;
    };
  }, [playlistId]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-800 animate-in fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-700 text-white shrink-0 border-b border-slate-600">
        <div className="flex items-center gap-3 min-w-0">
          <YouTubeIcon />
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate">{course.title}</h1>
            <p className="text-xs text-slate-300 truncate">by {course.channel}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-600">
          <X size={22} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* YouTube player container */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {playerError ? (
            <div className="text-center text-white p-8 max-w-lg animate-in fade-in">
                <AlertTriangle size={48} className="mx-auto text-amber-400 mb-6"/>
                <h2 className="text-2xl font-black">Content Unavailable</h2>
                <p className="text-slate-300 mt-2 mb-8 text-sm">
                    This video playlist could not be loaded inside the portal. This can happen due to the creator's settings or regional restrictions.
                </p>
                <a 
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-sm shadow-2xl hover:bg-slate-200 transition-all active:scale-95"
                >
                    <YouTubeIcon />
                    Watch on YouTube
                    <ExternalLink size={16} className="opacity-70"/>
                </a>
            </div>
          ) : (
            <div id="youtube-player-container" style={{ width: '100%', height: '100%' }}></div>
          )}
        </div>
        
        {/* Details Sidebar */}
        <aside className="w-full lg:w-80 bg-slate-700 p-6 space-y-6 overflow-y-auto custom-scrollbar shrink-0">
           <div className="flex items-center gap-4">
               {course.channelLogoUrl && <img src={course.channelLogoUrl} alt={course.channel} className="w-12 h-12 rounded-full" />}
               <div>
                   <p className="font-bold text-white text-lg">{course.channel}</p>
                   {course.subscriberCount && <p className="text-sm text-slate-300 flex items-center gap-1.5"><User size={14}/> {course.subscriberCount} subscribers</p>}
               </div>
           </div>
           <div className="flex items-center gap-3 text-base text-slate-200 p-4 bg-slate-600/50 rounded-xl">
               <ListVideo size={20}/>
               <span className="font-bold">{course.videoCount} videos in this playlist</span>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
