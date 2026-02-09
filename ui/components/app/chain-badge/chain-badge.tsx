import React from 'react';
import { useSelector } from 'react-redux';
import { type Hex } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
} from '@metamask/design-system-react';
import { getImageForChainId } from '../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';

type ChainBadgeProps = {
  chainId: string;
  size?: AvatarNetworkSize;
  children: React.ReactNode;
};

/**
 * A wrapper component that displays a network badge (AvatarNetwork) for a given
 * chain ID on top of its children. Internally resolves the chain's network name
 * and image from Redux state.
 *
 * @param props - Component props.
 * @param props.chainId - The chain ID to display the network badge for.
 * @param props.size - Optional size for the AvatarNetwork badge. Defaults to Xs.
 * @param props.children - The content to wrap with the network badge.
 * @returns A BadgeWrapper with an AvatarNetwork badge overlay.
 */
export const ChainBadge: React.FC<ChainBadgeProps> = ({
  chainId,
  size = AvatarNetworkSize.Xs,
  children,
}) => {
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const networkImage = getImageForChainId(chainId);
  const networkName = allNetworks?.[chainId as Hex]?.name ?? '';

  return (
    <BadgeWrapper
      badge={
        <AvatarNetwork size={size} name={networkName} src={networkImage} />
      }
    >
      {children}
    </BadgeWrapper>
  );
};
