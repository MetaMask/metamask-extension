import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { AccountState } from '@metamask/perps-controller';

import {
  coalesceBackgroundRequest,
  invalidateCoalescedRequest,
} from '../../../../hooks/perps/coalesceBackgroundRequest';
import { getSelectedEvmInternalAccount } from '../../../../selectors';
import { getInternalAccounts } from '../../../../selectors/accounts';
import { getAllAccountGroups } from '../../../../selectors/multichain-accounts/account-tree';
import { selectPerpsCachedAccountState } from '../../../../selectors/perps-controller';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';

const ZERO_BALANCE = {
  spendableBalance: '0',
  withdrawableBalance: '0',
  totalBalance: '0',
} as const;

/** Placeholder until a balance fetch completes — picker shows a skeleton. */
const UNKNOWN_BALANCE = {
  spendableBalance: '',
  withdrawableBalance: '',
  totalBalance: '',
} as const;

/** Cap parallel HL standalone reads so a large account list does not 429. */
const STANDALONE_FETCH_CONCURRENCY = 2;

/** One retry after a rate-limit / empty-DEX sentinel before giving up. */
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

type PerpsBalance = {
  spendableBalance: string;
  withdrawableBalance: string;
  totalBalance: string;
};

/**
 * Whether `totalBalance` is a usable number (including real `$0`).
 * HL may return `"--"` / `"NaN"` when DEX queries fail under load.
 *
 * @param totalBalance - Raw totalBalance string from AccountState.
 * @returns True when the value parses to a finite number.
 */
export function isFinitePerpsTotal(totalBalance: string): boolean {
  const cleaned = String(totalBalance).replace(/[^0-9.-]/gu, '');
  if (
    cleaned === '' ||
    cleaned === '-' ||
    cleaned === '.' ||
    cleaned === '-.'
  ) {
    return false;
  }
  return Number.isFinite(Number.parseFloat(cleaned));
}

function toPerpsBalance(state: AccountState): PerpsBalance {
  return {
    spendableBalance: state.spendableBalance ?? '0',
    withdrawableBalance: state.withdrawableBalance ?? '0',
    totalBalance: state.totalBalance ?? '0',
  };
}

function numericTotal(balance: PerpsBalance): number {
  const parsed = Number.parseFloat(balance.totalBalance);
  return Number.isFinite(parsed) ? parsed : 0;
}

function preferRicherBalance(
  first: PerpsBalance,
  second: PerpsBalance,
): PerpsBalance {
  return numericTotal(second) > numericTotal(first) ? second : first;
}

function mergeFetchedBalance(
  previous: PerpsBalance | undefined,
  incoming: PerpsBalance,
): PerpsBalance {
  const previousResolved =
    previous && isFinitePerpsTotal(previous.totalBalance) ? previous : null;
  const incomingResolved = isFinitePerpsTotal(incoming.totalBalance)
    ? incoming
    : null;

  if (previousResolved && incomingResolved) {
    return preferRicherBalance(previousResolved, incomingResolved);
  }
  if (incomingResolved) {
    return incomingResolved;
  }
  if (previousResolved) {
    return previousResolved;
  }
  return { ...UNKNOWN_BALANCE };
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

async function fetchStandaloneBalanceOnce(
  address: string,
): Promise<PerpsBalance> {
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
    return { ...UNKNOWN_BALANCE };
  }

  return toPerpsBalance(state);
}

async function fetchStandaloneBalance(address: string): Promise<PerpsBalance> {
  let last: PerpsBalance = { ...UNKNOWN_BALANCE };

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
      last = { ...UNKNOWN_BALANCE };
    }
  }

  return last;
}

/**
 * Connected (non-standalone) read for the selected EVM account. This is the
 * same path the Perps tab uses, including Unified spot-fold and HIP-3 DEXs.
 * Standalone REST for that address can report `$0` while this path does not.
 */
async function fetchConnectedBalance(): Promise<PerpsBalance | null> {
  try {
    const state = await coalesceBackgroundRequest<AccountState | null>(
      'perpsGetAccountState|connected',
      () =>
        submitRequestToBackground<AccountState | null>(
          'perpsGetAccountState',
          [],
        ),
    );
    if (!state || !isFinitePerpsTotal(state.totalBalance ?? '')) {
      return null;
    }
    return toPerpsBalance(state);
  } catch {
    return null;
  }
}

/**
 * Lists EVM accounts as Perps destination accounts, with balances from
 * `PerpsController.getAccountState`. Mirrors mobile `usePerpsSubAccounts`.
 *
 * @returns Perps sub-accounts and the one matching `txParams.from`.
 */
export function usePerpsSubAccounts(): UsePerpsSubAccountsReturn {
  const transactionMeta = useTransactionMetadataRequest();
  const fromAddress = transactionMeta?.txParams?.from;
  const allAccounts = useSelector(getInternalAccounts);
  const accountGroups = useSelector(getAllAccountGroups);
  const selectedEvmAccount = useSelector(getSelectedEvmInternalAccount);
  const cachedAccountState = useSelector(selectPerpsCachedAccountState);
  const [balances, setBalances] = useState<Record<string, PerpsBalance>>({});

  const selectedEvmAddress = selectedEvmAccount?.address?.toLowerCase();

  const evmAccounts = useMemo(
    () => allAccounts.filter((account) => isEvmAccountType(account.type)),
    [allAccounts],
  );

  useEffect(() => {
    if (evmAccounts.length === 0) {
      return undefined;
    }

    let cancelled = false;
    const connectedAddress = selectedEvmAddress;

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
          [addressKey]: mergeFetchedBalance(prev[addressKey], UNKNOWN_BALANCE),
        }));
      }
    }).catch(() => {
      // Individual account handlers already update state; ignore pool errors.
    });

    if (connectedAddress) {
      fetchConnectedBalance()
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
    }

    return () => {
      cancelled = true;
    };
  }, [evmAccounts, selectedEvmAddress]);

  const subAccounts: SubAccountInfo[] = useMemo(
    () =>
      evmAccounts.map((account) => {
        const group = accountGroups.find(({ accounts }) =>
          accounts.includes(account.id),
        );
        const displayName = group?.metadata?.name || account.address;
        const addressKey = account.address.toLowerCase();
        // Prefer fetched balance; otherwise unknown (not $0) until load completes.
        let balance: PerpsBalance =
          addressKey in balances
            ? balances[addressKey]
            : { ...UNKNOWN_BALANCE };

        if (
          selectedEvmAddress &&
          addressKey === selectedEvmAddress &&
          cachedAccountState &&
          isFinitePerpsTotal(cachedAccountState.totalBalance ?? '')
        ) {
          balance = preferRicherBalance(
            isFinitePerpsTotal(balance.totalBalance) ? balance : ZERO_BALANCE,
            toPerpsBalance(cachedAccountState),
          );
        }

        return {
          id: account.address,
          name: `${displayName} (Perps)`,
          ...balance,
        };
      }),
    [
      accountGroups,
      balances,
      cachedAccountState,
      evmAccounts,
      selectedEvmAddress,
    ],
  );

  const selectedSubAccount = useMemo(() => {
    if (!fromAddress) {
      return subAccounts[0] ?? null;
    }

    const fromAddressLower = fromAddress.toLowerCase();
    return (
      subAccounts.find(
        (account) => account.id.toLowerCase() === fromAddressLower,
      ) ??
      subAccounts[0] ??
      null
    );
  }, [fromAddress, subAccounts]);

  return {
    subAccounts,
    selectedSubAccount,
  };
}
