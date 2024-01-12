import {
  KnownOrigins,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== OffscreenCommunicationTarget.latticeOffscreen) {
    return;
  }

  // Open the tab
  openConnectorTab(msg.params.url).then((browserTab) => {
    // Watch for the open window closing before creds are sent back
    const listenInterval = setInterval(() => {
      if (browserTab.closed) {
        clearInterval(listenInterval);
        sendResponse({
          error: new Error('Lattice connector closed.'),
        });
      }
    }, 500);

    // On a Chromium browser we can just listen for a window message
    window.addEventListener(
      'message',
      (event) => {
        // Ensure origin
        if (event.origin !== KnownOrigins.lattice) {
          return;
        }

        try {
          // Stop the listener
          clearInterval(listenInterval);

          // Parse and return creds
          const creds = JSON.parse(event.data);
          if (!creds.deviceID || !creds.password) {
            sendResponse({
              error: new Error('Invalid credentials returned from Lattice.'),
            });
          }
          sendResponse({
            result: creds,
          });
        } catch (err) {
          sendResponse({
            error: err,
          });
        }
      },
      false,
    );
  });

  // eslint-disable-next-line consistent-return
  return true;
});

async function openConnectorTab(url: string) {
  const browserTab = window.open(url);
  if (!browserTab) {
    throw new Error('Failed to open Lattice connector.');
  }

  return browserTab;
}

export {};
