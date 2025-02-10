import React from 'react';
import useTokenDisplayInfo from '../hooks/useTokenDisplayInfo';
import { TokenWithFiatAmount } from '../types';
import { TokenCellListItem } from './token-cell-list-item';

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
    <TokenCellListItem
      token={{ ...token, ...tokenDisplayInfo }}
      onClick={handleOnClick}
      showPercentage
      privacyMode={privacyMode}
    />
  );
}
