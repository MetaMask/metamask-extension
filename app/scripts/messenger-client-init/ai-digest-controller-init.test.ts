import {
  ActionConstraint,
  Messenger,
  MOCK_ANY_NAMESPACE,
} from '@metamask/messenger';
import { AiDigestController, AiDigestService } from '@metamask/ai-controllers';
import type { AiDigestControllerMessenger } from '@metamask/ai-controllers';
import { buildControllerInitRequestMock } from './test/utils';
import { getAiDigestControllerMessenger } from './messengers/ai-digest-controller-messenger';
import {
  AiDigestControllerInit,
  DIGEST_API_BASE_URL,
} from './ai-digest-controller-init';
import type { MessengerClientInitRequest } from './types';

jest.mock('@metamask/ai-controllers');

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } = AiDigestControllerInit(
      getInitRequestMock(new Messenger({ namespace: MOCK_ANY_NAMESPACE })),
    );

    expect(messengerClient).toBeInstanceOf(AiDigestController);
  });

  it('constructs the digest service with the digest API base URL', () => {
    AiDigestControllerInit(
      getInitRequestMock(new Messenger({ namespace: MOCK_ANY_NAMESPACE })),
    );

    expect(jest.mocked(AiDigestService)).toHaveBeenCalledWith({
      baseUrl: DIGEST_API_BASE_URL,
    });
  });

  it('constructs the controller with the controller messenger and service', () => {
    AiDigestControllerInit(
      getInitRequestMock(new Messenger({ namespace: MOCK_ANY_NAMESPACE })),
    );

    expect(jest.mocked(AiDigestController)).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      digestService: expect.any(Object),
    });
  });

  it('registers no persisted or mem state', () => {
    const result = AiDigestControllerInit(
      getInitRequestMock(new Messenger({ namespace: MOCK_ANY_NAMESPACE })),
    );

    expect(result.persistedStateKey).toBeNull();
    expect(result.memStateKey).toBeNull();
  });
});
