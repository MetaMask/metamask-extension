import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

/**
 * Sends the current connectivity status to the background script.
 * Includes defensive checks to ensure runtime is available.
 */
function sendConnectivityStatus(isOnline: boolean): void {
  try {
    if (chrome.runtime?.id) {
      chrome.runtime.sendMessage({
        target: OffscreenCommunicationTarget.extensionMain,
        event: OffscreenCommunicationEvents.connectivityChange,
        isOnline,
      });
    }
  } catch (error) {
    // Fail silently or log if in dev mode to prevent offscreen document crash
    console.debug('Connectivity broadcast failed:', error);
  }
}

/**
 * Initializes connectivity detection in the offscreen document.
 * * Optimized with cleanup logic and defensive initialization.
 */
export default function initConnectivityDetection(): void {
  // Use named functions to allow for easy removal if needed
  const handleOnline = () => sendConnectivityStatus(true);
  const handleOffline = () => sendConnectivityStatus(false);

  // Send initial connectivity status immediately
  // Note: navigator.onLine is standard but fallback to true if undefined
  sendConnectivityStatus(navigator.onLine ?? true);

  // Listen for connectivity changes
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  /**
   * Internal Cleanup: Ensures listeners are removed if the document is closed
   * This is a best practice for long-running extension documents.
   */
  window.addEventListener('unload', () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }, { once: true });
}
