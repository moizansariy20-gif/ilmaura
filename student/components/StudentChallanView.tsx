import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { School } from '../../types.ts';

interface StudentChallanViewProps {
  challanData: any;
  school: School;
}

const StudentChallanView: React.FC<StudentChallanViewProps> = ({ challanData, school }) => {
  if (!challanData) return null;

  const primaryColor = challanData.primaryColor || '#000000'; 
  
  // Generate unique strings for QR and Barcode using the actual receipt/challan number
  const uniqueChallanCode = `CHL-${challanData.receiptNo || challanData.studentRoll}`;
  const qrData = JSON.stringify({
    no: challanData.receiptNo,
    roll: challanData.studentRoll,
    amount: challanData.totalPayable,
    due: challanData.dueDate
  });

  return (
    <div className="w-[360px] min-h-[750px] bg-white dark:bg-[#1e293b] p-3 flex flex-col font-sans text-[10px] text-black border-r border-dashed border-gray-400 relative">
      
      {/* Outer Solid Border for the Traditional Look */}
      <div className="border-2 border-black flex flex-col h-full p-2">
        
        {/* 1. School Header & QR */}
        <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2 pt-1">
          <div className="w-3/4 pr-2 flex items-start">
            {school.logoURL ? (
              <img src={school.logoURL} className="h-16 max-w-full object-contain object-left" alt="Logo" />
            ) : (
              <div className="font-bold text-xs border p-2 mb-1 inline-block">SCHOOL LOGO</div>
            )}
          </div>
          <div className="shrink-0 border border-black p-0.5">
            <QRCodeSVG value={qrData} size={48} level="L" />
          </div>
        </div>

        {/* 3. Copy Title (e.g., BANK COPY) */}
        <div className="text-center font-black uppercase tracking-[0.3em] py-1 text-[12px] bg-black text-white mb-3">
          {challanData.titleSuffix || 'Challan Copy'}
        </div>

        {/* 4. Meta Info (Challan No, Dates) */}
        <div className="flex justify-between text-[10px] mb-2 font-bold px-1">
          <div>Challan No: <span className="font-black text-[12px] underline">{challanData.receiptNo || 'CHL-0001'}</span></div>
          <div className="text-right">
            <div>Issue Date: {challanData.issueDate}</div>
            <div className="text-rose-700">Due Date: {challanData.dueDate}</div>
          </div>
        </div>

        {/* 5. Student Details Box (Comprehensive) */}
        <div className="border-2 border-black mb-3 text-[10px] leading-relaxed">
          <div className="bg-gray-100 border-b-2 border-black p-1.5 text-center">
            <span className="font-black text-[12px] uppercase tracking-widest">{challanData.studentName}</span>
          </div>
          <div className="p-1.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
            <div><span className="font-bold text-gray-600">Father Name:</span><br/><span className="font-black uppercase">{challanData.fatherName || '________________'}</span></div>
            <div><span className="font-bold text-gray-600">Class:</span><br/><span className="font-black uppercase">{challanData.studentClass}</span></div>
            
            <div><span className="font-bold text-gray-600">Roll No:</span><br/><span className="font-black">{challanData.studentRoll}</span></div>
            <div><span className="font-bold text-gray-600">GR/Reg No:</span><br/><span className="font-black">{challanData.regNo || '________'}</span></div>
            
            <div className="col-span-2 border-t border-dashed border-gray-400 pt-1 mt-0.5">
              <span className="font-bold text-gray-600">Fee Month:</span> <span className="font-black uppercase text-[11px] ml-1">{challanData.month}</span>
            </div>
          </div>
        </div>

        {/* 6. Fee Particulars Table */}
        <div className="flex-1 flex flex-col">
          <table className="w-full border-collapse border-2 border-black text-[10px] mb-2">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="border-r-2 border-black p-1.5 text-center w-8">S.No</th>
                <th className="border-r-2 border-black p-1.5 text-left">Particulars</th>
                <th className="p-1.5 text-center w-24">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {challanData.dynamicFeeItems.map((fee: any, idx: number) => (
                <tr key={fee.id} className="border-b border-black">
                  <td className="border-r-2 border-black p-1.5 text-center">{idx + 1}</td>
                  <td className="border-r-2 border-black p-1.5 font-medium">{fee.label}</td>
                  <td className="p-1.5 text-right font-bold">{fee.amount.toLocaleString()}</td>
                </tr>
              ))}
              
              {/* Additional Rows for Arrears, Tax, Discount if they exist */}
              {challanData.arrears > 0 && (
                <tr className="border-b border-black">
                  <td className="border-r-2 border-black p-1.5 text-center"></td>
                  <td className="border-r-2 border-black p-1.5 font-medium">Arrears</td>
                  <td className="p-1.5 text-right font-bold">{challanData.arrears.toLocaleString()}</td>
                </tr>
              )}
              {challanData.tax > 0 && (
                <tr className="border-b border-black">
                  <td className="border-r-2 border-black p-1.5 text-center"></td>
                  <td className="border-r-2 border-black p-1.5 font-medium">Tax</td>
                  <td className="p-1.5 text-right font-bold">{challanData.tax.toLocaleString()}</td>
                </tr>
              )}
              {challanData.discount > 0 && (
                <tr className="border-b border-black">
                  <td className="border-r-2 border-black p-1.5 text-center"></td>
                  <td className="border-r-2 border-black p-1.5 font-medium">Discount</td>
                  <td className="p-1.5 text-right font-bold text-emerald-600">-{challanData.discount.toLocaleString()}</td>
                </tr>
              )}
              {/* Empty spacer row to push totals down */}
              <tr>
                <td className="border-r-2 border-black p-1.5 h-8"></td>
                <td className="border-r-2 border-black p-1.5"></td>
                <td className="p-1.5"></td>
              </tr>
            </tbody>
            <tfoot className="border-t-2 border-black">
              <tr className="border-b border-black">
                <td colSpan={2} className="border-r-2 border-black p-1.5 text-right font-black uppercase">
                  Total Payable (Within Due Date)
                </td>
                <td className="p-1.5 text-right font-black text-[12px]">
                  {challanData.totalPayable.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border-r-2 border-black p-1.5 text-right font-black uppercase text-rose-700">
                  Total Payable (After Due Date)
                </td>
                <td className="p-1.5 text-right font-black text-[12px] text-rose-700">
                  {(challanData.totalPayable + challanData.lateFine).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* 7. Amount in Words & Notes */}
          <div className="mb-2 text-[10px] leading-relaxed">
            <div className="mb-1.5">
              <span className="font-bold">Amount in Words:</span> 
              <span className="ml-1 italic border-b border-black inline-block w-[220px]">Rupees ___________________________ Only.</span>
            </div>
            <div className="text-[8px] text-gray-600 font-medium">
              * Late fee of Rs. {challanData.lateFine} will be charged after the due date.<br/>
              * Please ensure to get the bank stamp after payment.
            </div>
          </div>
        </div>

        {/* 8. Bank Details (Moved to Bottom) */}
        <div className="border-t-2 border-black pt-2 mb-2">
          <div className="text-[9px] leading-tight flex flex-col gap-0.5">
            <div className="font-black uppercase text-[11px]">{challanData.bankDetails}</div>
            <div className="flex justify-between">
              <span><span className="font-bold">A/C Title:</span> {challanData.accountTitle}</span>
              <span><span className="font-bold">A/C No:</span> <span className="font-black text-[11px]">{challanData.accountNo}</span></span>
            </div>
            <div><span className="font-bold">Branch:</span> {challanData.branchName || '______________'}</div>
          </div>
        </div>

        {/* 9. Footer: Barcode & Signatures */}
        <div className="mt-auto pt-2 flex justify-between items-end">
          <div className="transform origin-bottom-left scale-[0.7] -mb-2">
            <Barcode value={uniqueChallanCode} width={1.5} height={40} fontSize={12} margin={0} background="transparent" lineColor="#000000" />
          </div>
          
          <div className="flex gap-4 pr-2">
            <div className="text-center">
              <div className="w-16 border-t-2 border-black mb-1"></div>
              <span className="text-[9px] font-bold uppercase">Cashier</span>
            </div>
            <div className="text-center">
              <div className="w-16 border-t-2 border-black mb-1"></div>
              <span className="text-[9px] font-bold uppercase">Bank Officer</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentChallanView;
