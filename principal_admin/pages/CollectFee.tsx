import React from 'react';
import { FeeManagement } from './FeeManagement.tsx';
import { UserProfile, Student, School as SchoolType, FeeTransaction } from '../../types.ts';

interface CollectFeeProps {
  profile: UserProfile;
  students: Student[];
  classes: any[];
  schoolId: string;
  school: SchoolType;
  ledger?: FeeTransaction[];
}

const CollectFee: React.FC<CollectFeeProps> = (props) => {
  return (
    <FeeManagement 
      {...props} 
      view="overview" 
      customTitle="Collect Fee" 
    />
  );
};

export default CollectFee;
