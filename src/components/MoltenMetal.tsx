import React, { useEffect, useRef } from 'react';

interface MoltenMetalProps {
  speed?: number;
  opacity?: number;
  mouseStrength?: number;
  grainIntensity?: number;
}

export function MoltenMetal({
  speed = 0.42,
  opacity = 0.75,
  mouseStrength = 0.3,
  grainIntensity = 0.025
}: MoltenMetalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Flow particles
    const waveCount = 5;
    const waves: {
      x: number;
      y: number;
      radius: number;
      angle: number;
      speed: number;
      color: string;
    }[] = [
      { x: width * 0.2, y: height * 0.3, radius: Math.max(width, height) * 0.5, angle: 0, speed: 0.002, color: '#641E2A' }, // Burgundy
      { x: width * 0.8, y: height * 0.2, radius: Math.max(width, height) * 0.6, angle: 1.2, speed: 0.0015, color: '#A9653F' }, // Copper
      { x: width * 0.4, y: height * 0.8, radius: Math.max(width, height) * 0.55, angle: 2.5, speed: 0.0018, color: '#D6A85F' }, // Gold
      { x: width * 0.7, y: height * 0.7, radius: Math.max(width, height) * 0.45, angle: 3.8, speed: 0.0022, color: '#641E2A' }, // Burgundy
      { x: width * 0.1, y: height * 0.9, radius: Math.max(width, height) * 0.5, angle: 5.0, speed: 0.0012, color: '#A9653F' }  // Copper
    ];

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Grain canvas buffer
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = 128;
    grainCanvas.height = 128;
    const grainCtx = grainCanvas.getContext('2d');
    if (grainCtx) {
      const grainImg = grainCtx.createImageData(128, 128);
      for (let i = 0; i < grainImg.data.length; i += 4) {
        const val = Math.floor(Math.random() * 255);
        grainImg.data[i] = val;
        grainImg.data[i + 1] = val;
        grainImg.data[i + 2] = val;
        grainImg.data[i + 3] = Math.floor(grainIntensity * 255);
      }
      grainCtx.putImageData(grainImg, 0, 0);
    }

    const draw = () => {
      // Background base
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse tracking
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Draw flowing molten waves
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'blur(110px)';

      waves.forEach((wave) => {
        wave.angle += wave.speed * speed * 2;
        
        // Circular motion with noise
        const offsetX = Math.cos(wave.angle) * 80;
        const offsetY = Math.sin(wave.angle) * 80;
        
        // Mouse influence
        const dx = mouse.x - wave.x;
        const dy = mouse.y - wave.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = Math.max(0, 1 - dist / (Math.max(width, height) * 0.8));
        const pushX = (dx / dist) * force * 150 * mouseStrength;
        const pushY = (dy / dist) * force * 150 * mouseStrength;

        const currentX = wave.x + offsetX + pushX;
        const currentY = wave.y + offsetY + pushY;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(
          currentX,
          currentY,
          wave.radius * 0.05,
          currentX,
          currentY,
          wave.radius
        );
        grad.addColorStop(0, wave.color);
        grad.addColorStop(1, 'rgba(8, 8, 8, 0)');

        ctx.fillStyle = grad;
        ctx.arc(currentX, currentY, wave.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Overlay grain noise
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      
      const pattern = ctx.createPattern(grainCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [speed, opacity, mouseStrength, grainIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] transition-opacity duration-700"
      style={{ opacity, mixBlendMode: 'normal' }}
    />
  );
}
