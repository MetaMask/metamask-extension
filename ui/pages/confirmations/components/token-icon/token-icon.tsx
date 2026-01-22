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

export type TokenIconProps = {
  chainId: Hex;
  tokenAddress: Hex;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TokenIcon({ chainId, tokenAddress }: TokenIconProps) {
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
          size={AvatarNetworkSize.Xs}
          name={networkConfiguration?.name ?? ''}
          src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId]}
        />
      }
    >
      <AvatarToken
        size={AvatarTokenSize.Md}
        src={matchedToken?.image}
        name={matchedToken?.symbol}
        showHalo={false}
      />
    </BadgeWrapper>
  );
}
