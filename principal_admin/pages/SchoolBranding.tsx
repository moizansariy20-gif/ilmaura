
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Carousel } from '@/components/Carousel.tsx';
import { 
    FloppyDisk, ShieldCheck, Buildings, CheckCircle, 
    CircleNotch, IdentificationCard, ArrowsLeftRight, Sliders, MagicWand, LockKey, Image,
    TextT, PaintBucket, Plus, Trash, Cardholder, ArrowsClockwise, PenNib, CornersOut, Camera, UploadSimple,
    FileText, SelectionPlus, Sparkle, SelectionAll, WarningCircle, Minus, QrCode, Barcode
} from 'phosphor-react';
import { GoogleGenAI, Type } from "@google/genai";
import { updateSchoolBranding, uploadFileToStorage } from '../../services/api.ts';
// import ImageStudio from '../../components/ImageStudio.tsx';
import { School as SchoolType, IDCardConfig } from '../../types.ts';
import imageCompression from 'browser-image-compression';
import StudentChallanView from '../../student/components/StudentChallanView.tsx';
import IDCardRenderer from '../../components/IDCardRenderer.tsx';
import FeeChallan from '../components/FeeChallan.tsx';

interface SchoolBrandingProps {
  school: SchoolType;
  view?: 'general' | 'challan' | 'id_card';
}

// --- HELPER: ROBUST SVG ENCODING (URL ENCODED) ---
const svgToDataUrl = (svgString: string) => {
    const encoded = encodeURIComponent(svgString)
        .replace(/'/g, '%27')
        .replace(/"/g, '%22')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');
    return `data:image/svg+xml,${encoded}`;
};

const PORTRAIT_WIDTH = 350; 
const PORTRAIT_HEIGHT = 555;
const LANDSCAPE_WIDTH = 555;
const LANDSCAPE_HEIGHT = 350;

// CURATED FONT OPTIONS
const FONT_OPTIONS = [
    { label: 'Standard (Inter)', value: 'Inter, sans-serif' },
    { label: 'Modern Bold (Montserrat)', value: '"Montserrat", sans-serif' },
    { label: 'Official Serif (Roboto Slab)', value: '"Roboto Slab", serif' },
    { label: 'Tall & Bold (Oswald)', value: '"Oswald", sans-serif' },
    { label: 'Elegant (Playfair)', value: '"Playfair Display", serif' },
    { label: 'Royal (Cinzel)', value: '"Cinzel", serif' },
    { label: 'Handwritten (Dancing)', value: '"Dancing Script", cursive' },
    { label: 'Signature (Great Vibes)', value: '"Great Vibes", cursive' },
    { label: 'Fun & Bubbly (Pacifico)', value: '"Pacifico", cursive' },
    { label: 'Tech / Sci-Fi (Orbitron)', value: '"Orbitron", sans-serif' },
    { label: 'Impact (Bebas Neue)', value: '"Bebas Neue", sans-serif' },
    { label: 'Newspaper (Merriweather)', value: '"Merriweather", serif' },
    { label: 'Stylish (Righteous)', value: '"Righteous", cursive' },
    { label: 'Pakistani Pen (Kalam)', value: '"Kalam", cursive' },
    { label: 'Flowy Pen (Caveat)', value: '"Caveat", cursive' },
    { label: 'Ballpoint (Nanum Pen)', value: '"Nanum Pen Script", cursive' },
];

// Smart Defaults for Academic Prestige Layout (to prevent random placement)
const PRESTIGE_FIELD_DEFAULTS: Record<string, any> = {
    'label_name': { x: 31, y: 38, fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'left', label: 'NAME:', fontFamily: '"Oswald", sans-serif' },
    'label_father': { x: 31, y: 48, fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'left', label: 'FATHER NAME:', fontFamily: '"Oswald", sans-serif' },
    'label_class': { x: 31, y: 58, fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'left', label: 'CLASS:', fontFamily: '"Oswald", sans-serif' },
    'label_roll': { x: 31, y: 68, fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'left', label: 'ROLL NO:', fontFamily: '"Oswald", sans-serif' },
    'label_phone': { x: 31, y: 78, fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'left', label: 'PHONE:', fontFamily: '"Oswald", sans-serif' },
    'label_address': { x: 31, y: 88, fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'left', label: 'ADDRESS:', fontFamily: '"Oswald", sans-serif' },
    
    'name': { x: 48, y: 38, fontSize: 15, fontWeight: 'bold', color: '#000000', textAlign: 'left', fontFamily: '"Inter", sans-serif' },
    'fatherName': { x: 48, y: 48, fontSize: 14, fontWeight: 'bold', color: '#000000', textAlign: 'left', fontFamily: '"Inter", sans-serif' },
    'class': { x: 48, y: 58, fontSize: 14, fontWeight: 'bold', color: '#000000', textAlign: 'left', fontFamily: '"Inter", sans-serif' },
    'rollNo': { x: 48, y: 68, fontSize: 14, fontWeight: 'bold', color: '#000000', textAlign: 'left', fontFamily: '"Inter", sans-serif' },
    'phone': { x: 48, y: 78, fontSize: 14, fontWeight: 'bold', color: '#000000', textAlign: 'left', fontFamily: '"Inter", sans-serif' },
    'address_student': { x: 48, y: 88, fontSize: 12, fontWeight: 'normal', color: '#333333', textAlign: 'left', fontFamily: '"Inter", sans-serif' },
    'barcode': { x: 80, y: 85, width: 25, height: 10, type: 'image' },
    'qr_code': { x: 85, y: 50, width: 15, height: 15, type: 'image' }
};

const DEFAULT_ID_CONFIG: IDCardConfig = {
    templateUrl: '',
    backTemplateUrl: '',
    orientation: 'portrait',
    elements: {}, 
    backElements: {} 
};

// --- VERTICAL TEMPLATES (350x550) - REMOVED WHITE BACKGROUNDS FOR OVERLAY ---
const PRESET_TEMPLATES = [
    {
        id: 'default_modern',
        name: 'Default Modern',
        orientation: 'landscape',
        front: 'https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/1.png',
        back: 'https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/2.png',
        previewColor: 'bg-blue-100 border-blue-300',
        description: 'Default Template',
        layout: {
            front: {
                'schoolLogo': { x: 10.9, y: 15.7, width: 16, height: 25, type: 'image', visible: true, label: 'School Logo', borderRadius: 50 },
                'photo': { x: 16.36, y: 54.28, width: 22, height: 43, type: 'image', visible: true, borderRadius: 2 },
                'schoolName': { x: 21.8, y: 10, fontSize: 26, fontWeight: '900', color: '#FFFFFF', visible: true, textAlign: 'left', label: 'SCHOOL NAME', fontFamily: '"Cinzel", serif' },
                'address': { x: 21.8, y: 15.7, fontSize: 11, fontWeight: 'bold', color: '#FCD34D', visible: true, textAlign: 'left', label: 'Address Line', fontFamily: '"Montserrat", sans-serif' },
                ...PRESTIGE_FIELD_DEFAULTS
            },
            back: {
                 'logo': { x: 75, y: 65, width: 27, height: 43, visible: true, type: 'image', opacity: 0.1, rotation: -15 }
            }
        }
    }
];



const AutoFitText = ({ text, fontSize, fontFamily, color, fontWeight, letterSpacing }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current && textRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const textWidth = textRef.current.scrollWidth;
                if (textWidth > containerWidth && containerWidth > 0) {
                    setScale(containerWidth / textWidth);
                } else {
                    setScale(1);
                }
            }
        };
        
        updateScale();
        const observer = new ResizeObserver(updateScale);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [text, fontSize, fontFamily, letterSpacing]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center overflow-hidden">
            <span
                ref={textRef}
                style={{
                    fontSize: `${fontSize}px`,
                    fontFamily,
                    color,
                    fontWeight,
                    letterSpacing: letterSpacing ? `${letterSpacing}px` : 'normal',
                    transform: `scale(${scale})`,
                    transformOrigin: 'left center',
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                }}
            >
                {text}
            </span>
        </div>
    );
};

const SchoolBranding: React.FC<SchoolBrandingProps> = ({ school, view: initialView = 'general' }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'challan' | 'id_card'>(initialView as any);
  const [name, setName] = useState(school.name || '');
  const [logoURL, setLogoURL] = useState(school.logoURL || '');
  const [bannerURLs, setBannerURLs] = useState<string[]>(school.bannerURLs || []);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [themeColor, setThemeColor] = useState(school.themeColor || '#2563eb');
  const [address, setAddress] = useState(school.address || '');
  const [phone, setPhone] = useState(school.phone || '');
  const [email, setEmail] = useState(school.email || '');

  const AVAILABLE_FIELDS = useMemo(() => {
      const baseFields = [
          { id: 'photo', label: 'Image: Student Photo' },
          { id: 'schoolName', label: 'Header: School Name' }, 
          { id: 'address', label: 'Header: School Address' },
          { id: 'schoolLogo', label: 'Image: School Logo' }, 
          { id: 'signature', label: 'Image: Signature' }, 
          { id: 'qr_code', label: 'Image: QR Code' },
          { id: 'barcode', label: 'Image: Barcode' },
          { id: 'custom_text', label: 'Static Text (Custom)' }, 
      ];
      
      const formFields = school.admissionFormConfig || [];
      const generatedFields = formFields.filter(f => f.enabled).flatMap(f => [
          { id: `label_${f.id}`, label: `Heading: ${f.label}` },
          { id: f.id, label: `Value: ${f.label}` }
      ]);
      
      // Keep legacy fields as fallback if formFields is empty
      if (generatedFields.length === 0) {
          return [
              ...baseFields,
              { id: 'name', label: 'Value: Student Name' },
              { id: 'label_name', label: 'Heading: Name' },
              { id: 'fatherName', label: 'Value: Father Name' },
              { id: 'label_father', label: 'Heading: Father' },
              { id: 'class', label: 'Value: Class / Grade' },
              { id: 'label_class', label: 'Heading: Class' },
              { id: 'rollNo', label: 'Value: Roll Number' },
              { id: 'label_roll', label: 'Heading: Roll No' },
              { id: 'dob', label: 'Value: Date of Birth' },
              { id: 'phone', label: 'Value: Mobile Number' },
              { id: 'label_phone', label: 'Heading: Phone' },
              { id: 'address', label: 'Value: Address' },
              { id: 'label_address', label: 'Heading: Address' },
              { id: 'bloodGroup', label: 'Value: Blood Group' }
          ];
      }
      
      return [...baseFields, ...generatedFields];
  }, [school.admissionFormConfig]);

  
  const [masterTemplate, setMasterTemplate] = useState(school.feeConfig?.masterTemplate || {
    theme: 'classic', primaryColor: '#001D4D', secondaryColor: '#003366', bankDetails: '',
    accountNo: '', accountTitle: '', branchName: '', signatureURL: '', stampURL: '',
    month: '', issueDate: '', dueDate: '', validDate: '', lateFine: 0, mobileDetails: '',
    dynamicFeeItems: []
  });

  const [idConfig, setIdConfig] = useState<IDCardConfig>(() => {
      const initial = school.idCardConfig || DEFAULT_ID_CONFIG;
      return {
          ...initial,
          orientation: initial.orientation || 'portrait',
          elements: initial.elements || {},
          backElements: initial.backElements || {}
      };
  });
  
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(null);
  
  // Panning State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  
  const [saving, setSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [imageTarget, setImageTarget] = useState<'logo' | 'banner' | 'signature' | 'stamp' | 'card_signature' | 'photo_preview' | 'id_card_front_bg' | 'id_card_back_bg' | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const targetScrollRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
      const container = canvasContainerRef.current;
      if (!container) return;

      const handleWheel = (e: WheelEvent) => {
          if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              // Zoom via scroll is disabled as per user request
          }
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
      // Only allow dragging if we are not clicking on a draggable element
      if ((e.target as HTMLElement).closest('[draggable="true"]')) return;
      
      // Prevent browser default drag behavior
      e.preventDefault();
      
      if (canvasContainerRef.current) {
          setIsDragging(true);
          setDragStart({ x: e.clientX, y: e.clientY });
          setScrollStart({ 
              x: canvasContainerRef.current.scrollLeft, 
              y: canvasContainerRef.current.scrollTop 
          });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !canvasContainerRef.current) return;
      e.preventDefault();
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      canvasContainerRef.current.scrollLeft = scrollStart.x - dx;
      canvasContainerRef.current.scrollTop = scrollStart.y - dy;
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  useEffect(() => {
    if (school) {
      setName(school.name || '');
      setLogoURL(school.logoURL || '');
      setBannerURLs(school.bannerURLs || []);
      setThemeColor(school.themeColor || '#2563eb');
      setAddress(school.address || '');
      setPhone(school.phone || '');
      setEmail(school.email || '');
      setMasterTemplate(school.feeConfig?.masterTemplate || {
        theme: 'classic', primaryColor: '#001D4D', secondaryColor: '#003366', bankDetails: '',
        accountNo: '', accountTitle: '', branchName: '', signatureURL: '', stampURL: '',
        month: '', issueDate: '', dueDate: '', validDate: '', lateFine: 0, mobileDetails: '',
        dynamicFeeItems: []
      });
      if (school.idCardConfig) {
          setIdConfig({
              ...school.idCardConfig,
              orientation: school.idCardConfig.orientation || 'portrait',
              elements: school.idCardConfig.elements || {},
              backElements: school.idCardConfig.backElements || {}
          });
      }
    }
  }, [school]);

  const handleApplyPreset = (template: any) => {
      setIdConfig(prev => {
          let newConfig = {
              ...prev,
              templateUrl: template.front,
              backTemplateUrl: template.back,
              orientation: template.orientation || 'portrait'
          };
          if (template.layout) {
              // AUTO LOGO & PHOTO LOGIC
              let frontLayout = template.layout.front || prev.elements;
              
              // Ensure Photo field exists if it was missed in the template def
              if (!frontLayout['photo']) {
                 frontLayout = { ...frontLayout, 'photo': { x: 50, y: 50, width: 30, height: 30, type: 'image', visible: true } };
              }

              // Ensure School Logo field exists and is visible if not in template def
              if (!frontLayout['schoolLogo']) {
                 // Try to place it at top left by default if missing
                 frontLayout = { ...frontLayout, 'schoolLogo': { x: 10, y: 10, width: 15, height: 10, type: 'image', visible: true } };
              }

              newConfig = {
                  ...newConfig,
                  elements: frontLayout,
                  backElements: template.layout.back || prev.backElements
              };
          }
          return newConfig;
      });
      setCurrentSide('front'); 
  };

  const handleOrientationToggle = (orient: 'portrait' | 'landscape') => {
      setIdConfig(prev => ({ ...prev, orientation: orient }));
  };

  // --- ELEMENT MANIPULATION ---
  const handleUpdateElement = (key: string, updates: any) => {
      setIdConfig(prev => {
          const targetElements = currentSide === 'front' ? prev.elements : prev.backElements;
          const updatedElements = {
              ...targetElements,
              [key]: { ...(targetElements?.[key] || {}), ...updates }
          };
          
          return {
              ...prev,
              [currentSide === 'front' ? 'elements' : 'backElements']: updatedElements
          };
      });
  };

  const toggleFieldVisibility = (fieldId: string) => {
      const targetElements = currentSide === 'front' ? idConfig.elements : idConfig.backElements;
      
      // Special logic for generic 'custom_text' fields: generate unique key
      let keyToUse = fieldId;
      if (fieldId === 'custom_text') {
         const existingCustoms = Object.keys(targetElements).filter(k => k.startsWith('custom_text')).length;
         keyToUse = `custom_text_${existingCustoms + 1}`;
      }

      const currentEl = targetElements?.[keyToUse];
      
      if (!currentEl) {
          // Initialize if not exists
          // Check for smart defaults from Academic Prestige if available, else standard center
          const defaultConfig = PRESTIGE_FIELD_DEFAULTS[fieldId] || {
              x: 50, y: 50, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Inter, sans-serif'
          };

          handleUpdateElement(keyToUse, {
              visible: true,
              type: (fieldId === 'photo' || fieldId === 'signature' || fieldId === 'schoolLogo' || fieldId === 'qr_code' || fieldId === 'barcode') ? 'image' : 'text',
              label: AVAILABLE_FIELDS.find(f => f.id === fieldId)?.label?.replace('Value: ', '').replace('Heading: ', '').replace('Header: ', '').replace('Image: ', ''),
              ...defaultConfig // Spread smart defaults
          });
          setSelectedElementKey(keyToUse);
      } else {
          if (!currentEl.visible) {
              // If hidden, make visible and select it
              handleUpdateElement(keyToUse, { visible: true });
              setSelectedElementKey(keyToUse);
          } else {
              // If already visible
              if (selectedElementKey !== keyToUse) {
                  // Just select it
                  setSelectedElementKey(keyToUse);
              } else {
                  // If already selected, then toggle off (hide)
                  handleUpdateElement(keyToUse, { visible: false });
                  setSelectedElementKey(null);
              }
          }
      }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSchoolBranding(school.id, { 
          name, logoURL, bannerURLs, themeColor, address, phone, email,
          feeConfig: { ...school.feeConfig, masterTemplate },
          idCardConfig: { ...idConfig }
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedFile = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 2000 });
      const reader = new FileReader();
      reader.onload = () => {
          const result = reader.result as string;
          // Bypass missing cropper and directly confirm
          handleCropConfirm(result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) { console.error(error); } 
    if (e.target) e.target.value = '';
  };
  
  // Helper to convert base64 to File
  const base64ToFile = (base64String: string, filename: string): File => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCropConfirm = async (cropped: string) => {
    setIsUploadingImage(true);
    if (imageTarget === 'logo') {
        try {
            const file = base64ToFile(cropped, `logo_${Date.now()}.png`);
            const { publicUrl } = await uploadFileToStorage(file, `school_logos/${school.id}_${Date.now()}.png`);
            setLogoURL(publicUrl);
        } catch (e) {
            console.error("Failed to upload logo to storage", e);
            setLogoURL(cropped); // Fallback
        }
    }
    else if (imageTarget === 'banner') {
        try {
            const file = base64ToFile(cropped, `banner_${Date.now()}.png`);
            const { publicUrl } = await uploadFileToStorage(file, `school_banners/${school.id}_${Date.now()}.png`);
            setBannerURLs(prev => [...prev, publicUrl]);
        } catch (e) {
            console.error("Failed to upload banner to storage", e);
            setBannerURLs(prev => [...prev, cropped]); // Fallback
        }
    }
    else if (imageTarget === 'card_signature' || imageTarget === 'signature') {
        setMasterTemplate(p => ({ ...p, signatureURL: cropped }));
    }
    else if (imageTarget === 'id_card_front_bg') {
        setIdConfig(prev => ({ ...prev, templateUrl: cropped }));
    }
    else if (imageTarget === 'id_card_back_bg') {
        setIdConfig(prev => ({ ...prev, backTemplateUrl: cropped }));
    }
    else if (imageTarget === 'photo_preview') {
         setPreviewPhotoUrl(cropped);
    }
    else if (imageTarget) setMasterTemplate(p => ({ ...p, [`${imageTarget}URL`]: cropped }));
    
    setImageToCrop(null);
    setIsUploadingImage(false);
  };
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setMasterTemplate(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  // Helper Variables
  const activeElements = currentSide === 'front' ? (idConfig.elements || {}) : (idConfig.backElements || {});
  const currentBgUrl = currentSide === 'front' ? idConfig.templateUrl : idConfig.backTemplateUrl;
  const activeElConfig = selectedElementKey ? activeElements[selectedElementKey] : null;
  const isLandscape = idConfig.orientation === 'landscape';

  const previewChallanData = {
    ...masterTemplate,
    schoolName: name, 
    month: 'August 2024',
    issueDate: '01-08-2024',
    dueDate: '10-08-2024',
    validDate: '30-08-2024',
    lateFine: 200,
    studentName: 'SAMPLE STUDENT',
    studentClass: 'Grade 10-A',
    studentRoll: '101',
    regNo: 'REG-2024-001',
    arrears: 500,
    tax: 0,
    discount: 0,
    totalCurrent: 5500,
    totalPayable: 6000,
    receiptNo: 'CH-12345',
    phone: '0300-1234567',
    dynamicFeeItems: [
        { id: '1', label: 'Tuition Fee', amount: 4500 },
        { id: '2', label: 'Lab Charges', amount: 1000 }
    ]
  };

  // Mapped student object for ID Card Preview (Using existing components logic)
  const previewStudent = {
      id: "STUDENT-2024-101",
      name: "AHMAD ABDULLAH",
      studentName: "AHMAD ABDULLAH",
      rollNo: "2024-101",
      regNo: "2024-101",
      className: "CLASS 8-A",
      classId: "CLASS 8-A", // Fallback
      fatherName: "MUHAMMAD ABDULLAH",
      guardianName: "MUHAMMAD ABDULLAH",
      phone: "0300-1234567",
      guardianPhone: "0300-1234567",
      dob: "12-AUG-2010",
      address: "123 School Street, City",
      bloodGroup: "O+",
      photoURL: null // Let renderer handle default
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white animate-in fade-in duration-300 pb-20 bg-slate-100 min-h-screen p-4 md:p-6">
      {/* Image Studio Modal Removed */}
      
      <div className="w-full max-w-[1920px] mx-auto bg-white dark:bg-slate-800 border-2 border-slate-300 shadow-sm flex flex-col min-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">
                    Design Center
                </h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="bg-white dark:bg-slate-800 text-[#1e3a8a] px-3 py-1 text-xs font-black uppercase tracking-wider border border-slate-900">
                        {activeTab === 'general' ? 'General Branding' : activeTab === 'challan' ? 'Challan Design' : 'ID Card Studio'}
                     </span>
                </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-emerald-600 text-white border-2 border-emerald-700 font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 rounded-none disabled:opacity-50 shadow-sm">
                {saving ? <CircleNotch className="animate-spin" size={18} weight="bold"/> : <FloppyDisk size={18} weight="fill"/>} Save Changes
            </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700 flex overflow-x-auto">
            <button 
                onClick={() => setActiveTab('general')}
                className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-r-2 border-slate-200 flex items-center gap-2 ${activeTab === 'general' ? 'bg-white dark:bg-slate-800 text-[#1e3a8a] border-b-4 border-b-[#1e3a8a]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}
            >
                <Buildings size={16} weight="bold" /> General Branding
            </button>
            <button 
                onClick={() => setActiveTab('challan' as any)}
                className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-r-2 border-slate-200 flex items-center gap-2 ${activeTab === ('challan' as any) ? 'bg-white dark:bg-slate-800 text-[#1e3a8a] border-b-4 border-b-[#1e3a8a]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}
            >
                <Sliders size={16} weight="bold" /> Challan Design
            </button>
            <button 
                onClick={() => setActiveTab('id_card' as any)}
                className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-r-2 border-slate-200 flex items-center gap-2 ${activeTab === ('id_card' as any) ? 'bg-white dark:bg-slate-800 text-[#1e3a8a] border-b-4 border-b-[#1e3a8a]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}
            >
                <IdentificationCard size={16} weight="bold" /> ID Card Studio
            </button>
            <button 
                onClick={() => setActiveTab('banner' as any)}
                className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === ('banner' as any) ? 'bg-white dark:bg-slate-800 text-[#1e3a8a] border-b-4 border-b-[#1e3a8a]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}
            >
                <Image size={16} weight="bold" /> School Banners
            </button>
        </div>

        <div className="p-8 bg-white dark:bg-slate-800">
            {showSuccess && <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 flex items-center gap-2 font-bold uppercase tracking-wide text-xs"><CheckCircle size={18} weight="fill"/> Changes Saved Successfully</div>}

            {/* --- GENERAL SETTINGS --- */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 p-8">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                            <Buildings size={24} weight="fill" className="text-[#1e3a8a]"/> Institute Identity
                        </h3>
                        <div className="space-y-6">
                            <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Institute Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-[#1e3a8a] outline-none font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 rounded-none transition-colors text-sm" placeholder="Enter Name"/></div>
                            <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">School Address</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-[#1e3a8a] outline-none font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 rounded-none transition-colors text-sm" placeholder="Enter School Address"/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Phone Number</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-[#1e3a8a] outline-none font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 rounded-none transition-colors text-sm" placeholder="Enter Phone Number"/></div>
                                <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 focus:border-[#1e3a8a] outline-none font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400 rounded-none transition-colors text-sm" placeholder="Enter Email Address"/></div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Official Logo</label>
                                <div className="flex items-center gap-6 mt-2 p-6 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 group hover:border-[#1e3a8a] transition-all cursor-pointer relative" onClick={() => { if (!isUploadingImage) { setImageTarget('logo'); fileInputRef.current?.click(); } }}>
                                    <div className="w-24 h-24 bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative">
                                        {isUploadingImage && imageTarget === 'logo' ? (
                                            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-10">
                                                <CircleNotch className="animate-spin text-[#1e3a8a]" size={24} />
                                            </div>
                                        ) : null}
                                        {logoURL ? <img src={logoURL} className="w-full h-full object-contain" alt="Logo" /> : <Buildings className="text-slate-300" size={40} weight="duotone"/>}
                                    </div>
                                    <div>
                                        <button disabled={isUploadingImage} className="px-6 py-2 bg-[#1e3a8a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#172554] rounded-none disabled:opacity-50">
                                            {isUploadingImage && imageTarget === 'logo' ? 'Uploading...' : 'Upload'}
                                        </button>
                                        <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wide">PNG / JPG Recommended</p>
                                    </div>
                                </div>
                            </div>

                            {/* Added Digital Signature Upload Section */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Digital Signature (Principal)</label>
                                <div className="flex items-center gap-6 mt-2 p-6 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 group hover:border-[#1e3a8a] transition-all cursor-pointer" onClick={() => { setImageTarget('signature'); fileInputRef.current?.click(); }}>
                                    <div className="w-32 h-16 bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                                        {masterTemplate.signatureURL ? <img src={masterTemplate.signatureURL} className="w-full h-full object-contain" alt="Signature" /> : <PenNib className="text-slate-300" size={32} weight="duotone"/>}
                                    </div>
                                    <div><button className="px-6 py-2 bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 rounded-none">Upload Signature</button><p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Transparent PNG Recommended</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CHALLAN VIEW --- */}
            {activeTab === 'challan' && (
                 <div className="grid grid-cols-1 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="font-black text-lg mb-6 uppercase tracking-tight flex items-center gap-2"><Sliders size={20} weight="fill" className="text-indigo-600"/> Challan Configuration & Preview</h3>
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Challan Colors</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Primary Color</label><div className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-2"><input type="color" name="primaryColor" value={masterTemplate.primaryColor} onChange={handleTemplateChange} className="w-6 h-6 border-none cursor-pointer bg-transparent p-0"/><span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">{masterTemplate.primaryColor}</span></div></div>
                                        <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Secondary Color</label><div className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-2"><input type="color" name="secondaryColor" value={masterTemplate.secondaryColor} onChange={handleTemplateChange} className="w-6 h-6 border-none cursor-pointer bg-transparent p-0"/><span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">{masterTemplate.secondaryColor || '#003366'}</span></div></div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Bank Information</label>
                                    <div className="space-y-3">
                                        <input type="text" name="bankDetails" value={masterTemplate.bankDetails} onChange={handleTemplateChange} placeholder="Bank Name" className="w-full p-2 text-xs border-2 border-slate-200 dark:border-slate-700 font-bold"/>
                                        <input type="text" name="accountTitle" value={masterTemplate.accountTitle} onChange={handleTemplateChange} placeholder="Account Title" className="w-full p-2 text-xs border-2 border-slate-200 dark:border-slate-700 font-bold"/>
                                        <input type="text" name="accountNo" value={masterTemplate.accountNo} onChange={handleTemplateChange} placeholder="Account Number" className="w-full p-2 text-xs border-2 border-slate-200 dark:border-slate-700 font-bold"/>
                                        <input type="text" name="branchName" value={masterTemplate.branchName} onChange={handleTemplateChange} placeholder="Branch Name" className="w-full p-2 text-xs border-2 border-slate-200 dark:border-slate-700 font-bold"/>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="border-4 border-slate-800 bg-slate-200 p-4 flex justify-center overflow-auto shadow-inner min-h-[600px] items-start">
                                     <div className="scale-[0.6] sm:scale-[0.7] lg:scale-[0.85] xl:scale-100 origin-top transform-gpu bg-white dark:bg-slate-800 shadow-2xl"> 
                                        <FeeChallan 
                                            singleCopy={true}
                                            student={{
                                                ...previewStudent,
                                                className: previewStudent.className
                                            } as any} 
                                            school={{
                                                ...school,
                                                name: name,
                                                logoURL: logoURL,
                                                address: address,
                                                phone: phone,
                                                feeConfig: {
                                                    ...school.feeConfig,
                                                    masterTemplate: masterTemplate
                                                }
                                            }} 
                                            transaction={{
                                                receiptNo: 'CH-12345',
                                                amountPaid: 0,
                                                amount: 5500,
                                                status: 'Pending',
                                                dueDate: '10-08-2024',
                                                month: 'August 2024',
                                                timestamp: { toDate: () => new Date() } as any
                                            }}
                                        />
                                    </div>
                                </div>
                                <p className="text-center text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Preview of 3-Copy Professional Challan</p>
                            </div>
                         </div>
                    </div>
                </div>
            )}

            {/* --- BANNER MANAGEMENT --- */}
            {activeTab === ('banner' as any) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 p-8">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                            <Image size={24} weight="fill" className="text-[#1e3a8a]"/> School Banner Management
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold uppercase tracking-wide leading-relaxed">
                            Upload a custom banner or poster (e.g., Admission Open, Annual Sports, Events) to be displayed on the dashboard of Principal, Teacher, and Student apps. If no banner is uploaded, the default school branding will be shown.
                        </p>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Upload New Banner Poster</label>
                                <div 
                                    className="flex flex-col items-center justify-center gap-4 mt-2 p-8 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 group hover:border-[#1e3a8a] transition-all cursor-pointer relative min-h-[150px]" 
                                    onClick={() => { if (!isUploadingImage) { setImageTarget('banner'); fileInputRef.current?.click(); } }}
                                >
                                    {isUploadingImage && imageTarget === 'banner' ? (
                                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-10">
                                            <CircleNotch className="animate-spin text-[#1e3a8a]" size={32} />
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <Plus className="text-slate-300" size={24} weight="bold"/>
                                            </div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Add New Banner</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {bannerURLs.length > 0 && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Current Banners ({bannerURLs.length})</label>
                                    <div className="grid grid-cols-1 gap-4">
                                        {bannerURLs.map((url, idx) => (
                                            <div key={idx} className="relative group/banner border-2 border-slate-200 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                                                <img src={url} className="w-full h-auto max-h-[200px] object-contain" alt={`Banner ${idx + 1}`} />
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setBannerURLs(prev => prev.filter((_, i) => i !== idx)); 
                                                        }}
                                                        className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                                                        title="Remove Banner"
                                                    >
                                                        <Trash size={16} weight="bold" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 p-8">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                            <MagicWand size={24} weight="fill" className="text-[#1e3a8a]"/> Live Preview
                        </h3>
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">How it will look on Dashboards:</p>
                            
                            <div className="w-full aspect-video bg-slate-200 rounded-xl overflow-hidden shadow-inner border-4 border-slate-800 flex items-center justify-center relative">
                                {bannerURLs.length > 0 ? (
                                    <div className="w-full h-full">
                                        <Carousel images={bannerURLs} className="w-full h-full" currentIndex={bannerIndex} setCurrentIndex={setBannerIndex} showArrows={true} />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] flex items-center justify-center p-6">
                                        <div className="text-center text-white">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-[#D4AF37]">
                                                <Buildings size={20} className="text-[#D4AF37]" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-1">Default School Branding</p>
                                            <h4 className="text-lg font-black uppercase tracking-tight">{name || 'Your School Name'}</h4>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide text-center">Aspect ratio may vary based on device screen size</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ID CARD STUDIO --- */}
            {activeTab === ('id_card' as any) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Controls & Editor */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* 1. View Control */}
                        <div className="flex bg-slate-100 p-1 border-2 border-slate-200 dark:border-slate-700">
                             <button onClick={() => { setCurrentSide('front'); setSelectedElementKey(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${currentSide === 'front' ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-white'}`}>Front View</button>
                             <button onClick={() => { setCurrentSide('back'); setSelectedElementKey(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${currentSide === 'back' ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-white'}`}>Back View</button>
                        </div>

                        {/* 2. Orientation Toggle */}
                         <div className="flex bg-slate-100 p-1 border-2 border-slate-200 dark:border-slate-700">
                             <button onClick={() => handleOrientationToggle('portrait')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${!isLandscape ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-white'}`}><IdentificationCard size={16} className="inline mr-2"/> Portrait</button>
                             <button onClick={() => handleOrientationToggle('landscape')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${isLandscape ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-white'}`}><Cardholder size={16} className="inline mr-2"/> Landscape</button>
                        </div>

                        {/* 3. Select Template & Custom Background */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-black text-lg mb-4 uppercase tracking-tight flex items-center gap-2">
                                <MagicWand size={20} weight="fill" className="text-amber-500"/> Background Design
                            </h3>
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                {PRESET_TEMPLATES.map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => handleApplyPreset(t)}
                                        className={`h-16 rounded-lg overflow-hidden border-2 transition-all shadow-sm flex items-center justify-center hover:border-[#1e3a8a] ${t.previewColor} w-full`}
                                        title={t.name}
                                    >
                                        <div className="text-center">
                                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase px-1 block">{t.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                                <button 
                                    onClick={() => {
                                        setImageTarget(currentSide === 'front' ? 'id_card_front_bg' : 'id_card_back_bg');
                                        fileInputRef.current?.click();
                                    }}
                                    className="w-full py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 flex items-center justify-center gap-2 rounded-md"
                                >
                                    <UploadSimple size={16} /> Upload Custom {currentSide === 'front' ? 'Front' : 'Back'} Background
                                </button>
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-2 text-center uppercase">Recommended Size: 540x856 px (Portrait)</p>
                            </div>
                        </div>

                        {/* 4. Add Fields ("Chipkana") */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-black text-sm mb-4 uppercase tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <Plus size={16} weight="bold"/> Add Fields (Chipkana)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_FIELDS.map(field => {
                                    const activeEl = activeElements[field.id];
                                    const isVisible = !!activeEl?.visible && field.id !== 'custom_text'; 
                                    
                                    let buttonLabel = field.label;
                                    
                                    // Update button label if user changed the text on the card (specifically for Headings)
                                    if (activeEl && activeEl.label && field.id.startsWith('label_')) {
                                         // Extract "Heading" from "Heading: Roll No"
                                         const parts = field.label.split(':');
                                         if (parts.length > 1) {
                                             buttonLabel = `${parts[0]}: ${activeEl.label}`;
                                         } else {
                                             buttonLabel = activeEl.label;
                                         }
                                    }

                                    return (
                                        <button
                                            key={field.id}
                                            onClick={() => toggleFieldVisibility(field.id)}
                                            className={`px-3 py-1.5 rounded-none border text-[10px] font-bold uppercase transition-all ${
                                                isVisible 
                                                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' 
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {buttonLabel}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 5. Element Editor (The "Remote Control") */}
                        {selectedElementKey && activeElConfig && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-[#1e3a8a] p-6 animate-in slide-in-from-left-4">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <h3 className="font-black text-sm uppercase tracking-widest text-[#1e3a8a]">
                                        Edit: {activeElConfig.label || AVAILABLE_FIELDS.find(f => f.id === selectedElementKey)?.label || selectedElementKey}
                                    </h3>
                                    <button onClick={() => handleUpdateElement(selectedElementKey, { visible: false })} className="text-rose-500 hover:text-rose-700">
                                        <Trash size={16} weight="bold"/>
                                    </button>
                                </div>

                                {/* NEW: Upload Button for Signature */}
                                {selectedElementKey === 'signature' && (
                                    <div className="mb-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                                        {masterTemplate.signatureURL ? (
                                            <div className="mb-2 w-full h-16 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                                <img src={masterTemplate.signatureURL} alt="Sig" className="h-full object-contain" />
                                            </div>
                                        ) : <p className="text-[10px] text-slate-400 mb-2">No Signature Uploaded</p>}
                                        
                                        <button 
                                            onClick={() => { setImageTarget('card_signature'); fileInputRef.current?.click(); }}
                                            className="w-full py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black flex items-center justify-center gap-2"
                                        >
                                            <PenNib size={14} /> Upload Signature
                                        </button>
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    {/* Position Sliders */}
                                    <div>
                                        <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase"><span>Horizontal (X)</span><span>{activeElConfig.x}%</span></div>
                                        <input type="range" min="0" max="100" value={activeElConfig.x} onChange={e => handleUpdateElement(selectedElementKey, { x: parseInt(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase"><span>Vertical (Y)</span><span>{activeElConfig.y}%</span></div>
                                        <input type="range" min="0" max="100" value={activeElConfig.y} onChange={e => handleUpdateElement(selectedElementKey, { y: parseInt(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]" />
                                    </div>

                                    {/* UPDATED: Text Content Editor (for BOTH dynamic and static text) */}
                                    {/* For dynamic fields, this acts as a 'Prefix' or 'Label'. For static, it's the content. */}
                                    {(activeElConfig.type === 'text' || selectedElementKey.startsWith('custom_text') || selectedElementKey.startsWith('label_') || AVAILABLE_FIELDS.find(f => f.id === selectedElementKey)) && (
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
                                                {/* Label changes based on context */}
                                                {(selectedElementKey.startsWith('custom_text') || selectedElementKey.startsWith('label_')) ? 'Text Content' : 'Label / Prefix (Optional)'}
                                            </label>
                                            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300">
                                                <TextT size={14} className="ml-2 text-slate-400"/>
                                                <input 
                                                    type="text" 
                                                    // Map value to 'prefix' for dynamic fields (if not custom_text), else 'label'
                                                    value={(selectedElementKey.startsWith('custom_text') || selectedElementKey.startsWith('label_')) ? (activeElConfig.label || '') : (activeElConfig.prefix || '')} 
                                                    onChange={e => {
                                                        if (selectedElementKey.startsWith('custom_text') || selectedElementKey.startsWith('label_')) {
                                                            handleUpdateElement(selectedElementKey, { label: e.target.value });
                                                        } else {
                                                            handleUpdateElement(selectedElementKey, { prefix: e.target.value });
                                                        }
                                                    }} 
                                                    className="w-full p-2 text-xs font-bold outline-none" 
                                                    placeholder={(selectedElementKey.startsWith('custom_text') || selectedElementKey.startsWith('label_')) ? "Enter Text..." : "e.g. Roll No: "}
                                                />
                                            </div>
                                            {!selectedElementKey.startsWith('custom_text') && !selectedElementKey.startsWith('label_') && (
                                                <p className="text-[8px] text-slate-400 mt-1 font-bold">Use this to add a label like "Name: " before the value.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Style Controls (Only for Text) */}
                                    {activeElConfig.type !== 'image' && (
                                        <div className="space-y-4">
                                            {/* NEW: Font Family Selector */}
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Font Style</label>
                                                <select 
                                                    value={activeElConfig.fontFamily || 'Inter, sans-serif'} 
                                                    onChange={e => handleUpdateElement(selectedElementKey, { fontFamily: e.target.value })}
                                                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 text-xs font-bold outline-none"
                                                >
                                                    {FONT_OPTIONS.map((font, idx) => (
                                                        <option key={idx} value={font.value} style={{ fontFamily: font.value.replace(/"/g, '') }}>
                                                            {font.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Size (px)</label>
                                                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300">
                                                        <TextT size={14} className="ml-2 text-slate-400"/>
                                                        <input type="number" value={activeElConfig.fontSize} onChange={e => handleUpdateElement(selectedElementKey, { fontSize: parseInt(e.target.value) })} className="w-full p-2 text-xs font-bold outline-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Color</label>
                                                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 p-1">
                                                        <input type="color" value={activeElConfig.color} onChange={e => handleUpdateElement(selectedElementKey, { color: e.target.value })} className="w-6 h-6 border-none cursor-pointer p-0" />
                                                        <span className="text-[10px] ml-2 font-mono">{activeElConfig.color}</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                     <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Weight</label>
                                                     <select value={activeElConfig.fontWeight || 'normal'} onChange={e => handleUpdateElement(selectedElementKey, { fontWeight: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 text-xs font-bold outline-none">
                                                         <option value="normal">Normal</option>
                                                         <option value="bold">Bold</option>
                                                     </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Image/Logo Controls: Rotation and Size */}
                                    {(activeElConfig.type === 'image' || selectedElementKey === 'logo' || selectedElementKey === 'photo' || selectedElementKey === 'signature' || selectedElementKey === 'schoolLogo' || selectedElementKey === 'qr_code' || selectedElementKey === 'barcode' || true) && (
                                        <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                                            <div>
                                                <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase"><span>Size (Width %)</span><span>{activeElConfig.width || 10}%</span></div>
                                                <input type="range" min="1" max="100" value={activeElConfig.width || 10} onChange={e => handleUpdateElement(selectedElementKey, { width: parseInt(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase"><span>Size (Height %)</span><span>{activeElConfig.height || 10}%</span></div>
                                                <input type="range" min="1" max="100" value={activeElConfig.height || 10} onChange={e => handleUpdateElement(selectedElementKey, { height: parseInt(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]" />
                                            </div>
                                            
                                            {/* NEW: Roundness Control */}
                                            <div>
                                                <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase items-center">
                                                    <span className="flex items-center gap-1"><CornersOut size={12}/> Roundness</span>
                                                    <span>{activeElConfig.borderRadius || 0}%</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="50" 
                                                    value={activeElConfig.borderRadius || 0} 
                                                    onChange={e => handleUpdateElement(selectedElementKey, { borderRadius: parseInt(e.target.value) })} 
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]" 
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1 uppercase items-center">
                                                    <span className="flex items-center gap-1"><ArrowsClockwise size={12}/> Rotation</span>
                                                    <span>{activeElConfig.rotation || 0}°</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="-180" 
                                                    max="180" 
                                                    value={activeElConfig.rotation || 0} 
                                                    onChange={e => handleUpdateElement(selectedElementKey, { rotation: parseInt(e.target.value) })} 
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]" 
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: The Preview (Canvas) */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-6">
                            <div className="bg-slate-900 p-8 min-h-[700px] flex items-center justify-center relative overflow-hidden shadow-2xl border-4 border-slate-800">
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                                
                                {/* 
                                    INTERACTIVE PREVIEW:
                                    This uses the SAME renderer component but passes explicit 'data' prop to override.
                                    We pass 'previewStudent' with dummy data so the user sees what it looks like.
                                */}
                                <div 
                                    className="relative transition-all duration-500 shadow-2xl"
                                    onClick={(e) => {
                                       // Deselect if clicking background
                                       if(e.target === e.currentTarget) setSelectedElementKey(null);
                                    }}
                                >
                                    <div 
                                        className="relative bg-white dark:bg-slate-800 overflow-hidden"
                                        style={{ 
                                            width: `${isLandscape ? LANDSCAPE_WIDTH : PORTRAIT_WIDTH}px`, 
                                            height: `${isLandscape ? LANDSCAPE_HEIGHT : PORTRAIT_HEIGHT}px`,
                                            backgroundImage: currentBgUrl ? `url("${currentBgUrl}")` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            border: currentBgUrl ? 'none' : '2px dashed #cbd5e1',
                                            backgroundColor: 'white' // Ensure container is white for overlay effect
                                        }}
                                    >
                                        {!currentBgUrl && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-800/50">
                                                <Image size={48} weight="duotone" />
                                                <p className="font-black text-xs uppercase tracking-widest mt-4">Select a Template</p>
                                            </div>
                                        )}

                                        {/* 
                                            LAYER 1: PHOTO (Z-INDEX 0/1) 
                                            We need to render the photo SEPARATELY if we want it *under* the template.
                                            However, since we are iterating `activeElements`, we can control z-index via style.
                                            
                                            Wait, `IDCardRenderer` logic is separate. Here we are manually building the preview to support click-to-select.
                                        */}

                                        {Object.keys(activeElements).map((key) => {
                                            const el = activeElements[key];
                                            if (!el || !el.visible) return null;
                                            
                                            const isSelected = selectedElementKey === key;
                                            const isPhoto = key === 'photo';
                                            
                                            // Determine Z-Index based on type. 
                                            // Photo should be lowest (1). Text/Logos higher (10+).
                                            let zIndex = 10;
                                            if (isPhoto) zIndex = 1; 

                                            const style: React.CSSProperties = {
                                                position: 'absolute',
                                                left: `${el.x}%`,
                                                top: `${el.y}%`,
                                                transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                                                color: el.color,
                                                fontSize: `${el.fontSize}px`,
                                                fontWeight: el.fontWeight || 'normal',
                                                fontFamily: el.fontFamily || 'Inter, sans-serif',
                                                textAlign: el.textAlign || 'left',
                                                whiteSpace: 'nowrap',
                                                zIndex: zIndex,
                                                cursor: 'pointer',
                                                padding: '2px',
                                                border: isSelected ? '2px dashed #f59e0b' : '1px dashed transparent',
                                                backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                                opacity: el.opacity ?? 1,
                                                borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}%` : (isPhoto ? '4px' : '0px'),
                                                width: el.width ? `${el.width}%` : '10%',
                                            };

                                            // Render Content
                                            if (el.type === 'image' || key === 'photo' || key === 'logo' || key === 'signature' || key === 'schoolLogo' || key === 'qr_code' || key === 'barcode') {
                                                return (
                                                    <div 
                                                        key={key} 
                                                        onClick={() => {
                                                            // INTERACTIVE CLICK-TO-UPLOAD FOR PHOTO & LOGO
                                                            if (key === 'photo') {
                                                                setImageTarget('photo_preview'); // Use special target for preview only
                                                                fileInputRef.current?.click();
                                                            } else if (key === 'schoolLogo' || key === 'logo') {
                                                                setImageTarget('logo');
                                                                fileInputRef.current?.click();
                                                            }
                                                            setSelectedElementKey(key);
                                                        }}
                                                        style={{
                                                            ...style, 
                                                            width: el.width ? `${el.width}%` : '10%', 
                                                            height: el.height ? `${el.height}%` : '10%', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            overflow: 'hidden', 
                                                            // Ensure transparent background for PNGs if needed
                                                        }}
                                                        title={key === 'photo' ? "Click to Upload Photo" : key === 'schoolLogo' ? "Click to Upload Logo" : ""}
                                                    >
                                                         {/* OVERLAY FOR HOVER EFFECT ON PHOTO/LOGO */}
                                                        {(key === 'photo' || key === 'schoolLogo') && (
                                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                                                <UploadSimple size={24} className="text-white mb-1" />
                                                                <span className="text-[8px] font-bold text-white uppercase">Upload</span>
                                                            </div>
                                                        )}

                                                        {(key === 'logo' || key === 'schoolLogo') && logoURL ? (
                                                            <img src={logoURL} className="w-full h-full object-fill" alt="Watermark"/>
                                                        ) : key === 'signature' && masterTemplate.signatureURL ? (
                                                            <img src={masterTemplate.signatureURL} className="w-full h-full object-fill" alt="Signature"/>
                                                        ) : key === 'qr_code' ? (
                                                            <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                                                                <QrCode size={48} className="text-slate-800 dark:text-slate-100 w-full h-full" />
                                                            </div>
                                                        ) : key === 'barcode' ? (
                                                            <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                                                                <Barcode size={48} className="text-slate-800 dark:text-slate-100 w-full h-full" />
                                                            </div>
                                                        ) : key === 'photo' ? (
                                                            // Photo Placeholder
                                                            previewPhotoUrl ? (
                                                                <img src={previewPhotoUrl} className="w-full h-full object-cover" alt="Student Preview"/>
                                                            ) : (
                                                                <div className="w-full h-full bg-slate-200 border border-slate-300 flex flex-col items-center justify-center text-slate-400">
                                                                    <Camera size={24} weight="duotone" className="mb-1" />
                                                                    <span className="text-[8px] font-bold uppercase">Photo</span>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="w-full h-full border-2 border-slate-300 border-dashed flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                                                                {key}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            // Text Content
                                            let content = "";
                                            if (key.startsWith('custom_text') || key.startsWith('label_')) {
                                                content = el.label || (key.startsWith('label_') ? key.replace('label_', '').toUpperCase() : "Static Text");
                                            } else {
                                                // Preview Values
                                                let val = key;
                                                if (key === 'schoolName') {
                                                    val = name ? name.toUpperCase() : "SCHOOL NAME";
                                                } else if (previewStudent[key as keyof typeof previewStudent]) {
                                                    val = previewStudent[key as keyof typeof previewStudent] as string;
                                                } else if (key === 'name') val = "AHMAD ABDULLAH";
                                                else if (key === 'rollNo') val = "2024-101";
                                                else if (key === 'class') val = "CLASS 8-A";
                                                else if (key === 'dob') val = "12-AUG-2010";
                                                
                                                content = el.prefix ? `${el.prefix} ${val}` : val;
                                            }
                                            
                                            if (!content && el.label) {
                                                content = el.label;
                                            }

                                            return (
                                                <div 
                                                    key={key} 
                                                    style={style}
                                                    onClick={() => setSelectedElementKey(key)}
                                                    title={`Click to edit ${el.label || key}`}
                                                >
                                                    <AutoFitText 
                                                        text={content} 
                                                        fontSize={el.fontSize} 
                                                        fontFamily={el.fontFamily || 'Inter'} 
                                                        color={el.color} 
                                                        fontWeight={el.fontWeight} 
                                                    />
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Removed LAYER 3: TEMPLATE OVERLAY to prevent hiding the photo when background is opaque */}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-4">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Click photo box to upload. Drag text to move.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

export default SchoolBranding;
