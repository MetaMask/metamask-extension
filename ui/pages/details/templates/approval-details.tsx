import React from 'react';
import { Text } from '@metamask/design-system-react';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../../shared/lib/activity/types';
import { ActivityAvatar } from '../../../components/app/activity-list-item-avatar';
import { useTokensData } from '../../../hooks/useTokensData';
import { AmountsSection } from '../components/amounts-section';
import { Footer } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection } from '../components/sections';

const ApprovalTokenSection = ({ token }: { token?: TokenAmount }) => {
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
    <div className="flex items-center gap-2 py-4">
      <ActivityAvatar tokens={[token?.assetId]} />

      <Text variant="heading-lg">{tokenLabel}</Text>
    </div>
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
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <ApprovalTokenSection token={item.data.token} />
        <MetadataSection item={item} />
        <AmountsSection item={item} />
      </div>
      <Footer>
        <BlockExplorerButton chainId={item.chainId} txHash={item.data.hash} />
      </Footer>
    </div>
  );
}
