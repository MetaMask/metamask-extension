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
import { getReduxStorePromise } from '../..';

/**
 * Unsubscribe from Redux store when controller is reset.
 * Used to stop bridging remote feature flag changes to the PerpsController.
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
 * Initial remote feature flags for the stub RemoteFeatureFlagController:getState.
 * Set before creating PerpsController when store is available; read by the messenger wrapper.
 */
let initialRemoteFeatureFlags: Record<string, unknown> = {};

const REMOTE_FEATURE_FLAG_GET_STATE = 'RemoteFeatureFlagController:getState';
const REMOTE_FEATURE_FLAG_STATE_CHANGE =
  'RemoteFeatureFlagController:stateChange';

/**
 * Bridge remote feature flag state from Redux into the PerpsController.
 * The controller's messenger is standalone and cannot receive RemoteFeatureFlagController
 * events, so we push state changes when Redux metamask.remoteFeatureFlags updates.
 */
const ELIGIBILITY_LOG_PREFIX = '[Perps Eligibility]';

function bridgeRemoteFeatureFlagsToController(
  controller: PerpsController,
  store: Store<MetaMaskReduxState>,
): void {
  const pushState = () => {
    const remoteFeatureFlags =
      store.getState().metamask?.remoteFeatureFlags ?? {};
    const geoFlag = remoteFeatureFlags.perpsPerpTradingGeoBlockedCountriesV2 as
      | { blockedRegions?: string[] }
      | undefined;
    const blockedRegions = Array.isArray(geoFlag?.blockedRegions)
      ? geoFlag.blockedRegions
      : [];
    console.log(ELIGIBILITY_LOG_PREFIX, 'Pushing remote feature flags', {
      hasGeoFlag: geoFlag !== null,
      blockedRegionsCount: blockedRegions.length,
      blockedRegions: blockedRegions.length > 0 ? blockedRegions : '(none)',
      note:
        blockedRegions.length > 0
          ? 'Controller will run eligibility check; if its geo fetch fails (e.g. from UI context) it defaults to eligible=true.'
          : undefined,
    });
    (
      controller as PerpsController & {
        refreshEligibilityOnFeatureFlagChange: (state: {
          remoteFeatureFlags: Record<string, unknown>;
        }) => void;
      }
    ).refreshEligibilityOnFeatureFlagChange({ remoteFeatureFlags });
  };

  pushState();

  if (unsubscribeRemoteFeatureFlags) {
    unsubscribeRemoteFeatureFlags();
  }
  unsubscribeRemoteFeatureFlags = store.subscribe(pushState);
}

/**
 * Create a messenger for the PerpsController that satisfies RemoteFeatureFlagController
 * without registering non-PerpsController actions on the namespaced messenger.
 *
 * We wrap the real PerpsController-namespaced messenger and intercept
 * RemoteFeatureFlagController:getState (return initialRemoteFeatureFlags) and
 * RemoteFeatureFlagController:stateChange (no-op subscribe; we bridge from Redux).
 * All other call/subscribe delegate to the real messenger.
 */
function createPerpsMessenger(): PerpsControllerMessenger {
  const real = new Messenger({
    namespace: 'PerpsController',
  }) as PerpsControllerMessenger;

  const noopUnsubscribe = () => {
    /* bridge from Redux instead */
  };

  const wrapper = new Proxy(real, {
    get(target, prop: string) {
      if (prop === 'call') {
        return (actionType: string, ...params: unknown[]) => {
          if (actionType === REMOTE_FEATURE_FLAG_GET_STATE) {
            return { remoteFeatureFlags: initialRemoteFeatureFlags };
          }
          return (target.call as (a: string, ...p: unknown[]) => unknown)(
            actionType,
            ...params,
          );
        };
      }
      if (prop === 'subscribe') {
        return (
          eventType: string,
          handler: (...args: unknown[]) => void,
          selector?: unknown,
        ) => {
          if (eventType === REMOTE_FEATURE_FLAG_STATE_CHANGE) {
            return noopUnsubscribe;
          }
          return target.subscribe(
            eventType as never,
            handler as never,
            selector as never,
          );
        };
      }
      const value = (target as unknown as Record<string, unknown>)[prop];
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    },
  });

  return wrapper as unknown as PerpsControllerMessenger;
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
    console.log(
      '[Perps] Account changed, reinitializing controller:',
      currentAddress,
      '->',
      selectedAddress,
    );
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
      if (storeToUse) {
        initialRemoteFeatureFlags =
          storeToUse.getState().metamask?.remoteFeatureFlags ?? {};
        const geoFlag =
          initialRemoteFeatureFlags?.perpsPerpTradingGeoBlockedCountriesV2 as
            | { blockedRegions?: string[] }
            | undefined;
        const blocked = Array.isArray(geoFlag?.blockedRegions)
          ? geoFlag.blockedRegions
          : [];
        console.log(
          ELIGIBILITY_LOG_PREFIX,
          'Stub getState will return flags for init',
          {
            blockedRegionsCount: blocked.length,
            blockedRegions: blocked.length > 0 ? blocked : '(none)',
          },
        );
      }
      const messenger = createPerpsMessenger();
      const infrastructure = createPerpsInfrastructure(selectedAddress);
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

      if (storeToUse) {
        bridgeRemoteFeatureFlagsToController(controller, storeToUse);
      }

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

// Re-export types for convenience
export type { PerpsControllerState };
