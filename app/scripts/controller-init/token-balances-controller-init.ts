import { TokenBalancesController } from '@metamask/assets-controllers';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
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
  // Extension uses a custom PreferencesController that has custom state
  const getRetypedPrefState = () =>
    initMessenger.call(
      'PreferencesController:getState',
    ) as unknown as PreferencesControllerState;
  const { useMultiAccountBalanceChecker } = getRetypedPrefState();

  const controller = new TokenBalancesController({
    messenger: controllerMessenger,
    state: persistedState.TokenBalancesController,
    queryMultipleAccounts: Boolean(useMultiAccountBalanceChecker),
    interval: 30_000,
    allowExternalServices: () =>
      Boolean(getRetypedPrefState().useExternalServices),
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
