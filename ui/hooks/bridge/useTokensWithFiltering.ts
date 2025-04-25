import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ChainId } from '@metamask/controller-utils';
import { type CaipChainId, type Hex } from '@metamask/utils';
import {
  isSolanaChainId,
  formatChainIdToCaip,
  formatChainIdToHex,
  type BridgeToken,
  isNativeAddress,
  fetchBridgeTokens,
  BridgeClientId,
  type BridgeAsset,
} from '@metamask/bridge-controller';
import { AssetType } from '../../../shared/constants/transaction';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { useAsyncResult } from '../useAsync';
import { fetchTopAssetsList } from '../../pages/swaps/swaps.util';
import {
  type BridgeAppState,
  getTopAssetsFromFeatureFlags,
} from '../../ducks/bridge/selectors';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import type {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';

type FilterPredicate = (
  symbol: string,
  address?: string,
  tokenChainId?: string,
) => boolean;

/**
 * Returns a token list generator that filters and sorts tokens in this order
 * - matches search query
 * - tokens with highest to lowest balance in selected currency
 * - detected tokens (without balance)
 * - popularity
 * - all other tokens
 *
 * @param chainId - the selected src/dest chainId
 * @param tokenToExclude - a token to exclude from the token list, usually the token being swapped from
 * @param tokenToExclude.symbol
 * @param tokenToExclude.address
 * @param tokenToExclude.chainId
 */
export const useTokensWithFiltering = (
  chainId?: ChainId | Hex | CaipChainId,
  tokenToExclude?: null | Pick<BridgeToken, 'symbol' | 'address' | 'chainId'>,
) => {
  const topAssetsFromFeatureFlags = useSelector((state: BridgeAppState) =>
    getTopAssetsFromFeatureFlags(state, chainId),
  );

  const { value: tokenList, pending: isTokenListLoading } = useAsyncResult<
    Record<string, BridgeAsset>
  >(async () => {
    if (chainId) {
      return await fetchBridgeTokens(
        chainId,
        BridgeClientId.EXTENSION,
        async (url, options) => {
          const { headers, ...requestOptions } = options ?? {};
          return await fetchWithCache({
            url: url as string,
            ...requestOptions,
            fetchOptions: { method: 'GET', headers },
            functionName: 'fetchBridgeTokens',
          });
        },
        BRIDGE_API_BASE_URL,
      );
    }

    return {};
  }, [chainId]);

  const { value: topTokens, pending: isTopTokenListLoading } = useAsyncResult<
    { address: string }[]
  >(async () => {
    if (chainId) {
      // Use asset sorting from feature fags if defined
      if (topAssetsFromFeatureFlags) {
        return topAssetsFromFeatureFlags.map((tokenAddress: string) => ({
          address: tokenAddress,
        }));
      }

      return await fetchTopAssetsList(chainId);
    }
    return [];
  }, [chainId, topAssetsFromFeatureFlags]);

  // This transforms the token object from the bridge-api into the format expected by the AssetPicker
  const buildTokenDataFn = (
    token?: BridgeAsset,
  ):
    | AssetWithDisplayData<NativeAsset>
    | AssetWithDisplayData<ERC20Asset>
    | undefined => {
    if (!chainId || !token) {
      return undefined;
    }
    // Only tokens on the active chain are processed here here
    const sharedFields = {
      ...token,
      chainId: isSolanaChainId(chainId)
        ? formatChainIdToCaip(chainId)
        : formatChainIdToHex(chainId),
      assetId: token.assetId,
    };

    if (isNativeAddress(token.address)) {
      return {
        ...sharedFields,
        type: AssetType.native,
        address: '', // Return empty string to match useMultichainBalances output
        image:
          CHAIN_ID_TOKEN_IMAGE_MAP[
            sharedFields.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
          ] ??
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          (token.iconUrl || token.icon || ''),
        // Only unimported native assets are processed here so hardcode balance to 0
        balance: '0',
        string: '0',
      };
    }

    return {
      ...sharedFields,
      type: AssetType.token,
      image: token.iconUrl ?? token.icon ?? '',
      // Only tokens with 0 balance are processed here so hardcode empty string
      balance: '',
      string: undefined,
    };
  };

  const buildTokenData = useCallback(buildTokenDataFn, [chainId]);

  // shouldAddToken is a filter condition passed in from the AssetPicker that determines whether a token should be included
  const filteredTokenListGenerator = useCallback(
    (filterCondition: FilterPredicate) =>
      (function* (): Generator<
        AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>
      > {
        const shouldAddToken = (
          symbol: string,
          address?: string,
          tokenChainId?: string,
        ) =>
          filterCondition(symbol, address, tokenChainId) &&
          (tokenToExclude && tokenChainId
            ? !(
                tokenToExclude.symbol === symbol &&
                tokenToExclude.address === address &&
                tokenToExclude.chainId === formatChainIdToCaip(tokenChainId)
              )
            : true);

        if (
          !chainId ||
          !topTokens ||
          !tokenList ||
          Object.keys(tokenList).length === 0
        ) {
          return;
        }

        // Yield topTokens from selected chain
        for (const token_ of topTokens) {
          const matchedToken = tokenList?.[token_.address];
          const token = buildTokenData(matchedToken);
          if (
            token &&
            shouldAddToken(token.symbol, token.address ?? undefined, chainId)
          ) {
            if (token) {
              yield token;
            }
          }
        }

        // Yield other tokens from selected chain
        for (const token_ of Object.values(tokenList)) {
          const token = buildTokenData(token_);
          if (
            token &&
            !token.symbol.includes('$') &&
            shouldAddToken(token.symbol, token.address ?? undefined, chainId)
          ) {
            if (token) {
              yield token;
            }
          }
        }
      })(),
    [buildTokenData, topTokens, chainId, tokenList, tokenToExclude],
  );
  return {
    filteredTokenListGenerator,
    isLoading: isTokenListLoading || isTopTokenListLoading,
  };
};
