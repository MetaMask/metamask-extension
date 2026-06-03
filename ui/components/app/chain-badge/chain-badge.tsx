import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
} from '@metamask/design-system-react';
import {
  CHAIN_IDS,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';
import { getImageForChainId } from '../../../selectors/multichain';

type ChainBadgeProps = {
  chainId: string;
  size?: AvatarNetworkSize;
  children: React.ReactNode;
};

// Ported from transaction-list-item
const getTestNetworkBackground = (chainId: string) => {
  if (chainId === CHAIN_IDS.SEPOLIA) {
    return { backgroundColor: 'var(--color-network-sepolia-default)' };
  }
  if (chainId === CHAIN_IDS.GOERLI) {
    return { backgroundColor: 'var(--color-network-goerli-default)' };
  }
  return {};
};

export const ChainBadge = ({
  chainId,
  size = AvatarNetworkSize.Xs,
  children,
}: ChainBadgeProps) => {
  const networkName =
    NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] || '?';
  const networkImageSrc = getImageForChainId(chainId) ?? undefined;

  return (
    <BadgeWrapper
      badge={
        <AvatarNetwork
          className="border-2 border-background-default rounded-md"
          style={getTestNetworkBackground(chainId)}
          size={size}
          name={networkName}
          src={networkImageSrc}
        />
      }
    >
      {children}
    </BadgeWrapper>
  );
};
