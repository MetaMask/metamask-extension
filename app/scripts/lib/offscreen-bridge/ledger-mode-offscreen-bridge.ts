import browser from 'webextension-polyfill';
import {
  LedgerHandlerMode,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';
import { isDmkFeatureEnabled } from '../../../../shared/lib/hardware-wallets/feature-flags';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';

type RemoteFeatureFlagState = {
  remoteFeatureFlags?: Record<string, unknown>;
};

type LedgerModeController = {
  controllerMessenger: {
    call: (
      action: 'LegacyBackgroundApiService:getLedgerMode',
    ) => LedgerHandlerMode;
    subscribe: (
      action: 'RemoteFeatureFlagController:stateChange',
      handler: (isDmkEnabled: boolean) => void,
      selector: (state: RemoteFeatureFlagState) => boolean,
    ) => void;
  };
};

/**
 * Sends a switchLedgerMode message to the offscreen document.
 * Promise rejections are ignored because the offscreen may not be ready yet
 * (e.g. "Receiving end does not exist").
 *
 * @param mode - The Ledger handler mode to activate.
 */
export function sendSwitchLedgerModeMessage(mode: LedgerHandlerMode): void {
  // Fire-and-forget; offscreen may not be ready yet.
  browser.runtime
    .sendMessage({
      target: OffscreenCommunicationTarget.extension,
      event: OffscreenCommunicationEvents.switchLedgerMode,
      mode,
    })
    .catch(() => undefined);
}

/**
 * Pushes the initial Ledger handler mode to the offscreen document and
 * subscribes to remote feature flag changes so the offscreen can hot-swap.
 * The offscreen boots as Legacy by default; when DMK is enabled via the
 * remote feature flag we send a switchLedgerMode event to hot-swap.
 *
 * No-op on MV2 (no offscreen document).
 *
 * @param controller - Controller exposing messenger call/subscribe.
 * @param offscreenReady - Resolves once the offscreen listener is registered.
 */
export function setupLedgerModeOffscreenBridge(
  controller: LedgerModeController,
  offscreenReady: Promise<void> | null,
): void {
  if (!isManifestV3) {
    return;
  }

  const getLedgerMode = (): LedgerHandlerMode =>
    controller.controllerMessenger.call(
      'LegacyBackgroundApiService:getLedgerMode',
    );

  // The offscreen router emits this after registering its mode listener.
  // This second handshake covers createOffscreen() resolving via its timeout
  // before the offscreen document has actually finished booting.
  browser.runtime.onMessage.addListener((message: unknown): undefined => {
    if (
      message &&
      typeof message === 'object' &&
      'target' in message &&
      'event' in message &&
      message.target === OffscreenCommunicationTarget.extensionMain &&
      message.event === OffscreenCommunicationEvents.ledgerModeReady
    ) {
      sendSwitchLedgerModeMessage(getLedgerMode());
    }
    return undefined;
  });

  // The initial message must wait for the offscreen router to register its
  // listener. Reading the mode after that wait also captures flag changes that
  // occurred while the offscreen document was booting.
  Promise.resolve(offscreenReady)
    .then(() => {
      sendSwitchLedgerModeMessage(getLedgerMode());
    })
    .catch(() => {
      // The offscreen document is unavailable, so there is no receiver.
    });

  // When the `ledgerDmk` flag toggles, push a `switchLedgerMode` event to
  // the offscreen document so it can hot-swap the active Ledger handler.
  controller.controllerMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    () => {
      // Resolve through the service so manifest overrides remain applied.
      sendSwitchLedgerModeMessage(getLedgerMode());
    },
    (state) => isDmkFeatureEnabled(state.remoteFeatureFlags),
  );
}
