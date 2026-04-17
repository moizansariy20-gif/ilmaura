
import React from 'react';
import { User } from 'lucide-react';

interface IDCardRendererProps {
  student: any;
  school: any;
}

const IDCardRenderer: React.FC<IDCardRendererProps> = ({ student, school }) => {
  const config = school.idCardConfig || { elements: {}, templateUrl: '' };
  
  // Standard ID Card Size (Vertical) - roughly CR80 size scaled up for clarity
  // 2.125 inch x 3.375 inch. @ 96 DPI ~ 204px x 324px. 
  // We will use a larger base for high-quality print scaling: 350px x 550px (matching the designer)
  const CARD_WIDTH = 350;
  const CARD_HEIGHT = 550;

  return (
    <div 
      className="relative bg-white dark:bg-slate-800 shadow-sm overflow-hidden print:shadow-none print:border print:border-slate-200 dark:border-slate-700"
      style={{ 
        width: `${CARD_WIDTH}px`, 
        height: `${CARD_HEIGHT}px`,
        backgroundImage: config.templateUrl ? `url(${config.templateUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'white',
        pageBreakInside: 'avoid', // Crucial for printing
        margin: '0 auto'
      }}
    >
      {/* Background Fallback */}
      {!config.templateUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
           <p className="font-bold text-xs uppercase tracking-widest">No Template</p>
        </div>
      )}

      {/* Elements Layer */}
      {Object.entries(config.elements || {}).map(([key, el]: any) => {
        if (!el.visible) return null;

        const style: React.CSSProperties = {
            position: 'absolute',
            left: `${el.x}%`,
            top: `${el.y}%`,
            transform: 'translate(-50%, -50%)',
            color: el.color,
            fontSize: `${el.fontSize}px`,
            fontWeight: el.fontWeight || 'normal',
            textAlign: el.textAlign || 'left',
            whiteSpace: 'nowrap',
            zIndex: 10,
            width: el.width ? `${el.width}%` : 'auto',
            height: el.height ? `${el.height}%` : 'auto',
        };

        // 1. Handle Photo
        if (el.type === 'image' || key === 'photo') {
            return (
                <div 
                    key={key} 
                    style={{...style, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: student.photoURL ? 'transparent' : '#f1f5f9'}}
                >
                    {student.photoURL ? (
                        <img 
                            src={student.photoURL} 
                            alt={student.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User size={el.width ? el.width * 2 : 48} className="text-slate-300" />
                    )}
                </div>
            );
        }

        // 2. Handle Text Content
        let content = el.label || '';
        
        // Data Binding
        if (key === 'name') content = student.name;
        else if (key === 'rollNo') content = student.rollNo;
        else if (key === 'fatherName') content = student.fatherName || '';
        else if (key === 'phone') content = student.phone || '';
        else if (key === 'dob') content = student.dob || '';
        // Note: For 'class' we rely on the parent passing a student object that might have classId mapped, 
        // usually student objects here need className injected or we lookup. 
        // For simplicity in this renderer, we assume student.className or we fallback.
        else if (key === 'class') content = student.className || student.classId || '';
        
        // Custom static fields use the label directly (handled by default 'let content')

        return (
            <div key={key} style={style}>
                {content}
            </div>
        );
      })}
    </div>
  );
};

export default IDCardRenderer;
