import React, { useEffect, useState } from 'react';
import type { AssetData, WidgetModel } from '../lib/types';
import { TokenDetail } from './components/token-detail';
import { TokenResults } from './components/token-results';

type WidgetView = 'detail' | 'results';

export function Widget({
  data,
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

  return (
    <div
      className="w-[576px] max-w-[min(576px,calc(100vw-24px))] animate-mm-cashtag-fade-in rounded-xl border border-muted bg-default p-6 text-default shadow-lg"
      role="dialog"
      aria-label={`${active.ticker} price widget`}
    >
      {view === 'detail' ? (
        <TokenDetail
          data={active}
          onSwap={onSwap}
          onDisable={onDisable}
          onFlag={onFlag}
          onViewDetails={onViewDetails}
          onViewSimilar={() => setView('results')}
        />
      ) : (
        <TokenResults
          ticker={active.ticker}
          results={[active]}
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
