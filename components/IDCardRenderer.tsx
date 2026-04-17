
import React from 'react';
import { User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface IDCardRendererProps {
  school: any;
  student?: any; // Auto-fill data (optional)
  data?: Record<string, string>; // Manual override data (optional)
  side?: 'front' | 'back'; // Which side to render
}

const IDCardRenderer: React.FC<IDCardRendererProps> = ({ school, student, data, side = 'front' }) => {
  if (!school) return null; // Safety check
  
  const config = school.idCardConfig || { elements: {}, templateUrl: '' };
  
  // Determine Orientation
  const orientation = config.orientation || 'portrait';
  const isLandscape = orientation === 'landscape';

  // Decide which config to use based on 'side'
  const currentElements = side === 'front' ? config.elements : (config.backElements || {});
  const currentTemplateUrl = side === 'front' ? config.templateUrl : (config.backTemplateUrl || '');
  
  // Use signature from Fee Config (Master Template) as source of truth for now
  const signatureSrc = school.feeConfig?.masterTemplate?.signatureURL;

  // Dynamic Size based on Orientation
  const CARD_WIDTH = isLandscape ? 856 : 540;
  const CARD_HEIGHT = isLandscape ? 540 : 856;

  // Helper to get value
  const getValue = (key: string) => {
      // 0. AUTO-POPULATE SCHOOL DETAILS
      if (key === 'schoolName') return school.name?.toUpperCase() || 'SCHOOL NAME';
      if (key === 'address_school') return school.address || school.city || 'School Address Not Set'; // Fallback to city or hardcoded address if not in school obj
      if (key === 'address') return school.address || school.city || 'School Address Not Set'; // Common pattern for back address

      // 1. Check manual data override first (from the Issue Card Form)
      if (data && data[key] !== undefined) return data[key];
      
      // 2. Check student object (from the Database)
      if (student) {
          if (key === 'class') return student.className || student.classId || '';
          if (key === 'fatherName' || key === 'guardianName') return student.fatherName || student.guardianName || '';
          if (key === 'studentName' || key === 'name') return student.name || '';
          if (key === 'regNo' || key === 'rollNo') return student.rollNo || student.admissionNo || student.regNo || '';
          if (key === 'phone' || key === 'guardianPhone') return student.phone || student.guardianPhone || '';
          // Generic fallback for any other key in student object
          return student[key] || student.customData?.[key] || '';
      }
      return ''; // Placeholder/Empty if nothing found
  };

  const getPhoto = () => {
      // 1. Check manual data (if a photo URL was passed in data)
      if (data && data['photo']) return data['photo'];
      // 2. Check student photo
      if (student && student.photoURL) return student.photoURL;
      return null;
  };

  const photoSrc = getPhoto();

  return (
    <div 
      className="relative shadow-sm overflow-hidden print:shadow-none print:border print:border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      style={{ 
        width: `${CARD_WIDTH}px`, 
        height: `${CARD_HEIGHT}px`,
        pageBreakInside: 'avoid',
        margin: '0 auto',
        flexShrink: 0
      }}
    >
      {/* Background Image */}
      {currentTemplateUrl && (
        <img 
          src={currentTemplateUrl} 
          className="absolute inset-0 w-full h-full object-fill"
          crossOrigin="anonymous"
          alt="Background"
        />
      )}

      {/* Render Image Elements (Photo, Logo, Signature) as HTML for better PDF support */}
      {Object.entries(currentElements || {}).map(([key, el]: any) => {
        if (!el.visible || el.type !== 'image') return null;

        const xPos = ((el.x || 0) / 100) * CARD_WIDTH;
        const yPos = ((el.y || 0) / 100) * CARD_HEIGHT;
        const imgWidth = ((el.width || 10) / 100) * CARD_WIDTH;
        const imgHeight = ((el.height || 10) / 100) * CARD_HEIGHT;
        const imgX = xPos - (imgWidth / 2);
        const imgY = yPos - (imgHeight / 2);

        if (key === 'photo') {
          return (
            <div 
              key={key} 
              className="absolute overflow-hidden bg-slate-200 border border-slate-300"
              style={{ 
                left: `${imgX}px`, 
                top: `${imgY}px`, 
                width: `${imgWidth}px`, 
                height: `${imgHeight}px`,
                borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}%` : '4px',
                opacity: el.opacity ?? 1,
                transform: `rotate(${el.rotation || 0}deg)`
              }}
            >
              {photoSrc ? (
                <img 
                  src={photoSrc} 
                  className="w-full h-full object-cover" 
                  crossOrigin="anonymous"
                  alt="Student"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <User size={imgWidth * 0.4} />
                  <span className="text-[6px] font-bold uppercase mt-1">Photo</span>
                </div>
              )}
            </div>
          );
        }

        if (key === 'logo' || key === 'schoolLogo' || key === 'signature') {
          const imgSrc = key === 'signature' ? signatureSrc : school.logoURL;
          return (
            <div 
              key={key} 
              className="absolute flex items-center justify-center overflow-hidden"
              style={{ 
                left: `${imgX}px`, 
                top: `${imgY}px`, 
                width: `${imgWidth}px`, 
                height: `${imgHeight}px`,
                borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}%` : '0px',
                opacity: el.opacity ?? 1,
                transform: `rotate(${el.rotation || 0}deg)`
              }}
            >
              {imgSrc ? (
                <img 
                  src={imgSrc} 
                  className="w-full h-full object-fill" 
                  crossOrigin="anonymous"
                  alt={key}
                />
              ) : (
                <div className="w-full h-full bg-slate-200/50" />
              )}
            </div>
          );
        }

        if (key === 'qr_code') {
          const qrValue = student ? (student.rollNo || student.admissionNo || student.id || 'N/A') : '123456789';
          return (
            <div 
              key={key} 
              className="absolute flex items-center justify-center [&>svg]:w-full [&>svg]:h-full overflow-hidden"
              style={{ 
                left: `${imgX}px`, 
                top: `${imgY}px`, 
                width: `${imgWidth}px`, 
                height: `${imgHeight}px`,
                borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}%` : '0px',
                opacity: el.opacity ?? 1,
                transform: `rotate(${el.rotation || 0}deg)`
              }}
            >
              <QRCodeSVG value={qrValue} bgColor="transparent" width="100%" height="100%" />
            </div>
          );
        }

        if (key === 'barcode') {
          const barcodeValue = student ? (student.rollNo || student.admissionNo || student.id || 'N/A') : '123456789';
          return (
            <div 
              key={key} 
              className="absolute flex items-center justify-center [&>svg]:w-full [&>svg]:h-full overflow-hidden"
              style={{ 
                left: `${imgX}px`, 
                top: `${imgY}px`, 
                width: `${imgWidth}px`, 
                height: `${imgHeight}px`,
                borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}%` : '0px',
                opacity: el.opacity ?? 1,
                transform: `rotate(${el.rotation || 0}deg)`
              }}
            >
              <Barcode value={barcodeValue} displayValue={false} background="transparent" margin={0} />
            </div>
          );
        }
        return null;
      })}

      {/* SVG Container for crisp text rendering */}
      <svg width={CARD_WIDTH} height={CARD_HEIGHT} viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`} className="absolute inset-0 w-full h-full pointer-events-none">
        
        {/* Render Text elements */}
        {Object.entries(currentElements || {}).map(([key, el]: any) => {
          if (!el.visible || el.type === 'image') return null;

          const xPos = ((el.x || 0) / 100) * CARD_WIDTH;
          const yPos = ((el.y || 0) / 100) * CARD_HEIGHT;
          const textWidth = ((el.width || 10) / 100) * CARD_WIDTH;

          // Determine text anchor and final X position based on alignment
          // In the studio, elements are divs centered at (x, y) with a specific width.
          // We simulate this by adjusting the start/middle/end point of the SVG text.
          let finalX = xPos;
          let anchor = "middle";
          const align = el.textAlign || 'left';

          if (align === 'left') {
            finalX = xPos - (textWidth / 2);
            anchor = "start";
          } else if (align === 'right') {
            finalX = xPos + (textWidth / 2);
            anchor = "end";
          } else {
            finalX = xPos;
            anchor = "middle";
          }

          // 3. Handle Text Content
          let content = el.label || '';
          const dynamicVal = getValue(key);
          if (dynamicVal && !key.startsWith('custom_text') && !key.startsWith('label_')) {
              content = el.prefix ? `${el.prefix} ${dynamicVal}` : dynamicVal;
          }

          // Scale font size and letter spacing relative to the editor canvas size
          const editorWidth = isLandscape ? 555 : 350;
          const scaleRatio = CARD_WIDTH / editorWidth;
          const scaledFontSize = (el.fontSize || 12) * scaleRatio;
          const scaledLetterSpacing = (el.letterSpacing || 0) * scaleRatio;

          return (
            <text
              key={key}
              x={finalX}
              y={yPos}
              fill={el.color}
              fontSize={scaledFontSize}
              fontFamily={el.fontFamily || 'Inter, sans-serif'}
              fontWeight={el.fontWeight || 'normal'}
              letterSpacing={scaledLetterSpacing ? `${scaledLetterSpacing}px` : 'normal'}
              textAnchor={anchor as "start" | "middle" | "end"}
              dominantBaseline="middle"
              transform={`rotate(${el.rotation || 0}, ${xPos}, ${yPos})`}
              opacity={el.opacity ?? 1}
            >
              {String(content).split('\n').map((line: string, i: number) => (
                <tspan key={i} x={finalX} textAnchor={anchor as "start" | "middle" | "end"} dy={i === 0 ? 0 : scaledFontSize * 1.2}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default IDCardRenderer;
