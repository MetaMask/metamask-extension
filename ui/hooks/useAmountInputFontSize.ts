import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AMOUNT_INPUT_MAX_FONT_SIZE,
  AMOUNT_INPUT_POPUP_WIDTH,
  type AmountInputFontSize,
  getAmountInputFontSize,
} from '../helpers/utils/amount-input-font-size';

export type UseAmountInputFontSizeOptions = {
  /** Width in px used until the container has been measured. */
  fallbackWidth?: number;
  /** Largest step of the shared scale to start from. */
  maxFontSize?: AmountInputFontSize;
};

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
 * One ResizeObserver per container supplies the width; nothing reads layout
 * while typing. The width is stored rounded to a whole px and only when it
 * changes, so resize notifications that do not move it cause no re-render.
 * The font size itself is derived during render.
 *
 * @param text - The amount as rendered, including any currency symbol.
 * @param options - Layout constraints of the input.
 * @param options.fallbackWidth - Width in px used until the first measurement.
 * @param options.maxFontSize - Largest step to start from.
 * @returns A ref for the container and the font size in px.
 */
export function useAmountInputFontSize(
  text: string,
  {
    fallbackWidth = AMOUNT_INPUT_POPUP_WIDTH,
    maxFontSize = AMOUNT_INPUT_MAX_FONT_SIZE,
  }: UseAmountInputFontSizeOptions = {},
): UseAmountInputFontSize {
  // Held in state so the effect below re-runs when the container mounts or is
  // replaced. A ref callback cannot return a cleanup on React 18.
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const containerRef = useCallback((element: HTMLElement | null) => {
    setContainer(element);
  }, []);

  useEffect(() => {
    if (!container || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    // React 18 can still run the component once for an update that bails
    // out, so repeats of the last reported width skip setState entirely.
    let lastReportedWidth: number | undefined;
    // The first notification arrives after layout and before paint.
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }
      const width = Math.round(entry.contentRect.width);
      if (width === lastReportedWidth) {
        return;
      }
      lastReportedWidth = width;
      setMeasuredWidth((previous) => (previous === width ? previous : width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  // A zero width means the container is unmeasured, detached or hidden.
  const availableWidth = measuredWidth > 0 ? measuredWidth : fallbackWidth;

  const fontSize = useMemo(
    () => getAmountInputFontSize(text, { availableWidth, maxFontSize }),
    [text, availableWidth, maxFontSize],
  );

  return { containerRef, fontSize };
}
