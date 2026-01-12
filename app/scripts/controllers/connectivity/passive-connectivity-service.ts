import type { ConnectivityService } from './types';

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
 * - Forwards updates to the callback (controller handles deduplication)
 *
 * Detection happens in background.js which calls `setDeviceConnectivityStatus()`:
 * - MV3: Offscreen document sends connectivity changes via chrome.runtime.sendMessage
 * - MV2: Background page listens to window online/offline events directly
 */
export class PassiveConnectivityService implements ConnectivityService {
  #isOnline: boolean = true;

  #callback: ((isOnline: boolean) => void) | null = null;

  /**
   * Returns the current connectivity status.
   *
   * @returns True if online, false if offline.
   */
  isOnline(): boolean {
    return this.#isOnline;
  }

  /**
   * Registers a callback to be called when connectivity status changes.
   *
   * @param callback - Function called with true when online, false when offline.
   */
  onConnectivityChange(callback: (isOnline: boolean) => void): void {
    this.#callback = callback;
  }

  /**
   * Sets the connectivity status.
   *
   * Called from the background when connectivity changes.
   * This triggers the registered callback to update the controller.
   * The controller handles deduplication of status changes.
   *
   * @param isOnline - Whether the device is online.
   */
  setStatus(isOnline: boolean): void {
    this.#isOnline = isOnline;
    this.#callback?.(isOnline);
  }

  /**
   * No-op cleanup.
   */
  destroy(): void {
    this.#callback = null;
  }
}
