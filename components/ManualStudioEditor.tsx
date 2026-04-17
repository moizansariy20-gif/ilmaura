import React, { useState, useRef, useEffect } from 'react';
import { Sun, CircleHalf, MagnifyingGlassPlus, Check, X, ArrowClockwise } from 'phosphor-react';

interface ManualStudioEditorProps {
  image: string;
  onSave: (processedImage: string) => void;
  onCancel: () => void;
}

const ManualStudioEditor: React.FC<ManualStudioEditorProps> = ({ image, onSave, onCancel }) => {
  console.log('EduControl: ManualStudioEditor mounted with image length:', image.length);
  const [brightness, setBrightness] = useState(110); // Default slightly brighter
  const [contrast, setContrast] = useState(105);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('EduControl: Loading image into editor canvas...');
    const img = new Image();
    img.src = image;
    img.onload = () => {
      console.log('EduControl: Editor image loaded successfully');
      // Set canvas size to a standard passport aspect ratio (7:9)
      const targetWidth = 350;
      const targetHeight = 450;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      
      // Draw image with zoom and rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      const scale = (zoom / 100) * (canvas.width / img.width);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
    };
  }, [image, brightness, contrast, zoom, rotation]);

  const handleSave = () => {
    setIsProcessing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onSave(dataUrl);
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto">
        
        {/* Preview Area */}
        <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center relative overflow-hidden">
          <div className="relative shadow-2xl border-4 border-white rounded-lg overflow-hidden bg-white dark:bg-slate-800">
            <canvas ref={canvasRef} className="max-w-full max-h-[60vh] object-contain" />
            <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
              Passport Preview
            </div>
          </div>
        </div>

        {/* Controls Area */}
        <div className="w-full md:w-80 bg-white dark:bg-slate-800 p-6 border-l border-slate-100 dark:border-slate-800 flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Studio Editor</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Fine-tune the photo for the ID card.</p>
          </div>

          <div className="space-y-6 flex-1">
            {/* Brightness / Gora Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Sun size={18} className="text-amber-500" weight="fill" />
                  Brightness (Gora/Bright)
                </label>
                <span className="text-xs font-mono text-slate-400">{brightness}%</span>
              </div>
              <input 
                type="range" min="50" max="200" value={brightness} 
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <CircleHalf size={18} className="text-indigo-500" weight="fill" />
                  Contrast
                </label>
                <span className="text-xs font-mono text-slate-400">{contrast}%</span>
              </div>
              <input 
                type="range" min="50" max="150" value={contrast} 
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Zoom / Scale */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <MagnifyingGlassPlus size={18} className="text-emerald-500" weight="fill" />
                  Zoom / Fit
                </label>
                <span className="text-xs font-mono text-slate-400">{zoom}%</span>
              </div>
              <input 
                type="range" min="50" max="200" value={zoom} 
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <ArrowClockwise size={18} className="text-slate-500 dark:text-slate-400" weight="fill" />
                  Rotate
                </label>
                <span className="text-xs font-mono text-slate-400">{rotation}°</span>
              </div>
              <input 
                type="range" min="-45" max="45" value={rotation} 
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={18} weight="bold" />
              {isProcessing ? 'Saving...' : 'Save Photo'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManualStudioEditor;
