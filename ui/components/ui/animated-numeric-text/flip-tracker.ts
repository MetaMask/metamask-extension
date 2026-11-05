import {
  GLYPH_EASING,
  GLYPH_LAYOUT_DURATION,
} from './animated-numeric-text.constants';

export const FLIP_KEY_ATTRIBUTE = 'data-flip-key';

/**
 * Where positions are measured from, and the font size they scale with.
 * Positions are stored in em relative to the origin, so a font-size step
 * between two updates does not read as movement.
 */
export type FlipFrame = {
  origin: number;
  scale: number;
};

type RunningFlip = {
  animation: Animation;
  from: number;
};

export type FlipTracker = {
  /**
   * Records the layout position of each direct child carrying
   * `data-flip-key`. When `animate` is set, children that moved since the
   * last call slide from their previous position (FLIP) instead of jumping.
   *
   * @param container - Parent of the tracked children, and their offsetParent.
   * @param frame - Origin and scale of this measurement.
   * @param animate - Whether to slide children that moved.
   */
  play: (container: HTMLElement, frame: FlipFrame, animate: boolean) => void;
  /**
   * Position of a child at the last `play`, converted to px for `frame`.
   *
   * @param key - The child's `data-flip-key`.
   * @param frame - Origin and scale to convert with.
   */
  getPosition: (key: string, frame: FlipFrame) => number | undefined;
};

/**
 * Computed font size of an element in px, used as a {@link FlipFrame} scale.
 * Mid-transition, this is the size currently laid out, not the target.
 *
 * @param element - The element to read.
 * @returns The font size, or 1 when it cannot be read.
 */
export function getElementFontSize(element: Element): number {
  const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
  return Number.isNaN(fontSize) || fontSize <= 0 ? 1 : fontSize;
}

function getFlipChildren(container: HTMLElement): [string, HTMLElement][] {
  const children: [string, HTMLElement][] = [];
  for (const child of Array.from(container.children)) {
    const key = child.getAttribute(FLIP_KEY_ATTRIBUTE);
    if (key !== null && child instanceof HTMLElement) {
      children.push([key, child]);
    }
  }
  return children;
}

/**
 * Tracks horizontal layout positions between renders and slides elements
 * that moved, like Reanimated `LinearTransition`. `offsetLeft` ignores
 * transforms, so an element that is still sliding is measured at its layout
 * position, and its remaining offset is carried into the next slide.
 *
 * @returns A tracker to call from a layout effect after each update.
 */
export function createFlipTracker(): FlipTracker {
  let positions = new Map<string, number>();
  const running = new WeakMap<HTMLElement, RunningFlip>();

  const getRemainingOffset = (element: HTMLElement): number => {
    const flip = running.get(element);
    const progress = flip?.animation.effect?.getComputedTiming().progress;
    if (!flip || progress === null || progress === undefined) {
      return 0;
    }
    return flip.from * (1 - progress);
  };

  return {
    play(container, { origin, scale }, animate) {
      const next = new Map<string, number>();
      const safeScale = scale > 0 ? scale : 1;

      for (const [key, element] of getFlipChildren(container)) {
        const position = element.offsetLeft;
        next.set(key, (position - origin) / safeScale);

        const previous = positions.get(key);
        if (!animate || previous === undefined) {
          continue;
        }
        const from =
          origin +
          previous * safeScale -
          position +
          getRemainingOffset(element);
        running.get(element)?.animation.cancel();
        running.delete(element);
        if (Math.abs(from) < 0.5) {
          continue;
        }

        const animation = element.animate(
          [
            { transform: `translateX(${from}px)` },
            { transform: 'translateX(0)' },
          ],
          {
            duration: GLYPH_LAYOUT_DURATION,
            easing: GLYPH_EASING,
            // Added on top of a glyph's zoom so both can run at once.
            composite: 'add',
          },
        );
        running.set(element, { animation, from });
        animation.onfinish = () => {
          if (running.get(element)?.animation === animation) {
            running.delete(element);
          }
        };
      }

      positions = next;
    },

    getPosition(key, { origin, scale }) {
      const position = positions.get(key);
      return position === undefined ? undefined : origin + position * scale;
    },
  };
}
