import React from 'react';
import { render } from '@testing-library/react';
import { OrderBookLayoutIcon } from './order-book-layout-icons';

const FORM_BAR_FILL = 'var(--color-icon-alternative)';

const renderIcon = (position: 'left' | 'right') => {
  const { container } = render(<OrderBookLayoutIcon position={position} />);
  const rects = Array.from(container.querySelectorAll('rect'));
  const isFormBar = (rect: SVGRectElement) =>
    rect.getAttribute('fill') === FORM_BAR_FILL;

  return {
    container,
    formBars: rects.filter(isFormBar),
    orderBookBars: rects.filter((rect) => !isFormBar(rect)),
  };
};

const rightEdgeOf = (rect: SVGRectElement) =>
  Number(rect.getAttribute('x')) + Number(rect.getAttribute('width'));

describe('OrderBookLayoutIcon', () => {
  it('renders an SVG with the correct dimensions', () => {
    const { container } = renderIcon('left');
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '71');
    expect(svg).toHaveAttribute('height', '32');
    expect(svg).toHaveAttribute('viewBox', '0 0 71 32');
  });

  it('renders 6 order-book bars and 3 form bars for both positions', () => {
    const left = renderIcon('left');
    expect(left.orderBookBars).toHaveLength(6);
    expect(left.formBars).toHaveLength(3);

    const right = renderIcon('right');
    expect(right.orderBookBars).toHaveLength(6);
    expect(right.formBars).toHaveLength(3);
  });

  describe('left position', () => {
    it('sits the order-book bars flat against the left outer edge', () => {
      const { orderBookBars } = renderIcon('left');
      orderBookBars.forEach((rect) => expect(rect).toHaveAttribute('x', '2'));
    });

    it('puts the form bars in the right half', () => {
      const { formBars } = renderIcon('left');
      formBars.forEach((rect) => expect(rect).toHaveAttribute('x', '38'));
    });
  });

  describe('right position', () => {
    it('sits the order-book bars flat against the right outer edge', () => {
      const { orderBookBars } = renderIcon('right');
      orderBookBars.forEach((rect) => expect(rightEdgeOf(rect)).toBe(69));
    });

    it('puts the form bars in the left half', () => {
      const { formBars } = renderIcon('right');
      formBars.forEach((rect) => expect(rect).toHaveAttribute('x', '5'));
    });
  });
});
