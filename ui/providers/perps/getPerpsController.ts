import { Messenger } from '@metamask/messenger';
import type { Store } from 'redux';
import {
  PerpsController,
  getDefaultPerpsControllerState,
  createPerpsInfrastructure,
  type PerpsControllerState,
  type PerpsControllerMessenger,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/perps';
import type { MetaMaskReduxState } from '../../store/store';
import { submitRequestToBackground } from '../../store/background-connection';
import { getReduxStorePromise } from '../..';

const REMOTE_FEATURE_FLAG_GET_STATE = 'RemoteFeatureFlagController:getState';
const REMOTE_FEATURE_FLAG_STATE_CHANGE =
  'RemoteFeatureFlagController:stateChange';

/** State shape expected by PerpsController (RemoteFeatureFlagControllerState). */
type RemoteFeatureFlagState = {
  remoteFeatureFlags: Record<string, unknown>;
  cacheTimestamp: number;
};

function getRemoteFeatureFlagState(
  store: Store<MetaMaskReduxState>,
): RemoteFeatureFlagState {
  return {
    remoteFeatureFlags: store.getState().metamask?.remoteFeatureFlags ?? {},
    cacheTimestamp: 0,
  };
}

/**
 * Unsubscribe from Redux store when controller is reset.
 * Used to stop publishing remote feature flag changes to the PerpsController.
 */
let unsubscribeRemoteFeatureFlags: (() => void) | null = null;

/**
 * Singleton instance of the PerpsController.
 * Uses the real @metamask/perps-controller package.
 */
let controllerInstance: PerpsController | null = null;

/**
 * The address the current controller instance was initialized with.
 * Used to detect account switches and reinitialize.
 */
let currentAddress: string | null = null;

/**
 * Promise to track initialization to prevent race conditions.
 */
let initPromise: Promise<PerpsController> | null = null;

/**
 * Create the RemoteFeatureFlagController-namespaced messenger and (when store is
 * available) register getState and subscribe to Redux to publish stateChange.
 * Then create the PerpsController messenger and delegate getState/stateChange to it.
 *
 * @param storeToUse - Redux store for feature flags, or null to use empty flags.
 * @returns The PerpsController messenger with delegated RemoteFeatureFlagController actions/events.
 */
function createPerpsMessenger(
  storeToUse: Store<MetaMaskReduxState> | null,
): PerpsControllerMessenger {
  const featureFlagMessenger = new Messenger({
    namespace: 'RemoteFeatureFlagController',
  });

  const getState = (): RemoteFeatureFlagState =>
    storeToUse
      ? getRemoteFeatureFlagState(storeToUse)
      : { remoteFeatureFlags: {}, cacheTimestamp: 0 };

  const featureFlagMessengerTyped = featureFlagMessenger as unknown as {
    registerActionHandler: (
      action: string,
      handler: () => RemoteFeatureFlagState,
    ) => void;
    publish: (event: string, payload: RemoteFeatureFlagState) => void;
    delegate: (opts: {
      actions: string[];
      events: string[];
      messenger: PerpsControllerMessenger;
    }) => void;
  };
  featureFlagMessengerTyped.registerActionHandler(
    REMOTE_FEATURE_FLAG_GET_STATE,
    getState,
  );

  if (storeToUse) {
    const publishStateChange = () => {
      featureFlagMessengerTyped.publish(
        REMOTE_FEATURE_FLAG_STATE_CHANGE,
        getRemoteFeatureFlagState(storeToUse),
      );
    };
    publishStateChange();
    if (unsubscribeRemoteFeatureFlags) {
      unsubscribeRemoteFeatureFlags();
    }
    unsubscribeRemoteFeatureFlags = storeToUse.subscribe(publishStateChange);
  }

  const perpsMessenger = new Messenger({
    namespace: 'PerpsController',
  }) as PerpsControllerMessenger;

  featureFlagMessengerTyped.delegate({
    actions: [REMOTE_FEATURE_FLAG_GET_STATE],
    events: [REMOTE_FEATURE_FLAG_STATE_CHANGE],
    messenger: perpsMessenger,
  });

  return perpsMessenger;
}

/**
 * Parse fallback blocked regions from MM_PERPS_BLOCKED_REGIONS env var.
 * Format: comma-separated region codes (e.g., "US,CA-ON,GB,BE").
 * Exported for unit testing.
 */
export function getFallbackBlockedRegions(): string[] {
  const raw = process.env.MM_PERPS_BLOCKED_REGIONS;
  if (!raw || typeof raw !== 'string') {
    return [];
  }
  return raw
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

/**
 * Get the PerpsController instance.
 * Returns a singleton PerpsController that is initialized on first access.
 *
 * @param selectedAddress - The currently selected account address
 * @param store - Optional Redux store; when provided, remote feature flag state is bridged into the controller for geoblock eligibility
 * @returns Promise resolving to the PerpsController instance
 * @example
 * ```typescript
 * const controller = await getPerpsController(selectedAccount.address, store);
 * const account = await controller.getAccountState();
 * console.log('Balance:', account.totalBalance);
 * ```
 */
export async function getPerpsController(
  selectedAddress: string,
  store?: Store<MetaMaskReduxState>,
): Promise<PerpsController> {
  if (!selectedAddress) {
    throw new Error(
      'No account selected. Please select an account before using Perps.',
    );
  }

  // Check if we need to reinitialize due to account switch
  const addressChanged =
    currentAddress !== null && currentAddress !== selectedAddress;

  if (addressChanged && controllerInstance) {
    if (unsubscribeRemoteFeatureFlags) {
      unsubscribeRemoteFeatureFlags();
      unsubscribeRemoteFeatureFlags = null;
    }
    await controllerInstance.disconnect();
    controllerInstance = null;
    initPromise = null;
  }

  // Return existing controller if address hasn't changed
  if (controllerInstance && currentAddress === selectedAddress) {
    return controllerInstance;
  }

  // Prevent race conditions during initialization
  if (!initPromise) {
    initPromise = (async () => {
      let storeToUse = store;
      if (!storeToUse) {
        try {
          storeToUse = await getReduxStorePromise();
        } catch {
          // Store not ready (e.g. in tests)
        }
      }
      const messenger = createPerpsMessenger(storeToUse ?? null);
      const infrastructure = createPerpsInfrastructure({
        selectedAddress,
        signTypedMessage: (msgParams) =>
          submitRequestToBackground<string>('perpsSignTypedData', [msgParams]),
      });
      const fallbackBlockedRegions = getFallbackBlockedRegions();

      const controller = new PerpsController({
        messenger,
        state: getDefaultPerpsControllerState(),
        infrastructure,
        clientConfig: {
          fallbackHip3Enabled: true,
          fallbackHip3AllowlistMarkets: [], // Empty = allow all HIP-3 markets
          fallbackBlockedRegions,
        },
      });

      await controller.init();

      controllerInstance = controller;
      currentAddress = selectedAddress;
      return controller;
    })();
  }

  return initPromise;
}

/**
 * Reset the controller instance (useful for testing or account switch).
 */
export async function resetPerpsController(): Promise<void> {
  if (unsubscribeRemoteFeatureFlags) {
    unsubscribeRemoteFeatureFlags();
    unsubscribeRemoteFeatureFlags = null;
  }
  if (controllerInstance) {
    await controllerInstance.disconnect();
    controllerInstance = null;
    initPromise = null;
    currentAddress = null;
  }
}

/**
 * Get the current address the controller is initialized for.
 * Returns null if no controller is initialized.
 */
export function getPerpsControllerCurrentAddress(): string | null {
  return currentAddress;
}

/**
 * Check if the controller is initialized for a specific address.
 * @param address - Optional address to check. If not provided, returns true if any controller is initialized.
 */
export function isPerpsControllerInitialized(address?: string): boolean {
  if (address) {
    return controllerInstance !== null && currentAddress === address;
  }
  return controllerInstance !== null;
}

/**
 * Get the current controller instance without initializing it.
 * Returns null if no controller is initialized.
 * Use this when you need to access the controller but don't want to trigger initialization.
 */
export function getPerpsControllerInstance(): PerpsController | null {
  return controllerInstance;
}

// Re-export types for convenience
export type { PerpsControllerState };
