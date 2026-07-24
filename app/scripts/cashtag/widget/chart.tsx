import React, { useId } from 'react';

export type SparklineChartProps = {
  values: number[];
  positive?: boolean;
  width?: number;
  height?: number;
  className?: string;
};

type ChartGeometry = {
  linePath: string;
  areaPath: string;
  midY: number;
};

function buildGeometry(
  values: number[],
  width: number,
  height: number,
): ChartGeometry | null {
  if (values.length < 2) {
    return null;
  }

  let min = values[0];
  let max = values[0];
  for (const value of values) {
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  const range = max - min || 1;
  const padY = 4;
  const usableHeight = Math.max(height - padY * 2, 1);
  const stepX = width / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * stepX;
    const y = padY + ((max - value) / range) * usableHeight;
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ');
  const areaPath = `${linePath} L${width} ${height} L0 ${height} Z`;
  const midY = padY + usableHeight / 2;

  return { linePath, areaPath, midY };
}

/* eslint-disable @metamask/design-tokens/color-no-hex -- SVG series colors, not DS UI tokens */
export function SparklineChart({
  values,
  positive,
  width = 328,
  height = 61,
  className = 'chart',
}: SparklineChartProps) {
  const gradientId = useId().replace(/:/gu, '');
  const isPositive =
    positive ??
    (values.length >= 2 ? values[values.length - 1] >= values[0] : true);
  const stroke = isPositive ? '#BAF24A' : '#FF7584';
  const geometry = buildGeometry(values, width, height);

  if (!geometry) {
    return null;
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d={geometry.areaPath} fill={`url(#${gradientId})`} />
      <path
        d={geometry.linePath}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="0"
        y1={geometry.midY}
        x2={width}
        y2={geometry.midY}
        stroke="#686E7D"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
/* eslint-enable @metamask/design-tokens/color-no-hex */
