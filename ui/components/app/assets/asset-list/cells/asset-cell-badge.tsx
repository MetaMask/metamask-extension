import React from 'react';
import { useSelector } from 'react-redux';
import { CaipAssetType, Hex } from '@metamask/utils';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
} from '../../../../component-library';
import { getNativeCurrencyForChain } from '../../../../../selectors';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import {
  getAssetImageUrl,
  isEvmChainId,
} from '../../../../../../shared/lib/asset-utils';

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
    const allNetworks = useSelector(getNetworkConfigurationsByChainId);

    const avatarTokenSrc = getAvatarTokenSrc({
      chainId,
      isNative,
      tokenImage,
      assetId,
    });
    const badgeWrapperSrc = getImageForChainId(chainId) ?? undefined;

    return (
      <BadgeWrapper
        badge={
          <AvatarNetwork
            size={AvatarNetworkSize.Xs}
            name={allNetworks?.[chainId as Hex]?.name}
            src={badgeWrapperSrc}
            backgroundColor={BackgroundColor.backgroundSection}
            borderWidth={2}
          />
        }
        marginRight={4}
        style={{ alignSelf: 'center' }}
      >
        <AvatarToken
          name={symbol}
          backgroundColor={BackgroundColor.backgroundSection}
          src={avatarTokenSrc}
        />
      </BadgeWrapper>
    );
  },
  (prevProps, nextProps) => prevProps.chainId === nextProps.chainId,
);
