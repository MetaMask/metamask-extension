import React from 'react';
import { render, screen } from '@testing-library/react';

import { AnimatedNumericText } from './animated-numeric-text';
import {
  GLYPH_ENTER_DURATION,
  GLYPH_ENTER_KEYFRAMES,
  GLYPH_EXIT_DURATION,
  GLYPH_EXIT_KEYFRAMES,
  GLYPH_LAYOUT_DURATION,
} from './animated-numeric-text.constants';
import {
  mockElementAnimate,
  mockOffsetLeft,
  mockReducedMotion,
  type ElementAnimateMock,
} from './test-utils';

const TEST_ID = 'animated-numeric-text';
const GLYPH_WIDTH = 50;

const getGlyphs = () =>
  Array.from(
    screen
      .getByTestId(TEST_ID)
      .querySelectorAll<HTMLElement>('[data-flip-key]'),
  );

/** Lays glyphs out left to right in DOM order, `GLYPH_WIDTH` apart. */
const offsetByDomOrder = (element: HTMLElement) => {
  const parent = element.parentElement;
  if (!element.dataset.flipKey || !parent) {
    return undefined;
  }
  const siblings = Array.from(parent.children).filter(
    (child) => child instanceof HTMLElement && child.dataset.flipKey,
  );
  return siblings.indexOf(element) * GLYPH_WIDTH;
};

describe('AnimatedNumericText', () => {
  let animate: ElementAnimateMock;
  let restoreOffsetLeft: () => void;

  beforeEach(() => {
    animate = mockElementAnimate();
    restoreOffsetLeft = mockOffsetLeft(offsetByDomOrder);
  });

  afterEach(() => {
    animate.restore();
    restoreOffsetLeft();
  });

  it('renders the value', () => {
    render(
      <AnimatedNumericText value="$ 250.00 available" data-testid={TEST_ID} />,
    );

    expect(screen.getByTestId(TEST_ID)).toHaveTextContent('$ 250.00 available');
  });

  it('renders a value beyond safe integer precision unchanged', () => {
    render(
      <AnimatedNumericText
        value="9007199254740993.000001"
        data-testid={TEST_ID}
      />,
    );

    expect(screen.getByTestId(TEST_ID)).toHaveTextContent(
      '9007199254740993.000001',
    );
  });

  it('renders one keyed element per numeric glyph and static text around them', () => {
    render(<AnimatedNumericText value="$12.5 ETH" data-testid={TEST_ID} />);

    expect(getGlyphs().map((glyph) => glyph.dataset.flipKey)).toStrictEqual([
      'static-prefix',
      'digit-0-1',
      'digit-1-2',
      'separator-46-0',
      'digit-2-5',
      'static-suffix',
    ]);
  });

  it('does not animate the first render', () => {
    render(<AnimatedNumericText value="123" data-testid={TEST_ID} />);

    expect(animate.calls).toHaveLength(0);
  });

  it('keeps existing glyph elements mounted when a digit is appended', () => {
    const { rerender } = render(
      <AnimatedNumericText value="12" data-testid={TEST_ID} />,
    );
    const [one, two] = getGlyphs();

    rerender(<AnimatedNumericText value="123" data-testid={TEST_ID} />);

    const glyphs = getGlyphs();
    expect(glyphs[0]).toBe(one);
    expect(glyphs[1]).toBe(two);
  });

  it('zooms in only the appended glyph', () => {
    const { rerender } = render(
      <AnimatedNumericText value="12" data-testid={TEST_ID} />,
    );

    rerender(<AnimatedNumericText value="123" data-testid={TEST_ID} />);

    expect(animate.calls).toHaveLength(1);
    const [{ element, keyframes, options }] = animate.calls;
    expect(element).toHaveTextContent('3');
    expect(keyframes).toStrictEqual(GLYPH_ENTER_KEYFRAMES);
    expect(options).toMatchObject({ duration: GLYPH_ENTER_DURATION });
  });

  it('zooms out a deleted glyph from its last position and then removes it', () => {
    const { rerender } = render(
      <AnimatedNumericText value="12" data-testid={TEST_ID} />,
    );

    rerender(<AnimatedNumericText value="1" data-testid={TEST_ID} />);

    expect(animate.calls).toHaveLength(1);
    const [{ element, keyframes, options, animation }] = animate.calls;
    expect(element).toHaveTextContent('2');
    expect(element).not.toHaveAttribute('data-flip-key');
    expect((element as HTMLElement).style.left).toBe(`${GLYPH_WIDTH}px`);
    expect(keyframes).toStrictEqual(GLYPH_EXIT_KEYFRAMES);
    expect(options).toMatchObject({ duration: GLYPH_EXIT_DURATION });
    expect(element.isConnected).toBe(true);

    animation.finish();

    expect(element.isConnected).toBe(false);
  });

  it('zooms out the last glyph when the value is cleared', () => {
    const { rerender } = render(
      <AnimatedNumericText value="7" data-testid={TEST_ID} />,
    );

    rerender(<AnimatedNumericText value="" data-testid={TEST_ID} />);

    expect(animate.calls).toHaveLength(1);
    expect(animate.calls[0].keyframes).toStrictEqual(GLYPH_EXIT_KEYFRAMES);
    expect(animate.calls[0].element.isConnected).toBe(true);
  });

  it('exits and enters a replaced digit', () => {
    const { rerender } = render(
      <AnimatedNumericText value="15" data-testid={TEST_ID} />,
    );

    rerender(<AnimatedNumericText value="16" data-testid={TEST_ID} />);

    expect(
      animate.calls.map(({ element, keyframes }) => [
        element.textContent,
        keyframes,
      ]),
    ).toStrictEqual([
      ['5', GLYPH_EXIT_KEYFRAMES],
      ['6', GLYPH_ENTER_KEYFRAMES],
    ]);
  });

  it('slides a glyph that moved from its previous position', () => {
    const { rerender } = render(
      <AnimatedNumericText value="1.5" data-testid={TEST_ID} />,
    );

    // A digit inserted before the separator pushes it one glyph right.
    rerender(<AnimatedNumericText value="12.5" data-testid={TEST_ID} />);

    const separator = getGlyphs().find(
      (glyph) => glyph.dataset.flipKey === 'separator-46-0',
    );
    const slide = animate.calls.find(({ element }) => element === separator);
    expect(slide?.keyframes).toStrictEqual([
      { transform: `translateX(${-GLYPH_WIDTH}px)` },
      { transform: 'translateX(0)' },
    ]);
    expect(slide?.options).toMatchObject({
      duration: GLYPH_LAYOUT_DURATION,
      composite: 'add',
    });
  });

  it('renders plain text without glyph elements when animated is false', () => {
    const { rerender } = render(
      <AnimatedNumericText value="12" animated={false} data-testid={TEST_ID} />,
    );

    rerender(
      <AnimatedNumericText
        value="123"
        animated={false}
        data-testid={TEST_ID}
      />,
    );

    expect(screen.getByTestId(TEST_ID)).toHaveTextContent('123');
    expect(getGlyphs()).toHaveLength(0);
    expect(animate.calls).toHaveLength(0);
  });

  describe('with reduced motion', () => {
    let restoreReducedMotion: () => void;

    beforeEach(() => {
      restoreReducedMotion = mockReducedMotion();
    });

    afterEach(() => {
      restoreReducedMotion();
    });

    it('renders plain text and never animates', () => {
      const { rerender } = render(
        <AnimatedNumericText value="12" data-testid={TEST_ID} />,
      );

      rerender(<AnimatedNumericText value="1" data-testid={TEST_ID} />);
      rerender(<AnimatedNumericText value="19" data-testid={TEST_ID} />);

      expect(screen.getByTestId(TEST_ID)).toHaveTextContent('19');
      expect(getGlyphs()).toHaveLength(0);
      expect(animate.calls).toHaveLength(0);
    });
  });

  describe('without the Web Animations API', () => {
    beforeEach(() => {
      animate.restore();
    });

    it('updates without animating', () => {
      const { rerender } = render(
        <AnimatedNumericText value="12" data-testid={TEST_ID} />,
      );

      expect(() =>
        rerender(<AnimatedNumericText value="1" data-testid={TEST_ID} />),
      ).not.toThrow();
      expect(screen.getByTestId(TEST_ID)).toHaveTextContent('1');
    });
  });
});
