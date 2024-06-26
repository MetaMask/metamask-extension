import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getAllTokens,
  getCurrentChainId,
  getCurrentCurrency,
  getSelectedInternalAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
  getTokenList,
} from '../selectors';
import { getTopAssets } from '../ducks/swaps/swaps';
import { isEqual, uniqBy } from 'lodash';
import { useEqualityCheck } from './useEqualityCheck';
import { useTokenTracker } from './useTokenTracker';
import { ChainId } from '@metamask/controller-utils';
import { getRenderableTokenData } from './useTokensToSearch';
import { TokenDetails } from '../../shared/constants/tokens';
import { getConversionRate } from '../ducks/metamask/metamask';

const MAX_UNOWNED_TOKENS_RENDERED = 30;
/*
Sorts by owned, top, all tokens, disabled tokens (if matched by query)
*/
export const useTokensWithFiltering = <T extends TokenDetails>(
  nativeToken: T,
  searchQuery: string,
  tokenDataToAppend: Partial<T> = {},
  shouldDisableToken: (token: T) => boolean = () => false,
  chainId?: ChainId,
  maxItems: number = MAX_UNOWNED_TOKENS_RENDERED,
) => {
  const currentChainId = useSelector(getCurrentChainId);
  const chainIdToUse = chainId ?? currentChainId;
  const detectedTokens = useSelector(getAllTokens);
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);

  const tokens = detectedTokens?.[chainIdToUse]?.[selectedAddress] ?? [];

  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const { tokensWithBalances } = useTokenTracker({
    tokens,
    address: selectedAddress,
    hideZeroBalanceTokens: Boolean(shouldHideZeroBalanceTokens),
  });

  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const tokenList = useSelector(getTokenList) as Record<string, T>;
  const topTokens = useSelector(getTopAssets, isEqual);
  const usersTokens = uniqBy([...tokensWithBalances, ...tokens], 'address');

  const memoizedUsersTokens = useEqualityCheck(usersTokens);

  const filteredTokenList = useMemo(() => {
    const filteredTokens: T[] = [];
    // undefined would be the native token address
    const filteredTokensAddresses = new Set<string | undefined>();

    function* tokenGenerator() {
      yield nativeToken;

      const blockedTokens = [];

      for (const token of memoizedUsersTokens) {
        yield token;
      }

      // topTokens should already be sorted by popularity
      for (const address of Object.keys(topTokens)) {
        const token = tokenList?.[address];
        if (token) {
          if (shouldDisableToken(token)) {
            blockedTokens.push(token);
            continue;
          } else {
            yield token;
          }
        }
      }

      for (const token of Object.values(tokenList)) {
        yield token;
      }

      for (const token of blockedTokens) {
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
            token.address
              ? {
                  ...token,
                  ...tokenList[token.address.toLowerCase()],
                  ...tokenDataToAppend,
                }
              : token,
            tokenConversionRates,
            conversionRate,
            currentCurrency,
            chainIdToUse,
            tokenList,
          ),
        );
      }

      if (filteredTokens.length > maxItems) {
        break;
      }
    }

    return filteredTokens;
  }, [
    memoizedUsersTokens,
    topTokens,
    searchQuery,
    nativeToken,
    tokenConversionRates,
    conversionRate,
    currentCurrency,
    chainIdToUse,
    tokenList,
  ]);

  return filteredTokenList;
};
