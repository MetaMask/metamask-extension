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
    queryMultipleAccounts: useMultiAccountBalanceChecker,
    interval: 30_000,
    allowExternalServices: () =>
      initMessenger.call('PreferencesController:getState').useExternalServices,
    accountsApiChainIds: () => {
      const state = initMessenger.call('RemoteFeatureFlagController:getState');

      const featureFlagForAccountApiBalances =
        state?.remoteFeatureFlags?.assetsAccountApiBalances;

      return Array.isArray(featureFlagForAccountApiBalances)
        ? (featureFlagForAccountApiBalances as `0x${string}`[])
        : [];
    },
    platform: 'extension',
    isOnboarded: () => {
      const { completedOnboarding } = initMessenger.call(
        'OnboardingController:getState',
      );
      return completedOnboarding;
    },
  });

  return {
    controller,
  };
};
