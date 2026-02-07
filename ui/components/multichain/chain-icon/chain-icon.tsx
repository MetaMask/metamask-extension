import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import { getImageForChainId } from '../../../selectors/multichain';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';

type ChainIconProps = {
  chainId: string;
  size?: AvatarNetworkSize;
  className?: string;
};

export const ChainIcon = ({
  chainId,
  size = AvatarNetworkSize.Xs,
  className = 'rounded-full',
}: ChainIconProps) => {
  const src = getImageForChainId(chainId);
  const name = NETWORK_TO_NAME_MAP[chainId] ?? '';

  return (
    <AvatarNetwork name={name} src={src} size={size} className={className} />
  );
};
