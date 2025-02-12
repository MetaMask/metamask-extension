import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import { getChainIdsToPoll, getPreferences } from '../../../../selectors';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';
import useSortedFilteredTokens from '../hooks/useSortedFilteredTokens';
import { TokenWithFiatAmount } from '../types';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
};

export default function TokenList({ onTokenClick }: TokenListProps) {
  const { privacyMode } = useSelector(getPreferences);
  const chainIdsToPoll = useSelector(getChainIdsToPoll);

  // EVM specific tokenBalance polling, updates state via polling loop per chainId
  pollAndUpdateEvmBalances({
    chainIds: chainIdsToPoll as Hex[],
  });

  const sortedFilteredTokens = useSortedFilteredTokens();
  console.log('sortedFilteredTokens', sortedFilteredTokens);

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  return (
    <div>
      {sortedFilteredTokens.map((token: TokenWithFiatAmount) => (
        <TokenCell
          key={`${token.chainId}-${token.symbol}-${token.address}`}
          token={token}
          privacyMode={privacyMode}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
