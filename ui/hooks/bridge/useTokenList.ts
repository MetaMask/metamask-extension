import { useEffect, useMemo, useState } from 'react';
import { handleFetch } from '@metamask/controller-utils';
import { type CaipChainId } from '@metamask/utils';
import {
  BridgeClientId,
  fetchPopularTokens,
  formatChainIdToCaip,
  fetchTokensBySearchQuery,
} from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import { uniqBy } from 'lodash';
import { useAsyncResult } from '../useAsync';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { BridgeToken } from '../../ducks/bridge/types';
import { toBridgeToken } from '../../ducks/bridge/utils';
import {
  BridgeAppState,
  getBridgeAssetsWithBalance,
  getFromChains,
} from '../../ducks/bridge/selectors';
import { useBalances } from '../../pages/bridge/hooks/useBalances';
import { MultichainAccountsState } from '../../selectors/multichain-accounts/account-tree.types';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';

/**
 * Returns a sorted token list from the bridge api
 * - matches search query
 * - tokens with highest to lowest balance in selected currency
 * - popularity
 * - all other tokens
 *
 * @param params
 * @param params.selectedAsset - the selected asset
 * @param params.chainId - the selected src/dest chainId
 * @param tokenToExclude - a token to exclude from the token list, usually the token being swapped from
 * @param params.accountAddress - the account address used for balances
 * @param params.searchQuery - the search query
 * @param params.abortControllerRef - the abort controller reference
 */
export const useTokenList = ({
  selectedAsset,
  chainId,
  searchQuery,
  accountAddress,
  abortControllerRef,
}: {
  selectedAsset: BridgeToken;
  chainId: CaipChainId | null;
  searchQuery?: string;
  accountAddress: string;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
}) => {
  const [accountGroup] = useSelector((state: BridgeAppState) =>
    getAccountGroupsByAddress(state, [accountAddress]),
  );
  const { assetsWithBalance, balanceByAssetId } = useSelector(
    (state: BridgeAppState) =>
      getBridgeAssetsWithBalance(state, accountGroup.id),
  );

  useEffect(() => {
    console.error('====assetsWithBalance', assetsWithBalance);
    console.error('====balanceByAssetId', balanceByAssetId);
  }, [assetsWithBalance, balanceByAssetId]);
  // console.log('====bridgeAssetsWithBalance', bridgeAssetsWithBalance);
  // console.log('====bridgeBalanceByAssetId', bridgeBalanceByAssetId);

  // TODO useEffect for both, set isTokenListLoading?
  // TODO debounce?
  const fromChains = useSelector(getFromChains);
  const [isSearchResultsLoading, setIsSearchResultsLoading] = useState(false);
  const [searchResultsWithBalance, setSearchResultsWithBalance] = useState<
    BridgeToken[]
  >([]);

  const memoizedBalances = assetsWithBalance
    .map(({ tokenFiatAmount }) => tokenFiatAmount)
    .toString();

  const assetsToInclude = useMemo(() => {
    console.error('====assetsToInclude', memoizedBalances, searchQuery);
    return uniqBy(
      [selectedAsset, ...assetsWithBalance]
        .filter((token) => {
          const matchesSearchQuery =
            searchQuery && searchQuery.length > 0
              ? token.symbol
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                token.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                token.assetId.toLowerCase().includes(searchQuery.toLowerCase())
              : true;

          const matchesChainIdFilter = chainId
            ? formatChainIdToCaip(token.chainId) === chainId
            : true;

          return matchesSearchQuery && matchesChainIdFilter;
        })
        .map((token) => ({
          symbol: token.symbol,
          assetId: token.assetId,
          decimals: token.decimals,
          name: token.name,
        })),
      'assetId',
    );
  }, [memoizedBalances, selectedAsset.assetId, chainId, searchQuery]);

  useEffect(() => {
    return () => {
      // debouncedFetchPopularTokens.cancel();
      // debouncedFetchTokensBySearchQuery.cancel();
      setIsSearchResultsLoading(false);
      abortControllerRef.current?.abort('=====closing token list');
    };
  }, []);

  const { value: tokenList, pending: isTokenListLoading } =
    useAsyncResult(async () => {
      if (searchQuery && searchQuery.length > 0) {
        return [];
      }
      console.error('====fetching popular list', assetsToInclude);
      abortControllerRef.current = new AbortController();
      const response = await fetchPopularTokens({
        chainIds: chainId
          ? [chainId]
          : fromChains.map((chain) => chain.chainId),
        assetsWithBalances: [...assetsToInclude],
        clientId: BridgeClientId.EXTENSION,
        signal: abortControllerRef.current?.signal,
        fetchFn: handleFetch,
        bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      });
      return response;
    }, [assetsToInclude]);

  const tokenListWithBalance = useMemo(() => {
    if (isTokenListLoading) {
      return assetsToInclude.map(toBridgeToken);
    }
    return (
      tokenList?.map(toBridgeToken).map((token) => {
        const balanceData = balanceByAssetId?.[token.assetId.toLowerCase()];
        return {
          ...token,
          accountType: balanceData?.accountType,
          balance: balanceData?.balance,
          tokenFiatAmount: balanceData?.tokenFiatAmount,
        };
      }) ?? []
    );
  }, [isTokenListLoading]);

  useEffect(() => {
    setSearchResultsWithBalance([]);
    abortControllerRef.current?.abort(
      '=====search query changed to ' + searchQuery,
    );
  }, [assetsToInclude]);

  useEffect(() => {
    if (searchQuery && searchQuery.length > 0) {
      setIsSearchResultsLoading(true);
      abortControllerRef.current = new AbortController();
      setSearchResultsWithBalance(assetsToInclude.map(toBridgeToken));

      const searchResults =
        fetchTokensBySearchQuery({
          chainIds: chainId
            ? [chainId]
            : fromChains.map((chain) => chain.chainId),
          assetsWithBalances: assetsToInclude,
          query: searchQuery,
          clientId: BridgeClientId.EXTENSION,
          signal: abortControllerRef.current?.signal,
          fetchFn: handleFetch,
          bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
        }) ?? [];
      (async () => {
        let idx = 0; // TODO read this from api response
        for await (const tokens of searchResults) {
          setSearchResultsWithBalance((state) => [
            ...(idx === 0 ? [] : state),
            ...tokens.map(toBridgeToken).map((token) => {
              const balanceData =
                balanceByAssetId?.[token.assetId.toLowerCase()];
              if (balanceData) {
                return {
                  ...token,
                  accountType: balanceData.accountType,
                  balance: balanceData.balance,
                  tokenFiatAmount: balanceData.tokenFiatAmount,
                };
              }
              return token;
            }),
          ]);
          idx += 1;
        }
        setIsSearchResultsLoading(false);
      })();
    }
  }, [assetsToInclude]);

  return {
    tokenList:
      searchQuery && searchQuery.length > 0
        ? searchResultsWithBalance
        : tokenListWithBalance,
    isLoading:
      searchQuery && searchQuery.length > 0
        ? isSearchResultsLoading
        : isTokenListLoading,
  };
};
