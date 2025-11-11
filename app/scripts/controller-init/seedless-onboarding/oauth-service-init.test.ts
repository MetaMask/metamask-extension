import { ControllerInitRequest } from '../types';
import {
  getOAuthServiceMessenger,
  OAuthServiceMessenger,
} from '../messengers/seedless-onboarding';
import { getRootMessenger } from '../../lib/messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import OAuthService from '../../services/oauth/oauth-service';
import { OAuthServiceInit } from './oauth-service-init';

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<OAuthServiceMessenger>
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

    // @ts-expect-error: Partial mock for testing.
    requestMock.getController.mockImplementation(() => {
      return {
        bufferedTrace: jest.fn(),
        bufferedEndTrace: jest.fn(),
        trackEvent: jest.fn(),
        addEventBeforeMetricsOptIn: jest.fn(),
        state: { participateInMetaMetrics: false },
      };
    });

    expect(OAuthServiceInit(requestMock).controller).toBeInstanceOf(
      OAuthService,
    );
  });
});
