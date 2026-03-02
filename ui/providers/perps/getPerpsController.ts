/**
 * UI-side Streaming Controller & Facade
 *
 * This module provides a PerpsController instance for the UI that is a facade:
 * - Streaming methods (subscribeToPrices, subscribeToPositions, etc.) run on a
 * lightweight UI-side controller so callbacks stay in the UI process.
 * - All other methods (placeOrder, updateMargin, getPositions, etc.) delegate
 * to the background controller via submitRequestToBackground under the hood.
 *
 * State reads should use Redux selectors from ui/selectors/perps-controller.ts.
 */

import { Messenger } from '@metamask/messenger';
import type { Store } from 'redux';
import {
  PerpsController,
  getDefaultPerpsControllerState,
  createPerpsInfrastructure,
  type PerpsControllerMessenger,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/perps';
import type { MetaMaskReduxState } from '../../store/store';
import { getReduxStorePromise } from '../../store/redux-store-promise';
import { createPerpsControllerFacade } from './createPerpsControllerFacade';

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

/** Cached facade for the current controller so callers get the same reference. */
let cachedFacade: PerpsController | null = null;
let cachedFacadeUnderlying: PerpsController | null = null;

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

      if (initPromise !== null) {
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

function getOrCreateFacade(underlying: PerpsController): PerpsController {
  if (cachedFacade !== null && cachedFacadeUnderlying === underlying) {
    return cachedFacade;
  }
  cachedFacadeUnderlying = underlying;
  cachedFacade = createPerpsControllerFacade(underlying);
  return cachedFacade;
}

function clearFacadeCache(): void {
  cachedFacade = null;
  cachedFacadeUnderlying = null;
}

/**
 * Get the PerpsController facade for the UI. Streaming methods run on the
 * UI-side controller; mutations and data fetches delegate to the background.
 *
 * @param selectedAddress - The currently selected account address
 * @param store - Optional Redux store for feature flag bridging
 * @returns Promise resolving to the PerpsController facade
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
    clearFacadeCache();
  }

  if (controllerInstance && currentAddress === selectedAddress) {
    return getOrCreateFacade(controllerInstance);
  }

  if (initPromise !== null && initializingAddress === selectedAddress) {
    return initPromise.then((ctrl) => getOrCreateFacade(ctrl));
  }

  return startControllerInitialization(selectedAddress, store).then((ctrl) =>
    getOrCreateFacade(ctrl),
  );
}

/**
 * @deprecated Use getPerpsStreamingController. The returned controller is a
 * facade: use it for both subscriptions and mutations (e.g. controller.placeOrder).
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
  clearFacadeCache();
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

/**
 * Get the PerpsController facade when a controller is already initialized.
 * Used by the provider to seed context on re-navigation (sync path).
 */
export function getPerpsControllerFacade(): PerpsController | null {
  return controllerInstance ? getOrCreateFacade(controllerInstance) : null;
}

export type { PerpsControllerState } from '@metamask/perps-controller';
