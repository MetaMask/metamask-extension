import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { PerpsFiatRows } from '../components/amounts-section';
import { Footer, Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';

const HYPERLIQUID_EXPLORER_URL = 'https://app.hyperliquid.xyz/explorer';

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
        <BlockExplorerButton
          blockExplorerUrl={HYPERLIQUID_EXPLORER_URL}
          txHash={item.data.hash}
        />
      </Footer>
    </div>
  );
}
