import React, { useEffect, useState } from 'react';
import type { AssetData, WidgetModel } from '../lib/types';
import { TokenDetail } from './components/token-detail';
import { TokenResults } from './components/token-results';

type WidgetView = 'detail' | 'results';

export function Widget({
  data,
  similar,
  displayTicker,
  onSwap,
  onViewDetails,
  onViewSimilar,
  onSelectSimilar,
  onDisable,
}: Readonly<WidgetModel>) {
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
    <div className="mm-cashtag-card w-full h-full overflow-y-auto rounded-xl border border-muted bg-default text-default">
      {view === 'detail' ? (
        <TokenDetail
          data={active}
          onSwap={() => onSwap(active)}
          onDisable={onDisable}
          onViewDetails={() => onViewDetails(active)}
          onViewSimilar={
            results.length > 1
              ? () => {
                  onViewSimilar();
                  setView('results');
                }
              : null
          }
        />
      ) : (
        <TokenResults
          ticker={displayTicker}
          results={results}
          onBack={() => setView('detail')}
          onSelect={(asset) => {
            if (asset.caipAssetId !== data.caipAssetId) {
              onSelectSimilar(asset);
            }
            setActive(asset);
            setView('detail');
          }}
        />
      )}
    </div>
  );
}
