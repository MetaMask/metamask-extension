import React from 'react';
import useTokenDisplayInfo from '../hooks/useTokenDisplayInfo';
import { TokenWithFiatAmount } from '../types';
import { TokenCellGroup } from './token-cell-group';

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
    <TokenCellGroup
      token={{ ...token, ...tokenDisplayInfo }}
      onClick={handleOnClick}
      privacyMode={privacyMode}
    />
  );
}
