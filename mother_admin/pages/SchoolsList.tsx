
import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Users, X, Trash2, Palette, Image as ImageIcon, UserPlus, Key, CheckCircle, ClipboardCopy, Wand2, Library, AlertTriangle, Loader2 } from 'lucide-react';
import { createPrincipalAccount, updateSchoolFirestore } from '../../services/api.ts';

interface SchoolsListProps {
  schools: any[];
  onAddSchool: (school: any) => Promise<any>;
  onDeleteSchool: (id: string) => void;
  onUpdateSchool: (id: string, data: any) => Promise<void>;
}

const FeatureToggle: React.FC<{enabled: boolean, onToggle: () => void}> = ({ enabled, onToggle }) => (
  <button onClick={onToggle} className={`relative inline-flex items-center h-6 rounded-full w-10 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${enabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

const SchoolsList: React.FC<SchoolsListProps> = ({ schools, onAddSchool, onDeleteSchool, onUpdateSchool }) => {
  const [showModal, setShowModal] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    city: '',
    actualStudents: 0,
    logoURL: '',
    themeColor: '#2563eb',
    principalName: '',
    principalEmail: '',
    principalPassword: ''
  });
  const [provisioning, setProvisioning] = useState(false);
  const [provisionedData, setProvisionedData] = useState<any>(null);
  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete Modal State
  const [schoolToDelete, setSchoolToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // NEW: Effect to auto-generate credentials as user types
  useEffect(() => {
    if (newSchool.name && newSchool.principalName && !provisionedData) {
      const cleanSchool = newSchool.name.replace(/\s+/g, '').toLowerCase().slice(0, 10);
      const cleanPrincipal = newSchool.principalName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      const toughNumbers = Math.floor(1000 + Math.random() * 9000);

      setNewSchool(prev => ({
        ...prev,
        principalEmail: `principal.${cleanSchool}@ilmaura.com`,
        principalPassword: `${cleanPrincipal}@${toughNumbers}`
      }));
    }
  }, [newSchool.name, newSchool.principalName, provisionedData]);

  const handleAdd = async () => {
    setFormError('');
    if (!newSchool.name || !newSchool.city || !newSchool.principalName || !newSchool.principalEmail || !newSchool.principalPassword) {
      setFormError("All school and principal account fields are required.");
      return;
    }

    setProvisioning(true);
    
    // Create a local copy of data to modify if retrying
    // We trim to ensure no whitespace issues
    let currentPrincipalData = {
        name: newSchool.principalName, 
        email: newSchool.principalEmail.toLowerCase().trim(),
        password: newSchool.principalPassword,
    };

    try {
      // 1. Create School Doc First (to get ID)
      const schoolData = {
        name: newSchool.name, city: newSchool.city, actualStudents: newSchool.actualStudents,
        logoURL: newSchool.logoURL, themeColor: newSchool.themeColor, licenseStatus: true,
        principalId: '', status: 'Active', isAccessLocked: false, isLearningHubEnabled: true,
      };
      
      const createdSchool = await onAddSchool(schoolData);
      const newSchoolId = createdSchool.id;
      const newSchoolCode = createdSchool.school_code;

      if (!newSchoolId) throw new Error("School creation failed (No ID returned).");

      // 2. Create Principal Account (with retry logic for email collisions)
      let principalUid = null;
      let attempts = 0;
      const MAX_ATTEMPTS = 5;
      
      while (!principalUid && attempts < MAX_ATTEMPTS) {
          try {
              const result = await createPrincipalAccount({
                  ...currentPrincipalData,
                  schoolId: newSchoolId
              });
              
              // Supabase User object uses 'id', not 'uid'. Checking both to be safe.
              const userId = result ? ((result as any).id || (result as any).uid) : null;

              if (userId) {
                  principalUid = userId;
              } else {
                  console.error("Result from createPrincipalAccount:", result);
                  throw new Error("User created but no ID returned from Auth provider.");
              }
          } catch (authErr: any) {
              console.warn(`Attempt ${attempts + 1} failed:`, authErr);

              // Check for "User already registered" or similar errors
              const isCollision = 
                  authErr.message?.toLowerCase().includes('already registered') || 
                  authErr.message?.toLowerCase().includes('already exists') ||
                  authErr.code === 'auth/email-already-in-use';

              if (isCollision) {
                  attempts++;
                  // Generate a more robust unique email on retry
                  const timestampSuffix = Date.now().toString().slice(-4);
                  const randomSuffix = Math.floor(Math.random() * 9999);
                  const emailParts = currentPrincipalData.email.split('@');
                  // Remove any existing digits from the end of the local part to avoid stacking numbers
                  const baseLocal = emailParts[0].replace(/\d+$/, '');
                  
                  currentPrincipalData.email = `${baseLocal}${timestampSuffix}${randomSuffix}@${emailParts[1]}`;
                  console.log(`Email collision detected. Retrying with: ${currentPrincipalData.email}`);
              } else {
                  // If it's NOT a collision (e.g. database error), throw immediately to show the real error
                  throw authErr; 
              }
          }
      }

      if (!principalUid) {
          throw new Error(`Could not generate a unique Principal ID after ${MAX_ATTEMPTS} attempts. Please try a different email address manually.`);
      }
      
      // 3. Link Principal to School
      await updateSchoolFirestore(newSchoolId, { principalId: principalUid });
      
      setShowModal(false);
      setProvisionedData({
          schoolName: newSchool.name,
          principalEmail: currentPrincipalData.email, // Use the final email (might differ from form if retried)
          principalPassword: currentPrincipalData.password,
          schoolId: newSchoolId,
          schoolCode: newSchoolCode
      });
      setNewSchool({ name: '', city: '', actualStudents: 0, logoURL: '', themeColor: '#2563eb', principalName: '', principalEmail: '', principalPassword: '' });

    } catch (err: any) {
      console.error("Onboarding failed:", err);
      
      let msg = err.message || "An unexpected error occurred.";
      
      if (msg.includes('security purposes') || msg.includes('rate limit')) {
         const secondsMatch = msg.match(/(\d+)\s+seconds/);
         const seconds = secondsMatch ? secondsMatch[1] : 'few';
         msg = `Security Alert: Rate limit hit. Please wait ${seconds} seconds.`;
      }
      
      setFormError(msg);
    } finally {
      setProvisioning(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteSchool(schoolToDelete.id);
      setSchoolToDelete(null);
    } catch (error) {
      console.error("Delete failed", error);
      alert("Could not delete school. Make sure to delete related teachers/students first if database constraints exist.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestLink = (schoolId: string) => {
    sessionStorage.setItem('dev_return_to', window.location.pathname);
    sessionStorage.setItem('active_school_portal_id', schoolId);
    window.location.href = '/';
  };
  
  const handleCopyId = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 rounded-none shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schools List</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all {schools.length} schools registered on the platform.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-sm text-sm font-medium hover:bg-blue-700 transition-all" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add New School
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">School Details</th>
                <th className="px-6 py-4">Total Students</th>
                <th className="px-6 py-4">Features</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((school) => {
                const isHubEnabled = school.isLearningHubEnabled !== false;
                const displayCode = school.schoolCode || school.id; 
                
                return (
                <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {school.logoURL ? (
                        <img src={school.logoURL} className="w-8 h-8 rounded-none object-cover border border-slate-200" alt="logo" />
                      ) : (
                        <div className="w-8 h-8 bg-slate-100 rounded-none flex items-center justify-center text-slate-400 font-bold border-b-2" style={{ borderBottomColor: school.themeColor }}>{school.name[0]}</div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900">{school.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono text-slate-500">{displayCode}</p>
                          <button onClick={() => handleCopyId(displayCode)} title="Copy School Code" className="text-slate-400 hover:text-blue-600">
                            {copiedId === displayCode ? <CheckCircle size={12} className="text-emerald-500" /> : <ClipboardCopy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <Users size={14} className="text-slate-400" /> 
                      {Number(school.actualStudents || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FeatureToggle 
                        enabled={isHubEnabled}
                        onToggle={() => onUpdateSchool(school.id, { isLearningHubEnabled: !isHubEnabled })}
                      />
                      <span className="text-xs text-slate-500">Learning Hub</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-none text-xs font-semibold ${school.licenseStatus ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {school.licenseStatus ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => handleTestLink(school.id)} className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-sm text-xs font-medium hover:bg-slate-200 transition-colors">
                        Test Login
                      </button>
                      <button onClick={() => setSchoolToDelete(school)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isDeleting && setSchoolToDelete(null)}></div>
          <div className="bg-white w-full max-w-sm rounded-sm shadow-lg border border-slate-200 relative z-10 p-6 text-center">
             <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertTriangle size={24} />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-2">Delete School?</h3>
             <p className="text-sm text-slate-500 mb-6">
               Are you sure you want to remove <span className="font-bold text-slate-800">{schoolToDelete.name}</span>? This action cannot be undone.
             </p>
             <div className="flex gap-3">
                <button 
                  onClick={() => setSchoolToDelete(null)} 
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-sm font-medium text-sm hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete} 
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-rose-600 text-white rounded-sm font-medium text-sm hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete
                </button>
             </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-none shadow-lg border border-slate-200 relative z-10 p-8 h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add New School</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">School Name</label>
                <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-none text-sm focus:outline-none focus:border-blue-500" value={newSchool.name} onChange={e => setNewSchool({...newSchool, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">City</label>
                <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-none text-sm focus:outline-none focus:border-blue-500" value={newSchool.city} onChange={e => setNewSchool({...newSchool, city: e.target.value})} />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-4">Principal Account</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Full Name</label>
                    <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-none text-sm focus:outline-none focus:border-blue-500" value={newSchool.principalName} onChange={e => setNewSchool({...newSchool, principalName: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Login Email</label>
                    <input type="email" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-none text-sm focus:outline-none focus:border-blue-500" value={newSchool.principalEmail} onChange={e => setNewSchool({...newSchool, principalEmail: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Password</label>
                    <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-none text-sm font-mono focus:outline-none focus:border-blue-500" value={newSchool.principalPassword} onChange={e => setNewSchool({...newSchool, principalPassword: e.target.value})} />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm flex items-start gap-2 text-rose-700 text-sm">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p>{formError}</p>
                </div>
              )}
              <button disabled={provisioning} onClick={handleAdd} className="w-full py-2.5 bg-blue-600 text-white rounded-none font-medium hover:bg-blue-700 transition-all disabled:opacity-50 mt-2">
                {provisioning ? 'Adding School...' : 'Add School'}
              </button>
            </div>
          </div>
        </div>
      )}

      {provisionedData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setProvisionedData(null)}></div>
          <div className="bg-white w-full max-w-sm rounded-sm shadow-lg border border-slate-200 relative z-10 p-6 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100"><CheckCircle size={24} /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">School Added!</h3>
            <p className="text-sm text-slate-500 mb-4">Principal account for {provisionedData.schoolName} is ready.</p>
            <div className="bg-slate-50 p-4 rounded-none text-left space-y-3 mb-6 border border-slate-200">
              <div><p className="text-xs font-semibold text-slate-500">Email</p><p className="font-medium text-sm text-slate-900">{provisionedData.principalEmail}</p></div>
              <div><p className="text-xs font-semibold text-slate-500">Password</p><p className="font-mono font-medium text-sm text-blue-600">{provisionedData.principalPassword}</p></div>
              
              <div className="pt-3 border-t border-slate-200 mt-2">
                  <p className="text-xs font-semibold text-slate-500">School Code</p>
                  <p className="font-mono text-lg font-bold text-slate-900 mt-1">{provisionedData.schoolCode || provisionedData.schoolId}</p>
              </div>
            </div>
            <button onClick={() => setProvisionedData(null)} className="w-full py-2 bg-slate-900 text-white rounded-none font-medium hover:bg-slate-800">Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolsList;
