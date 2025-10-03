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
  const state = initMessenger.call('RemoteFeatureFlagController:getState');

  const FEATURE_FLAG_NAME = 'assetsAccountApiBalances';

  const featureFlagForAccountsApiBalances =
    state?.remoteFeatureFlags?.[FEATURE_FLAG_NAME] ?? [];

  const controller = new TokenBalancesController({
    // @ts-expect-error: `TokenBalancesController` uses the wrong type for
    // the preferences controller state.
    messenger: controllerMessenger,
    state: persistedState.TokenBalancesController,
    useAccountsAPI: false,
    queryMultipleAccounts: useMultiAccountBalanceChecker,
    interval: 30_000,
    allowExternalServices: () =>
      initMessenger.call('PreferencesController:getState').useExternalServices,
    useAccountsApiBalances: featureFlagForAccountsApiBalances,
  });

  return {
    controller,
  };
};
