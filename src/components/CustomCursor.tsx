import React, { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  color?: string;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ color = '#007bff' }) => {
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Use refs to store positions for the animation loop
  const mouse = useRef({ x: 0, y: 0 });
  const circle = useRef({ x: 0, y: 0 });
  const scale = useRef(1);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    // Check if it's a touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
      return;
    }

    // Hide system cursor
    document.body.style.cursor = 'none';

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      
      // Check if we should hide the cursor based on the target element
      const target = e.target as HTMLElement;
      const shouldHide = target?.closest('[data-hide-cursor]') !== null;
      const isClickable = target?.closest('button, a, input, select, [role="button"]') !== null;
      
      if (dotRef.current) {
        dotRef.current.style.opacity = shouldHide ? '0' : '1';
      }
      if (circleRef.current) {
        circleRef.current.style.opacity = shouldHide ? '0' : '0.4';
      }

      scale.current = isClickable ? 1.5 : 1;
      mouse.current = { x: e.clientX, y: e.clientY };
      
      // Update dot immediately
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const animate = () => {
      // Lerp (Linear Interpolation) for the smooth, springy trailing effect
      const lerpFactor = 0.08; 
      
      circle.current.x += (mouse.current.x - circle.current.x) * lerpFactor;
      circle.current.y += (mouse.current.y - circle.current.y) * lerpFactor;

      if (circleRef.current) {
        circleRef.current.style.transform = `translate3d(${circle.current.x}px, ${circle.current.y}px, 0) translate(-50%, -50%) scale(${scale.current})`;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    
    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      // Restore system cursor
      document.body.style.cursor = 'auto';
      
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isVisible]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <>
      <div 
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999] hidden md:block"
        style={{ backgroundColor: color }}
      />
      <div 
        ref={circleRef}
        // Removed transition-transform so JS can handle the smooth lerping
        className="fixed top-0 left-0 w-10 h-10 rounded-full border-2 pointer-events-none z-[9998] hidden md:block"
        style={{ borderColor: color, opacity: 0.4 }}
      />
    </>
  );
};

export default CustomCursor;
