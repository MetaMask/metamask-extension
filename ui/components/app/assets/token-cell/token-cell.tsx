import React from 'react';
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
  const tokenDisplayInfo = useTokenDisplayInfo({
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

  return (
    <TokenListItem
      token={{ ...token, ...tokenDisplayInfo }}
      onClick={handleOnClick}
      showPercentage
      privacyMode={privacyMode}
    />
  );
}
