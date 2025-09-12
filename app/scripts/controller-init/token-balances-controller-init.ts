import { TokenBalancesController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from './types';
import {
  TokenBalancesControllerMessenger,
  TokenBalancesControllerInitMessenger,
} from './messengers';

export const TokenBalancesControllerInit: ControllerInitFunction<
  TokenBalancesController,
  TokenBalancesControllerMessenger,
  TokenBalancesControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const { useMultiAccountBalanceChecker } = initMessenger.call(
    'PreferencesController:getState',
  );

  const controller = new TokenBalancesController({
    // @ts-expect-error: `TokenBalancesController` uses the wrong type for
    // the preferences controller state.
    messenger: controllerMessenger,
    state: persistedState.TokenBalancesController,
    useAccountsAPI: false,
    queryMultipleAccounts: useMultiAccountBalanceChecker,
    interval: 30_000,
  });

  return {
    controller,
  };
};
