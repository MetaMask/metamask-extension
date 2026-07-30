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
import {
  getAppVersionForRegistration,
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
  const arrange = (platformVersion = '7.80.0') => {
    const NotificationServicesPushControllerClassMock = jest.mocked(
      NotificationServicesPushController,
    );

    const requestMock = buildInitRequestMock();
    jest
      .spyOn(requestMock.platform, 'getVersion')
      .mockReturnValue(platformVersion);

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
        ...requestMock.persistedState.NotificationServicesPushController,
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

  it('omits app version when platform version is not backend-safe', () => {
    const { requestMock, NotificationServicesPushControllerClassMock } =
      arrange('7.80.0-flask.1');

    NotificationServicesPushControllerInit(requestMock);

    expect(NotificationServicesPushControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.not.objectContaining({
          appVersion: expect.any(String),
        }),
      }),
    );
  });
});

describe('getAppVersionForRegistration', () => {
  it.each(['7.80', '7.80.0', '12.18.3.0'])(
    'returns backend-safe app version %s',
    (version) => {
      expect(getAppVersionForRegistration(() => version)).toBe(version);
    },
  );

  it.each(['7', '7.80.0.1.2', '7.80.0-flask.1', '7.80.0+build.1', 'v7.80.0'])(
    'returns undefined when %s is not backend-safe',
    (version) => {
      expect(getAppVersionForRegistration(() => version)).toBeUndefined();
    },
  );

  it('returns undefined when the version lookup fails', () => {
    expect(
      getAppVersionForRegistration(() => {
        throw new Error('Version lookup failed');
      }),
    ).toBeUndefined();
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
