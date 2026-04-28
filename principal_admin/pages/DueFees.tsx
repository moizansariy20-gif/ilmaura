import React, { useMemo } from 'react';
import { FeeManagement } from './FeeManagement.tsx';
import { UserProfile, Student, School as SchoolType, FeeTransaction } from '../../types.ts';

interface DueFeesProps {
  profile: UserProfile;
  students: Student[];
  classes: any[];
  schoolId: string;
  school: SchoolType;
  ledger?: FeeTransaction[];
}

const DueFees: React.FC<DueFeesProps> = (props) => {
  return (
    <FeeManagement 
      {...props} 
      students={props.students}
      view="overview" 
      customTitle="Due Fees" 
    />
  );
};

export default DueFees;
