import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { AmountsSection } from '../components/amounts-section';
import { Footer } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from './sections';

export function DefaultDetails({ item }: { item: ActivityListItem }) {
  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokensSection
          tokens={[
            {
              label: 'Token',
              token: 'token' in item.data ? item.data.token : undefined,
            },
            {
              label: 'Source token',
              token:
                'sourceToken' in item.data ? item.data.sourceToken : undefined,
            },
            {
              label: 'Destination token',
              token:
                'destinationToken' in item.data
                  ? item.data.destinationToken
                  : undefined,
            },
          ]}
        />

        <MetadataSection item={item} />
        <AmountsSection item={item} />
      </div>
      <Footer>
        <BlockExplorerButton chainId={item.chainId} txHash={item.data.hash} />
      </Footer>
    </div>
  );
}
