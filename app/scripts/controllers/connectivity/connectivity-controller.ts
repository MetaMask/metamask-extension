import { BaseController, StateMetadata } from '@metamask/base-controller';
import {
  CONTROLLER_NAME,
  ControllerName,
  ConnectivityStatus,
  ConnectivityControllerState,
  ConnectivityControllerMessenger,
  ConnectivityControllerOptions,
  ConnectivityService,
} from './types';

const controllerMetadata: StateMetadata<ConnectivityControllerState> = {
  connectivityStatus: {
    persist: false,
    includeInDebugSnapshot: true,
    includeInStateLogs: true,
    usedInUi: true,
  },
};

/**
 * Get the default state for the ConnectivityController.
 *
 * @returns The default state.
 */
export function getDefaultConnectivityControllerState(): ConnectivityControllerState {
  return {
    connectivityStatus: ConnectivityStatus.Online,
  };
}

/**
 * ConnectivityController stores the device's internet connectivity status.
 *
 * This controller is platform-agnostic and designed to be used across different
 * MetaMask clients (extension, mobile). It requires a `ConnectivityService` to
 * be injected, which provides platform-specific connectivity detection.
 *
 * The controller subscribes to the service's `onConnectivityChange` callback
 * and updates its state accordingly. All connectivity updates flow through
 * the service, ensuring a single source of truth.
 *
 * **Platform implementations:**
 *
 * - **Mobile:** Inject `NetInfoConnectivityService` using `@react-native-community/netinfo`
 * - **Extension:** Inject `PassiveConnectivityService` in the background,
 * UI calls `service.setStatus()` via the background API
 *
 * This controller provides a centralized state for connectivity status,
 * enabling the UI and other controllers to adapt when the user goes offline.
 */
export class ConnectivityController extends BaseController<
  ControllerName,
  ConnectivityControllerState,
  ConnectivityControllerMessenger
> {
  readonly #connectivityService: ConnectivityService;

  constructor({
    messenger,
    state,
    connectivityService,
  }: ConnectivityControllerOptions) {
    // Determine initial status from state or service
    const initialStatus =
      state?.connectivityStatus ??
      (connectivityService.isOnline()
        ? ConnectivityStatus.Online
        : ConnectivityStatus.Offline);

    super({
      name: CONTROLLER_NAME,
      metadata: controllerMetadata,
      messenger,
      state: {
        ...getDefaultConnectivityControllerState(),
        connectivityStatus: initialStatus,
      },
    });

    this.#connectivityService = connectivityService;

    // Subscribe to service connectivity changes
    connectivityService.onConnectivityChange((isOnline) => {
      const newStatus = isOnline
        ? ConnectivityStatus.Online
        : ConnectivityStatus.Offline;

      if (this.state.connectivityStatus !== newStatus) {
        this.update((draftState) => {
          draftState.connectivityStatus = newStatus;
        });
      }
    });
  }

  /**
   * Clean up resources when the controller is destroyed.
   */
  destroy(): void {
    this.#connectivityService.destroy();
  }
}
