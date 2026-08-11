import React from 'react';
import { render } from '@testing-library/react';
import { OrderBookLayoutIcon } from './order-book-layout-icons';

describe('OrderBookLayoutIcon', () => {
  it('renders an SVG with the correct dimensions', () => {
    const { container } = render(<OrderBookLayoutIcon position="left" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '71');
    expect(svg).toHaveAttribute('height', '32');
    expect(svg).toHaveAttribute('viewBox', '0 0 71 32');
  });

  it('renders 9 rects for both positions (6 order-book + 3 form)', () => {
    const { container: left } = render(<OrderBookLayoutIcon position="left" />);
    expect(left.querySelectorAll('rect')).toHaveLength(9);

    const { container: right } = render(
      <OrderBookLayoutIcon position="right" />,
    );
    expect(right.querySelectorAll('rect')).toHaveLength(9);
  });

  describe('left position', () => {
    it('order-book bars are left-aligned (flat against the left outer edge)', () => {
      const { container } = render(<OrderBookLayoutIcon position="left" />);
      const rects = Array.from(container.querySelectorAll('rect'));
      // First 6 rects are the order-book bars rendered by OrderBookBars
      const obRects = rects.slice(0, 6);
      obRects.forEach((rect) => expect(rect).toHaveAttribute('x', '2'));
    });

    it('form bars are in the right half', () => {
      const { container } = render(<OrderBookLayoutIcon position="left" />);
      const rects = Array.from(container.querySelectorAll('rect'));
      // Last 3 rects are the form bars
      const formRects = rects.slice(6);
      formRects.forEach((rect) => expect(rect).toHaveAttribute('x', '38'));
    });
  });

  describe('right position', () => {
    it('order-book bars are right-aligned (flat against the right outer edge)', () => {
      const { container } = render(<OrderBookLayoutIcon position="right" />);
      const rects = Array.from(container.querySelectorAll('rect'));
      // First 6 rects are the order-book bars (OrderBookBars renders before form bars)
      const obRects = rects.slice(0, 6);
      obRects.forEach((rect) => {
        const x = parseFloat(rect.getAttribute('x') ?? '0');
        const width = parseFloat(rect.getAttribute('width') ?? '0');
        expect(x + width).toBe(69);
      });
    });

    it('form bars are in the left half', () => {
      const { container } = render(<OrderBookLayoutIcon position="right" />);
      const rects = Array.from(container.querySelectorAll('rect'));
      // Last 3 rects are the form bars
      const formRects = rects.slice(6);
      formRects.forEach((rect) => expect(rect).toHaveAttribute('x', '5'));
    });
  });
});
