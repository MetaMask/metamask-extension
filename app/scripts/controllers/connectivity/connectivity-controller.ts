import { BaseController, StateMetadata } from '@metamask/base-controller';
import {
  controllerName,
  ConnectivityStatus,
  ConnectivityControllerState,
  ConnectivityControllerMessenger,
  ConnectivityControllerOptions,
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
 * - **Extension:** Inject `PassiveConnectivityService` in the background.
 * Status is updated via the `setDeviceConnectivityStatus` API, which is called from:
 * - MV3: Offscreen document (where browser events work reliably)
 * - MV2: Background page (where browser events work directly)
 *
 * This controller provides a centralized state for connectivity status,
 * enabling the UI and other controllers to adapt when the user goes offline.
 */
export class ConnectivityController extends BaseController<
  typeof controllerName,
  ConnectivityControllerState,
  ConnectivityControllerMessenger
> {
  constructor({
    messenger,
    connectivityService,
  }: ConnectivityControllerOptions) {
    const initialStatus = connectivityService.getStatus();

    super({
      name: controllerName,
      metadata: controllerMetadata,
      messenger,
      state: {
        ...getDefaultConnectivityControllerState(),
        connectivityStatus: initialStatus,
      },
    });

    connectivityService.onConnectivityChange((status) => {
      this.update((draftState) => {
        draftState.connectivityStatus = status;
      });
    });
  }
}
