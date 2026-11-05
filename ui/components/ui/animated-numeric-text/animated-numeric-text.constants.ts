/**
 * Glyph motion matching Mobile `AnimatedNumericText`:
 * `ZoomIn.duration(120)`, `ZoomOut.duration(90)`, and
 * `LinearTransition.duration(160)`, all with `Easing.out(Easing.cubic)`.
 */
export const GLYPH_ENTER_DURATION = 120;

export const GLYPH_EXIT_DURATION = 90;

export const GLYPH_LAYOUT_DURATION = 160;

/** CSS equivalent of Reanimated `Easing.out(Easing.cubic)`. */
export const GLYPH_EASING = 'cubic-bezier(0.33, 1, 0.68, 1)';

export const GLYPH_ENTER_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(0)' },
  { transform: 'scale(1)' },
];

export const GLYPH_EXIT_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(0)' },
];
