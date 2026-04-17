
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types.ts';
import { supabase } from '../services/supabase.ts';

// Helper to map Supabase User Profile to App UserProfile
const mapProfile = (data: any, uid: string): UserProfile => ({
  uid: uid,
  name: data.name || '',
  email: data.email || '',
  role: data.role || 'student',
  schoolId: data.school_id,
  teacherId: data.teacher_id,
  studentDocId: data.student_id,
  classId: data.class_id || ((d: any) => d.students ? d.students.class_id : undefined)(data),
  photoURL: data.photo_url,
  phone: data.phone,
  preferences: data.preferences,
});

export const useAuth = () => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentUserIdRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<any>(null);
  const profileFetchRetries = useRef(0); // Track retries for missing profile
  const MAX_RETRIES = 3; // Stop after 3 attempts

  // Define Mock Users for fallback/demo access
  const MOCK_USERS: Record<string, any> = {};

  useEffect(() => {
    // 0. FAILSAFE TIMER: If loading takes more than 8 seconds, force stop it.
    const safetyTimer = setTimeout(() => {
        setLoading((prevLoading) => {
            if (prevLoading) {
                console.warn("EduControl: Auth check timed out. Forcing release.");
                return false;
            }
            return prevLoading;
        });
    }, 8000);

    // 1. Check for Generic Mock Session
    const mockSessionStr = localStorage.getItem('edu_mock_session');
    if (mockSessionStr) {
      try {
        const mockData = JSON.parse(mockSessionStr);
        setUser({ id: mockData.uid, email: mockData.email });
        setProfile({
            uid: mockData.uid,
            name: mockData.name,
            email: mockData.email,
            role: mockData.role,
            schoolId: mockData.schoolId,
            classId: mockData.classId
        });
        currentUserIdRef.current = mockData.uid;
        setLoading(false);
        clearTimeout(safetyTimer);
        return;
      } catch (e) {
        console.error("Failed to parse mock session", e);
        localStorage.removeItem('edu_mock_session');
      }
    }

    // 2. Backward compatibility for specific admin key
    const isMockAdmin = localStorage.getItem('edu_mock_admin_session');
    if (isMockAdmin === 'true') {
      const mockUser = MOCK_USERS['admin@ilmaura.com'];
      setUser({ id: mockUser.uid, email: 'admin@ilmaura.com' });
      setProfile({ uid: mockUser.uid, name: mockUser.name, email: 'admin@ilmaura.com', role: 'mother-admin' });
      currentUserIdRef.current = mockUser.uid;
      setLoading(false);
      clearTimeout(safetyTimer);
      return;
    }

    // 3. Check active Supabase session
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error("EduControl: Initial session check error:", sessionError);
            // If it's a critical auth error, clear the session to allow clean login
            if (sessionError.message?.includes('JWT') || sessionError.message?.includes('invalid_grant')) {
                await supabase.auth.signOut();
            }
        }

        if (session?.user) {
          if (currentUserIdRef.current !== session.user.id) {
             await handleUserSession(session.user);
          } else {
             setLoading(false); 
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Session check failed", err);
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (currentUserIdRef.current !== session.user.id) {
            handleUserSession(session.user);
        }
      } else if (!localStorage.getItem('edu_mock_session') && !localStorage.getItem('edu_mock_admin_session')) {
        if (currentUserIdRef.current !== null) {
            setUser(null);
            setProfile(null);
            currentUserIdRef.current = null;
        }
        setLoading(false);
      }
    });

    return () => {
        subscription.unsubscribe();
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        clearTimeout(safetyTimer);
    };
  }, []);

  const handleUserSession = async (authUser: any) => {
    currentUserIdRef.current = authUser.id; 
    setUser(authUser);
    
    try {
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error("useAuth: Profile fetch error:", error);
          // 0. CRITICAL: Handle JWT Expired (PGRST303)
          if (error.code === 'PGRST303' || (error.message && error.message.includes('JWT expired'))) {
              if (profileFetchRetries.current < MAX_RETRIES) {
                  console.warn("EduControl: JWT expired detected. Attempting silent refresh...");
                  profileFetchRetries.current += 1;
                  
                  try {
                      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                      if (!refreshError && refreshData.session) {
                          console.log("EduControl: Token refreshed successfully. Retrying profile fetch...");
                          // Retry the session handling with the new session user
                          return handleUserSession(refreshData.session.user);
                      }
                  } catch (refreshEx) {
                      console.error("EduControl: Silent refresh exception:", refreshEx);
                  }
              }

              console.error("EduControl: Session expired (JWT) and refresh failed or max retries reached. Forcing logout.");
              setError("Your session has expired. Please log in again.");
              setLoading(false);
              await logout(false); // Use the logout function but keep the error message
              return;
          }

          // NETWORK ERROR HANDLING
          if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Network request failed'))) {
              if (profileFetchRetries.current < MAX_RETRIES) {
                  console.warn("Network glitch during profile fetch. Retrying in 2s...");
                  profileFetchRetries.current += 1;
                  if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
                  retryTimeoutRef.current = setTimeout(() => handleUserSession(authUser), 2000);
                  return; // Keep loading true
              }
          }

          // SYSTEM UPDATE: Handle "Row not found" (PGRST116) or missing data
          if (error.code === 'PGRST116' || !data) {
              
              // RACE CONDITION MITIGATION: Simple Retry first
              if (profileFetchRetries.current < 2) {
                  const delay = 500; 
                  profileFetchRetries.current += 1;
                  if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
                  retryTimeoutRef.current = setTimeout(() => handleUserSession(authUser), delay);
                  return;
              }

              console.warn(`Profile missing for ${authUser.id}. Initiating Self-Healing Protocol...`);
              
              let repairData: any = null;
              const meta = authUser.user_metadata;

              // STRATEGY 1: Metadata Repair (Fastest)
              if (meta && (meta.role || meta.schoolId)) {
                  repairData = {
                      id: authUser.id,
                      email: authUser.email,
                      name: meta.name || meta.full_name || 'User',
                      role: meta.role || 'student', // Fallback role
                      school_id: meta.schoolId || meta.school_id,
                      teacher_id: meta.teacherDbId || meta.teacher_id,
                      student_id: meta.studentDocId || meta.student_id
                  };
              }

              // STRATEGY 2: Reverse Lookup Repair (Deep Search - Slower but Robust)
              if (!repairData || !repairData.school_id) {
                  console.log("Metadata insufficient. Attempting reverse table lookup...");
                  
                  // Check Teachers Table
                  const { data: teacherRow } = await supabase.from('teachers').select('*').eq('uid', authUser.id).single();
                  if (teacherRow) {
                      repairData = {
                          id: authUser.id,
                          email: authUser.email,
                          name: teacherRow.name,
                          role: 'teacher',
                          school_id: teacherRow.school_id,
                          teacher_id: teacherRow.id
                      };
                  } else {
                      // Check Students Table
                      const { data: studentRow } = await supabase.from('students').select('*').eq('uid', authUser.id).single();
                      if (studentRow) {
                           repairData = {
                              id: authUser.id,
                              email: authUser.email,
                              name: studentRow.name,
                              role: 'student',
                              school_id: studentRow.school_id,
                              student_id: studentRow.id
                          };
                      } else {
                           // Check Schools (Principal)
                           const { data: schoolRow } = await supabase.from('schools').select('*').eq('principalId', authUser.id).single();
                           if (schoolRow) {
                               repairData = {
                                  id: authUser.id,
                                  email: authUser.email,
                                  name: 'Principal', // Fallback name
                                  role: 'principal',
                                  school_id: schoolRow.id
                              };
                           }
                      }
                  }
              }

              // EXECUTE REPAIR
              if (repairData) {
                  console.log("Repairing profile with recovered data:", repairData);
                  // Use upsert to be safe against race conditions where it might have just been created
                  try {
                      const { error: insertError } = await supabase.from('user_profiles').upsert(repairData);

                      if (!insertError) {
                          // Immediate Retry Fetch
                          const { data: retryData, error: retryError } = await supabase
                              .from('user_profiles')
                              .select('*')
                              .eq('id', authUser.id)
                              .single();
                          
                          if (retryData && !retryError) {
                              data = retryData; // Repair successful, proceed normally
                              error = null;
                              profileFetchRetries.current = 0; // Reset retries on success
                          } else {
                              console.error("Repair verification failed:", retryError);
                          }
                      } else {
                          console.error("Profile auto-repair insert failed:", insertError);
                          // If repair failed due to JWT, it will be caught in the next cycle or handled by the error check below
                      }
                  } catch (e) {
                      console.error("Exception during repair:", e);
                  }
              } else {
                  console.error("Auto-repair failed: Could not determine user context from metadata or reverse lookup.");
              }
          }
          
          // If error persists (repair failed or other error)
          if (error && !data) {
              console.error("CRITICAL: Profile missing/error for ID:", authUser.id);
              
              // TRANSIENT FALLBACK: Use Auth Metadata to construct a temporary profile in-memory
              const meta = authUser.user_metadata;
              if (meta && meta.role && meta.schoolId) {
                  console.warn("Using Transient Auth Metadata Profile (DB Sync Failed).");
                  
                  const fallbackProfile: UserProfile = {
                      uid: authUser.id,
                      email: authUser.email,
                      name: meta.name || meta.full_name || 'User',
                      role: meta.role,
                      schoolId: meta.schoolId,
                      studentDocId: meta.studentDocId || meta.student_id,
                      teacherId: meta.teacherDbId || meta.teacher_id, 
                      phone: meta.phone
                  };

                  // If student, try to get classId if possible
                  if (fallbackProfile.role === 'student' && fallbackProfile.studentDocId) {
                       try {
                           const { data: sData } = await supabase.from('students').select('class_id').eq('id', fallbackProfile.studentDocId).single();
                           if (sData) fallbackProfile.classId = sData.class_id;
                       } catch (e) { console.warn("Fallback class fetch failed"); }
                  }

                  setProfile(fallbackProfile);
                  setError(null);
                  setLoading(false);
                  return;
              }

              // FAIL SAFE: Stop infinite loading
              // Force logout so user can try again
              console.error("Forcing logout due to missing profile");
              await supabase.auth.signOut();
              setError("Login Error: User profile could not be loaded. Please contact support.");
              setLoading(false);
              return;
          }
      }

      if (data) {
        // Reset retries on success
        profileFetchRetries.current = 0;

        const userProfile = {
            uid: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            schoolId: data.school_id,
            teacherId: data.teacher_id,
            studentDocId: data.student_id,
            photoURL: data.photo_url,
            phone: data.phone,
            preferences: data.preferences || authUser.user_metadata?.preferences,
            classId: undefined
        };
        
        // Fetch Class ID and Photo URL for students (nested or direct)
        if (userProfile.role === 'student' && userProfile.studentDocId) {
             const { data: sData } = await supabase.from('students').select('class_id, photo_url').eq('id', userProfile.studentDocId).single();
             if (sData) {
                 userProfile.classId = sData.class_id;
                 if (sData.photo_url) userProfile.photoURL = sData.photo_url;
             }
        }

        // FIX: Ensure Teacher ID is correct
        if (userProfile.role === 'teacher') {
            const { data: tData } = await supabase.from('teachers').select('id').eq('uid', authUser.id).single();
            if (tData) {
                userProfile.teacherId = tData.id;
            }
        }
        
        // Security Check: Verify School Context
        const activeSchoolId = localStorage.getItem('active_school_portal_id');
        if (activeSchoolId && userProfile.role !== 'mother-admin' && userProfile.schoolId !== activeSchoolId) {
          if (userProfile.schoolId !== 'demo-school-id') {
             setError(`Login Failed: This account belongs to a different school (${userProfile.schoolId}). Please logout and use the correct portal.`);
             await supabase.auth.signOut();
             setProfile(null);
             currentUserIdRef.current = null;
             setLoading(false);
             return;
          }
        }
        
        setProfile(userProfile as UserProfile);
        setError(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      
      // Retry logic with MAX LIMIT
      if (profileFetchRetries.current < MAX_RETRIES) {
          profileFetchRetries.current += 1;
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => handleUserSession(authUser), 3000);
      } else {
          console.error("Max retries reached. Forcing logout.");
          setError("Failed to load user profile after multiple attempts.");
          setLoading(false);
          await supabase.auth.signOut();
      }
      return; 
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    profileFetchRetries.current = 0; // Reset retries on new login attempt
    
    const lowerEmail = email.trim().toLowerCase();

    // MOCK LOGIN BYPASS
    let localMocks = {};
    try { localMocks = JSON.parse(localStorage.getItem('edu_demo_users') || '{}'); } catch(e) {}
    const ALL_MOCK_USERS = { ...MOCK_USERS, ...localMocks };

    if (ALL_MOCK_USERS[lowerEmail] && ALL_MOCK_USERS[lowerEmail].password === password) {
        const mock = ALL_MOCK_USERS[lowerEmail];
        localStorage.setItem('edu_mock_session', JSON.stringify({
            uid: mock.uid, email: lowerEmail, name: mock.name, role: mock.role, schoolId: mock.schoolId, classId: mock.classId
        }));
        setUser({ id: mock.uid, email: lowerEmail });
        setProfile({ uid: mock.uid, name: mock.name, email: lowerEmail, role: mock.role as any, schoolId: mock.schoolId, classId: mock.classId });
        currentUserIdRef.current = mock.uid;
        setLoading(false);
        return true;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: lowerEmail,
        password: password,
      });

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("Login failed:", err);
      
      if (err.message && err.message.includes("Email logins are disabled")) {
          setError("System Error: Email logins disabled. Please contact admin.");
      } else if (err.message && err.message.includes("Invalid login credentials")) {
          setError("Incorrect email or password.");
      } else if (err.message && err.message.includes("Email not confirmed")) {
          setError("Access Denied: Please verify your email address first. Check your inbox for the confirmation link.");
      } else {
          setError(err.message || "Login failed.");
      }
      
      setLoading(false);
      return false;
    }
  };

  const logout = async (clearError = true) => {
    try {
      if (clearError) setError(null);
      localStorage.removeItem('edu_mock_session');
      localStorage.removeItem('edu_mock_admin_session');
      await supabase.auth.signOut();
      sessionStorage.removeItem('selectedPortal');
      // DO NOT clear active_school_portal_id to keep user on School Login Gate
      sessionStorage.removeItem('dev_return_to');
      setUser(null);
      setProfile(null);
      currentUserIdRef.current = null;
    } catch (e) {
      setError("Logout failed.");
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await handleUserSession(user);
    }
  };

  return (
    { user, profile, loading, error, login, logout, refreshProfile }
  );
};
