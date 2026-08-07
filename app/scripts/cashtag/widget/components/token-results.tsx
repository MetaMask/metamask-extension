import React from 'react';
import browser from 'webextension-polyfill';
import { formatUsd, formatUsdCompact } from '../../lib/helpers';
import type { AssetData } from '../../lib/types';

type TokenResultsProps = {
  ticker: string;
  results: AssetData[];
  onBack: () => void;
  onSelect: (asset: AssetData) => void;
};

const foxSrc = browser.runtime.getURL('images/logo/metamask-fox.svg');

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M12.5 4.5L7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatCell(value: number | null) {
  return value === null ? '—' : formatUsdCompact(value);
}

export function TokenResults({
  ticker,
  results,
  onBack,
  onSelect,
}: TokenResultsProps) {
  return (
    <>
      <header className="mb-5 flex items-center gap-3">
        <button
          type="button"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-icon-default hover:bg-muted-hover"
          aria-label="Back"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onBack();
          }}
        >
          <BackIcon />
        </button>
        <h2 className="m-0 text-s-heading-sm font-medium text-default">
          {ticker} results
        </h2>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-s-body-sm font-medium text-alternative">
              <th className="pb-3 pr-3 font-medium">Name</th>
              <th className="pb-3 pr-3 font-medium">Price</th>
              <th className="pb-3 pr-3 font-medium">Market cap</th>
              <th className="pb-3 pr-3 font-medium">Liquidity</th>
              <th className="pb-3 font-medium">24h volume</th>
            </tr>
          </thead>
          <tbody>
            {results.map((asset, index) => {
              const rowKey = asset.caipAssetId ?? `${asset.ticker}-${index}`;
              return (
                <tr
                  key={rowKey}
                  className="cursor-pointer border-t border-muted text-s-body-sm text-default hover:bg-muted-hover"
                  onClick={() => onSelect(asset)}
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      {asset.iconUrl ? (
                        <img
                          className="size-8 shrink-0 rounded-full bg-section object-cover"
                          src={asset.iconUrl}
                          alt=""
                          width={32}
                          height={32}
                          onError={(event) => {
                            event.currentTarget.src = foxSrc;
                          }}
                        />
                      ) : (
                        <div
                          className="size-8 shrink-0 rounded-full bg-section"
                          style={
                            asset.color
                              ? { background: asset.color }
                              : undefined
                          }
                        />
                      )}
                      <span className="font-medium">{asset.ticker}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    {asset.price === null ? '—' : formatUsd(asset.price)}
                  </td>
                  <td className="py-3 pr-3">{formatCell(asset.marketCap)}</td>
                  <td className="py-3 pr-3">{formatCell(asset.liquidity)}</td>
                  <td className="py-3">{formatCell(asset.volume24h)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
