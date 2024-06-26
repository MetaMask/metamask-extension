import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { ChainId, hexToBN } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import {
  getAllTokens,
  getCurrentCurrency,
  getSelectedInternalAccountWithBalance,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../selectors';
import { getConversionRate } from '../ducks/metamask/metamask';
import {
  SwapsTokenObject,
  TokenBucketPriority,
} from '../../shared/constants/swaps';
import { getValueFromWeiHex } from '../../shared/modules/conversion.utils';
import { EtherDenomination } from '../../shared/constants/common';
import { useTokenTracker } from './useTokenTracker';
import { getRenderableTokenData } from './useTokensToSearch';

const MAX_UNOWNED_TOKENS_RENDERED = 30;
/*
Sorts tokenList by query match, balance/popularity, all other tokens
*/
export const useTokensWithFiltering = <T extends SwapsTokenObject>(
  searchQuery: string,
  tokenList: Record<string, T>,
  topTokens: { address: string }[],
  chainId: ChainId | Hex = '0x',
  sortOrder: TokenBucketPriority = TokenBucketPriority.owned,
  maxItems: number = MAX_UNOWNED_TOKENS_RENDERED,
) => {
  // Only inlucdes non-native tokens
  const allDetectedTokens = useSelector(getAllTokens);
  const { address: selectedAddress, balance: balanceOnActiveChain } =
    useSelector(getSelectedInternalAccountWithBalance);

  const allDetectedTokensForChainAndAddress =
    allDetectedTokens?.[chainId]?.[selectedAddress] ?? [];

  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const {
    tokensWithBalances: erc20TokensWithBalances,
  }: { tokensWithBalances: T[] } = useTokenTracker({
    tokens: allDetectedTokensForChainAndAddress,
    address: selectedAddress,
    hideZeroBalanceTokens: Boolean(shouldHideZeroBalanceTokens),
  });

  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const filteredTokenList = useMemo(() => {
    if (!topTokens || !tokenList) {
      return [];
    }
    const filteredTokens: T[] = [];
    const filteredTokensAddresses = new Set<string | undefined>();

    function* tokenGenerator() {
      if (sortOrder === TokenBucketPriority.owned) {
        const balance = hexToBN(balanceOnActiveChain);
        if (balance.gtn(0)) {
          yield {
            ...tokenList[zeroAddress()],
            balance: balanceOnActiveChain,
            string: getValueFromWeiHex({
              value: balance,
              numberOfDecimals: 4,
              toDenomination: EtherDenomination.ETH,
            }),
          };
        }
        for (const token of erc20TokensWithBalances) {
          if (
            tokenList?.[token.address] ??
            tokenList?.[token.address.toLowerCase()]
          ) {
            yield {
              ...token,
              ...(token.address
                ? tokenList?.[token.address] ??
                  tokenList?.[token.address.toLowerCase()]
                : {}),
            };
          }
        }
      }

      for (const t of topTokens) {
        const token =
          tokenList?.[t.address] ?? tokenList?.[t.address.toLowerCase()];
        if (token) {
          yield token;
        }
      }

      for (const token of Object.values(tokenList)) {
        yield token;
      }
    }

    let token: T;
    for (token of tokenGenerator()) {
      if (
        token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !filteredTokensAddresses.has(token.address?.toLowerCase())
      ) {
        filteredTokensAddresses.add(token.address?.toLowerCase());
        filteredTokens.push(
          getRenderableTokenData(
            token,
            tokenConversionRates,
            conversionRate,
            currentCurrency,
            chainId,
            tokenList,
          ),
        );
      }

      if (filteredTokens.length >= maxItems) {
        break;
      }
    }

    return filteredTokens;
  }, [
    balanceOnActiveChain,
    erc20TokensWithBalances,
    topTokens,
    searchQuery,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    chainId,
    tokenList,
  ]);

  return filteredTokenList;
};
