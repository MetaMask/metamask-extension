import { isObject } from '@metamask/utils';
import type { MetaMaskStorageStructure } from '../../../../shared/lib/stores/base-store';
import {
  endTrace,
  getPerformanceTimestamp,
  trace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';
import { persistenceManager } from '../setup-initial-state-hooks';

type StateLoadData = Record<string, number | string | boolean>;

function countAccounts(data: Record<string, unknown>): number {
  const accountsController = data.AccountsController;
  if (
    !isObject(accountsController) ||
    !isObject(accountsController.internalAccounts) ||
    !isObject(accountsController.internalAccounts.accounts)
  ) {
    return 0;
  }
  return Object.keys(accountsController.internalAccounts.accounts).length;
}

/**
 * Counts assets from `AssetsController` for the State Load size proxy.
 *
 * Named `asset_count` rather than `token_count` because Sentry's default
 * server-side scrubbing drops fields whose names contain `token`.
 *
 * @param data - Persisted controller state.
 * @returns Asset count across accounts.
 */
function countAssets(data: Record<string, unknown>): number {
  const assetsController = data.AssetsController;
  if (!isObject(assetsController)) {
    return 0;
  }

  const assetsBalance = isObject(assetsController.assetsBalance)
    ? assetsController.assetsBalance
    : {};
  const customAssets = isObject(assetsController.customAssets)
    ? assetsController.customAssets
    : {};

  const accountIds = new Set([
    ...Object.keys(assetsBalance),
    ...Object.keys(customAssets),
  ]);

  let count = 0;
  for (const accountId of accountIds) {
    const assetIds = new Set<string>();

    const balancesByAsset = assetsBalance[accountId];
    if (isObject(balancesByAsset)) {
      for (const assetId of Object.keys(balancesByAsset)) {
        assetIds.add(assetId);
      }
    }

    const custom = customAssets[accountId];
    if (Array.isArray(custom)) {
      for (const assetId of custom) {
        if (typeof assetId === 'string') {
          assetIds.add(assetId);
        }
      }
    }

    count += assetIds.size;
  }

  return count;
}

/**
 * Builds the storage keys and in-memory values used for size measurement.
 *
 * Values are only used when `getBytesInUse` is unavailable so we can fall
 * back to a JSON string-length estimate without another storage round trip.
 *
 * @param result - Persisted state returned by the storage read.
 * @returns Keys to measure and a map of those keys to their values.
 */
function getStorageEntries(result: MetaMaskStorageStructure): {
  keys: string[];
  valuesByKey: Record<string, unknown>;
} {
  if (result.meta?.storageKind === 'split') {
    return {
      keys: [...Object.keys(result.data ?? {}), 'meta'],
      valuesByKey: {
        ...(result.data ?? {}),
        meta: result.meta,
      },
    };
  }

  return {
    keys: ['data', 'meta'],
    valuesByKey: {
      data: result.data,
      meta: result.meta,
    },
  };
}

/**
 * Reads persisted state inside a `State Load` span.
 *
 * The span is backdated to the read end time. Size is measured afterwards on a
 * macrotask, only for sampled spans, so boot can continue before any
 * `JSON.stringify` fallback (e.g. Firefox without `getBytesInUse`).
 *
 * @param read - Reads persisted state from storage.
 * @returns The result of `read`.
 */
export async function readPersistedStateWithTrace(
  read: () => Promise<MetaMaskStorageStructure | undefined>,
): Promise<MetaMaskStorageStructure | undefined> {
  const context = trace({
    name: TraceName.StateLoad,
    op: TraceOperation.StateRead,
    root: true,
  });
  const readStart = getPerformanceTimestamp();

  let result: MetaMaskStorageStructure | undefined;
  try {
    result = await read();
  } catch (error) {
    try {
      endTrace({
        name: TraceName.StateLoad,
        status: 'error',
        data: { 'state.load_failed': true },
      });
    } catch (traceError) {
      console.error('[State Load] failed to end trace', traceError);
    }
    throw error;
  }

  const readEnd = getPerformanceTimestamp();
  const stateData = isObject(result?.data) ? result.data : undefined;
  const data: StateLoadData = {
    'state.load_duration_ms': readEnd - readStart,
    'state.storage_kind': result?.meta?.storageKind ?? 'data',
    'state.is_empty': stateData === undefined,
    'state.account_count': stateData ? countAccounts(stateData) : 0,
    // Avoid `token` in the key: Sentry scrubbing drops those attribute names.
    'state.asset_count': stateData ? countAssets(stateData) : 0,
  };

  // Macrotask (not a floating microtask): boot resumes before getStoredBytes,
  // including its sync JSON estimate when getBytesInUse is unavailable.
  setTimeout(() => {
    (async () => {
      try {
        if (
          result &&
          (
            context as { isRecording?: () => boolean } | undefined
          )?.isRecording?.()
        ) {
          try {
            const { keys, valuesByKey } = getStorageEntries(result);
            const measurement = await persistenceManager.getStoredBytes(
              keys,
              valuesByKey,
            );
            if (measurement) {
              data['state.raw_size_bytes'] = measurement.bytes;
              data['state.size_measurement_source'] = measurement.source;
            }
          } catch {
            // Size measurement must not prevent ending the span.
          }
        }
      } finally {
        endTrace({ name: TraceName.StateLoad, timestamp: readEnd, data });
      }
    })().catch((error) => {
      // Measurement errors are handled above. This catches endTrace failures.
      console.error('[State Load] failed to end trace', error);
    });
  }, 0);

  return result;
}
