
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

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'principal' | 'mother-admin';
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
}

// NEW: Interface for Custom Field Definitions
export interface CustomFieldDef {
  id: string;
  label: string; // e.g., "CNIC", "Joining Date"
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[]; // Comma separated options for select
  required: boolean;
}

// NEW: ID Card Configuration Types
export interface IDCardElementConfig {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number; // px relative to base
  color: string;
  visible: boolean;
  width?: number; // px or % for images
  height?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  label?: string; // Display label
  type?: 'text' | 'image'; // Helper to distinguish text vs image elements
}

export interface IDCardConfig {
  templateUrl: string; // Front Background
  backTemplateUrl?: string; // NEW: Back Background
  orientation: 'portrait' | 'landscape';
  // CHANGED: Use Record<string, ...> to allow fully dynamic keys (name, rollNo, custom_1, etc.)
  elements: Record<string, IDCardElementConfig>; // Front Elements
  backElements?: Record<string, IDCardElementConfig>; // NEW: Back Elements
}

// NEW: Structure for Student/Teacher Documents
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
  themeColor: string;
  isLearningHubEnabled?: boolean;
  // NEW: Store custom field definitions for teachers
  teacherFieldConfig?: CustomFieldDef[]; 
  // NEW: Store custom field definitions for students
  studentFieldConfig?: CustomFieldDef[];
  // NEW: ID Card Configuration
  idCardConfig?: IDCardConfig;
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
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  classId: string;
  fatherName: string;
  monthlyFee?: number;
  discountAmount?: number;
  category?: 'New' | 'Old';
  phone?: string; // New: Add phone number for student/parent communication
  photoURL?: string;
  feeStatus?: 'Paid' | 'Unpaid';
  totalPoints?: number; // NEW: Gamification Score (Kahoot style)
  idCardURL?: string; // NEW: Digital ID Card URL (Legacy)
  issuedIdCard?: Record<string, string>; // NEW: Stores the manually issued ID card data fields
  // NEW: Custom Data
  customData?: Record<string, any>;
  // NEW: Uploaded Documents Vault
  documents?: StudentDocument[];
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
  designation: string;
  // NEW: Added photoURL
  photoURL?: string;
  // NEW: Store values for custom fields (e.g. { "CNIC": "42101...", "Blood Group": "B+" })
  customData?: { [key: string]: string }; 
  // NEW: Document Vault for Teachers
  documents?: StudentDocument[];
}

// New: A reference to a teacher with essential info for embedding.
export interface TeacherReference {
  id: string;
  name: string;
}

// New: A proper interface for the Class data structure.
export interface Class {
  id: string;
  name: string;
  classTeacher?: TeacherReference | null;
  subjectAssignments?: { [subjectId: string]: TeacherReference | null };
  involvedTeachers?: string[];
}

// Fix: Add Subject interface
export interface Subject {
  id: string;
  schoolId: string;
  name: string;
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

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave';
  schoolId: string;
  classId: string;
  teacherId: string;
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
}

export interface Announcement {
  id?: string;
  content: string;
  timestamp: any;
  teacherId: string;
  schoolId: string;
  classId: string;
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
  duration: number; // minutes
  status: 'Draft' | 'Scheduled' | 'Live' | 'Completed';
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
