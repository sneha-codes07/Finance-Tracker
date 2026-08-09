import React, { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Detect mobile touch devices
    const checkTouch = () => {
      const touchCapable =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches);
      setIsMobile(touchCapable);
    };

    checkTouch();

    if (isMobile) return;

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
      }
    };

    // Smoothly animate the cursor ring
    let frameId: number;
    const animate = () => {
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${mouse.x - 14}px, ${mouse.y - 14}px, 0)`;
      }

      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    // Event listeners to handle interactive states
    const addHover = () => setIsHovered(true);
    const removeHover = () => setIsHovered(false);

    const updateHoverTargets = () => {
      const targets = document.querySelectorAll('button, a, select, input, label, [role="button"], [onclick]');
      targets.forEach((el) => {
        el.addEventListener('mouseenter', addHover);
        el.addEventListener('mouseleave', removeHover);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Check for interactive targets periodically (to account for route changes/renders)
    const interval = setInterval(updateHoverTargets, 1000);
    updateHoverTargets();

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
      
      const targets = document.querySelectorAll('button, a, select, input, label, [role="button"]');
      targets.forEach((el) => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
      });
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      {/* Primary Small Dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-[var(--accent)] pointer-events-none z-[9999] transition-transform duration-75 ease-out"
        style={{ transform: 'translate3d(-10px, -10px, 0)' }}
      />
      {/* Lagging Ring / Trail */}
      <div
        ref={cursorRingRef}
        className={`fixed top-0 left-0 w-7 h-7 rounded-full border border-[var(--copper)]/40 pointer-events-none z-[9998] transition-all duration-300 ease-out ${
          isHovered ? 'scale-[1.8] bg-[var(--accent-light)]/20 border-[var(--accent)]' : ''
        }`}
        style={{
          transform: 'translate3d(-50px, -50px, 0)',
          boxShadow: isHovered ? '0 0 15px rgba(214, 168, 95, 0.2)' : 'none'
        }}
      />
    </>
  );
}
