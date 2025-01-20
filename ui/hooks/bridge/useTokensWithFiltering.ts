import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { ChainId } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
import { useParams } from 'react-router-dom';
import { zeroAddress } from 'ethereumjs-util';
import {
  getAllDetectedTokensForSelectedAddress,
  getSelectedInternalAccountWithBalance,
  getTokenExchangeRates,
} from '../../selectors';
import {
  getConversionRate,
  getCurrentCurrency,
} from '../../ducks/metamask/metamask';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetType } from '../../../shared/constants/transaction';
import { isNativeAddress } from '../../pages/bridge/utils/quote';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../shared/constants/network';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import { Token } from '../../components/app/assets/token-list/token-list';
import { useMultichainBalances } from '../useMultichainBalances';

type FilterPredicate = (
  symbol: string,
  address?: string,
  tokenChainId?: string,
) => boolean;

/**
 * Returns a token list generator that filters and sorts tokens in this order
 * - matches URL token parameter
 * - matches search query
 * - highest balance in selected currency
 * - detected tokens (with balance)
 * - popularity
 * - all other tokens
 *
 * @param tokenList - a mapping of token addresses in the selected chainId to token metadata from the bridge-api
 * @param topTokens - a list of top tokens from the swap-api
 * @param chainId - the selected src/dest chainId
 */
export const useTokensWithFiltering = (
  tokenList: Record<string, SwapsTokenObject>,
  topTokens: { address: string }[],
  chainId?: ChainId | Hex,
) => {
  const { token: tokenAddressFromUrl } = useParams();
  const allDetectedTokens: Record<string, Token[]> = useSelector(
    getAllDetectedTokensForSelectedAddress,
  );

  const { balance } = useSelector(getSelectedInternalAccountWithBalance);

  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);
  const currentChainId = useSelector(getCurrentChainId);

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

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
        balance: currentChainId === chainId ? balance : '',
        string: currentChainId === chainId ? balance : '',
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
        // If a token address is in the URL (e.g. from a deep link), yield that token first
        if (tokenAddressFromUrl) {
          const token =
            tokenList?.[tokenAddressFromUrl] ??
            tokenList?.[tokenAddressFromUrl.toLowerCase()];
          if (
            shouldAddToken(token.symbol, token.address ?? undefined, chainId)
          ) {
            const tokenWithData = buildTokenData(token);
            if (tokenWithData) {
              yield tokenWithData;
            }
          }
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
      tokenConversionRates,
      conversionRate,
      currentCurrency,
      chainId,
      tokenList,
      tokenAddressFromUrl,
      allDetectedTokens,
    ],
  );

  return filteredTokenListGenerator;
};
