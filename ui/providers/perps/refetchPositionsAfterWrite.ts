import type { Position } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../store/background-connection';
import { getPerpsStreamManager } from './PerpsStreamManager';

export const WS_WAIT_MS = 3_000;

/**
 * After a write mutation (edit margin, TP/SL, flip, close-all), wait for a
 * WebSocket positions push before falling back to a REST refetch.
 *
 * Pattern: subscribe to the positions channel and race a WS update against a
 * timeout.  If WS delivers within {@link WS_WAIT_MS}, use that data and skip
 * the REST call entirely.  Otherwise fall back to `perpsGetPositions` with
 * `skipCache: true`.
 *
 * @param options - Optional config.
 * @param options.clearOptimistic - If `true`, call `clearAllOptimisticTPSL()`
 * before pushing the snapshot (used by close-all where overrides are stale).
 */
export async function refetchPositionsAfterWrite({
  clearOptimistic = false,
}: { clearOptimistic?: boolean } = {}): Promise<void> {
  const manager = getPerpsStreamManager();

  const wsDelivered = await new Promise<boolean>((resolve) => {
    let settled = false;
    // subscribe() fires the cached value synchronously during the call.
    // We flip this flag after subscribe() returns so the handler can
    // distinguish the sync replay from a genuine new WS push.
    let syncPhaseDone = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        unsub();
        resolve(false);
      }
    }, WS_WAIT_MS);

    const unsub = manager.positions.subscribe(() => {
      if (!syncPhaseDone) {
        return;
      }
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        unsub();
        resolve(true);
      }
    });

    syncPhaseDone = true;
  });

  if (wsDelivered) {
    return;
  }

  try {
    const fresh = await submitRequestToBackground<Position[]>(
      'perpsGetPositions',
      [{ skipCache: true }],
    );
    if (clearOptimistic) {
      manager.clearAllOptimisticTPSL();
    }
    manager.pushPositionsWithOverrides(fresh);
  } catch {
    // REST fallback failed — WS will eventually catch up
  }
}
