import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
} from '../../../../components/component-library';
import { selectNetworkConfigurationByChainId } from '../../../../selectors';
import { useSendTokens } from '../../hooks/send/useSendTokens';

export type TokenIconSize = 'sm' | 'md';

export type TokenIconProps = {
  chainId: Hex;
  tokenAddress: Hex;
  size?: TokenIconSize;
};

const TOKEN_ICON_SIZE_MAP: Record<TokenIconSize, AvatarTokenSize> = {
  sm: AvatarTokenSize.Sm,
  md: AvatarTokenSize.Md,
};

const NETWORK_BADGE_SIZE_MAP: Record<TokenIconSize, AvatarNetworkSize> = {
  sm: AvatarNetworkSize.Xs,
  md: AvatarNetworkSize.Xs,
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TokenIcon({
  chainId,
  tokenAddress,
  size = 'md',
}: TokenIconProps) {
  const sendTokens = useSendTokens({ includeNoBalance: true });

  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const matchedToken = useMemo(() => {
    return sendTokens.find(
      (token) =>
        token.address?.toLowerCase() === tokenAddress?.toLowerCase() &&
        token.chainId === chainId,
    );
  }, [tokenAddress, chainId, sendTokens]);

  return (
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={NETWORK_BADGE_SIZE_MAP[size]}
          name={networkConfiguration?.name ?? ''}
          src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId]}
        />
      }
    >
      <AvatarToken
        size={TOKEN_ICON_SIZE_MAP[size]}
        src={matchedToken?.image}
        name={matchedToken?.symbol}
        showHalo={false}
      />
    </BadgeWrapper>
  );
}
