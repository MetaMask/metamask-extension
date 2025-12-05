import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type CaipChainId } from '@metamask/utils';
import { BridgeClientId } from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { BridgeToken } from '../../ducks/bridge/types';
import { toBridgeToken } from '../../ducks/bridge/utils';
import { type BridgeAppState } from '../../ducks/bridge/selectors';
import { getBridgeAssetsByAssetId } from '../../ducks/bridge/asset-selectors';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import { fetchTokensBySearchQuery } from '../../pages/bridge/utils/tokens';

/**
 * Returns a list of tokens from the bridge api that match the search query
 *
 * @param params
 * @param params.chainIds - enabled src/dest chainIds to return tokens for
 * @param params.accountAddress - the account address used for balances
 * @param params.searchQuery - the search query
 * @param params.assetsToInclude - the assets to show at the top of the search results
 */
export const useTokenSearchResults = ({
  searchQuery,
  accountAddress,
  chainIds,
  assetsToInclude,
}: {
  chainIds: Set<CaipChainId>;
  searchQuery: string;
  accountAddress: string;
  assetsToInclude: BridgeToken[];
}) => {
  const [accountGroup] = useSelector((state: BridgeAppState) =>
    getAccountGroupsByAddress(state, [accountAddress]),
  );
  const balanceByAssetId = useSelector((state: BridgeAppState) =>
    getBridgeAssetsByAssetId(state, accountGroup.id),
  );

  const abortControllerRef = useRef<AbortController>(new AbortController());

  const [isSearchResultsLoading, setIsSearchResultsLoading] = useState(false);
  const [searchResultsWithBalance, setSearchResultsWithBalance] = useState<
    BridgeToken[]
  >([]);
  /**
   * Whether there are more pages to fetch
   * This is set to false when all pages have been fetched
   * This doesn't change until the first batch of search results are available
   */
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [searchResultCursor, setSearchResultCursor] = useState<
    string | undefined
  >(undefined);

  const fetchSearchResults = useCallback(
    (
      query: string,
      filteredAssetsToInclude: BridgeToken[],
      cursor?: string,
    ) => {
      setIsSearchResultsLoading(true);
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      fetchTokensBySearchQuery({
        chainIds: Array.from(chainIds),
        assetsWithBalances: filteredAssetsToInclude,
        query,
        clientId: BridgeClientId.EXTENSION,
        signal: abortControllerRef.current?.signal,
        bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
        after: cursor,
      })
        ?.then(({ endCursor, tokens, hasNextPage }) => {
          setHasMoreResults(hasNextPage);
          setSearchResultsWithBalance((currentSearchResults) => [
            // Clear the list on initial fetch and if token data is not empty
            // If fetched data is empty, preserve the previous state
            ...(cursor || tokens.length === 0 ? currentSearchResults : []),
            ...tokens.map(toBridgeToken).map((token) => {
              const balanceData =
                balanceByAssetId?.[token.assetId] ??
                balanceByAssetId?.[
                  token.assetId.toLowerCase() as keyof typeof balanceByAssetId
                ];
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
          // Only update cursor if fetch succeeds
          // If fetching fails the failed page will be retried next time the callback runs
          setSearchResultCursor(endCursor);
        })
        .finally(() => {
          setIsSearchResultsLoading(false);
        });
    },
    [balanceByAssetId, chainIds, abortControllerRef],
  );

  const debouncedFetchSearchResults = useRef(
    debounce(
      (query: string, assets: BridgeToken[]) =>
        fetchSearchResults(query, assets),
      300,
    ),
  );

  const filteredAssetsToInclude = useMemo(() => {
    return assetsToInclude.filter((token) => {
      return (
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.assetId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery, assetsToInclude]);

  useEffect(() => {
    // Reset state on search query change
    abortControllerRef.current.abort();
    setSearchResultsWithBalance([]);
    setSearchResultCursor(undefined);
    setHasMoreResults(false);
    if (searchQuery.length > 0) {
      setIsSearchResultsLoading(true);
      setSearchResultsWithBalance(filteredAssetsToInclude.map(toBridgeToken));
      // Debounce the initial fetch until the user stops typing
      debouncedFetchSearchResults.current(searchQuery, filteredAssetsToInclude);
    }
  }, [searchQuery, filteredAssetsToInclude]);

  useEffect(() => {
    const debouncedFn = debouncedFetchSearchResults.current;
    return () => {
      abortControllerRef.current.abort();
      debouncedFn.cancel();
    };
  }, []);

  return {
    searchResults: searchResultsWithBalance,
    isSearchResultsLoading,
    onFetchMoreResults: (query: string) =>
      fetchSearchResults(query, filteredAssetsToInclude, searchResultCursor),
    hasMoreResults,
  };
};
