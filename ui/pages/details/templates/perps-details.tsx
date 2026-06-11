import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { PerpsFiatRows } from '../components/amounts-section';
import { Footer, Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';

export function PerpsDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'perpsAddFunds' | 'perpsWithdraw' }>;
}) {
  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokensSection tokens={[{ token: item.data.token }]} />
        <MetadataSection item={item} />
        <Section>
          <PerpsFiatRows item={item} />
        </Section>
      </div>

      <Footer>
        <BlockExplorerButton chainId={item.chainId} txHash={item.data.hash} />
      </Footer>
    </div>
  );
}
