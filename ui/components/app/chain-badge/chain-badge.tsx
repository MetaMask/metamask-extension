import React, { type ReactNode } from 'react';
import type { Hex } from 'viem';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
} from '@metamask/design-system-react';
import type { CaipChainId } from '@metamask/utils';
import {
  CHAIN_IDS,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';
import { MULTICHAIN_NETWORK_TO_NICKNAME } from '../../../../shared/constants/multichain/networks';
import { getImageForChainId } from '../../../selectors/multichain';
import { getMaybeHexChainId } from '../../../ducks/bridge/utils';

type Props = {
  chainId: CaipChainId | Hex | undefined;
  size?: AvatarNetworkSize;
  children: ReactNode;
};

// Ported from transaction-list-item
const getTestNetworkBackground = (hexChainId?: string) => {
  if (hexChainId === CHAIN_IDS.SEPOLIA) {
    return { backgroundColor: 'var(--color-network-sepolia-default)' };
  }
  if (hexChainId === CHAIN_IDS.GOERLI) {
    return { backgroundColor: 'var(--color-network-goerli-default)' };
  }
  return {};
};

export const ChainBadge = ({
  chainId,
  size = AvatarNetworkSize.Xs,
  children,
}: Props) => {
  if (!chainId) {
    return <>{children}</>;
  }

  const hexChainId = getMaybeHexChainId(chainId);

  const networkName =
    (hexChainId
      ? NETWORK_TO_NAME_MAP[hexChainId as keyof typeof NETWORK_TO_NAME_MAP]
      : MULTICHAIN_NETWORK_TO_NICKNAME[chainId as CaipChainId]) ?? '?';

  const networkImageSrc =
    getImageForChainId(hexChainId ?? chainId) ?? undefined;

  return (
    <BadgeWrapper
      badge={
        <AvatarNetwork
          className="border-2 border-background-default rounded-md"
          style={getTestNetworkBackground(hexChainId)}
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
