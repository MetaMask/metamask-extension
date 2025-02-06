import React, { ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import { getChainIdsToPoll, getPreferences } from '../../../../selectors';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';
import useSortedFilteredTokens from '../hooks/useSortedFilteredTokens';
import useShouldShowFiat from '../hooks/useShouldShowFiat';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
  nativeToken?: ReactNode;
};

export type Token = {
  address: Hex;
  aggregators: string[];
  chainId: Hex;
  decimals: number;
  isNative: boolean;
  symbol: string;
  image: string;
};

export type TokenWithFiatAmount = Token & {
  tokenFiatAmount: number | null;
  balance?: string;
  string: string; // needed for backwards compatability TODO: fix this
};

export type AddressBalanceMapping = Record<Hex, Record<Hex, Hex>>;
export type ChainAddressMarketData = Record<
  Hex,
  Record<Hex, Record<string, string | number>>
>;

export default function TokenList({
  onTokenClick,
  nativeToken,
}: TokenListProps) {
  const { privacyMode } = useSelector(getPreferences);
  const chainIdsToPoll = useSelector(getChainIdsToPoll);

  // EVM specific tokenBalance polling, updates state via polling loop per chainId
  pollAndUpdateEvmBalances({
    chainIds: chainIdsToPoll as Hex[],
  });

  const sortedFilteredTokens = useSortedFilteredTokens();
  const shouldShowFiat = useShouldShowFiat();

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  // Displays nativeToken if provided
  if (nativeToken) {
    return React.cloneElement(nativeToken as React.ReactElement);
  }

  return (
    <div>
      {sortedFilteredTokens.map((tokenData) => (
        <TokenCell
          key={`${tokenData.chainId}-${tokenData.symbol}-${tokenData.address}`}
          chainId={tokenData.chainId}
          address={tokenData.address}
          symbol={tokenData.symbol}
          tokenFiatAmount={shouldShowFiat ? tokenData.tokenFiatAmount : null}
          image={tokenData?.image}
          isNative={tokenData.isNative}
          string={tokenData.string}
          privacyMode={privacyMode}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
