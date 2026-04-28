
// student/components/ChallanDisplayMultipleCopies.tsx
import React from 'react';
import { School } from '../../types.ts';
import StudentChallanView from './StudentChallanView.tsx'; // Import the single copy component

interface ChallanData {
  theme: string;
  month: string;
  issueDate: string;
  dueDate: string;
  validDate: string;
  lateFine: number;
  bankDetails: string;
  accountNo: string;
  accountTitle: string;
  branchName?: string;
  mobileDetails: string;
  signatureURL?: string;
  stampURL?: string;
  studentName: string;
  studentClass: string;
  studentRoll: string;
  tuitionFee: number;
  arrears: number;
  tax: number;
  discount: number;
  totalCurrent: number;
  totalPayable: number;
  receiptNo: string;
  dynamicFeeItems: { id: string; label: string; amount: number; }[];
  phone: string;
  easyPaisaPaymentUrl?: string;
  // NEW: Custom Challan Design fields
  backgroundImageURL?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface ChallanDisplayMultipleCopiesProps {
  challanData: ChallanData;
  school: School;
}

const ChallanDisplayMultipleCopies: React.FC<ChallanDisplayMultipleCopiesProps> = ({ challanData, school }) => {
  if (!challanData) return null;

  return (
    <div className="w-full flex flex-nowrap bg-white dark:bg-[#1e293b] p-0 relative h-full" style={{ minWidth: '1080px' /* 3 * 360px */ }}>
      {/* School Copy */}
      <div className="w-[360px] border-r border-dashed border-gray-300 print:border-none">
        <StudentChallanView challanData={{...challanData, titleSuffix: 'School Copy'}} school={school} />
      </div>
      {/* Bank Copy */}
      <div className="w-[360px] border-r border-dashed border-gray-300 print:border-none">
        <StudentChallanView challanData={{...challanData, titleSuffix: 'Bank Copy'}} school={school} />
      </div>
      {/* Student Copy */}
      <div className="w-[360px]">
        <StudentChallanView challanData={{...challanData, titleSuffix: 'Student Copy'}} school={school} />
      </div>
    </div>
  );
};

export default ChallanDisplayMultipleCopies;
