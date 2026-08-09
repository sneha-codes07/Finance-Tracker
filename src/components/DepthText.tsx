import React, { useEffect, useRef, useState } from 'react';

interface DepthTextProps {
  text: string;
  layers?: number;
  depth?: number;
  tilt?: number;
  orbitSpeed?: number;
  faceColor?: string;
  depthColor?: string;
}

export function DepthText({
  text,
  layers = 30,
  depth = 2.2,
  tilt = 6,
  orbitSpeed = 0.18,
  faceColor = '#F5F1E8',
  depthColor = '#D6A85F'
}: DepthTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animId: number;
    let angle = 0;

    const tick = () => {
      angle += orbitSpeed;
      // Orbiting tilt effect
      setRot({
        x: Math.sin(angle * 0.03) * tilt,
        y: Math.cos(angle * 0.03) * tilt
      });
      animId = requestAnimationFrame(tick);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const x = (e.clientY / h - 0.5) * tilt * 2;
      const y = (e.clientX / w - 0.5) * tilt * -2;
      setRot({ x, y });
    };

    // Use auto orbit, override on mouse move
    tick();
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [orbitSpeed, tilt]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center select-none perspective-[900px] backface-hidden overflow-hidden"
      style={{ perspective: '900px' }}
    >
      <div
        className="relative transition-transform duration-300 ease-out preserve-3d"
        style={{
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Render 3D layers behind the text */}
        {Array.from({ length: layers }).map((_, i) => {
          const zIndex = layers - i;
          const translateZ = -i * (depth / layers) * 12;
          const opacity = 1 - i / layers;
          return (
            <span
              key={i}
              className="absolute left-0 top-0 right-0 bottom-0 flex items-center justify-center font-black leading-none font-serif select-none"
              style={{
                color: i === 0 ? faceColor : depthColor,
                transform: `translateZ(${translateZ}px)`,
                zIndex,
                opacity: i === 0 ? 1 : opacity * 0.85,
                textShadow: i === layers - 1 ? '0 10px 20px rgba(0,0,0,0.5)' : 'none',
                fontSize: 'clamp(2.5rem, 9.5vw, 6.5rem)',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              {text}
            </span>
          );
        })}
        {/* Invisible placeholder for sizing */}
        <span
          className="font-black leading-none font-serif opacity-0 select-none pointer-events-none"
          style={{ fontSize: 'clamp(2.5rem, 9.5vw, 6.5rem)', whiteSpace: 'nowrap' }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
