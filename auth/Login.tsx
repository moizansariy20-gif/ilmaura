
import React, { useState } from 'react';
import PortalSelector from './PortalSelector.tsx';
import MotherAdminLogin from '../mother_admin/pages/Login.tsx';
import PrincipalLogin from '../principal_admin/pages/PrincipalLogin.tsx';
import TeacherLogin from './TeacherLogin.tsx';
import SchoolIdInput from './SchoolIdInput.tsx';

interface LoginProps {
  onPortalChange?: (schoolId: string | null) => void;
  forcedPortal?: 'mother-admin' | 'principal' | 'teacher' | 'parent-student';
}

const Login: React.FC<LoginProps> = ({ onPortalChange, forcedPortal }) => {
    // SYSTEM UPDATE: Changed to localStorage so the portal choice (e.g. Student) persists across reloads for better DX
    const [portal, setPortal] = useState<string | null>(() => forcedPortal || localStorage.getItem('selectedPortal'));

    const handleSelectPortal = (selectedPortal: 'mother-admin' | 'principal' | 'teacher' | 'parent-student') => {
        localStorage.setItem('selectedPortal', selectedPortal);
        setPortal(selectedPortal);
    };

    const handleBackToSelector = () => {
        localStorage.removeItem('selectedPortal');
        setPortal(null);
    }
    
    const handleSchoolIdProceed = (schoolId: string) => {
        // SYSTEM UPDATE: Use localStorage for persistence across browser restarts
        localStorage.setItem('active_school_portal_id', schoolId);
        
        // If the parent component provided a callback, use it to update state immediately
        if (onPortalChange) {
            onPortalChange(schoolId);
        } else {
            // Fallback for unexpected cases
            window.location.reload();
        }
    };

    if (!portal) {
        // UPDATED: Default to School ID Input (Landing Screen) instead of Portal Selector
        return (
            <SchoolIdInput 
                onProceed={handleSchoolIdProceed}
                onMotherAdminClick={() => handleSelectPortal('mother-admin')}
            />
        );
    }

    switch(portal) {
        case 'mother-admin':
            return <MotherAdminLogin onSwitchPortal={handleBackToSelector} />;
        case 'principal':
            return <PrincipalLogin onSwitchPortal={handleBackToSelector} />;
        case 'teacher':
            // UPDATED: Teachers now go through School ID input to get branded login
            return <SchoolIdInput 
                onBack={handleBackToSelector} 
                onProceed={handleSchoolIdProceed}
            />;
        case 'parent-student':
            return <SchoolIdInput 
                onBack={handleBackToSelector} 
                onProceed={handleSchoolIdProceed}
            />;
        default:
            return <PortalSelector onSelect={handleSelectPortal} />;
    }
};

export default Login;
