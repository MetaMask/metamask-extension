import React, { useEffect, useState } from 'react';
import type { AssetData, WidgetModel } from '../lib/types';
import { TokenDetail } from './components/token-detail';
import { TokenResults } from './components/token-results';

type WidgetView = 'detail' | 'results';

export function Widget({
  data,
  similar,
  onSwap,
  onViewDetails,
  onDisable,
  onFlag,
}: WidgetModel) {
  const [view, setView] = useState<WidgetView>('detail');
  const [active, setActive] = useState<AssetData>(data);

  useEffect(() => {
    setActive(data);
    setView('detail');
  }, [data]);

  const results = [
    data,
    ...similar.filter((asset) => asset.caipAssetId !== data.caipAssetId),
  ];

  return (
    <div
      className="box-border h-[503px] w-[576px] animate-mm-cashtag-fade-in overflow-y-auto rounded-xl border border-muted bg-default p-6 text-default shadow-lg"
      role="dialog"
      aria-label={`${active.ticker} price widget`}
    >
      {view === 'detail' ? (
        <TokenDetail
          data={active}
          onSwap={() => onSwap(active)}
          onDisable={onDisable}
          onFlag={onFlag}
          onViewDetails={() => onViewDetails(active)}
          onViewSimilar={results.length > 1 ? () => setView('results') : null}
        />
      ) : (
        <TokenResults
          ticker={active.ticker}
          results={results}
          onBack={() => setView('detail')}
          onSelect={(asset) => {
            setActive(asset);
            setView('detail');
          }}
        />
      )}
    </div>
  );
}
