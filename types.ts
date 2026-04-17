
// Fix: Add SchoolCategory enum
export enum SchoolCategory {
  MICRO = 'Micro',
  SMALL = 'Small',
  MEDIUM = 'Medium', // Corrected: Moved Medium to its own line
  LARGE = 'Large'
}

// Fix: Add SchoolStatus enum
export enum SchoolStatus {
  TRIAL = 'Trial',
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  EXPIRED = 'Expired'
}

export interface UserPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  language: string;
  twoFactorAuth: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'principal' | 'mother-admin' | 'staff';
  schoolId?: string;
  // Fix: Add optional phone property to UserProfile as it is used in profile pages.
  phone?: string;
  // FIX: Add optional photoURL property to support profile pictures.
  photoURL?: string;
  // Teacher-specific
  teacherId?: string;
  assignedClasses?: string[];
  // Student-specific
  studentDocId?: string;
  classId?: string;
  // Staff-specific
  staffPermissions?: Record<string, StaffPermission>;
  designation?: string;
  // Preferences
  preferences?: UserPreferences;
}

export interface StaffPermission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

// NEW: Dynamic Admission Form Field Configuration
export interface FormFieldConfig {
  id: string;         // System key (e.g., 'bForm', 'religion')
  label: string;      // Display Label (Editable)
  section: 'student' | 'academic' | 'parent' | 'contact' | 'history' | 'other' | 'documents' | 'registration' | 'health' | 'transport' | 'siblings';
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'image' | 'file' | 'principal_signature' | 'signature' | 'tel' | 'email';
  enabled: boolean;   // Visible in form?
  required: boolean;  // Validation required?
  options?: string[]; // For select types
  placeholder?: string;
}

export const BUILTIN_TEACHER_CONFIG: FormFieldConfig[] = [
  { id: 'teacherName', label: 'Full Name', type: 'text', section: 'student', required: true, enabled: true },
  { id: 'designation', label: 'Designation', type: 'text', section: 'academic', required: true, enabled: true },
  { id: 'email', label: 'Email Address', type: 'email', section: 'contact', required: true, enabled: true },
  { id: 'phone', label: 'Phone Number', type: 'tel', section: 'contact', required: true, enabled: true },
  { id: 'gender', label: 'Gender', type: 'select', section: 'student', required: true, enabled: true, options: ['Male', 'Female', 'Other'] },
  { id: 'dob', label: 'Date of Birth', type: 'date', section: 'student', required: true, enabled: true },
  { id: 'address', label: 'Home Address', type: 'textarea', section: 'contact', required: true, enabled: true },
  { id: 'cnic', label: 'CNIC', type: 'text', section: 'student', required: true, enabled: true },
  { id: 'qualification', label: 'Highest Qualification', type: 'text', section: 'academic', required: true, enabled: true },
  { id: 'experience', label: 'Years of Experience', type: 'number', section: 'academic', required: true, enabled: true },
  { id: 'joiningDate', label: 'Joining Date', type: 'date', section: 'registration', required: true, enabled: true },
  { id: 'emergencyName', label: 'Emergency Contact Name', type: 'text', section: 'contact', required: true, enabled: true },
  { id: 'emergencyRelation', label: 'Relationship', type: 'text', section: 'contact', required: true, enabled: true },
  { id: 'emergencyPhone', label: 'Emergency Phone Number', type: 'tel', section: 'contact', required: true, enabled: true },
];

export const BUILTIN_ADMISSION_CONFIG: FormFieldConfig[] = [
  { id: 'regNo', label: 'Registration Number', type: 'text', section: 'registration', required: true, enabled: true },
  { id: 'regDate', label: 'Registration Received On', type: 'date', section: 'registration', required: true, enabled: true },
  { id: 'studentName', label: 'Name', type: 'text', section: 'student', required: true, enabled: true },
  { id: 'studentId', label: 'Student ID', type: 'text', section: 'student', required: false, enabled: true },
  { id: 'dob', label: 'Date of Birth', type: 'date', section: 'student', required: true, enabled: true },
  { id: 'address', label: 'Home Address', type: 'textarea', section: 'contact', required: true, enabled: true },
  { id: 'city', label: 'City', type: 'text', section: 'contact', required: true, enabled: true },
  { id: 'state', label: 'State', type: 'text', section: 'contact', required: true, enabled: true },
  { id: 'zipCode', label: 'Zip Code', type: 'text', section: 'contact', required: false, enabled: true },
  { id: 'gender', label: 'Gender', type: 'select', section: 'student', required: true, enabled: true, options: ['Male', 'Female', 'Other'] },
  { id: 'previousSchool', label: 'Previous School (if any)', type: 'text', section: 'history', required: false, enabled: true },
  { id: 'guardianName', label: 'Guardian Name', type: 'text', section: 'parent', required: true, enabled: true },
  { id: 'guardianRelation', label: 'Relationship to Student', type: 'text', section: 'parent', required: true, enabled: true },
  { id: 'guardianPhone', label: 'Phone Number', type: 'tel', section: 'parent', required: true, enabled: true },
  { id: 'guardianEmail', label: 'Email Address', type: 'email', section: 'parent', required: false, enabled: true },
  { id: 'guardianAddress', label: 'Home Address (if different)', type: 'textarea', section: 'parent', required: false, enabled: true },
  { id: 'emergencyName', label: 'Emergency Contact Name', type: 'text', section: 'contact', required: true, enabled: true },
  { id: 'emergencyRelation', label: 'Relationship to Student', type: 'text', section: 'contact', required: true, enabled: true },
  { id: 'emergencyPhone', label: 'Emergency Phone Number', type: 'tel', section: 'contact', required: true, enabled: true },
  { id: 'hasAllergies', label: 'Does the student have any allergies?', type: 'select', section: 'health', required: false, enabled: true, options: ['Yes', 'No'] },
  { id: 'allergiesList', label: 'If yes, please list allergies', type: 'textarea', section: 'health', required: false, enabled: true },
  { id: 'hasMedicalConditions', label: 'Does the student have any medical conditions?', type: 'select', section: 'health', required: false, enabled: true, options: ['Yes', 'No'] },
  { id: 'medicalConditionsList', label: 'If yes, please specify medical condition', type: 'textarea', section: 'health', required: false, enabled: true },
  { id: 'undertakingDate', label: 'Date', type: 'date', section: 'other', required: true, enabled: true },
  { id: 'guardianSignature', label: 'Parent / Guardian Signature', type: 'signature', section: 'other', required: false, enabled: true },
  { id: 'photo', label: 'Student Photo', type: 'image', section: 'student', required: false, enabled: true }
];

// NEW: Interface for Custom Field Definitions (Legacy support)
export interface CustomFieldDef {
  id: string;
  label: string; // e.g., "CNIC", "Joining Date"
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[]; // Comma separated options for select
  required: boolean;
}

// NEW: ID Card Configuration Types
export interface AdmissionFormElement {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number; // px relative to base
  color: string;
  visible: boolean;
  width?: number | string; // px or % for images
  height?: number | string;
  rotation?: number; // NEW: Rotation in degrees
  opacity?: number; // NEW: Opacity 0-1
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  label?: string; // Display label
  type?: 'text' | 'image' | 'principal_signature' | 'signature'; // Helper to distinguish text vs image elements
  prefix?: string;
  borderRadius?: number;
  page?: number; // NEW: For multi-page admission forms (0-indexed)
  letterSpacing?: number; // NEW: For letter-box (comb) fields
  isComb?: boolean; // NEW: Whether it's a letter-box field
  combCount?: number; // NEW: Number of boxes in the comb
  locked?: boolean; // NEW: To prevent accidental movement
}

export interface IDCardConfig {
  templateUrl: string; // Front Background
  backTemplateUrl?: string; // NEW: Back Background
  orientation: 'portrait' | 'landscape';
  // CHANGED: Use Record<string, ...> to allow fully dynamic keys (name, rollNo, custom_1, etc.)
  elements: Record<string, AdmissionFormElement>; // Front Elements
  backElements?: Record<string, AdmissionFormElement>; // NEW: Back Elements
}

// NEW: Admission Form Overlay Configuration
export interface AdmissionFormOverlayConfig {
  templateUrl: string; // Legacy support (Page 0)
  pages?: string[]; // NEW: Array of template URLs for multi-page forms
  elements: Record<string, AdmissionFormElement>; // Mapping fields to coordinates
}

// NEW: Structure for Student Documents
export interface StudentDocument {
  id: string;
  name: string; // e.g., "B-Form"
  url: string;
  type: string; // mime type
  uploadedAt: string;
}

export interface School {
  id: string;
  schoolCode?: string; // NEW: The human-readable ID (e.g. SCH-1234)
  name: string;
  logoURL: string;
  bannerURLs?: string[]; // NEW: Custom school banner/poster URLs
  themeColor: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  isLearningHubEnabled?: boolean;
  // NEW: Smart ID Configuration
  smartIdConfig?: {
    isEnabled: boolean;
    uniformImageURL?: string;
    backgroundColor?: string;
  };
  // NEW: Admission Form Configuration (The Builder State)
  admissionFormConfig?: FormFieldConfig[];
  // NEW: Admission Form Settings (e.g. Page Size)
  admissionFormSettings?: {
    pageSize: 'a4' | 'legal';
    pageLayout?: 'single' | 'double'; // NEW: Controls 1 Page vs 2 Pages
    showChecklist?: boolean; // NEW: Toggle for the 3 document check points in Step 4
  };
  // NEW: Teacher Form Configuration (The Builder State)
  teacherFormConfig?: FormFieldConfig[];
  // NEW: Teacher Form Settings
  teacherFormSettings?: {
    pageSize: 'a4' | 'legal';
    pageLayout?: 'single' | 'double';
    showChecklist?: boolean;
  };
  // NEW: Store custom field definitions for teachers
  teacherFieldConfig?: CustomFieldDef[]; 
  // NEW: Store custom field definitions for students (Legacy - kept for compatibility)
  studentFieldConfig?: CustomFieldDef[];
  // NEW: ID Card Configuration
  idCardConfig?: IDCardConfig;
  // NEW: Admission Form Overlay Configuration
  admissionFormOverlayConfig?: AdmissionFormOverlayConfig;
  // NEW: Teacher Form Overlay Configuration
  teacherFormOverlayConfig?: AdmissionFormOverlayConfig;
  feeConfig?: {
    classFees: { [classId: string]: number };
    admissionFee: number;
    annualCharges: number;
    lateFeeFine: number;
    paymentMethods: {
      cash: boolean;
      easypaisa: boolean;
      jazzcash: boolean;

      bank: boolean;
    };
    paymentInstructions: string;
    // New: Add masterTemplate to feeConfig
    masterTemplate?: {
      month: string;
      issueDate: string;
      dueDate: string;
      validDate: string;
      lateFine: number;
      bankDetails: string;
      accountNo: string;
      accountTitle: string;
      branchName: string; // Added for completeness, if used
      mobileDetails: string;
      signatureURL: string;
      stampURL: string;
      dynamicFeeItems: { id: string; label: string; amount: number; }[]; // New dynamic fee items
      // Old fields might still be there for backward compatibility but dynamicFeeItems will be preferred
      // Fix: Add 'theme' property
      theme?: string; 
      // NEW: Challan Customization
      backgroundImageURL?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };
  // NEW: EasyPaisa payment gateway configuration
  easyPaisaConfig?: {
    enabled: boolean;
    sandboxMode: boolean;
    merchantId: string;
    hashKey: string; // Sensitive, for server-side use normally
    storeId: string;
    integrationDetails: string; // E.g., API endpoint URL or general instructions
  };
  // NEW: Timetable configuration (existing or new structure)
  timetableConfig?: {
    slots?: { label: string; type: string }[];
    fullHolidays?: { [day: string]: boolean };
    masterStructure?: { startTime: string; endTime: string; isBreak: boolean; label: string }[];
    dayStructures?: { [day: string]: { startTime: string; endTime: string; isBreak: boolean; label: string }[] };
    // NEW: Timetable Customization
    backgroundImageURL?: string;
    headerBgColor?: string;
    cellBorderColor?: string;
    headerTextColor?: string;
  };
  // NEW: Social Media Integration
  socialMediaConfig?: {
    facebook?: {
      pageId: string;
      pageName: string;
      accessToken: string;
      connectedAt: string;
    };
    instagram?: {
      accountId: string;
      accountName: string;
      accessToken: string;
      connectedAt: string;
    };
  };
  // NEW: Parent Management Auto-Matching Configuration
  parentMatchingFields?: string[];
}

export interface Parent {
  id: string;
  schoolId: string;
  fatherName: string;
  cnic: string; // Unique Identifier
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
  childrenIds: string[]; // Array of Student IDs
  createdAt?: any;
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  admissionNo?: string; // Added: Admission number
  classId: string;
  fatherName: string;
  monthlyFee?: number;
  discountAmount?: number;
  category?: 'New' | 'Old';
  phone?: string; // New: Add phone number for student/parent communication
  email?: string; // Added: Login email
  admissionDate?: string; // Added: Admission date
  status?: 'Active' | 'Inactive' | 'Pending'; // Added: Student status
  photoURL?: string;
  gender?: string; // Added
  dob?: string; // Added
  feeStatus?: 'Paid' | 'Unpaid';
  totalPoints?: number; // NEW: Gamification Score (Kahoot style)
  idCardURL?: string; // NEW: Digital ID Card URL (Legacy)
  issuedIdCard?: Record<string, string>; // NEW: Stores the manually issued ID card data fields
  // NEW: Custom Data
  customData?: Record<string, any>;
  // NEW: Uploaded Documents Vault
  documents?: StudentDocument[];
  parentId?: string; // Link to Parent
  cnic?: string; // Student CNIC/B-Form
  loginId?: string; // NEW: System Login ID (e.g. MOI1234)
  auth_status?: 'pending' | 'active'; // NEW: Auth status
}

// NEW: Interface for Enquiry/Leads
export interface Enquiry {
  id?: string;
  schoolId: string;
  studentName: string;
  parentName: string;
  phone: string;
  previousSchool?: string;
  classInterested: string; // Class ID or Name
  status: 'New' | 'Follow Up' | 'Interview' | 'Admitted' | 'Rejected';
  source?: 'Walk-in' | 'Phone' | 'Referral' | 'Social Media';
  notes?: string;
  followUpDate?: string;
  createdAt: any;
}

// NEW: Expense Interface
export interface Expense {
  id?: string;
  schoolId: string;
  title: string;
  amount: number;
  category: 'Utilities' | 'Maintenance' | 'Salaries' | 'Supplies' | 'Refreshment' | 'Other';
  date: string; // YYYY-MM-DD
  notes?: string;
  recordedBy: string;
  createdAt: any;
}

// NEW: Interface for Student Personal Notes
export interface StudentNote {
  id?: string;
  title: string;
  content: string;
  color: 'white' | 'yellow' | 'blue' | 'rose' | 'green';
  createdAt: any;
  updatedAt?: any;
}

export interface Teacher {
  id: string;
  name: string;
  email?: string; // Added: Login email
  phone?: string; // Added: Phone number
  designation: string;
  gender?: string; // Added: Gender
  // NEW: Added photoURL
  photoURL?: string;
  // NEW: Store values for custom fields (e.g. { "CNIC": "42101...", "Blood Group": "B+" })
  customData?: { [key: string]: any }; 
  // NEW: Document Vault for Teachers
  documents?: StudentDocument[];
  loginId?: string; // NEW: System Login ID (e.g. MOI1234)
  auth_status?: 'pending' | 'active'; // NEW: Auth status
}

// New: A reference to a teacher with essential info for embedding.
export interface TeacherReference {
  id: string;
  name: string;
  photoURL?: string; // Added: Photo URL
}

// New: A proper interface for the Class data structure.
export interface Class {
  id: string;
  name: string;
  section?: string; // NEW: Section name (e.g. A, B, C)
  classTeacher?: TeacherReference | null;
  subjectAssignments?: { [subjectId: string]: TeacherReference | null };
  involvedTeachers?: string[];
  // NEW: Operational Fields
  classMonitor?: string;
  roomNumber?: string;
  floor?: string;
  startTime?: string;
  endTime?: string;
}

// Fix: Add Subject interface
export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  coverImageURL?: string;
  classId?: string;
  sectionId?: string;
}

// Fix: Correct TimetableSlot interface
export interface TimetableSlot {
  id: string;
  day: string;
  timeSlot: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  schoolId: string;
}

export interface TeacherAttendanceRecord {
  id?: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave' | 'Late';
  schoolId: string;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave';
  schoolId: string;
  classId: string;
  teacherId: string;
  timeIn?: string;
}

export interface FeeTransaction {
  id?: string;
  studentId: string;
  studentName: string;
  classId: string;
  month: string;
  amountPaid: number;
  fineAmount: number;
  discountAmount: number;
  // Fix: Add 'Challan' as a valid payment method
  paymentMethod: 'Cash' | 'EasyPaisa' | 'JazzCash' | 'Bank' | 'Challan';
  transactionId?: string;
  receiptNo: string;
  timestamp: any;
  status: 'Success' | 'Pending' | 'Failed';
  remarks?: string;
  recordedBy: string;
  // NEW: EasyPaisa specific transaction details
  easyPaisaPaymentUrl?: string; // URL for the student to pay
  easyPaisaOrderId?: string;    // Unique order ID from EasyPaisa
  // NEW: Properties for ledger
  type?: 'payment' | 'challan';
  amount?: number;
  date?: string;
  description?: string;
}

export interface Announcement {
  id?: string;
  content: string;
  timestamp: any;
  teacherId: string;
  schoolId: string;
  classId: string;
  is_popup?: boolean;
  media_url?: string;
  media_type?: 'image' | 'video';
  start_date?: string;
  end_date?: string;
}

export interface Assignment {
  id?: string;
  title: string;
  instructions: string;
  fileURL?: string;
  dueDate: any; // Firestore timestamp
  subjectId: string;
  classId: string;
  teacherId: string;
  schoolId: string;
  createdAt: any;
}

export interface Exam {
  id?: string;
  title: string;
  classId: string;
  subjectId: string;
  date: any;
  totalMarks: number;
  teacherId: string;
  schoolId: string;
}

export interface Mark {
  id?: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  teacherId: string;
  schoolId: string;
}

export interface Resource {
  id?: string;
  title: string;
  url?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  schoolId: string;
  type: 'link' | 'book' | 'youtube_playlist';
  fileURL?: string;
  fileName?: string;
  mimeType?: string;
  description?: string; // Add description for Learning Hub
  downloadCount?: number;
  createdAt?: number;
}

// NEW: Interface for Daily Class Log
export interface ClassLog {
  id?: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  content: string;
  b2File?: {
    fileName: string;
    fileId: string;
  };
  createdAt: any;
  type: 'classwork' | 'homework';
  file?: File; // For uploading
}

// NEW: Interfaces for Curriculum Hub
export enum TopicDifficulty {
  EASY = 'Easy',
// Fix: Complete enum and add missing Curriculum Hub interfaces
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export interface SyllabusChapter {
  id: string;
  name: string;
  content?: string;
}

export interface SyllabusTopic {
  id:string;
  title: string;
  description: string;
  difficulty: TopicDifficulty;
  duration: number; // in hours
  chapterId: string;
}

export interface GraphicalSyllabus {
  courseTitle: string;
  courseDescription: string;
  units: {
    title: string;
    sourceMaterial: string;
    topics: {
      title: string;
      learningOutcomes: string[];
      duration: string;
    }[];
  }[];
}

export type GraphicalPlanActivityType = 'Chapter' | 'Assessment' | 'Revision' | 'Holiday' | 'Activity';

export interface GraphicalPlanActivity {
    type: GraphicalPlanActivityType;
    description: string;
}

export interface GraphicalAcademicPlan {
    courseTitle: string;
    sessionDuration: string;
    terms: {
        title: string;
        weeks: {
            weekLabel: string;
            days: {
                dayName: string;
                date: string;
                activities: GraphicalPlanActivity[];
            }[];
        }[];
    }[];
}

export interface SavedAcademicPlan {
    id: string;
    teacherId: string;
    classId: string;
    subjectId: string;
    planData: GraphicalAcademicPlan;
    createdAt?: any;
    updatedAt?: any;
}

export interface SyllabusOutline {
  id: string;
  subjectId: string;
  classId: string;
  outlineData: any; 
}

export interface Curriculum {
    id: string;
    schoolId: string;
    subjectId: string;
    classId: string;
    teacherId: string;
    syllabus?: GraphicalSyllabus;
    academicPlan?: GraphicalAcademicPlan;
}

// NEW: Interfaces for Global AI Learning Hub
export interface LearningResource {
  id?: string;
  title: string;
  platform: 'YouTube';
  description: string;
  url: string;
  channel: string;
  videoCount?: number;
  thumbnailUrl?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  rating?: number;
  channelLogoUrl?: string;
  subscriberCount?: string;
  subscriberCountRaw?: number;
  category?: string;
  createdAt?: any;
}

// NEW: Interface for YouTube Channel Search Results
export interface LearningChannel {
  channelName: string;
  platform: 'YouTube';
  description: string;
  url: string;
  subscriberCount: string;
}

// NEW: Interfaces for Live Quiz Feature
export interface QuizQuestion {
  id: string;
  questionText: string;
  options: { text: string; isCorrect: boolean }[];
  timeLimit: number; // seconds
  points: number;
}

export interface LiveQuiz {
  id?: string;
  title: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  schoolId: string;
  questions: QuizQuestion[];
  scheduledAt: any; // Firestore Timestamp
  endTime?: any; // NEW: End Time
  duration: number; // minutes
  status: 'Draft' | 'Scheduled' | 'Live' | 'Completed';
  submissions?: number;
  createdAt: any;
}

export interface QuizSubmission {
  id?: string;
  quizId: string;
  studentId: string;
  studentName: string;
  answers: { questionId: string; selectedOptionIndex: number; score: number }[];
  totalScore: number;
  timeTaken: number; // seconds
  submittedAt: any;
}

// NEW: Interface for Game Section Questions
export interface GameQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
}

// NEW: Interface for Complaints
export interface Complaint {
  id: string;
  schoolId: string;
  studentId?: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  submittedBy: string;
  date?: string; // Formatted date for UI
  createdAt?: any;
  mediaUrls?: string[]; // Optional array of image/video URLs
  mediaUrl?: string; // Legacy/Single attachment support
  mediaType?: 'image' | 'video' | 'file';
}

export interface ActivityLog {
  id?: string;
  schoolId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  category: 'Student' | 'Teacher' | 'Fee' | 'Academic' | 'System' | 'Settings' | 'Expense' | 'Enquiry' | 'Attendance';
  timestamp: any;
}

export interface SupportVideo {
  id: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  createdAt: string;
}

export interface SupportFAQ {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface SupportContact {
  id: string;
  whatsapp: string;
  email: string;
}

export interface SupportTicket {
  id: string;
  schoolId: string;
  schoolName?: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'mother-admin' | 'principal';
  message: string;
  createdAt: string;
}
