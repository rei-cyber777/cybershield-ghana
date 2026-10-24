/**
 * Pure math helpers for the interactive CyberShield grid background.
 * Calculates how each square/rectangular frame shifts, scales, and glows
 * when the mouse cursor moves near it.
 */

export interface GridFrameTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
  intensity: number; // 0 to 1
}

/**
 * Computes the displacement (offsetX, offsetY), scale factor, and glow intensity
 * of a grid square/rectangle centered at (cellCenterX, cellCenterY) relative to
 * the mouse cursor at (cursorX, cursorY).
 */
export function computeGridFrameResponse(
  cellCenterX: number,
  cellCenterY: number,
  cursorX: number | null,
  cursorY: number | null,
  interactionRadius = 220,
  maxShiftPx = 11
): GridFrameTransform {
  if (cursorX === null || cursorY === null || interactionRadius <= 0) {
    return { offsetX: 0, offsetY: 0, scale: 1, intensity: 0 };
  }

  const dx = cellCenterX - cursorX;
  const dy = cellCenterY - cursorY;
  const distance = Math.hypot(dx, dy);

  if (distance >= interactionRadius) {
    return { offsetX: 0, offsetY: 0, scale: 1, intensity: 0 };
  }

  // Smooth cubic falloff from 1 at the cursor center to 0 at interactionRadius
  const normalized = 1 - distance / interactionRadius;
  const intensity = Number((normalized * normalized * (3 - 2 * normalized)).toFixed(4));

  // Push/pull vector so squares/rectangles visibly move when hovered around that place
  const angle = distance > 0.001 ? Math.atan2(dy, dx) : 0;
  const shiftMagnitude = Math.sin(normalized * Math.PI) * maxShiftPx;

  const offsetX = Number((Math.cos(angle) * shiftMagnitude).toFixed(2));
  const offsetY = Number((Math.sin(angle) * shiftMagnitude).toFixed(2));
  const scale = Number((1 + intensity * 0.14).toFixed(3));

  return {
    offsetX,
    offsetY,
    scale,
    intensity,
  };
}
