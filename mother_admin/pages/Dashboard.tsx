
import React from 'react';
import { 
  UsersThree, Buildings, User, CurrencyDollar, 
  ShieldWarning, Bank
} from 'phosphor-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

interface DashboardProps {
  schools: any[];
  principals: any[];
}

const REVENUE_DATA = [
  { month: 'Jan', revenue: 1.2 }, { month: 'Feb', revenue: 1.5 },
  { month: 'Mar', revenue: 1.4 }, { month: 'Apr', revenue: 2.1 },
  { month: 'May', revenue: 2.8 }, { month: 'Jun', revenue: 3.5 },
];

const Dashboard: React.FC<DashboardProps> = ({ schools, principals }) => {
  // --- DATA PROCESSING ---
  const { activeSchools, suspendedSchools, totalStudents, totalRevenue, stats, schoolStatusData } = React.useMemo(() => {
    const active = schools.filter(s => s.status === 'Active').length;
    const suspended = schools.filter(s => s.status === 'Suspended').length;
    const totalStuds = schools.reduce((acc, s) => acc + (Number(s.actualStudents) || 0), 0);
    const revenue = totalStuds * 500;

    const statsArray = [
      { 
        label: 'Total Schools', 
        value: schools.length.toString(), 
        subValue: `${active} Active`, 
        icon: <Buildings size={24} weight="regular" />, 
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      },
      { 
        label: 'Total Students', 
        value: totalStuds.toLocaleString(), 
        subValue: 'Across all schools', 
        icon: <UsersThree size={24} weight="regular" />, 
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
      },
      { 
        label: 'Total Principals', 
        value: principals.length.toString(), 
        subValue: 'Registered', 
        icon: <User size={24} weight="regular" />, 
        color: 'text-violet-600',
        bg: 'bg-violet-50'
      },
      { 
        label: 'Total Revenue', 
        value: '₨ ' + (revenue / 1000000).toFixed(2) + 'M', 
        subValue: 'Estimated', 
        icon: <CurrencyDollar size={24} weight="regular" />, 
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
      },
      { 
        label: 'Suspended Schools', 
        value: suspended.toString(), 
        subValue: 'Needs attention', 
        icon: <ShieldWarning size={24} weight="regular" />, 
        color: 'text-rose-600',
        bg: 'bg-rose-50'
      },
    ];

    const statusData = [
      { name: 'Active', value: active, color: '#2563eb' }, 
      { name: 'Suspended', value: suspended, color: '#e11d48' }, 
      { name: 'Pending', value: schools.length - active - suspended, color: '#64748b' } 
    ];

    return {
      activeSchools: active,
      suspendedSchools: suspended,
      totalStudents: totalStuds,
      totalRevenue: revenue,
      stats: statsArray,
      schoolStatusData: statusData
    };
  }, [schools, principals]);

  return (
    <div className="space-y-6 pb-12">
      {/* Simple Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-none shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of all schools and platform statistics.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-none text-sm font-medium">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          System Online
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 border border-slate-200 rounded-none shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 flex items-center justify-center rounded-none ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            <p className="text-xs text-slate-500 mt-2">{stat.subValue}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 border border-slate-200 rounded-none shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-6">Revenue Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontSize: '14px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded-none shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 text-base mb-6">School Status</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={schoolStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {schoolStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900 leading-none">{schools.length}</span>
                  <span className="text-xs text-slate-500 mt-1">Total</span>
                </div>
            </div>
            <div className="w-full space-y-2 mt-6">
              {schoolStatusData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 border border-slate-100 rounded-none">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-none" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Schools */}
      <div className="bg-white p-6 border border-slate-200 rounded-none shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900 text-base">Recently Added Schools</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {schools.length > 0 ? (
             schools.slice(-6).reverse().map((school, i) => (
               <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-none hover:border-blue-300 transition-colors">
                 <div className="w-12 h-12 bg-slate-100 rounded-none flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden shrink-0">
                   {school.logoURL ? (
                     <img src={school.logoURL} className="w-full h-full object-contain p-1" alt="" />
                   ) : <Bank size={20} weight="regular" />}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-slate-900 truncate">{school.name}</p>
                   <p className="text-xs text-slate-500 truncate">{school.city} • {school.status}</p>
                 </div>
               </div>
             ))
           ) : (
             <div className="col-span-full py-12 text-center text-slate-500">
               No schools connected yet.
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
