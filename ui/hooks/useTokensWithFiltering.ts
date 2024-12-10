import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { ChainId, hexToBN } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
import { useParams } from 'react-router-dom';
import {
  getAllTokens,
  getCurrentCurrency,
  getSelectedInternalAccountWithBalance,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../selectors';
import { getConversionRate } from '../ducks/metamask/metamask';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SwapsTokenObject,
  TokenBucketPriority,
} from '../../shared/constants/swaps';
import { getValueFromWeiHex } from '../../shared/modules/conversion.utils';
import { EtherDenomination } from '../../shared/constants/common';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
  TokenWithBalance,
} from '../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetType } from '../../shared/constants/transaction';
import { isSwapsDefaultTokenSymbol } from '../../shared/modules/swaps.utils';
import { useTokenTracker } from './useTokenTracker';
import { getRenderableTokenData } from './useTokensToSearch';

/*
 * Returns a token list generator that filters and sorts tokens based on
 * query match, balance/popularity, all other tokens
 */
export const useTokensWithFiltering = (
  tokenList: Record<string, SwapsTokenObject>,
  topTokens: { address: string }[],
  sortOrder: TokenBucketPriority = TokenBucketPriority.owned,
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

  const sortedErc20TokensWithBalances = useMemo(
    () =>
      erc20TokensWithBalances.toSorted(
        (a, b) => Number(b.string) - Number(a.string),
      ),
    [erc20TokensWithBalances],
  );

  const filteredTokenListGenerator = useCallback(
    (shouldAddToken: (symbol: string, address?: string) => boolean) => {
      const buildTokenData = (
        token: SwapsTokenObject,
      ):
        | AssetWithDisplayData<NativeAsset>
        | AssetWithDisplayData<ERC20Asset>
        | undefined => {
        if (chainId && shouldAddToken(token.symbol, token.address)) {
          return getRenderableTokenData(
            {
              ...token,
              type: isSwapsDefaultTokenSymbol(token.symbol, chainId)
                ? AssetType.native
                : AssetType.token,
              image: token.iconUrl,
            },
            tokenConversionRates,
            conversionRate,
            currentCurrency,
            chainId,
            tokenList,
          );
        }
        return undefined;
      };

      return (function* (): Generator<
        AssetWithDisplayData<NativeAsset> | AssetWithDisplayData<ERC20Asset>
      > {
        const balance = hexToBN(balanceOnActiveChain);
        const srcBalanceFields =
          sortOrder === TokenBucketPriority.owned
            ? {
                balance: balanceOnActiveChain,
                string: getValueFromWeiHex({
                  value: balance,
                  numberOfDecimals: 4,
                  toDenomination: EtherDenomination.ETH,
                }),
              }
            : {};
        const nativeToken = buildTokenData({
          ...SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
            chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
          ],
          ...srcBalanceFields,
        });
        if (nativeToken) {
          yield nativeToken;
        }

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

        if (sortOrder === TokenBucketPriority.owned) {
          for (const tokenWithBalance of sortedErc20TokensWithBalances) {
            const cachedTokenData =
              tokenWithBalance.address &&
              tokenList &&
              (tokenList[tokenWithBalance.address] ??
                tokenList[tokenWithBalance.address.toLowerCase()]);
            if (cachedTokenData) {
              const combinedTokenData = buildTokenData({
                ...tokenWithBalance,
                ...(cachedTokenData ?? {}),
              });
              if (combinedTokenData) {
                yield combinedTokenData;
              }
            }
          }
        }

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

        for (const token of Object.values(tokenList)) {
          const tokenWithTokenListData = buildTokenData(token);
          if (tokenWithTokenListData) {
            yield tokenWithTokenListData;
          }
        }
      })();
    },
    [
      balanceOnActiveChain,
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
