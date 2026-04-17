import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, ArrowsClockwise, Check, Image as ImageIcon, UserFocus } from 'phosphor-react';

interface CameraCaptureProps {
    onCapture: (imageData: string) => void;
    onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // Default to front for mobile users
    const [error, setError] = useState<string | null>(null);
    const [isSwitching, setIsSwitching] = useState(false);

    useEffect(() => {
        let active = true;
        const initCamera = async () => {
            if (isSwitching) return;
            setIsSwitching(true);
            
            // Stop existing tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            try {
                const constraints = {
                    video: { 
                        facingMode: { ideal: facingMode },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                
                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                if (active) {
                    setStream(newStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = newStream;
                    }
                    setError(null);
                } else {
                    newStream.getTracks().forEach(track => track.stop());
                }
            } catch (err: any) {
                console.error("Error accessing camera:", err);
                if (active) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        setError("Camera permission denied. Please enable camera access in your browser settings.");
                    } else if (err.name === 'OverconstrainedError') {
                        // Try again with simpler constraints if it fails
                        try {
                            const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
                            setStream(fallbackStream);
                            if (videoRef.current) videoRef.current.srcObject = fallbackStream;
                            setError(null);
                        } catch (fallbackErr) {
                            setError("Could not access any camera on this device.");
                        }
                    } else {
                        setError(`Camera error: ${err.message || "Unknown error"}`);
                    }
                }
            } finally {
                if (active) setIsSwitching(false);
            }
        };

        initCamera();

        return () => {
            active = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                // Set canvas size to match video resolution
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                
                // Flip horizontally if using front camera
                if (facingMode === 'user') {
                    context.translate(canvasRef.current.width, 0);
                    context.scale(-1, 1);
                }
                
                context.drawImage(videoRef.current, 0, 0);
                const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9);
                setCapturedImage(imageData);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCapturedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const retake = () => {
        setCapturedImage(null);
    };

    const confirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    };

    const toggleFacingMode = () => {
        if (isSwitching) return;
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative max-w-md w-full mx-auto">
            {error ? (
                <div className="p-10 text-center flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500">
                        <X size={32} weight="bold" />
                    </div>
                    <p className="text-white font-bold text-lg leading-tight">{error}</p>
                    <div className="flex flex-col gap-3 w-full">
                        <button 
                            onClick={() => { setError(null); setFacingMode(prev => prev); }} 
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs"
                        >
                            Try Again
                        </button>
                        <button 
                            onClick={onClose} 
                            className="w-full bg-white/10 dark:bg-slate-800/10 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="relative aspect-[3/4] bg-black overflow-hidden">
                        {/* Back Button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 left-4 z-50 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20"
                        >
                            <X size={20} weight="bold" />
                        </button>

                        {!capturedImage ? (
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                            />
                        ) : (
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        )}
                        
                        {isSwitching && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4">
                                <ArrowsClockwise size={40} className="animate-spin" />
                                <p className="text-xs font-black uppercase tracking-widest">Switching Camera...</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 flex flex-col gap-6 bg-slate-800/80 backdrop-blur-xl border-t border-white/10">
                        {!capturedImage ? (
                            <div className="flex items-center justify-center gap-8">
                                <div className="w-12 h-12"></div> {/* Spacer for centering */}
                                
                                <button 
                                    onClick={takePhoto}
                                    disabled={isSwitching}
                                    className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-all disabled:opacity-50 disabled:scale-90"
                                >
                                    <div className="w-16 h-16 border-4 border-slate-900 rounded-full flex items-center justify-center">
                                        <div className="w-12 h-12 bg-slate-900 rounded-full opacity-10"></div>
                                    </div>
                                </button>

                                <button 
                                    onClick={toggleFacingMode}
                                    disabled={isSwitching}
                                    className={`w-12 h-12 flex flex-col items-center justify-center gap-1 transition-all rounded-2xl ${facingMode === 'user' ? 'bg-emerald-500 text-white' : 'bg-white/5 dark:bg-slate-800/5 text-white/40'}`}
                                    title={facingMode === 'user' ? "Using Front Camera" : "Using Back Camera"}
                                >
                                    <ArrowsClockwise size={20} weight="bold" className={isSwitching ? 'animate-spin' : ''} />
                                    <span className="text-[7px] font-black uppercase tracking-tighter">
                                        {facingMode === 'user' ? 'Front' : 'Back'}
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button 
                                    onClick={retake}
                                    className="flex-1 py-4 bg-white/10 dark:bg-slate-800/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/20 dark:bg-slate-800/20 transition-all border border-white/10"
                                >
                                    Retake
                                </button>
                                <button 
                                    onClick={confirm}
                                    className="flex-1 py-4 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Check size={18} weight="bold" /> Confirm Photo
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;
