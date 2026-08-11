import React from 'react';

const ORDER_BOOK_BARS = [
  { width: 28, fill: 'var(--color-error-default)' },
  { width: 18, fill: 'var(--color-error-default)' },
  { width: 12, fill: 'var(--color-error-default)' },
  { width: 12, fill: 'var(--color-success-default)' },
  { width: 18, fill: 'var(--color-success-default)' },
  { width: 28, fill: 'var(--color-success-default)' },
] as const;

const ORDER_BOOK_BAR_Y = [2.5, 7.5, 12.5, 17.5, 22.5, 27.5] as const;
const FORM_BAR_Y = [2.5, 12.5, 22.5] as const;

function OrderBookBars({
  edgeX,
  align,
}: {
  edgeX: number;
  align: 'left' | 'right';
}) {
  return (
    <>
      {ORDER_BOOK_BARS.map(({ width, fill }, i) => (
        <rect
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          x={align === 'left' ? edgeX : edgeX - width}
          y={ORDER_BOOK_BAR_Y[i]}
          width={width}
          height={2}
          rx={1}
          fill={fill}
        />
      ))}
    </>
  );
}

/**
 * Mini thumbnail icon used in the order-book layout picker.
 *
 * `position="left"` — order book on the left (flat outer edge), form on the right.
 * `position="right"` — form on the left, order book on the right (flat outer edge).
 */
export function OrderBookLayoutIcon({
  position,
}: {
  position: 'left' | 'right';
}) {
  const isLeft = position === 'left';
  const formX = isLeft ? 38 : 5;

  return (
    <svg
      width="71"
      height="32"
      viewBox="0 0 71 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <OrderBookBars
        edgeX={isLeft ? 2 : 69}
        align={isLeft ? 'left' : 'right'}
      />
      {FORM_BAR_Y.map((y) => (
        <rect
          key={y}
          x={formX}
          y={y}
          width={28}
          height={7}
          rx={2}
          fill="var(--color-icon-alternative)"
        />
      ))}
    </svg>
  );
}
