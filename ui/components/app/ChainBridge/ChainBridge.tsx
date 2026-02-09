import React from 'react';
import { useSelector } from 'react-redux';
import { type Hex } from '@metamask/utils';
import {
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { getImageForChainId } from '../../../selectors/multichain';

type ChainBridgeProps = {
  /**
   * The chain ID to display the network badge for.
   */
  chainId: string;
  /**
   * Optional size for the network badge avatar.
   *
   * @default AvatarNetworkSize.Xs
   */
  size?: AvatarNetworkSize;
  /**
   * The content to wrap with the chain badge.
   */
  children: React.ReactNode;
};

/**
 * A component that wraps children with a chain network badge.
 * It maps a chainId to the correct network name and image, rendering
 * a BadgeWrapper with an AvatarNetwork badge from @metamask/design-system-react.
 *
 * @param props - Component props.
 * @param props.chainId - The chain ID to display the network badge for.
 * @param props.size - Optional size for the network badge avatar.
 * @param props.children - The content to wrap with the chain badge.
 * @returns The rendered component.
 */
export const ChainBridge = ({
  chainId,
  size = AvatarNetworkSize.Xs,
  children,
}: ChainBridgeProps) => {
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
          hasBorder
        />
      }
    >
      {children}
    </BadgeWrapper>
  );
};
