import { AccountTrackerController } from '@metamask/assets-controllers';
import { NetworkClientId } from '@metamask/network-controller';
import { ControllerInitFunction } from './types';
import {
  AccountTrackerControllerInitMessenger,
  AccountTrackerControllerMessenger,
} from './messengers';

export const AccountTrackerControllerInit: ControllerInitFunction<
  AccountTrackerController,
  AccountTrackerControllerMessenger,
  AccountTrackerControllerInitMessenger
> = ({ controllerMessenger, initMessenger, getController }) => {
  const getAssetsContractController = () =>
    getController('AssetsContractController');

  const onboardingController = () => getController('OnboardingController');

  // TODO: Fix AccountTrackerControllerMessenger type - add AccountTrackerControllerActions & AccountTrackerControllerEvents
  // TODO: Bump @metamask/network-controller, @metamask/accounts-controller to match assets-controllers
  const controller = new AccountTrackerController({
    messenger: controllerMessenger,
    getStakedBalanceForChain: (
      addresses: string[],
      networkClientId?: NetworkClientId,
    ) => {
      const assetsContractController = getAssetsContractController();
      return assetsContractController.getStakedBalanceForChain(
        addresses,
        networkClientId,
      );
    },
    includeStakedAssets: false,
    allowExternalServices: () => {
      const { useExternalServices } = initMessenger.call(
        'PreferencesController:getState',
      );
      return useExternalServices;
    },
    accountsApiChainIds: () => {
      const state = initMessenger.call('RemoteFeatureFlagController:getState');

      const featureFlagForAccountApiBalances =
        state?.remoteFeatureFlags?.assetsAccountApiBalances;

      return Array.isArray(featureFlagForAccountApiBalances)
        ? (featureFlagForAccountApiBalances as `0x${string}`[])
        : [];
    },
    fetchingEnabled: () => onboardingController().state.completedOnboarding,
    isOnboarded: () => {
      const { completedOnboarding } = onboardingController().state;
      return completedOnboarding;
    },
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
