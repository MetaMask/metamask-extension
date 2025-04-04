import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import { getChainIdsToPoll, getPreferences } from '../../../../selectors';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';

import { TokenWithFiatAmount } from '../types';

import { useSortedFilteredTokens } from '../hooks/useSortedFilteredTokens';

function TokenList() {
  const chainIdsToPoll = useSelector(getChainIdsToPoll);
  const { privacyMode } = useSelector(getPreferences);

  // EVM specific tokenBalance polling, updates state via polling loop per chainId
  pollAndUpdateEvmBalances({
    chainIds: chainIdsToPoll as Hex[],
  });

  const { tokens: sortedFilteredTokens } = useSortedFilteredTokens();

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  return (
    <>
      {sortedFilteredTokens.map((token: TokenWithFiatAmount) => (
        <TokenCell
          key={`${token.chainId}-${token.symbol}-${token.address}`}
          token={token}
          privacyMode={privacyMode}
        />
      ))}
    </>
  );
}

export default React.memo(TokenList);
