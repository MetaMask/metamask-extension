import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { formatUsd, formatUsdCompact } from '../lib/helpers';
import type { WidgetModel } from '../lib/types';
import { SparklineChart } from './chart';

const foxSrc = browser.runtime.getURL('images/logo/metamask-fox.svg');

export function Widget({ data, onSwap, onDisable }: WidgetModel) {
  const changeUp = data.change24hPercent !== null && data.change24hPercent >= 0;
  const priceLabel =
    typeof data.price === 'number' && data.price > 0
      ? formatUsd(data.price)
      : '—';
  const changeLabel =
    data.change24hPercent === null
      ? null
      : `${data.change24hPercent > 0 ? '+' : ''}${data.change24hPercent.toFixed(1)}%`;
  const marketCapLabel =
    data.marketCap === null ? '—' : formatUsdCompact(data.marketCap);
  const volumeLabel =
    data.volume24h === null ? '—' : formatUsdCompact(data.volume24h);

  return (
    <div className="widget">
      <header className="header">
        <div className="identity">
          {data.iconUrl ? (
            <img
              className="avatar"
              src={data.iconUrl}
              alt=""
              width={40}
              height={40}
              style={data.color ? { background: data.color } : undefined}
            />
          ) : (
            <div
              className="avatar"
              style={data.color ? { background: data.color } : undefined}
            />
          )}
          <div className="titles">
            <div className="symbol-row">
              <span className="symbol">{data.ticker}</span>
            </div>
            <p className="name">{data.name}</p>
          </div>
        </div>
        <img className="fox" src={foxSrc} alt="" width={28} height={28} />
      </header>

      <div className="body">
        <section className="price-block">
          <p className="section-label">Price</p>
          <div className="price-row">
            <div className="price-main">
              <p className={data.price === null ? 'price empty' : 'price'}>
                {priceLabel}
              </p>
              {changeLabel ? (
                <span className={changeUp ? 'change up' : 'change down'}>
                  {changeLabel}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="chart-block">
          <p className="section-label">Past 24h</p>
          {data.sparkline && data.sparkline.length >= 2 ? (
            <SparklineChart
              values={data.sparkline}
              positive={
                data.change24hPercent === null
                  ? undefined
                  : data.change24hPercent >= 0
              }
            />
          ) : null}
        </section>

        <section className="stats">
          <div className="stat">
            <p className="stat-label">Market cap</p>
            <p className="stat-value">{marketCapLabel}</p>
          </div>
          <div className="stat">
            <p className="stat-label">24h volume</p>
            <p className="stat-value">{volumeLabel}</p>
          </div>
        </section>

        <button
          className="swap"
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSwap();
          }}
        >
          Swap in MetaMask
        </button>
      </div>

      <button
        className="disable"
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDisable();
        }}
      >
        Disable widget
      </button>
    </div>
  );
}

export function mountWidget(container: HTMLElement) {
  const root = createRoot(container);
  return {
    render(model: WidgetModel) {
      root.render(<Widget {...model} />);
    },
    unmount() {
      root.unmount();
    },
  };
}
