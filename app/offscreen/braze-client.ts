import {
  BrazeAction,
  OffscreenCommunicationTarget,
  type BrazeMessage,
  type BrazeResponse,
} from '../../shared/constants/offscreen-communication';
import type { BrazeHost } from '../../shared/lib/braze';

type SendMessage = (
  message: BrazeMessage,
) => Promise<BrazeResponse | undefined>;

type DistributiveOmit<Type, Key extends PropertyKey> = Type extends unknown
  ? Omit<Type, Key>
  : never;

const sendMessageToOffscreen: SendMessage = (message) =>
  chrome.runtime.sendMessage(message);

/**
 * Create the MV3 Braze host client, which forwards each call to the Braze
 * host in the offscreen document.
 *
 * @param offscreenReady - Resolves when the offscreen document can receive
 * messages.
 * @param sendMessage - Sends a message to the offscreen document. Defaults to
 * `chrome.runtime.sendMessage`.
 * @returns The Braze host client.
 */
export function createOffscreenBrazeClient(
  offscreenReady: Promise<void>,
  sendMessage: SendMessage = sendMessageToOffscreen,
): BrazeHost {
  async function send(
    message: DistributiveOmit<BrazeMessage, 'target'>,
  ): Promise<Extract<BrazeResponse, { success: true }>> {
    await offscreenReady;

    const response = await sendMessage({
      target: OffscreenCommunicationTarget.brazeOffscreen,
      ...message,
    });

    if (!response?.success) {
      throw new Error(
        `Braze offscreen request ${message.action} failed: ${response?.error ?? 'no response from the offscreen document'}`,
      );
    }
    return response;
  }

  return {
    async syncUser(profileId) {
      await send({ action: BrazeAction.syncUser, profileId });
    },

    async getBanner(placementId) {
      const { banner } = await send({
        action: BrazeAction.getBanner,
        placementId,
      });
      return banner ?? null;
    },

    async logBannerInteraction(placementId, bannerId, interaction) {
      await send({
        action: BrazeAction.logBannerInteraction,
        placementId,
        bannerId,
        interaction,
      });
    },
  };
}
