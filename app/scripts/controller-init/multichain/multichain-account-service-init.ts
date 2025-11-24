import {
  MultichainAccountService,
  AccountProviderWrapper,
  SOL_ACCOUNT_PROVIDER_NAME,
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  BtcAccountProvider,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  TrxAccountProvider,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/multichain-account-service';
import { ControllerInitFunction } from '../types';
import {
  MultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger,
} from '../messengers/accounts';
import { previousValueComparator } from '../../lib/util';
import {
  FEATURE_VERSION_2,
  isMultichainAccountsFeatureEnabled,
  MultichainAccountsFeatureFlag,
} from '../../../../shared/lib/multichain-accounts/remote-feature-flag';
///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import { isMultichainFeatureEnabled } from '../../../../shared/lib/multichain-feature-flags';
///: END:ONLY_INCLUDE_IF

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

  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  const btcProvider = new AccountProviderWrapper(
    controllerMessenger,
    new BtcAccountProvider(controllerMessenger, snapAccountProviderConfig),
  );
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  const trxProvider = new AccountProviderWrapper(
    controllerMessenger,
    new TrxAccountProvider(controllerMessenger, snapAccountProviderConfig),
  );
  ///: END:ONLY_INCLUDE_IF

  const controller = new MultichainAccountService({
    messenger: controllerMessenger,
    providers: [
      ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
      btcProvider,
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(tron)
      trxProvider,
      ///: END:ONLY_INCLUDE_IF
    ],
    providerConfigs: {
      [SOL_ACCOUNT_PROVIDER_NAME]: snapAccountProviderConfig,
    },
  });

  const preferencesState = initMessenger.call('PreferencesController:getState');

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useExternalServices: prevUseExternalServices } = prevState;
      const { useExternalServices: currUseExternalServices } = currState;
      if (prevUseExternalServices !== currUseExternalServices) {
        // Only call MultichainAccountService if State 2 (BIP-44 multichain accounts) is enabled
        // to prevent unwanted account alignment from running
        const { remoteFeatureFlags } = initMessenger.call(
          'RemoteFeatureFlagController:getState',
        );
        const multichainAccountsFeatureFlag =
          remoteFeatureFlags?.enableMultichainAccountsState2 as
            | MultichainAccountsFeatureFlag
            | undefined;

        if (
          isMultichainAccountsFeatureEnabled(
            multichainAccountsFeatureFlag,
            FEATURE_VERSION_2,
          )
        ) {
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
      }

      return true;
    }, preferencesState),
  );

  // Handle Bitcoin + Tron provider feature flag using previousValueComparator pattern
  const initialRemoteFeatureFlagsState = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );

  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  const initialBitcoinEnabled = isMultichainFeatureEnabled(
    initialRemoteFeatureFlagsState?.remoteFeatureFlags?.bitcoinAccounts,
  );
  btcProvider.setEnabled(initialBitcoinEnabled);
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(tron)
  const initialTronEnabled = isMultichainFeatureEnabled(
    initialRemoteFeatureFlagsState?.remoteFeatureFlags?.tronAccounts,
  );
  trxProvider.setEnabled(initialTronEnabled);
  ///: END:ONLY_INCLUDE_IF

  controllerMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    previousValueComparator((prevState, currState) => {
      ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
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
      ///: END:ONLY_INCLUDE_IF

      ///: BEGIN:ONLY_INCLUDE_IF(tron)
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
      ///: END:ONLY_INCLUDE_IF

      return true;
    }, initialRemoteFeatureFlagsState),
  );

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
