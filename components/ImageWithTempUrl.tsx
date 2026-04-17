
import React, { useState, useEffect } from 'react';
import { getMockFileUrl } from '../services/mockStorage.ts'; 
import { Image as ImageIcon, AlertTriangle, Loader2 } from 'lucide-react';

interface ImageWithTempUrlProps {
  fileName: string | undefined;
  alt?: string;
  className?: string;
}

const ImageWithTempUrl: React.FC<ImageWithTempUrlProps> = ({ fileName, alt = "Classwork image", className }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileName) {
      setLoading(false);
      return;
    }

    // Supabase returns full public URLs (starting with http/https)
    // or Data URIs.
    if (fileName.startsWith('http') || fileName.startsWith('data:')) {
        setUrl(fileName);
        setLoading(false);
    } else {
        // Fallback for any legacy mock storage keys
        const fetchMock = async () => {
            try {
                const dataUrl = await getMockFileUrl(fileName);
                setUrl(dataUrl);
            } catch (e) {
                console.error("Mock fetch error", e);
                // If mock fails, maybe it's just a raw path? Try treating as URL?
                // Unlikely in this flow, but safe to set error.
                setError("Image not found");
            } finally {
                setLoading(false);
            }
        };
        fetchMock();
    }

  }, [fileName]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl ${className?.includes('h-') ? className : 'w-full h-48'}`}>
        <Loader2 className="animate-spin text-slate-300" size={24} />
      </div>
    );
  }

  if (error || !url) {
    if (!fileName) return null; 
    return (
      <div className={`flex flex-col items-center justify-center bg-rose-50 text-rose-400 rounded-2xl p-6 border border-rose-100 ${className?.includes('h-') ? className : 'w-full h-48'}`}>
        <AlertTriangle size={24} className="mb-2 opacity-50" />
        <span className="text-[10px] font-black uppercase tracking-widest">{error || "Image Missing"}</span>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group/imglink" onClick={(e) => e.preventDefault()}> 
      <img 
        src={url} 
        alt={alt} 
        className={className || "rounded-lg border border-slate-200 object-cover max-w-xs w-full"} 
        onError={() => setError("Failed to load")}
      />
    </a>
  );
};

export default ImageWithTempUrl;
