import {
  OffscreenCommunicationTarget,
  PasskeyAction,
} from '../../shared/constants/offscreen-communication';
import {
  createPasskey,
  signWithPasskey,
} from '../../shared/lib/passkeys';

/**
 * Offscreen handler for WebAuthn passkey operations.
 *
 * The offscreen document has full DOM access including
 * `navigator.credentials`, which is not available in service workers (MV3
 * background) or extension side panels.
 */
export default function init() {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: PasskeyAction;
        params: Record<string, string>;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.passkeyOffscreen) {
        return;
      }

      switch (msg.action) {
        case PasskeyAction.create:
          createPasskey(msg.params?.rpName)
            .then((credential) => {
              // Persist the credential ID so sign operations can look it up
              globalThis.localStorage.setItem(
                `mpc-passkey:${credential.publicKey}`,
                credential.credentialId,
              );
              sendResponse({ success: true, payload: credential });
            })
            .catch((err: Error) => {
              sendResponse({
                success: false,
                payload: { error: err.message },
              });
            });
          break;

        case PasskeyAction.sign: {
          const { verifierId } = msg.params;
          const credentialId = globalThis.localStorage.getItem(
            `mpc-passkey:${verifierId}`,
          );

          if (!credentialId) {
            sendResponse({
              success: false,
              payload: {
                error: `No passkey credential found for verifier ${verifierId}`,
              },
            });
            break;
          }

          signWithPasskey(credentialId)
            .then((assertion) => {
              sendResponse({
                success: true,
                payload: JSON.stringify(assertion),
              });
            })
            .catch((err: Error) => {
              sendResponse({
                success: false,
                payload: { error: err.message },
              });
            });
          break;
        }

        default:
          sendResponse({
            success: false,
            payload: { error: 'Passkey action not supported' },
          });
      }

      // Keep sendResponse valid after return for async handlers
      // eslint-disable-next-line consistent-return
      return true;
    },
  );
}
