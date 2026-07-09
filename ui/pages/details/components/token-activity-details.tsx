import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { FeesRows, TotalAmountRow } from './amounts-section';
import { Footer, Section } from './shared';
import { BlockExplorerButton } from './block-explorer-button';
import { MetadataSection } from './sections';
import { TokenHeader } from './token-header';

export function TokenActivityDetails({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type:
        | 'approveSpendingCap'
        | 'revokeSpendingCap'
        | 'increaseSpendingCap'
        | 'assetActivation'
        | 'assetDeactivation';
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
