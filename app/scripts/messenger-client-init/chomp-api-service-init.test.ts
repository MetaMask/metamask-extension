import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  ChompApiService,
  type ChompApiServiceMessenger,
} from '@metamask/chomp-api-service';
import type {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerState,
} from '@metamask/remote-feature-flag-controller';
import { MONEY_ACCOUNT_CHOMP_CONFIG_FLAG_NAME } from '../../../shared/lib/money/chomp-config';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getChompApiServiceInitMessenger,
  getChompApiServiceMessenger,
  type ChompApiServiceInitMessenger,
} from './messengers/chomp-api-service-messenger';
import {
  ChompApiServiceInit,
  DEFAULT_CHOMP_API_URL,
} from './chomp-api-service-init';
import type { MessengerClientInitRequest } from './types';

jest.mock('@metamask/chomp-api-service');

type BaseMessenger = Messenger<
  MockAnyNamespace,
  ActionConstraint | RemoteFeatureFlagControllerGetStateAction,
  never
>;

/**
 * Build a base messenger serving the given remote feature flags.
 *
 * @param remoteFeatureFlags - The remote feature flags to serve.
 * @returns The base messenger.
 */
function buildBaseMessenger(
  remoteFeatureFlags: Record<string, unknown> = {},
): BaseMessenger {
  const messenger: BaseMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });

  messenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () =>
      ({
        remoteFeatureFlags,
        cacheTimestamp: Date.now(),
      }) as unknown as RemoteFeatureFlagControllerState,
  );

  return messenger;
}

/**
 * Build the init request for the given base messenger.
 *
 * @param baseMessenger - The base messenger.
 * @returns The init request.
 */
function getInitRequestMock(
  baseMessenger: BaseMessenger,
): jest.Mocked<
  MessengerClientInitRequest<
    ChompApiServiceMessenger,
    ChompApiServiceInitMessenger
  >
> {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getChompApiServiceMessenger(baseMessenger),
    initMessenger: getChompApiServiceInitMessenger(baseMessenger),
  };
}

describe('ChompApiServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the service', () => {
    const { messengerClient } = ChompApiServiceInit(
      getInitRequestMock(buildBaseMessenger()),
    );

    expect(messengerClient).toBeInstanceOf(ChompApiService);
  });

  it('uses the base URL from the remote feature flag', () => {
    ChompApiServiceInit(
      getInitRequestMock(
        buildBaseMessenger({
          [MONEY_ACCOUNT_CHOMP_CONFIG_FLAG_NAME]: {
            baseUrl: 'https://chomp.example.test',
          },
        }),
      ),
    );

    expect(jest.mocked(ChompApiService)).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      baseUrl: 'https://chomp.example.test',
    });
  });

  for (const [description, flags] of [
    ['unserved', {}],
    ['malformed', { [MONEY_ACCOUNT_CHOMP_CONFIG_FLAG_NAME]: { baseUrl: 1 } }],
  ] as [string, Record<string, unknown>][]) {
    it(`falls back to the production base URL when the flag is ${description}`, () => {
      ChompApiServiceInit(getInitRequestMock(buildBaseMessenger(flags)));

      expect(jest.mocked(ChompApiService)).toHaveBeenCalledWith({
        messenger: expect.any(Object),
        baseUrl: DEFAULT_CHOMP_API_URL,
      });
    });
  }

  it('returns null for persistedStateKey', () => {
    const result = ChompApiServiceInit(
      getInitRequestMock(buildBaseMessenger()),
    );

    expect(result.persistedStateKey).toBeNull();
  });

  it('returns null for memStateKey', () => {
    const result = ChompApiServiceInit(
      getInitRequestMock(buildBaseMessenger()),
    );

    expect(result.memStateKey).toBeNull();
  });
});
