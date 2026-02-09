import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
} from '@metamask/design-system-react';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { getImageForChainId } from '../../../selectors/multichain';

type ChainBadgeProps = {
  chainId: string;
  size?: AvatarNetworkSize;
  children: React.ReactNode;
};

export const ChainBadge = ({
  chainId,
  size = AvatarNetworkSize.Xs,
  children,
}: ChainBadgeProps) => {
  const networkName =
    NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ?? '';
  const networkImageSrc = getImageForChainId(chainId) ?? undefined;

  return (
    <BadgeWrapper
      badge={
        <AvatarNetwork
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
