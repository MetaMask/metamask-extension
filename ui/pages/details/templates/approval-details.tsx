import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { MetadataSection, TokensSection } from './sections';

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
    <div className="divide-y divide-border-muted">
      <TokensSection tokens={[{ label: 'Token', token: item.data.token }]} />
      <MetadataSection item={item} />
    </div>
  );
}
