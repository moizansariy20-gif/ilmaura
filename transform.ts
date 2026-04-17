import fs from 'fs';

let content = fs.readFileSync('principal_admin/pages/StudentManagement.tsx', 'utf-8');

// Replace imports
content = content.replace(/import { addStudent, updateStudent, deleteStudent, getStudentsByClass, subscribeToParents, addParent, updateParent, deleteParent, updateSchoolBranding, logActivity, deleteFileFromStorage, extractPathFromStorageUrl, uploadFileToStorage } from '\.\.\/\.\.\/services\/api\.ts';/, 
`import { onboardTeacher, updateTeacher, deleteTeacher, updateSchoolBranding, provisionTeacherAccount, logActivity, deleteFileFromStorage, extractPathFromStorageUrl, uploadFileToStorage } from '../../services/api.ts';`);

content = content.replace(/import { Student, Class, Parent, FeeTransaction, CustomFieldDef, UserProfile, StaffPermission, School, FormFieldConfig, BUILTIN_ADMISSION_CONFIG } from '\.\.\/\.\.\/types\.ts';/,
`import { Teacher, CustomFieldDef, UserProfile, StaffPermission, School, FormFieldConfig, BUILTIN_TEACHER_CONFIG } from '../../types.ts';`);

// Replace component name and props
content = content.replace(/StudentManagementProps/g, 'TeacherManagementProps');
content = content.replace(/StudentManagement/g, 'TeacherManagement');

// Replace Student with Teacher
content = content.replace(/Student/g, 'Teacher');
content = content.replace(/student/g, 'teacher');
content = content.replace(/STUDENT/g, 'TEACHER');
content = content.replace(/Students/g, 'Teachers');
content = content.replace(/students/g, 'teachers');
content = content.replace(/STUDENTS/g, 'TEACHERS');

// Replace Admission with Registration
content = content.replace(/Admission/g, 'Registration');
content = content.replace(/admission/g, 'registration');
content = content.replace(/ADMISSION/g, 'REGISTRATION');

// Replace BUILTIN_ADMISSION_CONFIG with BUILTIN_TEACHER_CONFIG
content = content.replace(/BUILTIN_REGISTRATION_CONFIG/g, 'BUILTIN_TEACHER_CONFIG');

// Write to a temporary file
fs.writeFileSync('principal_admin/pages/TeacherManagement_new.tsx', content);
console.log('Done');
