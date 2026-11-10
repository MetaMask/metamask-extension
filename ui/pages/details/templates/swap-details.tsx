import React from 'react';
import { ModalBody, ModalFooter } from '@metamask/design-system-react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { FeesRows, TotalAmountRow } from '../components/amounts-section';
import { Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';
import { SwapAgainButton } from './bridge/swap-again-button';

export function SwapDetails({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type:
        | 'swap'
        | 'bridge'
        | 'convert'
        | 'lendingDeposit'
        | 'lendingWithdrawal'
        | 'wrap'
        | 'unwrap';
    }
  >;
}) {
  const t = useI18nContext();

  return (
    <>
      <ModalBody className="divide-y divide-border-muted">
        <TokensSection
          tokens={[
            { label: t('youSent'), token: item.data.sourceToken },
            { label: t('youReceived'), token: item.data.destinationToken },
          ]}
        />
        <MetadataSection item={item} />
        <Section>
          <FeesRows item={item} />
          <TotalAmountRow token={item.data.sourceToken} />
        </Section>
      </ModalBody>
      <ModalFooter className="grid gap-4">
        <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
        <SwapAgainButton
          sourceToken={item.data.sourceToken}
          destinationToken={item.data.destinationToken}
        />
      </ModalFooter>
    </>
  );
}
