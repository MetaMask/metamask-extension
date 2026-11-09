import { useLayoutEffect, useState } from 'react';

const ELLIPSIS = '\u2026';

/**
 * Fits text on one line in an element by shortening its start. Keeps the last
 * `endChars` characters, then as many leading characters as fit.
 *
 * The element must not wrap. It is measured at the width it can grow to, so it
 * may size to its text inside a flex row that takes its width from its
 * container.
 *
 * @param text - The full text.
 * @param endChars - Characters always kept at the end. Defaults to all.
 * @returns A ref for the element and the text to render in it.
 */
export function useStartTruncatedText(text: string, endChars = Infinity) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [fitted, setFitted] = useState({ text, value: text });

  useLayoutEffect(() => {
    if (!element) {
      return undefined;
    }

    const fit = () => {
      element.style.setProperty('flex-grow', '1');
      const maxWidth = element.getBoundingClientRect().width;
      element.style.removeProperty('flex-grow');
      // Check the attribute, not style.length, or Chrome re-adds it.
      if (!element.getAttribute('style')) {
        element.removeAttribute('style');
      }
      const probe = element.appendChild(document.createElement('span'));
      probe.style.cssText =
        'position:absolute;visibility:hidden;white-space:nowrap';

      const shorten = (visibleChars: number) => {
        const end = Math.min(visibleChars, endChars);
        return `${text.slice(0, visibleChars - end)}${ELLIPSIS}${text.slice(text.length - end).trimStart()}`;
      };
      const fits = (value: string) => {
        probe.textContent = value;
        return !maxWidth || probe.getBoundingClientRect().width <= maxWidth;
      };

      let value = text;
      if (!fits(text)) {
        let low = 0;
        let high = text.length - 1;
        while (low < high) {
          const mid = Math.ceil((low + high) / 2);
          if (fits(shorten(mid))) {
            low = mid;
          } else {
            high = mid - 1;
          }
        }
        value = shorten(low);
      }
      probe.remove();

      setFitted((previous) =>
        previous.text === text && previous.value === value
          ? previous
          : { text, value },
      );
    };

    fit();
    let active = true;
    document.fonts?.ready.then(() => active && fit());
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    observer.observe(element.parentElement ?? element);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [element, text, endChars]);

  return [setElement, fitted.text === text ? fitted.value : text] as const;
}
