import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { sortAssets } from '../util/sort';
import { filterAssets } from '../util/filter';
import {
  getCurrentNetwork,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
  getTokenBalancesEvm,
  getTokenExchangeRates,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { TokenWithFiatAmount } from '../types';
import useNetworkFilter from './useNetworkFilter';

const useSortedFilteredTokens = () => {
  const currentNetwork = useSelector(getCurrentNetwork);
  const { tokenSortConfig } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const newTokensImported = useSelector(getNewTokensImported);
  const evmBalances = useSelector(getTokenBalancesEvm); // TODO: Make this chain agnostic

  // network filter to determine which tokens to show in list
  const { networkFilter } = useNetworkFilter();

  return useMemo(() => {
    const filteredAssets = filterAssets(evmBalances, [
      {
        key: 'chainId',
        opts: networkFilter,
        filterCallback: 'inclusive',
      },
    ]);

    const { nativeTokens, nonNativeTokens } = filteredAssets.reduce<{
      nativeTokens: TokenWithFiatAmount[];
      nonNativeTokens: TokenWithFiatAmount[];
    }>(
      (acc, token) => {
        if (token.isNative) {
          acc.nativeTokens.push(token);
        } else {
          acc.nonNativeTokens.push(token);
        }
        return acc;
      },
      { nativeTokens: [], nonNativeTokens: [] },
    );

    const assets = [...nativeTokens, ...nonNativeTokens];
    return sortAssets(assets, tokenSortConfig);
  }, [
    tokenSortConfig,
    networkFilter,
    conversionRate,
    contractExchangeRates,
    currentNetwork,
    selectedAccount,
    newTokensImported,
    evmBalances,
  ]);
};

export default useSortedFilteredTokens;
