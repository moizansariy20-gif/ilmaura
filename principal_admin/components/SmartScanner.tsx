import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, XCircle, Scan, SpinnerGap, CheckCircle } from 'phosphor-react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';

// GLOBAL CACHE: Store student face descriptors so we process each photo only once per session.
// This prevents the "system hang" and lag when opening the scanner multiple times.
const FACE_DESCRIPTOR_CACHE: Record<string, faceapi.LabeledFaceDescriptors> = {};
let MODELS_LOADED_GLOBAL = false;

interface SmartScannerProps {
  onScan: (scannedData: string) => void;
  mode: 'qr' | 'face';
  referenceData?: { id: string; photoURL?: string; name: string }[];
}

const SmartScanner: React.FC<SmartScannerProps> = ({ onScan, mode, referenceData }) => {
  const [useCamera, setUseCamera] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  // Face API States
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [faceStatus, setFaceStatus] = useState<string>('Initializing AI...');
  const webcamRef = useRef<Webcam>(null);
  
  // Refs for duplicate prevention
  const lastScannedRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'square'; // 'square' is louder and more piercing like a real scanner
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // Higher pitch (1000Hz)
      
      // Increase volume significantly (from 0.1 to 0.8)
      gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3); // Longer duration (0.3s)

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const handleValidScan = (data: string) => {
    const now = Date.now();
    // Prevent same scan within 3 seconds
    if (data === lastScannedRef.current && now - lastScannedTimeRef.current < 3000) {
      return;
    }
    lastScannedRef.current = data;
    lastScannedTimeRef.current = now;
    playBeep();
    onScan(data);
  };

  // --- Face API Logic ---
  useEffect(() => {
    if (mode === 'face' && useCamera) {
      if (MODELS_LOADED_GLOBAL) {
        setModelsLoaded(true);
        setFaceStatus('AI Ready. Checking Cache...');
        return;
      }

      const loadModels = async () => {
        setFaceStatus('Loading AI Models...');
        try {
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
          ]);
          MODELS_LOADED_GLOBAL = true;
          setModelsLoaded(true);
          setFaceStatus('Models Loaded. Preparing Faces...');
        } catch (error) {
          console.error("Error loading face models:", error);
          setFaceStatus('Failed to load AI models.');
        }
      };
      loadModels();
    }
  }, [mode, useCamera]);

  useEffect(() => {
    if (modelsLoaded && referenceData && referenceData.length > 0) {
      const buildMatcher = async () => {
        setFaceStatus('Processing Student Faces...');
        const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];
        
        // 1. Check which students are already in cache
        const studentsToProcess = referenceData.filter(person => !FACE_DESCRIPTOR_CACHE[person.id]);
        
        // 2. Add already cached students to the list
        referenceData.forEach(person => {
          if (FACE_DESCRIPTOR_CACHE[person.id]) {
            labeledDescriptors.push(FACE_DESCRIPTOR_CACHE[person.id]);
          }
        });

        if (studentsToProcess.length > 0) {
          setFaceStatus(`Learning ${studentsToProcess.length} New Faces...`);
        }

        // 3. Process only new students
        for (const person of studentsToProcess) {
          if (person.photoURL) {
            try {
              const img = await faceapi.fetchImage(person.photoURL);
              const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
              if (detection) {
                const descriptor = new faceapi.LabeledFaceDescriptors(person.id, [detection.descriptor]);
                FACE_DESCRIPTOR_CACHE[person.id] = descriptor; // Store in cache
                labeledDescriptors.push(descriptor);
              }
            } catch (e) {
              console.warn(`Could not load face for ${person.name}`, e);
            }
          }
        }
        
        if (labeledDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
          setFaceStatus('Ready to Scan');
        } else {
          setFaceStatus('No valid photos found.');
        }
      };
      buildMatcher();
    } else if (modelsLoaded && (!referenceData || referenceData.length === 0)) {
      setFaceStatus('No student data provided.');
    }
  }, [modelsLoaded, referenceData]);

  useEffect(() => {
    let interval: any;
    if (mode === 'face' && useCamera && faceMatcher) {
      interval = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          try {
            const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
            if (detection) {
              const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
              if (bestMatch.label !== 'unknown') {
                handleValidScan(bestMatch.label);
              }
            }
          } catch (e) {
            // Ignore detection errors
          }
        }
      }, 1000); // Scan every 1 second
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, useCamera, faceMatcher]);
  // --- End Face API Logic ---

  // Hardware Scanner Logic (Keyboard wedge)
  const [hwBuffer, setHwBuffer] = useState('');
  
  useEffect(() => {
    if (useCamera) return; // Don't listen to keyboard if camera is active

    let barcode = '';
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Enter') {
        if (barcode.length > 0) {
          handleValidScan(barcode);
        }
        barcode = '';
        setHwBuffer('');
      } else if (e.key.length === 1) {
        barcode += e.key;
        setHwBuffer(barcode);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcode = '';
          setHwBuffer('');
        }, 5000); // Increased to 5s to allow manual typing simulation while testing.
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [onScan, useCamera]);

  // Camera Scanner Logic
  useEffect(() => {
    if (useCamera && mode === 'qr') {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          handleValidScan(decodedText);
        },
        (error) => {
          // Ignore scanning errors (happens when no QR is in frame)
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [useCamera, mode, onScan]);

  return (
    <div className="bg-white dark:bg-[#1e293b] p-6 border-2 border-slate-200 dark:border-[#1e293b] shadow-sm flex flex-col items-center">
      <div className="flex gap-4 mb-6">
        {mode === 'qr' && (
          <button
            onClick={() => setUseCamera(false)}
            className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-xs transition-all border-2 ${!useCamera ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-slate-300 hover:border-[#1e3a8a]'}`}
          >
            <Keyboard size={20} weight={!useCamera ? 'fill' : 'regular'} />
            Hardware Scanner
          </button>
        )}
        <button
          onClick={() => setUseCamera(true)}
          className={`flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-xs transition-all border-2 ${useCamera ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-slate-300 hover:border-[#1e3a8a]'}`}
        >
          {mode === 'face' ? <Scan size={20} weight={useCamera ? 'fill' : 'regular'} /> : <Camera size={20} weight={useCamera ? 'fill' : 'regular'} />}
          {mode === 'face' ? 'Face Scanner' : 'Device Camera'}
        </button>
      </div>

      {useCamera ? (
        <div className="w-full max-w-md mx-auto">
          <style>{`
            #reader video {
              width: 100% !important;
              height: auto !important;
              object-fit: cover !important;
              border-radius: 0.5rem !important;
            }
            #reader {
              border: none !important;
              background: transparent !important;
            }
            #reader__dashboard_section_csr span {
              display: none !important;
            }
            #reader__dashboard_section_csr button {
              background-color: #1e3a8a !important;
              color: white !important;
              border: none !important;
              padding: 0.5rem 1rem !important;
              border-radius: 0.25rem !important;
              font-weight: bold !important;
              cursor: pointer !important;
              margin-top: 0.5rem !important;
            }
          `}</style>
          {mode === 'qr' ? (
            <div className="bg-white dark:bg-[#1e293b] p-2 rounded-xl border-4 border-slate-200 dark:border-[#1e293b] shadow-sm">
              <div id="reader" className="w-full overflow-hidden rounded-lg bg-slate-100"></div>
              <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-4 mb-2">
                Point camera at QR/Barcode
              </p>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden rounded-xl border-4 border-slate-200 dark:border-[#1e293b] bg-slate-100 aspect-square md:aspect-video flex flex-col items-center justify-center shadow-sm">
              <Webcam 
                ref={webcamRef}
                audio={false}
                className="absolute inset-0 w-full h-full object-cover"
                mirrored={true}
              />
              
              {/* Simple Status Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-[#1e293b] px-4 py-2 border-2 border-slate-200 dark:border-[#1e293b] flex items-center gap-2 shadow-sm">
                {faceStatus === 'Ready to Scan' ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{faceStatus}</span>
                  </>
                ) : (
                  <>
                    <SpinnerGap size={16} className="animate-spin text-blue-600" weight="bold" />
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{faceStatus}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 w-full max-w-md bg-slate-50 dark:bg-[#0f172a]">
          <Keyboard size={48} weight="duotone" className="text-slate-400 mb-4" />
          <p className="text-center text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
            Ready for Hardware Scanner
          </p>
          <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">
            Scan any ID card now...
          </p>
          
          {hwBuffer && (
            <div className="mt-6 p-3 bg-white dark:bg-slate-700 border-2 border-slate-900 shadow-[4px_4px_0px_#1e3a8a] animate-bounce">
              <p className="text-[10px] font-black uppercase text-[#1e3a8a] dark:text-blue-400 mb-1">Typing/Scanning...</p>
              <p className="text-lg font-mono font-black tracking-widest">{hwBuffer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartScanner;
