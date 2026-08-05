import React from 'react';
import { Text } from '@metamask/design-system-react';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokensData } from '../../../hooks/useTokensData';

export const TokenHeader = ({ token }: { token?: TokenAmount }) => {
  const t = useI18nContext();
  const tokenAssetId = token?.assetId;
  const tokensByAssetId = useTokensData(tokenAssetId ? [tokenAssetId] : []);
  const tokenMetadata = tokenAssetId
    ? tokensByAssetId[tokenAssetId.toLowerCase()]
    : undefined;
  const tokenLabel =
    token?.symbol ?? tokenMetadata?.symbol ?? tokenMetadata?.name ?? t('token');

  return (
    <div className="flex items-center gap-2 py-4">
      <ActivityAvatar tokens={[token?.assetId]} />

      <Text variant="heading-lg">{tokenLabel}</Text>
    </div>
  );
};
