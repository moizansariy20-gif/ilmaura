
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Shield, AlertCircle, School, Upload, Globe, User, Mail, Phone, MessageSquare, Lock, MapPin, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Country, State, City } from 'country-state-city';
import Loader from '../components/Loader.tsx';
import { resolveSchoolId, submitRegistrationRequest, checkSchoolStatus } from '../services/api.ts'; // Import helper
import CustomCursor from '../src/components/CustomCursor.tsx';
import TextSpotlight from '../src/components/TextSpotlight.tsx';

interface SchoolIdInputProps {
  onBack?: () => void;
  onProceed: (schoolId: string) => void;
  onMotherAdminClick?: () => void;
}

const ButtonWithSpotlight: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  overlayClassName?: string;
  type?: "button" | "submit";
}> = ({ onClick, disabled, className, children, overlayClassName, type = "button" }) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <button
      ref={containerRef}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
      <motion.div 
        initial={false}
        animate={{ 
          opacity: isHovering ? 1 : 0,
          clipPath: `circle(${isHovering ? 60 : 0}px at ${mousePos.x}px ${mousePos.y}px)`
        }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 25,
          opacity: { duration: 0.2 }
        }}
        className={`absolute inset-0 z-20 pointer-events-none overflow-hidden flex items-center justify-center ${overlayClassName}`}
      >
        <div className="flex items-center justify-center gap-2 font-bold">
          {children}
        </div>
      </motion.div>
    </button>
  );
};

const SchoolIdInput: React.FC<SchoolIdInputProps> = ({ onBack, onProceed, onMotherAdminClick }) => {
  const [schoolIdInput, setSchoolIdInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showStatusCheck, setShowStatusCheck] = useState(false);
  const [statusId, setStatusId] = useState('');
  const [statusResult, setStatusResult] = useState<any>(null);
  const [registeredId, setRegisteredId] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [typewriter, setTypewriter] = useState({ h1: '', h2: '', p: '', showCursor: true });

  // Signup form state
  const [signupData, setSignupData] = useState({
    schoolLogo: null as File | null,
    schoolName: '',
    subdomain: '',
    contactName: '',
    email: '',
    mobile: '',
    whatsapp: '',
    country: 'PK',
    state: '',
    city: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  useEffect(() => {
    const fullH1 = "Smart Institution, ";
    const fullH2 = "Smarter Management";
    const fullP = "Manage everything in one place with a fast, secure, and fully connected school system.";
    
    let h1 = '';
    let h2 = '';
    let p = '';
    let i = 0;
    let j = 0;
    let k = 0;

    const interval = setInterval(() => {
      if (i < fullH1.length) {
        h1 += fullH1[i];
        i++;
      } else if (j < fullH2.length) {
        h2 += fullH2[j];
        j++;
      } else if (k < fullP.length) {
        p += fullP[k];
        k++;
      } else {
        clearInterval(interval);
      }
      setTypewriter({ h1, h2, p, showCursor: k < fullP.length });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolIdInput.trim()) {
      setIsSyncing(true);
      setError('');
      
      try {
          const resolvedId = await resolveSchoolId(schoolIdInput.trim());
          
          if (resolvedId) {
              // SYSTEM UPDATE: Save to localStorage for persistence
              localStorage.setItem('active_school_portal_id', resolvedId);
              onProceed(resolvedId);
          } else {
              setError("School Not Found. Please check the ID.");
              setIsSyncing(false);
          }
      } catch (err) {
          console.error(err);
          setError("Connection Error. Please try again.");
          setIsSyncing(false);
      }
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo size must be less than 2MB");
        return;
      }
      setSignupData({ ...signupData, schoolLogo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!signupData.schoolLogo) {
      setError("School Logo is required!");
      return;
    }

    setIsSyncing(true);
    setError('');
    
    try {
        let finalLogoUrl = '';
        if (signupData.schoolLogo) {
          // In a real app, we'd upload to Supabase Storage here
          // For now, we'll use a placeholder or simulate the upload
          finalLogoUrl = logoPreview || '';
        }

        const request = await submitRegistrationRequest({
          ...signupData,
          logoUrl: finalLogoUrl
        });

        setRegisteredId(request.id);
        setSuccessMsg("Registration request submitted! Our team will review your details and contact you on WhatsApp for approval.");
        setIsSyncing(false);
    } catch (err) {
        console.error("Signup Error:", err);
        setError("Failed to submit registration. Please try again.");
        setIsSyncing(false);
    }
  };

  if (isSyncing) {
    // We don't return a loader here anymore. We just let the button show a loading state 
    // or we just freeze the UI for a split second before it hands off to SchoolLoginGate
    // which will show the skeleton immediately.
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center md:p-6 overflow-hidden bg-white md:bg-slate-50 md:cursor-none">
      <CustomCursor color="#000000" />
      
      {/* Back Button */}
      {onBack && (
        <button 
            onClick={onBack} 
            className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest z-20 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}
      
      <div className="w-full max-w-[1300px] relative z-10 h-screen md:h-auto">
        
        {isRegistering ? (
          // --- FULL PAGE SIGNUP FORM (Desktop Only) ---
          <div className="bg-white md:border border-[#1e3a8a]/20 p-8 sm:p-12 md:p-12 rounded-none md:rounded-xl md:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)] relative overflow-hidden animate-in fade-in zoom-in duration-500 min-h-screen md:min-h-[850px] flex flex-col items-center">
            
            {/* Ilmaura Logo (Top Left) */}
            <div className="absolute top-8 left-8 hidden md:block">
              <img src="/logo.svg" alt="Ilmaura Logo" className="w-24 h-24 object-contain" />
            </div>

            <div className="max-w-5xl w-full">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  School <span className="text-[#007bff] font-['Pacifico',_cursive] tracking-wider drop-shadow-sm ml-1">Registration</span> 🏫
                </h1>
                <p className="text-slate-500 text-base">
                  Fill in your details to get started with your own school here.
                </p>
              </div>

              {successMsg ? (
                <div className="bg-white md:border border-slate-100 p-10 rounded-2xl text-center animate-in zoom-in duration-300 max-w-2xl mx-auto shadow-sm">
                  <div className="mb-8 flex justify-center">
                    <img 
                      src="/request-submitted.svg" 
                      alt="Request Submitted" 
                      className="w-96 h-96 object-contain"
                    />
                  </div>
                  <h3 className="text-slate-900 font-black text-3xl mb-4 uppercase tracking-tight">Request Submitted!</h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 inline-block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Request ID (School ID)</p>
                    <p className="text-2xl font-mono font-black text-[#007bff]">{registeredId}</p>
                  </div>
                  <p className="text-slate-500 text-lg leading-relaxed mb-2 font-medium">
                    {successMsg}
                  </p>
                  <p className="text-[#25D366] font-bold text-sm mb-8 flex items-center justify-center gap-2">
                    <MessageSquare size={16} /> Our team will contact you on WhatsApp for approval.
                  </p>
                  
                  <div className="flex flex-col gap-6 items-center">
                    <ButtonWithSpotlight 
                      onClick={() => setIsRegistering(false)}
                      className="px-12 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-xl w-full max-w-xs"
                      overlayClassName="bg-white text-black"
                    >
                      Return to Sign In
                    </ButtonWithSpotlight>

                    <a 
                      href={`${window.location.origin}${window.location.pathname}?school=${signupData.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#007bff] font-bold hover:underline flex items-center gap-2 transition-all hover:gap-3"
                    >
                      <Globe size={14} /> Test Subdomain Resolution (Simulation) <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-8">
                  {/* Logo Upload Section */}
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors group relative max-w-md mx-auto">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {logoPreview ? (
                      <div className="relative w-32 h-32">
                        <img src={logoPreview} alt="Preview" className="w-full h-full object-contain rounded-lg shadow-md" />
                        <div className="absolute -bottom-2 -right-2 bg-[#007bff] text-white p-1.5 rounded-full shadow-lg">
                          <Upload size={14} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400 group-hover:text-[#007bff] transition-colors">
                          <Upload size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">School Logo *</p>
                        <p className="text-xs text-slate-400">Click to upload school logo (PNG, JPG max 2MB)</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                    {/* Section 1: School & Identity */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">School Identity</h3>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <School size={14} className="text-[#007bff]" /> School Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={signupData.schoolName}
                          onChange={(e) => setSignupData({...signupData, schoolName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all"
                          placeholder="e.g. Public School Sukkur"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Globe size={14} className="text-[#007bff]" /> Subdomain *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={signupData.subdomain}
                            onChange={(e) => setSignupData({...signupData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all pr-24"
                            placeholder="e.g. citypublic"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">.ilmaura.com</span>
                        </div>
                        {signupData.subdomain && (
                          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 animate-in fade-in slide-in-from-top-1">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Your Portal URL Preview:</p>
                            <p className="text-sm font-mono font-bold text-slate-700 break-all">
                              https://<span className="text-[#007bff]">{signupData.subdomain}</span>.ilmaura.com
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1 italic">
                              * This will be your school's unique web address.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <User size={14} className="text-[#007bff]" /> Contact Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={signupData.contactName}
                          onChange={(e) => setSignupData({...signupData, contactName: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all"
                          placeholder="Principal Name"
                        />
                      </div>
                    </div>

                    {/* Section 2: Location & Address */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Location</h3>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Country *</label>
                        <select 
                          value={signupData.country}
                          onChange={(e) => setSignupData({...signupData, country: e.target.value, state: '', city: ''})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all text-sm"
                        >
                          {Country.getAllCountries().map((country) => (
                            <option key={country.isoCode} value={country.isoCode}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">State/Province *</label>
                          <select
                            required
                            value={signupData.state}
                            onChange={(e) => setSignupData({...signupData, state: e.target.value, city: ''})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all text-sm"
                          >
                            <option value="">Select State</option>
                            {State.getStatesOfCountry(signupData.country).map((state) => (
                              <option key={state.isoCode} value={state.isoCode}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">City *</label>
                          <select
                            required
                            value={signupData.city}
                            onChange={(e) => setSignupData({...signupData, city: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all text-sm"
                          >
                            <option value="">Select City</option>
                            {City.getCitiesOfState(signupData.country, signupData.state).map((city) => (
                              <option key={city.name} value={city.name}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <MapPin size={14} className="text-[#007bff]" /> Full Address *
                        </label>
                        <textarea
                          required
                          value={signupData.address}
                          onChange={(e) => setSignupData({...signupData, address: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all h-20 resize-none text-sm"
                          placeholder="Street, Sector, Area..."
                        />
                      </div>
                    </div>

                    {/* Section 3: Contact & Security */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Contact & Security</h3>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Mail size={14} className="text-[#007bff]" /> Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={signupData.email}
                          onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all"
                          placeholder="your@email.com"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Phone size={14} className="text-[#007bff]" /> Mobile *
                          </label>
                          <PhoneInput
                            country={signupData.country.toLowerCase()}
                            value={signupData.mobile}
                            onChange={(phone) => setSignupData({...signupData, mobile: phone})}
                            inputStyle={{ width: '100%', height: '46px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                            buttonStyle={{ borderRadius: '12px 0 0 12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare size={14} className="text-[#25D366]" /> WhatsApp *
                          </label>
                          <PhoneInput
                            country={signupData.country.toLowerCase()}
                            value={signupData.whatsapp}
                            onChange={(phone) => setSignupData({...signupData, whatsapp: phone})}
                            inputStyle={{ width: '100%', height: '46px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                            buttonStyle={{ borderRadius: '12px 0 0 12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Lock size={14} className="text-[#007bff]" /> Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={signupData.password}
                              onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all pr-12"
                              placeholder="••••••••"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {/* Strength Indicator */}
                          {signupData.password && (
                            <div className="space-y-1">
                              <div className="flex gap-1 h-1">
                                {[1, 2, 3, 4].map((step) => (
                                  <div 
                                    key={step}
                                    className={`flex-1 rounded-full transition-all duration-500 ${
                                      getPasswordStrength(signupData.password) >= step 
                                        ? step <= 2 ? 'bg-rose-500' : step === 3 ? 'bg-amber-500' : 'bg-emerald-500'
                                        : 'bg-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {getPasswordStrength(signupData.password) <= 1 ? 'Weak' : getPasswordStrength(signupData.password) === 2 ? 'Fair' : getPasswordStrength(signupData.password) === 3 ? 'Good' : 'Strong'}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Lock size={14} className="text-[#007bff]" /> Confirm *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={signupData.confirmPassword}
                              onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-[#007bff] focus:ring-2 focus:ring-[#007bff]/10 transition-all pr-12"
                              placeholder="••••••••"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {signupData.confirmPassword && (
                                signupData.password === signupData.confirmPassword 
                                  ? <CheckCircle2 size={18} className="text-emerald-500" />
                                  : <XCircle size={18} className="text-rose-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 w-full">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 mb-6 animate-shake max-w-2xl mx-auto">
                            <AlertCircle size={20} />
                            <span className="font-medium text-sm">{error}</span>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                      <ButtonWithSpotlight
                        type="submit"
                        disabled={isSyncing}
                        className="w-full md:w-1/2 bg-slate-900 text-white font-bold py-5 rounded-xl hover:bg-slate-800 transition-all shadow-xl text-xl disabled:opacity-50"
                        overlayClassName="bg-white text-black"
                      >
                        {isSyncing ? (
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>Submit Registration Request <ArrowRight size={24} /></>
                        )}
                      </ButtonWithSpotlight>
                      
                      <button 
                        type="button"
                        onClick={() => setIsRegistering(false)}
                        className="text-slate-500 text-lg hover:text-slate-800 font-medium transition-colors"
                      >
                        Already have a login? <span className="text-[#007bff] font-bold hover:underline">Sign In here</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Main Split Card (Sign In) */
          <div className="bg-white md:border border-[#1e3a8a]/20 p-0 rounded-none md:rounded-xl md:shadow-[0_20px_60px_-15px_rgba(30,58,138,0.15)] relative overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[650px] lg:min-h-[750px]">
            
            {/* Left Side - Art/Assets (Wider) - Full Image */}
            <div className="hidden md:flex md:w-[55%] lg:w-[60%] relative flex-col items-center justify-center bg-white border-r border-slate-100 p-8 lg:p-12">
              
              {/* Left Side Text */}
              <div className="mb-6 lg:mb-10 z-20 mt-4 min-h-[120px] w-full">
                <TextSpotlight 
                  h1={typewriter.h1}
                  h2={typewriter.h2}
                  p={typewriter.p}
                  showCursor={typewriter.showCursor}
                />
              </div>

              {/* Image Container */}
              <div className="w-full flex-1 relative flex items-center justify-center z-10 min-h-0">
                <img 
                    src="/left-image.svg" 
                    alt="School Gateway" 
                    className="w-full h-full object-contain object-center"
                    loading="eager"
                />
              </div>

              {/* Bottom Left Action */}
              <div className="absolute bottom-8 left-8 z-20 text-sm text-slate-600">
                <button 
                  type="button"
                  onClick={() => {
                    setShowStatusCheck(true);
                    setIsRegistering(false);
                  }}
                  className="text-[#007bff] font-bold hover:underline"
                >
                  Check School Status
                </button>
              </div>
            </div>

            {/* Right Side - Input (Narrower) */}
            <div className="w-full md:w-[45%] lg:w-[40%] p-8 sm:p-12 md:p-10 lg:p-16 flex flex-col justify-center relative bg-white min-h-screen md:min-h-0">
              
              {/* Top Icon */}
              <div className="flex justify-center md:justify-start mb-8 -mt-6">
                  <img 
                      src="/logo.svg" 
                      alt="School Logo" 
                      className="w-32 h-32 md:w-36 md:h-36 object-contain"
                      loading="eager"
                  />
              </div>

              {showStatusCheck ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center md:text-left mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                      Check <span className="text-[#007bff] font-['Pacifico',_cursive] tracking-wider drop-shadow-sm text-4xl md:text-5xl ml-1">Status</span> 🔍
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                        Enter your Request ID or School ID to check your application status.
                    </p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSyncing(true);
                      setError('');
                      try {
                        const result = await checkSchoolStatus(statusId.trim());
                        if (result) {
                          setStatusResult(result);
                        } else {
                          setError("ID not found. Please check and try again.");
                        }
                      } catch (err) {
                        setError("Error checking status.");
                      } finally {
                        setIsSyncing(false);
                      }
                    }} 
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block">Request / School ID</label>
                      <input
                        type="text"
                        value={statusId}
                        onChange={(e) => setStatusId(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg py-4 px-4 outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] transition-all text-base placeholder:text-slate-400 shadow-sm"
                        placeholder="e.g. 550e8400-e29b-..."
                        required
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {statusResult && (
                      <div className={`p-4 rounded-xl border animate-in zoom-in duration-300 ${
                        statusResult.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                        statusResult.status === 'rejected' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                        'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          {statusResult.status === 'approved' ? <CheckCircle2 size={24} /> : 
                           statusResult.status === 'rejected' ? <XCircle size={24} /> : 
                           <AlertCircle size={24} />}
                          <h4 className="font-black uppercase tracking-tight">
                            {statusResult.status === 'approved' ? 'Approved' : 
                             statusResult.status === 'rejected' ? 'Rejected' : 
                             'Pending Approval'}
                          </h4>
                        </div>
                        <p className="text-sm font-medium">
                          {statusResult.status === 'approved' 
                            ? `Congratulations! ${statusResult.schoolName} is approved. You can now use your School ID to sign in.`
                            : statusResult.status === 'rejected'
                            ? `We're sorry, your request for ${statusResult.schoolName} was not approved at this time.`
                            : `Your request for ${statusResult.schoolName} is currently being reviewed. Please check back later.`}
                        </p>
                      </div>
                    )}

                    <ButtonWithSpotlight
                      type="submit"
                      disabled={isSyncing || !statusId.trim()}
                      className="w-full bg-[#007bff] text-white font-bold py-4 rounded-xl transition-all hover:bg-[#0056b3] shadow-lg shadow-blue-500/30 text-lg"
                      overlayClassName="bg-white text-[#007bff]"
                    >
                      {isSyncing ? 'Checking...' : 'Check Status'}
                    </ButtonWithSpotlight>

                    <button 
                      type="button"
                      onClick={() => {
                        setShowStatusCheck(false);
                        setStatusResult(null);
                        setStatusId('');
                        setError('');
                      }}
                      className="w-full text-slate-500 text-sm font-bold hover:text-slate-800 transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </form>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="text-center md:text-left mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    Welcome <span className="text-[#007bff] font-['Pacifico',_cursive] tracking-wider drop-shadow-sm text-4xl md:text-5xl ml-1">Back!</span> 👋
                  </h1>
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                      Please enter your ID to access your school.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">School ID</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <School size={20} className="text-slate-400 group-focus-within:text-[#007bff] transition-colors" />
                        </div>
                        <input
                          type="text"
                          value={schoolIdInput}
                          onChange={(e) => setSchoolIdInput(e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg py-4 pl-12 pr-4 outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] transition-all text-base placeholder:text-slate-400 placeholder:font-normal uppercase shadow-sm"
                          placeholder="e.g. M-12345678"
                          required
                          autoFocus
                        />
                    </div>
                  </div>
                  
                  {error && (
                      <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 border border-red-100">
                          <AlertCircle size={18} className="shrink-0 mt-0.5" />
                          <span>{error}</span>
                      </div>
                  )}

                  <ButtonWithSpotlight
                    type="submit"
                    disabled={!schoolIdInput.trim() || isSyncing}
                    className="w-full bg-[#007bff] text-white font-bold py-4 rounded-xl transition-all hover:bg-[#0056b3] shadow-lg shadow-blue-500/30 text-lg"
                    overlayClassName="bg-white text-[#007bff]"
                  >
                    {isSyncing ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span> <ArrowRight size={20} />
                      </>
                    )}
                  </ButtonWithSpotlight>
                  
                  {/* Signup Option - Hidden on Mobile */}
                  <div className="mt-8 text-center text-sm text-slate-600 hidden md:block">
                    Don't have a School ID? <button type="button" onClick={() => setIsRegistering(true)} className="text-[#007bff] font-bold hover:underline">Sign Up</button>
                  </div>
                </form>
              </div>
            )}

            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SchoolIdInput;
