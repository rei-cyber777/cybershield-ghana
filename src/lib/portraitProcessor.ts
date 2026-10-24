/**
 * Pure monochrome (black & white) and chroma-despill pixel processor
 * for the Creator portrait (/assets/aistudio/rei_kn_d5c40a28.jpg).
 */

export interface MonochromePixelResult {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Converts an RGBA pixel into a pure black-and-white (grayscale) pixel,
 * optionally removing chroma-key green screen background and suppressing green edge spill
 * so the black-and-white portrait sits cleanly against the dark CyberShield studio backdrop.
 */
export function convertPixelToStudioMonochrome(
  r: number,
  g: number,
  b: number,
  a: number = 255,
  removeGreenScreen: boolean = true
): MonochromePixelResult {
  const maxRB = Math.max(r, b);
  const greenExcess = g - maxRB;

  // Suppress green chroma spill on hair/skin edges before computing B&W luminance
  const despilledG = greenExcess > 0 ? maxRB : g;

  // Standard ITU-R BT.601 luminance formula for natural skin-tone grayscale
  const rawLuminance = 0.299 * r + 0.587 * despilledG + 0.114 * b;

  // Apply subtle editorial studio contrast (1.12x centered at 128)
  const contrasted = (rawLuminance - 128) * 1.12 + 128;
  const gray = Math.max(0, Math.min(255, Math.round(contrasted)));

  if (!removeGreenScreen) {
    return { r: gray, g: gray, b: gray, a };
  }

  // Smoothly key out pure chroma-green background pixels (where G strongly exceeds R and B)
  const thresholdLow = 38;
  const thresholdHigh = 95;
  let outAlpha = a;

  if (greenExcess >= thresholdHigh && g > 110) {
    outAlpha = 0;
  } else if (greenExcess > thresholdLow && g > 85) {
    const t = (greenExcess - thresholdLow) / (thresholdHigh - thresholdLow);
    outAlpha = Math.round(a * Math.max(0, Math.min(1, 1 - t)));
  }

  return {
    r: gray,
    g: gray,
    b: gray,
    a: outAlpha,
  };
}

/**
 * Processes an entire RGBA Uint8ClampedArray buffer in-place into pure Black & White.
 */
export function processImageDataToMonochrome(
  data: Uint8ClampedArray,
  removeGreenScreen: boolean = true
): void {
  for (let i = 0; i < data.length; i += 4) {
    const res = convertPixelToStudioMonochrome(
      data[i],
      data[i + 1],
      data[i + 2],
      data[i + 3],
      removeGreenScreen
    );
    data[i] = res.r;
    data[i + 1] = res.g;
    data[i + 2] = res.b;
    data[i + 3] = res.a;
  }
}
