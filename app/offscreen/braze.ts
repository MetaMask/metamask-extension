import {
  BrazeAction,
  OffscreenCommunicationTarget,
  type BrazeResponse,
} from '../../shared/constants/offscreen-communication';
import {
  isBrazeConfigured,
  type BrazeBanner,
  type BrazeBannerInteraction,
  type BrazeHost,
} from '../../shared/lib/braze';
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
 * Listen for Braze calls from the background. Does nothing in builds without
 * Braze configuration.
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
 * The fields of any `BrazeMessage`, none of which are trusted.
 */
type UntrustedBrazeMessage = {
  target?: unknown;
  action?: unknown;
  profileId?: unknown;
  placementId?: unknown;
  bannerId?: unknown;
  interaction?: unknown;
};

const BANNER_INTERACTIONS: readonly unknown[] = [
  'impression',
  'click',
  'dismiss',
] satisfies BrazeBannerInteraction[];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Call the host for a Braze message.
 *
 * @param host - The Braze host.
 * @param message - The message, whose fields are not trusted.
 * @returns The host call, or `undefined` for an unknown or malformed message.
 */
function handleBrazeMessage(
  host: BrazeHost,
  message: UntrustedBrazeMessage,
): Promise<BrazeBanner | null | void> | undefined {
  switch (message.action) {
    case BrazeAction.syncUser:
      return host.syncUser(
        isNonEmptyString(message.profileId) ? message.profileId : null,
      );
    case BrazeAction.getBanner:
      return isNonEmptyString(message.placementId)
        ? host.getBanner(message.placementId)
        : undefined;
    case BrazeAction.logBannerInteraction:
      return isNonEmptyString(message.placementId) &&
        isNonEmptyString(message.bannerId) &&
        BANNER_INTERACTIONS.includes(message.interaction)
        ? host.logBannerInteraction(
            message.placementId,
            message.bannerId,
            message.interaction as BrazeBannerInteraction,
          )
        : undefined;
    default:
      return undefined;
  }
}

/**
 * Register the offscreen listener that serves the background's Braze calls.
 */
function registerBrazeMessageListener(): void {
  const host = createBrazeHost();

  chrome.runtime.onMessage.addListener(
    (
      message: UntrustedBrazeMessage | undefined,
      sender,
      sendResponse: (response: BrazeResponse) => void,
    ) => {
      if (
        message?.target !== OffscreenCommunicationTarget.brazeOffscreen ||
        !isFromServiceWorker(sender)
      ) {
        return false;
      }

      const request = handleBrazeMessage(host, message);
      if (!request) {
        return false;
      }

      request
        .then((banner) =>
          sendResponse(
            banner === undefined
              ? { success: true }
              : { success: true, banner },
          ),
        )
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
