import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';

import { HYPERLIQUID_INFO_API_URL } from '../../../../../shared/constants/defi-referrals';
import getFetchWithTimeout from '../../../../../shared/lib/fetch-with-timeout';
import { TEN_SECONDS_IN_MILLISECONDS } from '../../../../../shared/lib/transactions-controller-utils';
import { getSelectedEvmInternalAccount } from '../../../../selectors';
import { selectPerpsIsTestnet } from '../../../../selectors/perps-controller';

// Session-scoped cache so repeated checks share one request per address.
const multiSigStatusByAddress = new Map<string, Promise<boolean>>();

export type PerpsWithdrawMultiSigCheckResult = {
  /** Resolves `true` when the account is a HyperLiquid multi-sig user. */
  checkIsMultiSigAccount: () => Promise<boolean>;
};

/**
 * Pre-flight check for the HyperLiquid multi-sig status of the selected
 * account.
 *
 * HyperLiquid rejects every single-signature action from an account that was
 * converted to a multi-sig user (`Multi-sig required`), so a withdrawal would
 * always fail at the final `sendAsset` step. MetaMask cannot produce
 * HyperLiquid multi-sig signatures, so the withdraw entry point blocks such
 * accounts up front instead of letting the withdrawal fail after submission.
 *
 * The status is pre-fetched on mount, so `checkIsMultiSigAccount` usually
 * resolves instantly when the user clicks Withdraw.
 */
export function usePerpsWithdrawMultiSigCheck(): PerpsWithdrawMultiSigCheckResult {
  // Perps withdraws settle to the EVM account, so resolve it directly instead
  // of the globally selected account, which may be non-EVM.
  const selectedAccount = useSelector(getSelectedEvmInternalAccount);
  const isTestnet = useSelector(selectPerpsIsTestnet);

  const address = selectedAccount?.address as Hex | undefined;

  // The endpoint is mainnet-only and multi-sig status differs per network, so
  // testnet mode (a debug toggle) skips the check and fails open.
  const shouldCheck = Boolean(address) && !isTestnet;

  useEffect(() => {
    if (shouldCheck && address) {
      isHyperliquidMultiSigUser(address);
    }
  }, [shouldCheck, address]);

  const checkIsMultiSigAccount = useCallback(() => {
    if (!shouldCheck || !address) {
      return Promise.resolve(false);
    }

    return isHyperliquidMultiSigUser(address);
  }, [shouldCheck, address]);

  return { checkIsMultiSigAccount };
}

function isHyperliquidMultiSigUser(address: Hex): Promise<boolean> {
  const cacheKey = address.toLowerCase();
  let status = multiSigStatusByAddress.get(cacheKey);

  if (!status) {
    // Fail open on any failure, including the fetch timeout: never block
    // withdrawals on a failed pre-flight check. The result is cached for the
    // session, so every consumer sees one stable answer per address.
    status = fetchIsMultiSigUser(address).catch(() => false);
    multiSigStatusByAddress.set(cacheKey, status);
  }

  return status;
}

async function fetchIsMultiSigUser(address: Hex): Promise<boolean> {
  const fetchWithTimeout = getFetchWithTimeout(TEN_SECONDS_IN_MILLISECONDS);

  const response = await fetchWithTimeout(HYPERLIQUID_INFO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'userToMultiSigSigners', user: address }),
  });

  if (!response.ok) {
    throw new Error(`HyperLiquid info request failed: ${response.status}`);
  }

  // Returns `{ authorizedUsers, threshold }` for multi-sig users, null
  // otherwise. Only block on a positively identified multi-sig config.
  const result = await response.json();
  return Array.isArray(result?.authorizedUsers);
}
