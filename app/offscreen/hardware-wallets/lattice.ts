import { OffscreenCommunicationTarget } from '../../../shared/constants/offscreen-communication';
import {
  type GridPlusConnectResponse,
  parseGridPlusConnectUrl,
  validateGridPlusConnectMessage,
} from '../../scripts/lib/gridplus-connect';

const CONNECT_CLOSE_GRACE_PERIOD_MS = 1000;

async function openConnectorTab(url: string) {
  const browserTab = window.open(url);
  if (!browserTab) {
    throw new Error('Failed to open GridPlus Connect.');
  }

  return browserTab;
}

export default function init() {
  /**
   * Handles the GridPlus Connect flow for MV3 extensions.
   *
   * Service workers do not have DOM access, so the keyring bridge sends the
   * Connect URL here and this offscreen document opens the tab, receives the
   * v1 postMessage result, validates it, and forwards it back to the keyring.
   */
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.target !== OffscreenCommunicationTarget.latticeOffscreen) {
      return;
    }

    if (!msg.params?.url || typeof msg.params.url !== 'string') {
      sendResponse({ error: 'Missing connect URL.' });
      return;
    }

    let parsedConnectUrl: ReturnType<typeof parseGridPlusConnectUrl>;

    try {
      parsedConnectUrl = parseGridPlusConnectUrl(msg.params.url);
    } catch (error) {
      sendResponse({
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    let finished = false;
    let browserTab: Window | null = null;
    let listenInterval: ReturnType<typeof setInterval> | null = null;
    let closeGraceTimeout: ReturnType<typeof setTimeout> | null = null;
    let handleMessage: ((event: MessageEvent) => void) | null = null;

    const cleanup = () => {
      if (listenInterval !== null) {
        clearInterval(listenInterval);
        listenInterval = null;
      }

      if (closeGraceTimeout !== null) {
        clearTimeout(closeGraceTimeout);
        closeGraceTimeout = null;
      }

      if (handleMessage) {
        window.removeEventListener('message', handleMessage);
        handleMessage = null;
      }
    };

    const finish = (response: GridPlusConnectResponse) => {
      if (finished) {
        return;
      }

      finished = true;
      cleanup();
      sendResponse(response);
    };

    const fail = (error: string) => finish({ error });

    const scheduleClosedFailure = () => {
      if (closeGraceTimeout !== null) {
        return;
      }

      closeGraceTimeout = setTimeout(() => {
        fail('GridPlus Connect closed.');
      }, CONNECT_CLOSE_GRACE_PERIOD_MS);
    };

    openConnectorTab(parsedConnectUrl.url.toString())
      .then((openedTab) => {
        browserTab = openedTab;

        listenInterval = setInterval(() => {
          if (browserTab?.closed) {
            scheduleClosedFailure();
          }
        }, 500);

        handleMessage = (event: MessageEvent) => {
          if (event.origin !== parsedConnectUrl.expectedOrigin) {
            return;
          }

          const validation = validateGridPlusConnectMessage(event.data, {
            expectedClient: parsedConnectUrl.expectedClient,
            expectedRequestId: parsedConnectUrl.expectedRequestId,
          });

          if (validation.status === 'ignore') {
            return;
          }

          if (validation.status === 'error') {
            fail(validation.error);
            return;
          }

          // Chromium extension offscreen documents do not consistently preserve
          // WindowProxy identity for messages from opened cross-origin tabs. The
          // response is bound to this flow by origin plus the request id/client
          // values validated above.
          try {
            browserTab?.close();
          } catch {
            // Ignore close errors.
          }

          finish({ result: validation.result });
        };

        window.addEventListener('message', handleMessage, false);
      })
      .catch((error) => {
        fail(error instanceof Error ? error.message : String(error));
      });

    // eslint-disable-next-line consistent-return
    return true;
  });
}
