import { useEffect } from 'react';
import log from 'loglevel';
import { submitRequestToBackground } from '../../store/background-connection';

const TRIGGER_UPGRADE_ACTION = 'MoneyAccountUpgradeService:triggerUpgrade';

/**
 * Kicks off the Money Account upgrade when a Money surface opens.
 *
 * Opening a Money surface is the user's signal of intent to use the feature
 * (the extension analog of mobile's focus-driven upgrade), so this fires
 * once per mount. The call is fire-and-forget: the background service owns
 * the bootstrap gate, per-address dedupe, and retry loop, so the run
 * survives the popup closing and re-triggering on every mount is cheap.
 *
 * @param options - Options.
 * @param options.enabled - Whether to fire, e.g. the money account
 * availability. Flipping to `true` after mount fires then.
 */
export function useTriggerMoneyUpgrade({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    submitRequestToBackground<void>('messengerCall', [
      TRIGGER_UPGRADE_ACTION,
      [],
    ]).catch((error) => {
      // The background never rethrows upgrade failures through the trigger;
      // this only catches a dropped connection, which the next mount retries.
      log.debug('Failed to trigger the money account upgrade', error);
    });
  }, [enabled]);
}
