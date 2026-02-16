import type { PasskeyCredential } from './passkeys';
import {
  OffscreenCommunicationTarget,
  PasskeyAction,
} from '../constants/offscreen-communication';

/**
 * Bridge for WebAuthn passkey operations via the offscreen document.
 *
 * The service worker (MV3 background) and Chrome extension side panels cannot
 * call `navigator.credentials` directly. This bridge forwards requests to
 * the offscreen document where the WebAuthn API is available.
 *
 * Can be imported from both UI and background contexts because it only uses
 * `chrome.runtime.sendMessage`, which is available in every extension context.
 */
export class PasskeyOffscreenBridge {
  /**
   * Create a new passkey credential in the offscreen document.
   * The offscreen handler also persists the credential ID in localStorage
   * so that `sign()` can look it up later.
   *
   * @param rpName - Optional relying party display name.
   * @returns The credential ID and public key, both base64url-encoded.
   */
  static create(rpName?: string): Promise<PasskeyCredential> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.passkeyOffscreen,
          action: PasskeyAction.create,
          params: { rpName: rpName ?? 'MetaMask MPC Wallet' },
        },
        (response: {
          success: boolean;
          payload: PasskeyCredential | { error: string };
        }) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response?.success) {
            resolve(response.payload as PasskeyCredential);
          } else {
            reject(
              new Error(
                (response?.payload as { error: string })?.error ??
                  'Passkey creation failed',
              ),
            );
          }
        },
      );
    });
  }

  /**
   * Request a passkey assertion (signature) from the offscreen document.
   * The offscreen handler looks up the credential ID from localStorage
   * using the verifier ID.
   *
   * @param verifierId - The public key (base64url) that identifies the passkey.
   * @returns Serialised JSON of the assertion data.
   */
  static sign(verifierId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          target: OffscreenCommunicationTarget.passkeyOffscreen,
          action: PasskeyAction.sign,
          params: { verifierId },
        },
        (response: {
          success: boolean;
          payload: string | { error: string };
        }) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response?.success) {
            resolve(response.payload as string);
          } else {
            reject(
              new Error(
                (response?.payload as { error: string })?.error ??
                  'Passkey signing failed',
              ),
            );
          }
        },
      );
    });
  }
}
