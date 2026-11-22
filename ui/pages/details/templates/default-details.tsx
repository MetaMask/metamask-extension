import React from 'react';
import { ModalBody, ModalFooter } from '@metamask/design-system-react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { FeesRows } from '../components/amounts-section';
import { Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';

export function DefaultDetails({ item }: { item: ActivityListItem }) {
  return (
    <>
      <ModalBody className="flex-1 divide-y divide-border-muted">
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
      </ModalBody>

      <ModalFooter>
        <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
      </ModalFooter>
    </>
  );
}
