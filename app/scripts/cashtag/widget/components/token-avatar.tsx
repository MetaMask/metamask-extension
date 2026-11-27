import React from 'react';
import { AvatarTokenSize } from '@metamask/design-system-react';
import { TokenAvatar as BaseTokenAvatar } from '#shared/components/token-avatar';
import { getChainImageUrl } from '../../lib/helpers';
import type { AssetData } from '../../lib/types';

type Props = Readonly<{
  asset: AssetData;
  size?: 'sm' | 'lg';
}>;

const tokenSize = {
  sm: AvatarTokenSize.Md,
  lg: AvatarTokenSize.Xl, // 48px
} as const;

export function TokenAvatar({ asset, size = 'sm' }: Props) {
  const chainSrc = getChainImageUrl(asset.chainId);

  return (
    <BaseTokenAvatar
      className="shrink-0 self-center"
      name={asset.ticker}
      src={asset.iconUrl ?? undefined}
      size={tokenSize[size]}
      network={
        chainSrc
          ? {
              name: asset.chainId ?? asset.ticker,
              src: chainSrc,
              hasBorder: true,
            }
          : undefined
      }
    />
  );
}
