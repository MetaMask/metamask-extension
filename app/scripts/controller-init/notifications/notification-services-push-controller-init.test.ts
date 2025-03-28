import {
  Controller as NotificationServicesPushController,
  defaultState,
} from '@metamask/notification-services-controller/push-services';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getNotificationServicesPushControllerMessenger,
  type NotificationServicesPushControllerMessenger,
} from '../messengers/notifications';
import { NotificationServicesPushControllerInit } from './notification-services-push-controller-init';

jest.mock('@metamask/notification-services-controller/push-services');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<NotificationServicesPushControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNotificationServicesPushControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('NotificationServicesPushControllerInit', () => {
  const arrange = () => {
    const NotificationServicesPushControllerClassMock = jest.mocked(
      NotificationServicesPushController,
    );

    const requestMock = buildInitRequestMock();

    return {
      NotificationServicesPushControllerClassMock,
      requestMock,
    };
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const { requestMock } = arrange();
    const result = NotificationServicesPushControllerInit(requestMock);
    expect(result.controller).toBeInstanceOf(
      NotificationServicesPushController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const { requestMock, NotificationServicesPushControllerClassMock } =
      arrange();
    NotificationServicesPushControllerInit(requestMock);

    expect(NotificationServicesPushControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: {
        ...defaultState,
        ...requestMock.persistedState.NotificationServicesController,
      },
      env: {
        apiKey: '',
        authDomain: '',
        storageBucket: '',
        projectId: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
        vapidKey: '',
      },
      config: {
        isPushFeatureEnabled: false,
        platform: 'extension',
        pushService: {
          createRegToken: expect.any(Function),
          deleteRegToken: expect.any(Function),
          subscribeToPushNotifications: expect.any(Function),
        },
      },
    });
  });
});
