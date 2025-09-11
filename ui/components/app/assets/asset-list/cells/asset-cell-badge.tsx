import React from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
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
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';

type AssetCellBadgeProps = {
  chainId: `0x${string}` | `${string}:${string}`;
  isNative?: boolean;
  tokenImage: string;
  symbol: string;
};

export const AssetCellBadge = React.memo(
  ({ chainId, isNative, tokenImage, symbol }: AssetCellBadgeProps) => {
    const isEvm = isEvmChainId(chainId);
    const allNetworks = useSelector(getNetworkConfigurationsByChainId);

    const avatarTokenSrc =
      isEvm && isNative ? getNativeCurrencyForChain(chainId) : tokenImage;
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
