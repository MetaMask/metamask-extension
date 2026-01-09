import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
  KnownOrigins,
} from '../../shared/constants/offscreen-communication';
import { CallbackProcessor } from './callback-processor';

// Target identifier used within the iframe's message handling
const LEDGER_FRAME_TARGET = 'LEDGER-IFRAME';

/**
 * The event name sent by the Ledger keyring iframe when the Ledger connection status changes.
 */
const LEDGER_KEYRING_IFRAME_CONNECTED_EVENT = 'ledger-connection-event';

// Interface for messages received from the main extension context
interface LedgerRequestMessage {
  target: string;
  action: LedgerAction;
  params: unknown; // Use unknown instead of any, as the contents vary by action
}

// Global instance to manage callbacks for asynchronous Ledger responses
const callbackProcessor = new CallbackProcessor();

/**
 * Sets up listeners for messages coming from the Ledger iframe and the main extension process.
 * * @param iframe - The HTMLIFrameElement hosting the Ledger bridge application.
 */
function setupMessageListeners(iframe: HTMLIFrameElement): void {
  // --- 1. Listener for Responses from the Ledger Iframe (PostMessage) ---
  
  window.addEventListener('message', ({ origin, data, source }) => {
    // Security check: Only process messages originating from the known Ledger bridge domain 
    // and specifically from the iframe's content window.
    if (origin !== KnownOrigins.ledger || source !== iframe.contentWindow) {
      return;
    }

    if (data) {
      // Handle the specialized connection event sent by the iframe
      if (data.action === LEDGER_KEYRING_IFRAME_CONNECTED_EVENT) {
        // Forward the connection status back to the main extension context
        chrome.runtime.sendMessage({
          action: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: data.payload.connected,
        });

        return;
      }

      // Process standard action responses. 
      // The response payload must contain a messageId to route it back to the initiator.
      callbackProcessor.processCallback(data);
    }
  });

  // --- 2. Listener for Requests from the Extension (chrome.runtime.onMessage) ---

  chrome.runtime.onMessage.addListener(
    (
      msg: LedgerRequestMessage,
      _sender, // Unused parameter
      sendResponse,
    ) => {
      // Check if the message is explicitly targeted at this offscreen document
      if (msg.target !== OffscreenCommunicationTarget.ledgerOffscreen) {
        return false; // Message is not for us
      }

      // Check for iframe readiness before attempting communication
      if (!iframe.contentWindow) {
        const error = new Error('Ledger iframe not present or window context is gone.');
        sendResponse({
          success: false,
          payload: {
            error: error.message, // Send error message string instead of Error object
          },
        });
        return false;
      }

      // Register the sendResponse callback function and get a unique message ID
      const messageId = callbackProcessor.registerCallback(sendResponse);
      
      // Construct the message to forward to the iframe. 
      // The message is augmented with the internal LEDGER_FRAME_TARGET and the messageId.
      const iframeMsg = {
        ...msg,
        target: LEDGER_FRAME_TARGET, // Target name used internally by the iframe's library
        messageId,
      };

      // Send the request to the iframe bridge.
      iframe.contentWindow.postMessage(iframeMsg, KnownOrigins.ledger);

      // Return true to indicate that we will call sendResponse asynchronously later.
      return true;
    },
  );
}

/**
 * Initializes the Ledger bridge iframe and sets up message listeners once loaded.
 */
export default async function init(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const iframe = document.createElement('iframe');
    
    // Hardcoded Ledger bridge URL and necessary 'hid' permission for hardware access
    iframe.src = 'https://metamask.github.io/ledger-iframe-bridge/9.0.1/';
    iframe.allow = 'hid';
    
    // Setup listeners on load event
    iframe.onload = () => {
      setupMessageListeners(iframe);
      resolve(); // Resolve the promise when setup is complete
    };
    
    // Robust error handling for iframe loading failure
    iframe.onerror = (error) => {
        const errorMessage = `Failed to load Ledger iframe: ${error?.type || 'Unknown error'}`;
        console.error(errorMessage, error);
        reject(new Error(errorMessage));
    }
    
    // Append the hidden iframe to the document body
    document.body.appendChild(iframe);
  });
}
