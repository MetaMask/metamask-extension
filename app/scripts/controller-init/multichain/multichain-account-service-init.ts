import {
  MultichainAccountService,
  AccountProviderWrapper,
  SOL_ACCOUNT_PROVIDER_NAME,
  BtcAccountProvider,
  TrxAccountProvider,
} from '@metamask/multichain-account-service';
import { ControllerInitFunction } from '../types';
import {
  MultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger,
} from '../messengers/accounts';
import { previousValueComparator } from '../../lib/util';
import { isMultichainFeatureEnabled } from '../../../../shared/lib/multichain-feature-flags';
import { trace } from '../../../../shared/lib/trace';

/**
 * Initialize the multichain account service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @returns The initialized service.
 */
export const MultichainAccountServiceInit: ControllerInitFunction<
  MultichainAccountService,
  MultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const snapAccountProviderConfig = {
    // READ THIS CAREFULLY:
    // We are using 1 to prevent any concurrent `keyring_createAccount` requests. This ensures
    // we prevent any desync between Snap's accounts and Metamask's accounts.
    maxConcurrency: 1,
    // Re-use the default config for the rest:
    discovery: {
      timeoutMs: 2000,
      maxAttempts: 3,
      backOffMs: 1000,
    },
    createAccounts: {
      timeoutMs: 3000,
    },
  };

  const btcProvider = new AccountProviderWrapper(
    controllerMessenger,
    new BtcAccountProvider(controllerMessenger, snapAccountProviderConfig),
  );

  const trxProvider = new AccountProviderWrapper(
    controllerMessenger,
    new TrxAccountProvider(controllerMessenger, snapAccountProviderConfig),
  );

  const controller = new MultichainAccountService({
    messenger: controllerMessenger,
    providers: [btcProvider, trxProvider],
    providerConfigs: {
      [SOL_ACCOUNT_PROVIDER_NAME]: snapAccountProviderConfig,
    },
    config: {
      // @ts-expect-error Controller uses string for names rather than enum
      trace,
    },
  });

  const preferencesState = initMessenger.call('PreferencesController:getState');

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useExternalServices: prevUseExternalServices } = prevState;
      const { useExternalServices: currUseExternalServices } = currState;
      if (prevUseExternalServices !== currUseExternalServices) {
        // Set basic functionality and trigger alignment when enabled
        // This single call handles both provider disable/enable and alignment.
        controller
          .setBasicFunctionality(currUseExternalServices)
          .catch((error) => {
            console.error(
              'Failed to set basic functionality on MultichainAccountService:',
              error,
            );
          });
      }

      return true;
    }, preferencesState),
  );

  // Handle Bitcoin + Tron provider feature flag using previousValueComparator pattern
  const initialRemoteFeatureFlagsState = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );

  const initialBitcoinEnabled = isMultichainFeatureEnabled(
    initialRemoteFeatureFlagsState?.remoteFeatureFlags?.bitcoinAccounts,
  );
  btcProvider.setEnabled(initialBitcoinEnabled);

  const initialTronEnabled = isMultichainFeatureEnabled(
    initialRemoteFeatureFlagsState?.remoteFeatureFlags?.tronAccounts,
  );
  trxProvider.setEnabled(initialTronEnabled);

  controllerMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    previousValueComparator((prevState, currState) => {
      const prevBitcoinEnabled = isMultichainFeatureEnabled(
        prevState?.remoteFeatureFlags?.bitcoinAccounts,
      );
      const currBitcoinEnabled = isMultichainFeatureEnabled(
        currState?.remoteFeatureFlags?.bitcoinAccounts,
      );

      if (prevBitcoinEnabled !== currBitcoinEnabled) {
        // Enable/disable Bitcoin provider based on feature flag
        btcProvider.setEnabled(currBitcoinEnabled);

        // Trigger wallet alignment when Bitcoin accounts are enabled
        // This will create Bitcoin accounts for existing wallets
        if (currBitcoinEnabled) {
          controller.alignWallets().catch((error) => {
            console.error(
              'Failed to align wallets after enabling Bitcoin provider:',
              error,
            );
          });
        }
        // Note: When disabled, no action needed as the provider won't create new accounts
      }

      const prevTronEnabled = isMultichainFeatureEnabled(
        prevState?.remoteFeatureFlags?.tronAccounts,
      );
      const currTronEnabled = isMultichainFeatureEnabled(
        currState?.remoteFeatureFlags?.tronAccounts,
      );

      if (prevTronEnabled !== currTronEnabled) {
        trxProvider.setEnabled(currTronEnabled);

        if (currTronEnabled) {
          controller.alignWallets().catch((error) => {
            console.error(
              'Failed to align wallets after enabling Tron provider:',
              error,
            );
          });
        }
      }

      return true;
    }, initialRemoteFeatureFlagsState),
  );

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
