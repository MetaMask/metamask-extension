import {
  AiDigestController,
  AiDigestService,
  type AiDigestControllerMessenger,
} from '@metamask/ai-controllers';
import { getAiDigestControllerMessenger } from './messengers/ai-digest-controller-messenger';
import type { MessengerClientInitFunction } from './types';

export const DIGEST_API_BASE_URL = 'https://digest.api.cx.metamask.io/api/v1';

/**
 * Initialize the AiDigestController.
 *
 * The controller is a passthrough to the digest service; React Query in the UI
 * owns freshness and caching, so its state is neither persisted nor
 * synchronized with the UI.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger for the AiDigestController.
 * @returns The AiDigestController.
 */
export const AiDigestControllerInit: MessengerClientInitFunction<
  AiDigestController,
  AiDigestControllerMessenger
> = ({ controllerMessenger }) => {
  const digestService = new AiDigestService({
    baseUrl: DIGEST_API_BASE_URL,
  });

  const messengerClient = new AiDigestController({
    messenger: controllerMessenger,
    digestService,
  });

  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
  };
};
