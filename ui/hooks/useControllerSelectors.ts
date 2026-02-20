import { useMemo } from 'react';
import { useControllerState } from './useControllerState';

/**
 * Whether the wallet is currently unlocked (vault decrypted).
 *
 * Replaces: `useSelector((s) => s.metamask.isUnlocked)`
 */
export function useIsUnlocked(): boolean {
  return useControllerState('KeyringController', (s) => Boolean(s.isUnlocked));
}

/**
 * The fiat currency code shown in asset value columns (e.g. `'usd'`).
 *
 * Replaces: `useSelector((s) => s.metamask.currentCurrency)`
 */
export function useCurrentCurrency(): string {
  return useControllerState('CurrencyRateController', (s) => s.currentCurrency);
}

/**
 * Tokens for the active account on the active chain.
 *
 * Demonstrates cross-controller reads: three independent subscriptions each
 * re-render only when their slice changes; the final derivation is memoized.
 *
 * Replaces: `useSelector(getTokens)` which read from flat `state.metamask`.
 */
export function useTokens(): unknown[] {
  const allTokens = useControllerState('TokensController', (s) => s.allTokens);

  const selectedAddress = useControllerState('AccountsController', (s) => {
    const selected = s.internalAccounts?.selectedAccount;
    return selected
      ? s.internalAccounts?.accounts?.[selected]?.address
      : undefined;
  });

  const chainId = useControllerState('NetworkController', (s) => {
    const networkClientId = s.selectedNetworkClientId;
    const networkConfig =
      s.networkConfigurationsByChainId ?? s.networksMetadata ?? {};

    for (const [cid, config] of Object.entries(networkConfig)) {
      if (
        config &&
        typeof config === 'object' &&
        'rpcEndpoints' in config &&
        Array.isArray((config as Record<string, unknown[]>).rpcEndpoints) &&
        (config as Record<string, unknown[]>).rpcEndpoints.some(
          (ep: unknown) =>
            ep &&
            typeof ep === 'object' &&
            (ep as Record<string, unknown>).networkClientId === networkClientId,
        )
      ) {
        return cid;
      }
    }
    return undefined;
  });

  return useMemo(
    () =>
      (allTokens as Record<string, Record<string, unknown[]>>)?.[
        chainId as string
      ]?.[selectedAddress as string] ?? [],
    [allTokens, chainId, selectedAddress],
  );
}
