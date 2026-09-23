import {
  trace,
  endTrace,
  TraceName,
  TraceOperation,
  getPerformanceTimestamp,
} from '../../../shared/lib/trace';
import { submitRequestToBackground } from '../../store/background-connection';

type LifecycleContext =
  | 'cold_process'
  | 'warm'
  | 'background_resume'
  | 'unknown';
export type PerpsEntrySurface = 'home' | 'market_list';
export type PerpsEntryVariant = 'empty' | 'position' | 'order';
export type PerpsEntryEndReason =
  | 'generation_changed'
  | 'live_rows_committed'
  | 'timeout'
  | 'unmounted';

const getEntryTraceName = (surface: PerpsEntrySurface): TraceName =>
  surface === 'home'
    ? TraceName.PerpsEntryToLiveMarketList
    : TraceName.PerpsMarketListView;

// Mobile's shared telemetry schema uses this tag across Perps operations.
export const PERPS_LIFECYCLE_TAG = 'lifecycle_context';

const ENTRY_TIMEOUT_MS = 30_000;
let resumed = false;
let pendingEntry:
  | {
      id: string;
      surface: PerpsEntrySurface;
      timer: ReturnType<typeof setTimeout>;
    }
  | undefined;

let cachedLifecycle: LifecycleContext | undefined;
let lifecycleRequest: Promise<void> | undefined;

/**
 * Prime the lifecycle cache once after the background RPC connection is ready.
 * @returns Completion of the bounded lookup, shared by concurrent callers.
 */
export function primePerpsLifecycleContext(): Promise<void> {
  lifecycleRequest ??= new Promise<LifecycleContext>((resolve) => {
    const timeout = setTimeout(() => resolve('unknown'), 1_000);
    submitRequestToBackground('perpsGetLifecycleContext', [])
      .then((context: unknown) => {
        resolve(
          context === 'cold_process' || context === 'warm'
            ? context
            : 'unknown',
        );
      })
      .catch(() => resolve('unknown'))
      .finally(() => clearTimeout(timeout));
  }).then((context) => {
    // Foreground settlement may have made the session warm during the lookup.
    cachedLifecycle ??= context;
  });
  return lifecycleRequest;
}

/**
 * Read lifecycle synchronously at the operation boundary, retaining resume state.
 * @returns Unknown until priming completes, otherwise the cached lifecycle.
 */
export function readPerpsLifecycleContext(): LifecycleContext {
  return resumed ? 'background_resume' : (cachedLifecycle ?? 'unknown');
}

/** Mirror shared-process foreground settlement without consuming this UI's resume. */
export function markPerpsLifecycleWarm(): void {
  cachedLifecycle = 'warm';
}

let wasHidden = false;

function updatePerpsLifecycle(): void {
  if (document.visibilityState === 'hidden') {
    wasHidden = true;
  } else if (wasHidden) {
    wasHidden = false;
    resumed = true;
  }
}

/** Observe visibility for this UI document, the Extension counterpart of AppState. */
export function observePerpsLifecycle(): () => void {
  wasHidden = document.visibilityState === 'hidden';
  document.addEventListener('visibilitychange', updatePerpsLifecycle);
  return () =>
    document.removeEventListener('visibilitychange', updatePerpsLifecycle);
}

/**
 * Start at view mount, matching the documented Mobile screen boundary.
 *
 * @param surface - Destination that will render the market rows.
 * @returns The unique entry ID.
 */
export function startPerpsEntry(surface: PerpsEntrySurface): string {
  // A child effect may receive visibilitychange before the wallet-root listener.
  updatePerpsLifecycle();
  if (pendingEntry?.surface === surface) {
    return pendingEntry.id;
  }
  if (pendingEntry) {
    endPerpsEntry(pendingEntry.id, false, 'generation_changed');
  }
  const id = crypto.randomUUID();
  try {
    trace({
      name: getEntryTraceName(surface),
      id,
      op: TraceOperation.PerpsOperation,
      tags: {
        feature: 'perps',
        [PERPS_LIFECYCLE_TAG]: readPerpsLifecycleContext(),
        surface,
      },
    });
  } catch (error) {
    console.debug('[PerpsEntry] Trace start failed', error);
  }
  pendingEntry = {
    id,
    surface,
    timer: setTimeout(
      () => endPerpsEntry(id, false, 'timeout'),
      ENTRY_TIMEOUT_MS,
    ),
  };
  return id;
}

/**
 * Finish only the owning entry. Failed or abandoned entries never consume cold.
 *
 * @param id - Entry identity.
 * @param success - Whether current-session market rows committed.
 * @param reason - Abandonment reason.
 * @param variant - Loaded Home content, using the Mobile dashboard values.
 */
export function endPerpsEntry(
  id: string,
  success: boolean,
  reason: PerpsEntryEndReason,
  variant?: PerpsEntryVariant,
): void {
  if (pendingEntry?.id !== id) {
    return;
  }
  clearTimeout(pendingEntry.timer);
  const { surface } = pendingEntry;
  const timestamp = getPerformanceTimestamp();
  try {
    endTrace({
      name: getEntryTraceName(surface),
      timestamp,
      id,
      data: success
        ? { success, ...(variant ? { variant } : {}) }
        : { success, reason },
    });
  } catch (error) {
    console.debug('[PerpsEntry] Trace end failed', error);
  }
  pendingEntry = undefined;
  if (success) {
    resumed = false;
    markPerpsLifecycleWarm();
    // Only committed foreground rows consume cold, independently of preload.
    submitRequestToBackground('perpsMarkForegroundSettled', []).catch(
      (error: unknown) =>
        console.debug('[PerpsEntry] Settlement failed', error),
    );
  }
}
