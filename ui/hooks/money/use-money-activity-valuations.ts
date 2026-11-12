import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { chunk } from 'lodash';
import {
  VAULT_SHARE_VALUATIONS_MAX_TX_HASHES,
  type VaultRateResponse,
} from '@metamask/money-account-api-data-service';
import { hexToNumber, type Hex } from '@metamask/utils';
import { MINUTE } from '../../../shared/constants/time';
import { MoneyAccountApiDataServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import {
  readCachedVaultShareValuations,
  writeCachedVaultShareValuations,
} from '../../../shared/lib/money/vault-share-valuation-cache';
import {
  cacheEntriesFromResponse,
  entriesByIdentity,
  getVaultShareValuationCacheIdentity,
  getVaultShareVaultKey,
  type VaultShareToken,
  type VaultShareValuationCacheEntry,
} from '../../../shared/lib/money/vault-share-valuations';
import {
  annotateTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';
import { useMessenger } from '../useMessenger';
import type { RouteMessengerInstance } from '../../pages/money/messenger';
import type {
  AccountsApiActivity,
  AccountsApiDisplayAmount,
} from '../../pages/money/types/money-activity';
import {
  getApproximateVaultShareDisplayAmount,
  getHistoricalVaultShareDisplayAmount,
  getVaultShareValuationTarget,
  type VaultShareValuationTarget,
} from '../../pages/money/utils/vault-share-valuations';

const EMPTY_CACHE: VaultShareValuationCacheEntry[] = [];

type ValuationRequest = {
  chainId: number;
  chainIdHex: Hex;
  vaultAddresses: Hex[];
  txHashes: string[];
};

type ValuationBatchResult = {
  entries: VaultShareValuationCacheEntry[];
  failed: boolean;
};

type ValuationPage = {
  targets: VaultShareValuationTarget[];
  cached: VaultShareValuationCacheEntry[];
  cachedByIdentity: Map<string, VaultShareValuationCacheEntry>;
};

export type UseMoneyActivityValuationsOptions = {
  pageActivities: readonly (readonly AccountsApiActivity[])[];
  moneyAddress: string;
  vaultShareTokens: readonly VaultShareToken[];
  enabled: boolean;
};

export type UseMoneyActivityValuationsResult = {
  getDisplayAmount: (
    activity: AccountsApiActivity,
  ) => AccountsApiDisplayAmount | undefined;
  isSettling: boolean;
};

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function hasHistoricalValue(
  target: VaultShareValuationTarget,
  entries: ReadonlyMap<string, VaultShareValuationCacheEntry>,
): boolean {
  if (!target.identity) {
    return false;
  }
  return (
    getHistoricalVaultShareDisplayAmount(
      target.activity,
      entries.get(target.identity)?.valuations,
    ) !== undefined
  );
}

function usableEntries(
  targets: readonly VaultShareValuationTarget[],
  entries: readonly VaultShareValuationCacheEntry[],
): VaultShareValuationCacheEntry[] {
  const byIdentity = entriesByIdentity(entries);
  return [...byIdentity.values()].filter((entry) =>
    targets.some(
      (target) =>
        target.identity === getVaultShareValuationCacheIdentity(entry) &&
        hasHistoricalValue(target, byIdentity),
    ),
  );
}

function valuationRequests(
  missing: ReadonlyMap<number, Set<string>>,
  vaultShareTokens: readonly VaultShareToken[],
): ValuationRequest[] {
  const requests: ValuationRequest[] = [];
  for (const [chainId, hashes] of missing) {
    const configuredVaults = vaultShareTokens.filter(
      (token) => hexToNumber(token.chainId) === chainId,
    );
    const chainIdHex = configuredVaults[0]?.chainId;
    if (!chainIdHex) {
      continue;
    }
    for (const txHashes of chunk(
      [...hashes].sort(compareStrings),
      VAULT_SHARE_VALUATIONS_MAX_TX_HASHES,
    )) {
      requests.push({
        chainId,
        chainIdHex,
        vaultAddresses: configuredVaults.map((token) => token.address),
        txHashes,
      });
    }
  }
  return requests;
}

function missingHashesByChain(
  targets: readonly VaultShareValuationTarget[],
  entries: ReadonlyMap<string, VaultShareValuationCacheEntry>,
): Map<number, Set<string>> {
  const missing = new Map<number, Set<string>>();
  for (const target of targets) {
    if (!target.key || hasHistoricalValue(target, entries)) {
      continue;
    }
    const hashes = missing.get(target.key.chainId) ?? new Set<string>();
    hashes.add(target.key.txHash);
    missing.set(target.key.chainId, hashes);
  }
  return missing;
}

function requestParams(
  missing: ReadonlyMap<number, Set<string>>,
): { chainId: number; txHashes: string[] }[] {
  return [...missing.entries()]
    .map(([chainId, hashes]) => ({
      chainId,
      txHashes: [...hashes].sort(compareStrings),
    }))
    .sort((a, b) => a.chainId - b.chainId);
}

function combineValuationQueries(
  results: {
    data?: VaultShareValuationCacheEntry[];
    isFetching: boolean;
  }[],
): { entries: VaultShareValuationCacheEntry[]; isFetching: boolean } {
  return {
    entries: results.flatMap((result) => result.data ?? []),
    isFetching: results.some((result) => result.isFetching),
  };
}

function combineRateQueries(
  results: { data?: VaultRateResponse; isFetching: boolean }[],
): { data: (VaultRateResponse | undefined)[]; isFetching: boolean } {
  return {
    data: results.map((result) => result.data),
    isFetching: results.some((result) => result.isFetching),
  };
}

async function fetchValuationBatch({
  request,
  moneyAddress,
  targets,
  messenger,
}: {
  request: ValuationRequest;
  moneyAddress: string;
  targets: readonly VaultShareValuationTarget[];
  messenger: RouteMessengerInstance;
}): Promise<ValuationBatchResult> {
  try {
    const response = await messenger.call(
      'MoneyAccountApiDataService:fetchVaultShareValuations',
      moneyAddress,
      { txHashes: request.txHashes, chainId: request.chainId },
    );
    return {
      entries: usableEntries(
        targets,
        cacheEntriesFromResponse({
          response,
          account: moneyAddress,
          chainId: request.chainIdHex,
          vaultAddresses: request.vaultAddresses,
        }),
      ),
      failed: false,
    };
  } catch {
    return { entries: [], failed: true };
  }
}

export function useMoneyActivityValuations({
  pageActivities,
  moneyAddress,
  vaultShareTokens,
  enabled,
}: UseMoneyActivityValuationsOptions): UseMoneyActivityValuationsResult {
  const messenger = useMessenger<RouteMessengerInstance>();
  const [cache, setCache] = useState<{
    loaded: boolean;
    entries: VaultShareValuationCacheEntry[];
  }>({ loaded: false, entries: EMPTY_CACHE });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    readCachedVaultShareValuations()
      .then((entries) => {
        if (!cancelled) {
          setCache({ loaded: true, entries });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCache({ loaded: true, entries: EMPTY_CACHE });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, moneyAddress]);

  const cacheReady = !enabled || cache.loaded;

  const pages = useMemo(
    () =>
      pageActivities.map((activities): ValuationPage => {
        const targets = activities
          .map((activity) =>
            getVaultShareValuationTarget({
              activity,
              moneyAddress,
              vaultShareTokens,
            }),
          )
          .filter(
            (target): target is VaultShareValuationTarget =>
              target !== undefined,
          );
        const cached =
          enabled && cacheReady
            ? usableEntries(targets, cache.entries)
            : EMPTY_CACHE;
        return {
          targets,
          cached,
          cachedByIdentity: entriesByIdentity(cached),
        };
      }),
    [
      pageActivities,
      vaultShareTokens,
      moneyAddress,
      enabled,
      cacheReady,
      cache.entries,
    ],
  );

  const valuationState = useQueries({
    queries: pages.map((page, pageIndex) => {
      const missing = cacheReady
        ? missingHashesByChain(page.targets, page.cachedByIdentity)
        : new Map<number, Set<string>>();

      return {
        queryKey: [
          MoneyAccountApiDataServiceQueryKeys.FETCH_VAULT_SHARE_VALUATIONS,
          moneyAddress.toLowerCase(),
          requestParams(missing),
        ],
        enabled:
          enabled &&
          cacheReady &&
          moneyAddress !== '' &&
          page.targets.length > 0 &&
          missing.size > 0,
        initialData: page.cached,
        initialDataUpdatedAt: 0,
        staleTime: 0,
        retry: false,
        queryFn: () =>
          trace(
            {
              name: TraceName.MoneyActivityVaultShareValuationsFetch,
              op: TraceOperation.MoneyAccountDataFetch,
              /* eslint-disable @typescript-eslint/naming-convention -- Sentry trace attributes use snake_case */
              tags: { page_index: pageIndex },
              /* eslint-enable @typescript-eslint/naming-convention */
            },
            async (context) => {
              const entries = await readCachedVaultShareValuations();
              const requests = valuationRequests(
                missingHashesByChain(page.targets, entriesByIdentity(entries)),
                vaultShareTokens,
              );
              const batches = await Promise.all(
                requests.map((request) =>
                  fetchValuationBatch({
                    request,
                    moneyAddress,
                    targets: page.targets,
                    messenger,
                  }),
                ),
              );
              const newEntries = [
                ...entriesByIdentity(
                  batches.flatMap((batch) => batch.entries),
                ).values(),
              ];
              if (newEntries.length > 0) {
                await writeCachedVaultShareValuations(newEntries);
              }

              /* eslint-disable @typescript-eslint/naming-convention -- Sentry trace attributes use snake_case */
              annotateTrace(context, {
                requested_count: requests.reduce(
                  (count, request) => count + request.txHashes.length,
                  0,
                ),
                cache_hit_count: page.targets.filter((target) =>
                  hasHistoricalValue(target, page.cachedByIdentity),
                ).length,
                chunk_count: requests.length,
                failed_chunk_count: batches.filter((batch) => batch.failed)
                  .length,
              });
              /* eslint-enable @typescript-eslint/naming-convention */
              return usableEntries(page.targets, [...entries, ...newEntries]);
            },
          ),
      } as const;
    }),
    combine: combineValuationQueries,
  });

  const unresolvedVaultTokens = useMemo(() => {
    if (!cacheReady) {
      return [];
    }
    const unresolved = new Set<string>();
    for (const page of pages) {
      for (const target of page.targets) {
        if (!hasHistoricalValue(target, page.cachedByIdentity)) {
          unresolved.add(target.vaultKey);
        }
      }
    }
    return vaultShareTokens.filter((token) =>
      unresolved.has(getVaultShareVaultKey(token.chainId, token.address)),
    );
  }, [pages, vaultShareTokens, cacheReady]);

  const rateState = useQueries({
    queries: unresolvedVaultTokens.map((token) => ({
      queryKey: [
        MoneyAccountApiDataServiceQueryKeys.FETCH_VAULT_RATE,
        token.address,
        { chainId: hexToNumber(token.chainId) },
      ],
      queryFn: (): Promise<VaultRateResponse> =>
        messenger.call(
          'MoneyAccountApiDataService:fetchVaultRate',
          token.address,
          {
            chainId: hexToNumber(token.chainId),
          },
        ),
      enabled: enabled && cacheReady && moneyAddress !== '',
      staleTime: 5 * MINUTE,
      retry: false,
    })),
    combine: combineRateQueries,
  });

  const valuationsByIdentity = useMemo(() => {
    const map = entriesByIdentity(cache.entries);
    for (const entry of valuationState.entries) {
      map.set(getVaultShareValuationCacheIdentity(entry), entry);
    }
    return map;
  }, [cache.entries, valuationState.entries]);

  const ratesByVault = useMemo(() => {
    const map = new Map<string, VaultRateResponse>();
    unresolvedVaultTokens.forEach((token, index) => {
      const data = rateState.data[index];
      if (data) {
        map.set(getVaultShareVaultKey(token.chainId, token.address), data);
      }
    });
    return map;
  }, [rateState.data, unresolvedVaultTokens]);

  const getDisplayAmount = useCallback(
    (activity: AccountsApiActivity): AccountsApiDisplayAmount | undefined => {
      const target = getVaultShareValuationTarget({
        activity,
        moneyAddress,
        vaultShareTokens,
      });
      if (!enabled || !target) {
        return undefined;
      }

      const historical =
        target.identity === undefined
          ? undefined
          : getHistoricalVaultShareDisplayAmount(
              activity,
              valuationsByIdentity.get(target.identity)?.valuations,
            );
      if (historical) {
        return historical;
      }

      const rate = ratesByVault.get(target.vaultKey);
      if (!rate && rateState.isFetching) {
        return { type: 'pending' };
      }
      return getApproximateVaultShareDisplayAmount(activity, rate?.rate);
    },
    [
      enabled,
      moneyAddress,
      vaultShareTokens,
      valuationsByIdentity,
      ratesByVault,
      rateState.isFetching,
    ],
  );

  const isSettling =
    enabled &&
    pages.some((page) => page.targets.length > 0) &&
    (!cacheReady || valuationState.isFetching || rateState.isFetching);

  return { getDisplayAmount, isSettling };
}
