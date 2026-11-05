export type AnimateCall = {
  element: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  animation: FakeAnimation;
};

export type FakeAnimation = {
  cancel: jest.Mock;
  onfinish: (() => void) | null;
  oncancel: (() => void) | null;
  effect: { getComputedTiming: () => { progress: number | null } };
  progress: number | null;
  finish: () => void;
};

export type ElementAnimateMock = {
  calls: AnimateCall[];
  restore: () => void;
};

/**
 * Installs a recording `Element.prototype.animate`, which jsdom lacks.
 * Animations never advance; call `finish` on one to fire `onfinish`.
 *
 * @returns The recorded calls and a restore function.
 */
export function mockElementAnimate(): ElementAnimateMock {
  const original = Element.prototype.animate;
  const calls: AnimateCall[] = [];

  Element.prototype.animate = function (
    this: Element,
    keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ) {
    const animation: FakeAnimation = {
      cancel: jest.fn(() => animation.oncancel?.()),
      onfinish: null,
      oncancel: null,
      progress: 0,
      effect: { getComputedTiming: () => ({ progress: animation.progress }) },
      finish: () => animation.onfinish?.(),
    };
    calls.push({
      element: this,
      keyframes: keyframes as Keyframe[],
      options: options as KeyframeAnimationOptions,
      animation,
    });
    return animation as unknown as Animation;
  };

  return {
    calls,
    restore: () => {
      if (original) {
        Element.prototype.animate = original;
      } else {
        delete (Element.prototype as Partial<Element>).animate;
      }
    },
  };
}

/**
 * Makes `offsetLeft` return a per-element value, which jsdom reports as 0.
 *
 * @param getOffset - Offset for an element, or undefined for 0.
 * @returns A restore function.
 */
export function mockOffsetLeft(
  getOffset: (element: HTMLElement) => number | undefined,
): () => void {
  const spy = jest
    .spyOn(HTMLElement.prototype, 'offsetLeft', 'get')
    .mockImplementation(function (this: HTMLElement) {
      return getOffset(this) ?? 0;
    });
  return () => spy.mockRestore();
}

/**
 * Makes `prefers-reduced-motion: reduce` match.
 *
 * @returns A restore function.
 */
export function mockReducedMotion(): () => void {
  const original = window.matchMedia;
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
  return () => {
    window.matchMedia = original;
  };
}
