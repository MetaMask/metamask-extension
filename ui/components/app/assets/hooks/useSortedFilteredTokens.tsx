import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
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
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../../../hooks/useTokenBalances';
import { TokenWithFiatAmount } from '../types';
import { useNetworkFilter } from '.';

export function useSortedFilteredTokens(): {
  tokens: TokenWithFiatAmount[];
} {
  const chainIdsToPoll = useSelector(getChainIdsToPoll);
  // EVM specific tokenBalance polling, updates state via polling loop per chainId
  pollAndUpdateEvmBalances({
    chainIds: chainIdsToPoll as Hex[],
  });

  const isEvm = useSelector(getMultichainIsEvm);

  // newTokensImported included in deps, but not in hook's logic
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const balances = isEvm ? evmBalances : multichainAssets;
  const filteredAssets = filterAssets(balances as TokenWithFiatAmount[], [
    {
      key: 'chainId',
      opts: isEvm ? networkFilter : { [currentNetwork.chainId]: true },
      filterCallback: 'inclusive',
    },
  ]);

  // sort filtered tokens based on the tokenSortConfig in state
  const sortedFilteredTokens = sortAssets([...filteredAssets], tokenSortConfig);

  return { tokens: sortedFilteredTokens };
}
