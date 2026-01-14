import { BaseController, StateMetadata } from '@metamask/base-controller';
import {
  controllerName,
  ConnectivityStatus,
  ConnectivityControllerState,
  ConnectivityControllerMessenger,
  ConnectivityControllerOptions,
  ConnectivityService,
} from './types';

/**
 * The metadata for each property in {@link ConnectivityControllerState}.
 */
const controllerMetadata = {
  connectivityStatus: {
    persist: false,
    includeInDebugSnapshot: true,
    includeInStateLogs: true,
    usedInUi: true,
  },
} satisfies StateMetadata<ConnectivityControllerState>;

/**
 * Constructs the default {@link ConnectivityController} state. This allows
 * consumers to provide a partial state object when initializing the controller
 * and also helps in constructing complete state objects for this controller in
 * tests.
 *
 * @returns The default {@link ConnectivityController} state.
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
  typeof controllerName,
  ConnectivityControllerState,
  ConnectivityControllerMessenger
> {
  readonly #connectivityService: ConnectivityService;

  constructor({
    messenger,
    connectivityService,
  }: ConnectivityControllerOptions) {
    const initialStatus = connectivityService.isOnline()
      ? ConnectivityStatus.Online
      : ConnectivityStatus.Offline;

    super({
      name: controllerName,
      metadata: controllerMetadata,
      messenger,
      state: {
        ...getDefaultConnectivityControllerState(),
        connectivityStatus: initialStatus,
      },
    });

    this.#connectivityService = connectivityService;

    connectivityService.onConnectivityChange((isOnline) => {
      const newStatus = isOnline
        ? ConnectivityStatus.Online
        : ConnectivityStatus.Offline;

      this.update((draftState) => {
        draftState.connectivityStatus = newStatus;
      });
    });
  }
}
