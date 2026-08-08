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
import { EXTENSION_MESSAGES } from '../../../../../shared/constants/messages';
import { formatChartTime, formatUsd } from '../../lib/helpers';

type Props = {
  caipAssetId: string | null;
  currentPrice: number | null;
  positive: boolean;
};

function readCssColor(element: Element, name: string, fallback: string) {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  return value || fallback;
}

function toSeriesData(values: number[], currentPrice: number | null) {
  const nowSec = Math.floor(Date.now() / 1000);
  const spanSec = 24 * 60 * 60;
  const lastIndex = Math.max(values.length - 1, 1);

  return values.map((value, index) => {
    const isLast = index === values.length - 1;
    return {
      time: (nowSec -
        spanSec +
        Math.round((spanSec * index) / lastIndex)) as UTCTimestamp,
      value: isLast && currentPrice !== null ? currentPrice : value,
    };
  });
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
      const values = response?.body?.priceHistory;
      return Array.isArray(values) &&
        values.length >= 2 &&
        values.every(
          (value: unknown) =>
            typeof value === 'number' && Number.isFinite(value),
        )
        ? (values as number[])
        : null;
    })
    .catch(() => null);
}

export function PriceChart({ caipAssetId, currentPrice, positive }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(Boolean(caipAssetId));

  useEffect(() => {
    if (!caipAssetId) {
      setValues([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setValues([]);

    loadPriceHistory(caipAssetId).then((history) => {
      if (cancelled) {
        return;
      }
      setValues(history ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [caipAssetId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || values.length < 2) {
      return;
    }

    const lineColor = positive
      ? readCssColor(container, '--color-success-default', '#28a745')
      : readCssColor(container, '--color-error-default', '#d73a49');
    const textColor = readCssColor(
      container,
      '--color-text-alternative',
      '#848c96',
    );
    const baselineColor = readCssColor(
      container,
      '--color-border-muted',
      '#3c3c3c',
    );
    const crosshairColor = readCssColor(
      container,
      '--color-border-default',
      '#848c96',
    );

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
      },
      leftPriceScale: { visible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (time: number) => formatChartTime(time * 1000),
      },
      localization: {
        priceFormatter: (price: number) => formatUsd(price),
        timeFormatter: (time: number) => formatChartTime(time * 1000),
      },
      crosshair: {
        mode: 1,
        vertLine: {
          visible: true,
          labelVisible: false,
          width: 1,
          style: LineStyle.Dotted,
          color: crosshairColor,
        },
        horzLine: {
          visible: true,
          labelVisible: true,
          width: 1,
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
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: lineColor,
      crosshairMarkerBackgroundColor: lineColor,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => formatUsd(price),
        minMove: 0.01,
      },
    });

    const data = toSeriesData(values, currentPrice);
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
  }, [values, currentPrice, positive]);

  if (values.length < 2) {
    return (
      <div className="my-2 mb-5">
        <div className="grid h-[170px] place-items-center text-s-body-sm text-alternative">
          {loading ? 'Loading chart…' : 'Chart unavailable'}
        </div>
      </div>
    );
  }

  return (
    <div className="my-2 mb-5">
      <div ref={containerRef} className="h-[170px] w-full" />
    </div>
  );
}
