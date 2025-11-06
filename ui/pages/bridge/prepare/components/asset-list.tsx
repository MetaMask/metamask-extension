import React from 'react';
import { BridgeToken } from '../../../../ducks/bridge/types';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import { Column } from '../../layout';
import { BridgeAsset } from './asset';
import { BridgeAssetPickerNetworkPopover } from './asset-picker-network-popover';

export const AssetPickerTokenList = ({
  networks,
  network,
  onNetworkChange,
  onAssetChange,
  asset,
  searchQuery,
}: {
  onAssetChange: (asset: BridgeToken) => void;
  asset: BridgeToken | null;
  searchQuery: string;
} & Pick<
  React.ComponentProps<typeof BridgeAssetPickerNetworkPopover>,
  'onNetworkChange' | 'networks' | 'network'
>) => {
  const { assetsWithBalance } = useMultichainBalances();
  // TODO isTokenListLoading use Skeleton
  // TODO show selected asset first
  // TODO apply search query
  // TODO exclude src asset (pass list of skipped assetIds)
  return (
    <Column gap={0}>
      {assetsWithBalance
        .filter((token) => {
          return network
            ? token.chainId === network.chainId
            : networks.some(
                (networkOption) => networkOption.chainId === token.chainId,
              );
        })
        .map((token) => (
          <BridgeAsset
            key={token.assetId}
            asset={token}
            onClick={() => {
              // if (token.chainId !== network?.chainId) {
              //   onNetworkChange(token.chainId);
              // }
              onAssetChange(token);
            }}
            selected={asset?.assetId === token.assetId}
          />
        ))}
    </Column>
  );
};
