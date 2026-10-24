import React, { useEffect, useRef } from 'react';
import { computeGridFrameResponse } from '../lib/gridPhysics';

interface InteractiveGridBackgroundProps {
  lowDataMode?: boolean;
}

/**
 * Renders the CyberShield Ghana deep-black sci-fi background with interactive
 * square and rectangular HUD frames that move, scale, and glow as the mouse
 * cursor hovers around them. Uses on-demand frame scheduling so idle CPU usage is zero.
 */
export const InteractiveGridBackground: React.FC<InteractiveGridBackgroundProps> = ({
  lowDataMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReduced = mq.matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetCursor: { x: number | null; y: number | null } = {
      x: null,
      y: null,
    };
    const smoothCursor: { x: number | null; y: number | null } = {
      x: null,
      y: null,
    };

    let rafId = 0;
    let isAnimating = false;
    const cellSize = 56;
    const interactionRadius = 250;

    const renderGrid = () => {
      ctx.clearRect(0, 0, width, height);

      // Soft cursor spotlight aura in the background
      if (smoothCursor.x !== null && smoothCursor.y !== null && !prefersReduced && !lowDataMode) {
        const radial = ctx.createRadialGradient(
          smoothCursor.x,
          smoothCursor.y,
          10,
          smoothCursor.x,
          smoothCursor.y,
          interactionRadius
        );
        radial.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
        radial.addColorStop(0.5, 'rgba(124, 58, 237, 0.06)');
        radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);
      }

      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const baseX = c * cellSize;
          const baseY = r * cellSize;
          const centerX = baseX + cellSize * 0.5;
          const centerY = baseY + cellSize * 0.5;

          // Deterministically make every 9th cell a wider rectangular HUD frame
          const isWideRect = (r * 7 + c * 13) % 9 === 0;
          const frameW = isWideRect ? cellSize * 1.65 : cellSize - 8;
          const frameH = isWideRect ? cellSize * 0.72 : cellSize - 8;

          const response =
            prefersReduced || lowDataMode
              ? { offsetX: 0, offsetY: 0, scale: 1, intensity: 0 }
              : computeGridFrameResponse(
                  centerX,
                  centerY,
                  smoothCursor.x,
                  smoothCursor.y,
                  interactionRadius,
                  13
                );

          const ambientHighlight = (r * 11 + c * 5) % 17 === 0 ? 0.04 : 0;
          const totalIntensity = Math.min(1, response.intensity + ambientHighlight);

          const drawW = frameW * response.scale;
          const drawH = frameH * response.scale;
          const drawX = centerX + response.offsetX - drawW * 0.5;
          const drawY = centerY + response.offsetY - drawH * 0.5;

          const borderAlpha = 0.05 + totalIntensity * 0.48;
          if (totalIntensity > 0.35) {
            ctx.strokeStyle =
              (r + c) % 3 === 0
                ? `rgba(124, 58, 237, ${borderAlpha.toFixed(3)})`
                : `rgba(0, 240, 255, ${borderAlpha.toFixed(3)})`;
          } else {
            ctx.strokeStyle = `rgba(148, 163, 184, ${borderAlpha.toFixed(3)})`;
          }

          ctx.lineWidth = totalIntensity > 0.25 ? 1.35 : 0.8;
          ctx.strokeRect(drawX, drawY, drawW, drawH);

          // Glowing interior fill & corner brackets when hovered nearby
          if (totalIntensity > 0.08) {
            ctx.fillStyle =
              (r + c) % 4 === 0
                ? `rgba(124, 58, 237, ${(totalIntensity * 0.12).toFixed(3)})`
                : `rgba(0, 240, 255, ${(totalIntensity * 0.1).toFixed(3)})`;
            ctx.fillRect(drawX, drawY, drawW, drawH);

            if (totalIntensity > 0.28) {
              const tick = Math.min(7, drawW * 0.22);
              ctx.strokeStyle =
                (r + c) % 7 === 0
                  ? `rgba(245, 183, 0, ${(totalIntensity * 0.85).toFixed(3)})`
                  : `rgba(0, 240, 255, ${(totalIntensity * 0.9).toFixed(3)})`;
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(drawX, drawY + tick);
              ctx.lineTo(drawX, drawY);
              ctx.lineTo(drawX + tick, drawY);
              ctx.moveTo(drawX + drawW - tick, drawY + drawH);
              ctx.lineTo(drawX + drawW, drawY + drawH);
              ctx.lineTo(drawX + drawW, drawY + drawH - tick);
              ctx.stroke();
            }
          }
        }
      }
    };

    const stepAnimation = () => {
      if (targetCursor.x !== null && targetCursor.y !== null) {
        if (smoothCursor.x === null || smoothCursor.y === null) {
          smoothCursor.x = targetCursor.x;
          smoothCursor.y = targetCursor.y;
        } else {
          smoothCursor.x += (targetCursor.x - smoothCursor.x) * 0.24;
          smoothCursor.y += (targetCursor.y - smoothCursor.y) * 0.24;
        }
        renderGrid();

        const dist = Math.hypot(
          targetCursor.x - smoothCursor.x,
          targetCursor.y - smoothCursor.y
        );
        if (dist > 0.5 && !prefersReduced && !lowDataMode) {
          rafId = window.requestAnimationFrame(stepAnimation);
        } else {
          isAnimating = false;
        }
      } else {
        smoothCursor.x = null;
        smoothCursor.y = null;
        renderGrid();
        isAnimating = false;
      }
    };

    const scheduleStep = () => {
      if (!isAnimating) {
        isAnimating = true;
        rafId = window.requestAnimationFrame(stepAnimation);
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderGrid();
    };

    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      targetCursor.x = e.clientX;
      targetCursor.y = e.clientY;
      if (smoothCursor.x === null || smoothCursor.y === null) {
        smoothCursor.x = e.clientX;
        smoothCursor.y = e.clientY;
      }
      scheduleStep();
    };

    const onMouseLeave = () => {
      targetCursor.x = null;
      targetCursor.y = null;
      scheduleStep();
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
      renderGrid();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);
    mq.addEventListener('change', handleMotionChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      mq.removeEventListener('change', handleMotionChange);
    };
  }, [lowDataMode]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="interactive-grid-canvas"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 block"
    />
  );
};
