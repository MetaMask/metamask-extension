import type { PasskeyCredential } from './passkeys';

const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 340;

type PasskeyResultMessage = {
  type: 'passkey-result';
  operationId: string;
  success: boolean;
  payload: PasskeyCredential | string | null;
  error: string | null;
};

/**
 * Bridge for WebAuthn passkey operations via a dedicated popup window.
 *
 * The service worker (MV3 background), offscreen documents, and Chrome
 * extension side panels cannot reliably call `navigator.credentials`
 * because WebAuthn requires user activation and/or is blocked in those
 * contexts. This bridge opens a small popup window where the WebAuthn
 * ceremony runs with full browser support, then communicates the result
 * back via `chrome.runtime` messaging.
 */
export class PasskeyOffscreenBridge {
  private static operationCounter = 0;

  /**
   * Create a new passkey credential via a popup window.
   * The popup also persists the credential ID in localStorage so that
   * `sign()` can look it up later.
   *
   * @param rpName - Optional relying party display name.
   * @returns The credential ID and public key, both base64url-encoded.
   */
  static create(rpName?: string): Promise<PasskeyCredential> {
    const params: Record<string, string> = {};
    if (rpName) {
      params.rpName = rpName;
    }
    return this.runInPopup<PasskeyCredential>('create', params);
  }

  /**
   * Request a passkey assertion (signature) via a popup window.
   * The popup reads the credential ID from localStorage using the
   * verifier ID.
   *
   * @param verifierId - The public key (base64url) that identifies
   *   the passkey.
   * @returns Serialised JSON of the assertion data.
   */
  static sign(verifierId: string): Promise<string> {
    return this.runInPopup<string>('sign', { verifierId });
  }

  /**
   * Open the passkey-popup.html page in a small popup window, wait for the
   * result message, then clean up and resolve.
   *
   * @param action - 'create' or 'sign'.
   * @param params - Additional query string parameters for the popup.
   * @returns The result from the popup page.
   */
  private static runInPopup<T>(
    action: string,
    params: Record<string, string>,
  ): Promise<T> {
    this.operationCounter += 1;
    const operationId = `pk-${this.operationCounter}-${Date.now()}`;

    return new Promise<T>((resolve, reject) => {
      let windowId: number | undefined;

      // --- message listener (receives result from popup page) -----------
      const onMessage = (msg: PasskeyResultMessage) => {
        if (
          msg?.type !== 'passkey-result' ||
          msg.operationId !== operationId
        ) {
          return;
        }
        cleanup();
        if (msg.success) {
          resolve(msg.payload as T);
        } else {
          reject(new Error(msg.error ?? 'Passkey operation failed'));
        }
      };

      // --- window close listener (user dismissed the popup) -------------
      const onWindowRemoved = (removedId: number) => {
        if (removedId === windowId) {
          cleanup();
          reject(new Error('Passkey popup was closed by the user'));
        }
      };

      const cleanup = () => {
        chrome.runtime.onMessage.removeListener(onMessage);
        chrome.windows.onRemoved.removeListener(onWindowRemoved);
        // Best-effort close; ignore errors if already closed.
        if (windowId !== undefined) {
          chrome.windows.remove(windowId).catch(() => {
            /* noop */
          });
        }
      };

      chrome.runtime.onMessage.addListener(onMessage);
      chrome.windows.onRemoved.addListener(onWindowRemoved);

      // Build the popup URL with query parameters.
      const qs = new URLSearchParams({ action, operationId, ...params });
      const url = chrome.runtime.getURL(`passkey-popup.html?${qs.toString()}`);

      chrome.windows.create(
        {
          url,
          type: 'popup',
          width: POPUP_WIDTH,
          height: POPUP_HEIGHT,
          focused: true,
        },
        (win) => {
          windowId = win?.id;
        },
      );
    });
  }
}
