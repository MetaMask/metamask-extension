import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { formatUsd, formatUsdCompact } from '../../lib/helpers';
import type { AssetData } from '../../lib/types';
import { TokenAvatar } from './token-avatar';

type Props = {
  ticker: string;
  results: AssetData[];
  onBack: () => void;
  onSelect: (asset: AssetData) => void;
};

function formatCell(value: number | null) {
  return value === null ? '—' : formatUsdCompact(value);
}

export function TokenResults({ ticker, results, onBack, onSelect }: Props) {
  const showLiquidity = results.some((asset) => asset.liquidity !== null);

  return (
    <div className="flex h-full flex-col py-6">
      <header className="mb-5 flex items-center gap-3 px-6">
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          size={ButtonIconSize.Md}
          ariaLabel="Back"
          className="text-icon-default hover:bg-muted-hover"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onBack();
          }}
        />
        <h2 className="m-0 text-s-heading-sm font-medium text-default">
          {ticker} results
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[140px]" />
            <col />
            <col />
            {showLiquidity ? <col /> : null}
            <col />
          </colgroup>
          <thead>
            <tr className="text-s-body-sm font-medium text-alternative">
              <th className="pb-3 pl-6 pr-3 font-medium">Name</th>
              <th className="pb-3 pr-3 text-end font-medium">Price</th>
              <th className="pb-3 pr-3 text-end font-medium">Market cap</th>
              {showLiquidity ? (
                <th className="pb-3 pr-3 text-end font-medium">Liquidity</th>
              ) : null}
              <th className="pb-3 pr-6 text-end font-medium">24h volume</th>
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
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <TokenAvatar asset={asset} />
                      <span className="truncate font-medium">
                        {asset.ticker}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-end tabular-nums">
                    {asset.price === null ? '—' : formatUsd(asset.price)}
                  </td>
                  <td className="py-3 pr-3 text-end tabular-nums">
                    {formatCell(asset.marketCap)}
                  </td>
                  {showLiquidity ? (
                    <td className="py-3 pr-3 text-end tabular-nums">
                      {formatCell(asset.liquidity)}
                    </td>
                  ) : null}
                  <td className="py-3 pr-6 text-end tabular-nums">
                    {formatCell(asset.volume24h)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
