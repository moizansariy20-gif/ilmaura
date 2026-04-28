
import { createClient } from '@supabase/supabase-js';
import { supabase, uploadFileToSupabase, deleteFileFromSupabase, extractPathFromSupabaseUrl, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase.ts';
import { sendPushNotification } from './firebaseService.ts';
import { 
  PlanRequest,
  School, ClassLog, LiveQuiz, QuizSubmission, 
  StudentNote, TimetableSlot, SavedAcademicPlan, Resource, Student, Teacher, 
  Class, Subject, Assignment, Announcement, Exam, SchoolStatus, Enquiry, StudentDocument,
  Expense, TeacherAttendanceRecord, AttendanceRecord, ActivityLog, StaffPermission, Course, SyllabusChapter, FeeTransaction, UserPreferences
} from '../types.ts';

// --- Shared Helpers ---

export const uploadFileToStorage = uploadFileToSupabase;
export const deleteFileFromStorage = deleteFileFromSupabase;
export const extractPathFromStorageUrl = extractPathFromSupabaseUrl;

// --- INTERNAL HELPER: Temp Client for Auth ---
const createTempClient = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// --- Notification Helpers ---

export const getTokensForClass = async (schoolId: string, classId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('fcm_token')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('role', 'student')
    .not('fcm_token', 'is', null);
  
  if (error) {
    console.error("Error fetching class tokens:", error);
    return [];
  }
  return data.map(u => u.fcm_token).filter(Boolean);
};

export const getTokensForSchool = async (schoolId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('fcm_token')
    .eq('school_id', schoolId)
    .not('fcm_token', 'is', null);

  if (error) {
    console.error("Error fetching school tokens:", error);
    return [];
  }
  return data.map(u => u.fcm_token).filter(Boolean);
};

export const getTokenForStudent = async (studentId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('fcm_token')
    .eq('student_id', studentId)
    .maybeSingle();
  
  if (error || !data) return null;
  return data.fcm_token;
};

export const getSchoolLogo = async (schoolId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('schools')
    .select('logo_url')
    .eq('id', schoolId)
    .maybeSingle();
  
  if (error || !data) return null;
  return data.logo_url;
};

// --- Registration Requests ---

export const onboardNewSchool = async (data: any) => {
    // 1. Create School Doc
    const schoolPayload = {
      name: data.schoolName,
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      address: data.address || '',
      phone: data.mobile || '',
      whatsapp: data.whatsapp || '',
      email: data.email || '',
      contactName: data.contactName || '',
      actualStudents: 0,
      logoURL: data.logoUrl || '',
      themeColor: '#1e3a8a',
      licenseStatus: true,
      status: 'Active',
      isAccessLocked: false,
      plan: 'free', // Default to free plan for direct signup
      subdomain: data.subdomain?.toLowerCase()
    };
    
    const createdSchool = await addSchoolFirestore(schoolPayload);
    const newSchoolId = createdSchool.id;
    const newSchoolCode = createdSchool.school_code;

    if (!newSchoolId) throw new Error("School creation failed (No ID returned).");

    // 2. Create Principal Account
    // Generate a unique email if not provided or to avoid collisions
    const principalData = {
        name: data.contactName,
        email: data.email.toLowerCase().trim(),
        password: data.password,
        schoolId: newSchoolId
    };

    let principalUid = null;
    try {
        const result = await createPrincipalAccount(principalData);
        principalUid = (result as any).id || (result as any).uid;
    } catch (authErr: any) {
        console.error("Auth creation failed during onboarding:", authErr);
        // If auth fails, we probably should delete the school doc? 
        // For now, just throw the error
        throw authErr;
    }

    if (!principalUid) {
        throw new Error("User created but no ID returned from Auth provider.");
    }

    // 3. Link Principal to School
    await updateSchoolFirestore(newSchoolId, { principalId: principalUid });

    return {
        schoolId: newSchoolId,
        schoolCode: newSchoolCode,
        principalId: principalUid
    };
};

export const submitRegistrationRequest = async (data: any) => {
  const payload = {
    school_name: data.schoolName,
    subdomain: data.subdomain?.toLowerCase(),
    contact_name: data.contactName,
    email: data.email,
    mobile: data.mobile,
    whatsapp: data.whatsapp,
    country: data.country,
    state: data.state,
    city: data.city,
    address: data.address,
    logo_url: data.logoUrl
    // status and created_at should be handled by DB defaults to avoid RLS conflicts
  };

  const { error } = await supabase.from('registration_requests').insert(payload);
  if (error) {
    console.error("Supabase Registration Error:", error);
    throw error;
  }
  
  // Return a dummy success indicating it's done since we can't reliably select without permissions
  return { id: 'PENDING_APPROVAL' };
};

export const checkSchoolStatus = async (requestId: string) => {
    // Try to find in registration_requests first
    const { data: request, error: requestError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();
    
    if (request) {
        return {
            type: 'request',
            status: request.status,
            schoolName: request.school_name,
            createdAt: request.created_at
        };
    }

    // If not found, maybe it's already a school?
    const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('school_code', requestId)
        .single();

    if (school) {
        return {
            type: 'school',
            status: 'approved',
            schoolName: school.name,
            schoolCode: school.school_code
        };
    }

    return null;
};

export const subscribeToRegistrationRequests = (callback: (requests: any[]) => void, onError?: (err: any) => void) => {
  const fetch = async () => {
    const { data, error } = await supabase
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching registration requests:", error);
      onError?.(error);
    } else {
      callback(data || []);
    }
  };

  fetch();
  const channel = supabase.channel('registration_requests_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'registration_requests' }, fetch)
    .subscribe();
  
  return () => { supabase.removeChannel(channel); };
};

export const updateRegistrationRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
  const { error } = await supabase
    .from('registration_requests')
    .update({ status })
    .eq('id', requestId);
  
  if (error) throw error;
};

// --- Plan Requests ---

export const submitPlanRequest = async (schoolId: string, schoolName: string, type: 'trial' | 'upgrade') => {
    const payload = {
        school_id: schoolId,
        school_name: schoolName,
        type,
        status: 'pending',
        request_date: new Date().toISOString()
    };
    const { error } = await supabase.from('plan_requests').insert(payload);
    if (error) throw error;
};

export const subscribeToPlanRequests = (callback: (requests: PlanRequest[]) => void) => {
    const fetch = async () => {
        const { data, error } = await supabase.from('plan_requests').select('*').order('request_date', { ascending: false });
        if (!error && data) {
            callback(data.map(d => ({
                id: d.id,
                schoolId: d.school_id,
                schoolName: d.school_name,
                type: d.type,
                status: d.status,
                requestDate: d.request_date
            })));
        }
    };
    fetch();
    const channel = supabase.channel('plan_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'plan_requests' }, fetch).subscribe();
    return () => supabase.removeChannel(channel);
};

export const updatePlanRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('plan_requests').update({ status }).eq('id', requestId);
    if (error) throw error;
};

// --- Schools Management ---

export const subscribeToSchools = (callback: (schools: School[]) => void, onError?: (err: any) => void) => {
  const fetch = async () => {
    const { data, error } = await supabase.from('schools').select('*');
    if (error) onError?.(error);
    else callback(data?.map(s => ({
        ...s,
        schoolCode: s.school_code,
        actualStudents: s.actual_students,
        logoURL: s.logo_url,
        bannerURLs: s.banner_urls || (s.banner_url ? [s.banner_url] : []),
        themeColor: s.theme_color,
        licenseStatus: s.license_status,
        principalId: s.principal_id,
        isAccessLocked: s.is_access_locked,
        plan: s.plan,
        trialStartDate: s.trial_start_date,
        trialEndDate: s.trial_end_date,
        studentFieldConfig: s.student_field_config,
        teacherFieldConfig: s.teacher_field_config,
        idCardConfig: s.id_card_config,
        smartIdConfig: s.smart_id_config,
        admissionFormConfig: s.admission_form_config,
        admissionFormOverlayConfig: s.admission_form_overlay_config,
        feeConfig: s.fee_config,
        socialMediaConfig: s.social_media_config,
        timetableConfig: s.timetable_config,
        parentMatchingFields: s.parent_matching_fields
    })) as School[]);
  };
  fetch();
  const channel = supabase.channel('schools_list').on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, fetch).subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const subscribeToSchoolDetails = (schoolId: string, callback: (school: School) => void, onError?: (err: any) => void) => {
  const fetch = async () => {
    try {
      const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId).single();
      
      if (error) {
        console.error("api: school details fetch error:", error);
        onError?.(error);
      } else if (data) {
        callback({ 
            ...data, 
            schoolCode: data.school_code,
            actualStudents: data.actual_students,
            logoURL: data.logo_url,
            bannerURLs: data.banner_urls || (data.banner_url ? [data.banner_url] : []),
            themeColor: data.theme_color,
            licenseStatus: data.license_status,
            principalId: data.principal_id,
            isAccessLocked: data.is_access_locked,
            plan: data.plan,
            trialStartDate: data.trial_start_date,
            trialEndDate: data.trial_end_date,
            studentFieldConfig: data.student_field_config,
            teacherFieldConfig: data.teacher_field_config,
            idCardConfig: data.id_card_config,
            smartIdConfig: data.smart_id_config,
            admissionFormConfig: data.admission_form_config,
            admissionFormOverlayConfig: data.admission_form_overlay_config,
            feeConfig: data.fee_config,
            socialMediaConfig: data.social_media_config,
            timetableConfig: data.timetable_config,
            parentMatchingFields: data.parent_matching_fields
        } as School);
      }
    } catch (e) {
      console.error("api: school details fetch exception:", e);
      onError?.(e);
    }
  };
  fetch();
  const channel = supabase.channel(`school_${schoolId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'schools', filter: `id=eq.${schoolId}` }, fetch).subscribe();
  return () => { 
    supabase.removeChannel(channel); 
  };
};

export const getSchoolBranding = async (schoolId: string) => {
  const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId).single();
  if (error) return null;
  return { 
      ...data, 
      schoolCode: data.school_code,
      logoURL: data.logo_url,
      bannerURLs: data.banner_urls || (data.banner_url ? [data.banner_url] : []),
      themeColor: data.theme_color,
      studentFieldConfig: data.student_field_config,
      teacherFieldConfig: data.teacher_field_config,
      idCardConfig: data.id_card_config,
      smartIdConfig: data.smart_id_config,
      admissionFormConfig: data.admission_form_config,
      admissionFormOverlayConfig: data.admission_form_overlay_config,
      feeConfig: data.fee_config,
      socialMediaConfig: data.social_media_config,
      timetableConfig: data.timetable_config
  } as School;
};

export const resolveSchoolId = async (inputCode: string): Promise<{id: string, status: string} | null> => {
  const { data: codeMatch } = await supabase.from('schools').select('id, status').eq('school_code', inputCode).maybeSingle();
  if (codeMatch) return { id: codeMatch.id, status: codeMatch.status };
  const { data: idMatch } = await supabase.from('schools').select('id, status').eq('id', inputCode).maybeSingle();
  if (idMatch) return { id: idMatch.id, status: idMatch.status };
  const { data: subMatch } = await supabase.from('schools').select('id, status').eq('subdomain', inputCode.toLowerCase()).maybeSingle();
  if (subMatch) return { id: subMatch.id, status: subMatch.status };
  return null;
};

export const resolveSchoolBySubdomain = async (subdomain: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('schools')
    .select('id')
    .eq('subdomain', subdomain.toLowerCase())
    .maybeSingle();
  
  if (error || !data) return null;
  return data.id;
};

export const checkSchoolIdExists = async (schoolCode: string): Promise<boolean> => {
    const { data } = await supabase
        .from('schools')
        .select('id')
        .eq('school_code', schoolCode)
        .maybeSingle();
    return !!data;
};

export const createPendingSchool = async (data: any) => {
  // Use provided custom school code if available
  const schoolCode = data.schoolId || `${data.schoolName ? data.schoolName.charAt(0).toUpperCase() : 'S'}-${Math.floor(10000000 + Math.random() * 90000000)}`;

  const payload = {
      name: data.schoolName || 'Untitled School',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      address: data.address || '',
      phone: data.mobile || '',
      whatsapp: data.whatsapp || '',
      email: data.email || '',
      contact_name: data.contactName || '',
      status: 'pending', // Mark as pending until email verification
      school_code: schoolCode,
      subdomain: data.subdomain?.toLowerCase() || `school-${Math.floor(10000000 + Math.random() * 90000000)}`,
      plan: 'free',
      logo_url: data.logoUrl || null
  };

  const { data: newSchool, error } = await supabase.from('schools').insert(payload).select().maybeSingle();
  if (error) throw error;
  return newSchool;
};

// Wrapper for backward compatibility
export const addSchoolFirestore = async (data: any) => {
    return await createPendingSchool(data);
};

export const updateSchoolFirestore = async (id: string, data: any) => {
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.city !== undefined) payload.city = data.city;
  if (data.address !== undefined) payload.address = data.address;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.email !== undefined) payload.email = data.email;
  if (data.actualStudents !== undefined) payload.actual_students = data.actualStudents;
  if (data.logoURL !== undefined) payload.logo_url = data.logoURL;
  if (data.themeColor !== undefined) payload.theme_color = data.themeColor;
  if (data.licenseStatus !== undefined) payload.license_status = data.licenseStatus;
  
  if (data.principalId !== undefined) {
      payload.principal_id = data.principalId || null;
  }
  
  if (data.status !== undefined) payload.status = data.status;
  if (data.isAccessLocked !== undefined) payload.is_access_locked = data.isAccessLocked;
  if (data.plan !== undefined) payload.plan = data.plan;
  if (data.trialStartDate !== undefined) payload.trial_start_date = data.trialStartDate;
  if (data.trialEndDate !== undefined) payload.trial_end_date = data.trialEndDate;

  if (data.studentFieldConfig !== undefined) payload.student_field_config = data.studentFieldConfig;
  if (data.teacherFieldConfig !== undefined) payload.teacher_field_config = data.teacherFieldConfig;
  if (data.idCardConfig !== undefined) payload.id_card_config = data.idCardConfig;
  if (data.smartIdConfig !== undefined) payload.smart_id_config = data.smartIdConfig;
  if (data.admissionFormConfig !== undefined) payload.admission_form_config = data.admissionFormConfig;
  if (data.admissionFormOverlayConfig !== undefined) payload.admission_form_overlay_config = data.admissionFormOverlayConfig;
  if (data.feeConfig !== undefined) payload.fee_config = data.feeConfig;
  if (data.socialMediaConfig !== undefined) payload.social_media_config = data.socialMediaConfig;
  if (data.timetableConfig !== undefined) payload.timetable_config = data.timetableConfig;

  // Fallback: merge any other keys directly
  const finalPayload = { ...data, ...payload };
  
  // Remove camelCase keys
  delete finalPayload.actualStudents;
  delete finalPayload.logoURL;
  delete finalPayload.themeColor;
  delete finalPayload.licenseStatus;
  delete finalPayload.principalId;
  delete finalPayload.isAccessLocked;
  delete finalPayload.isLearningHubEnabled;
  delete finalPayload.studentFieldConfig;
  delete finalPayload.teacherFieldConfig;
  delete finalPayload.idCardConfig;
  delete finalPayload.smartIdConfig;
  delete finalPayload.admissionFormConfig;
  delete finalPayload.admissionFormOverlayConfig;
  delete finalPayload.feeConfig;
  delete finalPayload.socialMediaConfig;
  delete finalPayload.timetableConfig;

  const { error } = await supabase.from('schools').update(finalPayload).eq('id', id);
  if (error) throw error;
};

export const deleteSchoolFirestore = async (id: string) => {
  const { error } = await supabase.from('schools').delete().eq('id', id);
  if (error) throw error;
};

export const getStudentCounts = async (): Promise<Record<string, number>> => {
  const { data, error } = await supabase.from('students').select('school_id');
  if (error) {
    console.error("Error fetching student counts:", error);
    return {};
  }
  const counts: Record<string, number> = {};
  data.forEach(s => {
    if (s.school_id) {
      counts[s.school_id] = (counts[s.school_id] || 0) + 1;
    }
  });
  return counts;
};

export const getSchoolDetails = async (id: string) => {
    const { data } = await supabase.from('schools').select('*').eq('id', id).single();
    if (data) return { 
        ...data, 
        schoolCode: data.school_code,
        logoURL: data.logo_url,
        bannerURLs: data.banner_urls || (data.banner_url ? [data.banner_url] : []),
        themeColor: data.theme_color,
        plan: data.plan || 'free',
        contactName: data.contact_name || '', // Defensive
        actualStudents: data.actual_students,
        studentFieldConfig: data.student_field_config,
        teacherFieldConfig: data.teacher_field_config,
        idCardConfig: data.id_card_config,
        smartIdConfig: data.smart_id_config,
        admissionFormConfig: data.admission_form_config,
        admissionFormOverlayConfig: data.admission_form_overlay_config,
        feeConfig: data.fee_config,
        socialMediaConfig: data.social_media_config,
        timetableConfig: data.timetable_config
    };
    return data;
};

// --- Branding & Settings ---

export const updateSchoolBranding = async (schoolId: string, data: any) => {
  // Strictly construct the payload to ensure only valid column names are sent.
  // This prevents "Column not found" errors when passing camelCase React state directly.
  const payload: any = {};

  // Basic Info
  if (data.name !== undefined) payload.name = data.name;
  if (data.logoURL !== undefined) payload.logo_url = data.logoURL;
  if (data.bannerURLs !== undefined) payload.banner_urls = data.bannerURLs;
  if (data.themeColor !== undefined) payload.theme_color = data.themeColor;
  if (data.address !== undefined) payload.address = data.address;
  if (data.city !== undefined) payload.city = data.city;
  if (data.state !== undefined) payload.state = data.state;
  if (data.country !== undefined) payload.country = data.country;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.whatsapp !== undefined) payload.whatsapp = data.whatsapp;
  if (data.email !== undefined) payload.email = data.email;
  // if (data.contactName !== undefined) payload.contact_name = data.contactName; // Disabled due to schema mismatch error
  
  // Configurations (JSON Columns)
  if (data.studentFieldConfig !== undefined) payload.student_field_config = data.studentFieldConfig;
  if (data.teacherFieldConfig !== undefined) payload.teacher_field_config = data.teacherFieldConfig;
  if (data.idCardConfig !== undefined) payload.id_card_config = data.idCardConfig;
  if (data.smartIdConfig !== undefined) payload.smart_id_config = data.smartIdConfig;
  if (data.admissionFormConfig !== undefined) payload.admission_form_config = data.admissionFormConfig;
  if (data.admissionFormOverlayConfig !== undefined) payload.admission_form_overlay_config = data.admissionFormOverlayConfig;
  if (data.feeConfig !== undefined) payload.fee_config = data.feeConfig;
  if (data.socialMediaConfig !== undefined) payload.social_media_config = data.socialMediaConfig;
  if (data.parentMatchingFields !== undefined) payload.parent_matching_fields = data.parentMatchingFields;

  // Additional settings (if any exist in your schema)
  if (data.easyPaisaConfig !== undefined) payload.easyPaisaConfig = data.easyPaisaConfig;

  if (Object.keys(payload).length === 0) return; // Nothing to update

  const { error } = await supabase.from('schools').update(payload).eq('id', schoolId);
  if (error) throw error;
};

export const updateFeeConfig = async (schoolId: string, config: any) => {
    const { error } = await supabase.from('schools').update({ fee_config: config }).eq('id', schoolId); 
    if (error) throw error;
};

export const updateEasyPaisaSettings = async (schoolId: string, config: any) => {
    const { error } = await supabase.from('schools').update({ easyPaisaConfig: config }).eq('id', schoolId);
    if (error) throw error;
};

export const postToFacebook = async (pageId: string, accessToken: string, message: string) => {
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        access_token: accessToken,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (error) {
    console.error("Error posting to Facebook:", error);
    throw error;
  }
};

// ... Rest of the file remains exactly the same ...
// (Omitting the rest for brevity as it is unchanged from the provided file content)
// --- Users (Principals/Admins) ---
export const subscribeToPrincipals = (callback: (principals: any[]) => void, onError?: (err: any) => void) => {
  const fetch = async () => {
    const { data, error } = await supabase.from('user_profiles').select('*').eq('role', 'principal');
    if (error) onError?.(error);
    else callback(data || []);
  };
  fetch();
  const channel = supabase.channel('principals_list').on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, fetch).subscribe();
  return () => { supabase.removeChannel(channel); };
};
// ... (Teacher, Student, Class functions etc. continue) ...
export const createPrincipalAccount = async (data: any) => {
  const tempClient = createTempClient();
  const loginId = generateLoginId(data.name);
  const { data: authData, error: authError } = await tempClient.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { role: 'principal', schoolId: data.schoolId, name: data.name, loginId } }
  });
  if (authError) throw authError;
  if (!authData.user) throw new Error("Failed to create user.");
  const { error: profileError } = await supabase.from('user_profiles').upsert({
      id: authData.user.id, email: data.email, name: data.name, role: 'principal', school_id: data.schoolId, login_id: loginId
  });
  if (profileError) throw profileError;
  return { ...authData.user, loginId };
};
export const updateUserFirestore = async (uid: string, data: any) => {
  const payload: any = { ...data };
  if (data.photoURL !== undefined) {
      payload.photo_url = data.photoURL;
      delete payload.photoURL;
  }
  const { error } = await supabase.from('user_profiles').update(payload).eq('id', uid);
  if (error) throw error;
};

export const updateUserPreferences = async (uid: string, preferences: UserPreferences) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ preferences })
      .eq('id', uid);
    
    if (error) {
      console.warn("EduControl: Failed to update preferences in user_profiles, falling back to Auth Metadata.", error);
      // Fallback to Auth Metadata if column is missing or other error
      const { error: authError } = await supabase.auth.updateUser({ 
        data: { preferences } 
      });
      if (authError) throw authError;
    }
  } catch (err) {
    console.error("EduControl: Preference update failed entirely.", err);
    // Last resort: Update Auth Metadata directly
    const { error: authError } = await supabase.auth.updateUser({ 
      data: { preferences } 
    });
    if (authError) throw authError;
  }
};
export const deletePrincipalFirestore = async (uid: string) => {
    const { error } = await supabase.from('user_profiles').delete().eq('id', uid);
    if (error) throw error;
};
// --- Teachers ---
export const subscribeToTeachers = (schoolId: string, callback: (data: any[]) => void, onError?: (err: any) => void, columns: string = '*') => {
  const fetch = () => {
    supabase.from('teachers').select(columns).eq('school_id', schoolId)
      .then(({ data, error }) => {
        if (error) onError?.(error);
        else callback((data as any[])?.map(d => ({ ...d, schoolId: d.school_id, photoURL: d.photo_url, loginId: d.login_id, authStatus: d.auth_status, status: d.status || (d.auth_status === 'active' ? 'Active' : 'Pending'), gender: d.gender, dob: d.dob, customData: d.custom_data, documents: d.documents })) || []);
      });
  };
  fetch();
  // We use a broader subscription for DELETE events because the 'old' record often lacks the school_id filter column
  const channel = supabase.channel(`teachers:${schoolId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teachers', filter: `school_id=eq.${schoolId}` }, fetch)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teachers', filter: `school_id=eq.${schoolId}` }, fetch)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'teachers' }, (payload) => {
        // If we can't verify school_id (replica identity default), we refetch to be safe
        if (!payload.old || !payload.old.school_id || payload.old.school_id === schoolId) {
            fetch();
        }
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};
export const generateLoginId = (name: string) => {
    // Ensure we only take alphabets and remove spaces/special chars
    const cleanName = name.replace(/[^a-zA-Z]/g, '');
    const prefix = cleanName.substring(0, 3).toUpperCase().padEnd(3, 'X');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
};

export const onboardTeacher = async (schoolId: string, data: any) => {
    const loginId = data.loginId || generateLoginId(data.name);
    const payload = { 
        school_id: schoolId, 
        name: data.name, 
        email: data.email, 
        phone: data.phone, 
        designation: data.designation, 
        login_id: loginId, 
        dob: data.dob, 
        gender: data.gender, 
        custom_data: data.customData, 
        photo_url: data.photoURL,
        auth_status: 'pending', 
        status: 'Active' 
    };
    const { data: newTeacher, error } = await supabase.from('teachers').insert(payload).select().single();
    if (error) throw error;
    return newTeacher;
};
export const updateTeacher = async (schoolId: string, teacherId: string, data: any) => {
  const payload: any = { name: data.name, phone: data.phone, designation: data.designation, dob: data.dob, gender: data.gender, photo_url: data.photoURL };
  if (data.customData) payload.custom_data = data.customData;
  if (data.documents) payload.documents = data.documents;
  
  const { data: teacher, error } = await supabase.from('teachers').update(payload).eq('id', teacherId).eq('school_id', schoolId).select().single();
  if (error) throw error;

  // Sync to user_profiles if teacher has a UID (is active)
  if (teacher.uid) {
    await supabase.from('user_profiles').update({ 
      name: teacher.name, 
      photo_url: teacher.photo_url 
    }).eq('id', teacher.uid);
  }
};
export const deleteTeacher = async (schoolId: string, teacherId: string) => {
    console.log(`Deleting teacher ${teacherId} from school ${schoolId}`);
    const { error } = await supabase.from('teachers').delete().eq('id', teacherId).eq('school_id', schoolId);
    if (error) {
        console.error("Error deleting teacher:", error);
        throw error;
    }
    console.log("Teacher deleted successfully");
};
export const verifyTeacherId = async (schoolId: string, loginId: string) => {
    const { data, error } = await supabase.from('teachers').select('*').eq('school_id', schoolId).eq('login_id', loginId).single();
    if (error || !data) return null;
    return data;
};
export const activateTeacherAccount = async (schoolId: string, dbId: string, loginId: string, password: string) => {
    const { data: teacher } = await supabase.from('teachers').select('*').eq('id', dbId).single();
    if (!teacher) throw new Error("Teacher not found");
    const email = `${loginId.toLowerCase()}.${schoolId}@ilmaura.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { role: 'teacher', schoolId: schoolId, name: teacher.name, teacherDbId: dbId } } });
    if (authError) throw authError;
    if (!authData.user) throw new Error("Failed to create auth user");
    const { error: updateError } = await supabase.from('teachers').update({ uid: authData.user.id, auth_status: 'active', email: email }).eq('id', dbId);
    if (updateError) throw updateError;
    await supabase.from('user_profiles').upsert({ id: authData.user.id, role: 'teacher', school_id: schoolId, name: teacher.name, email: email, teacher_id: dbId, photo_url: teacher.photo_url });
};
export const loginWithId = async (schoolId: string, loginId: string, password: string) => {
    const email = `${loginId.toLowerCase()}.${schoolId}@ilmaura.com`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
};
export const provisionTeacherAccount = async (schoolId: string, teacherId: string, teacherData: any, creds: any) => {
    const tempClient = createTempClient();
    console.log(`Attempting Auth SignUp for Teacher ${creds.email}`);
    
    let authUser = null;
    
    const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: creds.email, 
        password: creds.password, 
        options: { 
            data: { 
                role: 'teacher', 
                schoolId: schoolId, 
                name: teacherData.name, 
                teacherDbId: teacherId 
            } 
        }
    });
    
    if (authError) {
        if (authError.message.includes("already registered")) {
            const { data: signInData, error: signInError } = await tempClient.auth.signInWithPassword({
                email: creds.email,
                password: creds.password
            });
            if (signInError) throw new Error(`User is already registered but we couldn't verify the password: ${signInError.message}`);
            authUser = signInData.user;
        } else throw authError;
    } else {
        authUser = authData.user;
    }
    
    if (!authUser) throw new Error("Failed to obtain user account details.");

    const currentCustomData = teacherData.customData || {};
    
    const { error: updateError } = await supabase.from('teachers').update({ 
        uid: authUser.id, 
        email: creds.email, 
        auth_status: 'active',
        custom_data: { ...currentCustomData, mirror_password: creds.password } 
    }).eq('id', teacherId);
    
    if (updateError) throw new Error(`Auth account verified but failed to link to teacher record: ${updateError.message}`);

    const { error: profileError } = await supabase.from('user_profiles').upsert({ 
        id: authUser.id, 
        role: 'teacher', 
        school_id: schoolId, 
        name: teacherData.name, 
        email: creds.email, 
        teacher_id: teacherId,
        photo_url: teacherData.photoURL
    });

    if (profileError) throw new Error(`Account verified but profile sync failed: ${profileError.message}`);
};

// --- Parents ---
export const subscribeToParents = (schoolId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
  const fetch = () => {
    supabase.from('parents').select('*').eq('school_id', schoolId)
      .then(({ data, error }) => {
        if (error) onError?.(error);
        else callback(data?.map(d => ({ ...d, schoolId: d.school_id, fatherName: d.father_name, childrenIds: d.children_ids, createdAt: d.created_at })) || []);
      });
  };
  fetch();
  const channel = supabase.channel(`parents:${schoolId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'parents', filter: `school_id=eq.${schoolId}` }, fetch)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'parents', filter: `school_id=eq.${schoolId}` }, fetch)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'parents' }, (payload) => {
        if (!payload.old || !payload.old.school_id || payload.old.school_id === schoolId) {
            fetch();
        }
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const addParent = async (schoolId: string, data: any) => {
    const payload = { 
        school_id: schoolId, 
        father_name: data.fatherName, 
        cnic: data.cnic, 
        phone: data.phone, 
        email: data.email, 
        address: data.address, 
        occupation: data.occupation,
        children_ids: data.childrenIds || []
    };
    const { data: newParent, error } = await supabase.from('parents').insert(payload).select().single();
    if (error) throw error;
    return { ...newParent, schoolId: newParent.school_id, fatherName: newParent.father_name, childrenIds: newParent.children_ids };
};

export const updateParent = async (schoolId: string, parentId: string, data: any) => {
    const payload: any = {};
    if (data.fatherName) payload.father_name = data.fatherName;
    if (data.cnic) payload.cnic = data.cnic;
    if (data.phone) payload.phone = data.phone;
    if (data.email) payload.email = data.email;
    if (data.address) payload.address = data.address;
    if (data.occupation) payload.occupation = data.occupation;
    if (data.childrenIds) payload.children_ids = data.childrenIds;

    const { error } = await supabase.from('parents').update(payload).eq('id', parentId).eq('school_id', schoolId);
    if (error) throw error;
};

export const deleteParent = async (schoolId: string, parentId: string) => {
    const { error } = await supabase.from('parents').delete().eq('id', parentId).eq('school_id', schoolId);
    if (error) throw error;
};

// --- Students ---
export const subscribeToStudents = (schoolId: string, callback: (data: any[]) => void, onError?: (err: any) => void, columns: string = '*', limit?: number) => {
  const fetch = () => {
    let query = supabase.from('students').select(columns).eq('school_id', schoolId);
    if (limit) query = query.limit(limit);
    
    query.then(({ data, error }) => {
        if (error) onError?.(error);
        else callback((data as any[])?.map(d => {
            const extra = (d as any).custom_data || {};
            return {
                ...d,
                classId: (d as any).class_id,
                rollNo: (d as any).roll_no,
                fatherName: (d as any).father_name,
                feeStatus: (d as any).fee_status,
                monthlyFee: (d as any).monthly_fee,
                discountAmount: (d as any).discount_amount,
                photoURL: (d as any).photo_url,
                issuedIdCard: (d as any).issued_id_card,
                totalPoints: (d as any).total_points,
                customData: (d as any).custom_data,
                documents: (d as any).documents,
                parentId: (d as any).parent_id,
                cnic: (d as any).cnic,
                loginId: (d as any).login_id,
                admissionDate: extra.admissionDate,
                admissionNo: extra.admissionNo,
                category: extra.category,
                status: extra.status,
                gender: extra.gender,
                dob: extra.dob
            };
        }) || []);
      });
  };
  fetch();
  const channel = supabase.channel(`students:${schoolId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students', filter: `school_id=eq.${schoolId}` }, fetch)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students', filter: `school_id=eq.${schoolId}` }, fetch)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'students' }, (payload) => {
        if (!payload.old || !payload.old.school_id || payload.old.school_id === schoolId) {
            fetch();
        }
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};
export const addStudent = async (schoolId: string, data: any) => {
    // Merge extra fields into custom_data to avoid column-not-found errors
    const customData = {
        ...data.customData,
        ...(data.admissionDate && { admissionDate: data.admissionDate }),
        ...(data.admissionNo && { admissionNo: data.admissionNo }),
        ...(data.category && { category: data.category }),
        ...(data.status && { status: data.status }),
        ...(data.gender && { gender: data.gender }),
        ...(data.dob && { dob: data.dob })
    };

    const loginId = data.loginId || customData.studentId || generateLoginId(data.name);

    const payload = { 
        school_id: schoolId, 
        name: data.name, 
        roll_no: data.rollNo, 
        class_id: data.classId, 
        father_name: data.fatherName, 
        phone: data.phone, 
        custom_data: customData, 
        fee_status: data.feeStatus || 'Unpaid',
        parent_id: data.parentId,
        cnic: data.cnic,
        monthly_fee: data.monthlyFee,
        discount_amount: data.discountAmount,
        photo_url: data.photoURL,
        login_id: loginId,
        auth_status: 'pending'
    };
    const { data: newStudent, error } = await supabase.from('students').insert(payload).select().single();
    if (error) throw error;
    return { ...newStudent, rollNo: newStudent.roll_no, classId: newStudent.class_id, fatherName: newStudent.father_name, customData: newStudent.custom_data, parentId: newStudent.parent_id, cnic: newStudent.cnic, monthlyFee: newStudent.monthly_fee, discountAmount: newStudent.discount_amount, photoURL: newStudent.photo_url, feeStatus: newStudent.fee_status };
};

export const updateStudent = async (schoolId: string, studentId: string, data: any) => {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.rollNo !== undefined) payload.roll_no = data.rollNo;
    if (data.classId !== undefined) payload.class_id = data.classId;
    if (data.fatherName !== undefined) payload.father_name = data.fatherName;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.feeStatus !== undefined) payload.fee_status = data.feeStatus;
    if (data.photoURL !== undefined) payload.photo_url = data.photoURL;
    if (data.issuedIdCard !== undefined) payload.issued_id_card = data.issuedIdCard;
    if (data.totalPoints !== undefined) payload.total_points = data.totalPoints;
    if (data.documents !== undefined) payload.documents = data.documents;
    if (data.parentId !== undefined) payload.parent_id = data.parentId;
    if (data.cnic !== undefined) payload.cnic = data.cnic;
    if (data.monthlyFee !== undefined) payload.monthly_fee = data.monthlyFee;
    if (data.discountAmount !== undefined) payload.discount_amount = data.discountAmount;
    
    // Handle customData and extra fields
    let customDataToUpdate = data.customData;
    if (data.admissionDate !== undefined || data.admissionNo !== undefined || data.category !== undefined || data.status !== undefined || data.gender !== undefined || data.dob !== undefined) {
        // We need to fetch existing custom_data if we are only updating specific extra fields
        // But to be safe, we'll just merge them into the provided customData or fetch if missing
        customDataToUpdate = {
            ...(data.customData || {}),
            ...(data.admissionDate !== undefined && { admissionDate: data.admissionDate }),
            ...(data.admissionNo !== undefined && { admissionNo: data.admissionNo }),
            ...(data.category !== undefined && { category: data.category }),
            ...(data.status !== undefined && { status: data.status }),
            ...(data.gender !== undefined && { gender: data.gender }),
            ...(data.dob !== undefined && { dob: data.dob })
        };
    }
    if (customDataToUpdate !== undefined) payload.custom_data = customDataToUpdate;
    
    const { data: student, error } = await supabase.from('students').update(payload).eq('id', studentId).eq('school_id', schoolId).select().single();
    if (error) throw error;

    // Sync to user_profiles if student has a UID (is active)
    if (student.uid) {
        const profileUpdate: any = {};
        if (student.name) profileUpdate.name = student.name;
        if (student.photo_url) profileUpdate.photo_url = student.photo_url;
        
        if (Object.keys(profileUpdate).length > 0) {
            await supabase.from('user_profiles').update(profileUpdate).eq('id', student.uid);
        }
    }
};
export const deleteStudent = async (schoolId: string, studentId: string) => {
    const { error } = await supabase.from('students').delete().eq('id', studentId).eq('school_id', schoolId);
    if (error) throw error;
};
export const getStudent = async (schoolId: string, studentId: string) => {
    const { data, error } = await supabase.from('students').select('*').eq('id', studentId).eq('school_id', schoolId).single();
    if (error) throw error;
    return { ...data, classId: data.class_id, rollNo: data.roll_no, fatherName: data.father_name, feeStatus: data.fee_status, monthlyFee: data.monthly_fee, discountAmount: data.discount_amount, photoURL: data.photo_url, issuedIdCard: data.issued_id_card, totalPoints: data.total_points, customData: data.custom_data, documents: data.documents };
};

export const getStudentAttendance = async (schoolId: string, studentId: string) => {
    const { data, error } = await supabase.from('attendance').select('*').eq('school_id', schoolId).eq('student_id', studentId);
    if (error) throw error;
    return data.map(a => ({ ...a, studentId: a.student_id, classId: a.class_id, teacherId: a.teacher_id, timeIn: a.time_in }));
};

export const getStudentFeeLedger = async (schoolId: string, studentId: string) => {
    const { data, error } = await supabase.from('fee_transactions').select('*').eq('school_id', schoolId).eq('student_id', studentId).order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map(t => ({ ...t, studentId: t.student_id, studentName: t.student_name, classId: t.class_id, amountPaid: t.amount_paid, fineAmount: t.fine_amount, discountAmount: t.discount_amount, paymentMethod: t.payment_method, receiptNo: t.receipt_no, recordedBy: t.recorded_by, easyPaisaPaymentUrl: t.easypaisa_url, easyPaisaOrderId: t.easypaisa_order_id }));
};

export const enrollStudentByTeacher = async (schoolId: string, data: any) => {
    return addStudent(schoolId, data);
};
export const provisionStudentPortalAccount = async (schoolId: string, studentId: string, studentData: any, creds: any) => {
    const tempClient = createTempClient();
    console.log(`Attempting Auth SignUp for ${creds.email}`);
    
    let authUser = null;
    
    const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: creds.email, 
        password: creds.password, 
        options: { 
            data: { 
                role: 'student', 
                schoolId: schoolId, 
                name: studentData.name, 
                studentDocId: studentId 
            } 
        }
    });
    
    if (authError) {
        if (authError.message.includes("already registered")) {
            console.log("User already exists in Auth. Attempting to recover UID via Sign In...");
            // If already registered, try to sign in to get the UID
            const { data: signInData, error: signInError } = await tempClient.auth.signInWithPassword({
                email: creds.email,
                password: creds.password
            });
            
            if (signInError) {
                console.error("Recovery Sign In failed:", signInError);
                throw new Error(`User is already registered but we couldn't verify the password: ${signInError.message}`);
            }
            authUser = signInData.user;
        } else {
            console.error("Auth SignUp Error:", authError);
            throw authError;
        }
    } else {
        authUser = authData.user;
    }
    
    if (!authUser) {
        console.error("No user object available after SignUp/SignIn");
        throw new Error("Failed to obtain user account details.");
    }

    console.log(`Auth User verified: ${authUser.id}. Updating student record...`);
    const currentCustomData = studentData.customData || {};
    
    // This update will succeed once you add the 'email' column to the 'students' table in Supabase
    const { error: updateError } = await supabase.from('students').update({ 
        uid: authUser.id, 
        email: creds.email, 
        custom_data: { ...currentCustomData, mirror_password: creds.password } 
    }).eq('id', studentId);
    
    if (updateError) {
        console.error("Student Table Update Error:", updateError);
        throw new Error(`Auth account verified but failed to link to student record: ${updateError.message}`);
    }

    console.log(`Student record linked. Upserting user profile...`);
    const { error: profileError } = await supabase.from('user_profiles').upsert({ 
        id: authUser.id, 
        role: 'student', 
        school_id: schoolId, 
        name: studentData.name, 
        email: creds.email, 
        student_id: studentId,
        photo_url: studentData.photoURL || null
    });

    if (profileError) {
        console.error("User Profile Upsert Error:", profileError);
        throw new Error(`Account verified but profile sync failed: ${profileError.message}`);
    }
    
    console.log(`Provisioning complete for ${studentData.name}`);
};
export const verifyLoginId = async (schoolId: string, role: 'teacher' | 'student' | 'principal' | 'staff', loginId: string) => {
    if (role === 'principal') {
        const { data: principal, error: pError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('school_id', schoolId)
            .eq('role', 'principal')
            .eq('login_id', loginId)
            .maybeSingle();

        if (principal) return { ...principal, detectedRole: 'principal' };

        // If not a principal, check if it's a staff member
        const { data: staff, error: sError } = await supabase
            .from('staff')
            .select('*')
            .eq('school_id', schoolId)
            .eq('login_id', loginId)
            .maybeSingle();
        
        if (staff) return { ...staff, detectedRole: 'staff', loginId: staff.login_id };
        
        return null;
    }
    const table = role === 'teacher' ? 'teachers' : role === 'student' ? 'students' : 'staff';
    const { data, error } = await supabase.from(table).select('*').eq('school_id', schoolId).eq('login_id', loginId).single();
    if (error || !data) return null;
    return { ...data, loginId: data.login_id };
};

export const signInWithGoogle = async (redirectTo?: string) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo || `${window.location.origin}/social-auth-callback`,
        }
    });
    if (error) throw error;
    return data;
};

export const linkSocialAccount = async (uid: string, email: string, schoolId: string, role: string, loginId: string, name: string) => {
    const userRecord = await verifyLoginId(schoolId, role as any, loginId);
    if (!userRecord) throw new Error("Invalid Login ID");
    
    // 1. Create/Update User Profile
    const { error: profileError } = await supabase.from('user_profiles').upsert({
        id: uid,
        email,
        name,
        role,
        school_id: schoolId,
        login_id: loginId
    });
    if (profileError) throw profileError;

    // 2. Link to specific table
    if (role === 'teacher') {
        await supabase.from('teachers').update({ uid }).eq('id', userRecord.id);
    } else if (role === 'student') {
        await supabase.from('students').update({ uid }).eq('id', userRecord.id);
    }
};

export const completeUserAccess = async (schoolId: string, role: 'teacher' | 'student' | 'principal' | 'staff', loginId: string, email: string, password: string) => {
    const userRecord = await verifyLoginId(schoolId, role, loginId);
    if (!userRecord) throw new Error("Invalid Login ID");
    
    if (role !== 'principal' && userRecord.uid) throw new Error("Access already created for this ID");

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role,
                schoolId,
                name: userRecord.name,
                loginId,
                ...(role === 'teacher' ? { teacherDbId: userRecord.id } : 
                   role === 'student' ? { studentDocId: userRecord.id } : {})
            }
        }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Failed to create account");

    const table = role === 'teacher' ? 'teachers' : role === 'student' ? 'students' : role === 'staff' ? 'staff' : null;
    
    // Sync to user_profiles
    const profilePayload: any = {
        id: authData.user.id,
        role,
        school_id: schoolId,
        name: userRecord.name,
        email: email,
        login_id: loginId
    };

    if (role === 'staff') {
        profilePayload.staff_permissions = (userRecord as any).staff_permissions || {};
        profilePayload.designation = (userRecord as any).designation;
    }

    const { error: profileError } = await supabase.from('user_profiles').upsert(profilePayload);
    if (profileError) throw profileError;

    // Update original record with UID and status
    if (table) {
        await supabase.from(table).update({ 
            uid: authData.user.id,
            auth_status: 'active'
        }).eq('id', userRecord.id);
    }

    return authData.user;
};
export const updateStudentCredentialsRecord = async (schoolId: string, studentId: string, newPassword: string) => {
    const { data: student } = await supabase.from('students').select('custom_data').eq('id', studentId).single();
    if(student) {
        const updatedCustomData = { ...student.custom_data, mirror_password: newPassword };
        await supabase.from('students').update({ custom_data: updatedCustomData }).eq('id', studentId);
    }
};
// --- Classes ---
export const subscribeToClasses = (schoolId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
  const fetch = () => {
    supabase.from('classes').select('*').eq('school_id', schoolId)
      .then(({ data, error }) => {
        if (error) onError?.(error);
        else callback(data?.map(c => ({ 
            ...c, 
            classTeacher: c.class_teacher, 
            subjectAssignments: c.subject_assignments, 
            involvedTeachers: c.involved_teachers,
            classMonitor: c.class_monitor,
            roomNumber: c.room_number,
            floor: c.floor,
            startTime: c.start_time,
            endTime: c.end_time
        })) || []);
      });
  };
  fetch();
  const channel = supabase.channel(`classes:${schoolId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'classes', filter: `school_id=eq.${schoolId}` }, fetch)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'classes', filter: `school_id=eq.${schoolId}` }, fetch)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'classes' }, (payload) => {
        if (!payload.old || !payload.old.school_id || payload.old.school_id === schoolId) {
            fetch();
        }
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
};
export const addClass = async (schoolId: string, data: any) => {
    const payload = { 
        school_id: schoolId, 
        name: data.name, 
        section: data.section, 
        class_teacher: data.classTeacher, 
        subject_assignments: data.subjectAssignments, 
        involved_teachers: data.involvedTeachers,
        class_monitor: data.classMonitor || null,
        room_number: data.roomNumber || null,
        floor: data.floor || null,
        start_time: data.startTime || null,
        end_time: data.endTime || null
    };
    const { error } = await supabase.from('classes').insert(payload);
    if (error) throw error;
};
export const updateClass = async (schoolId: string, classId: string, data: any) => {
    const payload: any = { ...data };
    if (data.classTeacher !== undefined) payload.class_teacher = data.classTeacher;
    if (data.subjectAssignments !== undefined) payload.subject_assignments = data.subjectAssignments;
    if (data.involvedTeachers !== undefined) payload.involved_teachers = data.involvedTeachers;
    if (data.section !== undefined) payload.section = data.section;
    if (data.classMonitor !== undefined) payload.class_monitor = data.classMonitor || null;
    if (data.roomNumber !== undefined) payload.room_number = data.roomNumber || null;
    if (data.floor !== undefined) payload.floor = data.floor || null;
    if (data.startTime !== undefined) payload.start_time = data.startTime || null;
    if (data.endTime !== undefined) payload.end_time = data.endTime || null;
    
    delete payload.classTeacher; 
    delete payload.subjectAssignments; 
    delete payload.involvedTeachers;
    delete payload.classMonitor;
    delete payload.roomNumber;
    delete payload.floor;
    delete payload.startTime;
    delete payload.endTime;
    
    const { error } = await supabase.from('classes').update(payload).eq('id', classId).eq('school_id', schoolId);
    if (error) throw error;
};
export const deleteClass = async (schoolId: string, classId: string) => {
    console.log(`Deleting class ${classId} from school ${schoolId}`);
    const { error } = await supabase.from('classes').delete().eq('id', classId).eq('school_id', schoolId);
    if (error) {
        console.error("Error deleting class:", error);
        throw error;
    }
    console.log("Class deleted successfully");
};
export const cleanupClassDependencies = async (schoolId: string, classId: string) => {};
// --- Subjects ---
export const subscribeToSubjects = (schoolId: string, callback: (data: Subject[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('subjects').select('*').eq('school_id', schoolId).then(({ data, error }) => { 
            if (error) onError?.(error); 
            else callback(data?.map(s => ({ id: s.id, schoolId: s.school_id, name: s.name, coverImageURL: s.cover_image_url, classId: s.class_id, sectionId: s.section_id })) || []); 
        });
    };
    fetch();
    const channel = supabase.channel(`subjects:${schoolId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'subjects', filter: `school_id=eq.${schoolId}` }, fetch)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'subjects', filter: `school_id=eq.${schoolId}` }, fetch)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'subjects' }, fetch)
        .subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const addSubject = async (schoolId: string, data: any) => {
    const { data: insertedData, error } = await supabase.from('subjects').insert({ 
        name: data.name, 
        school_id: schoolId,
        cover_image_url: data.coverImageURL,
        class_id: data.classId,
        section_id: data.sectionId
    }).select().single();
    if (error) throw error;
    return {
        id: insertedData.id,
        name: insertedData.name,
        schoolId: insertedData.school_id,
        coverImageURL: insertedData.cover_image_url,
        classId: insertedData.class_id,
        sectionId: insertedData.section_id
    };
};
export const deleteSubject = async (schoolId: string, subjectId: string) => {
    // Manually delete dependent records to simulate cascade delete and avoid FK constraint errors
    const tables = ['timetable', 'assignments', 'resources', 'exams', 'quizzes', 'academic_plans', 'class_logs'];
    for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq('subject_id', subjectId).eq('school_id', schoolId);
        if (error) {
            console.error(`Error deleting from ${table}:`, error);
            throw new Error(`Could not delete linked data in ${table}. Please try again.`);
        }
    }
    
    const { error: syllabusError } = await supabase.from('syllabus_chapters').delete().eq('subject_id', subjectId);
    if (syllabusError) {
        console.error('Error deleting from syllabus_chapters:', syllabusError);
        throw new Error(`Could not delete linked syllabus chapters. Please try again.`);
    }

    // Notice we do NOT delete attendance records here intentionally to retain historical attendance!
    // Wait, if historical attendance requires a subject, it might throw a FK error.
    // If it does, we will handle it below.

    const { error } = await supabase.from('subjects').delete().eq('id', subjectId).eq('school_id', schoolId);
    if (error) {
        if (error.message.includes('Foreign Key') || error.message.includes('FOREIGN KEY') || error.code === '23503') {
            throw new Error(`Cannot delete subject. It's still in use by other records (e.g., Attendance or Courses). DB Error: ${error.message}`);
        }
        throw error;
    }
};
// --- Timetable ---
export const subscribeToTimetable = (schoolId: string, classId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        let query = supabase.from('timetable').select('*').eq('school_id', schoolId);
        if (classId) query = query.eq('class_id', classId);
        query.then(({ data, error }) => { if (error) onError?.(error); else callback(data?.map(t => ({ ...t, classId: t.class_id, subjectId: t.subject_id, teacherId: t.teacher_id, timeSlot: t.time_slot })) || []); });
    };
    fetch();
    const channel = supabase.channel(`timetable:${schoolId}:${classId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'timetable' }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const addTimetableSlot = async (schoolId: string, data: any) => {
    const payload = { school_id: schoolId, class_id: data.classId, subject_id: data.subjectId || data.subject_id, teacher_id: data.teacherId || data.teacher_id, day: data.day, time_slot: data.timeSlot || data.time_slot };
    const { error } = await supabase.from('timetable').insert(payload);
    if (error) throw error;
};
export const deleteTimetableSlot = async (schoolId: string, slotId: string) => {
    const { error } = await supabase.from('timetable').delete().eq('id', slotId).eq('school_id', schoolId);
    if (error) throw error;
};
// --- Attendance ---
export const subscribeToAttendanceByDate = (schoolId: string, date: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('attendance').select('*').eq('school_id', schoolId).eq('date', date)
            .then(({ data, error }) => { if (error) onError?.(error); else callback(data?.map(a => ({ ...a, studentId: a.student_id, classId: a.class_id, teacherId: a.teacher_id })) || []); });
    };
    fetch();
    const channel = supabase.channel(`attendance:${schoolId}:${date}`).on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const setAttendance = async (schoolId: string, data: any) => {
    const payload = { 
        school_id: schoolId, 
        student_id: data.studentId, 
        class_id: data.classId, 
        teacher_id: data.teacherId || data.teacher_id, 
        date: data.date, 
        status: data.status 
    };
    
    const { data: existingRecords } = await supabase.from('attendance')
        .select('id, status')
        .eq('school_id', schoolId)
        .eq('student_id', data.studentId)
        .eq('date', data.date)
        .limit(1);

    const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

    let success = false;
    let statusChanged = true;

    if (existing) {
        if (existing.status === data.status) {
            statusChanged = false; // Status is the same, no need to notify again
        }
        const { error } = await supabase.from('attendance').update(payload).eq('id', existing.id);
        if (error) throw error;
        success = true;
    } else {
        const { error } = await supabase.from('attendance').insert(payload);
        if (error) throw error;
        success = true;
    }

    if (success && statusChanged) {
        // Trigger Attendance Notification only if status changed or it's new
        const token = await getTokenForStudent(data.studentId);
        if (token) {
            let title = "Attendance Update";
            let body = "";

            if (data.status === 'Present') {
                title = "School Arrival! 😊";
                body = "Good news! Your child has arrived safely at school today.";
            } else if (data.status === 'Absent') {
                title = "We missed you! ❤️";
                body = "Your child was marked absent today. Hope everything is fine!";
            } else if (data.status === 'Leave') {
                title = "Leave Marked 👋";
                body = "Today's leave has been successfully recorded in the system.";
            }

            if (body) {
                const logoUrl = await getSchoolLogo(schoolId);
                // Fire and forget notification
                sendPushNotification(token, title, body, { icon: logoUrl || undefined }).catch(console.error);
            }
        }
    }
};

export const getAttendanceByRange = async (schoolId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase.from('attendance')
        .select('*')
        .eq('school_id', schoolId)
        .gte('date', startDate)
        .lte('date', endDate);
    if (error) throw error;
    return data.map(a => ({ ...a, studentId: a.student_id, classId: a.class_id, teacherId: a.teacher_id }));
};

export const getTeacherAttendanceByRange = async (schoolId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase.from('teacher_attendance')
        .select('*')
        .eq('school_id', schoolId)
        .gte('date', startDate)
        .lte('date', endDate);
    if (error) throw error;
    return data.map(a => ({ ...a, teacherId: a.teacher_id, schoolId: a.school_id }));
};

// --- Teacher Attendance ---
export const subscribeToTeacherAttendanceByDate = (schoolId: string, date: string, callback: (data: TeacherAttendanceRecord[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('teacher_attendance').select('*').eq('school_id', schoolId).eq('date', date)
            .then(({ data, error }) => { 
                if (error) onError?.(error); 
                else callback(data?.map(a => ({ ...a, teacherId: a.teacher_id, schoolId: a.school_id })) || []); 
            });
    };
    fetch();
    const channel = supabase.channel(`teacher_attendance:${schoolId}:${date}`).on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_attendance', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const saveTeacherAttendance = async (schoolId: string, date: string, attendance: Record<string, string>) => {
    for (const [teacherId, status] of Object.entries(attendance)) {
        const payload = {
            school_id: schoolId,
            teacher_id: teacherId,
            date,
            status
        };

        const { data: existing } = await supabase.from('teacher_attendance')
            .select('id')
            .eq('school_id', schoolId)
            .eq('teacher_id', teacherId)
            .eq('date', date)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase.from('teacher_attendance').update(payload).eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('teacher_attendance').insert(payload);
            if (error) throw error;
        }
    }
};

// --- Dashboard Stats ---
export const fetchDashboardStats = async (schoolId: string) => {
    const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();
    
    if (error) {
        console.warn('Dashboard stats fetch error:', error);
        return null;
    }
    return data;
};

export const subscribeToDashboardStats = (schoolId: string, onUpdate: (data: any) => void) => {
    const refresh = async () => {
        const stats = await fetchDashboardStats(schoolId);
        if (stats) onUpdate(stats);
    };

    refresh();

    const channel = supabase.channel(`dashboard_stats:${schoolId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `school_id=eq.${schoolId}` }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers', filter: `school_id=eq.${schoolId}` }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'staff', filter: `school_id=eq.${schoolId}` }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `school_id=eq.${schoolId}` }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries', filter: `school_id=eq.${schoolId}` }, refresh)
        .subscribe();

    return () => { supabase.removeChannel(channel); };
};

// --- Fee Helpers ---
export const mapFeeTransactionRow = (t: any) => {
    const timestamp = t.timestamp;
    let normalizedDate = '';
    if (timestamp) {
        try {
            normalizedDate = new Date(timestamp).toISOString().split('T')[0];
        } catch (e) {
            normalizedDate = '';
        }
    }

    return {
        ...t,
        studentId: t.student_id,
        studentName: t.student_name,
        classId: t.class_id,
        amountPaid: t.amount_paid,
        balanceAmount: t.balance_amount,
        fineAmount: t.fine_amount,
        discountAmount: t.discount_amount,
        paymentMethod: t.payment_method,
        receiptNo: t.receipt_no,
        recordedBy: t.recorded_by,
        easyPaisaPaymentUrl: t.easypaisa_url,
        easyPaisaOrderId: t.easypaisa_order_id,
        normalizedDate // Pre-calculated for fast filtering
    } as FeeTransaction;
};

// --- Fees ---
export const fetchFeeLedger = async (schoolId: string, limit?: number, offset?: number) => {
    let query = supabase.from('fee_transactions').select('*').eq('school_id', schoolId).order('timestamp', { ascending: false });
    
    if (limit) {
        const from = offset || 0;
        const to = from + limit - 1;
        query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data?.map(mapFeeTransactionRow);
};

export const fetchFeeLedgerCount = async (schoolId: string) => {
    const { count, error } = await supabase
        .from('fee_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId);
    if (error) throw error;
    return count || 0;
};

export const subscribeToFeeLedger = (schoolId: string, onUpdate: (data: FeeTransaction[], delta?: { event: string, new?: any, old?: any }) => void, onError?: (err: any) => void, limit: number = 1000) => {
    let currentData: FeeTransaction[] = [];
    
    const initialFetch = async () => {
        try {
            const data = await fetchFeeLedger(schoolId, limit);
            currentData = data;
            onUpdate(currentData);
        } catch (error) {
            onError?.(error);
        }
    };

    initialFetch();

    const channel = supabase.channel(`fees:${schoolId}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'fee_transactions', 
            filter: `school_id=eq.${schoolId}` 
        }, (payload) => {
            if (payload.eventType === 'INSERT') {
                const newItem = mapFeeTransactionRow(payload.new);
                currentData = [newItem, ...currentData];
            } else if (payload.eventType === 'UPDATE') {
                const updatedItem = mapFeeTransactionRow(payload.new);
                currentData = currentData.map(item => item.id === updatedItem.id ? updatedItem : item);
            } else if (payload.eventType === 'DELETE') {
                currentData = currentData.filter(item => item.id !== payload.old.id);
            }
            onUpdate([...currentData]);
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
};
export const recordFeeTransaction = async (schoolId: string, data: FeeTransaction) => {
    const payload = { 
        school_id: schoolId, 
        student_id: data.studentId, 
        student_name: data.studentName, 
        class_id: data.classId, 
        month: data.month, 
        amount_paid: data.amountPaid, 
        fine_amount: data.fineAmount, 
        discount_amount: data.discountAmount, 
        payment_method: data.paymentMethod, 
        receipt_no: data.receiptNo, 
        status: data.status, 
        recorded_by: data.recordedBy, 
        remarks: data.remarks, 
        timestamp: new Date().toISOString() 
    };
    const { error } = await supabase.from('fee_transactions').insert(payload);
    if (error) throw error;
};
export const updateFeeTransaction = async (schoolId: string, id: string, data: Partial<FeeTransaction>) => {
    const payload: any = {};
    if (data.status) payload.status = data.status;
    if (data.paymentMethod) payload.payment_method = data.paymentMethod;
    if (data.recordedBy) payload.recorded_by = data.recordedBy;
    if (data.amountPaid !== undefined) payload.amount_paid = data.amountPaid;
    if (data.timestamp) payload.timestamp = new Date().toISOString();
    const { error } = await supabase.from('fee_transactions').update(payload).eq('id', id).eq('school_id', schoolId);
    if (error) throw error;
};
export const bulkRecordFeeStatus = async (schoolId: string, records: any[], recordedBy: string = 'System') => {
    // Treat status records as pending transactions in fee_transactions table to show in ledger table
    const payload = records.map(r => ({ 
        school_id: schoolId, 
        student_id: r.studentId, 
        student_name: r.studentName, 
        class_id: r.classId, 
        month: r.month, 
        amount_paid: r.amount || 0, // Legacy behavior: store expected amount for Pending
        fine_amount: 0,
        discount_amount: 0,
        payment_method: 'Challan',
        receipt_no: r.challanNo, 
        status: 'Pending', 
        recorded_by: recordedBy,
        remarks: (r.amount || 0).toString(),
        timestamp: new Date().toISOString() 
    }));
    const { data: insertedData, error } = await supabase.from('fee_transactions').insert(payload).select();
    if (error) {
        console.error("BULK RECORD ERROR:", error);
        throw error;
    }
};

export const bulkRecordFeeTransactions = async (schoolId: string, transactions: any[]) => {
    const payload = transactions.map(t => ({ 
        school_id: schoolId, 
        student_id: t.studentId, 
        student_name: t.studentName, 
        class_id: t.classId, 
        month: t.month, 
        amount_paid: t.amountPaid, 
        fine_amount: t.fineAmount, 
        discount_amount: t.discountAmount, 
        payment_method: t.paymentMethod, 
        receipt_no: t.receiptNo, 
        status: t.status, 
        recorded_by: t.recordedBy, 
        remarks: t.remarks, 
        timestamp: new Date().toISOString() 
    }));
    const { error } = await supabase.from('fee_transactions').insert(payload);
    if (error) throw error;
};

export const getExistingPendingFeeRecords = async (schoolId: string, month: string) => {
    const { data, error } = await supabase.from('fee_transactions')
        .select('student_id')
        .eq('school_id', schoolId)
        .eq('month', month)
        .eq('status', 'Pending');
    if (error) throw error;
    return data;
};
// --- Expenses ---
export const subscribeToExpenses = (schoolId: string, callback: (data: Expense[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('expenses').select('*').eq('school_id', schoolId).order('date', { ascending: false })
            .then(({ data, error }) => { if (error) onError?.(error); else callback(data?.map(e => ({ ...e, schoolId: e.school_id, recordedBy: e.recorded_by, createdAt: e.created_at })) as Expense[] || []); });
    };
    fetch();
    const channel = supabase.channel(`expenses:${schoolId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const addExpense = async (schoolId: string, data: Omit<Expense, 'id' | 'createdAt' | 'schoolId'>) => {
    const payload = { school_id: schoolId, title: data.title, amount: data.amount, category: data.category, date: data.date, notes: data.notes, recorded_by: data.recordedBy };
    const { error } = await supabase.from('expenses').insert(payload);
    if (error) throw error;
};
export const deleteExpense = async (schoolId: string, expenseId: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId).eq('school_id', schoolId);
    if (error) throw error;
};
// --- Resources ---
export const subscribeToResources = (schoolId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('resources').select('*').eq('school_id', schoolId)
            .then(({ data, error }) => { if (error) onError?.(error); else callback(data?.map(r => ({ ...r, classId: r.class_id, subjectId: r.subject_id, teacherId: r.teacher_id, fileURL: r.file_url, fileName: r.file_name, mimeType: r.mime_type })) || []); });
    };
    fetch();
    const channel = supabase.channel(`resources:${schoolId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'resources', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const addResource = async (schoolId: string, data: any, onProgress?: (p: number) => void) => {
    let fileUrl = data.url;
    if (data.type === 'book' && data.file) {
        if (onProgress) onProgress(50);
        const path = `schools/${schoolId}/resources/${Date.now()}_${data.file.name}`;
        const { publicUrl } = await uploadFileToStorage(data.file, path);
        fileUrl = publicUrl;
        if (onProgress) onProgress(100);
    }
    const payload = { 
        school_id: schoolId, 
        title: data.title, 
        url: fileUrl, 
        description: data.description, 
        class_id: data.classId, 
        subject_id: data.subjectId || data.subject_id, 
        teacher_id: data.teacherId || data.teacher_id, 
        type: data.type, 
        file_url: fileUrl, 
        file_name: data.file?.name || data.fileName, 
        mime_type: data.file?.type || data.mimeType,
        created_at: data.createdAt || Date.now()
    };
    const { error } = await supabase.from('resources').insert(payload);
    if (error) throw error;
};
export const deleteResource = async (schoolId: string, id: string) => {
    const { error } = await supabase.from('resources').delete().eq('id', id).eq('school_id', schoolId);
    if (error) throw error;
};
// --- Class Logs ---
export const subscribeToClassLogs = (schoolId: string, classId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('class_logs').select('*').eq('school_id', schoolId).eq('class_id', classId)
            .then(({ data, error }) => { 
                if (error) {
                    console.error("Error fetching logs:", error);
                    onError?.(error);
                } else {
                    callback(data?.map(l => ({ ...l, classId: l.class_id, subjectId: l.subject_id, teacherId: l.teacher_id, b2File: l.file_data })) || []); 
                }
            });
    };
    fetch();
    const channel = supabase.channel(`logs:${schoolId}:${classId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'class_logs' }, (payload) => {
            fetch();
        })
        .subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const addClassLog = async (schoolId: string, data: any) => {
    let fileData = null;
    if (data.file) {
        const path = `schools/${schoolId}/logs/${Date.now()}_${data.file.name}`;
        const { publicUrl } = await uploadFileToStorage(data.file, path);
        fileData = { fileName: publicUrl, fileId: path };
    }
    const payload = { 
        school_id: schoolId, 
        class_id: data.classId || data.class_id, 
        subject_id: data.subjectId || data.subject_id, 
        teacher_id: data.teacherId || data.teacher_id, 
        date: data.date, 
        content: data.content, 
        type: data.type, 
        file_data: fileData 
    };
    const { data: insertedData, error } = await supabase.from('class_logs').insert(payload).select().single();
    if (error) throw error;

    // Trigger Notification for Homework
    if (payload.type === 'homework') {
      const tokens = await getTokensForClass(schoolId, payload.class_id);
      tokens.forEach(token => {
        sendPushNotification(token, "New Homework Assigned!", `New homework added for ${payload.subject_id || 'your class'}. Check your Teacher App.`);
      });
    }

    return { ...insertedData, classId: insertedData.class_id, subjectId: insertedData.subject_id, teacherId: insertedData.teacher_id, b2File: insertedData.file_data };
};
export const deleteClassLog = async (schoolId: string, id: string) => {
    const { error } = await supabase.from('class_logs').delete().eq('id', id).eq('school_id', schoolId);
    if (error) throw error;
};
// --- Assignments ---
export const addAssignment = async (schoolId: string, data: any) => {
    const payload = { school_id: schoolId, title: data.title, instructions: data.instructions, class_id: data.classId, subject_id: data.subject_id, teacher_id: data.teacher_id, due_date: data.dueDate, file_url: data.fileURL };
    const { error } = await supabase.from('assignments').insert(payload);
    if (error) throw error;

    // Trigger Notification
    const tokens = await getTokensForClass(schoolId, data.classId);
    tokens.forEach(token => {
      sendPushNotification(token, "New Assignment!", `New assignment: ${data.title}. Due: ${new Date(data.dueDate).toLocaleDateString()}`);
    });
};
// --- Announcements ---
export const subscribeToAnnouncements = (schoolId: string, classId: string, callback: (data: any[]) => void) => {
    const fetch = () => {
        supabase.from('announcements').select('*').eq('school_id', schoolId).or(`class_id.eq.${classId},class_id.is.null`).order('timestamp', { ascending: false })
            .then(({ data, error }) => { 
                if (!error) callback(data?.map(a => ({ ...a, teacherId: a.teacher_id, classId: a.class_id })) || []); 
            });
    };
    fetch();
    const channel = supabase.channel(`announcements:${classId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const subscribeToAnnouncementsBySchool = (schoolId: string, callback: (data: any[]) => void) => {
    const fetch = () => {
        supabase.from('announcements').select('*').eq('school_id', schoolId).order('timestamp', { ascending: false })
            .then(({ data, error }) => { if (!error) callback(data?.map(a => ({ ...a, teacherId: a.teacher_id, classId: a.class_id })) || []); });
    };
    fetch();
    const channel = supabase.channel(`announcements_school:${schoolId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'announcements', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const postAnnouncement = async (schoolId: string, data: any) => {
    const payload = { 
        school_id: schoolId, 
        content: data.content, 
        class_id: data.classId, 
        teacher_id: data.teacher_id, 
        timestamp: new Date().toISOString(),
        is_popup: data.is_popup || false,
        media_url: data.media_url || null,
        media_type: data.media_type || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null
    };
    const { error } = await supabase.from('announcements').insert(payload);
    if (error) {
        console.error(error);
    } else {
        // Trigger Notification
        if (payload.class_id) {
            const tokens = await getTokensForClass(schoolId, payload.class_id);
            tokens.forEach(token => {
                sendPushNotification(token, "New Notice!", payload.content.substring(0, 50) + "...");
            });
        } else {
            const tokens = await getTokensForSchool(schoolId);
            tokens.forEach(token => {
                sendPushNotification(token, "School Notice!", payload.content.substring(0, 50) + "...");
            });
        }
    }
};
export const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
};
// --- Exams ---
export const addExam = async (schoolId: string, data: any) => {
    const payload = { school_id: schoolId, title: data.title, class_id: data.classId, subject_id: data.subject_id, teacher_id: data.teacher_id, date: data.date, total_marks: data.totalMarks };
    const { error } = await supabase.from('exams').insert(payload);
    if (error) throw error;
};
// --- Quizzes ---
export const subscribeToQuizzesByTeacher = (schoolId: string, teacherId: string, callback: (data: any[]) => void) => {
    const fetch = () => {
        supabase.from('quizzes').select('*').eq('school_id', schoolId).eq('teacher_id', teacherId)
            .then(({ data, error }) => { if (!error) callback(data?.map(q => ({ ...q, classId: q.class_id, subjectId: q.subject_id, teacherId: q.teacher_id, scheduledAt: q.scheduled_at, createdAt: q.created_at })) || []); });
    };
    fetch();
    const channel = supabase.channel(`quizzes:${teacherId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes', filter: `teacher_id=eq.${teacherId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const addQuiz = async (schoolId: string, data: any) => {
    const payload = { 
        school_id: schoolId, 
        title: data.title, 
        class_id: data.classId, 
        subject_id: data.subjectId, 
        teacher_id: data.teacherId, 
        questions: data.questions, 
        duration: data.duration, 
        status: data.status, 
        scheduled_at: data.scheduledAt
    };
    const { error } = await supabase.from('quizzes').insert(payload);
    if (error) throw error;
};
export const updateQuiz = async (schoolId: string, id: string, data: any) => {
    const payload: any = {};
    if (data.title) payload.title = data.title;
    if (data.classId) payload.class_id = data.classId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.status) payload.status = data.status;
    if (data.scheduledAt) payload.scheduled_at = data.scheduledAt;
    if (data.duration) payload.duration = data.duration;
    if (data.questions) payload.questions = data.questions;
    const { error } = await supabase.from('quizzes').update(payload).eq('id', id).eq('school_id', schoolId);
    if (error) throw error;
};
export const deleteQuiz = async (schoolId: string, id: string) => {
    const { error } = await supabase.from('quizzes').delete().eq('id', id).eq('school_id', schoolId);
    if (error) throw error;
};
export const addQuizSubmission = async (schoolId: string, data: any) => {
    console.log("Adding quiz submission:", data);
    const payload = { school_id: schoolId, quiz_id: data.quizId, student_id: data.studentId, student_name: data.studentName, answers: data.answers, total_score: data.totalScore, time_taken: data.timeTaken };
    const { error } = await supabase.from('quiz_submissions').insert(payload);
    if (error) {
        console.error("Error adding quiz submission:", error);
        throw error;
    }
    console.log("Quiz submission added successfully");
};

export const fetchLeaderboard = async (schoolId: string, quizId: string) => {
    const { data, error } = await supabase
        .from('quiz_submissions')
        .select('*')
        .eq('school_id', schoolId)
        .eq('quiz_id', quizId)
        .order('total_score', { ascending: false });
    
    if (error) {
        console.error("Error fetching leaderboard:", error);
        throw error;
    }
    return data || [];
};

// --- Student Notes ---
export const subscribeToStudentNotes = (schoolId: string, studentId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('student_notes').select('*').eq('student_id', studentId)
            .then(({ data, error }) => { if (error) onError?.(error); else callback(data || []); });
    };
    fetch();
    const channel = supabase.channel(`notes:${studentId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'student_notes', filter: `student_id=eq.${studentId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const addStudentNote = async (schoolId: string, studentId: string, data: any) => {
    const payload = { school_id: schoolId, student_id: studentId, title: data.title, content: data.content, color: data.color };
    const { error } = await supabase.from('student_notes').insert(payload);
    if (error) throw error;
};
export const updateStudentNote = async (schoolId: string, studentId: string, noteId: string, data: any) => {
    const { error } = await supabase.from('student_notes').update(data).eq('id', noteId);
    if (error) throw error;
};
export const deleteStudentNote = async (schoolId: string, studentId: string, noteId: string) => {
    const { error } = await supabase.from('student_notes').delete().eq('id', noteId);
    if (error) throw error;
};
// --- Enquiries ---
export const subscribeToEnquiries = (schoolId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('enquiries').select('*').eq('school_id', schoolId).order('created_at', { ascending: false })
            .then(({ data, error }) => { if (error) { onError?.(error); } else { callback(data?.map(e => ({ ...e, studentName: e.student_name, parentName: e.parent_name, previousSchool: e.previous_school, classInterested: e.class_interested, followUpDate: e.follow_up_date, createdAt: e.created_at })) || []); } });
    };
    fetch();
    const channel = supabase.channel(`enquiries:${schoolId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};
export const addEnquiry = async (schoolId: string, data: any) => {
    const payload = { school_id: schoolId, student_name: data.studentName, parent_name: data.parentName, phone: data.phone, previous_school: data.previousSchool, class_interested: data.classInterested, status: data.status, source: data.source, notes: data.notes, follow_up_date: data.followUpDate };
    const { error } = await supabase.from('enquiries').insert(payload);
    if (error) throw error;
};
export const updateEnquiry = async (schoolId: string, id: string, data: any) => {
    const payload: any = {};
    if (data.status) payload.status = data.status;
    if (data.studentName) payload.student_name = data.studentName;
    if (data.parentName) payload.parent_name = data.parentName;
    if (data.phone) payload.phone = data.phone;
    const { error } = await supabase.from('enquiries').update(payload).eq('id', id);
    if (error) throw error;
};
export const deleteEnquiry = async (schoolId: string, id: string) => {
    const { error } = await supabase.from('enquiries').delete().eq('id', id);
    if (error) throw error;
};
// --- ID Cards ---
export const saveIssuedCard = async (schoolId: string, studentId: string, data: any) => {
    const { error } = await supabase.from('students').update({ issued_id_card: data }).eq('id', studentId);
    if (error) throw error;
};
// --- Academic Plan ---
export const subscribeToAcademicPlan = (schoolId: string, teacherId: string, classId: string, subjectId: string, callback: (data: any) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('academic_plans').select('*').eq('school_id', schoolId).eq('teacher_id', teacherId).eq('class_id', classId).eq('subject_id', subjectId).single()
            .then(({ data, error }) => { if (error && error.code !== 'PGRST116') onError?.(error); else callback(data ? { ...data, teacherId: data.teacher_id, classId: data.class_id, subjectId: data.subject_id, planData: data.plan_data } : null); });
    };
    fetch();
    return () => {};
};
export const saveAcademicPlan = async (schoolId: string, id: string | null, data: any) => {
    const payload = { school_id: schoolId, teacher_id: data.teacherId, class_id: data.classId, subject_id: data.subject_id, plan_data: data.planData };
    if (id) {
        const { error } = await supabase.from('academic_plans').update(payload).eq('id', id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('academic_plans').insert(payload);
        if (error) throw error;
    }
};
export const deleteAcademicPlan = async (schoolId: string, id: string) => {
    const { error } = await supabase.from('academic_plans').delete().eq('id', id);
    if (error) throw error;
};
// --- Misc ---
// --- Aggregated Data ---
export const subscribeToTeacherData = (profile: any, setters: any) => {
    const { setClasses, setStudents, setTimetable, setSubjects, setAssignments, setExams, setMarks, setResources } = setters;
    const unsubs: Function[] = [];
    if (profile.schoolId) {
        unsubs.push(subscribeToClasses(profile.schoolId, setClasses));
        unsubs.push(subscribeToStudents(profile.schoolId, setStudents));
        unsubs.push(subscribeToSubjects(profile.schoolId, setSubjects));
        const fetchTimetable = () => { supabase.from('timetable').select('*').eq('school_id', profile.schoolId).eq('teacher_id', profile.teacherId).then(({ data }) => setTimetable(data?.map(t => ({...t, classId: t.class_id, subjectId: t.subject_id, timeSlot: t.time_slot})) || [])); };
        fetchTimetable();
        const fetchAssignments = () => { supabase.from('assignments').select('*').eq('school_id', profile.schoolId).eq('teacher_id', profile.teacherId).then(({ data }) => setAssignments(data?.map(a => ({...a, classId: a.class_id, subjectId: a.subject_id, dueDate: a.due_date})) || [])); };
        fetchAssignments();
        const fetchExams = () => { supabase.from('exams').select('*').eq('school_id', profile.schoolId).eq('teacher_id', profile.teacherId).then(({ data }) => setExams(data?.map(e => ({...e, classId: e.class_id, subjectId: e.subject_id, totalMarks: e.total_marks})) || [])); };
        fetchExams();
        const fetchResources = () => { supabase.from('resources').select('*').eq('school_id', profile.schoolId).eq('teacher_id', profile.teacherId).then(({ data }) => setResources(data?.map(r => ({...r, classId: r.class_id, subjectId: r.subject_id})) || [])); };
        fetchResources();
    }
    return () => unsubs.forEach(u => u());
};
export const subscribeToStudentData = (profile: any, setters: any) => {
    const { setAnnouncements, setAssignments, setTimetable, setSubjects, setExams, setMarks, setResources, setAttendance, setQuizzes, setQuizSubmissions } = setters;
    const schoolId = profile.schoolId;
    const classId = profile.classId;
    const studentId = profile.studentDocId;
    if (!schoolId || !classId) return () => {};
    const unsubs: Function[] = [];
    unsubs.push(subscribeToSubjects(schoolId, setSubjects));
    unsubs.push(subscribeToTimetable(schoolId, classId, setTimetable));
    unsubs.push(subscribeToAnnouncements(schoolId, classId, setAnnouncements));
    const fetchAssignments = () => { supabase.from('assignments').select('*').eq('school_id', schoolId).eq('class_id', classId).then(({ data }) => setAssignments(data?.map(a => ({...a, classId: a.class_id, subjectId: a.subject_id, dueDate: a.due_date})) || [])); };
    fetchAssignments();
    const fetchResources = () => { supabase.from('resources').select('*').eq('school_id', schoolId).eq('class_id', classId).then(({ data }) => setResources(data?.map(r => ({...r, classId: r.class_id, subjectId: r.subject_id, fileURL: r.file_url})) || [])); };
    fetchResources();
    const fetchExams = () => { supabase.from('exams').select('*').eq('school_id', schoolId).eq('class_id', classId).then(({ data }) => setExams(data?.map(e => ({...e, classId: e.class_id, subjectId: e.subject_id, totalMarks: e.total_marks})) || [])); };
    fetchExams();
    const fetchQuizzes = () => { supabase.from('quizzes').select('*').eq('school_id', schoolId).eq('class_id', classId).then(({ data }) => setQuizzes(data?.map(q => ({...q, classId: q.class_id, subjectId: q.subject_id, scheduledAt: q.scheduled_at })) || [])); };
    fetchQuizzes();
    if (studentId) { 
        const fetchAttendance = () => { supabase.from('attendance').select('*').eq('student_id', studentId).then(({ data }) => setAttendance(data?.map(a => ({...a, studentId: a.student_id, classId: a.class_id})) || [])); }; 
        fetchAttendance(); 
        
        if (setQuizSubmissions) {
            const fetchQuizSubmissions = () => { 
                supabase.from('quiz_submissions').select('*').eq('school_id', schoolId).eq('student_id', studentId).then(({ data, error }) => {
                    if (error) console.error("Error fetching quiz submissions:", error);
                    setQuizSubmissions(data || []);
                }); 
            };
            fetchQuizSubmissions();
            const qsChannel = supabase.channel(`quiz_submissions:${studentId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_submissions', filter: `student_id=eq.${studentId}` }, (payload) => {
                console.log("Quiz submission change detected:", payload);
                fetchQuizSubmissions();
            }).subscribe();
            unsubs.push(() => supabase.removeChannel(qsChannel));
        }
    }
    return () => unsubs.forEach(u => u());
};
// --- Complaints ---
export const subscribeToComplaints = (schoolId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('complaints').select('*').eq('school_id', schoolId).order('created_at', { ascending: false })
            .then(({ data, error }) => { 
                if (error) onError?.(error); 
                else callback(data?.map(c => ({ 
                    ...c, 
                    submittedBy: c.submitted_by,
                    mediaUrls: c.media_urls,
                    date: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : ''
                })) || []); 
            });
    };
    fetch();
    const channel = supabase.channel(`complaints:${schoolId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'complaints', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const getPrincipalToken = async (schoolId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('fcm_token')
    .eq('school_id', schoolId)
    .eq('role', 'principal')
    .not('fcm_token', 'is', null)
    .maybeSingle();
  
  if (error || !data) return null;
  return data.fcm_token;
};

export const addComplaint = async (schoolId: string, data: any) => {
    const payload = { 
        school_id: schoolId, 
        title: data.title, 
        description: data.description, 
        priority: data.priority || 'Medium', 
        status: 'Open',
        submitted_by: data.submittedBy,
        student_id: data.studentId || null,
        media_urls: data.mediaUrls || []
    };
    const { error, data: newComplaint } = await supabase.from('complaints').insert(payload).select().single();
    if (error) throw error;

    // Send push notification to principal
    const principalToken = await getPrincipalToken(schoolId);
    if (principalToken) {
        await sendPushNotification(principalToken, "New Complaint", `New complaint: ${data.title}`);
    }
    return newComplaint;
};

export const updateComplaintStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('complaints').update({ status }).eq('id', id);
    if (error) throw error;
};

export const deleteComplaint = async (id: string) => {
    const { error } = await supabase.from('complaints').delete().eq('id', id);
    if (error) throw error;
};

// --- Documents ---
export const addTeacherDocument = async (schoolId: string, teacherId: string, doc: StudentDocument) => {
    const { data: teacher, error: fetchError } = await supabase.from('teachers').select('documents').eq('id', teacherId).single();
    if (fetchError) throw fetchError;
    const currentDocs = teacher.documents || [];
    const updatedDocs = [...currentDocs, doc];
    const { error: updateError } = await supabase.from('teachers').update({ documents: updatedDocs }).eq('id', teacherId);
    if (updateError) throw updateError;
    return updatedDocs;
};
export const removeTeacherDocument = async (schoolId: string, teacherId: string, docId: string) => {
    const { data: teacher, error: fetchError } = await supabase.from('teachers').select('documents').eq('id', teacherId).single();
    if (fetchError) throw fetchError;
    const currentDocs = teacher.documents || [];
    const updatedDocs = currentDocs.filter((d: StudentDocument) => d.id !== docId);
    const { error: updateError } = await supabase.from('teachers').update({ documents: updatedDocs }).eq('id', teacherId);
    if (updateError) throw updateError;
    return updatedDocs;
};
export const addStudentDocument = async (schoolId: string, studentId: string, doc: StudentDocument) => {
    const { data: student, error: fetchError } = await supabase.from('students').select('documents').eq('id', studentId).single();
    if (fetchError) throw fetchError;
    const currentDocs = student.documents || [];
    const updatedDocs = [...currentDocs, doc];
    const { error: updateError } = await supabase.from('students').update({ documents: updatedDocs }).eq('id', studentId);
    if (updateError) throw updateError;
    return updatedDocs;
};
export const removeStudentDocument = async (schoolId: string, studentId: string, docId: string) => {
    const { data: student, error: fetchError } = await supabase.from('students').select('documents').eq('id', studentId).single();
    if (fetchError) throw fetchError;
    const currentDocs = student.documents || [];
    const updatedDocs = currentDocs.filter((d: StudentDocument) => d.id !== docId);
    const { error: updateError } = await supabase.from('students').update({ documents: updatedDocs }).eq('id', studentId);
    if (updateError) throw updateError;
    return updatedDocs;
};

// --- Staff Management ---

export const subscribeToStaff = (schoolId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
    const fetch = async () => {
        // Fetch from staff table (all pending/active staff)
        const { data, error } = await supabase
            .from('staff')
            .select('*')
            .eq('school_id', schoolId);
            
        if (error) {
            console.error("api: subscribeToStaff fetch error:", error);
            onError?.(error);
            return;
        }

        if (data) {
            callback(data.map(d => ({
                uid: d.uid || d.id, // Fallback to record ID if no UID
                id: d.id,
                name: d.name,
                email: d.email,
                phone: d.phone,
                designation: d.designation,
                loginId: d.login_id,
                authStatus: d.auth_status || 'pending',
                staffPermissions: d.staff_permissions || {}
            })));
        }
    };
    fetch();
    const channel = supabase.channel(`staff_${schoolId}`).on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'staff',
        filter: `school_id=eq.${schoolId}`
    }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const addStaffMember = async (schoolId: string, data: any) => {
    const loginId = `S-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = {
        school_id: schoolId,
        name: data.name,
        designation: data.designation,
        phone: data.phone || null,
        login_id: loginId,
        auth_status: 'pending',
        staff_permissions: data.permissions || {}
    };
    const { data: newStaff, error } = await supabase.from('staff').insert(payload).select().single();
    if (error) throw error;
    return newStaff;
};

export const updateStaffPermissions = async (staffId: string, permissions: Record<string, StaffPermission>, designation: string, uid?: string) => {
    // 1. Update Staff Table (The Source)
    const { error: staffError } = await supabase
        .from('staff')
        .update({ 
            staff_permissions: permissions,
            designation: designation
        })
        .eq('id', staffId);
    if (staffError) throw staffError;

    // 2. Sync to User Profile if active
    if (uid) {
        const { error: profileError } = await supabase
            .from('user_profiles')
            .update({ 
                staff_permissions: permissions,
                designation: designation
            })
            .eq('id', uid);
        if (profileError) throw profileError;
    }
};

export const deleteStaffUser = async (id: string, uid?: string) => {
    // 1. Delete from Staff table
    const { error: staffError } = await supabase.from('staff').delete().eq('id', id);
    if (staffError) throw staffError;

    // 2. Delete from User Profiles if active
    if (uid) {
        const { error: profileError } = await supabase.from('user_profiles').delete().eq('id', uid);
        if (profileError) throw profileError;
    }
};

// --- Activity Logs ---
export const logActivity = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const payload = {
        school_id: log.schoolId,
        user_id: log.userId,
        user_name: log.userName,
        user_role: log.userRole,
        action: log.action,
        details: log.details,
        category: log.category,
        timestamp: new Date().toISOString()
    };
    const { error } = await supabase.from('activity_logs').insert(payload);
    if (error) {
        console.warn("Activity Log Error:", error);
    }
};

export const logAudit = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const payload = {
        school_id: log.schoolId,
        user_id: log.userId,
        user_name: log.userName,
        user_role: log.userRole,
        action: log.action,
        details: log.details,
        category: log.category,
        timestamp: new Date().toISOString()
    };
    const { error } = await supabase.from('audit_logs').insert(payload);
    if (error) {
        console.warn("Audit Log Error:", error);
    }
};

export const subscribeToActivityLogs = (schoolId: string, callback: (data: ActivityLog[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('activity_logs')
            .select('*')
            .eq('school_id', schoolId)
            .order('timestamp', { ascending: false })
            .limit(100)
            .then(({ data, error }) => {
                if (error) onError?.(error);
                else callback(data?.map(l => ({
                    id: l.id,
                    schoolId: l.school_id,
                    userId: l.user_id,
                    userName: l.user_name,
                    userRole: l.user_role,
                    action: l.action,
                    details: l.details,
                    category: l.category,
                    timestamp: l.timestamp
                })) as ActivityLog[] || []);
            });
    };
    fetch();
    const channel = supabase.channel(`activity_logs:${schoolId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const getActivityLogsPaginated = async (schoolId: string, page: number, pageSize: number = 10) => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await supabase.from('activity_logs')
        .select('*', { count: 'exact' })
        .eq('school_id', schoolId)
        .order('timestamp', { ascending: false })
        .range(from, to);
        
    if (error) throw error;
    
    return {
        logs: data?.map(l => ({
            id: l.id,
            schoolId: l.school_id,
            userId: l.user_id,
            userName: l.user_name,
            userRole: l.user_role,
            action: l.action,
            details: l.details,
            category: l.category,
            timestamp: l.timestamp
        })) as ActivityLog[] || [],
        totalCount: count || 0
    };
};

export const subscribeToAllActivityLogs = (callback: (data: ActivityLog[]) => void, onError?: (err: any) => void) => {
    const fetch = () => {
        supabase.from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100)
            .then(({ data, error }) => {
                if (error) onError?.(error);
                else callback(data?.map(l => ({
                    id: l.id,
                    schoolId: l.school_id,
                    userId: l.user_id,
                    userName: l.user_name,
                    userRole: l.user_role,
                    action: l.action,
                    details: l.details,
                    category: l.category,
                    timestamp: l.timestamp
                })) as ActivityLog[] || []);
            });
    };
    fetch();
    const channel = supabase.channel('all_audit_logs').on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const getAuditLogsPaginated = async (page: number, pageSize: number = 10) => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await supabase.from('audit_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(from, to);
        
    if (error) throw error;
    
    return {
        logs: data?.map(l => ({
            id: l.id,
            schoolId: l.school_id,
            userId: l.user_id,
            userName: l.user_name,
            userRole: l.user_role,
            action: l.action,
            details: l.details,
            category: l.category,
            timestamp: l.timestamp
        })) as ActivityLog[] || [],
        totalCount: count || 0
    };
};

// =================================================================
// 🎧 SUPPORT & HELPDESK
// =================================================================

export const subscribeToSupportVideos = (callback: (data: any[]) => void) => {
    const fetch = () => {
        supabase.from('support_videos').select('*').order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error) callback(data?.map(v => ({ ...v, youtubeUrl: v.youtube_url, createdAt: v.created_at })) || []);
            });
    };
    fetch();
    const channel = supabase.channel('support_videos').on('postgres_changes', { event: '*', schema: 'public', table: 'support_videos' }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const addSupportVideo = async (data: any) => {
    const payload = { title: data.title, description: data.description, youtube_url: data.youtubeUrl };
    const { error } = await supabase.from('support_videos').insert(payload);
    if (error) throw error;
};

export const deleteSupportVideo = async (id: string) => {
    const { error } = await supabase.from('support_videos').delete().eq('id', id);
    if (error) throw error;
};

export const subscribeToSupportFAQs = (callback: (data: any[]) => void) => {
    const fetch = () => {
        supabase.from('support_faqs').select('*').order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error) callback(data?.map(f => ({ ...f, createdAt: f.created_at })) || []);
            });
    };
    fetch();
    const channel = supabase.channel('support_faqs').on('postgres_changes', { event: '*', schema: 'public', table: 'support_faqs' }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const addSupportFAQ = async (data: any) => {
    const payload = { question: data.question, answer: data.answer };
    const { error } = await supabase.from('support_faqs').insert(payload);
    if (error) throw error;
};

export const deleteSupportFAQ = async (id: string) => {
    const { error } = await supabase.from('support_faqs').delete().eq('id', id);
    if (error) throw error;
};

export const subscribeToSupportContacts = (callback: (data: any) => void) => {
    const fetch = () => {
        supabase.from('support_contacts').select('*').single().then(({ data, error }) => {
            if (!error) callback(data);
        });
    };
    fetch();
    const channel = supabase.channel('support_contacts').on('postgres_changes', { event: '*', schema: 'public', table: 'support_contacts' }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const updateSupportContacts = async (id: string, data: { whatsapp: string, email: string }) => {
    const { error } = await supabase
        .from('support_contacts')
        .update(data)
        .eq('id', id);
    if (error) throw error;
};

export const createSupportContacts = async (data: { whatsapp: string, email: string }) => {
    const { error } = await supabase
        .from('support_contacts')
        .insert(data);
    if (error) throw error;
};

export const subscribeToSupportTickets = (schoolId: string | null, callback: (data: any[]) => void) => {
    const fetch = () => {
        let query = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
        if (schoolId) {
            query = query.eq('school_id', schoolId);
        }
        query.then(({ data, error }) => {
            if (!error) callback(data?.map(t => ({ ...t, schoolId: t.school_id, schoolName: t.school_name, createdAt: t.created_at, updatedAt: t.updated_at })) || []);
        });
    };
    fetch();
    const filter = schoolId ? `school_id=eq.${schoolId}` : undefined;
    const channel = supabase.channel(`support_tickets:${schoolId || 'all'}`).on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const createSupportTicket = async (data: any) => {
    const payload = { 
        school_id: data.schoolId, 
        school_name: data.schoolName, 
        subject: data.subject, 
        description: data.description,
        status: 'Open' 
    };
    const { data: newTicket, error } = await supabase.from('support_tickets').insert(payload).select().single();
    if (error) throw error;
    return newTicket;
};

export const updateSupportTicketStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
};

export const subscribeToTicketMessages = (ticketId: string, callback: (data: any[]) => void) => {
    const fetch = () => {
        supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true })
            .then(({ data, error }) => {
                if (!error) callback(data?.map(m => ({ ...m, ticketId: m.ticket_id, senderId: m.sender_id, senderRole: m.sender_role, createdAt: m.created_at })) || []);
            });
    };
    fetch();
    const channel = supabase.channel(`ticket_messages:${ticketId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const addTicketMessage = async (data: { ticketId: string, senderId: string, senderRole: string, message: string, imageUrl?: string }) => {
    const payload = { 
        ticket_id: data.ticketId, 
        sender_id: data.senderId, 
        sender_role: data.senderRole, 
        message: data.message,
        image_url: data.imageUrl 
    };
    const { error } = await supabase.from('ticket_messages').insert(payload);
    if (error) throw error;
    
    // Update ticket updated_at
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', data.ticketId);
};

// --- Course Management ---
export const subscribeToCourses = (schoolId: string, callback: (data: Course[]) => void) => {
    const fetch = () => {
        supabase.from('courses').select('*').eq('school_id', schoolId).order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (!error) callback(data?.map(c => ({
                    ...c,
                    schoolId: c.school_id,
                    subjectIds: c.subject_ids || [],
                    batchIds: c.batch_ids || [],
                    thumbnailUrl: c.thumbnail_url,
                    createdAt: c.created_at
                })) as Course[] || []);
            });
    };
    fetch();
    const channel = supabase.channel(`courses:${schoolId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'courses', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const addCourse = async (course: any) => {
    const payload = {
        school_id: course.schoolId,
        title: course.title,
        code: course.code,
        description: course.description,
        department: course.department,
        level: course.level,
        duration: course.duration,
        subject_ids: course.subjectIds,
        status: course.status || 'Active'
    };
    const { error } = await supabase.from('courses').insert(payload);
    if (error) throw error;
};

export const updateCourse = async (id: string, course: any) => {
    const payload = {
        title: course.title,
        code: course.code,
        description: course.description,
        department: course.department,
        level: course.level,
        duration: course.duration,
        subject_ids: course.subjectIds,
        status: course.status
    };
    const { error } = await supabase.from('courses').update(payload).eq('id', id);
    if (error) throw error;
};

export const deleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
};

// --- Syllabus & Curriculum Management ---
export const subscribeToSyllabusChapters = (subjectId: string, callback: (data: SyllabusChapter[]) => void) => {
    const fetch = () => {
        supabase.from('syllabus_chapters').select('*').eq('subject_id', subjectId).order('order', { ascending: true })
            .then(({ data, error }) => {
                if (!error) callback(data?.map(c => ({
                    ...c,
                    subjectId: c.subject_id,
                    expectedCompletionDate: c.expected_completion_date,
                    isCompleted: c.is_completed,
                    completedAt: c.completed_at
                })) as SyllabusChapter[] || []);
            });
    };
    fetch();
    const channel = supabase.channel(`syllabus_chapters:${subjectId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'syllabus_chapters', filter: `subject_id=eq.${subjectId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const addSyllabusChapter = async (chapter: any) => {
    const payload = {
        school_id: chapter.schoolId,
        subject_id: chapter.subjectId,
        name: chapter.name,
        description: chapter.description,
        order: chapter.order,
        expected_completion_date: chapter.expectedCompletionDate,
        is_completed: false
    };
    const { error } = await supabase.from('syllabus_chapters').insert(payload);
    if (error) throw error;
};

// --- Student Curriculum Progress Management ---
export const subscribeToStudentChapterProgress = (schoolId: string, classId: string, subjectId: string, callback: (data: any[]) => void) => {
    const fetch = () => {
        supabase.from('student_chapter_progress')
            .select('*')
            .eq('school_id', schoolId)
            .eq('class_id', classId)
            .eq('subject_id', subjectId)
            .then(({ data, error }) => {
                if (!error) {
                    callback(data || []);
                } else if (error.code === 'PGRST205') {
                    // Fallback if table doesn't exist yet (mock behavior for AI Studio previews)
                    const localData = localStorage.getItem(`student_prog_${classId}_${subjectId}`);
                    if (localData) {
                        try { callback(JSON.parse(localData)); } catch(e) { callback([]); }
                    } else {
                        callback([]);
                    }
                }
            });
    };
    fetch();
    const channel = supabase.channel(`sc_prog:${subjectId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'student_chapter_progress', filter: `subject_id=eq.${subjectId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const updateStudentChapterProgress = async (payload: { school_id: string; class_id: string; subject_id: string; student_id: string; chapter_id: string; is_completed: boolean }) => {
    // Attempt against Supabase table
    const { error } = await supabase.from('student_chapter_progress')
        .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'student_id, chapter_id' });
    
    if (error && error.code === 'PGRST205') {
        console.warn("Supabase table 'student_chapter_progress' missing. Falling back to localStorage.");
        // Fallback to local storage for seamless preview
        const key = `student_prog_${payload.class_id}_${payload.subject_id}`;
        let localData: any[] = [];
        try { localData = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}
        
        const existingIdx = localData.findIndex(item => item.student_id === payload.student_id && item.chapter_id === payload.chapter_id);
        if (existingIdx >= 0) {
            localData[existingIdx].is_completed = payload.is_completed;
        } else {
            localData.push(payload);
        }
        localStorage.setItem(key, JSON.stringify(localData));
        return; // success local
    }
    
    if (error) throw error;
};

// Service to handle bulk syllabus chapter creation for quick timeline generation
export const addSyllabusChaptersBulk = async (chapters: any[]) => {
    const payload = chapters.map(c => ({
        school_id: c.schoolId,
        subject_id: c.subjectId,
        name: c.name,
        description: c.description || '',
        order: c.order,
        expected_completion_date: c.expectedCompletionDate || null,
        is_completed: false
    }));
    const { error } = await supabase.from('syllabus_chapters').insert(payload);
    if (error) throw error;
};

export const subscribeToAllSyllabusChapters = (schoolId: string, callback: (data: SyllabusChapter[]) => void) => {
    const fetch = () => {
        supabase.from('syllabus_chapters').select('*').eq('school_id', schoolId)
            .then(({ data, error }) => {
                if (!error) callback(data?.map(c => ({
                    ...c,
                    schoolId: c.school_id,
                    subjectId: c.subject_id,
                    expectedCompletionDate: c.expected_completion_date,
                    isCompleted: c.is_completed,
                    completedAt: c.completed_at
                })) as SyllabusChapter[] || []);
            });
    };
    fetch();
    const channel = supabase.channel(`all_syllabus_chapters:${schoolId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'syllabus_chapters', filter: `school_id=eq.${schoolId}` }, fetch).subscribe();
    return () => { supabase.removeChannel(channel); };
};

export const updateSyllabusChapter = async (id: string, data: any) => {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.order !== undefined) payload.order = data.order;
    if (data.expectedCompletionDate !== undefined) payload.expected_completion_date = data.expectedCompletionDate;
    if (data.isCompleted !== undefined) {
        payload.is_completed = data.isCompleted;
        payload.completed_at = data.isCompleted ? new Date().toISOString() : null;
    }
    const { error } = await supabase.from('syllabus_chapters').update(payload).eq('id', id);
    if (error) throw error;
};

export const deleteSyllabusChapter = async (id: string) => {
    const { error } = await supabase.from('syllabus_chapters').delete().eq('id', id);
    if (error) throw error;
};
