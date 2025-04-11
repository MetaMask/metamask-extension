import { Messenger } from '@metamask/base-controller';
import { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';

import type { AuthenticationControllerMessenger } from '../messengers/identity';
import { getAuthenticationControllerMessenger } from '../messengers/identity';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { AuthenticationControllerInit } from './authentication-controller-init';

jest.mock('@metamask/profile-sync-controller/auth');

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
    });
  });
});
