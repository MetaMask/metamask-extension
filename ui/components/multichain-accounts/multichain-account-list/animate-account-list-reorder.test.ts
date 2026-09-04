import { animateAccountListReorder } from './animate-account-list-reorder';

const FLIP_TRANSITION = 'translate 280ms cubic-bezier(0.4, 0, 0.2, 1)';

describe('animateAccountListReorder', () => {
  const originalIsInTest = process.env.IN_TEST;

  // jsdom has no layout engine, so rows report the positions the test assigns.
  const createRow = (flipId: string, initialTop: number) => {
    let top = initialTop;
    const node = document.createElement('div');
    node.dataset.accountListFlipId = flipId;
    node.getBoundingClientRect = jest.fn(() => ({ top }) as DOMRect);
    document.body.appendChild(node);

    return {
      node,
      moveTo: (nextTop: number) => {
        top = nextTop;
      },
    };
  };

  // jsdom does not implement TransitionEvent.
  const endTransition = (node: HTMLElement, propertyName: string) =>
    node.dispatchEvent(
      Object.assign(new Event('transitionend'), { propertyName }),
    );

  beforeEach(() => {
    // Animations are turned off for tests by default.
    delete process.env.IN_TEST;
  });

  afterEach(() => {
    process.env.IN_TEST = originalIsInTest;
    // @ts-expect-error jsdom does not implement matchMedia, so the test that
    // needs it adds it back.
    delete window.matchMedia;
    document.body.innerHTML = '';
  });

  it('inverts a moved row and plays it back to its new position', () => {
    const row = createRow('group-1', 0);

    animateAccountListReorder(() => row.moveTo(64));

    expect(row.node.style.translate).toBe('0 0');
    expect(row.node.style.transition).toBe(FLIP_TRANSITION);
  });

  it('clears the animation once the row lands', () => {
    const row = createRow('group-1', 0);

    animateAccountListReorder(() => row.moveTo(64));
    endTransition(row.node, 'translate');

    expect(row.node.style.translate).toBe('');
    expect(row.node.style.transition).toBe('');
  });

  it('keeps animating while other properties finish transitioning', () => {
    const row = createRow('group-1', 0);

    animateAccountListReorder(() => row.moveTo(64));
    endTransition(row.node, 'opacity');

    expect(row.node.style.transition).toBe(FLIP_TRANSITION);
  });

  it('leaves rows that did not move alone', () => {
    const row = createRow('group-1', 0);

    animateAccountListReorder(() => undefined);

    expect(row.node.getAttribute('style')).toBeNull();
  });

  it('leaves rows that were not on screen before the update alone', () => {
    const existingRow = createRow('group-1', 0);
    let addedRow: HTMLElement | undefined;

    animateAccountListReorder(() => {
      existingRow.moveTo(64);
      addedRow = createRow('group-2', 0).node;
    });

    expect(existingRow.node.style.translate).toBe('0 0');
    expect(addedRow?.getAttribute('style')).toBeNull();
  });

  it('applies the update without animating when reduced motion is preferred', () => {
    window.matchMedia = jest
      .fn()
      .mockReturnValue({ matches: true } as MediaQueryList);
    const row = createRow('group-1', 0);
    const update = jest.fn(() => row.moveTo(64));

    animateAccountListReorder(update);

    expect(update).toHaveBeenCalledTimes(1);
    expect(row.node.getAttribute('style')).toBeNull();
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)',
    );
  });

  it('applies the update without animating in tests', () => {
    process.env.IN_TEST = 'true';
    const row = createRow('group-1', 0);
    const update = jest.fn(() => row.moveTo(64));

    animateAccountListReorder(update);

    expect(update).toHaveBeenCalledTimes(1);
    expect(row.node.getAttribute('style')).toBeNull();
  });
});
