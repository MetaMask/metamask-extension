import browser from 'webextension-polyfill';

/**
 * Manages extension update detection and application.
 * Provides a clean interface for detecting and applying extension updates
 * during idle periods to minimize user disruption.
 */
export class ExtensionUpdateManager {
  #updatePending = false;
  #isIdle = false;

  /**
   * Initializes the update manager by setting up event listeners
   * for update detection.
   */
  public initialize(): void {
    // Ensure we start in a non-idle state during initialization
    this.#isIdle = false;

    browser.runtime.onUpdateAvailable.addListener(
      this.#handleUpdateAvailable.bind(this),
    );
  }

  /**
   * Sets the idle state of the extension.
   *
   * @param idle - Whether the extension is currently idle
   */
  public setIdleState(idle: boolean): void {
    this.#isIdle = idle;
    if (idle && this.#updatePending) {
      this.#applyPendingUpdate();
    }
  }

  /**
   * Applies a pending update by reloading the extension.
   * Should only be called when conditions for update are confirmed.
   */
  #applyPendingUpdate(): void {
    browser.runtime.reload();
  }

  /**
   * Handles the onUpdateAvailable event by marking an update as pending.
   * The listener is removed after the first notification to prevent duplicate handlers.
   * If the extension is already idle, applies the update immediately.
   *
   * @private
   */
  #handleUpdateAvailable(): void {
    browser.runtime.onUpdateAvailable.removeListener(
      this.#handleUpdateAvailable.bind(this),
    );
    this.#updatePending = true;

    // If we're already idle, apply the update immediately
    if (this.#isIdle) {
      this.#applyPendingUpdate();
    }
  }
}

// Export a singleton instance
export default new ExtensionUpdateManager();
