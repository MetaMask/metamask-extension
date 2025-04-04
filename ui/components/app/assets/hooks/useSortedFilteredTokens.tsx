import { useSelector } from 'react-redux';
import {
  getChainIdsToPoll,
  getNewTokensImported,
  getTokenSortConfig,
  getSelectedAccount,
} from '../../../../selectors';
import {
  getTokenBalancesEvm,
  getMultiChainAssets,
} from '../../../../selectors/assets';
import {
  getMultichainIsEvm,
  getMultichainNetwork,
} from '../../../../selectors/multichain';
import { filterAssets } from '../util/filter';
import { sortAssets } from '../util/sort';
import { useNetworkFilter } from '../hooks';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';
import { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { TokenWithFiatAmount } from '../types';

export function useSortedFilteredTokens() {
  const chainIdsToPoll = useSelector(getChainIdsToPoll);
  // EVM specific tokenBalance polling, updates state via polling loop per chainId
  pollAndUpdateEvmBalances({
    chainIds: chainIdsToPoll as Hex[],
  });

  const isEvm = useSelector(getMultichainIsEvm);

  const newTokensImported = useSelector(getNewTokensImported);
  const currentNetwork = useSelector(getMultichainNetwork);
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedAccount = useSelector(getSelectedAccount);
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount.address),
  );
  const multichainAssets = useSelector(getMultiChainAssets);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEvm,
    evmBalances,
    multichainAssets,
    networkFilter,
    currentNetwork.chainId,
    tokenSortConfig,
    // newTokensImported included in deps, but not in hook's logic
    newTokensImported,
  ]);

  return { tokens: sortedFilteredTokens };
}
