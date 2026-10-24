/**
 * WCAG 2.1 Contrast Calculation & Compliance Utilities
 */

/**
 * Normalizes hex string to 6-digit hex (e.g. #fff -> #ffffff, #2563EB -> #2563eb).
 */
export function normalizeHex(hex: string): string {
  let clean = hex.replace('#', '').trim().toLowerCase();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  return `#${clean.padEnd(6, '0').slice(0, 6)}`;
}

/**
 * Calculates relative luminance for an sRGB hex color.
 * Standard WCAG 2.1 definition:
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(hex: string): number {
  const norm = normalizeHex(hex).slice(1);
  const r = parseInt(norm.substring(0, 2), 16) / 255;
  const g = parseInt(norm.substring(2, 4), 16) / 255;
  const b = parseInt(norm.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculates contrast ratio between foreground color and background color (defaults to pure white #ffffff).
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.
 * Returns ratio rounded to 2 decimal places.
 */
export function getContrastRatio(fgHex: string, bgHex: string = '#ffffff'): number {
  const lum1 = getRelativeLuminance(fgHex);
  const lum2 = getRelativeLuminance(bgHex);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Checks if color meets WCAG AA requirement (>= 4.5:1 for normal text).
 */
export function isWcagCompliant(fgHex: string, bgHex: string = '#ffffff'): boolean {
  return getContrastRatio(fgHex, bgHex) >= 4.5;
}

/**
 * Converts RGB to HSL.
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

/**
 * Converts HSL to Hex.
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Automatically suggests a darker variant of the given color that achieves at least 4.5:1 contrast against white.
 */
export function suggestDarkerVariant(hex: string, targetRatio: number = 4.5): string {
  if (isWcagCompliant(hex, '#ffffff')) {
    return normalizeHex(hex);
  }

  const norm = normalizeHex(hex).slice(1);
  const r = parseInt(norm.substring(0, 2), 16);
  const g = parseInt(norm.substring(2, 4), 16);
  const b = parseInt(norm.substring(4, 6), 16);

  const [h, s, initialL] = rgbToHsl(r, g, b);
  let l = initialL;

  // Step down lightness until contrast ratio meets threshold
  while (l > 0.05) {
    l -= 0.02;
    const candidate = hslToHex(h, s, l);
    if (getContrastRatio(candidate, '#ffffff') >= targetRatio) {
      return candidate;
    }
  }

  return '#0f172a'; // fallback dark charcoal
}
