import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { FeesRows, TotalAmountRow } from '../components/amounts-section';
import { Footer, Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection } from '../components/sections';
import { TokenHeader } from '../components/token-header';

export function ApprovalDetails({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type: 'approveSpendingCap' | 'revokeSpendingCap' | 'increaseSpendingCap';
    }
  >;
}) {
  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokenHeader token={item.data.token} />
        <MetadataSection item={item} />
        <Section>
          <FeesRows item={item} />
          <TotalAmountRow token={item.data.token} />
        </Section>
      </div>
      <Footer>
        <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
      </Footer>
    </div>
  );
}
