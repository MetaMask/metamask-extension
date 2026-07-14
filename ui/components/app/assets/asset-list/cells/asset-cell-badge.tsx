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
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/lib/selectors/networks';
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
  networkBadgeTestId?: string;
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

    // Fall back to the static asset image whenever the token image is empty.
    // This also covers non-EVM native assets (e.g. SOL) whose iconUrl can be
    // transiently empty after a send, which previously left the logo blank.
    if (!opts.tokenImage && opts.assetId) {
      return getAssetImageUrl(opts.assetId, opts.chainId) ?? '';
    }

    return opts.tokenImage;
  } catch (error) {
    console.error('getAvatarTokenSrc - failed to get avatar token src', error);
  }

  return opts.tokenImage;
};

export const AssetCellBadge = React.memo(
  ({
    chainId,
    isNative,
    tokenImage,
    symbol,
    assetId,
    networkBadgeTestId,
  }: AssetCellBadgeProps) => {
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
        badgeContainerProps={{
          'data-testid': networkBadgeTestId,
        }}
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
  (prevProps, nextProps) =>
    prevProps.chainId === nextProps.chainId &&
    prevProps.isNative === nextProps.isNative &&
    prevProps.tokenImage === nextProps.tokenImage &&
    prevProps.symbol === nextProps.symbol &&
    prevProps.assetId === nextProps.assetId &&
    prevProps.networkBadgeTestId === nextProps.networkBadgeTestId,
);
