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
    <div className="h-[503px] w-[576px] animate-mm-cashtag-fade-in overflow-y-auto rounded-xl border border-muted bg-default text-default shadow-lg">
      {view === 'detail' ? (
        <TokenDetail
          data={active}
          onSwap={() => onSwap(active)}
          onDisable={onDisable}
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
