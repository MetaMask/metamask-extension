import { useLayoutEffect, useState } from 'react';

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
 * @returns A ref callback for the row, its width, and the row element.
 */
export function useHeroAmountRowWidth(): [
  (element: HTMLElement | null) => void,
  number,
  HTMLElement | null,
] {
  // Held in state so the effect re-runs when the row mounts or is replaced.
  // A ref callback cannot return a cleanup on React 18.
  const [row, setRow] = useState<HTMLElement | null>(null);
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

  return [setRow, width > 0 ? width : HERO_AMOUNT_FALLBACK_WIDTH, row];
}

/**
 * Width of the prefix in em, measured from a fixed-size probe so the result
 * does not depend on the font size being chosen. Remeasured when the probe
 * mounts, when web fonts finish loading, and when the probe resizes, such as
 * when its weight changes at the md breakpoint.
 *
 * The probe is absent while the loading skeleton is showing. Holding the
 * element in state retriggers this effect when the skeleton gives way to the
 * field. A ref would not, and the width would stay at the empty reading.
 *
 * @param prefix - The currency symbol or code.
 * @returns A ref callback for the probe and the prefix width in em.
 */
export function useHeroAmountPrefixWidthEm(
  prefix: string,
): [(element: HTMLSpanElement | null) => void, number] {
  // Same reason as the row: a ref callback cannot return a cleanup on React 18,
  // and the effect must run again when the probe mounts after the skeleton.
  const [probe, setProbe] = useState<HTMLSpanElement | null>(null);
  const [measured, setMeasured] = useState<{
    prefix: string;
    em: number;
  } | null>(null);
  const estimate = prefix.length * HERO_AMOUNT_DIGIT_WIDTH_EM;
  const prefixEm = measured?.prefix === prefix ? measured.em : estimate;

  useLayoutEffect(() => {
    if (!prefix || !probe) {
      return undefined;
    }

    const measure = () => {
      const { width } = probe.getBoundingClientRect();
      const em =
        width > 0 ? width / HERO_AMOUNT_PREFIX_PROBE_FONT_SIZE : estimate;
      setMeasured((previous) =>
        previous?.prefix === prefix && previous.em === em
          ? previous
          : { prefix, em },
      );
    };

    measure();
    let cancelled = false;
    // A rejected font load leaves the first reading in place.
    document.fonts?.ready
      .then(() => {
        if (!cancelled) {
          measure();
        }
      })
      .catch(() => undefined);
    // The probe's width changes when its weight switches at the md breakpoint,
    // so observing it remeasures without a media query.
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => measure());
    observer?.observe(probe);
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [estimate, prefix, probe]);

  return [setProbe, prefixEm];
}
