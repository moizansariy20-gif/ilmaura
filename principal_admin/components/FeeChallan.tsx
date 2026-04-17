
import React from 'react';
import { Student, School, FeeTransaction } from '../../types.ts';
import { QRCodeSVG } from 'qrcode.react';

interface FeeChallanProps {
  student: Student & { className?: string };
  school: School;
  transaction: Partial<FeeTransaction> & { dueDate?: string };
  className?: string;
  singleCopy?: boolean;
}

const FeeChallan: React.FC<FeeChallanProps> = ({ student, school, transaction, className, singleCopy }) => {
  const getClassName = (classId: string) => {
    return student.className || 'N/A';
  };

  const primaryColor = school.feeConfig?.masterTemplate?.primaryColor || '#001D4D';
  const secondaryColor = school.feeConfig?.masterTemplate?.secondaryColor || '#003366';

  const challanData = {
    receiptNo: transaction.receiptNo || `REC-${Date.now().toString().slice(-6)}`,
    month: transaction.month || new Date().toLocaleString('default', { month: 'long' }),
    issueDate: new Date().toLocaleDateString(),
    dueDate: transaction.dueDate || new Date(new Date().getFullYear(), new Date().getMonth(), 10).toLocaleDateString(),
    validityDate: new Date(new Date().getFullYear(), new Date().getMonth(), 28).toLocaleDateString(),
    tuitionFee: transaction.amountPaid || 0,
    admissionFee: 0,
    annualFee: 0,
    labFee: 0,
    securityCharges: 0,
    sportsFee: 0,
    discount: transaction.discountAmount || 0,
    tax: 0,
    arrears: 0,
    fine: transaction.fineAmount || 0,
  };

  const totalDues = challanData.tuitionFee + challanData.admissionFee + challanData.annualFee + challanData.labFee + challanData.securityCharges + challanData.sportsFee + challanData.arrears;
  const totalByDueDate = totalDues - challanData.discount + challanData.tax;
  const totalAfterDueDate = totalByDueDate + challanData.fine;
  
  const numberToWords = (num: number) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    const inWords = (n: number): string => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + 'hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
        if (n < 100000) return inWords(Math.floor(n / 1000)) + 'thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
        return '';
    };
    return inWords(num).toUpperCase() + 'ONLY';
  };

  const qrValue = JSON.stringify({
    receipt: challanData.receiptNo,
    student: student.name,
    amount: totalByDueDate,
    dueDate: challanData.dueDate
  });

  const Copy = ({ title }: { title: string }) => (
    <div className="copy-section">
      <style>{`
        .copy-section {
            width: ${singleCopy ? '100%' : '33.33%'};
            padding: 25px;
            border-right: ${singleCopy ? 'none' : '1.5px dashed #000'};
            display: flex;
            flex-direction: column;
            background: white;
            min-height: 842px;
            position: relative;
            box-sizing: border-box;
        }
        .copy-section:last-child { border-right: none; }
        
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 20px;
          border-bottom: 3px solid ${primaryColor};
          padding-bottom: 12px;
        }
        
        .logo-section { display: flex; align-items: center; gap: 12px; }
        .logo-box { 
          width: 55px; 
          height: 55px; 
          border: 1px solid #eee; 
          border-radius: 10px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          overflow: hidden;
          background: #f8fafc;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .logo-box img { width: 100%; height: 100%; object-fit: contain; }
        
        .school-info-header { flex: 1; }
        .school-name { font-size: 15px; font-weight: 900; color: ${primaryColor}; text-transform: uppercase; line-height: 1.1; letter-spacing: -0.02em; }
        .school-address { font-size: 9px; color: #64748b; font-weight: 500; margin-top: 2px; }

        .receipt-info { text-align: right; }
        .receipt-no { font-size: 13px; font-weight: 800; color: #0f172a; }
        .month-year { font-size: 11px; font-weight: 700; color: ${secondaryColor}; text-transform: uppercase; letter-spacing: 0.05em; }

        .copy-badge { 
          position: absolute;
          top: 0;
          right: 25px;
          background: ${primaryColor};
          color: white;
          font-size: 9px;
          padding: 3px 12px;
          border-radius: 0 0 6px 6px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .student-details { 
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .detail-item { display: flex; flex-direction: column; }
        .detail-label { font-size: 8px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .detail-value { font-size: 11px; color: #1e293b; font-weight: 700; }

        .fee-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .fee-table th { 
          text-align: left; 
          font-size: 10px; 
          background: #f1f5f9; 
          padding: 8px 12px;
          color: #475569;
          border-bottom: 2px solid #cbd5e1;
          font-weight: 800;
          text-transform: uppercase;
        }
        .fee-table td { 
          font-size: 11px; 
          padding: 10px 12px; 
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          font-weight: 500;
        }
        .text-right { text-align: right; }

        .summary-section {
          margin-left: auto;
          width: 100%;
          max-width: 240px;
        }
        
        .summary-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 5px 0;
          font-size: 11px;
        }
        .summary-label { color: #64748b; font-weight: 500; }
        .summary-value { font-weight: 700; color: #1e293b; }

        .total-payable {
          background: ${primaryColor};
          color: white;
          padding: 12px;
          border-radius: 8px;
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .total-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .total-amount { font-size: 16px; font-weight: 900; }

        .after-due {
          font-size: 10px;
          color: #dc2626;
          font-weight: 800;
          text-align: right;
          margin-top: 6px;
          padding-right: 4px;
        }

        .words-section {
          margin-top: 15px;
          font-size: 9px;
          color: #64748b;
          font-style: italic;
          border-top: 1px solid #f1f5f9;
          padding-top: 8px;
          font-weight: 600;
        }

        .bank-info-box {
          margin-top: 25px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          background: #f8fafc;
        }
        .bank-title { font-size: 10px; font-weight: 900; color: ${primaryColor}; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; }
        .bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .bank-item { font-size: 9px; color: #475569; }
        .bank-item strong { color: #0f172a; font-weight: 700; }

        .qr-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
          padding-top: 25px;
          border-top: 1px solid #f1f5f9;
        }
        
        .qr-container {
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .signature-section {
          display: flex;
          gap: 50px;
        }
        .sig-box {
          text-align: center;
          border-top: 1.5px solid #94a3b8;
          width: 90px;
          padding-top: 6px;
          font-size: 9px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .footer-note {
          text-align: center;
          font-size: 8px;
          color: #94a3b8;
          margin-top: 20px;
          font-weight: 600;
        }
      `}</style>

      <div className="copy-badge">{title}</div>
      
      <div className="header">
        <div className="logo-section">
          <div className="logo-box">
            {school.logoURL ? <img src={school.logoURL} alt="Logo" referrerPolicy="no-referrer" /> : <span className="text-[8px] font-bold">LOGO</span>}
          </div>
          <div className="school-info-header">
            <div className="school-name">{school.name}</div>
            <div className="school-address line-clamp-1">{school.address}</div>
          </div>
        </div>
        <div className="receipt-info">
          <div className="receipt-no">Challan # {challanData.receiptNo}</div>
          <div className="month-year">{challanData.month} {new Date().getFullYear()}</div>
        </div>
      </div>

      <div className="student-details">
        <div className="detail-item" style={{ gridColumn: 'span 2' }}>
          <span className="detail-label">Student Name</span>
          <span className="detail-value">{student.name}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">G.R. No</span>
          <span className="detail-value">{student.rollNo}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Class</span>
          <span className="detail-value">{getClassName(student.classId)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Reg. ID</span>
          <span className="detail-value">{student.id ? student.id.slice(-6).toUpperCase() : 'N/A'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Due Date</span>
          <span className="detail-value">{challanData.dueDate}</span>
        </div>
      </div>

      <table className="fee-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="text-right">Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Tuition Fee</td><td className="text-right">{challanData.tuitionFee.toLocaleString()}</td></tr>
          {challanData.admissionFee > 0 && <tr><td>Admission Fee</td><td className="text-right">{challanData.admissionFee.toLocaleString()}</td></tr>}
          {challanData.annualFee > 0 && <tr><td>Annual Fee</td><td className="text-right">{challanData.annualFee.toLocaleString()}</td></tr>}
          {challanData.labFee > 0 && <tr><td>Lab Fee</td><td className="text-right">{challanData.labFee.toLocaleString()}</td></tr>}
          {challanData.securityCharges > 0 && <tr><td>Security Charges</td><td className="text-right">{challanData.securityCharges.toLocaleString()}</td></tr>}
          {challanData.arrears > 0 && <tr><td>Arrears</td><td className="text-right">{challanData.arrears.toLocaleString()}</td></tr>}
        </tbody>
      </table>

      <div className="summary-section">
        <div className="summary-row">
          <span className="summary-label">Sub Total</span>
          <span className="summary-value">Rs. {totalDues.toLocaleString()}</span>
        </div>
        {challanData.discount > 0 && (
          <div className="summary-row">
            <span className="summary-label">Discount</span>
            <span className="summary-value text-green-600">- Rs. {challanData.discount.toLocaleString()}</span>
          </div>
        )}
        <div className="total-payable">
          <span className="total-label">Payable by Due Date</span>
          <span className="total-amount">Rs. {totalByDueDate.toLocaleString()}</span>
        </div>
        <div className="after-due">
          Payable After Due Date: Rs. {totalAfterDueDate.toLocaleString()}
        </div>
        <div className="words-section">
          Amount in Words: {numberToWords(totalByDueDate)}
        </div>
      </div>

      <div className="bank-info-box">
        <div className="bank-title">Payment Instructions / Bank Details</div>
        <div className="bank-grid">
          <div className="bank-item"><strong>Bank:</strong> {school.feeConfig?.masterTemplate?.bankDetails || 'Bank Al Habib'}</div>
          <div className="bank-item"><strong>A/C Title:</strong> {school.feeConfig?.masterTemplate?.accountTitle || 'School Management'}</div>
          <div className="bank-item" style={{ gridColumn: 'span 2' }}><strong>A/C No:</strong> {school.feeConfig?.masterTemplate?.accountNo || '1041-4455989746-971'}</div>
          <div className="bank-item" style={{ gridColumn: 'span 2' }}><strong>Branch:</strong> {school.feeConfig?.masterTemplate?.branchName || 'Main Branch'}</div>
        </div>
      </div>

      <div className="qr-section">
        <div className="qr-container">
          <QRCodeSVG value={qrValue} size={60} level="L" />
        </div>
        <div className="signature-section">
          <div className="sig-box">Depositor</div>
          <div className="sig-box">Authorized</div>
        </div>
      </div>
      
      <div className="footer-note">This is a system generated challan. No signature required.</div>
    </div>
  );

  if (singleCopy) {
    return (
      <div className={`challan-preview-single ${className}`} style={{ width: '450px', margin: 'auto', background: '#fff', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.15)', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Copy title="Preview Copy" />
      </div>
    );
  }

  return (
    <div className={`challan-print-wrapper ${className}`} style={{ display: 'flex', width: '1120px', margin: 'auto', background: '#fff', minHeight: '800px', border: '1px solid #eee' }}>
      <Copy title="Bank Copy" />
      <Copy title="School Copy" />
      <Copy title="Student Copy" />
    </div>
  );
};

export default FeeChallan;
