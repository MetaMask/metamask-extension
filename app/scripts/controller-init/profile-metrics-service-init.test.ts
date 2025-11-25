import {
  Env,
  ProfileMetricsService,
  ProfileMetricsServiceMessenger,
} from '@metamask/profile-metrics-controller';
import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getProfileMetricsServiceMessenger } from './messengers';
import { ProfileMetricsServiceInit } from './profile-metrics-service-init';

jest.mock('@metamask/profile-metrics-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<ProfileMetricsServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getProfileMetricsServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('ProfileMetricsServiceInit', () => {
  it('initializes the service', () => {
    const { controller } = ProfileMetricsServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(ProfileMetricsService);
  });

  it('passes the proper arguments to the controller', () => {
    ProfileMetricsServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(ProfileMetricsService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      fetch: expect.any(Function),
      env: Env.PRD,
    });
  });
});
