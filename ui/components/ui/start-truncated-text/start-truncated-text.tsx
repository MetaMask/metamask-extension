import React, { useLayoutEffect, useState } from 'react';
import classnames from 'clsx';

const ELLIPSIS = '\u2026';

/** Characters always kept at the end of a shortened address. */
export const ADDRESS_END_CHARS = 10;

/**
 * Shortens `text` to `visibleChars` characters plus an ellipsis. Up to
 * `endChars` characters come from the end and the rest from the start.
 *
 * @param text - The full text.
 * @param visibleChars - How many characters of `text` to keep.
 * @param endChars - How many of those to take from the end.
 * @returns The shortened text, or `text` when it is short enough.
 */
export function truncateStart(
  text: string,
  visibleChars: number,
  endChars: number,
): string {
  if (visibleChars >= text.length) {
    return text;
  }
  const end = Math.min(visibleChars, endChars);
  return `${text.slice(0, visibleChars - end)}${ELLIPSIS}${text.slice(
    text.length - end,
  )}`;
}

/**
 * Finds the longest `truncateStart` result that fits `maxWidth`.
 *
 * @param text - The full text.
 * @param endChars - Characters to keep from the end.
 * @param maxWidth - The available width in px.
 * @param measure - Returns the rendered width of a string in px.
 * @returns The text that fits.
 */
export function fitTextStart(
  text: string,
  endChars: number,
  maxWidth: number,
  measure: (value: string) => number,
): string {
  if (measure(text) <= maxWidth) {
    return text;
  }
  let low = 0;
  let high = text.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (measure(truncateStart(text, mid, endChars)) <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return truncateStart(text, low, endChars);
}

export type StartTruncatedTextProps = {
  text: string;
  /**
   * Characters always kept at the end. By default only the end is shown, so
   * the start is shortened first.
   */
  endChars?: number;
  className?: string;
};

/**
 * One line of text that fills its container. When the text is too wide, the
 * start is shortened with an ellipsis so the end stays visible. Fits again
 * whenever the container resizes.
 *
 * @param props - The component props.
 * @param props.text - The full text.
 * @param props.endChars - Characters always kept at the end.
 * @param props.className - Extra classes for the wrapper.
 */
export const StartTruncatedText = ({
  text,
  endChars = Infinity,
  className,
}: StartTruncatedTextProps) => {
  // In state so the effect runs once the element mounts.
  const [element, setElement] = useState<HTMLSpanElement | null>(null);
  const [fitted, setFitted] = useState<{ text: string; value: string }>();

  useLayoutEffect(() => {
    if (!element) {
      return undefined;
    }
    const fit = () => {
      const maxWidth = element.getBoundingClientRect().width;
      // Unmeasured or hidden, so show the full text.
      if (!maxWidth) {
        setFitted(undefined);
        return;
      }
      const probe = document.createElement('span');
      probe.style.cssText =
        'position:absolute;visibility:hidden;white-space:nowrap;width:max-content';
      element.appendChild(probe);
      const value = fitTextStart(text, endChars, maxWidth, (candidate) => {
        probe.textContent = candidate;
        return probe.getBoundingClientRect().width;
      });
      probe.remove();
      setFitted((previous) =>
        previous?.text === text && previous.value === value
          ? previous
          : { text, value },
      );
    };
    fit();

    let cancelled = false;
    // Web fonts can load after the first fit and change text width.
    document.fonts?.ready
      .then(() => {
        if (!cancelled) {
          fit();
        }
      })
      .catch(() => undefined);

    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(fit);
    observer?.observe(element);
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [element, text, endChars]);

  return (
    <span
      ref={setElement}
      className={classnames(
        'block min-w-0 overflow-hidden whitespace-nowrap text-start',
        className,
      )}
    >
      {fitted?.text === text ? fitted.value : text}
    </span>
  );
};
