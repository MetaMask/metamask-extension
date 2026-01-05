import { BaseController, StateMetadata } from '@metamask/base-controller';
import {
  CONTROLLER_NAME,
  ControllerName,
  ConnectivityStatus,
  BrowserConnectivityControllerState,
  BrowserConnectivityControllerMessenger,
} from './types';

const controllerMetadata: StateMetadata<BrowserConnectivityControllerState> = {
  status: {
    persist: false,
    includeInDebugSnapshot: true,
    includeInStateLogs: true,
    usedInUi: true,
  },
};

/**
 * Get the default state for the BrowserConnectivityController.
 *
 * @returns The default state.
 */
function getDefaultBrowserConnectivityControllerState(): BrowserConnectivityControllerState {
  return {
    status: globalThis.navigator?.onLine
      ? ConnectivityStatus.Online
      : ConnectivityStatus.Offline,
  };
}

/**
 * BrowserConnectivityController monitors the device's internet connectivity
 * using the browser's `navigator.onLine` API and `online`/`offline` events.
 *
 * This controller provides a centralized way to detect whether the user's
 * device has internet connectivity, enabling better UX messaging and
 * allowing features to adapt when the user goes offline.
 */
export class BrowserConnectivityController extends BaseController<
  ControllerName,
  BrowserConnectivityControllerState,
  BrowserConnectivityControllerMessenger
> {
  readonly #onlineHandler = () => this.#handleChange(true);

  readonly #offlineHandler = () => this.#handleChange(false);

  constructor({
    messenger,
    state,
  }: {
    messenger: BrowserConnectivityControllerMessenger;
    state?: Partial<BrowserConnectivityControllerState>;
  }) {
    super({
      name: CONTROLLER_NAME,
      metadata: controllerMetadata,
      messenger,
      state: {
        ...getDefaultBrowserConnectivityControllerState(),
        ...state,
      },
    });

    // Set up browser event listeners
    globalThis.addEventListener('online', this.#onlineHandler);
    globalThis.addEventListener('offline', this.#offlineHandler);
  }

  /**
   * Clean up event listeners when the controller is destroyed.
   */
  destroy(): void {
    globalThis.removeEventListener('online', this.#onlineHandler);
    globalThis.removeEventListener('offline', this.#offlineHandler);
  }

  /**
   * Handles connectivity change events from the browser.
   *
   * @param isOnline - Whether the device is now online.
   */
  #handleChange(isOnline: boolean): void {
    const newStatus = isOnline
      ? ConnectivityStatus.Online
      : ConnectivityStatus.Offline;

    // Only update if status actually changed
    if (this.state.status !== newStatus) {
      this.update((state) => {
        state.status = newStatus;
      });
    }
  }
}
