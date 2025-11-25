import {
  ProfileMetricsController,
  ProfileMetricsControllerMessenger,
} from '@metamask/profile-metrics-controller';
import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getProfileMetricsControllerMessenger } from './messengers';
import { ProfileMetricsControllerInit } from './profile-metrics-controller-init';

jest.mock('@metamask/profile-metrics-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<ProfileMetricsControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getProfileMetricsControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('ProfileMetricsControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = ProfileMetricsControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(ProfileMetricsController);
  });

  it('passes the proper arguments to the controller', () => {
    ProfileMetricsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(ProfileMetricsController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      assertUserOptedIn: expect.any(Function),
      getMetaMetricsId: expect.any(Function),
    });
  });
});
