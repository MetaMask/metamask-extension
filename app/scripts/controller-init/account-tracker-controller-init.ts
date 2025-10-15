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
> = ({ controllerMessenger, initMessenger, persistedState, getController }) => {
  const getAssetsContractController = () =>
    getController('AssetsContractController');

  const controller = new AccountTrackerController({
    state: persistedState.AccountTrackerController,
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
    includeStakedAssets: true,
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
  });

  // Ensure `AccountTrackerController` updates balances after network change.
  // initMessenger.subscribe('NetworkController:networkDidChange', () => {
  //   controller.updateAccounts();
  // });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
