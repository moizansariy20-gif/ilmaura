
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, UserCheck, BarChart3 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

interface AnalyticsProps {
  students: any[];
  exams: any[];
  marks: any[];
}

const Analytics: React.FC<AnalyticsProps> = ({ students, exams, marks }) => {
  const attendanceData = [
    { day: 'Mon', attendance: 95 },
    { day: 'Tue', attendance: 92 },
    { day: 'Wed', attendance: 88 },
    { day: 'Thu', attendance: 96 },
    { day: 'Fri', attendance: 91 },
  ];
  
  const topStudents = marks
    .sort((a, b) => b.marksObtained - a.marksObtained)
    .slice(0, 5)
    .map(mark => {
        const student = students.find(s => s.id === mark.studentId);
        const exam = exams.find(e => e.id === mark.examId);
        return {
            name: student?.name || 'Unknown',
            score: mark.marksObtained,
            exam: exam?.title || 'Exam'
        }
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
          title="Performance Analytics" 
          subtitle="View student performance and attendance trends." 
          icon={<BarChart3 size={32} className="text-white drop-shadow-md" />}
        />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-xl mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6B1D2F]/5 text-[#6B1D2F] dark:text-white rounded-xl flex items-center justify-center">
                <UserCheck size={20}/>
            </div>
            Weekly Attendance Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} unit="%" />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', padding: '12px 16px'}} 
                    itemStyle={{fontWeight: 900, fontSize: '12px', color: '#6B1D2F'}}
                    labelStyle={{fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '4px'}}
                />
                <Bar dataKey="attendance" fill="#6B1D2F" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-[#6B1D2F]/10 dark:border-[#1e293b] shadow-sm">
           <h3 className="font-black text-slate-900 dark:text-white text-xl mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl flex items-center justify-center">
                <Award size={20} />
            </div>
            Top Performers
          </h3>
          <div className="space-y-4">
              {topStudents.map((student, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100 dark:border-[#334155] group hover:bg-white dark:bg-[#1e293b] hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : i === 1 ? 'bg-slate-200 text-slate-600 dark:text-slate-300' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white dark:bg-[#1e293b] text-slate-400'}`}>
                            {i+1}
                        </span>
                        <div>
                          <p className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{student.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{student.exam}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#6B1D2F] dark:text-white text-lg">{student.score}</span>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marks</p>
                      </div>
                  </div>
              ))}
              {topStudents.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-dashed border-slate-200 dark:border-[#1e293b]">
                      <TrendingUp size={32} className="mx-auto mb-3 text-slate-300 opacity-50"/>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No data available</p>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
