import { Messenger, ActionConstraint } from '@metamask/base-controller';
import { TokenBalancesController } from '@metamask/assets-controllers';
import { PreferencesControllerGetStateAction } from '../controllers/preferences-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getTokenBalancesControllerInitMessenger,
  getTokenBalancesControllerMessenger,
  TokenBalancesControllerInitMessenger,
  TokenBalancesControllerMessenger,
} from './messengers';
import { TokenBalancesControllerInit } from './token-balances-controller-init';

jest.mock('@metamask/assets-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    TokenBalancesControllerMessenger,
    TokenBalancesControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<
    PreferencesControllerGetStateAction | ActionConstraint,
    never
  >();

  // @ts-expect-error: Partial mock.
  baseMessenger.registerActionHandler('PreferencesController:getState', () => ({
    useMultiAccountBalanceChecker: true,
  }));

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTokenBalancesControllerMessenger(baseMessenger),
    initMessenger: getTokenBalancesControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('TokenBalancesControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = TokenBalancesControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(TokenBalancesController);
  });

  it('passes the proper arguments to the controller', () => {
    TokenBalancesControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(TokenBalancesController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      interval: 30_000,
      useAccountsAPI: false,
      queryMultipleAccounts: true,
    });
  });
});
