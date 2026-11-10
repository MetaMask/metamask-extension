import React from 'react';
import { ModalBody, ModalFooter } from '@metamask/design-system-react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { FeesRows, TotalAmountRow } from '../components/amounts-section';
import { Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection } from '../components/sections';
import { TokenHeader } from '../components/token-header';

export function AssetActivationDetails({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type: 'assetActivation' | 'assetDeactivation';
    }
  >;
}) {
  return (
    <>
      <ModalBody className="flex-1 divide-y divide-border-muted">
        <TokenHeader token={item.data.token} />
        <MetadataSection item={item} />
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
