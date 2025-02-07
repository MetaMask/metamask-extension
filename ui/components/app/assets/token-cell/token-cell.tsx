import React from 'react';
import { getNativeCurrencyForChain } from '../../../../selectors';
import { getImageForChainId } from '../../../../selectors/multichain';
import { TokenListItem } from '../../../multichain';
import { TokenWithFiatAmount } from '../types';
import useTokenDisplayInfo from '../hooks/useTokenDisplayInfo';

type TokenCellProps = {
  token: TokenWithFiatAmount;
  privacyMode?: boolean;
  onClick?: (chainId: string, address: string) => void;
};

export default function TokenCell({
  token,
  privacyMode = false,
  onClick,
}: TokenCellProps) {
  const { title, tokenImage, primary, secondary, isStakeable } =
    useTokenDisplayInfo({
      token,
    });

  function handleOnClick() {
    if (!onClick || !token.chainId) {
      return;
    }
    onClick(token.chainId, token.address);
  }

  if (!token.chainId) {
    return null;
  }

  const tokenChainImage = getImageForChainId(token.chainId);

  return (
    <TokenListItem
      onClick={handleOnClick}
      tokenSymbol={token.symbol}
      tokenImage={
        token.isNative ? getNativeCurrencyForChain(token.chainId) : tokenImage
      }
      tokenChainImage={tokenChainImage || undefined}
      primary={primary}
      secondary={secondary}
      title={title}
      address={token.address}
      isStakeable={isStakeable}
      showPercentage
      privacyMode={privacyMode}
      isNativeCurrency={token.isNative}
      chainId={token.chainId}
    />
  );
}
