/**
 * Manages extension update detection and application.
 * Provides a clean interface for detecting and applying extension updates
 * during idle periods to minimize user disruption.
 */

import browser from 'webextension-polyfill';

export class ExtensionUpdateManager {
  private updatePending = false;

  /**
   * Initializes the update manager by setting up event listeners
   * for update detection.
   */
  public initialize(): void {
    browser.runtime.onUpdateAvailable.addListener(
      this.handleUpdateAvailable.bind(this),
    );
  }

  /**
   * Checks if there's a pending update and applies it if needed.
   * This should be called during idle periods when it's safe to reload
   * the extension without disrupting user activity.
   */
  public applyPendingUpdateIfNeeded(): void {
    if (this.updatePending) {
      try {
        browser.runtime.reload();
      } catch (error) {
        console.error('Failed to reload extension:', error);
      }
    }
  }

  /**
   * Handles the onUpdateAvailable event by marking an update as pending.
   * The listener is removed after the first notification to prevent duplicate handlers.
   *
   * @private
   */
  private handleUpdateAvailable(): void {
    browser.runtime.onUpdateAvailable.removeListener(
      this.handleUpdateAvailable.bind(this),
    );
    this.updatePending = true;
  }

  /**
   * Simulates an update being available by manually setting the update pending flag.
   * This should only be used for testing purposes.
   */
  public simulateUpdateAvailable(): void {
    this.updatePending = true;
    console.log('Update simulation: marked update as pending');
  }
}

// Export a singleton instance
export default new ExtensionUpdateManager();
