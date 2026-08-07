import React from 'react';
import { formatChartTime, formatUsd } from '../../lib/helpers';

export type PriceChartProps = {
  values: number[];
  currentPrice: number | null;
  positive: boolean;
};

function downsample(values: number[], maxPoints: number) {
  if (values.length <= maxPoints) {
    return values;
  }
  const step = (values.length - 1) / (maxPoints - 1);
  const result: number[] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    result.push(values[Math.round(i * step)]);
  }
  return result;
}

export function PriceChart({ values, currentPrice, positive }: PriceChartProps) {
  const sampled = downsample(values, 48);
  if (sampled.length < 2) {
    return (
      <div className="my-2 mb-5">
        <div className="grid min-h-[170px] place-items-center text-s-body-sm text-alternative">
          Chart unavailable
        </div>
      </div>
    );
  }

  const price = currentPrice ?? sampled[sampled.length - 1];
  const min = Math.min(...sampled, price);
  const max = Math.max(...sampled, price);
  const range = max - min || 1;
  const width = 426;
  const height = 140;
  const padY = 12;
  const now = Date.now();
  const spanMs = 24 * 60 * 60 * 1000;

  const coords = sampled.map((value, index) => {
    const x = (index / Math.max(sampled.length - 1, 1)) * width;
    const y = padY + ((max - value) / range) * (height - padY * 2);
    return {
      x,
      y,
      value,
      timestamp: now - spanMs + (spanMs * index) / (sampled.length - 1),
    };
  });

  const path = coords
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(' ');

  const last = coords[coords.length - 1];
  const midY = height / 2;
  const yLabels = [
    max,
    max - range * 0.25,
    max - range * 0.5,
    max - range * 0.75,
    min,
  ];
  const xLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const point = coords[Math.round(ratio * (coords.length - 1))];
    return point ? formatChartTime(point.timestamp) : '—';
  });

  const stroke = positive
    ? 'var(--color-success-default)'
    : 'var(--color-error-default)';

  return (
    <div className="my-2 mb-5">
      <div className="relative h-[170px]">
        <svg
          className="block h-[140px] w-[calc(100%-86px)]"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1={midY}
            x2={width}
            y2={midY}
            stroke="var(--color-border-muted)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <path
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={last.x} cy={last.y} r="5" fill={stroke}>
            <animate
              attributeName="r"
              values="5;8;5"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
        <div className="pointer-events-none absolute top-0 right-0 flex h-[140px] w-[78px] flex-col items-end justify-between text-right text-s-body-xs font-medium text-alternative">
          {yLabels.map((value, index) => (
            <span
              key={`y-${index}`}
              className={index === 2 ? 'text-muted' : undefined}
            >
              {formatUsd(value)}
            </span>
          ))}
        </div>
        <div
          className={`pointer-events-none absolute right-0 rounded px-1.5 text-s-body-xs font-medium leading-5 ${
            positive
              ? 'bg-success-default text-success-inverse'
              : 'bg-error-default text-error-inverse'
          }`}
          style={{
            top: `calc(${((last.y / height) * 100).toFixed(2)}% - 10px)`,
          }}
        >
          {formatUsd(price)}
        </div>
      </div>
      <div className="mt-2 flex w-[calc(100%-86px)] justify-between text-s-body-xs font-medium text-alternative">
        {xLabels.map((label, index) => (
          <span key={`x-${index}`}>{label}</span>
        ))}
      </div>
    </div>
  );
}
