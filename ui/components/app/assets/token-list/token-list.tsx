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

function TokenList({ onTokenClick, nativeToken }: TokenListProps) {
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
      {sortedFilteredTokens.map((token) => (
        <TokenCell
          key={`${token.chainId}-${token.symbol}-${token.address}`}
          chainId={token.chainId}
          address={token.address}
          symbol={token.symbol}
          tokenFiatAmount={shouldShowFiat ? token.tokenFiatAmount : null}
          image={token?.image}
          isNative={token.isNative}
          string={token.string}
          privacyMode={privacyMode}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}

export default React.memo(TokenList);
