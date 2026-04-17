

import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Palette, Key, Shield, MessageSquare, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage global platform configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing Tiers */}
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <CreditCard className="text-slate-400" size={20} />
            <h3 className="font-bold text-slate-900">Pricing Plans</h3>
          </div>
          <div className="space-y-3">
             {['Standard (₨ 500/student)', 'Corporate (₨ 400/student)', 'Custom Plans'].map((tier, i) => (
               <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm">
                 <span className="text-sm font-medium text-slate-700">{tier}</span>
                 <button className="text-xs font-semibold text-blue-600 hover:text-blue-800">Edit</button>
               </div>
             ))}
          </div>
        </div>

        {/* Global Branding */}
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Palette className="text-slate-400" size={20} />
            <h3 className="font-bold text-slate-900">Default Theme</h3>
          </div>
          <div className="flex gap-3">
            {['#2563eb', '#10b981', '#f43f5e', '#8b5cf6'].map(color => (
              <div key={color} className="w-8 h-8 rounded-sm cursor-pointer border border-slate-200 shadow-sm hover:opacity-80 transition-opacity" style={{ backgroundColor: color }}></div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Select the default color theme for new schools.</p>
        </div>

        {/* Admin Roles */}
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Shield className="text-slate-400" size={20} />
            <h3 className="font-bold text-slate-900">Admin Accounts</h3>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-sm">
               <div className="w-8 h-8 rounded-sm bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">SA</div>
               <div className="flex-1">
                 <p className="text-sm font-bold text-slate-900">Super Admin (You)</p>
                 <p className="text-xs text-slate-500">Full Access</p>
               </div>
             </div>
             <button className="text-sm font-medium text-blue-600 hover:text-blue-800">+ Add Admin</button>
          </div>
        </div>

        {/* API Integrations */}
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Key className="text-slate-400" size={20} />
            <h3 className="font-bold text-slate-900">Integrations</h3>
          </div>
          <div className="space-y-3">
             {['AI Services', 'SMS Gateway'].map(api => (
               <div key={api} className="flex items-center justify-between p-3 border border-slate-100 rounded-sm">
                 <span className="text-sm font-medium text-slate-700">{api}</span>
                 <div className="flex items-center gap-1.5">
                   <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                   <span className="text-xs text-slate-500">Connected</span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;