import React from 'react';
import { ModalBody, ModalFooter } from '@metamask/design-system-react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { FeesRows, TotalAmountRow } from '../components/amounts-section';
import { Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';

export function SendDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'send' | 'receive' }>;
}) {
  return (
    <>
      <ModalBody className="divide-y divide-border-muted">
        <TokensSection tokens={[{ token: item.data.token }]} />
        <MetadataSection
          item={item}
          addressRows={{ from: item.data.from, to: item.data.to }}
        />
        <Section>
          <FeesRows item={item} />
          <TotalAmountRow token={item.data.token} />
        </Section>
      </ModalBody>
      <ModalFooter>
        <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
      </ModalFooter>
    </>
  );
}
