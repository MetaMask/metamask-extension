import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TokenTracker from '@metamask/eth-token-tracker';
import { JsonRpcProvider } from '@ethersproject/providers';
import { shallowEqual, useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../shared/lib/selectors/accounts';
import {
  getNetworkConfigurationsByChainId,
  getProviderConfig,
} from '../../shared/lib/selectors/networks';
import { CHAIN_ID_TO_RPC_URL_MAP } from '../../shared/constants/network';
import { SECOND } from '../../shared/constants/time';
import { isEqualCaseInsensitive } from '../../shared/lib/string-utils';
import { useEqualityCheck } from './useEqualityCheck';

/**
 * Adapts an ethers `JsonRpcProvider` to the minimal EIP-1193 surface that
 * `eth-token-tracker` requires.
 *
 * @param {string} rpcUrl - The RPC endpoint URL.
 * @returns {{ request: (args: { method: string, params?: unknown[] }) => Promise<unknown> }}
 */
function createTokenTrackerProvider(rpcUrl) {
  const provider = new JsonRpcProvider(rpcUrl);
  return {
    request: ({ method, params = [] }) => provider.send(method, params),
  };
}

function useProvider(chainId = null) {
  const { chainId: selectedChainId, rpcUrl } = useSelector(getProviderConfig);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const chainIdToUse = chainId ?? selectedChainId;

  const rpcToUse = useMemo(() => {
    if (!chainId || chainId === selectedChainId) {
      return rpcUrl;
    }

    const networkConfig = networkConfigurationsByChainId?.[chainId];
    const url =
      networkConfig?.rpcEndpoints?.[networkConfig.defaultRpcEndpointIndex ?? 0]
        ?.url;

    if (url && !url.includes('{infuraProjectId}')) {
      return url;
    }
    return CHAIN_ID_TO_RPC_URL_MAP[chainId];
  }, [chainId, selectedChainId, networkConfigurationsByChainId, rpcUrl]);

  const provider = useMemo(() => {
    // Default behavior: no explicit chain (or the selected one) uses the global
    // provider, so existing callers see no change.
    if (!chainId || chainId === selectedChainId) {
      return global.ethereumProvider;
    }

    // A token on a different chain (e.g. a dapp-suggested token) must be
    // queried on that chain's RPC endpoint, not the wallets selected network.
    return rpcToUse
      ? createTokenTrackerProvider(rpcToUse)
      : global.ethereumProvider;
  }, [chainId, selectedChainId, rpcToUse]);

  return { provider, chainId: chainIdToUse, rpcUrl: rpcToUse };
}

export function useTokenTracker({
  tokens,
  address,
  includeFailedTokens = false,
  hideZeroBalanceTokens = false,
  chainId: inputChainId = null,
}) {
  const { provider, chainId, rpcUrl } = useProvider(inputChainId);
  const { address: selectedAddress } = useSelector(
    getSelectedInternalAccount,
    shallowEqual,
  );

  const userAddress = address ?? selectedAddress;

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
        const additionalTokenData = memoizedTokens.find((t) =>
          isEqualCaseInsensitive(t.address, token.address),
        );
        return {
          ...token,
          isERC721: additionalTokenData?.isERC721,
          image: additionalTokenData?.image,
        };
      });
      setTokensWithBalances(matchingTokensWithIsERC721Flag);
      setLoading(false);
      setError(null);
    },
    [hideZeroBalanceTokens, memoizedTokens],
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
        provider,
        tokens: tokenList,
        includeFailedTokens,
        pollingInterval: SECOND * 8,
        balanceDecimals: 5,
      });

      tokenTracker.current.on('update', updateBalances);
      tokenTracker.current.on('error', showError);
      tokenTracker.current.updateBalances();
    },
    [updateBalances, includeFailedTokens, showError, teardownTracker, provider],
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
    // 2. rpc url is changd,
    // 3. userAddress is changed,
    // 4. token list is updated and not equal to previous list
    // in any of these scenarios, we should indicate to the user that their token
    // values are in the process of updating by setting loading state.
    setLoading(true);

    if (!userAddress || chainId === undefined || !provider) {
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
    rpcUrl,
    memoizedTokens,
    updateBalances,
    buildTracker,
    provider,
  ]);

  return { loading, tokensWithBalances, error };
}
