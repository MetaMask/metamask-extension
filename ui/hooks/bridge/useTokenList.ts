import { useMemo, useRef } from 'react';
import { handleFetch } from '@metamask/controller-utils';
import { type CaipChainId } from '@metamask/utils';
import {
  isBitcoinChainId,
  BridgeClientId,
  type BridgeAsset,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { useMultichainBalances } from '../useMultichainBalances';
import { useAsyncResult } from '../useAsync';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import {
  BridgeAssetV2Schema,
  type BridgeToken,
} from '../../ducks/bridge/types';
import { validate } from '@metamask/superstruct';

/**
 * Returns a sorted token list from the bridge api
 * - matches search query
 * - tokens with highest to lowest balance in selected currency
 * - popularity
 * - all other tokens
 *
 * @param chainId - the selected src/dest chainId
 * @param tokenToExclude - a token to exclude from the token list, usually the token being swapped from
 * @param tokenToExclude.symbol
 * @param tokenToExclude.address
 * @param tokenToExclude.chainId
 * @param accountAddress - the account address used for balances
 */
export const useTokenList = (
  chainId: CaipChainId,
  searchQuery?: string,
  accountAddress?: string,
  tokenToExclude?: BridgeToken, // TODO pass fromToken to toToken list
) => {
  // TODO pass src/dest address
  const { balanceByAssetId } = useMultichainBalances(accountAddress);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { value: tokenList, pending: isTokenListLoading } = useAsyncResult<
    BridgeAsset[]
  >(async () => {
    if (!chainId) {
      return [];
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // For Bitcoin chains, we only support native asset
    if (isBitcoinChainId(chainId)) {
      return [getNativeAssetForChainId(chainId)];
    }
    const defaultAssets: BridgeToken[] = Object.values(balanceByAssetId);
    if (tokenToExclude) {
      defaultAssets.push({
        assetId: tokenToExclude.assetId,
        symbol: tokenToExclude.symbol,
        image: tokenToExclude.image,
        decimals: tokenToExclude.decimals,
        name: tokenToExclude.name,
        chainId: tokenToExclude.chainId,
      });
    }
    // if (searchQuery && searchQuery.length > 0) {
    //   const response = await handleFetch(
    //     `${BRIDGE_API_BASE_URL}/getTokens/search`,
    //     {
    //       method: 'POST',
    //       headers: {
    //         'X-Client-Id': BridgeClientId.EXTENSION,
    //       },
    //       signal: abortControllerRef.current?.signal,
    //       body: JSON.stringify({
    //         chainIds: [chainId],
    //         includeAssets: defaultAssets,
    //         query: searchQuery,
    //         // after: endCursor,
    //       }),
    //     },
    //   );
    //   const {
    //     data,
    //     pageInfo: { endCursor, hasNextPage },
    //   } = await response;
    //   return data;
    // }

    const response = await handleFetch(
      `${BRIDGE_API_BASE_URL}/getTokens/popular`,
      {
        method: 'POST',
        headers: {
          'X-Client-Id': BridgeClientId.EXTENSION,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current?.signal,
        body: JSON.stringify({
          chainIds: [chainId],
          includeAssets: defaultAssets,
        }),
      },
    );
    return response;
  }, [chainId, searchQuery]);

  const tokenListWithBalance = useMemo(() => {
    const filteredList = [];
    for (const token of tokenList ?? []) {
      if (validate(token, BridgeAssetV2Schema)) {
        if (token.assetId === tokenToExclude?.assetId) {
          continue;
        }
        if (balanceByAssetId?.[token.assetId]) {
          filteredList.push({
            ...token,
            balance: balanceByAssetId[token.assetId.toLowerCase()].balance,
            tokenFiatAmount:
              balanceByAssetId[token.assetId.toLowerCase()].tokenFiatAmount,
            accountType:
              balanceByAssetId[token.assetId.toLowerCase()].accountType,
          });
        } else {
          filteredList.push(token);
        }
      }
    }
    return filteredList;
  }, [balanceByAssetId, chainId, tokenList, tokenToExclude]);

  return {
    tokenList: tokenListWithBalance,
    isLoading: isTokenListLoading,
  };
};
