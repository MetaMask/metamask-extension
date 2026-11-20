import {
  BrazeAction,
  OffscreenCommunicationTarget,
  type BrazeSyncUserMessage,
  type BrazeSyncUserResponse,
} from '../../shared/constants/offscreen-communication';
import { isBrazeConfigured } from '../../shared/lib/braze';
import { captureException } from '../../shared/lib/sentry';
import { createBrazeHost } from '../braze/braze-host';

/**
 * Whether a message was sent by this extension's service worker.
 *
 * Offscreen documents only expose part of `chrome.runtime` (no `getManifest`,
 * for example), so the sender is identified by its fields: the service worker
 * has no tab and no document, while extension pages have a `documentId` and
 * tabs also have `tab`. `documentId` exists since Chrome 106 and offscreen
 * documents require Chrome 109, so extension pages always have it here.
 *
 * @param sender - The message sender.
 * @returns True for the background service worker.
 */
function isFromServiceWorker(sender: chrome.runtime.MessageSender): boolean {
  return (
    sender.id === chrome.runtime.id &&
    sender.documentId === undefined &&
    sender.tab === undefined
  );
}

/**
 * Listen for Braze user updates from the background. Does nothing in builds
 * without Braze configuration.
 *
 * Never throws, so a Braze failure cannot prevent the rest of the offscreen
 * document (hardware wallets, Snaps) from initializing.
 */
export default function initBraze(): void {
  if (!isBrazeConfigured()) {
    return;
  }

  try {
    registerBrazeMessageListener();
  } catch (error) {
    console.error('Braze initialization failed:', error);
  }
}

/**
 * Register the offscreen listener that applies Braze user updates.
 */
function registerBrazeMessageListener(): void {
  const syncBrazeUser = createBrazeHost();

  chrome.runtime.onMessage.addListener(
    (
      message: Partial<BrazeSyncUserMessage>,
      sender,
      sendResponse: (response: BrazeSyncUserResponse) => void,
    ) => {
      if (
        message?.target !== OffscreenCommunicationTarget.brazeOffscreen ||
        message.action !== BrazeAction.syncUser ||
        !isFromServiceWorker(sender)
      ) {
        return false;
      }

      const profileId =
        typeof message.profileId === 'string' && message.profileId
          ? message.profileId
          : null;

      syncBrazeUser(profileId)
        .then(() => sendResponse({ success: true }))
        .catch((error: unknown) => {
          captureException(error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return true;
    },
  );
}
