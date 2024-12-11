import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { ChainId } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
import { useParams } from 'react-router-dom';
import { zeroAddress } from 'ethereumjs-util';
import {
  getAllTokens,
  getCurrentCurrency,
  getSelectedInternalAccountWithBalance,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../selectors';
import { getConversionRate } from '../ducks/metamask/metamask';
import { SwapsTokenObject } from '../../shared/constants/swaps';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
  TokenWithBalance,
} from '../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetType } from '../../shared/constants/transaction';
import { isNativeAddress } from '../pages/bridge/utils/quote';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../shared/constants/network';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { useTokenTracker } from './useTokenTracker';
import { useMultichainBalances } from './useMultichainBalances';

/**
 * Returns a token list generator that filters and sorts tokens based on
 * query match, balance/popularity, all other tokens
 *
 * @param tokenList - a mapping of token addresses in the selected chainId to token metadata from the bridge-api
 * @param topTokens - a list of top tokens from the swap-api
 * @param tokenAddressAllowlistByChainId - a mapping of all supported chainIds to a Set of allowed token addresses
 * @param chainId - the selected src/dest chainId
 */
export const useTokensWithFiltering = (
  tokenList: Record<string, SwapsTokenObject>,
  topTokens: { address: string }[],
  tokenAddressAllowlistByChainId: Record<string, Set<string>>,
  chainId?: ChainId | Hex,
) => {
  const { token: tokenAddressFromUrl } = useParams();

  // Only includes non-native tokens
  const allDetectedTokens = useSelector(getAllTokens);
  const { address: selectedAddress, balance: balanceOnActiveChain } =
    useSelector(getSelectedInternalAccountWithBalance);

  const allDetectedTokensForChainAndAddress = chainId
    ? allDetectedTokens?.[chainId]?.[selectedAddress] ?? []
    : [];

  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const {
    tokensWithBalances: erc20TokensWithBalances,
  }: { tokensWithBalances: TokenWithBalance[] } = useTokenTracker({
    tokens: allDetectedTokensForChainAndAddress,
    address: selectedAddress,
    hideZeroBalanceTokens: Boolean(shouldHideZeroBalanceTokens),
  });

  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);
  const currentChainId = useSelector(getCurrentChainId);

  const sortedErc20TokensWithBalances = useMemo(
    () =>
      erc20TokensWithBalances.toSorted(
        (a, b) => Number(b.string) - Number(a.string),
      ),
    [erc20TokensWithBalances],
  );

  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

  const filteredTokenListGenerator = useCallback(
    (
      shouldAddToken: (
        symbol: string,
        address?: string,
        tokenChainId?: string,
      ) => boolean,
    ) => {
      const buildTokenData = (
        token: SwapsTokenObject,
      ):
        | AssetWithDisplayData<NativeAsset>
        | AssetWithDisplayData<ERC20Asset>
        | undefined => {
        if (chainId && shouldAddToken(token.symbol, token.address, chainId)) {
          // Only tokens on the active chain are shown here
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
              balance: currentChainId === chainId ? balanceOnActiveChain : '',
              string: currentChainId === chainId ? balanceOnActiveChain : '',
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
        }

        return undefined;
      };

      return (function* (): Generator<
        AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>
      > {
        if (tokenAddressFromUrl) {
          const tokenListItem =
            tokenList?.[tokenAddressFromUrl] ??
            tokenList?.[tokenAddressFromUrl.toLowerCase()];
          if (tokenListItem) {
            const tokenWithTokenListData = buildTokenData(tokenListItem);
            if (tokenWithTokenListData) {
              yield tokenWithTokenListData;
            }
          }
        }

        const isTokenBlocked = (tokenAddress: string, tokenChainId: string) =>
          !tokenAddressAllowlistByChainId[tokenChainId]?.has(
            tokenAddress.toLowerCase(),
          );
        // Yield multichain tokens with balances and are not blocked
        for (const token of multichainTokensWithBalance) {
          if (
            shouldAddToken(
              token.symbol,
              token.address ?? undefined,
              token.chainId,
            ) &&
            (token.address
              ? !isTokenBlocked(token.address, token.chainId)
              : true)
          ) {
            yield { ...token, address: token.address || zeroAddress() };
          }
        }

        // Yield topTokens from selected chain
        for (const topToken of topTokens) {
          const tokenListItem =
            tokenList?.[topToken.address] ??
            tokenList?.[topToken.address.toLowerCase()];
          if (tokenListItem) {
            const tokenWithTokenListData = buildTokenData(tokenListItem);
            if (tokenWithTokenListData) {
              yield tokenWithTokenListData;
            }
          }
        }

        // Yield other tokens from selected chain
        for (const token of Object.values(tokenList)) {
          const tokenWithTokenListData = buildTokenData(token);
          if (tokenWithTokenListData) {
            yield tokenWithTokenListData;
          }
        }
      })();
    },
    [
      multichainTokensWithBalance,
      sortedErc20TokensWithBalances,
      topTokens,
      tokenConversionRates,
      conversionRate,
      currentCurrency,
      chainId,
      tokenList,
      tokenAddressFromUrl,
    ],
  );

  return filteredTokenListGenerator;
};
