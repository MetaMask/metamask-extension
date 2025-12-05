import { useEffect, useMemo, useState } from 'react';
import { type CaipChainId } from '@metamask/utils';
import { BridgeClientId } from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import { uniqBy } from 'lodash';
import { useAsyncResult } from '../useAsync';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { BridgeToken } from '../../ducks/bridge/types';
import { toBridgeToken } from '../../ducks/bridge/utils';
import { type BridgeAppState } from '../../ducks/bridge/selectors';
import {
  getBridgeSortedAssets,
  getBridgeAssetsByAssetId,
} from '../../ducks/bridge/asset-selectors';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import {
  fetchPopularTokens,
  fetchTokensBySearchQuery,
} from '../../pages/bridge/utils/tokens';

/**
 * Returns a sorted token list from the bridge api
 * - matches search query
 * - tokens with highest to lowest balance in selected currency
 * - selected asset
 * - popularity
 * - all other tokens
 *
 * @param params
 * @param params.selectedAsset - the selected asset
 * @param params.chainId - the selected src/dest chainId
 * @param params.chainIds - enabled src/dest chainIds to return tokens for
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
  chainIds,
}: {
  selectedAsset: BridgeToken;
  chainId: CaipChainId | null;
  chainIds: Set<CaipChainId>;
  searchQuery?: string;
  accountAddress: string;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
}) => {
  const [accountGroup] = useSelector((state: BridgeAppState) =>
    getAccountGroupsByAddress(state, [accountAddress]),
  );

  const [isSearchResultsLoading, setIsSearchResultsLoading] = useState(false);
  const [searchResultsWithBalance, setSearchResultsWithBalance] = useState<
    BridgeToken[]
  >([]);

  const assetsWithBalance = useSelector((state: BridgeAppState) =>
    getBridgeSortedAssets(state, accountGroup.id),
  );

  const balanceByAssetId = useSelector((state: BridgeAppState) =>
    getBridgeAssetsByAssetId(state, accountGroup.id),
  );

  const assetsToInclude = useMemo(() => {
    return uniqBy(
      assetsWithBalance.concat(selectedAsset).filter((token) => {
        const matchesSearchQuery =
          searchQuery && searchQuery.length > 0
            ? token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
              token.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              token.assetId?.toLowerCase().includes(searchQuery.toLowerCase())
            : true;

        const matchesChainIdFilter = chainId
          ? token.chainId === chainId
          : chainIds.has(token.chainId);

        return matchesSearchQuery && matchesChainIdFilter;
      }),
      (a) => a.assetId?.toLowerCase(),
    );
  }, [searchQuery, chainId]);

  useEffect(() => {
    return () => {
      setIsSearchResultsLoading(false);
      abortControllerRef.current?.abort();
    };
  }, []);

  const { value: tokenList, pending: isTokenListLoading } =
    useAsyncResult(async () => {
      abortControllerRef.current?.abort();
      setSearchResultsWithBalance([]);
      abortControllerRef.current = new AbortController();
      const response = await fetchPopularTokens({
        chainIds: chainId ? [chainId] : Array.from(chainIds),
        assetsWithBalances: assetsToInclude,
        clientId: BridgeClientId.EXTENSION,
        signal: abortControllerRef.current?.signal,
        bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      });
      return response;
    }, [assetsToInclude]);

  const tokenListWithBalance = useMemo(() => {
    if (isTokenListLoading || tokenList?.length === 0) {
      return assetsToInclude.map(toBridgeToken);
    }
    return (
      tokenList?.map(toBridgeToken).map((token) => {
        const balanceData =
          balanceByAssetId?.[token.assetId] ?? // non-EVM assetIds are not lowercased
          balanceByAssetId?.[
            token.assetId.toLowerCase() as keyof typeof balanceByAssetId
          ];
        return {
          ...token,
          accountType: balanceData?.accountType,
          balance: balanceData?.balance,
          tokenFiatAmount: balanceData?.tokenFiatAmount,
        };
      }) ?? []
    );
  }, [isTokenListLoading, assetsToInclude, tokenList]);

  useEffect(() => {
    if (searchQuery && searchQuery.length > 0) {
      setIsSearchResultsLoading(true);
      abortControllerRef.current?.abort();
      setSearchResultsWithBalance([]);
      abortControllerRef.current = new AbortController();
      setSearchResultsWithBalance(assetsToInclude.map(toBridgeToken));

      const searchResults =
        fetchTokensBySearchQuery({
          chainIds: chainId ? [chainId] : Array.from(chainIds),
          assetsWithBalances: assetsToInclude,
          query: searchQuery,
          clientId: BridgeClientId.EXTENSION,
          signal: abortControllerRef.current?.signal,
          bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
        }) ?? [];
      (async () => {
        // TODO if search results are empty, we should jsut show balances
        // TODO if popular endpoint data is empty we shoudl use cached tokens as fallback
        let idx = 0; // TODO read this from api response
        for await (const tokens of searchResults) {
          setSearchResultsWithBalance((state) => [
            ...(idx === 0 ? [] : state),
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
