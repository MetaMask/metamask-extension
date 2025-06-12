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
import {
  getImageForChainId,
  getMultichainIsEvm,
} from '../../../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';

type AssetCellBadgeProps = {
  chainId: `0x${string}` | `${string}:${string}`;
  isNative?: boolean;
  tokenImage: string;
  symbol: string;
};

export const AssetCellBadge = React.memo(
  ({ chainId, isNative, tokenImage, symbol }: AssetCellBadgeProps) => {
    const isEvm = useSelector(getMultichainIsEvm);
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
            backgroundColor={BackgroundColor.backgroundMuted}
            borderWidth={2}
          />
        }
        marginRight={4}
        style={{ alignSelf: 'center' }}
      >
        <AvatarToken
          name={symbol}
          backgroundColor={BackgroundColor.backgroundMuted}
          src={avatarTokenSrc}
        />
      </BadgeWrapper>
    );
  },
  (prevProps, nextProps) => prevProps.chainId === nextProps.chainId,
);
