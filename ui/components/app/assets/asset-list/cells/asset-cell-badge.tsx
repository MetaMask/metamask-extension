import React from 'react';
import { CaipAssetType, Hex } from '@metamask/utils';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { AvatarToken } from '../../../../component-library';
import { getNativeCurrencyForChain } from '../../../../../selectors';
import {
  getAssetImageUrl,
  isEvmChainId,
} from '../../../../../../shared/lib/asset-utils';
import { ChainBadge } from '../../../chain-badge/chain-badge';

type AssetCellBadgeProps = {
  chainId: `0x${string}` | `${string}:${string}`;
  isNative?: boolean;
  tokenImage: string;
  symbol: string;
  assetId?: CaipAssetType | Hex;
};

export const getAvatarTokenSrc = (
  opts: Pick<
    AssetCellBadgeProps,
    'chainId' | 'isNative' | 'tokenImage' | 'assetId'
  >,
): string => {
  try {
    const isEvm = isEvmChainId(opts.chainId);
    if (isEvm && opts.isNative) {
      return getNativeCurrencyForChain(opts.chainId);
    }

    if (!opts.tokenImage && opts.assetId && !opts.isNative) {
      return getAssetImageUrl(opts.assetId, opts.chainId) ?? '';
    }

    return opts.tokenImage;
  } catch (error) {
    console.error('getAvatarTokenSrc - failed to get avatar token src', error);
  }

  return opts.tokenImage;
};

export const AssetCellBadge = React.memo(
  ({ chainId, isNative, tokenImage, symbol, assetId }: AssetCellBadgeProps) => {
    const avatarTokenSrc = getAvatarTokenSrc({
      chainId,
      isNative,
      tokenImage,
      assetId,
    });

    return (
      <ChainBadge
        chainId={chainId}
        style={{ alignSelf: 'center', marginRight: 16 }}
      >
        <AvatarToken
          name={symbol}
          backgroundColor={BackgroundColor.backgroundSection}
          src={avatarTokenSrc}
        />
      </ChainBadge>
    );
  },
  (prevProps, nextProps) => prevProps.chainId === nextProps.chainId,
);
