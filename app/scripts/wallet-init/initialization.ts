import { Wallet } from '@metamask/wallet';
import { setupRemoteFeatureFlagToggle } from './remote-feature-flags';
import { getApprovalControllerInstanceOptions } from './instance-options/approval-controller';
import { getConnectivityControllerInstanceOptions } from './instance-options/connectivity-controller';
import { getGasFeeControllerInstanceOptions } from './instance-options/gas-fee-controller';
import { getKeyringControllerInstanceOptions } from './instance-options/keyring-controller';
import { getRemoteFeatureFlagControllerInstanceOptions } from './instance-options/remote-feature-flag-controller';
import { getStorageServiceInstanceOptions } from './instance-options/storage-service';
import {
  getNetworkControllerInstanceOptions,
  setupRpcEndpointMetrics,
} from './instance-options/network-controller';
import {
  getTransactionControllerInstanceOptions,
  setupTransactionControllerListeners,
} from './instance-options/transaction-controller';
import { getSeedlessOnboardingControllerInitMessenger } from './messengers/seedless-onboarding-controller-messenger';
import { getTransactionControllerInitMessenger } from './messengers/transaction-controller-messenger';
import { getGasFeeControllerInitMessenger } from './messengers/gas-fee-controller-messenger';
import type { InitializeWalletRequest } from './types';
import { getPasskeyControllerInstanceOptions } from './instance-options/passkey-controller';
import { getSeedlessOnboardingControllerInstanceOptions } from './instance-options/seedless-onboarding-controller';

/**
 * Construct the `@metamask/wallet` `Wallet` for the extension. Each
 * controller's client-specific options live in its own builder under
 * `./instance-options/`.
 *
 * @param request - The wallet initialization request.
 * @returns The constructed `Wallet`.
 */
export function initializeWallet(request: InitializeWalletRequest) {
  const {
    connectivityAdapter,
    encryptor,
    getFlatState,
    getPermittedAccounts,
    getTransactionMetricsRequest,
    infuraProjectId,
    messenger,
    showApprovalRequest,
    state,
    platform,
  } = request;

  const transactionControllerInitMessenger =
    getTransactionControllerInitMessenger(messenger);
  const seedlessOnboardingControllerInitMessenger =
    getSeedlessOnboardingControllerInitMessenger(messenger);

  const wallet = new Wallet({
    instanceOptions: {
      approvalController: getApprovalControllerInstanceOptions({
        showApprovalRequest,
      }),
      connectivityController: getConnectivityControllerInstanceOptions({
        connectivityAdapter,
      }),
      gasFeeController: getGasFeeControllerInstanceOptions({
        initMessenger: getGasFeeControllerInitMessenger(messenger),
      }),
      keyringController: getKeyringControllerInstanceOptions({
        encryptor,
        messenger,
      }),
      networkController: getNetworkControllerInstanceOptions(infuraProjectId),
      passkeyController: getPasskeyControllerInstanceOptions({
        messenger,
        platform,
      }),
      seedlessOnboardingController:
        getSeedlessOnboardingControllerInstanceOptions({
          initMessenger: seedlessOnboardingControllerInitMessenger,
        }),
      remoteFeatureFlagController:
        getRemoteFeatureFlagControllerInstanceOptions({ messenger, state }),
      storageService: getStorageServiceInstanceOptions(),
      transactionController: getTransactionControllerInstanceOptions({
        initMessenger: transactionControllerInitMessenger,
        getFlatState,
        getPermittedAccounts,
        getTransactionMetricsRequest,
      }),
    },
    messenger,
    state,
  });

  // Keep the wallet-owned `RemoteFeatureFlagController` in sync with onboarding
  // and the external-services preference, seeded from the same persisted state
  // as the initial `disabled` value above. The controller is driven over the
  // shared messenger, so no instance reference is needed.
  setupRemoteFeatureFlagToggle({
    messenger,
    onboardingState: {
      completedOnboarding:
        state.OnboardingController?.completedOnboarding === true,
    },
    preferencesState: {
      useExternalServices:
        state.PreferencesController?.useExternalServices !== false,
    },
  });

  setupRpcEndpointMetrics(infuraProjectId, messenger);
  setupTransactionControllerListeners({
    getTransactionMetricsRequest,
    messenger: transactionControllerInitMessenger,
  });

  wallet.init().catch((error) => console.error(error));

  return wallet;
}
