
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

  const formatDueDate = (dateStr?: string) => {
    if (dateStr) {
        // If it's YYYY-MM-DD from an input type=date, format it
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [y, m, d] = dateStr.split('-');
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('default', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        return dateStr;
    }
    const dueDay = school.feeConfig?.feeDueDay || 10;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), dueDay).toLocaleDateString('default', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const customBreakdown = school.feeConfig?.classFeeBreakdown?.[student.classId] || [];
  const extraFeesTotal = customBreakdown.reduce((acc, item) => acc + item.amount, 0);

  const challanData = {
    receiptNo: transaction.receiptNo || `REC-${Date.now().toString().slice(-6)}`,
    month: transaction.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    issueDate: new Date().toLocaleDateString('default', { day: '2-digit', month: 'short', year: 'numeric' }),
    dueDate: formatDueDate(transaction.dueDate),
    validityDate: new Date(new Date().getFullYear(), new Date().getMonth(), 28).toLocaleDateString(),
    tuitionFee: Math.max(0, (transaction.amountPaid || 0) - extraFeesTotal),
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

  const totalDues = challanData.tuitionFee + extraFeesTotal + challanData.admissionFee + challanData.annualFee + challanData.labFee + challanData.securityCharges + challanData.sportsFee + challanData.arrears;
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
            padding: 15px;
            border-right: ${singleCopy ? 'none' : '1px dashed #000'};
            display: flex;
            flex-direction: column;
            background: white;
            min-height: 842px;
            position: relative;
            box-sizing: border-box;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            color: #000;
        }
        .copy-section:last-child { border-right: none; }
        
        .header { 
          display: flex; 
          flex-direction: column;
          margin-bottom: 10px;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
        }
        
        .logo-section { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 10px; margin-bottom: 5px; }
        .logo-box { 
          width: 50px; 
          height: 50px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          overflow: hidden;
        }
        .logo-box img { width: 100%; height: 100%; object-fit: contain; filter: grayscale(100%); }
        
        .school-info-header { text-align: left; }
        .school-name { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #000; }
        .school-address { font-size: 10px; margin-top: 2px; color: #000; }

        .receipt-info { 
          display: flex; 
          justify-content: space-between; 
          width: 100%; 
          font-size: 11px; 
          margin-top: 5px; 
          font-weight: bold;
        }

        .copy-badge { 
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          border: 1px solid #000;
          padding: 3px;
          margin-bottom: 10px;
          color: #000;
          background-color: transparent;
        }

        .student-details { 
          border: 1px solid #000;
          padding: 8px;
          margin-bottom: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        
        .detail-item { display: flex; font-size: 11px; color: #000; }
        .detail-label { font-weight: bold; margin-right: 5px; min-width: 60px; }
        .detail-value { font-weight: normal; border-bottom: 1px solid #000; flex-grow: 1; text-transform: uppercase; }

        .fee-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #000; }
        .fee-table th, .fee-table td { 
          border: 1px solid #000;
          padding: 4px 6px;
          font-size: 11px;
          color: #000;
        }
        .fee-table th { 
          text-align: left; 
          font-weight: bold;
          background-color: transparent;
        }
        .text-right { text-align: right !important; }

        .summary-section {
          margin-left: auto;
          width: 100%;
          border: 1px solid #000;
          border-top: none;
        }
        
        .summary-row, .total-payable, .after-due { 
          display: flex; 
          justify-content: space-between; 
          padding: 4px 6px;
          font-size: 11px;
          border-bottom: 1px solid #000;
        }
        .summary-row:last-child { border-bottom: none; }
        .summary-label { font-weight: bold; }
        .summary-value { font-weight: bold; }

        .total-payable {
          font-weight: bold;
          border-bottom: 1px solid #000;
          background-color: #f0f0f0 !important; /* Slight grey for total print contrast */
        }
        .total-amount { font-weight: bold; }

        .after-due {
          font-weight: bold;
        }

        .words-section {
          font-size: 10px;
          font-weight: bold;
          padding: 4px 6px;
          border-bottom: 1px solid #000;
        }

        .bank-info-box {
          border: 1px solid #000;
          padding: 8px;
          margin-top: 10px;
        }
        .bank-title { font-size: 11px; font-weight: bold; margin-bottom: 4px; text-decoration: underline; color: #000; }
        .bank-grid { display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 10px; }
        .bank-item { color: #000; }
        .bank-item strong { font-weight: bold; }

        .qr-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 20px;
        }
        
        .qr-container {
          padding: 4px;
          border: 1px solid #000;
        }

        .signature-section {
          display: flex;
          flex-grow: 1;
          justify-content: space-around;
          margin-left: 20px;
        }
        .sig-box {
          text-align: center;
          border-top: 1px solid #000;
          width: 80px;
          padding-top: 4px;
          font-size: 10px;
          font-weight: bold;
          color: #000;
        }
        
        .footer-note {
          text-align: center;
          font-size: 9px;
          color: #000;
          margin-top: 10px;
          font-style: italic;
        }
      `}</style>

      <div className="copy-badge">{title}</div>
      
      <div className="header">
        <div className="logo-section">
          {school.logoURL && (
            <div className="logo-box">
              <img src={school.logoURL} alt="Logo" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="school-info-header">
            <div className="school-name">{school.name}</div>
            <div className="school-address line-clamp-1">{school.address}</div>
          </div>
        </div>
        <div className="receipt-info">
          <div>Challan #: {challanData.receiptNo}</div>
          <div>Month: {challanData.month}</div>
        </div>
      </div>

      <div className="student-details">
        <div className="detail-item" style={{ gridColumn: 'span 2' }}>
          <span className="detail-label">Student Name</span>
          <span className="detail-value">{student.name}</span>
        </div>
        <div className="detail-item" style={{ gridColumn: 'span 2' }}>
          <span className="detail-label">Father Name</span>
          <span className="detail-value">{student.fatherName || student.customData?.fatherName || ''}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Class</span>
          <span className="detail-value">{getClassName(student.classId)}</span>
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
          {customBreakdown.map((item, idx) => (
              <tr key={idx}><td>{item.name}</td><td className="text-right">{item.amount.toLocaleString()}</td></tr>
          ))}
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
            <span className="summary-value">- Rs. {challanData.discount.toLocaleString()}</span>
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
          <div className="sig-box">{school.feeConfig?.masterTemplate?.signatureLeftLabel || 'Depositor'}</div>
          <div className="sig-box">{school.feeConfig?.masterTemplate?.signatureRightLabel || 'Authorized'}</div>
        </div>
      </div>
      
      <div className="footer-note">{school.feeConfig?.masterTemplate?.footerNote || `This official fee receipt is issued by ${school.name}.`}</div>
    </div>
  );

  if (singleCopy) {
    return (
      <div className={`challan-preview-single ${className}`} style={{ width: '400px', margin: 'auto', background: '#fff', border: '1px solid #000' }}>
        <Copy title="Preview Copy" />
      </div>
    );
  }

  return (
    <div className={`challan-print-wrapper ${className}`} style={{ display: 'flex', width: '100%', maxWidth: '1100px', margin: 'auto', background: '#fff', border: '1px solid #000' }}>
      <Copy title="Bank Copy" />
      <Copy title="School Copy" />
      <Copy title="Student Copy" />
    </div>
  );
};

export default FeeChallan;
