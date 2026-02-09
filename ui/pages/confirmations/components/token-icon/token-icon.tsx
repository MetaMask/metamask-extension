import React, { useMemo } from 'react';
import type { Hex } from '@metamask/utils';
import {
  AvatarToken,
  AvatarTokenSize,
} from '../../../../components/component-library';
import { useSendTokens } from '../../hooks/send/useSendTokens';
import { ChainBridge } from '../../../../components/app/ChainBridge/ChainBridge';

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
    <ChainBridge chainId={chainId}>
      <AvatarToken
        size={TOKEN_ICON_SIZE_MAP[size]}
        src={matchedToken?.image}
        name={matchedToken?.symbol}
        showHalo={false}
      />
    </ChainBridge>
  );
}
