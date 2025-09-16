import { ActionConstraint, Messenger } from '@metamask/base-controller';
import { NetworkControllerGetSelectedNetworkClientAction } from '@metamask/network-controller';
import AccountTrackerController from '../controllers/account-tracker-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAccountTrackerControllerMessenger,
  AccountTrackerControllerMessenger,
  getAccountTrackerControllerInitMessenger,
  AccountTrackerControllerInitMessenger,
} from './messengers';
import { AccountTrackerControllerInit } from './account-tracker-controller-init';

jest.mock('../controllers/account-tracker-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    AccountTrackerControllerMessenger,
    AccountTrackerControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<
    NetworkControllerGetSelectedNetworkClientAction | ActionConstraint,
    never
  >();

  baseMessenger.registerActionHandler(
    'NetworkController:getSelectedNetworkClient',
    () => ({
      // @ts-expect-error: Partial mock.
      provider: {},

      // @ts-expect-error: Partial mock.
      blockTracker: {},
    }),
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountTrackerControllerMessenger(baseMessenger),
    initMessenger: getAccountTrackerControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('AccountTrackerControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = AccountTrackerControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AccountTrackerController);
  });

  it('passes the proper arguments to the controller', () => {
    AccountTrackerControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AccountTrackerController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: { accounts: {} },
      provider: expect.any(Object),
      blockTracker: expect.any(Object),
      getNetworkIdentifier: expect.any(Function),
    });
  });
});
