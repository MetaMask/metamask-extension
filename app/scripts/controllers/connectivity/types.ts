import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';

/**
 * Connectivity status constants.
 * Used to represent whether the device has internet connectivity.
 */
export const ConnectivityStatus = {
  Online: 'online',
  Offline: 'offline',
} as const;

export type ConnectivityStatusType =
  (typeof ConnectivityStatus)[keyof typeof ConnectivityStatus];

/**
 * Service interface for platform-specific connectivity detection.
 *
 * Each platform (extension, mobile) implements this interface using
 * platform-specific APIs:
 * - Extension: `navigator.onLine` and `online`/`offline` events
 * - Mobile: `@react-native-community/netinfo`
 *
 * The service is injected into the ConnectivityController, which
 * subscribes to connectivity changes and updates its state accordingly.
 */
export type ConnectivityService = {
  /**
   * Returns the current connectivity status.
   *
   * @returns True if the device is online, false otherwise.
   */
  isOnline(): boolean;

  /**
   * Registers a callback to be called when connectivity status changes.
   *
   * @param callback - Function called with true when online, false when offline.
   */
  onConnectivityChange(callback: (isOnline: boolean) => void): void;

  /**
   * Cleans up any resources (event listeners, subscriptions).
   */
  destroy(): void;
};

export const CONTROLLER_NAME = 'ConnectivityController';

export type ControllerName = typeof CONTROLLER_NAME;

/**
 * State for the ConnectivityController.
 */
export type ConnectivityControllerState = {
  /**
   * The current device connectivity status.
   * Named with 'connectivity' prefix to avoid conflicts when state is flattened in Redux.
   */
  connectivityStatus: ConnectivityStatusType;
};

/**
 * Action to get the controller state.
 */
export type ConnectivityControllerGetStateAction = ControllerGetStateAction<
  ControllerName,
  ConnectivityControllerState
>;

/**
 * All actions available on the ConnectivityController.
 */
export type ConnectivityControllerActions =
  ConnectivityControllerGetStateAction;

/**
 * Event emitted when the controller state changes.
 */
export type ConnectivityControllerStateChangeEvent = ControllerStateChangeEvent<
  ControllerName,
  ConnectivityControllerState
>;

/**
 * All events emitted by the ConnectivityController.
 */
export type ConnectivityControllerEvents =
  ConnectivityControllerStateChangeEvent;

/**
 * Messenger type for the ConnectivityController.
 */
export type ConnectivityControllerMessenger = Messenger<
  ControllerName,
  ConnectivityControllerActions,
  ConnectivityControllerEvents
>;

/**
 * Options for constructing the ConnectivityController.
 */
export type ConnectivityControllerOptions = {
  /**
   * The messenger for inter-controller communication.
   */
  messenger: ConnectivityControllerMessenger;

  /**
   * Initial state for the controller.
   */
  state?: Partial<ConnectivityControllerState>;

  /**
   * Connectivity service for platform-specific detection.
   *
   * The controller subscribes to the service's `onConnectivityChange`
   * callback to receive connectivity updates.
   *
   * Platform implementations:
   * - Mobile: Use `NetInfoConnectivityService` with `@react-native-community/netinfo`
   * - Extension (same context): Use `BrowserConnectivityService`
   * - Extension (cross-context): Use `PassiveConnectivityService` and call
   * `setStatus()` from the UI context
   */
  connectivityService: ConnectivityService;
};
