import {
  Controller as NotificationServicesPushController,
  defaultState,
} from '@metamask/notification-services-controller/push-services';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getNotificationServicesPushControllerInitMessenger,
  getNotificationServicesPushControllerMessenger,
  NotificationServicesPushControllerInitMessenger,
  type NotificationServicesPushControllerMessenger,
} from '../messengers/notifications';
import {
  getNormalisedLocale,
  NotificationServicesPushControllerInit,
} from './notification-services-push-controller-init';

jest.mock('@metamask/notification-services-controller/push-services');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    NotificationServicesPushControllerMessenger,
    NotificationServicesPushControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNotificationServicesPushControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getNotificationServicesPushControllerInitMessenger(
      baseControllerMessenger,
    ),
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
        getLocale: expect.any(Function),
      },
    });
  });
});

describe('NotificationServicesPushControllerInit - getNormalisedLocale', () => {
  it('converts underscore locale to hypenated locale', () => {
    // normalises
    expect(getNormalisedLocale('en_GB')).toBe('en-GB');
    expect(getNormalisedLocale('zh_CN')).toBe('zh-CN');

    // does nothing (since already hyphenated)
    expect(getNormalisedLocale('en-GB')).toBe('en-GB');
    expect(getNormalisedLocale('zh-CN')).toBe('zh-CN');

    // does nothing (as does not specify region)
    expect(getNormalisedLocale('en')).toBe('en');
  });
});
