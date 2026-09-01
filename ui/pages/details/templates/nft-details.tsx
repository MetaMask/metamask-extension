import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { FeesRows, TotalAmountRow } from '../components/amounts-section';
import { Footer, Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';

export function NftDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'nftBuy' | 'nftMint' | 'nftSell' }>;
}) {
  const t = useI18nContext();

  const isMint = item.type === 'nftMint';
  const amountToken = isMint ? item.data.token : item.data.paymentToken;
  const paymentLabel =
    item.type === 'nftSell' ? t('youReceived') : t('youSent');

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokensSection
          tokens={[
            isMint
              ? { token: item.data.token }
              : { label: paymentLabel, token: amountToken },
          ]}
        />
        <MetadataSection
          item={item}
          addressRows={{ from: item.data.from, to: item.data.to }}
        />
        <Section>
          <FeesRows item={item} />
          <TotalAmountRow token={amountToken} />
        </Section>
      </div>
      <Footer>
        <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
      </Footer>
    </div>
  );
}
