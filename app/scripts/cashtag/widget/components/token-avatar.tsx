import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
} from '@metamask/design-system-react';
import { getChainImageUrl } from '../../lib/helpers';
import type { AssetData } from '../../lib/types';

type Props = {
  asset: AssetData;
  size?: 'sm' | 'lg';
};

const tokenSize = {
  sm: AvatarTokenSize.Md,
  lg: AvatarTokenSize.Xl, // 48px
} as const;

export function TokenAvatar({ asset, size = 'sm' }: Props) {
  const chainSrc = getChainImageUrl(asset.chainId);
  const networkName = asset.chainId ?? asset.ticker;

  return (
    <BadgeWrapper
      // DS default includes `self-start`, which beats parent `items-center`.
      className="shrink-0 self-center"
      badge={
        chainSrc ? (
          <AvatarNetwork
            name={networkName}
            src={chainSrc}
            size={AvatarNetworkSize.Xs}
            className="h-4 w-4 min-w-4 rounded-md border-2 border-background-default bg-background-default"
          />
        ) : null
      }
    >
      <AvatarToken
        name={asset.ticker}
        src={asset.iconUrl ?? undefined}
        size={tokenSize[size]}
      />
    </BadgeWrapper>
  );
}
