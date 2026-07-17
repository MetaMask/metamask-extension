import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { FeesRows } from '../components/amounts-section';
import { Footer, Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';

export function DefaultDetails({ item }: { item: ActivityListItem }) {
  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokensSection
          tokens={[
            {
              token: 'token' in item.data ? item.data.token : undefined,
            },
          ]}
        />
        <MetadataSection item={item} />
        <Section>
          <FeesRows item={item} />
        </Section>
      </div>

      <Footer>
        <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
      </Footer>
    </div>
  );
}
