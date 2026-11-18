import {
  ActionConstraint,
  Messenger,
  MOCK_ANY_NAMESPACE,
} from '@metamask/messenger';
import { AiDigestController } from '@metamask/ai-controllers';
import type { AiDigestControllerMessenger } from '@metamask/ai-controllers';
import { buildControllerInitRequestMock } from './test/utils';
import { getAiDigestControllerMessenger } from './messengers/ai-digest-controller-messenger';
import {
  AiDigestControllerInit,
  DIGEST_API_BASE_URL,
} from './ai-digest-controller-init';
import type { MessengerClientInitRequest } from './types';

/**
 * Build the init request for the given base messenger.
 *
 * @param baseMessenger - The base messenger.
 * @returns The init request.
 */
function getInitRequestMock(
  baseMessenger: Messenger<typeof MOCK_ANY_NAMESPACE, ActionConstraint, never>,
): MessengerClientInitRequest<AiDigestControllerMessenger, never> {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAiDigestControllerMessenger(baseMessenger),
    initMessenger: undefined as never,
  };
}

describe('AiDigestControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = AiDigestControllerInit(
      getInitRequestMock(new Messenger({ namespace: MOCK_ANY_NAMESPACE })),
    );

    expect(messengerClient).toBeInstanceOf(AiDigestController);
  });

  it('registers no persisted or mem state', () => {
    const result = AiDigestControllerInit(
      getInitRequestMock(new Messenger({ namespace: MOCK_ANY_NAMESPACE })),
    );

    expect(result.persistedStateKey).toBeNull();
    expect(result.memStateKey).toBeNull();
  });

  it('fetches market insights from the digest API through the controller messenger', async () => {
    const controllerMessenger = getAiDigestControllerMessenger(
      new Messenger({ namespace: MOCK_ANY_NAMESPACE }),
    );
    AiDigestControllerInit({
      ...buildControllerInitRequestMock(),
      controllerMessenger,
      initMessenger: undefined as never,
    });
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: false, status: 404 } as Response);

    const report = await controllerMessenger.call(
      'AiDigestController:fetchMarketInsights',
      'eip155:1/slip44:60',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${DIGEST_API_BASE_URL}/asset-summary?asset=${encodeURIComponent(
        'eip155:1/slip44:60',
      )}`,
    );
    expect(report).toBeNull();
  });
});
