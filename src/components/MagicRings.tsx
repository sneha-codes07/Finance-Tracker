import React, { useEffect, useRef } from 'react';

interface MagicRingsProps {
  ringCount?: number;
  speed?: number;
  opacity?: number;
  lineThickness?: number;
  baseRadius?: number;
}

export function MagicRings({
  ringCount = 7,
  speed = 0.7,
  opacity = 0.75,
  lineThickness = 1.5,
  baseRadius = 50
}: MagicRingsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 300);

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    window.addEventListener('resize', handleResize);
    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);

    // Initial mouse pos in center
    mouseRef.current.targetX = width / 2;
    mouseRef.current.targetY = height / 2;
    mouseRef.current.x = width / 2;
    mouseRef.current.y = height / 2;

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse coordinate tracking
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      time += 0.015 * speed;

      // Draw concentric magic rings
      for (let i = 0; i < ringCount; i++) {
        const radius = baseRadius + i * 22;
        const currentAngle = time * (1 - i * 0.06);

        // Center calculation with subtle mouse parallax offset
        const parallaxX = (mouse.x - width / 2) * (0.05 + i * 0.01);
        const parallaxY = (mouse.y - height / 2) * (0.05 + i * 0.01);
        const cx = width / 2 + parallaxX;
        const cy = height / 2 + parallaxY;

        ctx.beginPath();
        ctx.lineWidth = lineThickness;

        // Blended ring colors
        const colorRatio = i / (ringCount - 1 || 1);
        ctx.strokeStyle = `rgba(214, 168, 95, ${0.8 - colorRatio * 0.5})`; // Gold fading to copper

        // Generate distorted wavy magic ring paths
        const points = 72;
        for (let j = 0; j <= points; j++) {
          const theta = (j / points) * Math.PI * 2;
          
          // Double sine wave warp deformation
          const wave = Math.sin(theta * 6 + currentAngle * 4) * 4 * (1 - colorRatio * 0.5);
          const r = radius + wave;

          const px = cx + Math.cos(theta + currentAngle) * r;
          const py = cy + Math.sin(theta + currentAngle) * r;

          if (j === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.closePath();
        ctx.stroke();
      }

      frameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [ringCount, speed, lineThickness, baseRadius]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none transition-opacity duration-500"
      style={{ opacity, mixBlendMode: 'screen' }}
    />
  );
}
