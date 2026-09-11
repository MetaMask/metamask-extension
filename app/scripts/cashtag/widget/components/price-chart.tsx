import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  LineSeries,
  LineStyle,
  type IChartApi,
  type UTCTimestamp,
  // @ts-expect-error suppress CommonJS vs ECMAScript error
} from 'lightweight-charts';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { formatChartTime, formatUsd } from '../../lib/helpers';
import type { PricePoint } from '../../lib/types';

type Props = {
  caipAssetId: string | null;
  currentPrice: number | null;
  positive: boolean;
};

function readCssColor(element: Element, name: string) {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

function toSeriesData(points: PricePoint[], currentPrice: number | null) {
  return points.map((point, index) => {
    const isLast = index === points.length - 1;
    return {
      time: Math.floor(point.time / 1000) as UTCTimestamp,
      value: isLast && currentPrice !== null ? currentPrice : point.value,
    };
  });
}

function isPricePoint(point: unknown): point is PricePoint {
  const candidate = point as PricePoint | null;
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    Number.isFinite(candidate.time) &&
    Number.isFinite(candidate.value)
  );
}

function loadPriceHistory(caipAssetId: string) {
  return browser.runtime
    .sendMessage({
      type: EXTENSION_MESSAGES.GET_DATA,
      body: {
        caipAssetId,
        fields: ['priceHistory'],
      },
    })
    .then((response) => {
      const points = response?.body?.priceHistory;
      return Array.isArray(points) &&
        points.length >= 2 &&
        points.every(isPricePoint)
        ? (points as PricePoint[])
        : null;
    })
    .catch(() => null);
}

export function PriceChart({ caipAssetId, currentPrice, positive }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(Boolean(caipAssetId));

  useEffect(() => {
    if (!caipAssetId) {
      setPoints([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setPoints([]);

    loadPriceHistory(caipAssetId).then((history) => {
      if (cancelled) {
        return;
      }
      setPoints(history ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [caipAssetId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length < 2) {
      return;
    }

    // Chart canvas API needs concrete colors resolved from design-token CSS vars.
    const lineColor = positive
      ? readCssColor(container, '--color-success-default')
      : readCssColor(container, '--color-error-default');
    const textColor = readCssColor(container, '--color-text-alternative');
    const baselineColor = readCssColor(container, '--color-border-muted');
    const crosshairColor = readCssColor(container, '--color-border-default');

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 170,
      layout: {
        background: { color: 'transparent' },
        textColor,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.12 },
        entireTextOnly: true,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        rightOffsetPixels: 16,
        // Midnight in a 24h window is a Day tick; LW charts bold those.
        allowBoldLabels: false,
        tickMarkFormatter: (time: number) => formatChartTime(time * 1000),
      },
      localization: {
        priceFormatter: (price: number) => formatUsd(price),
        timeFormatter: (time: number) => formatChartTime(time * 1000),
      },
      crosshair: {
        vertLine: {
          labelVisible: false,
          style: LineStyle.Dotted,
          color: crosshairColor,
        },
        horzLine: {
          style: LineStyle.Dotted,
          color: crosshairColor,
        },
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    const series = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: lineColor,
      crosshairMarkerBackgroundColor: lineColor,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => formatUsd(price),
        minMove: 0.01,
      },
    });

    const data = toSeriesData(points, currentPrice);
    series.setData(data);

    series.createPriceLine({
      price: data[0].value,
      color: baselineColor,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: false,
    });

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) {
        return;
      }
      chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [points, currentPrice, positive]);

  if (points.length < 2) {
    return (
      <div className="grid h-[170px] place-items-center text-s-body-sm text-alternative">
        {loading ? 'Loading chart…' : 'Chart unavailable'}
      </div>
    );
  }

  return <div ref={containerRef} className="h-[170px] w-full" />;
}
