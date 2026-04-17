import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Student, Clock, CalendarCheck } from 'phosphor-react';

const ClassDetails: React.FC = () => {
  const { classId } = useParams();
  const [activeTab, setActiveTab] = useState('students');

  const tabs = [
    { id: 'students', label: 'Students', icon: <Student size={18} /> },
    { id: 'timetable', label: 'Timetable', icon: <Clock size={18} /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={18} /> },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Class Details: {classId}</h1>
      
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-200'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700 rounded-lg">
        {activeTab === 'students' && <p>Student list for {classId}</p>}
        {activeTab === 'timetable' && <p>Timetable for {classId}</p>}
        {activeTab === 'attendance' && <p>Attendance for {classId}</p>}
      </div>
    </div>
  );
};

export default ClassDetails;
