import React, { ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import { getChainIdsToPoll, getPreferences } from '../../../../selectors';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';
import useSortedFilteredTokens from '../hooks/useSortedFilteredTokens';
import { TokenWithFiatAmount } from '../types';
// import { useNativeTokenBalance } from '../asset-list/native-token/use-native-token-balance';
// import {
//   getMultichainIsEvm,
//   getMultichainSelectedAccountCachedBalance,
// } from '../../../../selectors/multichain';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
  // nativeToken?: ReactNode;
};

export default function TokenList({
  onTokenClick,
}: // nativeToken,
TokenListProps) {
  const { privacyMode } = useSelector(getPreferences);
  const chainIdsToPoll = useSelector(getChainIdsToPoll);

  // const isEvm = useSelector(getMultichainIsEvm);
  // const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  // const balanceIsLoading = !balance;
  // const nativeTokenData = useNativeTokenBalance(); // TODO: Validate this is still required with new MultichainControllers

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

  // Displays nativeToken if provided
  // if (!isEvm && !balanceIsLoading) {
  //   return React.cloneElement(nativeToken as React.ReactElement);
  //   // return (
  //   //   <TokenCell
  //   //     token={{
  //   //       ...nativeToken,
  //   //       // ...tokenDisplayInfo,
  //   //       // secondary: token.secondary,
  //   //       // isStakeable,
  //   //     }}
  //   //   />
  //   // );
  // }

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
