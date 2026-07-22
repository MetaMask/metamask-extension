import React from 'react';

/* eslint-disable @metamask/design-tokens/color-no-hex -- SVG chart placeholder colors, not DS UI tokens */
export function ChartPlaceholder() {
  return (
    <svg
      className="chart"
      viewBox="0 0 328 61"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 40 C40 48 60 20 90 28 C120 36 140 10 170 18 C200 26 220 34 250 22 C280 10 300 28 328 16"
        stroke="#BAF24A"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M0 40 C40 48 60 20 90 28 C120 36 140 10 170 18 C200 26 220 34 250 22 C280 10 300 28 328 16 V61 H0 Z"
        fill="url(#mm-chart-fade)"
      />
      <line
        x1="0"
        y1="35"
        x2="328"
        y2="35"
        stroke="#686E7D"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <defs>
        <linearGradient id="mm-chart-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BAF24A" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#BAF24A" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
/* eslint-enable @metamask/design-tokens/color-no-hex */
