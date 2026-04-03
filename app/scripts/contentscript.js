import { getIsBrowserPrerenderBroken } from '../../shared/lib/browser-runtime.utils';
import shouldInjectProvider from '../../shared/lib/provider-injection';
import {
  destroyStreams,
  initStreams,
  onDisconnectDestroyStreams,
  setupExtensionStreams,
} from './streams/provider-stream';
import {
  isDetectedPhishingSite,
  initPhishingStreams,
} from './streams/phishing-stream';
import {
  initializeCookieHandlerSteam,
  isDetectedCookieMarketingSite,
} from './streams/cookie-handler-stream';

const start = () => {
  if (isDetectedPhishingSite) {
    initPhishingStreams();
    return;
  }

  if (isDetectedCookieMarketingSite) {
    initializeCookieHandlerSteam();
  }

  if (shouldInjectProvider()) {
    initStreams();

    if (document.prerendering && getIsBrowserPrerenderBroken()) {
      document.addEventListener('prerenderingchange', () => {
        onDisconnectDestroyStreams(
          new Error('Prerendered page has become active.'),
        );
      });
    }

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.warn('BFCached page has become active. Restoring the streams.');
        setupExtensionStreams();
      }
    });

    window.addEventListener('pagehide', (event) => {
      if (event.persisted) {
        console.warn('Page may become BFCached. Destroying the streams.');
        destroyStreams();
      }
    });
  }
};

start();

// PoC: 1-click state log export bridge
// Listens for postMessage from support.metamask.io (and localhost for local dev).
// Consent is handled by the native MetaMask approval popup — the background opens
// notification.html with the stateLogExport template before returning any data.
(function setupStateLogBridge() {
  function isAllowedOrigin(origin) {
    if (origin === 'https://support.metamask.io') return true;
    // 'null' is the serialized opaque origin for file:// pages — allow for local dev
    if (origin === 'null') return true;
    try {
      const url = new URL(origin);
      return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    } catch {
      return false;
    }
  }

  // Use '*' when origin is the opaque 'null' (file:// pages); otherwise pin to sender
  function responseTarget(origin) {
    return origin === 'null' ? '*' : origin;
  }

  function triggerDownload(stateString) {
    const blob = new Blob([stateString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MetaMask-state-logs-${Date.now()}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.addEventListener('message', (event) => {
    if (!isAllowedOrigin(event.origin)) return;
    if (event.data?.type !== 'METAMASK_REQUEST_STATE_LOGS') return;

    const target = responseTarget(event.origin);

    // The background opens the native MetaMask approval popup and blocks until
    // the user approves or rejects. sendResponse is only called after resolution.
    chrome.runtime.sendMessage(
      { type: 'METAMASK_REQUEST_STATE_LOGS' },
      (response) => {
        if (chrome.runtime.lastError || response?.denied || !response?.stateString) {
          const isDenied = response?.denied;
          window.postMessage(
            {
              type: isDenied
                ? 'METAMASK_STATE_LOGS_DENIED'
                : 'METAMASK_STATE_LOGS_ERROR',
              error: isDenied
                ? undefined
                : (chrome.runtime.lastError?.message ?? 'Failed to retrieve state logs'),
            },
            target,
          );
          return;
        }

        triggerDownload(response.stateString);
        window.postMessage({ type: 'METAMASK_STATE_LOGS_SUCCESS' }, target);
      },
    );
  });
})();
