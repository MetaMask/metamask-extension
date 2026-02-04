import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

/**
 * Sends the current connectivity status to the background script.
 *
 * @param isOnline - Whether the device is online.
 */
function sendConnectivityStatus(isOnline: boolean): void {
  chrome.runtime.sendMessage({
    target: OffscreenCommunicationTarget.extensionMain,
    event: OffscreenCommunicationEvents.connectivityChange,
    isOnline,
  });
}

/**
 * Initializes connectivity detection in the offscreen document.
 *
 * The offscreen document has access to `navigator.onLine` and `online`/`offline`
 * events, which work reliably here unlike in the service worker context.
 * This sends connectivity updates to the background script.
 */
export default function initConnectivityDetection(): void {
  const handleOnline = () => sendConnectivityStatus(true);
  const handleOffline = () => sendConnectivityStatus(false);

  // Send initial connectivity status
  sendConnectivityStatus(navigator.onLine);

  // Listen for connectivity changes
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}
