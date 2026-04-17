import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, QrCode, Camera, AlertCircle, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async () => {
    if (qrCodeRef.current && qrCodeRef.current.isScanning) {
      try {
        await qrCodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const startScanner = async (mode: 'user' | 'environment') => {
    setIsStarting(true);
    setHasPermission(true);

    // Ensure previous scanner is stopped
    await stopScanner();

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        qrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: mode },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            // Ignore errors
          }
        );
        setIsStarting(false);
      } catch (err) {
        console.error("Failed to start scanner", err);
        setHasPermission(false);
        setIsStarting(false);
      }
    }, 300);
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startScanner(newMode);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-in zoom-in-95 duration-300 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="text-[#6B1D2F] dark:text-[#D4AF37]" size={24} />
            <h3 className="text-xl font-black text-[#6B1D2F] dark:text-white tracking-tight">QR Attendance</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasPermission === true && (
              <button 
                onClick={toggleCamera}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#D4AF37] transition-all active:rotate-180 duration-500"
                title="Switch Camera"
              >
                <RefreshCw size={20} />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          {hasPermission === null ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700">
                <Camera className="text-slate-400" size={32} />
              </div>
              
              <h4 className="text-lg font-black text-[#6B1D2F] dark:text-white mb-2">Camera Access</h4>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 px-4">
                Please allow camera access to scan student QR codes.
              </p>
              
              <button 
                onClick={() => startScanner(facingMode)}
                disabled={isStarting}
                className="w-full py-4 bg-[#6B1D2F] text-white rounded-xl font-black text-sm hover:bg-[#5A1827] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isStarting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Camera size={18} />
                    <span className="tracking-widest uppercase">Enable Camera</span>
                  </>
                )}
              </button>
            </div>
          ) : hasPermission === false ? (
            <div className="flex flex-col items-center text-center py-6">
              <AlertCircle className="text-rose-500 mb-4" size={48} />
              <h4 className="text-lg font-black text-rose-600 mb-2">Permission Denied</h4>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 px-6">
                Camera access was denied. Please check your browser settings and try again.
              </p>
              <button 
                onClick={() => setHasPermission(null)}
                className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 aspect-square">
                <div id="qr-reader" className="w-full h-full"></div>
                
                {/* Minimal Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none border-[40px] border-transparent flex items-center justify-center">
                    <div className="w-full h-full border-2 border-[#D4AF37]/30 rounded-xl relative">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#D4AF37]"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#D4AF37]"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#D4AF37]"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#D4AF37]"></div>
                    </div>
                </div>

                {isStarting && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-6">
                {facingMode === 'environment' ? 'Using Back Camera' : 'Using Front Camera'}
              </p>
            </div>
          )}
        </div>

        <style>{`
          #qr-reader video { 
            border-radius: 12px !important; 
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default QRScanner;
