import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { AmountsSection } from '../components/amounts-section';
import { Footer } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';

export function SendDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'send' | 'receive' }>;
}) {
  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokensSection tokens={[{ token: item.data.token }]} />
        <MetadataSection
          item={item}
          addressRows={{ from: item.data.from, to: item.data.to }}
        />
        <AmountsSection item={item} />
      </div>
      <Footer>
        <BlockExplorerButton chainId={item.chainId} txHash={item.data.hash} />
      </Footer>
    </div>
  );
}
