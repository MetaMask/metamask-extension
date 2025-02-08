import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ChainId } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
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
import { isNativeAddress } from '../../pages/bridge/utils/quote';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { Token } from '../../components/app/assets/types';
import { useMultichainBalances } from '../useMultichainBalances';
import { useAsyncResult } from '../useAsyncResult';
import { fetchTopAssetsList } from '../../pages/swaps/swaps.util';
import { fetchBridgeTokens } from '../../../shared/modules/bridge-utils/bridge.util';
import { MINUTE } from '../../../shared/constants/time';

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
export const useTokensWithFiltering = (chainId?: ChainId | Hex) => {
  const allDetectedTokens: Record<string, Token[]> = useSelector(
    getAllDetectedTokensForSelectedAddress,
  );

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

  const cachedTokens = useSelector(selectERC20TokensByChain);

  const { value: tokenList, pending: isTokenListLoading } = useAsyncResult<
    Record<string, SwapsTokenObject>
  >(async () => {
    if (chainId) {
      const timestamp = cachedTokens[chainId]?.timestamp;
      // Use cached token data if updated in the last 10 minutes
      if (timestamp && Date.now() - timestamp <= 10 * MINUTE) {
        return cachedTokens[chainId]?.data;
      }
      // Otherwise fetch new token data
      return await fetchBridgeTokens(chainId);
    }
    return {};
  }, [chainId, cachedTokens]);

  const { value: topTokens, pending: isTopTokenListLoading } = useAsyncResult<
    { address: string }[]
  >(async () => {
    if (chainId) {
      return await fetchTopAssetsList(chainId);
    }
    return [];
  }, [chainId]);

  // This transforms the token object from the bridge-api into the format expected by the AssetPicker
  const buildTokenData = (
    token?: SwapsTokenObject,
  ): AssetWithDisplayData<NativeAsset | ERC20Asset> | undefined => {
    if (!chainId || !token) {
      return undefined;
    }
    // Only tokens on the active chain are processed here here
    const sharedFields = { ...token, chainId };

    if (isNativeAddress(token.address)) {
      return {
        ...sharedFields,
        type: AssetType.native,
        address: zeroAddress(),
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
      type: AssetType.token,
      image: token.iconUrl,
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
            yield { ...token, address: token.address || zeroAddress() };
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

        // Yield all detected tokens for all supported chains
        for (const token of Object.values(allDetectedTokens).flat()) {
          if (
            shouldAddToken(
              token.symbol,
              token.address ?? undefined,
              token.chainId,
            )
          ) {
            yield {
              ...token,
              type: AssetType.token,
              // Balance is not 0 but is not in the data so hardcode 0
              // If a detected token is selected useLatestBalance grabs the on-chain balance
              balance: '',
              string: undefined,
            };
          }
        }

        // Yield topTokens from selected chain
        for (const token_ of topTokens) {
          const matchedToken =
            tokenList?.[token_.address] ??
            tokenList?.[token_.address.toLowerCase()];
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
