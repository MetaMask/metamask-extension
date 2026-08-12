import { MessengerClientInitRequest } from '../types';
import { getOAuthServiceMessenger } from '../messengers/seedless-onboarding';
import { getRootMessenger } from '../../lib/messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import { OAuthService } from '../../services/oauth/oauth-service';
import { OAuthServiceMessenger } from '../../services/oauth/types';
import { OAuthServiceInit } from './oauth-service-init';

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<OAuthServiceMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getOAuthServiceMessenger(baseControllerMessenger),
    initMessenger: undefined,
  };
}

describe('OAuthServiceInit', () => {
  it('returns the service instance', () => {
    const requestMock = buildInitRequestMock();
    const metaMetricsController = {
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
    };

    // @ts-expect-error: Partial mock for testing.
    requestMock.getMessengerClient.mockImplementation(() => {
      return metaMetricsController;
    });

    expect(OAuthServiceInit(requestMock).messengerClient).toBeInstanceOf(
      OAuthService,
    );
  });
});
