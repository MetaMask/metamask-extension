import { Controller as NotificationServicesController } from '@metamask/notification-services-controller/notification-services';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getNotificationServicesControllerMessenger,
  type NotificationServicesControllerMessenger,
} from '../messengers/notifications';
import { NotificationServicesControllerInit } from './notification-services-controller-init';

jest.mock('@metamask/notification-services-controller/notification-services');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<NotificationServicesControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

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
    expect(result.controller).toBeInstanceOf(NotificationServicesController);
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
        },
      },
    });
  });
});
