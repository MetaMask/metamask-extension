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

export const CONTROLLER_NAME = 'BrowserConnectivityController';

export type ControllerName = typeof CONTROLLER_NAME;

/**
 * State for the BrowserConnectivityController.
 */
export type BrowserConnectivityControllerState = {
  /**
   * The current device connectivity status.
   */
  status: ConnectivityStatusType;
};

/**
 * Action to get the controller state.
 */
export type BrowserConnectivityControllerGetStateAction =
  ControllerGetStateAction<ControllerName, BrowserConnectivityControllerState>;

/**
 * All actions available on the BrowserConnectivityController.
 */
export type BrowserConnectivityControllerActions =
  BrowserConnectivityControllerGetStateAction;

/**
 * Event emitted when the controller state changes.
 */
export type BrowserConnectivityControllerStateChangeEvent =
  ControllerStateChangeEvent<
    ControllerName,
    BrowserConnectivityControllerState
  >;

/**
 * All events emitted by the BrowserConnectivityController.
 */
export type BrowserConnectivityControllerEvents =
  BrowserConnectivityControllerStateChangeEvent;

/**
 * Messenger type for the BrowserConnectivityController.
 */
export type BrowserConnectivityControllerMessenger = Messenger<
  ControllerName,
  BrowserConnectivityControllerActions,
  BrowserConnectivityControllerEvents
>;
