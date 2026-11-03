import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AMOUNT_INPUT_MAX_FONT_SIZE,
  AMOUNT_INPUT_POPUP_WIDTH,
  type AmountInputFontSize,
  getAmountInputFontSize,
} from '../helpers/utils/amount-input-font-size';

export type UseAmountInputFontSizeOptions = {
  /** Width in px used until the container has been laid out. */
  fallbackWidth?: number;
  /** Largest step of the shared scale to start from. */
  maxFontSize?: AmountInputFontSize;
};

export type UseAmountInputFontSize = {
  /**
   * Attach to the element whose width is the budget for the symbol and amount.
   * Its width must not depend on the amount, and it must carry no horizontal
   * padding, because its content width is read as the budget.
   */
  containerRef: React.RefCallback<HTMLElement>;
  fontSize: AmountInputFontSize;
};

/**
 * Picks the shared amount scale step from the container's rendered width, so
 * wide layouts such as the expanded view keep larger sizes while the popup
 * and side panel still step down.
 *
 * The width is read once when the container mounts and then only when a
 * ResizeObserver reports a change, so typing never triggers a layout read.
 *
 * @param text - The amount as rendered, including any currency symbol.
 * @param options - Layout constraints of the input.
 * @param options.fallbackWidth - Width in px used before the first layout.
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

  // Ref callbacks run in the commit phase, so this one read lands before paint
  // and the first frame already uses the real width.
  const containerRef = useCallback((element: HTMLElement | null) => {
    setContainer(element);
    setMeasuredWidth(element?.clientWidth ?? 0);
  }, []);

  useEffect(() => {
    if (!container || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setMeasuredWidth(Math.floor(entry.contentRect.width));
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  // A zero width means the container is detached or hidden.
  const availableWidth = measuredWidth > 0 ? measuredWidth : fallbackWidth;

  const fontSize = useMemo(
    () => getAmountInputFontSize(text, { availableWidth, maxFontSize }),
    [text, availableWidth, maxFontSize],
  );

  return { containerRef, fontSize };
}
