import {
  AuthenticatedUserStorageService,
  type AuthenticatedUserStorageMessenger,
} from '@metamask/authenticated-user-storage';
import { ENVIRONMENT } from '../../../shared/constants/build';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getAuthenticatedUserStorageServiceMessenger } from './messengers/authenticated-user-storage-service-messenger';
import {
  AuthenticatedUserStorageServiceInit,
  getAuthenticatedUserStorageEnvironment,
} from './authenticated-user-storage-service-init';

jest.mock('@metamask/authenticated-user-storage');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<AuthenticatedUserStorageMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger:
      getAuthenticatedUserStorageServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };
}

describe('AuthenticatedUserStorageServiceInit', () => {
  it('initializes the service', () => {
    const { messengerClient } =
      AuthenticatedUserStorageServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(AuthenticatedUserStorageService);
  });

  it('passes prod as the environment by default', () => {
    AuthenticatedUserStorageServiceInit(getInitRequestMock());

    expect(AuthenticatedUserStorageService).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      environment: 'prod',
    });
  });
});

describe('getAuthenticatedUserStorageEnvironment', () => {
  const originalKeys = [
    'MM_DEV_API_ENV',
    'METAMASK_ENVIRONMENT',
    'FORCE_AUTH_MATCH_BUILD',
    'METAMASK_BUILD_TYPE',
  ] as const;
  const originalEnvironment = Object.fromEntries(
    originalKeys.map((key) => [key, process.env[key]]),
  );

  afterEach(() => {
    originalKeys.forEach((key) => {
      const value = originalEnvironment[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('maps identity env onto Authenticated User Storage env', () => {
    delete process.env.MM_DEV_API_ENV;
    delete process.env.FORCE_AUTH_MATCH_BUILD;
    const unset = getAuthenticatedUserStorageEnvironment();

    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
    process.env.MM_DEV_API_ENV = 'dev';
    const dev = getAuthenticatedUserStorageEnvironment();

    delete process.env.METAMASK_ENVIRONMENT;
    delete process.env.MM_DEV_API_ENV;
    process.env.FORCE_AUTH_MATCH_BUILD = 'true';
    process.env.METAMASK_BUILD_TYPE = 'uat';
    const uat = getAuthenticatedUserStorageEnvironment();

    expect({ unset, dev, uat }).toMatchInlineSnapshot(`
      {
        "dev": "dev",
        "uat": "uat",
        "unset": "prod",
      }
    `);
  });
});
