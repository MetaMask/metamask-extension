import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
} from '../../../../components/component-library';
import {
  selectNetworkConfigurationByChainId,
  type NetworkConfigurationsByChainIdState,
} from '../../../../../shared/lib/selectors/networks';
import { getAssetImageUrl } from '../../../../../shared/lib/asset-utils';
import { useSendTokens } from '../../hooks/send/useSendTokens';

export type TokenIconSize = 'xs' | 'sm' | 'md';

export type TokenIconProps = {
  chainId: Hex;
  tokenAddress: Hex;
  symbol?: string;
  size?: TokenIconSize;
};

const TOKEN_ICON_SIZE_MAP: Record<TokenIconSize, AvatarTokenSize> = {
  xs: AvatarTokenSize.Xs,
  sm: AvatarTokenSize.Sm,
  md: AvatarTokenSize.Md,
};

const NETWORK_BADGE_SIZE_MAP: Record<TokenIconSize, AvatarNetworkSize> = {
  xs: AvatarNetworkSize.Xs,
  sm: AvatarNetworkSize.Xs,
  md: AvatarNetworkSize.Xs,
};

const NETWORK_BADGE_STYLE_MAP: Record<TokenIconSize, React.CSSProperties> = {
  xs: { width: '10px', height: '10px', minWidth: '10px' },
  sm: {},
  md: {},
};

export function TokenIcon({
  chainId,
  tokenAddress,
  symbol: symbolProp,
  size = 'md',
}: TokenIconProps) {
  const sendTokens = useSendTokens({ includeNoBalance: true });

  const networkConfiguration = useSelector(
    (state: NetworkConfigurationsByChainIdState) =>
      selectNetworkConfigurationByChainId(state, chainId),
  );

  const matchedToken = useMemo(() => {
    return sendTokens.find(
      (token) =>
        token.address?.toLowerCase() === tokenAddress?.toLowerCase() &&
        token.chainId === chainId,
    );
  }, [tokenAddress, chainId, sendTokens]);

  const symbol = matchedToken?.symbol ?? symbolProp;
  // The token list / token API often omits the icon for some tokens (e.g. mUSD)
  // even though the canonical icon exists at the deterministic URL, so fall back
  // when the matched image is missing or empty.
  const src = matchedToken?.image || getTokenIconUrl(tokenAddress, chainId);

  return (
    <BadgeWrapper
      badge={
        <AvatarNetwork
          size={NETWORK_BADGE_SIZE_MAP[size]}
          name={networkConfiguration?.name ?? ''}
          src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId]}
          style={NETWORK_BADGE_STYLE_MAP[size]}
        />
      }
    >
      <AvatarToken
        size={TOKEN_ICON_SIZE_MAP[size]}
        src={src}
        name={symbol}
        showHalo={false}
      />
    </BadgeWrapper>
  );
}

function getTokenIconUrl(tokenAddress: Hex, chainId: Hex) {
  if (
    tokenAddress?.toLowerCase() === getNativeTokenAddress(chainId).toLowerCase()
  ) {
    return undefined;
  }

  return getAssetImageUrl(tokenAddress, chainId);
}
