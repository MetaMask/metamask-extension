import React from 'react';

export type CandlesticksIconProps = {
  className?: string;
  'data-testid'?: string;
};

/**
 * Candlesticks glyph used for the order book toggle. Rendered as an inline SVG
 * because the design-system icon set does not include a candlestick icon.
 * Inherits color via `currentColor`.
 *
 * @param props - Component props.
 * @param props.className - Optional class names (sizing/color).
 * @param props.'data-testid' - Optional test id.
 */
export const CandlesticksIcon = ({
  className,
  'data-testid': dataTestId,
}: CandlesticksIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    data-testid={dataTestId}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M9.5 5.331H7.831V7H6.165V17h1.667v1.668H9.5V17h1.668V7H9.499zm0 10.003H7.831V8.666H9.5zM17.835 8.666h-1.667V5.33H14.5v3.335h-1.667V14.5H14.5v4.168h1.667V14.5h1.667zm-1.667 4.168H14.5v-2.501h1.667z" />
  </svg>
);
