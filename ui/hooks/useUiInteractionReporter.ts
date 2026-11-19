import { useEffect, useRef } from 'react';
import { useDispatch } from '../store/hooks';
import { recordUiInteraction } from '../store/actions';

/** At most one background report per second per UI surface. */
const UI_INTERACTION_THROTTLE_MS = 1000;

/**
 * Reports trusted clicks and key presses to the background so sampled state
 * writes can include `msSinceLastUiInteraction`.
 *
 * Listeners use the capture phase so a component calling `stopPropagation`
 * still counts. The first event in each one-second window is forwarded.
 */
export function useUiInteractionReporter(): void {
  const dispatch = useDispatch();
  const lastReportedAtRef = useRef(0);

  useEffect(() => {
    const onInteraction = (event: Event) => {
      if (!event.isTrusted) {
        return;
      }

      const now = Date.now();
      if (now - lastReportedAtRef.current < UI_INTERACTION_THROTTLE_MS) {
        return;
      }

      lastReportedAtRef.current = now;
      dispatch(recordUiInteraction());
    };

    const listenerOptions: AddEventListenerOptions = {
      capture: true,
      passive: true,
    };
    document.addEventListener('pointerdown', onInteraction, listenerOptions);
    document.addEventListener('keydown', onInteraction, listenerOptions);

    return () => {
      document.removeEventListener(
        'pointerdown',
        onInteraction,
        listenerOptions,
      );
      document.removeEventListener('keydown', onInteraction, listenerOptions);
    };
  }, [dispatch]);
}
