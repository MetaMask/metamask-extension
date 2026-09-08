import {
  trace,
  endTrace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';

type LifecycleContext = 'cold_process' | 'warm' | 'background_resume';
export type PerpsEntrySurface = 'home' | 'market_list';
export type PerpsEntryVariant = 'empty' | 'position' | 'order';

const getEntryTraceName = (surface: PerpsEntrySurface): TraceName =>
  surface === 'home'
    ? TraceName.PerpsEntryToLiveMarketList
    : TraceName.PerpsMarketListView;

// Mobile's shared telemetry schema uses this tag across Perps operations.
export const PERPS_LIFECYCLE_TAG = 'lifecycle_context';

const ENTRY_TIMEOUT_MS = 30_000;
let lifecycleContext: LifecycleContext = 'cold_process';
let pendingEntry:
  | {
      id: string;
      surface: PerpsEntrySurface;
      timer: ReturnType<typeof setTimeout>;
    }
  | undefined;

/** Return Mobile's lifecycle classification without consuming the cold entry. */
export function getPerpsLifecycleContext(): LifecycleContext {
  return lifecycleContext;
}

let wasHidden = false;

function updatePerpsLifecycle(): void {
  if (document.visibilityState === 'hidden') {
    wasHidden = true;
    if (pendingEntry) {
      endPerpsEntry(pendingEntry.id, false, 'app_backgrounded');
    }
  } else if (wasHidden) {
    wasHidden = false;
    if (pendingEntry) {
      endPerpsEntry(pendingEntry.id, false, 'app_backgrounded');
    }
    lifecycleContext = 'background_resume';
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
  trace({
    name: getEntryTraceName(surface),
    id,
    op: TraceOperation.PerpsOperation,
    tags: {
      feature: 'perps',
      [PERPS_LIFECYCLE_TAG]: lifecycleContext,
      surface,
    },
  });
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
  reason: string,
  variant?: PerpsEntryVariant,
): void {
  if (pendingEntry?.id !== id) {
    return;
  }
  clearTimeout(pendingEntry.timer);
  endTrace({
    name: getEntryTraceName(pendingEntry.surface),
    id,
    data: success
      ? { success, ...(variant ? { variant } : {}) }
      : { success, reason },
  });
  pendingEntry = undefined;
  if (success) {
    lifecycleContext = 'warm';
  }
}
