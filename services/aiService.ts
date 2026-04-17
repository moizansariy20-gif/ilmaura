
import { Curriculum, SyllabusChapter, GraphicalSyllabus, GraphicalAcademicPlan, Class, Teacher, Subject, LearningResource, LearningChannel, TeacherReference, Student, TimetableSlot } from '../types.ts';

// NOTE: AI Features have been completely disabled.
// This file now acts as a "Template Generator" to ensure app stability without external APIs.

export const getRevenueInsights = async (schools: any[], principals: any[]): Promise<string> => {
    return "Revenue tracking active. Check charts for detailed breakdown.";
};

export const generatePrincipalInsights = async (
    schoolName: string,
    studentCount: number,
    attendancePercentage: number,
    presentToday: number,
    teacherCount: number,
    classCount: number
): Promise<string> => {
    if (attendancePercentage < 75) {
        return "Attendance is below 75%. Consider sending a reminder to parents.";
    }
    return "Operations are running smoothly. Attendance is healthy.";
};

export const generateParentCommunication = async (
    student: Student,
    className: string,
    type: 'performance' | 'fee_reminder',
    schoolName: string
): Promise<string> => {
    if (type === 'performance') {
        return `Dear Parent, This is to inform you that ${student.name} is performing well in ${className}. We appreciate your support. - ${schoolName} Admin`;
    } else if (type === 'fee_reminder') {
        const fee = student.monthlyFee || 0;
        return `Dear Parent, A gentle reminder that the fee of Rs. ${fee} for ${student.name} is due. Please clear it at your earliest convenience. - ${schoolName} Accounts`;
    }
    return "";
};

export const generateLessonPlan = async (topic: string, grade: string, subject: string): Promise<string> => {
    return `
# Lesson Plan: ${topic}
**Subject:** ${subject} | **Grade:** ${grade}

### 1. Learning Objectives
- [Objective 1]
- [Objective 2]

### 2. Materials Required
- Textbook, Whiteboard, Marker

### 3. Lesson Structure (40 Mins)
- **Introduction (5 mins):** Introduce the topic of ${topic}.
- **Main Activity (25 mins):** Explain key concepts.
- **Wrap-up (10 mins):** Q&A session with students.
    `;
};

export const generateQuizQuestions = async (topic: string, grade: string, subject: string, numQuestions: number): Promise<string> => {
    return `### Quiz: ${topic}
    
**Note:** Please enter your questions below.

1. Question 1 text here?
   A) Option 1
   B) Option 2
   C) Option 3
   D) Option 4
   **Correct:** A

2. Question 2 text here?
   ...
    `;
};

export const getYouTubePlaylistInfo = async (playlistUrl: string): Promise<{ title: string; description: string } | null> => {
    return {
        title: "New Learning Resource",
        description: "Added from URL. Please edit details manually."
    };
};

export const analyzeTimetableWithAI = async (
    schoolName: string,
    className: string,
    allSlots: TimetableSlot[],
    teachers: Teacher[],
    subjects: Subject[],
    configSlots: any[],
    classes: Class[]
): Promise<any> => {
    return { 
        summary: "Manual timetable management is active.", 
        teacherConflicts: [], 
        gaps: [], 
        teacherWorkload: [], 
        recommendations: ["Check for clashes manually."] 
    };
};

export const generateFullTimetableWithAI = async (
    schoolName: string,
    classes: Class[],
    teachers: Teacher[],
    subjects: Subject[],
    configSlots: any[],
    userInstructions: string
): Promise<{ slots?: Omit<TimetableSlot, 'id' | 'schoolId'>[], error?: string }> => {
    return { error: "Auto-generation is disabled. Please use the manual scheduler." };
};

export const generateAcademicYearPlan = async (
    config: { startDate: string, endDate: string, numChapters: number },
    subjectName: string,
    className: string,
    userPrompt: string
): Promise<GraphicalAcademicPlan | string> => {
    return {
          "courseTitle": `${subjectName} - ${className}`,
          "sessionDuration": `${config.startDate} to ${config.endDate}`,
          "terms": [
            {
              "title": "First Term",
              "weeks": [
                {
                  "weekLabel": "Week 1",
                  "days": [
                    {
                      "dayName": "Monday",
                      "date": "Day 1",
                      "activities": [
                        { "type": "Chapter", "description": "Chapter 1: Introduction" }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
    };
};
