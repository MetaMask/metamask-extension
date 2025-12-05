import React from 'react';
import { type CaipAssetType } from '@metamask/utils';
import { Text } from '@metamask/design-system-react';
import { type BridgeToken } from '../../../../../ducks/bridge/types';
import { Column } from '../../../layout';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import { useTokenList } from '../../../../../hooks/bridge/useTokenList';
import { AssetListItem } from './asset-list-item';

export const BridgeAssetList = ({
  onAssetChange,
  selectedAsset,
  excludedAssetId,
  chainId,
  accountAddress,
  abortControllerRef,
  searchQuery,
  chainIds,
}: {
  onAssetChange: (asset: BridgeToken) => void;
  selectedAsset: BridgeToken;
  excludedAssetId?: CaipAssetType;
  searchQuery?: string;
} & React.ComponentProps<typeof Column> &
  Pick<
    Parameters<typeof useTokenList>[0],
    | 'selectedAsset'
    | 'chainId'
    | 'searchQuery'
    | 'accountAddress'
    | 'abortControllerRef'
    | 'chainIds'
  >) => {
  const { tokenList, isLoading } = useTokenList({
    selectedAsset,
    chainId,
    searchQuery: searchQuery?.trim(),
    accountAddress,
    abortControllerRef,
    chainIds,
  });

  return (
    <Column gap={0} style={{ overflowY: 'scroll', maxWidth: '100%' }}>
      {tokenList.map((token) => {
        if (token.assetId.toLowerCase() === excludedAssetId?.toLowerCase()) {
          return null;
        }
        return (
          <AssetListItem
            key={token.assetId}
            asset={token}
            onClick={() => {
              onAssetChange(token);
            }}
            selected={selectedAsset?.assetId === token.assetId}
          />
        );
      })}
      <Skeleton
        isLoading={isLoading}
        style={{ minHeight: '80px', maxHeight: '80px', width: '100%' }}
      />
      {!isLoading &&
        tokenList.length <= 1 &&
        excludedAssetId &&
        tokenList?.[0]?.assetId?.toLowerCase() ===
          excludedAssetId?.toLowerCase() && (
          <Text>No matching assets TODO</Text>
        )}
    </Column>
  );
};
