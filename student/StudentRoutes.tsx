
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard.tsx';
import IdCardPage from './pages/IdCard.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { subscribeToSchoolDetails, subscribeToStudentData } from '../services/api.ts';
import StudentSkeleton from './components/StudentSkeleton.tsx';

const StudentRoutes: React.FC = () => {
  const { profile } = useAuth();
  const [school, setSchool] = React.useState<any>(null);
  const [currentClass, setCurrentClass] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile?.schoolId) return;
    
    const unsubSchool = subscribeToSchoolDetails(profile.schoolId, (data) => {
      setSchool(data);
      setLoading(false);
    }, console.error);

    return () => unsubSchool();
  }, [profile]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center">
      {/* Mobile-centric container for desktop */}
      <div className="w-full max-w-[430px] min-h-screen bg-white dark:bg-slate-900 shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] relative flex flex-col overflow-hidden">
        {loading ? (
          <StudentSkeleton />
        ) : (
          <div className="flex-1 overflow-y-auto relative h-full scrollbar-none">
            <Routes>
              <Route path="/*" element={<StudentDashboard />} />
              <Route path="/id-card" element={<IdCardPage profile={profile} school={school} currentClass={currentClass} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRoutes;
