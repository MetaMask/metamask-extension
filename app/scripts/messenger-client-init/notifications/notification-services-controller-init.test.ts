import { Controller as NotificationServicesController } from '@metamask/notification-services-controller/notification-services';
import { Env } from '@metamask/profile-sync-controller/sdk';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getNotificationServicesControllerMessenger,
  type NotificationServicesControllerMessenger,
} from '../messengers/notifications';
import { getRootMessenger } from '../../lib/messenger';
import { NotificationServicesControllerInit } from './notification-services-controller-init';

jest.mock('@metamask/notification-services-controller/notification-services');
jest.mock('../../../../package.json', () => ({
  version: '1.2.3',
}));

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<NotificationServicesControllerMessenger>
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNotificationServicesControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('NotificationServicesControllerInit', () => {
  const arrange = () => {
    const NotificationServicesControllerClassMock = jest.mocked(
      NotificationServicesController,
    );

    const requestMock = buildInitRequestMock();

    return {
      NotificationServicesControllerClassMock,
      requestMock,
    };
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const { requestMock } = arrange();
    const result = NotificationServicesControllerInit(requestMock);
    expect(result.messengerClient).toBeInstanceOf(
      NotificationServicesController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const { requestMock, NotificationServicesControllerClassMock } = arrange();
    NotificationServicesControllerInit(requestMock);

    expect(NotificationServicesControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.NotificationServicesController,
      env: {
        featureAnnouncements: {
          platform: 'extension',
          spaceId: 'MOCK_SPACE_ID',
          accessToken: 'MOCK_ACCESS_TOKEN',
          platformVersion: expect.any(String),
        },
        locale: expect.any(Function),
        env: Env.PRD,
      },
    });
  });

  it('uses the authentication environment for notification API calls', () => {
    const previousEnvironment = process.env.METAMASK_ENVIRONMENT;
    const previousDevApiEnv = process.env.MM_DEV_API_ENV;
    const { requestMock, NotificationServicesControllerClassMock } = arrange();

    try {
      process.env.METAMASK_ENVIRONMENT = 'development';
      process.env.MM_DEV_API_ENV = 'dev';

      NotificationServicesControllerInit(requestMock);

      expect(NotificationServicesControllerClassMock).toHaveBeenCalledWith(
        expect.objectContaining({
          env: expect.objectContaining({ env: Env.DEV }),
        }),
      );
    } finally {
      if (previousEnvironment === undefined) {
        delete process.env.METAMASK_ENVIRONMENT;
      } else {
        process.env.METAMASK_ENVIRONMENT = previousEnvironment;
      }
      if (previousDevApiEnv === undefined) {
        delete process.env.MM_DEV_API_ENV;
      } else {
        process.env.MM_DEV_API_ENV = previousDevApiEnv;
      }
    }
  });
});
