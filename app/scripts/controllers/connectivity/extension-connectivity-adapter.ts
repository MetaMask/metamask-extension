import { CONNECTIVITY_STATUSES } from '@metamask/connectivity-controller';
import type {
  ConnectivityStatus,
  ConnectivityAdapter,
} from '@metamask/connectivity-controller';

/**
 * A connectivity adapter for extension contexts.
 *
 * This adapter is used to detect connectivity changes in the extension context.
 * It is used to update the connectivity status in the extension context.
 */
export class ExtensionConnectivityAdapter implements ConnectivityAdapter {
  #status: ConnectivityStatus = CONNECTIVITY_STATUSES.Online;

  #onConnectivityChangeCallbacks: ((status: ConnectivityStatus) => void)[] = [];

  /**
   * Returns the current connectivity status.
   *
   * @returns The current connectivity status.
   */
  getStatus(): ConnectivityStatus {
    return this.#status;
  }

  /**
   * Registers a callback to be called when connectivity status changes.
   *
   * @param callback - Function called with the connectivity status.
   */
  onConnectivityChange(callback: (status: ConnectivityStatus) => void): void {
    this.#onConnectivityChangeCallbacks.push(callback);
  }

  /**
   * Sets the connectivity status.
   *
   * Called from the background when connectivity changes.
   * This triggers all registered callbacks to update the controller.
   *
   * @param status - The connectivity status.
   */
  setStatus(status: ConnectivityStatus): void {
    this.#status = status;
    for (const callback of this.#onConnectivityChangeCallbacks) {
      callback(status);
    }
  }

  /**
   * Cleans up all registered callbacks.
   */
  destroy(): void {
    this.#onConnectivityChangeCallbacks = [];
  }
}
