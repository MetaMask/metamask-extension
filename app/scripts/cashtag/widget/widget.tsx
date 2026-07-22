import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';
import { formatUsd } from '../lib/helpers';
import type { WidgetModel } from '../lib/types';
import { ChartPlaceholder } from './chart';

const foxSrc = browser.runtime.getURL('images/logo/metamask-fox.svg');

const Widget = ({ asset, price, onSwap, onDisable }: WidgetModel) => {
  const changeUp = price.percentChange !== null && price.percentChange >= 0;
  const priceLabel = price.value === null ? '—' : formatUsd(price.value);
  const changeLabel =
    price.percentChange === null
      ? null
      : `${price.percentChange > 0 ? '+' : ''}${price.percentChange.toFixed(1)}%`;

  return (
    <div className="widget">
      <header className="header">
        <div className="identity">
          <div className="avatar" style={{ background: asset.color }}>
            {asset.icon}
          </div>
          <div className="titles">
            <div className="symbol-row">
              <span className="symbol">{asset.symbol}</span>
            </div>
            <p className="name">{asset.name}</p>
          </div>
        </div>
        <img className="fox" src={foxSrc} alt="" width={28} height={28} />
      </header>

      <div className="body">
        <section className="price-block">
          <p className="section-label">Price</p>
          <div className="price-row">
            <div className="price-main">
              <p className={price.value === null ? 'price empty' : 'price'}>
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
          <ChartPlaceholder />
        </section>

        <section className="stats">
          <div className="stat">
            <p className="stat-label">Market cap</p>
            <p className="stat-value">—</p>
          </div>
          <div className="stat">
            <p className="stat-label">24h volume</p>
            <p className="stat-value">—</p>
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
};

export function onMount(container: HTMLElement) {
  const app = document.createElement('div');
  container.append(app);
  const root = createRoot(app);
  return {
    root,
    render(model: WidgetModel) {
      root.render(<Widget {...model} />);
    },
  };
}

export function onRemove(mounted: ReturnType<typeof onMount> | undefined) {
  mounted?.root.unmount();
}
