import React, { useEffect, useState } from 'react';
import type { AssetData, WidgetModel } from '../lib/types';
import { DisableConfirmDialog } from './components/disable-confirm-dialog';
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
  const [confirmDisable, setConfirmDisable] = useState(false);

  useEffect(() => {
    setActive(data);
    setView('detail');
    setConfirmDisable(false);
  }, [data]);

  const results = [
    data,
    ...similar.filter((asset) => asset.caipAssetId !== data.caipAssetId),
  ];

  return (
    <>
      <div className="mm-cashtag-card w-full h-full overflow-y-auto rounded-xl border border-muted bg-default text-default">
        {view === 'detail' ? (
          <TokenDetail
            data={active}
            onSwap={() => onSwap(active)}
            onDisable={() => setConfirmDisable(true)}
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
      <DisableConfirmDialog
        open={confirmDisable}
        onCancel={() => setConfirmDisable(false)}
        onConfirm={onDisable}
      />
    </>
  );
}
