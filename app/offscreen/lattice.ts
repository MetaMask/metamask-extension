// offscreen-tab-opener.js

import {
    KnownOrigins,
    OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

/**
 * @private
 * Attempts to open a new browser tab for the Lattice connector URL.
 * Throws an error if the tab opening is blocked (e.g., by a pop-up blocker).
 * @param {string} url - The URL of the Lattice connector page.
 * @returns {Promise<Window>} The newly opened browser tab window object.
 */
async function openConnectorTab(url: string): Promise<Window> {
    const browserTab = window.open(url);
    if (!browserTab) {
        throw new Error('Failed to open Lattice connector. Check for pop-up blockers.');
    }
    return browserTab;
}

/**
 * @public
 * Initializes the message listener for the Offscreen Document.
 * This listener handles requests from the Service Worker to open the Lattice connection tab,
 * listens for the response (creds) from that tab, and forwards the result back.
 */
export default function init(): void {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        // 1. Filter: Only process messages targeting this offscreen document.
        if (msg.target !== OffscreenCommunicationTarget.latticeOffscreen) {
            return false; // Return false if we haven't processed the message.
        }

        // Open the tab and start the monitoring process asynchronously.
        openConnectorTab(msg.params.url)
            .then((browserTab) => {
                let listenInterval: number;
                let onMessageListener: (event: MessageEvent) => void;

                /**
                 * Common cleanup function to stop the interval and remove the event listener.
                 */
                const cleanupAndRespond = (response: { error?: Error | string, result?: any }) => {
                    clearInterval(listenInterval);
                    if (onMessageListener) {
                        window.removeEventListener('message', onMessageListener, false);
                    }
                    // Serialize Error object to string message for reliable transmission
                    if (response.error && typeof response.error !== 'string') {
                        response.error = response.error.message;
                    }
                    sendResponse(response);
                };

                // 2. Start checking if the window is closed by the user.
                listenInterval = window.setInterval(() => {
                    if (browserTab.closed) {
                        cleanupAndRespond({ error: 'Lattice connector closed by user.' });
                    }
                }, 500);

                // 3. Define and register the message listener for the credentials.
                onMessageListener = (event: MessageEvent) => {
                    // Security check: Verify origin, source, and data type.
                    if (
                        event.origin !== KnownOrigins.lattice ||
                        event.source !== browserTab ||
                        typeof event.data !== 'string'
                    ) {
                        return; // Ignore non-Lattice or malformed messages.
                    }

                    try {
                        const creds = JSON.parse(event.data);

                        if (!creds || !creds.deviceID || !creds.password) {
                            // Invalid data structure received.
                            throw new Error('Invalid credentials structure returned from Lattice.');
                        }
                        
                        // Success: Cleanup and send result back to the Service Worker.
                        cleanupAndRespond({ result: creds });

                    } catch (error) {
                        console.error('Error processing Lattice credentials:', error);
                        // Failure: Cleanup and send error back.
                        cleanupAndRespond({ error: (error as Error).message || 'Unknown error parsing credentials.' });
                    }
                };
                
                window.addEventListener('message', onMessageListener, false);
            })
            .catch((error) => {
                // Handle tab opening failure (e.g., pop-up
