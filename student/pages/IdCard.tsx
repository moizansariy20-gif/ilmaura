
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download01Icon as Download, CreditCardIcon as CreditCard, Shield01Icon as ShieldCheck, UserIcon as User, Loading01Icon as Loader2, AlertCircleIcon as AlertCircle, ArrowLeft01Icon as ArrowLeft } from 'hugeicons-react';
import IDCardRenderer from '../../components/IDCardRenderer.tsx';
import { supabase } from '../../services/supabase.ts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface IdCardPageProps {
  profile: any;
  school: any;
  currentClass?: any;
}

const IdCardPage: React.FC<IdCardPageProps> = ({ profile, school, currentClass }) => {
  const navigate = useNavigate();
  const [issuedData, setIssuedData] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  const isLandscape = school?.idCardConfig?.orientation === 'landscape';
  const cardWidth = isLandscape ? 856 : 540; // Standard ID card size in pixels at 100 DPI
  const cardHeight = isLandscape ? 540 : 856;

  useEffect(() => {
    const fetchIdCard = async () => {
      if (!profile?.studentDocId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('students')
          .select('issued_id_card')
          .eq('id', profile.studentDocId)
          .single();
        if (fetchError) throw fetchError;
        setIssuedData(data?.issued_id_card || null);
      } catch (err: any) {
        console.error("Error fetching ID card:", err);
        setError("Failed to load ID card data.");
      } finally {
        setLoading(false);
      }
    };
    fetchIdCard();
  }, [profile?.studentDocId]);

  const handleDownloadPdf = async () => {
    if (!frontCardRef.current || !backCardRef.current || !issuedData) return;

    setDownloading(true);
    try {
        const options = { 
            scale: 4, 
            useCORS: true, 
            backgroundColor: 'white', 
            logging: false
        };

        const canvasFront = await html2canvas(frontCardRef.current, options);
        const canvasBack = await html2canvas(backCardRef.current, options);
        
        const imgFront = canvasFront.toDataURL('image/jpeg', 0.98);
        const imgBack = canvasBack.toDataURL('image/jpeg', 0.98);

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Standard ID Card Dimensions in mm
        const idWidth = 85.6;
        const idHeight = 54;
        
        // Adjust for orientation
        const finalWidth = isLandscape ? idWidth : idHeight;
        const finalHeight = isLandscape ? idHeight : idWidth;

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Calculate positions to center them on A4
        const x = (pageWidth - finalWidth) / 2;
        const yFront = 40; // Top margin
        const yBack = yFront + finalHeight + 20; // 20mm gap between them

        // Add Front
        pdf.addImage(imgFront, 'JPEG', x, yFront, finalWidth, finalHeight);
        
        // Add Back
        pdf.addImage(imgBack, 'JPEG', x, yBack, finalWidth, finalHeight);
        
        // Add cut lines (optional but helpful for physical cards)
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineDashPattern([2, 2], 0);
        
        // Front cut lines
        pdf.rect(x, yFront, finalWidth, finalHeight);
        // Back cut lines
        pdf.rect(x, yBack, finalWidth, finalHeight);

        pdf.save(`${profile.name.replace(/\s+/g, '_')}_ID_Card.pdf`);

    } catch (err) {
        console.error("PDF Download failed", err);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        setDownloading(false);
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-[#020617] pb-32 font-sans relative overflow-hidden transition-colors duration-300">
      {/* TOP NAV BAR */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-20">
          <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e293b] shadow-sm flex items-center justify-center border border-slate-100 dark:border-[#1e293b] active:scale-90 transition-transform"
          >
              <ArrowLeft size={20} className="text-[#1e3a8a] dark:text-[#D4AF37]" />
          </button>
          <div className="flex items-center gap-3">
              <div className="text-right">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Student</p>
                  <p className="text-sm font-black text-[#1e3a8a] dark:text-white leading-none">{profile?.name || 'User'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] border-2 border-[#D4AF37]/40 shadow-md flex items-center justify-center text-white font-black text-xs overflow-hidden">
                  {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                      profile?.name?.charAt(0) || 'S'
                  )}
              </div>
          </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 mt-4">
        {/* Header Section */}
        <div className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-none shadow-[0_10px_40px_-10px_rgba(30,58,138,0.1)] border-b border-[#D4AF37]/30 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a8a] via-[#D4AF37] to-[#1e3a8a]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-black text-[#1e3a8a] dark:text-[#D4AF37] tracking-tight drop-shadow-sm">My ID Card</h1>
              <div className="flex flex-col mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold tracking-widest uppercase">Student App • Identity</p>
                <p className="text-[11px] md:text-sm text-[#1e3a8a] dark:text-white/80 font-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  Digital Identity
                </p>
              </div>
            </div>
            
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl border-2 border-[#D4AF37]/40 flex items-center justify-center shadow-xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CreditCard size={32} className="text-[#D4AF37] relative z-10" />
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-8">
          <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 md:p-10 border border-[#D4AF37]/20 shadow-xl min-h-[500px] flex flex-col items-center">
            
            <div className="w-full max-w-md mx-auto text-center mb-8">
                <div className="w-16 h-16 bg-[#D4AF37]/10 text-[#1e3a8a] dark:text-[#D4AF37] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/20">
                    <CreditCard size={32} />
                </div>
                <h2 className="text-2xl font-black text-[#1e3a8a] dark:text-white">Student Identity Card</h2>
                <p className="text-[#1e3a8a]/60 dark:text-white/60 text-sm mt-1">Official digital verification for {school?.name || 'School'}</p>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
                    <p className="text-[#1e3a8a]/40 dark:text-white/40 font-bold text-xs uppercase tracking-widest">Fetching your secure ID...</p>
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-black text-[#1e3a8a] dark:text-white">Oops!</h3>
                    <p className="text-[#1e3a8a]/60 dark:text-white/60 text-sm mt-2">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-[#1e3a8a] text-white rounded-xl font-bold text-xs uppercase tracking-widest"
                    >
                        Retry
                    </button>
                </div>
            ) : issuedData ? (
                <div className="flex flex-col gap-8 items-center w-full flex-1 justify-center">
                    {/* Hidden Card Container for PDF Generation (Kept in DOM for html2canvas) */}
                    <div className="fixed -left-[3000px] top-0 pointer-events-none" aria-hidden="true">
                        <div ref={frontCardRef} style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}>
                            <IDCardRenderer school={school} data={issuedData} side="front" />
                        </div>
                        <div className="h-10" />
                        <div ref={backCardRef} style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}>
                            <IDCardRenderer school={school} data={issuedData} side="back" />
                        </div>
                    </div>

                    <div className="text-center max-w-sm animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-[#D4AF37]/10 text-[#1e3a8a] dark:text-[#D4AF37] rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/20 shadow-sm">
                            <ShieldCheck size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-[#1e3a8a] dark:text-white">ID Card Ready</h3>
                        <p className="text-[#1e3a8a]/60 dark:text-white/60 text-sm mt-3 mb-10 leading-relaxed">
                            Your official digital identity card has been verified and is ready. Click below to download your high-quality PDF copy.
                        </p>
                        
                        <button 
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                            className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/20 hover:shadow-blue-900/40 border border-[#D4AF37]/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />} 
                            {downloading ? 'Processing...' : 'Download PDF Card'}
                        </button>

                        <p className="mt-6 text-[10px] font-bold text-[#1e3a8a]/40 dark:text-white/40 uppercase tracking-widest">
                            Format: A4 PDF (Front & Back)
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 w-full max-w-sm border-2 border-dashed border-[#D4AF37]/20 rounded-[3rem] bg-[#FCFBF8] dark:bg-[#0f172a]">
                    <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-6">
                        <User size={48} className="text-[#1e3a8a]/30 dark:text-[#D4AF37]/30" />
                    </div>
                    <h3 className="text-xl font-black text-[#1e3a8a]/40 dark:text-white/40">Card Not Issued</h3>
                    <p className="text-sm text-[#1e3a8a]/40 dark:text-white/40 mt-2 leading-relaxed">
                        Your digital ID card has not been issued by the administration yet. Please contact the Principal's office.
                    </p>
                </div>
            )}

            <div className="mt-auto pt-10 flex items-center gap-2 text-[#1e3a8a]/30 dark:text-white/30 text-xs font-bold uppercase tracking-widest print:hidden">
                <ShieldCheck size={14} /> Verified Student
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdCardPage;
