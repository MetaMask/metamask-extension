import {
  ProfileMetricsController,
  ProfileMetricsControllerMessenger,
} from '@metamask/profile-metrics-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getProfileMetricsControllerMessenger } from './messengers';
import { ProfileMetricsControllerInit } from './profile-metrics-controller-init';

jest.mock('@metamask/profile-metrics-controller');

function getInitRequestMock(
  useExternalServices = true,
): jest.Mocked<MessengerClientInitRequest<ProfileMetricsControllerMessenger>> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getProfileMetricsControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  requestMock.getMessengerClient.mockImplementation((name) => {
    if (name === 'AnalyticsController') {
      return { state: { optedIn: true, analyticsId: 'test-id' } } as never;
    }
    if (name === 'AppStateController') {
      return { state: { pna25Acknowledged: true } } as never;
    }
    if (name === 'PreferencesController') {
      return { state: { useExternalServices } } as never;
    }
    throw new Error(`Unexpected messenger client: ${name}`);
  });

  return requestMock;
}

describe('ProfileMetricsControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } =
      ProfileMetricsControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(ProfileMetricsController);
  });

  it('passes the proper arguments to the controller', () => {
    ProfileMetricsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(ProfileMetricsController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      interval: expect.any(Number),
      assertUserOptedIn: expect.any(Function),
      initialDelayDuration: expect.any(Number),
      getMetaMetricsId: expect.any(Function),
    });
    expect(controllerMock.mock.calls[0][0].assertUserOptedIn()).toBe(true);
  });

  it('prevents profile metrics when basic functionality is disabled', () => {
    ProfileMetricsControllerInit(getInitRequestMock(false));

    const controllerMock = jest.mocked(ProfileMetricsController);
    expect(controllerMock.mock.calls[0][0].assertUserOptedIn()).toBe(false);
  });
});
