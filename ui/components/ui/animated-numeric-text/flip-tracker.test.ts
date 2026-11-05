import { createFlipTracker } from './flip-tracker';
import {
  mockElementAnimate,
  mockOffsetLeft,
  type ElementAnimateMock,
} from './test-utils';

describe('createFlipTracker', () => {
  let animate: ElementAnimateMock;
  let restoreOffsetLeft: () => void;
  let offsets: Map<HTMLElement, number>;
  let container: HTMLElement;
  let child: HTMLElement;

  beforeEach(() => {
    animate = mockElementAnimate();
    offsets = new Map();
    restoreOffsetLeft = mockOffsetLeft((element) => offsets.get(element));
    container = document.createElement('div');
    child = document.createElement('span');
    child.setAttribute('data-flip-key', 'a');
    container.appendChild(child);
  });

  afterEach(() => {
    animate.restore();
    restoreOffsetLeft();
  });

  const translateFrom = (index: number) => animate.calls[index].keyframes[0];

  it('does not animate the first measurement', () => {
    const tracker = createFlipTracker();
    offsets.set(child, 10);

    tracker.play(container, { origin: 0, scale: 10 }, true);

    expect(animate.calls).toHaveLength(0);
  });

  it('slides a child from its previous position', () => {
    const tracker = createFlipTracker();
    offsets.set(child, 100);
    tracker.play(container, { origin: 0, scale: 10 }, true);

    offsets.set(child, 80);
    tracker.play(container, { origin: 0, scale: 10 }, true);

    expect(translateFrom(0)).toStrictEqual({ transform: 'translateX(20px)' });
  });

  it('does not slide when animate is false', () => {
    const tracker = createFlipTracker();
    offsets.set(child, 100);
    tracker.play(container, { origin: 0, scale: 10 }, false);

    offsets.set(child, 80);
    tracker.play(container, { origin: 0, scale: 10 }, false);

    expect(animate.calls).toHaveLength(0);
  });

  it('ignores children without a flip key', () => {
    const tracker = createFlipTracker();
    const untracked = document.createElement('span');
    container.appendChild(untracked);
    offsets.set(untracked, 0);
    tracker.play(container, { origin: 0, scale: 10 }, true);

    offsets.set(untracked, 50);
    tracker.play(container, { origin: 0, scale: 10 }, true);

    expect(animate.calls).toHaveLength(0);
  });

  it('treats a font-size step around the origin as no movement', () => {
    const tracker = createFlipTracker();
    // 2em left of a 160px anchor at 88px, then at 72px.
    offsets.set(child, 160 - 2 * 88);
    tracker.play(container, { origin: 160, scale: 88 }, true);

    offsets.set(child, 160 - 2 * 72);
    tracker.play(container, { origin: 160, scale: 72 }, true);

    expect(animate.calls).toHaveLength(0);
  });

  it('carries the remaining offset of an interrupted slide', () => {
    const tracker = createFlipTracker();
    offsets.set(child, 100);
    tracker.play(container, { origin: 0, scale: 10 }, true);
    offsets.set(child, 80);
    tracker.play(container, { origin: 0, scale: 10 }, true);
    const first = animate.calls[0].animation;
    first.progress = 0.5;

    offsets.set(child, 60);
    tracker.play(container, { origin: 0, scale: 10 }, true);

    expect(first.cancel).toHaveBeenCalled();
    // 20px from the new move plus 10px left of the first slide.
    expect(translateFrom(1)).toStrictEqual({ transform: 'translateX(30px)' });
  });

  it('reports the last position in px for a frame', () => {
    const tracker = createFlipTracker();
    offsets.set(child, 40);
    tracker.play(container, { origin: 0, scale: 20 }, true);

    expect(tracker.getPosition('a', { origin: 0, scale: 10 })).toBe(20);
    expect(tracker.getPosition('missing', { origin: 0, scale: 10 })).toBe(
      undefined,
    );
  });
});
