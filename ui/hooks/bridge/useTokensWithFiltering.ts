import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ChainId } from '@metamask/controller-utils';
import { isStrictHexString, type CaipChainId, type Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import {
  getAllDetectedTokensForSelectedAddress,
  selectERC20TokensByChain,
} from '../../selectors';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SwapsTokenObject,
} from '../../../shared/constants/swaps';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetType } from '../../../shared/constants/transaction';
import { isNativeAddress } from '../../../shared/modules/bridge-utils/caip-formatters';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { Token } from '../../components/app/assets/types';
import { useMultichainBalances } from '../useMultichainBalances';
import { useAsyncResult } from '../useAsyncResult';
import { fetchTopAssetsList } from '../../pages/swaps/swaps.util';
import {
  fetchBridgeTokens,
  fetchNonEvmTokens,
} from '../../../shared/modules/bridge-utils/bridge.util';
import { MINUTE } from '../../../shared/constants/time';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';

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
 */
export const useTokensWithFiltering = (
  chainId?: ChainId | Hex | CaipChainId,
) => {
  const allDetectedTokens: Record<string, Token[]> = useSelector(
    getAllDetectedTokensForSelectedAddress,
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
      if (isCaipChainId(chainId)) {
        return await fetchNonEvmTokens(chainId);
      }
      return await fetchBridgeTokens(chainId);
    }
    return {};
  }, [chainId, cachedTokens]);

  const { value: topTokens, pending: isTopTokenListLoading } = useAsyncResult<
    { address: string }[]
  >(async () => {
    if (chainId) {
      if (isCaipChainId(chainId)) {
        return {
          [MultichainNetworks.SOLANA]: [
            {
              address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            },
            {
              address: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
            },
            {
              address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
            },
            {
              address:
                '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxsDx8F8k8k3uYw1PDC',
            },
            {
              address: '3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y',
            },
            {
              address: '9zNQRsGLjNKwCUU5Gq5LR8beUCPzQMVMqKAi3SSZh54u',
            },
            {
              address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            },
            {
              address: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
            },
            { address: '21AErpiB8uSb94oQKRcwuHqyHF93njAxBSbdUrpupump' },
          ],
        }[chainId];
      }
      return await fetchTopAssetsList(chainId);
    }
    return [];
  }, [chainId]);

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
      address: token.address || zeroAddress(),
    };
  };

  // shouldAddToken is a filter condition passed in from the AssetPicker that determines whether a token should be included
  const filteredTokenListGenerator = useCallback(
    (shouldAddToken: FilterPredicate) =>
      (function* (): Generator<
        AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>
      > {
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
                address: zeroAddress(),
                type: AssetType.native,
                balance: token.balance ?? '0',
                string: token.string ?? undefined,
                image:
                  CHAIN_ID_TOKEN_IMAGE_MAP[
                    token.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
                  ],
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
                image: tokenList?.[token.address.toLowerCase()]?.iconUrl,
              };
            }
          }
        }

        // Yield the native token for the selected chain
        const nativeToken =
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
            chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
          ];
        if (
          nativeToken &&
          shouldAddToken(
            nativeToken.symbol,
            nativeToken.address ?? undefined,
            chainId,
          )
        ) {
          const tokenWithData = buildTokenData(nativeToken);
          if (tokenWithData) {
            yield tokenWithData;
          }
        }

        if (chainId === MultichainNetworks.SOLANA) {
          // Yield topTokens from selected chain
          for (const token_ of topTokens) {
            const assetId = `${chainId}/token:${token_.address}`;
            const matchedToken = tokenList?.[assetId];
            if (
              matchedToken &&
              shouldAddToken(matchedToken.symbol, matchedToken.assetId, chainId)
            ) {
              yield {
                ...matchedToken,
                type: AssetType.token,
                image: `https://static.cx.metamask.io/api/v2/tokenIcons/assets/${assetId.replaceAll(
                  ':',
                  '/',
                )}.png`,
                // Only tokens with 0 balance are processed here so hardcode empty string
                balance: '',
                string: undefined,
                address: assetId,
                chainId,
              };
            }
          }

          // Yield other tokens from selected chain
          for (const token_ of Object.values(tokenList)) {
            if (
              token_ &&
              !token_.symbol.includes('$') &&
              shouldAddToken(token_.symbol, token_.assetId, chainId)
            ) {
              yield {
                ...token_,
                type: AssetType.token,
                image: `https://static.cx.metamask.io/api/v2/tokenIcons/assets/${token_.assetId?.replaceAll(
                  ':',
                  '/',
                )}.png`,
                // Only tokens with 0 balance are processed here so hardcode empty string
                balance: '',
                string: undefined,
                address: token_.assetId,
                chainId,
              };
            }
          }
          return;
        }

        // Yield topTokens from selected chain
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
    ],
  );
  return {
    filteredTokenListGenerator,
    isLoading: isTokenListLoading || isTopTokenListLoading,
  };
};
