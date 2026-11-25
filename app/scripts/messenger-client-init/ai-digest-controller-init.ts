import {
  AiDigestController,
  AiDigestService,
  type AiDigestControllerMessenger,
} from '@metamask/ai-controllers';
import type { MessengerClientInitFunction } from './types';

/**
 * Base URL for the MetaMask digest API. Deliberately hardcoded for phase
 * one to match the MetaMask Mobile client, which pins the same production
 * digest endpoint. A config seam (build-time env override) can replace this
 * literal in a follow-up if operations needs a rotation path.
 */
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
