import { useState, useEffect, useRef, useCallback } from 'react';
import TokenTracker from '@metamask/eth-token-tracker';
import { shallowEqual, useSelector } from 'react-redux';
import {
  getCurrentChainId,
  getCurrentCurrency,
  getSelectedAddress,
  getTokenExchangeRates,
} from '../selectors';
import { SECOND } from '../../shared/constants/time';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { getConversionRate } from '../ducks/metamask/metamask';
import { useEqualityCheck } from './useEqualityCheck';

export function useTokenTracker({
  tokens,
  address,
  includeFailedTokens = false,
  hideZeroBalanceTokens = false,
}) {
  const chainId = useSelector(getCurrentChainId);

  const selectedAddress = useSelector(getSelectedAddress, shallowEqual);
  const userAddress = address ?? selectedAddress;

  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const [loading, setLoading] = useState(() => tokens?.length >= 0);
  const [tokensWithBalances, setTokensWithBalances] = useState([]);
  const [error, setError] = useState(null);
  const tokenTracker = useRef(null);
  const memoizedTokens = useEqualityCheck(tokens);

  const updateBalances = useCallback(
    (tokenWithBalances) => {
      const matchingTokens = hideZeroBalanceTokens
        ? tokenWithBalances.filter((token) => Number(token.balance) > 0)
        : tokenWithBalances;
      // TODO: improve this pattern for adding this field when we improve support for
      // EIP721 tokens.
      const matchingTokensWithIsERC721Flag = matchingTokens.map((token) => {
        const contractExchangeTokenKey = Object.keys(
          contractExchangeRates,
        ).find((key) => isEqualCaseInsensitive(key, token.address));
        const tokenExchangeRate =
          (contractExchangeTokenKey &&
            contractExchangeRates[contractExchangeTokenKey]) ??
          0;

        const totalFiatValue = getTokenFiatAmount(
          tokenExchangeRate,
          conversionRate,
          currentCurrency,
          token.string,
          token.symbol,
          false,
          false,
        );

        const additionalTokenData = memoizedTokens.find((t) =>
          isEqualCaseInsensitive(t.address, token.address),
        );
        return {
          ...token,
          isERC721: additionalTokenData?.isERC721,
          image: additionalTokenData?.image,
          totalFiatValue,
        };
      });
      setTokensWithBalances(matchingTokensWithIsERC721Flag);
      setLoading(false);
      setError(null);
    },
    [
      hideZeroBalanceTokens,
      memoizedTokens,
      contractExchangeRates,
      conversionRate,
      currentCurrency,
    ],
  );

  const showError = useCallback((err) => {
    setError(err);
    setLoading(false);
  }, []);

  const teardownTracker = useCallback(() => {
    if (tokenTracker.current) {
      tokenTracker.current.stop();
      tokenTracker.current.removeAllListeners('update');
      tokenTracker.current.removeAllListeners('error');
      tokenTracker.current = null;
    }
  }, []);

  const buildTracker = useCallback(
    (usersAddress, tokenList) => {
      // clear out previous tracker, if it exists.
      teardownTracker();
      tokenTracker.current = new TokenTracker({
        userAddress: usersAddress,
        provider: global.ethereumProvider,
        tokens: tokenList,
        includeFailedTokens,
        pollingInterval: SECOND * 8,
        balanceDecimals: 5,
      });

      tokenTracker.current.on('update', updateBalances);
      tokenTracker.current.on('error', showError);
      tokenTracker.current.updateBalances();
    },
    [updateBalances, includeFailedTokens, showError, teardownTracker],
  );

  // Effect to remove the tracker when the component is removed from DOM
  // Do not overload this effect with additional dependencies. teardownTracker
  // is the only dependency here, which itself has no dependencies and will
  // never update. The lack of dependencies that change is what confirms
  // that this effect only runs on mount/unmount
  useEffect(() => {
    return teardownTracker;
  }, [teardownTracker]);

  // Effect to set loading state and initialize tracker when values change
  useEffect(() => {
    // This effect will only run initially and when:
    // 1. chainId is updated,
    // 2. userAddress is changed,
    // 3. token list is updated and not equal to previous list
    // in any of these scenarios, we should indicate to the user that their token
    // values are in the process of updating by setting loading state.
    setLoading(true);

    if (!userAddress || chainId === undefined || !global.ethereumProvider) {
      // If we do not have enough information to build a TokenTracker, we exit early
      // When the values above change, the effect will be restarted. We also teardown
      // tracker because inevitably this effect will run again momentarily.
      teardownTracker();
      return;
    }

    if (memoizedTokens.length === 0) {
      // sets loading state to false and token list to empty
      updateBalances([]);
    }

    buildTracker(userAddress, memoizedTokens);
  }, [
    userAddress,
    teardownTracker,
    chainId,
    memoizedTokens,
    updateBalances,
    buildTracker,
  ]);

  return { loading, tokensWithBalances, error };
}
