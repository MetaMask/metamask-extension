import React from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
} from '@metamask/design-system-react';
import type { BadgeWrapperProps } from '@metamask/design-system-react';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { getImageForChainId } from '../../../selectors/multichain';

type ChainBadgeProps = {
  /**
   * The chain ID to display as a badge.
   * Used to look up the network name and image.
   */
  chainId: string;
  /**
   * Optional size for the network avatar badge.
   *
   * @default AvatarNetworkSize.Xs
   */
  size?: AvatarNetworkSize;
  /**
   * The element that the badge will attach itself to.
   */
  children: React.ReactNode;
} & Omit<BadgeWrapperProps, 'badge' | 'children'>;

/**
 * A reusable component that wraps children with a network badge (AvatarNetwork)
 * indicating the chain. It automatically resolves the chain ID to the correct
 * network name and image.
 *
 * @param props - Component props.
 * @param props.chainId - The chain ID to display.
 * @param props.size - Optional size for the AvatarNetwork badge.
 * @param props.children - The element to wrap with the badge.
 * @returns The rendered ChainBadge component.
 */
export const ChainBadge: React.FC<ChainBadgeProps> = ({
  chainId,
  size = AvatarNetworkSize.Xs,
  children,
  ...badgeWrapperProps
}) => {
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const networkName = allNetworks?.[chainId as Hex]?.name ?? '';
  const networkImageUrl = getImageForChainId(chainId);

  return (
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={size}
          name={networkName}
          src={networkImageUrl}
        />
      }
      {...badgeWrapperProps}
    >
      {children}
    </BadgeWrapper>
  );
};
