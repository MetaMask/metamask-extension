import { useLayoutEffect, useState, type RefObject } from 'react';

import {
  HERO_AMOUNT_DIGIT_WIDTH_EM,
  HERO_AMOUNT_FALLBACK_WIDTH,
  HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE,
} from './hero-amount-input.constants';

/**
 * Content-box width, matching `ResizeObserver` `contentRect`. `clientWidth`
 * includes padding, so a raw read would disagree with later observations.
 *
 * @param element - The measured row.
 * @returns The width in px.
 */
function getContentWidth(element: HTMLElement): number {
  const style = getComputedStyle(element);
  const padding =
    Number.parseFloat(style.paddingLeft) +
    Number.parseFloat(style.paddingRight);
  return element.clientWidth - (Number.isNaN(padding) ? 0 : padding);
}

/**
 * Width of the row in whole px. Read once before paint when the row mounts,
 * then only when a ResizeObserver reports a change, so typing never reads
 * layout. A zero width (unmeasured or hidden) uses the popup fallback.
 *
 * @returns A ref callback for the row and its width.
 */
export function useHeroAmountRowWidth(): [
  (element: HTMLDivElement | null) => void,
  number,
] {
  // Held in state so the effect re-runs when the row mounts or is replaced.
  // A ref callback cannot return a cleanup on React 18.
  const [row, rowRef] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!row) {
      return undefined;
    }
    let lastWidth: number | undefined;
    const report = (next: number) => {
      const rounded = Math.round(next);
      if (rounded === lastWidth) {
        return;
      }
      lastWidth = rounded;
      setWidth((previous) => (previous === rounded ? previous : rounded));
    };
    // useEffect would run after paint and flash the fallback size first.
    report(getContentWidth(row));

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        report(entry.contentRect.width);
      }
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, [row]);

  return [rowRef, width > 0 ? width : HERO_AMOUNT_FALLBACK_WIDTH];
}

/**
 * Width of the prefix in em, measured from a fixed-size probe so the result
 * does not depend on the font size being chosen. Remeasured when web fonts
 * finish loading.
 *
 * @param prefix - The currency symbol or code.
 * @param probeRef - The offscreen element rendering the prefix.
 * @returns The prefix width in em.
 */
export function useHeroAmountPrefixWidthEm(
  prefix: string,
  probeRef: RefObject<HTMLSpanElement | null>,
): number {
  const [prefixEm, setPrefixEm] = useState(
    () => prefix.length * HERO_AMOUNT_DIGIT_WIDTH_EM,
  );

  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!prefix || !probe) {
      setPrefixEm(0);
      return undefined;
    }

    const measure = () => {
      const { width } = probe.getBoundingClientRect();
      const next =
        width > 0
          ? width / HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE
          : prefix.length * HERO_AMOUNT_DIGIT_WIDTH_EM;
      setPrefixEm((previous) => (previous === next ? previous : next));
    };

    measure();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) {
        measure();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [prefix, probeRef]);

  return prefixEm;
}
