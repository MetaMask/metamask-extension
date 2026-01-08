import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ChainId } from '@metamask/controller-utils';
import { type CaipChainId, type Hex } from '@metamask/utils';
import {
  isSolanaChainId,
  isBitcoinChainId,
  formatChainIdToCaip,
  formatChainIdToHex,
  isNativeAddress,
  fetchBridgeTokens,
  BridgeClientId,
  type BridgeAsset,
  getNativeAssetForChainId,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import type {
  TokenListMap,
  TokenListToken,
} from '@metamask/assets-controllers';
import { AssetType } from '../../../shared/constants/transaction';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { useMultichainBalances } from '../useMultichainBalances';
import { useAsyncResult } from '../useAsync';
import { fetchTopAssetsList } from '../../pages/swaps/swaps.util';
import { MINUTE } from '../../../shared/constants/time';
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
import { getAssetImageUrl, toAssetId } from '../../../shared/lib/asset-utils';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../shared/constants/multichain/networks';
import type { BridgeToken } from '../../ducks/bridge/types';
import { isTronEnergyOrBandwidthResource } from '../../ducks/bridge/utils';

// This transforms the token object from the bridge-api into the format expected by the AssetPicker
const buildTokenData = (
  chainId: ChainId | Hex | CaipChainId,
  token?: BridgeAsset | TokenListToken,
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
    chainId: isNonEvmChainId(chainId)
      ? formatChainIdToCaip(chainId)
      : formatChainIdToHex(chainId),
    assetId:
      'assetId' in token ? token.assetId : toAssetId(token.address, chainId),
  };

  if (isNativeAddress(token.address)) {
    // Use MULTICHAIN_TOKEN_IMAGE_MAP for non-EVM chains
    const image = isNonEvmChainId(chainId)
      ? MULTICHAIN_TOKEN_IMAGE_MAP[
          sharedFields.chainId as keyof typeof MULTICHAIN_TOKEN_IMAGE_MAP
        ]
      : CHAIN_ID_TOKEN_IMAGE_MAP[
          sharedFields.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
        ];

    return {
      ...sharedFields,
      type: AssetType.native,
      address: '', // Return empty string to match useMultichainBalances output
      image:
        image ??
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        (token.iconUrl || ('icon' in token ? token.icon : '') || ''),
      // Only unimported native assets are processed here so hardcode balance to 0
      balance: '0',
      string: '0',
    } as AssetWithDisplayData<NativeAsset>;
  }

  return {
    ...sharedFields,
    type: AssetType.token,
    image: token.iconUrl ?? ('icon' in token ? token.icon : '') ?? '',
    // Only tokens with 0 balance are processed here so hardcode empty string
    balance: '',
    string: undefined,
  };
};

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
 * @deprecated Use usePopularTokens or other token list hooks instead
 * @param chainId - the selected src/dest chainId
 * @param tokenToExclude - a token to exclude from the token list, usually the token being swapped from
 * @param tokenToExclude.symbol
 * @param tokenToExclude.address
 * @param tokenToExclude.chainId
 * @param accountAddress - the account address used for balances
 */
export const useTokensWithFiltering = (
  chainId?: ChainId | Hex | CaipChainId,
  tokenToExclude?: null | Pick<BridgeToken, 'symbol' | 'address' | 'chainId'>,
  accountAddress?: string,
) => {
  const topAssetsFromFeatureFlags = useSelector((state: BridgeAppState) =>
    getTopAssetsFromFeatureFlags(state, chainId),
  );

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances(accountAddress);

  const cachedTokens = useSelector(
    (state: BridgeAppState) => state.metamask.tokensChainsCache,
  );

  const cachedTokenList = useMemo(() => {
    if (!chainId) {
      return undefined;
    }
    // For Bitcoin chains, we only support native asset
    if (isBitcoinChainId(chainId)) {
      // Return native asset for Bitcoin chains
      const nativeAsset = getNativeAssetForChainId(chainId);
      if (nativeAsset) {
        const key = nativeAsset.address ?? '';
        return {
          [key]: nativeAsset,
        };
      }
      return undefined;
    }
    // For Solana chains, we don't cache in the same way, return undefined to trigger fetch
    if (isSolanaChainId(chainId)) {
      return undefined;
    }
    // For EVM chains, check the cache
    const hexChainId = formatChainIdToHex(chainId);
    return hexChainId ? cachedTokens[hexChainId]?.data : undefined;
  }, [chainId, cachedTokens]);
  const isTokenListCached = Boolean(cachedTokenList);

  const { value: fetchedTokenList, pending: isTokenListLoading } =
    useAsyncResult<Record<string, BridgeAsset> | TokenListMap>(async () => {
      if (isTokenListCached || !chainId) {
        return {};
      }
      // Otherwise fetch new token data
      return await fetchBridgeTokens(
        chainId,
        BridgeClientId.EXTENSION,
        async (url, options) => {
          const { headers, ...requestOptions } = options ?? {};
          return await fetchWithCache({
            url: url as string,
            ...requestOptions,
            fetchOptions: { method: 'GET', headers },
            cacheOptions: {
              cacheRefreshTime: 10 * MINUTE,
            },
            functionName: 'fetchBridgeTokens',
          });
        },
        BRIDGE_API_BASE_URL,
        process.env.METAMASK_VERSION,
      );
    }, [chainId, isTokenListCached]);

  const tokenList = useMemo(() => {
    return cachedTokenList ?? fetchedTokenList;
  }, [cachedTokenList, fetchedTokenList]);

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
        ) => {
          /**
           * Native tokens can be represented differently across the codebase:
           * - When selected as source: address = '0x0000000000000000000000000000000000000000'
           * - When yielded in token lists: address = '' (empty string)
           *
           * @param addr - The token address to normalize
           * @returns Empty string for native addresses, original address otherwise
           */
          const normalizeAddress = (addr?: string) => {
            return addr && isNativeAddress(addr) ? '' : addr;
          };

          return (
            filterCondition(symbol, address, tokenChainId) &&
            (tokenToExclude && tokenChainId
              ? !(
                  tokenToExclude.symbol === symbol &&
                  (isSolanaChainId(tokenChainId)
                    ? // For Solana: normalize both addresses before comparison to handle native SOL
                      normalizeAddress(tokenToExclude.address) ===
                      normalizeAddress(address)
                    : // For EVM: use case-insensitive comparison (native tokens already normalized)
                      tokenToExclude.address?.toLowerCase() ===
                      address?.toLowerCase()) &&
                  tokenToExclude.chainId === formatChainIdToCaip(tokenChainId)
                )
              : true)
          );
        };

        if (!chainId || !topTokens) {
          return;
        }

        if (!tokenList || Object.keys(tokenList).length === 0) {
          return;
        }

        // Yield multichain tokens with balances and are not blocked
        for (const token of multichainTokensWithBalance) {
          // Filter out Tron Energy and Bandwidth resources (including MAX-BANDWIDTH, sTRX-BANDWIDTH, sTRX-ENERGY)
          // as they are not tradeable assets
          if (isTronEnergyOrBandwidthResource(token.chainId, token.symbol)) {
            continue;
          }
          if (shouldAddToken(token.symbol, token.address, token.chainId)) {
            if (isNativeAddress(token.address) || token.isNative) {
              yield {
                symbol: token.symbol,
                chainId: token.chainId,
                tokenFiatAmount: token.tokenFiatAmount,
                decimals: token.decimals,
                address: '',
                type: AssetType.native,
                balance: token.balance ?? '0',
                string: token.string ?? undefined,
                image:
                  CHAIN_ID_TOKEN_IMAGE_MAP[
                    token.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
                  ] ??
                  MULTICHAIN_TOKEN_IMAGE_MAP[
                    token.chainId as keyof typeof MULTICHAIN_TOKEN_IMAGE_MAP
                  ] ??
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                  (getNativeAssetForChainId(token.chainId)?.icon ||
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    getNativeAssetForChainId(token.chainId)?.iconUrl ||
                    getAssetImageUrl(
                      token.address,
                      formatChainIdToCaip(token.chainId),
                    )),
                accountType: token.accountType,
              };
            } else {
              const assetId = toAssetId(
                token.address,
                formatChainIdToCaip(token.chainId),
              );
              yield {
                ...token,
                symbol: token.symbol,
                chainId: token.chainId,
                tokenFiatAmount: token.tokenFiatAmount,
                decimals: token.decimals,
                address: token.address,
                type: AssetType.token,
                balance: token.balance ?? '0',
                string: token.string ?? undefined,
                image:
                  (token.image ||
                    (token.address &&
                      tokenList?.[token.address.toLowerCase()]?.iconUrl)) ??
                  (assetId
                    ? getAssetImageUrl(assetId, token.chainId)
                    : undefined) ??
                  '',
              };
            }
          }
        }

        // Yield topTokens from selected chain
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        for (const token_ of topTokens) {
          const matchedToken =
            tokenList?.[token_.address] ??
            tokenList?.[token_.address.toLowerCase()];
          const token = buildTokenData(chainId, matchedToken);
          // Filter out Tron Energy and Bandwidth resources (including MAX-BANDWIDTH, sTRX-BANDWIDTH, sTRX-ENERGY)
          // as they are not tradeable assets
          if (
            token &&
            !isTronEnergyOrBandwidthResource(chainId, token.symbol) &&
            shouldAddToken(token.symbol, token.address ?? undefined, chainId)
          ) {
            yield token;
          }
        }

        // Yield other tokens from selected chain
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        for (const token_ of Object.values(tokenList)) {
          const token = buildTokenData(chainId, token_);
          // Filter out Tron Energy and Bandwidth resources (including MAX-BANDWIDTH, sTRX-BANDWIDTH, sTRX-ENERGY)
          // as they are not tradeable assets
          if (
            token &&
            token.symbol.indexOf('$') === -1 &&
            !isTronEnergyOrBandwidthResource(chainId, token.symbol) &&
            shouldAddToken(token.symbol, token.address ?? undefined, chainId)
          ) {
            yield token;
          }
        }
      })(),
    [
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
