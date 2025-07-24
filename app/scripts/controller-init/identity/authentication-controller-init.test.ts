import { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';
import { Messenger } from '@metamask/base-controller';
import { Env } from '@metamask/profile-sync-controller/sdk';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getAuthenticationControllerMessenger,
  AuthenticationControllerMessenger,
} from '../messengers/identity';
import { AuthenticationControllerInit } from './authentication-controller-init';

jest.mock('@metamask/profile-sync-controller/auth');
jest.mock('../../../../shared/modules/environment', () => ({
  // it's stupid that we have to do this, but apparently the environment
  // is set to "test" instead of "testing" causing this to return true in tests.
  // fixing the environment variable causes cascading failures in other places
  isProduction: () => false,
}));

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AuthenticationControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAuthenticationControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
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
    expect(AuthenticationControllerInit(requestMock).controller).toBeInstanceOf(
      AuthenticationController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    AuthenticationControllerInit(requestMock);

    expect(AuthenticationControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.AuthenticationController,
      metametrics: {
        getMetaMetricsId: requestMock.getMetaMetricsId,
        agent: 'extension',
      },
      config: {
        env: Env.DEV,
      },
    });
  });
});
