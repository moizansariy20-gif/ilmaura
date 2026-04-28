import React, { useEffect, useState } from 'react';
import { PrintableAdmissionForm } from '../principal_admin/pages/StudentManagement.tsx';
import { Printer } from 'phosphor-react';

const PrintAdmissionFormView: React.FC = () => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const storedData = localStorage.getItem('print_student_data');
        if (storedData) {
            setData(JSON.parse(storedData));
            // Optional: clear it after reading, but keeping it allows refresh
        }
    }, []);

    useEffect(() => {
        if (data) {
            // Temporarily change document title to avoid URL/App Name in print headers if margins are kept
            const originalTitle = document.title;
            document.title = "Admission Form";

            // Give it a tiny bit of time to render images before printing
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            
            const handleAfterPrint = () => {
                document.title = originalTitle;
                window.close();
            };
            window.addEventListener('afterprint', handleAfterPrint);
            
            return () => {
                document.title = originalTitle;
                clearTimeout(timer);
                window.removeEventListener('afterprint', handleAfterPrint);
            };
        }
    }, [data]);

    if (!data) {
        return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading print data...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 pb-8 print:py-0 print:bg-white dark:bg-[#1e293b]">
            <style>
                {`
                    @media print {
                        @page { margin: 0; }
                        body { margin: 1.6cm; }
                    }
                `}
            </style>
            <div className="sticky top-0 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-[#1e293b] p-4 flex justify-between items-center z-10 print:hidden shadow-sm mb-8">
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Printer size={24} weight="fill" className="text-blue-600" />
                    Print View
                </h2>
                <div className="flex gap-3">
                    <button 
                        onClick={() => window.print()}
                        className="bg-emerald-600 text-white px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-[4px_4px_0px_0px_rgba(5,150,105,0.3)] flex items-center gap-2"
                    >
                        <Printer size={18} weight="fill"/> Print Now
                    </button>
                    <button 
                        onClick={() => window.close()}
                        className="bg-slate-700 text-white px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-[4px_4px_0px_0px_rgba(51,65,85,0.3)] flex items-center gap-2"
                    >
                        Close Tab
                    </button>
                </div>
            </div>
            <div className="flex flex-col items-center gap-8">
                <div className="bg-white dark:bg-[#1e293b] shadow-2xl print:shadow-none">
                    <PrintableAdmissionForm 
                        school={data.school} 
                        config={data.formConfig || []} 
                        isBlank={data.isBlank || false} 
                        showOverlays={false} 
                        student={data.student}
                    />
                    {data.pageLayout === 'double' && (
                        <>
                            <div className="border-t-2 border-dashed border-slate-300 my-8 print:hidden"></div>
                            <PrintableAdmissionForm 
                                school={data.school} 
                                config={data.formConfig || []} 
                                isBlank={data.isBlank || false} 
                                showOverlays={false} 
                                student={data.student}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrintAdmissionFormView;
