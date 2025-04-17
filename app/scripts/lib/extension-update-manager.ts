import browser from 'webextension-polyfill';

/**
 * Manages extension update detection and application.
 * Provides a clean interface for detecting and applying extension updates
 * during idle periods to minimize user disruption.
 */
export class ExtensionUpdateManager {
  private updatePending = false;

  private isIdle = false;

  /**
   * Initializes the update manager by setting up event listeners
   * for update detection.
   */
  public initialize(): void {
    // Ensure we start in a non-idle state during initialization
    this.isIdle = false;

    browser.runtime.onUpdateAvailable.addListener(
      this.handleUpdateAvailable.bind(this),
    );
  }

  /**
   * Sets the idle state of the extension.
   *
   * @param idle - Whether the extension is currently idle
   */
  public setIdleState(idle: boolean): void {
    this.isIdle = idle;

    // If we're now idle and there's a pending update, apply it immediately
    if (idle && this.updatePending) {
      this.applyPendingUpdateIfNeeded();
    }
  }

  /**
   * Checks if there's a pending update and applies it if needed.
   * This should be called during idle periods when it's safe to reload
   * the extension without disrupting user activity.
   */
  public applyPendingUpdateIfNeeded(): void {
    if (this.updatePending && this.isIdle) {
      browser.runtime.reload();
    }
  }

  /**
   * Handles the onUpdateAvailable event by marking an update as pending.
   * The listener is removed after the first notification to prevent duplicate handlers.
   * If the extension is already idle, applies the update immediately.
   *
   * @private
   */
  private handleUpdateAvailable(): void {
    browser.runtime.onUpdateAvailable.removeListener(
      this.handleUpdateAvailable.bind(this),
    );
    this.updatePending = true;

    // If we're already idle, apply the update immediately
    if (this.isIdle) {
      this.applyPendingUpdateIfNeeded();
    }
  }
}

// Export a singleton instance
export default new ExtensionUpdateManager();
