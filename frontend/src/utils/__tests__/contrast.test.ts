import { describe, it, expect } from 'vitest';
import { getContrastRatio, isWcagCompliant, suggestDarkerVariant } from '../contrast';

describe('WCAG Contrast Utilities', () => {
  it('calculates contrast ratio for standard edge-case colors against pure white (#FFFFFF)', () => {
    // 1. #000000 (Pure Black) -> Max contrast ~21:1
    const blackRatio = getContrastRatio('#000000', '#ffffff');
    expect(blackRatio).toBe(21);
    expect(isWcagCompliant('#000000')).toBe(true);

    // 2. #FFFFFF (Pure White) -> Min contrast 1:1
    const whiteRatio = getContrastRatio('#ffffff', '#ffffff');
    expect(whiteRatio).toBe(1);
    expect(isWcagCompliant('#ffffff')).toBe(false);

    // 3. #2563EB (Tailwind Blue-600) -> Exact ratio 5.17:1 (WCAG AA compliant)
    const blueRatio = getContrastRatio('#2563eb', '#ffffff');
    expect(blueRatio).toBeCloseTo(5.17, 1);
    expect(isWcagCompliant('#2563eb')).toBe(true);

    // 4. #FBBF24 (Tailwind Amber-400 / Light Yellow) -> Exact ratio 1.67:1 (< 4.5:1, Non-compliant)
    const yellowRatio = getContrastRatio('#fbbf24', '#ffffff');
    expect(yellowRatio).toBeCloseTo(1.67, 1);
    expect(isWcagCompliant('#fbbf24')).toBe(false);

    // 5. #7C3AED (Tailwind Purple-600) -> Exact ratio 5.70:1 (WCAG AA compliant)
    const purpleRatio = getContrastRatio('#7c3aed', '#ffffff');
    expect(purpleRatio).toBeCloseTo(5.70, 1);
    expect(isWcagCompliant('#7c3aed')).toBe(true);
  });

  it('suggestDarkerVariant produces a WCAG AA compliant color (>= 4.5:1) for low contrast colors', () => {
    const lowContrastYellow = '#fbbf24';
    expect(isWcagCompliant(lowContrastYellow)).toBe(false);

    const compliantVariant = suggestDarkerVariant(lowContrastYellow);
    expect(isWcagCompliant(compliantVariant)).toBe(true);
    expect(getContrastRatio(compliantVariant, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('suggestDarkerVariant returns the original color if already compliant', () => {
    const compliantColor = '#2563eb';
    expect(suggestDarkerVariant(compliantColor)).toBe('#2563eb');
  });
});
