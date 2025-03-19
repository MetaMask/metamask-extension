import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import {
  getChainIdsToPoll,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
} from '../../../../selectors';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';
import { useNetworkFilter } from '../hooks';
import { TokenWithFiatAmount } from '../types';
import { filterAssets } from '../util/filter';
import { sortAssets } from '../util/sort';
import useMultiChainAssets from '../hooks/useMultichainAssets';
import {
  getMultichainIsEvm,
  getMultichainNetwork,
} from '../../../../selectors/multichain';
import { getTokenBalancesEvm } from '../../../../selectors/assets';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
};

function TokenList({ onTokenClick }: TokenListProps) {
  const isEvm = useSelector(getMultichainIsEvm);
  const chainIdsToPoll = useSelector(getChainIdsToPoll);
  const newTokensImported = useSelector(getNewTokensImported);
  const currentNetwork = useSelector(getMultichainNetwork);
  const { tokenSortConfig, privacyMode } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount.address),
  );
  // EVM specific tokenBalance polling, updates state via polling loop per chainId
  pollAndUpdateEvmBalances({
    chainIds: chainIdsToPoll as Hex[],
  });

  const multichainAssets = useMultiChainAssets();

  // network filter to determine which tokens to show in list
  // on EVM we want to filter based on network filter controls, on non-evm we only want tokens from that chain identifier
  const { networkFilter } = useNetworkFilter();

  const sortedFilteredTokens = useMemo(() => {
    const balances = isEvm ? evmBalances : multichainAssets;
    const filteredAssets = filterAssets(balances as TokenWithFiatAmount[], [
      {
        key: 'chainId',
        opts: isEvm ? networkFilter : { [currentNetwork.chainId]: true },
        filterCallback: 'inclusive',
      },
    ]);

    // sort filtered tokens based on the tokenSortConfig in state
    return sortAssets([...filteredAssets], tokenSortConfig);
  }, [
    tokenSortConfig,
    networkFilter,
    currentNetwork,
    selectedAccount,
    newTokensImported,
    evmBalances,
    multichainAssets,
  ]);

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
          onClick={onTokenClick}
        />
      ))}
    </>
  );
}

export default React.memo(TokenList);
