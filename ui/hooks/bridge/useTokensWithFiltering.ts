import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ChainId } from '@metamask/controller-utils';
import { type CaipChainId, isStrictHexString, type Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import {
  getAllDetectedTokensForSelectedAddress,
  selectERC20TokensByChain,
} from '../../selectors';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetType } from '../../../shared/constants/transaction';
import {
  formatChainIdToCaip,
  isNativeAddress,
} from '../../../shared/modules/bridge-utils/caip-formatters';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { Token } from '../../components/app/assets/types';
import { useMultichainBalances } from '../useMultichainBalances';
import { useAsyncResult } from '../useAsyncResult';
import { fetchTopAssetsList } from '../../pages/swaps/swaps.util';
import {
  fetchBridgeTokens,
  fetchNonEvmTokens,
  getAssetImageUrl,
  isTokenV3Asset,
} from '../../../shared/modules/bridge-utils/bridge.util';
import { MINUTE } from '../../../shared/constants/time';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import {
  type BridgeAppState,
  getTopAssetsFromFeatureFlags,
} from '../../ducks/bridge/selectors';

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
  tokenToExclude?: null | {
    symbol: string;
    address?: string;
    chainId?: string;
  },
) => {
  const allDetectedTokens: Record<string, Token[]> = useSelector(
    getAllDetectedTokensForSelectedAddress,
  );
  const topAssetsFromFeatureFlags = useSelector((state: BridgeAppState) =>
    getTopAssetsFromFeatureFlags(state, chainId),
  );

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

  const cachedTokens = useSelector(selectERC20TokensByChain);

  const { value: tokenList, pending: isTokenListLoading } = useAsyncResult<
    Record<string, SwapsTokenObject>
  >(async () => {
    if (chainId && isStrictHexString(chainId)) {
      const timestamp = cachedTokens[chainId]?.timestamp;
      // Use cached token data if updated in the last 10 minutes
      if (timestamp && Date.now() - timestamp <= 10 * MINUTE) {
        return cachedTokens[chainId]?.data;
      }
      // Otherwise fetch new token data

      return await fetchBridgeTokens(chainId);
    }
    if (chainId && formatChainIdToCaip(chainId) === MultichainNetworks.SOLANA) {
      return await fetchNonEvmTokens(chainId);
    }
    return {};
  }, [chainId, cachedTokens]);

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
  const buildTokenData = (
    token?: SwapsTokenObject,
  ): AssetWithDisplayData<NativeAsset | ERC20Asset> | undefined => {
    if (!chainId || !token || !isStrictHexString(chainId)) {
      return undefined;
    }
    // Only tokens on the active chain are processed here here
    const sharedFields = { ...token, chainId };

    if (isNativeAddress(token.address)) {
      return {
        ...sharedFields,
        type: AssetType.native,
        address: token.address === zeroAddress() ? null : token.address,
        image:
          CHAIN_ID_TOKEN_IMAGE_MAP[
            chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
          ],
        // Only unimported native assets are processed here so hardcode balance to 0
        balance: '0',
        string: '0',
      };
    }

    return {
      ...sharedFields,
      ...(tokenList?.[token.address.toLowerCase()] ?? {}),
      type: AssetType.token,
      image:
        token.iconUrl ??
        tokenList?.[token.address.toLowerCase()]?.iconUrl ??
        '',
      // Only tokens with 0 balance are processed here so hardcode empty string
      balance: '',
      string: undefined,
      address: token.address,
    };
  };

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

        // Yield multichain tokens with balances and are not blocked
        for (const token of multichainTokensWithBalance) {
          if (
            shouldAddToken(
              token.symbol,
              token.address ?? undefined,
              token.chainId,
            )
          ) {
            // If there's no address, set it to the native address in swaps/bridge
            if (isNativeAddress(token.address)) {
              yield {
                symbol: token.symbol,
                chainId: token.chainId,
                tokenFiatAmount: token.tokenFiatAmount,
                decimals: token.decimals,
                address: token.address,
                type: AssetType.native,
                balance: token.balance ?? '0',
                string: token.string ?? undefined,
                image:
                  CHAIN_ID_TOKEN_IMAGE_MAP[
                    token.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
                  ] ?? getAssetImageUrl(token.address),
              };
            } else {
              yield {
                symbol: token.symbol,
                chainId: token.chainId,
                tokenFiatAmount: token.tokenFiatAmount,
                decimals: token.decimals,
                address: token.address,
                type: AssetType.token,
                balance: token.balance ?? '',
                string: token.string ?? undefined,
                image:
                  tokenList?.[token.address.toLowerCase()]?.iconUrl ??
                  getAssetImageUrl(token.address),
              };
            }
          }
        }

        // Yield tokens for solana from TokenApi V3 then return
        if (chainId === MultichainNetworks.SOLANA) {
          // Yield topTokens from selected chain
          for (const { address: tokenAddress } of topTokens) {
            const assetId = `${chainId}/token:${tokenAddress}`;
            const matchedToken = tokenList?.[assetId];
            if (
              matchedToken &&
              isTokenV3Asset(matchedToken) &&
              shouldAddToken(matchedToken.symbol, matchedToken.assetId, chainId)
            ) {
              yield {
                ...matchedToken,
                type: AssetType.token,
                image: getAssetImageUrl(assetId),
                balance: '',
                string: undefined,
                address: assetId,
                chainId,
              };
            }
          }

          // Yield Solana top tokens
          for (const token_ of Object.values(tokenList)) {
            if (
              token_ &&
              !token_.symbol.includes('$') &&
              isTokenV3Asset(token_) &&
              shouldAddToken(token_.symbol, token_.assetId, chainId)
            ) {
              yield {
                ...token_,
                type: AssetType.token,
                image: getAssetImageUrl(token_.assetId),
                balance: '',
                string: undefined,
                address: token_.assetId,
                chainId,
              };
            }
          }
          return;
        }

        // Yield topTokens from selected EVM chain
        for (const token_ of topTokens) {
          const matchedToken = tokenList?.[token_.address];
          if (
            matchedToken &&
            shouldAddToken(
              matchedToken.symbol,
              matchedToken.address ?? undefined,
              chainId,
            )
          ) {
            const token = buildTokenData(matchedToken);
            if (token) {
              yield token;
            }
          }
        }

        // Yield other tokens from selected chain
        for (const token_ of Object.values(tokenList)) {
          if (
            token_ &&
            shouldAddToken(token_.symbol, token_.address ?? undefined, chainId)
          ) {
            const token = buildTokenData(token_);
            if (token) {
              yield token;
            }
          }
        }
      })(),
    [
      multichainTokensWithBalance,
      topTokens,
      chainId,
      tokenList,
      allDetectedTokens,
      tokenToExclude,
    ],
  );
  return {
    filteredTokenListGenerator,
    isLoading: isTokenListLoading || isTopTokenListLoading,
  };
};
