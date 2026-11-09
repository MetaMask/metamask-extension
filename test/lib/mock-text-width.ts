export type TextWidthMock = {
  /** Sets the width every element reports, in px. */
  setRowWidth: (width: number) => void;
  restore: () => void;
};

/**
 * Fakes layout for `StartTruncatedText`. jsdom has no layout, so every element
 * reports the row width and the hidden measuring element reports 10px per
 * character. Call `restore` after each test.
 *
 * @returns Helpers to set the row width and restore layout.
 */
export function mockTextWidth(): TextWidthMock {
  const original = HTMLElement.prototype.getBoundingClientRect;
  let rowWidth = 0;

  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const isProbe = this.style.position === 'absolute';
    const width = isProbe ? (this.textContent ?? '').length * 10 : rowWidth;
    return { ...original.call(this), width };
  };

  return {
    setRowWidth: (width: number) => {
      rowWidth = width;
    },
    restore: () => {
      HTMLElement.prototype.getBoundingClientRect = original;
    },
  };
}
