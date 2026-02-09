import React, { useMemo } from 'react';
import type { Hex } from '@metamask/utils';
import { AvatarNetworkSize } from '@metamask/design-system-react';
import {
  AvatarToken,
  AvatarTokenSize,
} from '../../../../components/component-library';
import { useSendTokens } from '../../hooks/send/useSendTokens';
import { ChainBadge } from '../../../../components/app/chain-badge/chain-badge';

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

  const matchedToken = useMemo(() => {
    return sendTokens.find(
      (token) =>
        token.address?.toLowerCase() === tokenAddress?.toLowerCase() &&
        token.chainId === chainId,
    );
  }, [tokenAddress, chainId, sendTokens]);

  return (
    <ChainBadge chainId={chainId} size={NETWORK_BADGE_SIZE_MAP[size]}>
      <AvatarToken
        size={TOKEN_ICON_SIZE_MAP[size]}
        src={matchedToken?.image}
        name={matchedToken?.symbol}
        showHalo={false}
      />
    </ChainBadge>
  );
}
