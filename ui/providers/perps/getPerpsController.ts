/**
 * UI-side Streaming Controller
 *
 * This module provides a lightweight PerpsController instance that lives in the
 * UI process solely for WebSocket streaming subscriptions (subscribeToPrices,
 * subscribeToPositions, etc.). Callbacks cannot cross the background/UI process
 * boundary, so streaming must remain UI-side.
 *
 * For all non-streaming operations (mutations, data fetches, state), use
 * submitRequestToBackground('perps*', [...]) to call the background controller.
 *
 * State reads should use Redux selectors from ui/selectors/perps-controller.ts.
 */

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
import { getReduxStorePromise } from '../../store/redux-store-promise';

const REMOTE_FEATURE_FLAG_GET_STATE = 'RemoteFeatureFlagController:getState';
const REMOTE_FEATURE_FLAG_STATE_CHANGE =
  'RemoteFeatureFlagController:stateChange';
const ACCOUNT_TREE_GET_ACCOUNTS =
  'AccountTreeController:getAccountsFromSelectedAccountGroup';
const ACCOUNT_TREE_SELECTED_GROUP_CHANGE =
  'AccountTreeController:selectedAccountGroupChange';

type RemoteFeatureFlagState = {
  remoteFeatureFlags: Record<string, unknown>;
  cacheTimestamp: number;
};

export class PerpsControllerInitializationCancelledError extends Error {
  constructor() {
    super('Perps controller initialization was superseded');
    this.name = 'PerpsControllerInitializationCancelledError';
  }
}

export function isPerpsControllerInitializationCancelledError(
  error: unknown,
): error is PerpsControllerInitializationCancelledError {
  return (
    error instanceof PerpsControllerInitializationCancelledError ||
    (error instanceof Error &&
      error.name === 'PerpsControllerInitializationCancelledError')
  );
}

function getRemoteFeatureFlagState(
  store: Store<MetaMaskReduxState>,
): RemoteFeatureFlagState {
  return {
    remoteFeatureFlags: store.getState().metamask?.remoteFeatureFlags ?? {},
    cacheTimestamp: 0,
  };
}

let unsubscribeRemoteFeatureFlags: (() => void) | null = null;
let controllerInstance: PerpsController | null = null;
let currentAddress: string | null = null;
let initPromise: Promise<PerpsController> | null = null;
let initializingAddress: string | null = null;
let initGeneration = 0;

/**
 * Create a minimal messenger for the UI-side streaming controller.
 * Only bridges RemoteFeatureFlagController and AccountTreeController from
 * Redux -- these are sufficient for init() and streaming subscriptions.
 * Signing and transaction actions are NOT wired here (handled by background).
 *
 * @param storeToUse - Redux store for feature flags, or null to use empty flags.
 * @returns The PerpsController messenger with delegated actions/events.
 */
function createStreamingMessenger(
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

  const accountTreeMessenger = new Messenger({
    namespace: 'AccountTreeController',
  });

  const getSelectedAccounts = () => {
    if (!storeToUse) {
      return [];
    }
    const state = storeToUse.getState();
    const accountId = state.metamask?.internalAccounts?.selectedAccount;
    const account =
      accountId && state.metamask?.internalAccounts?.accounts?.[accountId];
    return account ? [account] : [];
  };

  const accountTreeMessengerTyped = accountTreeMessenger as unknown as {
    registerActionHandler: (action: string, handler: () => unknown[]) => void;
    delegate: (opts: {
      actions: string[];
      events: string[];
      messenger: PerpsControllerMessenger;
    }) => void;
  };

  accountTreeMessengerTyped.registerActionHandler(
    ACCOUNT_TREE_GET_ACCOUNTS,
    getSelectedAccounts,
  );

  const perpsMessenger = new Messenger({
    namespace: 'PerpsController',
  }) as PerpsControllerMessenger;

  featureFlagMessengerTyped.delegate({
    actions: [REMOTE_FEATURE_FLAG_GET_STATE],
    events: [REMOTE_FEATURE_FLAG_STATE_CHANGE],
    messenger: perpsMessenger,
  });

  accountTreeMessengerTyped.delegate({
    actions: [ACCOUNT_TREE_GET_ACCOUNTS],
    events: [ACCOUNT_TREE_SELECTED_GROUP_CHANGE],
    messenger: perpsMessenger,
  });

  return perpsMessenger;
}

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

function startControllerInitialization(
  selectedAddress: string,
  store?: Store<MetaMaskReduxState>,
): Promise<PerpsController> {
  initGeneration += 1;
  const generation = initGeneration;
  initializingAddress = selectedAddress;

  const task = (async () => {
    let storeToUse = store;
    if (!storeToUse) {
      try {
        storeToUse = await getReduxStorePromise();
      } catch {
        // Store not ready (e.g. in tests)
      }
    }

    const messenger = createStreamingMessenger(storeToUse ?? null);
    const infrastructure = createPerpsInfrastructure();
    const fallbackBlockedRegions = getFallbackBlockedRegions();

    const controller = new PerpsController({
      messenger,
      state: getDefaultPerpsControllerState(),
      infrastructure,
      clientConfig: {
        fallbackHip3Enabled: true,
        fallbackHip3AllowlistMarkets: [],
        fallbackBlockedRegions,
      },
    });

    await controller.init();

    const isStale =
      generation !== initGeneration || initializingAddress !== selectedAddress;

    if (isStale) {
      await controller.disconnect();

      if (initPromise) {
        return initPromise;
      }

      if (controllerInstance) {
        return controllerInstance;
      }

      throw new PerpsControllerInitializationCancelledError();
    }

    controllerInstance = controller;
    currentAddress = selectedAddress;
    return controller;
  })();

  initPromise = task;

  task.then(
    () => {
      if (initPromise === task) {
        initPromise = null;
        initializingAddress = null;
      }
    },
    () => {
      if (initPromise === task) {
        initPromise = null;
        initializingAddress = null;
      }
    },
  );

  return task;
}

/**
 * Get the UI-side streaming controller instance.
 * Used ONLY for WebSocket subscription methods (subscribeToPrices, etc.).
 * For mutations and data fetches, use submitRequestToBackground('perps*').
 *
 * @param selectedAddress - The currently selected account address
 * @param store - Optional Redux store for feature flag bridging
 * @returns Promise resolving to the PerpsController instance (streaming only)
 */
export async function getPerpsStreamingController(
  selectedAddress: string,
  store?: Store<MetaMaskReduxState>,
): Promise<PerpsController> {
  if (!selectedAddress) {
    throw new Error(
      'No account selected. Please select an account before using Perps.',
    );
  }

  const addressChanged =
    currentAddress !== null && currentAddress !== selectedAddress;

  if (addressChanged && controllerInstance) {
    if (unsubscribeRemoteFeatureFlags) {
      unsubscribeRemoteFeatureFlags();
      unsubscribeRemoteFeatureFlags = null;
    }
    await controllerInstance.disconnect();
    controllerInstance = null;
    currentAddress = null;
  }

  if (controllerInstance && currentAddress === selectedAddress) {
    return controllerInstance;
  }

  if (initPromise && initializingAddress === selectedAddress) {
    return initPromise;
  }

  return startControllerInitialization(selectedAddress, store);
}

/**
 * @deprecated Use getPerpsStreamingController for subscriptions,
 * submitRequestToBackground for mutations/fetches.
 */
export const getPerpsController = getPerpsStreamingController;

export async function resetPerpsController(): Promise<void> {
  initGeneration += 1;
  if (unsubscribeRemoteFeatureFlags) {
    unsubscribeRemoteFeatureFlags();
    unsubscribeRemoteFeatureFlags = null;
  }
  if (controllerInstance) {
    await controllerInstance.disconnect();
  }

  controllerInstance = null;
  initPromise = null;
  currentAddress = null;
  initializingAddress = null;
}

export function getPerpsControllerCurrentAddress(): string | null {
  return currentAddress;
}

export function isPerpsControllerInitialized(address?: string): boolean {
  if (address) {
    return controllerInstance !== null && currentAddress === address;
  }
  return controllerInstance !== null;
}

export function getPerpsControllerInstance(): PerpsController | null {
  return controllerInstance;
}

export type { PerpsControllerState };
