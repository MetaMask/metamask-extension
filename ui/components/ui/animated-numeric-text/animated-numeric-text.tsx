import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { twMerge } from '@metamask/design-system-react';

import {
  GLYPH_EASING,
  GLYPH_ENTER_DURATION,
  GLYPH_ENTER_KEYFRAMES,
  GLYPH_EXIT_DURATION,
  GLYPH_EXIT_KEYFRAMES,
} from './animated-numeric-text.constants';
import {
  createFlipTracker,
  FLIP_KEY_ATTRIBUTE,
  getElementFontSize,
  type FlipFrame,
} from './flip-tracker';
import { getNumericGlyphs, type NumericGlyph } from './get-numeric-glyphs';
import { splitNumericString } from './split-numeric-string';
import {
  canAnimateElements,
  usePrefersReducedMotion,
} from './use-prefers-reduced-motion';

// Inherits the family explicitly because the global stylesheet sets one on
// every element.
const INHERIT_FONT = '[font-family:inherit]';
const GLYPH_CLASS_NAME = `inline-block origin-center whitespace-pre ${INHERIT_FONT}`;
const EXIT_LAYER_CLASS_NAME = `pointer-events-none absolute inset-0 ${INHERIT_FONT}`;
const STATIC_PREFIX_KEY = 'static-prefix';
const STATIC_SUFFIX_KEY = 'static-suffix';

export type AnimatedNumericTextProps = {
  /**
   * The display string. Only the first numeric run animates; text around it,
   * such as a symbol or ticker, is static.
   */
  value: string;
  /**
   * Set to false to render plain text. Motion is also off when the user
   * prefers reduced motion.
   */
  animated?: boolean;
  /**
   * Additional CSS classes for the root.
   */
  className?: string;
  /**
   * Test id of the root.
   */
  'data-testid'?: string;
};

function playExit(layer: HTMLElement, glyph: NumericGlyph, left: number): void {
  const ghost = document.createElement('span');
  ghost.className = `${GLYPH_CLASS_NAME} absolute top-0`;
  ghost.style.left = `${left}px`;
  ghost.textContent = glyph.character;
  layer.appendChild(ghost);
  const animation = ghost.animate(GLYPH_EXIT_KEYFRAMES, {
    duration: GLYPH_EXIT_DURATION,
    easing: GLYPH_EASING,
    fill: 'forwards',
  });
  const remove = () => ghost.remove();
  animation.onfinish = remove;
  animation.oncancel = remove;
}

/**
 * Web port of Mobile `AnimatedNumericText`. Each glyph of the numeric run is
 * its own element with a stable key: new glyphs zoom in (120ms), removed
 * glyphs zoom out (90ms), and glyphs that move slide (160ms), all easing out
 * cubically. Runs on the Web Animations API, with no animation library.
 *
 * The first render, reduced motion, and environments without
 * `Element.animate` are static. This component is presentational; give the
 * value an accessible name where it is used.
 *
 * @param props - See {@link AnimatedNumericTextProps}.
 * @param props.value - The display string.
 * @param props.animated - Whether glyph motion may run.
 * @param props.className - Additional CSS classes for the root.
 * @param props.'data-testid' - Test id of the root.
 */
export const AnimatedNumericText = ({
  value,
  animated = true,
  className,
  'data-testid': dataTestId,
}: AnimatedNumericTextProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const motionEnabled = animated && !prefersReducedMotion;
  const { prefix, numeric, suffix } = useMemo(
    () => splitNumericString(value),
    [value],
  );
  const glyphs = useMemo(() => getNumericGlyphs(numeric), [numeric]);
  const rootRef = useRef<HTMLSpanElement>(null);
  const exitLayerRef = useRef<HTMLSpanElement>(null);
  const previousGlyphsRef = useRef<NumericGlyph[] | null>(null);
  const [tracker] = useState(createFlipTracker);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const frame: FlipFrame = { origin: 0, scale: getElementFontSize(root) };
    const previousGlyphs = previousGlyphsRef.current;
    const animate =
      motionEnabled && previousGlyphs !== null && canAnimateElements();

    if (animate) {
      const previousKeys = new Set(previousGlyphs.map(({ key }) => key));
      const nextKeys = new Set(glyphs.map(({ key }) => key));
      const exitLayer = exitLayerRef.current;

      for (const glyph of previousGlyphs) {
        const left = tracker.getPosition(glyph.key, frame);
        if (exitLayer && left !== undefined && !nextKeys.has(glyph.key)) {
          playExit(exitLayer, glyph, left);
        }
      }
      for (const element of Array.from(root.children)) {
        const key = element.getAttribute(FLIP_KEY_ATTRIBUTE);
        if (key && nextKeys.has(key) && !previousKeys.has(key)) {
          element.animate(GLYPH_ENTER_KEYFRAMES, {
            duration: GLYPH_ENTER_DURATION,
            easing: GLYPH_EASING,
          });
        }
      }
    }

    tracker.play(root, frame, animate);
    previousGlyphsRef.current = motionEnabled ? glyphs : null;
  }, [glyphs, motionEnabled, prefix, suffix, tracker]);

  const rootClassName = twMerge(
    `relative inline-block whitespace-pre ${INHERIT_FONT}`,
    className,
  );

  if (!motionEnabled || !numeric) {
    return (
      <span ref={rootRef} data-testid={dataTestId} className={rootClassName}>
        {value}
        <span ref={exitLayerRef} className={EXIT_LAYER_CLASS_NAME} />
      </span>
    );
  }

  return (
    <span ref={rootRef} data-testid={dataTestId} className={rootClassName}>
      {prefix ? (
        <span data-flip-key={STATIC_PREFIX_KEY} className={GLYPH_CLASS_NAME}>
          {prefix}
        </span>
      ) : null}
      {glyphs.map(({ character, key }) => (
        <span key={key} data-flip-key={key} className={GLYPH_CLASS_NAME}>
          {character}
        </span>
      ))}
      {suffix ? (
        <span data-flip-key={STATIC_SUFFIX_KEY} className={GLYPH_CLASS_NAME}>
          {suffix}
        </span>
      ) : null}
      <span ref={exitLayerRef} className={EXIT_LAYER_CLASS_NAME} />
    </span>
  );
};
