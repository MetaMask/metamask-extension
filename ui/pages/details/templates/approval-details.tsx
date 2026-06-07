import React from 'react';
import { AvatarTokenSize } from '@metamask/design-system-react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokensData } from '../../../hooks/useTokensData';
import { MetadataSection } from './sections';

const ApprovalTokenSection = ({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type: 'approveSpendingCap' | 'revokeSpendingCap' | 'increaseSpendingCap';
    }
  >;
}) => {
  const t = useI18nContext();
  const { token } = item.data;
  const tokenAssetId = token?.assetId;
  const tokensByAssetId = useTokensData(tokenAssetId ? [tokenAssetId] : []);
  const tokenMetadata = tokenAssetId
    ? tokensByAssetId[tokenAssetId.toLowerCase()]
    : undefined;
  const tokenLabel =
    token?.symbol ??
    tokenMetadata?.symbol ??
    tokenMetadata?.name ??
    tokenAssetId;

  return (
    <section className="py-3">
      <p className="text-alternative">{`${t('you')} ${t('approved').toLowerCase()}`}</p>

      <div className="flex items-center gap-3 py-4">
        <ActivityAvatar tokens={[token?.assetId]} size={AvatarTokenSize.Lg} />

        <p className="text-l-heading-lg leading-l-heading-lg tracking-l-heading-lg font-semibold">
          {tokenLabel}
        </p>
      </div>
    </section>
  );
};

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
      <ApprovalTokenSection item={item} />
      <MetadataSection item={item} />
    </div>
  );
}
