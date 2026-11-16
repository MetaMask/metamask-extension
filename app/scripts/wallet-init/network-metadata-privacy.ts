import { Messenger } from '@metamask/messenger';
import {
  NetworkEnablementController,
  Slip44Service,
  type NetworkEnablementControllerMessenger,
  type NetworkEnablementControllerState,
} from '@metamask/network-enablement-controller';
import type {
  WalletOptions,
  RootMessenger as WalletRootMessenger,
  DefaultActions,
  DefaultEvents,
} from '@metamask/wallet';
import type { Hex } from '@metamask/utils';
import type { WalletInitMessenger } from './types';

/** Whether the user has consented to remote network metadata requests. */
export function canFetchNetworkMetadata(
  messenger: WalletInitMessenger,
): boolean {
  try {
    return (
      messenger.call('OnboardingController:getState').completedOnboarding &&
      messenger.call('PreferencesController:getState').useExternalServices
    );
  } catch {
    // These extension controllers are not registered during early wallet init.
    return false;
  }
}

/** Override the wallet's default initializer to inject the privacy-aware lookup. */
export function getPrivateNetworkEnablementConfiguration(
  root: WalletInitMessenger,
) {
  let controller: NetworkEnablementController | undefined;
  const configuration = {
    name: 'NetworkEnablementController',
    reference: NetworkEnablementController,
    init: ({
      state,
      messenger,
    }: {
      state?: NetworkEnablementControllerState;
      messenger: NetworkEnablementControllerMessenger;
    }) => {
      controller = new NetworkEnablementController({
        state,
        messenger,
        getEvmSlip44: async (chainId: number) => {
          if (canFetchNetworkMetadata(root)) {
            return Slip44Service.getEvmSlip44(chainId);
          }
          const existing =
            controller?.state.nativeAssetIdentifiers[`eip155:${chainId}`];
          if (existing) {
            return Number(existing.split('/slip44:')[1]);
          }
          const chainIdHex = `0x${chainId.toString(16)}` as Hex;
          const network = root.call('NetworkController:getState')
            .networkConfigurationsByChainId[chainIdHex];
          return (
            Slip44Service.getSlip44BySymbol(network?.nativeCurrency ?? 'ETH') ??
            60
          );
        },
      });
      return controller;
    },
    getMessenger: (
      parent: WalletRootMessenger<DefaultActions, DefaultEvents>,
    ) => {
      const messenger: NetworkEnablementControllerMessenger = new Messenger({
        namespace: 'NetworkEnablementController',
        parent,
      });
      parent.delegate({
        messenger,
        actions: [
          'ConfigRegistryController:getState',
          'MultichainNetworkController:getState',
          'NetworkController:getState',
        ],
        events: [
          'NetworkController:networkAdded',
          'NetworkController:networkRemoved',
          'NetworkController:stateChange',
          'TransactionController:transactionSubmitted',
        ],
      });
      return messenger;
    },
  };
  return configuration as unknown as NonNullable<
    WalletOptions['initializationConfigurations']
  >[number];
}
