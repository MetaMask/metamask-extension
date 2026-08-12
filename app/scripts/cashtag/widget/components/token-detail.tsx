import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  TextButton,
  TextButtonSize,
} from '@metamask/design-system-react';
import browser from 'webextension-polyfill';
import {
  formatPercent,
  formatSignedUsd,
  formatUsd,
  formatUsdCompact,
} from '../../lib/helpers';
import type { AssetData } from '../../lib/types';
import { PriceChart } from './price-chart';
import { MoreMenu } from './more-menu';
import { ShieldIcon } from './shield-icon';
import { TokenAvatar } from './token-avatar';

function onWidgetClick(handler: () => void) {
  return (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handler();
  };
}

type Props = {
  data: AssetData;
  onSwap: () => void;
  onDisable: () => void;
  onFlag: () => void;
  onViewDetails: () => void;
  onViewSimilar: (() => void) | null;
};

const foxSrc = browser.runtime.getURL('images/logo/metamask-fox.svg');

export function TokenDetail({
  data,
  onSwap,
  onDisable,
  onFlag,
  onViewDetails,
  onViewSimilar,
}: Props) {
  const positive =
    data.change24hPercent === null ? true : data.change24hPercent >= 0;
  const priceChangeUsd =
    data.price !== null && data.change24hPercent !== null
      ? data.price * (data.change24hPercent / 100)
      : null;

  return (
    <div className="flex h-full flex-col">
      <header className="mb-7 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <TokenAvatar asset={data} size="lg" />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-s-body-md font-medium text-default">
                {data.ticker}
              </span>
              {data.verified ? (
                <span className="inline-flex h-[19px] items-center gap-1 rounded-md border border-success-muted bg-muted px-2 text-[10px] font-medium leading-none text-success-default">
                  <ShieldIcon />
                  Verified
                </span>
              ) : null}
            </div>
            <span className="text-s-body-sm text-alternative">{data.name}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <img
            className="block size-7 shrink-0 rounded-full bg-section object-contain"
            src={foxSrc}
            alt="MetaMask"
            width={28}
            height={28}
          />
          <MoreMenu onDisable={onDisable} onFlag={onFlag} />
        </div>
      </header>

      <section className="mb-3 flex items-start justify-between gap-6">
        <div>
          <div className="text-s-display-md font-bold tracking-tight text-default">
            {data.price === null ? '—' : formatUsd(data.price)}
          </div>
          <div className="flex gap-1 text-s-body-sm font-medium">
            {data.change24hPercent === null ? (
              <span className="text-alternative">—</span>
            ) : (
              <span
                className={
                  positive ? 'text-success-default' : 'text-error-default'
                }
              >
                {priceChangeUsd === null
                  ? formatPercent(data.change24hPercent)
                  : `${formatSignedUsd(priceChangeUsd)} (${formatPercent(data.change24hPercent)})`}
              </span>
            )}
            <span className="text-alternative">Today</span>
          </div>
        </div>
        <div className="flex gap-10 pt-2">
          <div className="flex flex-col items-end">
            <span className="text-s-body-sm font-medium text-alternative">
              Market cap
            </span>
            <strong className="text-s-body-sm font-medium text-default">
              {data.marketCap === null ? '—' : formatUsdCompact(data.marketCap)}
            </strong>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-s-body-sm font-medium text-alternative">
              Liquidity
            </span>
            <strong className="text-s-body-sm font-medium text-default">
              {data.liquidity === null ? '—' : formatUsdCompact(data.liquidity)}
            </strong>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-s-body-sm font-medium text-alternative">
              24h volume
            </span>
            <strong className="text-s-body-sm font-medium text-default">
              {data.volume24h === null ? '—' : formatUsdCompact(data.volume24h)}
            </strong>
          </div>
        </div>
      </section>

      <div className="flex-1">
        <PriceChart
          caipAssetId={data.caipAssetId}
          currentPrice={data.price}
          positive={positive}
        />
      </div>

      <footer className="grid grid-cols-2 gap-4">
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          className="w-full"
          onClick={onWidgetClick(onViewDetails)}
        >
          View details
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          onClick={onWidgetClick(onSwap)}
        >
          Swap
        </Button>
      </footer>

      {onViewSimilar ? (
        <div className="mt-4 flex justify-end">
          <TextButton
            size={TextButtonSize.BodySm}
            onClick={onWidgetClick(onViewSimilar)}
          >
            View similar tokens
            <span aria-hidden="true">›</span>
          </TextButton>
        </div>
      ) : null}
    </div>
  );
}
