import { useEffect, useRef, type MutableRefObject } from 'react';
import { Json } from '@metamask/utils';
import { PERPS_EVENT_PROPERTY } from '../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { usePerpsEventTracking } from './usePerpsEventTracking';

/**
 * Emit an `abandon_order` PERPS_UI_INTERACTION when the user leaves a trade
 * surface without committing.
 *
 * Fires when the surface stops being active — a route page unmounting, a modal
 * closing (`active` going false) — and when the page is hidden (`pagehide`:
 * the extension popup being dismissed never unmounts React). It does not fire
 * once the caller marks the flow committed via `hasCommittedRef`. A one-shot
 * guard prevents a double emission when `pagehide` and teardown both run.
 *
 * @param options
 * @param options.getAbandonProperties - Reads the latest form state at emit
 * time; the caller keeps this stable and refreshes a ref each render.
 * @param options.hasCommittedRef - Set to true by the caller once the order is
 * submitted, so a committed flow is never reported as abandoned. A caller whose
 * surface is reused across sessions (a modal that stays mounted) must reset it
 * to false when the surface reopens, otherwise one commit suppresses every
 * later abandonment.
 * @param options.active - Whether the surface is currently shown. Pages leave
 * this true; modals that stay mounted while closed pass their open state.
 */
/**
 * Abandon emits deferred by a teardown, keyed by the caller's commit ref (stable
 * across a StrictMode remount of the same component instance). A setup that
 * finds an entry here cancels it: that teardown was the probe, not an exit.
 */
const pendingAbandonEmits = new WeakMap<
  MutableRefObject<boolean>,
  { timeoutId: ReturnType<typeof setTimeout>; startedAt: number }
>();

export function usePerpsAbandonOrderTracking({
  getAbandonProperties,
  hasCommittedRef,
  active = true,
}: {
  getAbandonProperties: () => Record<string, Json>;
  hasCommittedRef: MutableRefObject<boolean>;
  active?: boolean;
}): void {
  const { track } = usePerpsEventTracking();
  // Stable refs so the effect below runs on activation changes only: re-running
  // it would restart the timer and emit on every render that changes `track`.
  const trackRef = useRef(track);
  trackRef.current = track;
  const getAbandonPropertiesRef = useRef(getAbandonProperties);
  getAbandonPropertiesRef.current = getAbandonProperties;

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    // A teardown that is immediately followed by a setup on the same instance
    // is React StrictMode's development-only probe, not the user leaving. Cancel
    // the scheduled emit in that case; a real exit has no follow-up setup, so
    // the deferred emit runs on the next macrotask.
    const pending = pendingAbandonEmits.get(hasCommittedRef);
    if (pending !== undefined) {
      clearTimeout(pending.timeoutId);
      pendingAbandonEmits.delete(hasCommittedRef);
    }
    // Resuming the probed session keeps its original clock so the StrictMode
    // remount does not reset `time_on_screen_ms`.
    const startedAt = pending?.startedAt ?? Date.now();
    let emitted = false;

    const emitAbandon = () => {
      if (hasCommittedRef.current || emitted) {
        return;
      }
      emitted = true;
      trackRef.current(MetaMetricsEventName.PerpsUiInteraction, {
        ...getAbandonPropertiesRef.current(),
        [PERPS_EVENT_PROPERTY.TIME_ON_SCREEN_MS]: Date.now() - startedAt,
      });
    };

    window.addEventListener('pagehide', emitAbandon);
    return () => {
      window.removeEventListener('pagehide', emitAbandon);
      // `pagehide` already emitted (popup dismissal): nothing left to defer.
      // A commit landing after this point is still honoured — `emitAbandon`
      // re-reads the flag when the deferred fire runs.
      if (emitted) {
        return;
      }
      const timeoutId = setTimeout(() => {
        pendingAbandonEmits.delete(hasCommittedRef);
        emitAbandon();
      }, 0);
      pendingAbandonEmits.set(hasCommittedRef, { timeoutId, startedAt });
    };
  }, [active, hasCommittedRef]);
}
