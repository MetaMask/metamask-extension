import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AmountsSection } from '../components/amounts-section';
import { MetadataSection, TokensSection } from './sections';

export function SendDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'send' | 'receive' }>;
}) {
  const t = useI18nContext();
  const label = item.type === 'receive' ? t('youReceived') : t('youSent');

  return (
    <div className="divide-y divide-border-muted">
      <TokensSection tokens={[{ label, token: item.data.token }]} />
      <MetadataSection item={item} />
      <AmountsSection item={item} />
    </div>
  );
}
