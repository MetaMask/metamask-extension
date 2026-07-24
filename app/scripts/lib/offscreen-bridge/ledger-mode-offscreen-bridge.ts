import browser from 'webextension-polyfill';
import {
  LedgerHandlerMode,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';
import { ENABLE_DMK_FEATURE_FLAG } from '../../../../shared/lib/hardware-wallets/feature-flags';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';
import { getBooleanFeatureFlag } from '../../../../shared/lib/remote-feature-flag-utils';

type RemoteFeatureFlagState = {
  remoteFeatureFlags?: Record<string, unknown>;
};

type LedgerModeController = {
  getLedgerMode: () => LedgerHandlerMode;
  controllerMessenger: {
    subscribe: (
      action: 'RemoteFeatureFlagController:stateChange',
      handler: (isDmkEnabled: boolean) => void,
      selector: (state: RemoteFeatureFlagState) => boolean,
    ) => void;
  };
};

/**
 * Sends a switchLedgerMode message to the offscreen document.
 * Failures are ignored because the offscreen may not be ready yet.
 *
 * @param mode - The Ledger handler mode to activate.
 */
export function sendSwitchLedgerModeMessage(mode: LedgerHandlerMode): void {
  try {
    // Fire-and-forget; offscreen may not be ready yet.
    browser.runtime.sendMessage({
      target: OffscreenCommunicationTarget.extension,
      event: OffscreenCommunicationEvents.switchLedgerMode,
      mode,
    });
  } catch {
    // noop
  }
}

/**
 * Pushes the initial Ledger handler mode to the offscreen document and
 * subscribes to remote feature flag changes so the offscreen can hot-swap.
 * The offscreen boots as Legacy by default; when DMK is enabled via the
 * remote feature flag we send a switchLedgerMode event to hot-swap.
 *
 * No-op on MV2 (no offscreen document).
 *
 * @param controller - Controller exposing getLedgerMode and messenger subscribe.
 */
export function setupLedgerModeOffscreenBridge(
  controller: LedgerModeController,
): void {
  if (!isManifestV3) {
    return;
  }

  sendSwitchLedgerModeMessage(controller.getLedgerMode());

  // When the `ledgerDmk` flag toggles, push a `switchLedgerMode` event to
  // the offscreen document so it can hot-swap the active Ledger handler.
  controller.controllerMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    (isDmkEnabled) => {
      sendSwitchLedgerModeMessage(
        isDmkEnabled ? LedgerHandlerMode.DMK : LedgerHandlerMode.Legacy,
      );
    },
    (state) =>
      getBooleanFeatureFlag(
        state.remoteFeatureFlags?.[ENABLE_DMK_FEATURE_FLAG],
        false,
      ),
  );
}
