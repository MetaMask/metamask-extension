import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { AccountState } from '@metamask/perps-controller';

import {
  coalesceBackgroundRequest,
  invalidateCoalescedRequest,
} from '../../../../hooks/perps/coalesceBackgroundRequest';
import {
  isFinitePerpsTotal,
  UNKNOWN_BALANCE,
} from '../../../../hooks/perps/perpsBalance';
import { getSelectedEvmInternalAccount } from '../../../../selectors';
import { getInternalAccounts } from '../../../../selectors/accounts';
import { getAllAccountGroups } from '../../../../selectors/multichain-accounts/account-tree';
import { selectPerpsCachedUserData } from '../../../../selectors/perps-controller';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';

/** Cap parallel HL standalone reads so a large account list does not 429. */
const STANDALONE_FETCH_CONCURRENCY = 2;

/** Retry once when the first standalone read is unresolved. */
const STANDALONE_FETCH_MAX_ATTEMPTS = 2;

export type SubAccountInfo = {
  id: string;
  name: string;
  spendableBalance: string;
  withdrawableBalance: string;
  totalBalance: string;
};

type UsePerpsSubAccountsReturn = {
  subAccounts: SubAccountInfo[];
  selectedSubAccount: SubAccountInfo | null;
};

type BalanceSource = 'standalone' | 'connected';

type PerpsBalance = {
  spendableBalance: string;
  withdrawableBalance: string;
  totalBalance: string;
};

type StoredBalance = PerpsBalance & { source: BalanceSource };

function toPerpsBalance(state: AccountState): PerpsBalance {
  return {
    spendableBalance:
      state.spendableBalance ?? UNKNOWN_BALANCE.spendableBalance,
    withdrawableBalance:
      state.withdrawableBalance ?? UNKNOWN_BALANCE.withdrawableBalance,
    totalBalance: state.totalBalance ?? UNKNOWN_BALANCE.totalBalance,
  };
}

function sourceRank(source: BalanceSource): number {
  // Connected/cached snapshots include Unified spot-fold and HIP-3; standalone
  // REST can report a fake $0 for the same account.
  return source === 'connected' ? 1 : 0;
}

function mergeFetchedBalance(
  previous: StoredBalance | undefined,
  incoming: StoredBalance,
): StoredBalance {
  const previousResolved =
    previous && isFinitePerpsTotal(previous.totalBalance) ? previous : null;
  const incomingResolved = isFinitePerpsTotal(incoming.totalBalance)
    ? incoming
    : null;

  if (previousResolved && incomingResolved) {
    if (
      sourceRank(incomingResolved.source) !==
      sourceRank(previousResolved.source)
    ) {
      return sourceRank(incomingResolved.source) >
        sourceRank(previousResolved.source)
        ? incomingResolved
        : previousResolved;
    }
    // Same source: the newer read wins, including genuine decreases.
    return incomingResolved;
  }
  if (incomingResolved) {
    return incomingResolved;
  }
  if (previousResolved) {
    return previousResolved;
  }
  return { ...UNKNOWN_BALANCE, source: incoming.source };
}

/**
 * Run `mapper` over `items` with at most `concurrency` in flight.
 *
 * @param items - Inputs to map.
 * @param concurrency - Max parallel workers.
 * @param mapper - Async mapper.
 * @returns Mapped results in input order.
 */
async function mapPool<TItem, TResult>(
  items: TItem[],
  concurrency: number,
  mapper: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results: TResult[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

function standaloneCacheKey(address: string): string {
  return `perpsGetAccountState|standalone|${address.toLowerCase()}`;
}

const UNRESOLVED_STANDALONE: StoredBalance = {
  ...UNKNOWN_BALANCE,
  source: 'standalone',
};

async function fetchStandaloneBalanceOnce(
  address: string,
): Promise<StoredBalance> {
  const userAddress = address.toLowerCase();

  const state = await coalesceBackgroundRequest<AccountState | null>(
    standaloneCacheKey(userAddress),
    () =>
      submitRequestToBackground<AccountState | null>('perpsGetAccountState', [
        {
          standalone: true,
          userAddress,
        },
      ]),
  );

  if (!state || !isFinitePerpsTotal(state.totalBalance ?? '')) {
    // Null or HL sentinel ("--") — treat as unresolved so the UI keeps a
    // skeleton instead of a fake $0, and the caller can retry.
    invalidateCoalescedRequest(standaloneCacheKey(userAddress));
    return UNRESOLVED_STANDALONE;
  }

  return { ...toPerpsBalance(state), source: 'standalone' };
}

async function fetchStandaloneBalance(address: string): Promise<StoredBalance> {
  let last: StoredBalance = UNRESOLVED_STANDALONE;

  for (let attempt = 0; attempt < STANDALONE_FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) {
        invalidateCoalescedRequest(standaloneCacheKey(address));
      }

      last = await fetchStandaloneBalanceOnce(address);
      if (isFinitePerpsTotal(last.totalBalance)) {
        return last;
      }
    } catch {
      invalidateCoalescedRequest(standaloneCacheKey(address));
      last = UNRESOLVED_STANDALONE;
    }
  }

  return last;
}

/**
 * Connected (non-standalone) read for the selected EVM account. This is the
 * same path the Perps tab uses, including Unified spot-fold and HIP-3 DEXs.
 * Standalone REST for that address can report `$0` while this path does not.
 *
 * `perpsGetAccountState([])` returns the controller's currently connected
 * account, not necessarily `address`. Callers must pass the cache-entry
 * address after the read so a mismatched identity is discarded.
 *
 * @param address - Selected EVM account the result must belong to.
 * @param getCachedAddress - Address on the active provider cache entry.
 * @returns The connected balance when resolved and verified, otherwise null.
 */
async function fetchConnectedBalance(
  address: string,
  getCachedAddress: () => string | undefined,
): Promise<StoredBalance | null> {
  try {
    const expectedAddress = address.toLowerCase();
    const state = await coalesceBackgroundRequest<AccountState | null>(
      `perpsGetAccountState|connected|${expectedAddress}`,
      () =>
        submitRequestToBackground<AccountState | null>(
          'perpsGetAccountState',
          [],
        ),
    );
    if (!state || !isFinitePerpsTotal(state.totalBalance ?? '')) {
      return null;
    }

    const cachedAddress = getCachedAddress()?.toLowerCase();
    if (cachedAddress && cachedAddress !== expectedAddress) {
      return null;
    }

    return { ...toPerpsBalance(state), source: 'connected' };
  } catch {
    return null;
  }
}

/**
 * Lists EVM accounts as Perps destination accounts, with balances from
 * `PerpsController.getAccountState`. Mirrors mobile `usePerpsSubAccounts`.
 *
 * @returns Perps sub-accounts and the one matching `txParams.from`, or null
 * when `from` is missing or unmatched.
 */
export function usePerpsSubAccounts(): UsePerpsSubAccountsReturn {
  const transactionMeta = useTransactionMetadataRequest();
  const fromAddress = transactionMeta?.txParams?.from;
  const allAccounts = useSelector(getInternalAccounts);
  const accountGroups = useSelector(getAllAccountGroups);
  const selectedEvmAccount = useSelector(getSelectedEvmInternalAccount);
  const cachedUserData = useSelector(selectPerpsCachedUserData);
  const [balances, setBalances] = useState<Record<string, StoredBalance>>({});

  const selectedEvmAddress = selectedEvmAccount?.address?.toLowerCase();
  const cachedUserAddress = cachedUserData?.address;
  const cachedAccountState = cachedUserData?.accountState;

  const evmAccounts = useMemo(
    () => allAccounts.filter((account) => isEvmAccountType(account.type)),
    [allAccounts],
  );

  useEffect(() => {
    if (evmAccounts.length === 0) {
      return undefined;
    }

    let cancelled = false;

    // Progressive updates with limited concurrency so accounts that resolve
    // first show equity, without flooding HyperLiquid's per-IP weight budget.
    mapPool(evmAccounts, STANDALONE_FETCH_CONCURRENCY, async (account) => {
      const addressKey = account.address.toLowerCase();
      try {
        const balance = await fetchStandaloneBalance(account.address);
        if (cancelled) {
          return;
        }
        setBalances((prev) => ({
          ...prev,
          [addressKey]: mergeFetchedBalance(prev[addressKey], balance),
        }));
      } catch {
        if (cancelled) {
          return;
        }
        setBalances((prev) => ({
          ...prev,
          [addressKey]: mergeFetchedBalance(
            prev[addressKey],
            UNRESOLVED_STANDALONE,
          ),
        }));
      }
    }).catch(() => {
      // Individual account handlers already update state; ignore pool errors.
    });

    return () => {
      cancelled = true;
    };
  }, [evmAccounts]);

  useEffect(() => {
    if (!selectedEvmAddress) {
      return undefined;
    }

    let cancelled = false;
    const connectedAddress = selectedEvmAddress;
    const cachedAddressAtRequest = cachedUserAddress;

    fetchConnectedBalance(connectedAddress, () => cachedAddressAtRequest)
      .then((connectedBalance) => {
        if (cancelled || !connectedBalance) {
          return;
        }
        setBalances((prev) => ({
          ...prev,
          [connectedAddress]: mergeFetchedBalance(
            prev[connectedAddress],
            connectedBalance,
          ),
        }));
      })
      .catch(() => {
        // Standalone results (if any) remain; ignore connected failure.
      });

    return () => {
      cancelled = true;
    };
  }, [cachedUserAddress, selectedEvmAddress]);

  const subAccounts: SubAccountInfo[] = useMemo(() => {
    const verifiedCacheState =
      selectedEvmAddress &&
      cachedUserAddress?.toLowerCase() === selectedEvmAddress &&
      cachedAccountState &&
      isFinitePerpsTotal(cachedAccountState.totalBalance ?? '')
        ? cachedAccountState
        : null;

    return evmAccounts.map((account) => {
      const group = accountGroups.find(({ accounts }) =>
        accounts.includes(account.id),
      );
      const displayName = group?.metadata?.name || account.address;
      const addressKey = account.address.toLowerCase();
      const fetched = balances[addressKey];
      let balance: PerpsBalance = fetched ?? { ...UNKNOWN_BALANCE };

      // Overlay a verified connected-cache snapshot only when the fetched
      // value is standalone or still unresolved. A connected REST read of
      // the same account is kept so a fresher (possibly lower) total wins.
      if (
        verifiedCacheState &&
        addressKey === selectedEvmAddress &&
        (!fetched ||
          !isFinitePerpsTotal(fetched.totalBalance) ||
          fetched.source === 'standalone')
      ) {
        balance = toPerpsBalance(verifiedCacheState);
      }

      return {
        id: account.address,
        name: `${displayName} (Perps)`,
        spendableBalance: balance.spendableBalance,
        withdrawableBalance: balance.withdrawableBalance,
        totalBalance: balance.totalBalance,
      };
    });
  }, [
    accountGroups,
    balances,
    cachedAccountState,
    cachedUserAddress,
    evmAccounts,
    selectedEvmAddress,
  ]);

  const selectedSubAccount = useMemo(() => {
    if (!fromAddress) {
      return null;
    }

    const fromAddressLower = fromAddress.toLowerCase();
    return (
      subAccounts.find(
        (account) => account.id.toLowerCase() === fromAddressLower,
      ) ?? null
    );
  }, [fromAddress, subAccounts]);

  return {
    subAccounts,
    selectedSubAccount,
  };
}
