import { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
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
  ControllerInitRequest<
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
        getMetaMetricsId: expect.any(Function),
        agent: 'extension',
      },
    });
  });
});
