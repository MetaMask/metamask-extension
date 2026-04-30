import { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';
import { Env } from '@metamask/profile-sync-controller/sdk';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getAuthenticationControllerMessenger,
  AuthenticationControllerMessenger,
  AuthenticationControllerInitMessenger,
  getAuthenticationControllerInitMessenger,
} from '../messengers/identity';
import { getRootMessenger } from '../../lib/messenger';
import { AuthenticationControllerInit } from './authentication-controller-init';

jest.mock('@metamask/profile-sync-controller/auth');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    AuthenticationControllerMessenger,
    AuthenticationControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAuthenticationControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getAuthenticationControllerInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('AuthenticationControllerInit', () => {
  const AuthenticationControllerClassMock = jest.mocked(
    AuthenticationController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      AuthenticationControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(AuthenticationController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    AuthenticationControllerInit(requestMock);

    expect(AuthenticationControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.AuthenticationController,
      metametrics: {
        getMetaMetricsId: expect.any(Function),
        agent: 'extension',
        getAppVersion: expect.any(Function),
      },
      config: {
        env: Env.PRD,
      },
    });
  });

  it('wires getAppVersion to process.env.METAMASK_VERSION', () => {
    const originalVersion = process.env.METAMASK_VERSION;
    process.env.METAMASK_VERSION = '12.34.5';

    try {
      const requestMock = buildInitRequestMock();
      AuthenticationControllerInit(requestMock);

      const constructorArgs =
        AuthenticationControllerClassMock.mock.calls[0][0];
      expect(constructorArgs.metametrics.getAppVersion?.()).toBe('12.34.5');
    } finally {
      process.env.METAMASK_VERSION = originalVersion;
    }
  });

  it('returns undefined from getAppVersion when METAMASK_VERSION is unset', () => {
    const originalVersion = process.env.METAMASK_VERSION;
    delete process.env.METAMASK_VERSION;

    try {
      const requestMock = buildInitRequestMock();
      AuthenticationControllerInit(requestMock);

      const constructorArgs =
        AuthenticationControllerClassMock.mock.calls[0][0];
      expect(constructorArgs.metametrics.getAppVersion?.()).toBeUndefined();
    } finally {
      process.env.METAMASK_VERSION = originalVersion;
    }
  });
});
