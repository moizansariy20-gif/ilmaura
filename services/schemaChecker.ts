
import { supabase } from './supabase.ts';

const REQUIRED_TABLES = [
  'schools',
  'user_profiles',
  'teachers',
  'students',
  'classes',
  'subjects',
  'timetable',
  'attendance',
  'teacher_attendance',
  'fee_transactions',
  'expenses',
  'resources',
  'class_logs',
  'assignments',
  'announcements',
  'exams',
  'quizzes',
  'quiz_submissions',
  'student_notes',
  'enquiries',
  'academic_plans',
  'complaints'
];

export const checkDatabaseSchema = async () => {
  const missingTables: string[] = [];
  const foundTables: string[] = [];

  for (const tableName of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(tableName).select('*').limit(0);
      
      if (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
           console.error(`❌ CRITICAL: Failed to connect to Supabase. Your SUPABASE_ANON_KEY or SUPABASE_URL in services/supabase.ts is likely invalid or your project is paused.`);
           return { missingTables: [], foundTables: [], connectionError: true };
        }
        if (error.code === '42P01') {
          missingTables.push(tableName);
        } else {
          foundTables.push(tableName);
          console.warn(`⚠️ Table "${tableName}" exists but returned error: ${error.message} (Code: ${error.code})`);
        }
      } else {
        foundTables.push(tableName);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
         console.error(`❌ CRITICAL: Failed to connect to Supabase. Your SUPABASE_ANON_KEY or SUPABASE_URL in services/supabase.ts is likely invalid or your project is paused.`);
         return { missingTables: [], foundTables: [], connectionError: true };
      }
      console.error(`❌ Unexpected error checking table "${tableName}":`, err);
    }
  }

  if (missingTables.length > 0) {
    console.group('❌ MISSING DATABASE TABLES');
    console.error('The following tables are missing from your Supabase database:');
    missingTables.forEach(table => console.error(`- ${table}`));
    console.info('Please run the SQL schema queries to create these tables.');
    console.groupEnd();
  }

  return { missingTables, foundTables };
};
