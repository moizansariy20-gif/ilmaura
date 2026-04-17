
import React, { useState } from 'react';
import { 
  LibraryIcon as Library, Search01Icon as Search, Loading01Icon as Loader2, Video01Icon as ListVideo, PlayIcon as Play, AlertCircleIcon as AlertTriangle, 
  DashboardSquare01Icon as LayoutGrid, CalculatorIcon as Calculator, Chemistry01Icon as FlaskConical, CodeIcon as Code, Globe02Icon as Globe, PaintBoardIcon as Palette, MusicNote01Icon as Music
} from 'hugeicons-react';
import { LearningResource, School } from '../../types.ts';
import { fetchYouTubeApiResults } from '../../ai/youtubeService.ts';
import CoursePlayer from '../components/CoursePlayer.tsx';
import StudentPageHeader from '../components/StudentPageHeader.tsx';

interface LearningHubProps {
  school: School;
  courses: LearningResource[];
  profile?: any;
  currentClass?: any;
}

const CATEGORIES = [
  { id: 'all', label: 'All Courses', icon: LayoutGrid },
  { id: 'math', label: 'Mathematics', icon: Calculator },
  { id: 'science', label: 'Science', icon: FlaskConical },
  { id: 'coding', label: 'Programming', icon: Code },
  { id: 'history', label: 'History', icon: Globe },
  { id: 'arts', label: 'Arts', icon: Palette },
];

const LearningHub: React.FC<LearningHubProps> = ({ school, courses, profile, currentClass }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LearningResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<LearningResource | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const results = await fetchYouTubeApiResults(searchQuery, 'any', 'relevance', 'all');
      setSearchResults(results);
      setActiveCategory('all'); // Reset category on search
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const baseCourses = searchQuery ? searchResults : courses;

  const displayCourses = baseCourses.filter(c => {
    if (activeCategory === 'all') return true;
    const text = (c.title + (c.description || '') + c.channel).toLowerCase();
    
    // Basic keyword matching for demo purposes since courses come from YouTube
    const keywords: {[key: string]: string[]} = {
        math: ['math', 'algebra', 'calculus', 'geometry', 'trigonometry', 'statistics'],
        science: ['science', 'physics', 'chemistry', 'biology', 'botany', 'zoology'],
        coding: ['code', 'program', 'python', 'java', 'web', 'react', 'javascript', 'css', 'html', 'development'],
        history: ['history', 'war', 'civilization', 'ancient', 'world'],
        arts: ['art', 'draw', 'paint', 'design', 'music', 'sketch'],
    };

    return keywords[activeCategory]?.some(k => text.includes(k));
  });

  return (
    <div className="pb-24 animate-in fade-in duration-500 min-h-screen">
      {selectedCourse && <CoursePlayer course={selectedCourse} onClose={() => setSelectedCourse(null)} />}
      
      <StudentPageHeader profile={profile} currentClass={currentClass} title="Learning Hub" subtitle="Explore Courses" />

      {/* Search Bar */}
      <div className="mb-6 sticky top-0 z-20 bg-[#f8fafc] pt-2 pb-2">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center transition-all focus-within:shadow-md focus-within:border-violet-300">
             <div className="w-12 h-12 flex items-center justify-center text-slate-400">
                <Search size={20}/>
             </div>
             <form onSubmit={handleSearch} className="flex-1">
                <input 
                    type="text" 
                    placeholder="Search courses..." 
                    className="w-full h-12 bg-transparent outline-none font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 text-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
             </form>
             <button onClick={handleSearch} className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 active:scale-90 transition-all shadow-md shadow-violet-200">
                {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>}
             </button>
          </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="mb-8">
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1">
            {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex flex-col items-center justify-center gap-2 min-w-[80px] h-[80px] p-2 rounded-2xl transition-all border ${
                            isActive 
                            ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30 scale-105' 
                            : 'bg-white border-slate-100 text-slate-500 hover:border-violet-200 hover:bg-violet-50'
                        }`}
                    >
                        <Icon size={20} />
                        <span className="text-[10px] font-black uppercase tracking-wide">{cat.label.split(' ')[0]}</span>
                    </button>
                );
            })}
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4">
         <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg px-2">
            {activeCategory === 'all' ? 'Featured Courses' : `${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
         </h3>
         
         {displayCourses.length > 0 ? displayCourses.map((course, i) => (
            <div 
                key={i}
                style={{ animationDelay: `${i * 50}ms` }}
                className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group animate-in slide-in-from-bottom-4 duration-500 flex gap-4 overflow-hidden relative"
            >
                <div className="w-28 h-28 rounded-2xl bg-slate-100 shrink-0 overflow-hidden relative">
                    <img src={course.thumbnailUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <ListVideo size={10} /> {course.videoCount}
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                    <div>
                        <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest">{course.channel}</span>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight mt-1 line-clamp-2">{course.title}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] font-bold text-slate-400">Course • Free</span>
                        <button 
                            onClick={() => setSelectedCourse(course)}
                            className="px-4 py-2 bg-[#FFD700] text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-yellow-500/20 hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
                        >
                            View <Play size={10} fill="currentColor"/>
                        </button>
                    </div>
                </div>
            </div>
         )) : (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <Library size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="font-black text-slate-400">No courses found</p>
                <p className="text-xs text-slate-300 mt-1 font-bold">Try searching for something else.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default LearningHub;
