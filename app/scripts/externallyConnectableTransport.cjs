'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getExternallyConnectableTransport = getExternallyConnectableTransport;
const metamaskExtensionId_1 = require('./metamaskExtensionId.cjs');
const errors_1 = require('./errors.cjs');
const constants_1 = require('./constants.cjs');
/**
 * Creates a transport that communicates with the MetaMask extension via Chrome's externally_connectable API
 *
 * @param params - Configuration parameters for the transport
 * @param params.extensionId - Optional MetaMask extension ID. If not provided, it will be auto-detected.
 * @returns A Transport instance that communicates with the MetaMask extension
 *
 * @example
 * ```typescript
 * // Create transport with auto-detection of extension ID
 * const transport = getExternallyConnectableTransport();
 *
 * // Create transport with specific extension ID
 * const transport = getExternallyConnectableTransport({
 *   extensionId: '...'
 * });
 * ```
 */
function getExternallyConnectableTransport(params = {}) {
  let { extensionId } = params;
  let chromePort;
  let requestId = 1;
  const pendingRequests = new Map();
  /**
   * Storing notification callbacks.
   * If we detect a "notification" (a message without an id) coming from the extension or fallback, we'll call each callback in here.
   */
  const notificationCallbacks = new Set();
  /**
   * Handle messages from the extension
   * @param msg
   */
  function handleMessage(msg) {
    const { data } = msg;
    // Handle notifications (messages without id)
    if (data?.id === null || data?.id === undefined) {
      notifyCallbacks(data);
    } else if (pendingRequests.has(data.id)) {
      // Handle responses to requests
      const resolve = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      resolve?.(data);
    }
  }
  /**
   * Fire our local notification callbacks
   */
  function notifyCallbacks(data) {
    for (const cb of notificationCallbacks) {
      try {
        cb(data);
      } catch (err) {
        console.log('[ChromeTransport] notifyCallbacks error:', err);
      }
    }
  }
  function removeAllNotificationListeners() {
    notificationCallbacks.clear();
  }
  return {
    connect: async () => {
      try {
        if (!extensionId) {
          extensionId = await (0,
          metamaskExtensionId_1.detectMetamaskExtensionId)();
        }
        const pendingPort = chrome.runtime.connect(extensionId);
        let isActive = true;
        pendingPort.onDisconnect.addListener(() => {
          console.log('[ChromeTransport] chromePort disconnected');
          chromePort = undefined;
          isActive = false;
        });
        // let a tick for onDisconnect
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (!isActive) {
          throw new Error(`No extension found with id: ${extensionId}`);
        }
        // Listen to messages from the extension
        pendingPort.onMessage.addListener(handleMessage);
        // Assign the port at the end to avoid race conditions
        chromePort = pendingPort;
      } catch (err) {
        throw new errors_1.TransportError('Failed to connect to MetaMask', err);
      }
    },
    disconnect: async () => {
      if (chromePort) {
        try {
          chromePort.disconnect();
          chromePort = undefined;
          removeAllNotificationListeners();
          pendingRequests.clear();
        } catch (err) {
          console.log('[ChromeTransport] disconnect error:', err);
        }
      }
    },
    isConnected: () => chromePort !== undefined,
    request: (params) => {
      const currentChromePort = chromePort;
      if (!currentChromePort) {
        throw new errors_1.TransportError('Chrome port not connected');
      }
      const id = requestId++;
      const requestPayload = {
        id,
        jsonrpc: '2.0',
        ...params,
      };
      return new Promise((resolve) => {
        pendingRequests.set(id, resolve);
        currentChromePort.postMessage({
          type: constants_1.REQUEST_CAIP,
          data: requestPayload,
        });
      });
    },
    onNotification: (callback) => {
      notificationCallbacks.add(callback);
      return () => {
        notificationCallbacks.delete(callback);
      };
    },
  };
}
//# sourceMappingURL=externallyConnectableTransport.cjs.map
