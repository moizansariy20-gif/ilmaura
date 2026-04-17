import React, { useState } from 'react';
import { Search, Library, Loader2, AlertTriangle, X, Plus, Trash2, ExternalLink, SlidersHorizontal, CheckCircle } from 'lucide-react';
import { fetchYouTubeApiResults } from '../../ai/youtubeService.ts';
import { LearningResource } from '../../types.ts';

const YouTubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 20" fill="none" className="w-5 h-auto">
    <path fill="#FF0000" d="M27.4 3.1s-.3-2.2-1.2-3C25.1.3 24 .3 22.9.3 18.9 0 14 0 14 0S9.1 0 5.1.3C4 .3 2.9.3 1.8.7.9 1.5.6 3.1.6 3.1S0 5.1 0 9.1v1.8c0 4 .6 6 .6 6s.3 2.2 1.2 3c1.1.4 2.6.5 3.7.5 4.5.3 9.4.3 9.4.3s4.9 0 8.9-.3c1.1 0 2.2 0 3.3-.4 1-.8 1.2-2.4 1.2-2.4s.6-2 .6-6V9.1c0-4-.6-6-.6-6Z"/>
    <path fill="#fff" d="m11.2 13.7 7.4-4.2-7.4-4.2v8.4Z"/>
  </svg>
);

interface CourseCardProps {
  course: LearningResource;
  onAction: () => void;
  isAdded: boolean;
  actionType: 'add' | 'remove';
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onAction, isAdded, actionType }) => (
  <div className="group bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden transition-all hover:border-blue-300">
    <div className="relative">
      <img src={course.thumbnailUrl} alt={course.title} className="aspect-video w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-sm font-semibold">{course.videoCount} Videos</div>
    </div>
    
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {course.channelLogoUrl && <img src={course.channelLogoUrl} alt={course.channel} className="w-6 h-6 rounded-sm" />}
        <p className="text-xs font-semibold text-slate-500 line-clamp-1 flex-1">{course.channel}</p>
      </div>
      
      <h3 className="font-bold text-slate-900 text-sm h-10 line-clamp-2 leading-tight">{course.title}</h3>
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        {actionType === 'add' ? (
          isAdded ? (
            <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider"><CheckCircle size={14}/> Added</span>
          ) : (
            <button onClick={onAction} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-colors">
              <Plus size={14}/> Add
            </button>
          )
        ) : (
          <button onClick={onAction} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-colors">
            <Trash2 size={14}/> Remove
          </button>
        )}
        
        <a href={course.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
          <ExternalLink size={16}/>
        </a>
      </div>
    </div>
  </div>
);


interface LearningHubManagementProps {
  courses: LearningResource[];
  onAddCourse: (course: Omit<LearningResource, 'id' | 'createdAt'>) => Promise<any>;
  onDeleteCourse: (courseId: string) => Promise<void>;
}

const LearningHubManagement: React.FC<LearningHubManagementProps> = ({ courses, onAddCourse, onDeleteCourse }) => {
  const [searchResults, setSearchResults] = useState<LearningResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [language, setLanguage] = useState('any');
  const [sortBy, setSortBy] = useState('relevance');
  const [filterBy, setFilterBy] = useState('all');

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError('');
    setSearchResults([]);
    try {
      const results = await fetchYouTubeApiResults(searchQuery, language, sortBy, filterBy);
      setSearchResults(results);
      if (results.length === 0) {
        setError('No playlists found. Try different keywords.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (course: LearningResource) => {
    const { id, subscriberCountRaw, ...courseData } = course;
    await onAddCourse(courseData);
  };
  
  const isCourseInHub = (url: string) => courses.some(c => c.url === url);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Learning Hub</h1>
        <p className="text-slate-500 text-sm mt-1">Manage global educational content for all schools.</p>
      </div>
      
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm sticky top-4 z-10">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search YouTube for educational playlists..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button type="submit" className="flex-1 sm:flex-auto px-6 py-3 bg-blue-600 text-white rounded-sm font-bold text-sm hover:bg-blue-700 transition-colors">Search</button>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`p-3 rounded-sm border transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}><SlidersHorizontal size={18} /></button>
          </div>
        </form>
        {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Language</label><select value={language} onChange={e => setLanguage(e.target.value)} className="w-full mt-1.5 p-2 bg-white border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-blue-500"><option value="any">Any</option><option value="english">English</option><option value="urdu">Urdu</option></select></div>
                <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sort By</label><select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full mt-1.5 p-2 bg-white border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-blue-500"><option value="relevance">Relevance</option><option value="date">Date</option><option value="viewCount">Views</option></select></div>
                <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</label><select value={filterBy} onChange={e => setFilterBy(e.target.value)} className="w-full mt-1.5 p-2 bg-white border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-blue-500"><option value="all">All Time</option><option value="recent">Last Year</option></select></div>
            </div>
        )}
      </div>

      {isLoading && <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" size={24} /></div>}
      {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-sm text-sm font-medium flex items-center justify-center gap-2"><AlertTriangle size={16}/> {error}</div>}

      {searchResults.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Search Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {searchResults.map((course) => (
              <CourseCard 
                key={course.url} 
                course={course} 
                onAction={() => handleAdd(course)}
                isAdded={isCourseInHub(course.url)}
                actionType="add"
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Current Library ({courses.length})</h2>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onAction={() => onDeleteCourse(course.id!)}
                isAdded={true}
                actionType="remove"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-sm border border-slate-200 text-slate-500">
            <Library size={32} className="mx-auto text-slate-300 mb-3"/>
            <p className="font-medium">The library is empty.</p>
            <p className="text-sm mt-1">Use the search bar above to find and add courses.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningHubManagement;