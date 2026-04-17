import React from 'react';
import { ShieldCheck, School, Users, ClipboardList, ArrowRight } from 'lucide-react';

interface PortalSelectorProps {
  onSelect: (portal: 'mother-admin' | 'principal' | 'teacher' | 'parent-student') => void;
}

const PortalCard = ({ icon, title, description, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full text-left bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-indigo-200 transition-all group"
  >
    <div className="flex items-center gap-6">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <ArrowRight className="ml-auto text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);

const PortalSelector: React.FC<PortalSelectorProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-6">
          <span className="font-black text-4xl">E</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Welcome to Ilmaura</h1>
        <p className="text-slate-500 mt-2 font-medium">Please select your portal to continue.</p>
      </div>
      <div className="w-full max-w-2xl space-y-6">
        <PortalCard
          icon={<School size={32} />}
          title="Principal / School Admin"
          description="Manage your campus, staff, and student operations."
          onClick={() => onSelect('principal')}
        />
        <PortalCard
          icon={<ClipboardList size={32} />}
          title="Teacher App"
          description="Access classroom tools, attendance, and lesson plans."
          onClick={() => onSelect('teacher')}
        />
        <PortalCard
          icon={<Users size={32} />}
          title="Parent & Student App"
          description="View assignments, results, and school notices."
          onClick={() => onSelect('parent-student')}
        />
      </div>
    </div>
  );
};

export default PortalSelector;
