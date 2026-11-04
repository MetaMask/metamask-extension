import { useLayoutEffect, useState } from 'react';
import {
  AMOUNT_INPUT_MAX_FONT_SIZE,
  AMOUNT_INPUT_POPUP_WIDTH,
  type AmountInputFontSize,
  estimateAmountTextWidthEm,
  getAmountInputFontSizeForEm,
} from '../helpers/utils/amount-input-font-size';

export type UseAmountInputFontSizeOptions = {
  /** Width in px used until the container has been measured. */
  fallbackWidth?: number;
  /** Largest step of the shared scale to start from. */
  maxFontSize?: AmountInputFontSize;
  /**
   * Measured width of the prefix and amount, in em. When set, this replaces
   * the estimate derived from `text`.
   */
  widthEm?: number;
};

/**
 * Content-box width, matching `ResizeObserver` `contentRect`. `clientWidth`
 * includes padding, so a raw read would disagree with later observations.
 *
 * @param element - The measured container.
 * @returns The width in px.
 */
function getContentWidth(element: HTMLElement): number {
  const style = getComputedStyle(element);
  const padding =
    Number.parseFloat(style.paddingLeft) +
    Number.parseFloat(style.paddingRight);
  return element.clientWidth - (Number.isNaN(padding) ? 0 : padding);
}

export type UseAmountInputFontSize = {
  /**
   * Attach to the element whose content width is the budget for the symbol
   * and amount. Its width must not depend on the amount.
   */
  containerRef: React.RefCallback<HTMLElement>;
  fontSize: AmountInputFontSize;
};

/**
 * Picks the shared amount scale step from the container's rendered width, so
 * wide layouts such as the expanded view keep larger sizes while the popup
 * and side panel still step down.
 *
 * The content width is read once before paint when the container mounts, then
 * only when a ResizeObserver reports a change, so typing never triggers a
 * layout read. The width is stored rounded to a whole px and only when it
 * changes, so resize notifications that do not move it cause no re-render.
 * The font size itself is derived during render.
 *
 * @param text - The amount as rendered, including any currency symbol.
 * @param options - Layout constraints of the input.
 * @param options.fallbackWidth - Width in px used until the first measurement.
 * @param options.maxFontSize - Largest step to start from.
 * @param options.widthEm - Measured width in em, used instead of `text`.
 * @returns A ref for the container and the font size in px.
 */
export function useAmountInputFontSize(
  text: string,
  {
    fallbackWidth = AMOUNT_INPUT_POPUP_WIDTH,
    maxFontSize = AMOUNT_INPUT_MAX_FONT_SIZE,
    widthEm,
  }: UseAmountInputFontSizeOptions = {},
): UseAmountInputFontSize {
  // Held in state so the effect below re-runs when the container mounts or is
  // replaced. A ref callback cannot return a cleanup on React 18. The setter
  // is stable, so it doubles as the ref callback.
  const [container, containerRef] = useState<HTMLElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useLayoutEffect(() => {
    if (!container) {
      return undefined;
    }
    // React 18 can still run the component once for an update that bails
    // out, so repeats of the last reported width skip setState entirely.
    let lastReportedWidth: number | undefined;
    const reportWidth = (width: number) => {
      const rounded = Math.round(width);
      if (rounded === lastReportedWidth) {
        return;
      }
      lastReportedWidth = rounded;
      setMeasuredWidth((previous) =>
        previous === rounded ? previous : rounded,
      );
    };
    // useEffect runs after paint, so the first frame would use the fallback
    // width and then animate to the measured size. Reading here re-renders
    // before paint. The content box matches ResizeObserver's contentRect.
    reportWidth(getContentWidth(container));

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }
      reportWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  // A zero width means the container is unmeasured, detached or hidden.
  const availableWidth = measuredWidth > 0 ? measuredWidth : fallbackWidth;

  const fontSize = getAmountInputFontSizeForEm(
    widthEm ?? estimateAmountTextWidthEm(text),
    { availableWidth, maxFontSize },
  );

  return { containerRef, fontSize };
}
