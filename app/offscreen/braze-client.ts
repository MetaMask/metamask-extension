import {
  BrazeAction,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

export type BrazeSyncUserMessage = {
  target: OffscreenCommunicationTarget.brazeOffscreen;
  action: BrazeAction.syncUser;
  profileId: string | null;
};

export type BrazeSyncUserResponse =
  | { success: true }
  | { success: false; error: string };

type SendMessage = (
  message: BrazeSyncUserMessage,
) => Promise<BrazeSyncUserResponse | undefined>;

const sendMessageToOffscreen: SendMessage = (message) =>
  chrome.runtime.sendMessage(message);

/**
 * Create the MV3 sync function, which asks the offscreen document to apply the
 * desired Braze user.
 *
 * @param offscreenReady - Resolves when the offscreen document can receive
 * messages.
 * @param sendMessage - Sends a message to the offscreen document. Defaults to
 * `chrome.runtime.sendMessage`.
 * @returns A function that applies the desired user.
 */
export function createOffscreenBrazeClient(
  offscreenReady: Promise<void>,
  sendMessage: SendMessage = sendMessageToOffscreen,
) {
  return async function syncOffscreenBrazeUser(
    profileId: string | null,
  ): Promise<void> {
    await offscreenReady;

    const response = await sendMessage({
      target: OffscreenCommunicationTarget.brazeOffscreen,
      action: BrazeAction.syncUser,
      profileId,
    });

    if (!response?.success) {
      throw new Error(
        `Braze user sync failed: ${response?.error ?? 'no response from the offscreen document'}`,
      );
    }
  };
}
