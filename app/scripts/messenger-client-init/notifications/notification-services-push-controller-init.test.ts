// Mocha's global `it` type lacks `.each`, so use Jest's typed `it`.
import { it } from '@jest/globals';
import {
  Controller as NotificationServicesPushController,
  defaultState,
} from '@metamask/notification-services-controller/push-services';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getNotificationServicesPushControllerInitMessenger,
  getNotificationServicesPushControllerMessenger,
  NotificationServicesPushControllerInitMessenger,
  type NotificationServicesPushControllerMessenger,
} from '../messengers/notifications';
import { getRootMessenger } from '../../lib/messenger';
import ExtensionPlatform from '../../platforms/extension';
import {
  getNormalisedLocale,
  NotificationServicesPushControllerInit,
} from './notification-services-push-controller-init';

jest.mock('@metamask/notification-services-controller/push-services');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    NotificationServicesPushControllerMessenger,
    NotificationServicesPushControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

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

  const getControllerConfig = (
    mock: jest.MockedObjectDeep<typeof NotificationServicesPushController>,
  ) => mock.mock.calls[0][0].config;

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(ExtensionPlatform.prototype, 'getVersion')
      .mockReturnValue('7.80.0');
  });

  it('returns controller instance', () => {
    const { requestMock } = arrange();
    const result = NotificationServicesPushControllerInit(requestMock);
    expect(result.messengerClient).toBeInstanceOf(
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
        appVersion: '7.80.0',
      },
    });
  });

  it.each(['7.80', '7.80.0', '12.18.3.0'])(
    'includes backend-safe app version %s in the push registration config',
    (version) => {
      const { requestMock, NotificationServicesPushControllerClassMock } =
        arrange();
      jest
        .spyOn(ExtensionPlatform.prototype, 'getVersion')
        .mockReturnValue(version);

      NotificationServicesPushControllerInit(requestMock);

      expect(
        getControllerConfig(NotificationServicesPushControllerClassMock),
      ).toEqual(expect.objectContaining({ appVersion: version }));
    },
  );

  it.each(['7', '7.80.0.1.2', '7.80.0-flask.1', '7.80.0+build.1', 'v7.80.0'])(
    'omits app version when %s is not backend-safe',
    (version) => {
      const { requestMock, NotificationServicesPushControllerClassMock } =
        arrange();
      jest
        .spyOn(ExtensionPlatform.prototype, 'getVersion')
        .mockReturnValue(version);

      NotificationServicesPushControllerInit(requestMock);

      expect(
        getControllerConfig(NotificationServicesPushControllerClassMock),
      ).toEqual(
        expect.not.objectContaining({ appVersion: expect.any(String) }),
      );
    },
  );

  it('omits app version when the version lookup fails', () => {
    const { requestMock, NotificationServicesPushControllerClassMock } =
      arrange();
    jest
      .spyOn(ExtensionPlatform.prototype, 'getVersion')
      .mockImplementation(() => {
        throw new Error('Version lookup failed');
      });

    NotificationServicesPushControllerInit(requestMock);

    expect(
      getControllerConfig(NotificationServicesPushControllerClassMock),
    ).toEqual(expect.not.objectContaining({ appVersion: expect.any(String) }));
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
