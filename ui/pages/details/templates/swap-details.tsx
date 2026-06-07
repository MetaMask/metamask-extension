import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetadataSection, TokensSection } from './sections';

export function SwapDetails({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type:
        | 'swap'
        | 'convert'
        | 'lendingDeposit'
        | 'lendingWithdrawal'
        | 'wrap'
        | 'unwrap'
        | 'bridge';
    }
  >;
}) {
  const t = useI18nContext();

  return (
    <div className="divide-y divide-border-muted">
      <TokensSection
        tokens={[
          { label: t('youSent'), token: item.data.sourceToken },
          { label: t('youReceived'), token: item.data.destinationToken },
        ]}
      />
      <MetadataSection item={item} />
    </div>
  );
}
