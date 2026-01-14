import type { ConnectivityService } from './types';
import { ConnectivityStatus } from './types';

/**
 * A passive connectivity service for cross-context scenarios.
 *
 * Use this service when the controller runs in a context where connectivity
 * events don't work (e.g., browser extension service worker), and detection
 * happens in a different context (e.g., UI).
 *
 * This service:
 * - Returns a default online state
 * - Does not actively detect connectivity changes
 * - Receives updates via `setStatus()` method from external callers
 * - Forwards updates to all registered callbacks
 *
 * Detection happens in background.js which calls `setDeviceConnectivityStatus()`:
 * - MV3: Offscreen document sends connectivity changes via chrome.runtime.sendMessage
 * - MV2: Background page listens to window online/offline events directly
 */
export class PassiveConnectivityService implements ConnectivityService {
  #status: ConnectivityStatus = ConnectivityStatus.Online;

  #onConnectivityChangeCallbacks: ((status: ConnectivityStatus) => void)[] = [];

  /**
   * Returns the current connectivity status.
   *
   * @returns 'online' if online, 'offline' if offline.
   */
  getStatus(): ConnectivityStatus {
    return this.#status;
  }

  /**
   * Registers a callback to be called when connectivity status changes.
   *
   * @param callback - Function called with the connectivity status ('online' or 'offline').
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
   * @param status - The connectivity status ('online' or 'offline').
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
