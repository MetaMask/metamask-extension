import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import {
  getOAuthServiceMessenger,
  OAuthServiceMessenger,
} from '../messengers/seedless-onboarding';
import { buildControllerInitRequestMock } from '../test/utils';
import { OAuthServiceInit } from './oauth-service-init';
import OAuthService from '../../services/oauth/oauth-service';

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    OAuthServiceMessenger
  >
> {
  const baseControllerMessenger = new Messenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getOAuthServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('OAuthServiceInit', () => {
  it('returns the service instance', () => {
    const requestMock = buildInitRequestMock();

    // @ts-expect-error: Partial mock for testing.
    requestMock.getController.mockImplementation(() => {
      return {
        bufferedTrace: jest.fn(),
        bufferedEndTrace: jest.fn(),
      }
    })

    expect(
      OAuthServiceInit(requestMock).controller,
    ).toBeInstanceOf(OAuthService);
  });
});
