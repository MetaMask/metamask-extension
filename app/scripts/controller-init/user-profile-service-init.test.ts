import {
  Env,
  UserProfileService,
  UserProfileServiceMessenger,
} from '@metamask/user-profile-controller';
import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getUserProfileServiceMessenger } from './messengers';
import { UserProfileServiceInit } from './user-profile-service-init';

jest.mock('@metamask/user-profile-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<UserProfileServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getUserProfileServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('UserProfileServiceInit', () => {
  it('initializes the service', () => {
    const { controller } = UserProfileServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(UserProfileService);
  });

  it('passes the proper arguments to the controller', () => {
    UserProfileServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(UserProfileService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      fetch: expect.any(Function),
      env: Env.PRD,
    });
  });
});
