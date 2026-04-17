
import React from 'react';
import { motion } from 'motion/react';
import { 
  Student,
  Users,
  ChalkboardTeacher,
  GraduationCap,
  Chalkboard,
  CalendarCheck,
  Wallet,
  IdentificationCard,
  Receipt,
  UserList,
  Sparkle,
  Megaphone,
  Broadcast,
  ShareNetwork,
  Gear,
  Palette,
  Info,
  Lifebuoy
} from 'phosphor-react';

interface MyToolsProps {
  onNavigate: (tab: string) => void;
}

const MyTools: React.FC<MyToolsProps> = ({ 
  onNavigate
}) => {
  const toolGroups = [
    {
      title: "Principal Tools",
      items: [
        { id: 'students_directory', label: 'Students', icon: <Student size={32} weight="fill" /> },
        { id: 'parents_directory', label: 'Parents', icon: <Users size={32} weight="fill" /> },
        { id: 'teachers_directory', label: 'Teachers', icon: <ChalkboardTeacher size={32} weight="fill" /> },
        { id: 'academics_timetable', label: 'Academics', icon: <GraduationCap size={32} weight="fill" /> },
        { id: 'classes', label: 'Classes', icon: <Chalkboard size={32} weight="fill" /> },
        { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={32} weight="fill" /> },
        { id: 'fees_dashboard', label: 'Fees', icon: <Wallet size={32} weight="fill" /> },
        { id: 'teachers_payroll', label: 'HR & Payroll', icon: <IdentificationCard size={32} weight="fill" /> },
        { id: 'expenses_daily', label: 'Expenses', icon: <Receipt size={32} weight="fill" /> },
        { id: 'enquiries', label: 'Inquiries', icon: <UserList size={32} weight="fill" /> },
        { id: 'students_gallery', label: 'Student Photos', icon: <Palette size={32} weight="fill" /> },
        { id: 'ai_reports', label: 'AI Reports', icon: <Sparkle size={32} weight="fill" /> },
        { id: 'complaints', label: 'Complaints', icon: <Megaphone size={32} weight="fill" /> },
        { id: 'notices', label: 'Notices', icon: <Broadcast size={32} weight="fill" /> },
        { id: 'communication', label: 'Communication', icon: <ShareNetwork size={32} weight="fill" /> },
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-full bg-[#FCFBF8] dark:bg-slate-900 pb-32 transition-colors duration-300"
    >
      {/* Header Section */}
      <div className="w-full bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] p-8 pt-12 pb-10 shadow-2xl relative overflow-hidden border-b-4 border-[#D4AF37]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.3em]">Principal App</p>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">My Tools</h1>
          <p className="text-white/60 text-sm mt-2 font-medium">Manage your school efficiently</p>
        </div>
      </div>

      <div className="p-6 -mt-6 relative z-20">
        <div className="space-y-8">
          {toolGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-4">
              <h2 className="text-xl font-black text-[#1e3a8a] dark:text-[#D4AF37] px-2 uppercase tracking-wider">{group.title}</h2>
              <div className="border-4 border-[#D4AF37] rounded-[2.5rem] p-6 bg-white dark:bg-slate-800 shadow-[0_20px_50px_rgba(30,58,138,0.1),inset_0_0_40px_rgba(0,0,0,0.02)] grid grid-cols-2 gap-4 transition-colors duration-300">
                {group.items.map((item, iIdx) => (
                  <button 
                    key={`${gIdx}-${iIdx}`} 
                    onClick={() => onNavigate(item.id)} 
                    className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] p-5 rounded-3xl border-2 border-[#D4AF37] shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group min-h-[120px]"
                  >
                    <div className="shrink-0 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] text-[#D4AF37] group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-tight">{item.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MyTools;
