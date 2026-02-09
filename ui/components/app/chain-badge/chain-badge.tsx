import React from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
} from '@metamask/design-system-react';
import { getImageForChainId } from '../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';

type ChainBadgeSize = 'xs' | 'sm' | 'md';

const AVATAR_NETWORK_SIZE_MAP: Record<ChainBadgeSize, AvatarNetworkSize> = {
  xs: AvatarNetworkSize.Xs,
  sm: AvatarNetworkSize.Sm,
  md: AvatarNetworkSize.Md,
};

type ChainBadgeProps = {
  /** The chain ID to display the network badge for */
  chainId: string;
  /** Size of the network badge avatar. Defaults to 'xs'. */
  size?: ChainBadgeSize;
  /** The content to wrap with the chain badge (e.g. AvatarToken) */
  children: React.ReactNode;
};

/**
 * ChainBadge wraps its children with a BadgeWrapper that displays
 * the network avatar for the given chainId.
 *
 * @param props - Component props
 * @param props.chainId - The chain ID used to resolve the network name and image
 * @param props.size - Size of the network badge avatar (defaults to 'xs')
 * @param props.children - Content to wrap with the badge
 * @returns The wrapped component with a chain network badge
 */
export const ChainBadge = ({ chainId, size = 'xs', children }: ChainBadgeProps) => {
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const networkName = allNetworks?.[chainId as Hex]?.name ?? '';
  const networkImageSrc = getImageForChainId(chainId) ?? undefined;

  return (
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={AVATAR_NETWORK_SIZE_MAP[size]}
          name={networkName}
          src={networkImageSrc}
        />
      }
    >
      {children}
    </BadgeWrapper>
  );
};
