import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ChainId } from '@metamask/controller-utils';
import { CaipAssetType, type CaipChainId, type Hex } from '@metamask/utils';
import {
  isSolanaChainId,
  formatChainIdToCaip,
  formatChainIdToHex,
  type BridgeToken,
  isNativeAddress,
  fetchBridgeTokens,
  BridgeClientId,
  type BridgeAsset,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { AssetType } from '../../../shared/constants/transaction';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { useMultichainBalances } from '../useMultichainBalances';
import { useAsyncResult } from '../useAsync';
import { fetchTopAssetsList } from '../../pages/swaps/swaps.util';
import {
  type BridgeAppState,
  getTopAssetsFromFeatureFlags,
} from '../../ducks/bridge/selectors';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { getAssetImageUrl, toAssetId } from '../../../shared/lib/asset-utils';
import { getImageForChainId } from '../../selectors/multichain';

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
 * @param accountId - the accountId to use for the token list
 */
export const useTokensWithFiltering = (
  chainId?: ChainId | Hex | CaipChainId,
  tokenToExclude?: null | Pick<BridgeToken, 'symbol' | 'address' | 'chainId'>,
  accountId?: string,
) => {
  const topAssetsFromFeatureFlags = useSelector((state: BridgeAppState) =>
    getTopAssetsFromFeatureFlags(state, chainId),
  );

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances(accountId);

  const { value: tokenList, pending: isTokenListLoading } = useAsyncResult<
    Record<string, BridgeAsset>
  >(async () => {
    if (chainId) {
      // Otherwise fetch dest token data from bridge-api
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

  type TokenDisplayData = {
    symbol: string;
    chainId: Hex | CaipChainId;
    tokenFiatAmount?: number | null;
    type: AssetType;
    decimals: number;
    address: string;
    image: string;
    balance: string;
    string: string | undefined;
    assetId: CaipAssetType;
  };
  // This transforms the token object from the bridge-api into the format expected by the AssetPicker
  const buildTokenDataFn = (
    token?: BridgeAsset,
  ): TokenDisplayData | undefined => {
    if (!chainId || !token) {
      return undefined;
    }
    // Only tokens on the active chain are processed here here
    const sharedFields = {
      ...token,
      chainId: isSolanaChainId(chainId)
        ? formatChainIdToCaip(chainId)
        : formatChainIdToHex(chainId),
      assetId: token.assetId as CaipAssetType,
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
      (function* (): Generator<TokenDisplayData> {
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

        // Yield multichain tokens with balances and are not blocked
        for (const token of multichainTokensWithBalance) {
          if (
            shouldAddToken(
              token.symbol,
              token.address ?? undefined,
              token.chainId,
            )
          ) {
            if (isNativeAddress(token.address) || token.isNative) {
              yield {
                symbol: token.symbol,
                chainId: token.chainId,
                tokenFiatAmount: token.tokenFiatAmount,
                decimals: token.decimals,
                address: '',
                type: AssetType.native,
                assetId:
                  'assetId' in token
                    ? token.assetId
                    : (getNativeAssetForChainId(token.chainId)
                        .assetId as CaipAssetType),
                balance: token.balance ?? '0',
                string: token.string ?? undefined,
                image:
                  (isSolanaChainId(token.chainId)
                    ? getImageForChainId(formatChainIdToCaip(token.chainId))
                    : getImageForChainId(formatChainIdToHex(token.chainId))) ||
                  getAssetImageUrl(
                    token.address,
                    formatChainIdToCaip(token.chainId),
                  ) ||
                  '',
              };
            } else {
              yield {
                symbol: token.symbol,
                chainId: token.chainId,
                tokenFiatAmount: token.tokenFiatAmount,
                decimals: token.decimals,
                address: token.address,
                assetId:
                  'assetId' in token
                    ? token.assetId
                    : (toAssetId(
                        token.address,
                        formatChainIdToCaip(token.chainId),
                      ) as CaipAssetType),
                type: AssetType.token,
                balance: token.balance ?? '',
                string: token.string ?? undefined,
                image:
                  (token.image ||
                    tokenList?.[token.address.toLowerCase()]?.iconUrl) ??
                  getAssetImageUrl(
                    token.address,
                    formatChainIdToCaip(token.chainId),
                  ) ??
                  '',
              };
            }
          }
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
    [
      buildTokenData,
      multichainTokensWithBalance,
      topTokens,
      chainId,
      tokenList,
      tokenToExclude,
    ],
  );
  return {
    filteredTokenListGenerator,
    isLoading: isTokenListLoading || isTopTokenListLoading,
  };
};
