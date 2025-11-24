import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getUserProfileControllerMessenger } from './messengers';
import { UserProfileControllerInit } from './user-profile-controller-init';
import {
  UserProfileController,
  UserProfileControllerMessenger,
} from '@metamask/user-profile-controller';

jest.mock('@metamask/user-profile-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<UserProfileControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getUserProfileControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('UserProfileControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = UserProfileControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(UserProfileController);
  });

  it('passes the proper arguments to the controller', () => {
    UserProfileControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(UserProfileController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      assertUserOptedIn: expect.any(Function),
      getMetaMetricsId: expect.any(Function),
    });
  });
});
