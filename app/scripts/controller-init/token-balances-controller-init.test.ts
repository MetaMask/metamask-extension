import {
  Messenger,
  ActionConstraint,
  MockAnyNamespace,
  MOCK_ANY_NAMESPACE,
} from '@metamask/messenger';
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
    MockAnyNamespace,
    PreferencesControllerGetStateAction | ActionConstraint,
    never
  >({ namespace: MOCK_ANY_NAMESPACE });

  // @ts-expect-error: Partial mock.
  baseMessenger.registerActionHandler('PreferencesController:getState', () => ({
    useMultiAccountBalanceChecker: true,
    useExternalServices: true,
  }));

  baseMessenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () =>
      ({
        remoteFeatureFlags: {
          assetsAccountApiBalances: [],
        },
      }) as never,
  );

  baseMessenger.registerActionHandler(
    'OnboardingController:getState',
    () =>
      ({
        completedOnboarding: true,
      }) as never,
  );

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
      queryMultipleAccounts: true,
      allowExternalServices: expect.any(Function),
      accountsApiChainIds: expect.any(Function),
      platform: 'extension',
      isOnboarded: expect.any(Function),
    });
  });
});
