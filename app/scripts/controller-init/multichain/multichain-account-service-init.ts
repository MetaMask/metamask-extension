import {
  MultichainAccountService,
  BtcAccountProvider,
  AccountProviderWrapper,
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
  const btcProvider = new AccountProviderWrapper(
    controllerMessenger,
    new BtcAccountProvider(controllerMessenger),
  );

  const controller = new MultichainAccountService({
    messenger: controllerMessenger,
    providers: [btcProvider],
  });

  // Bitcoin provider will be used during account creation after keyring is unlocked

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

  const remoteFeatureFlagsState = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );

  // Set initial state based on addBitcoinAccount feature flag
  const initialBitcoinEnabled = Boolean(
    remoteFeatureFlagsState?.remoteFeatureFlags?.addBitcoinAccount,
  );

  btcProvider.setEnabled(initialBitcoinEnabled);

  // Subscribe to RemoteFeatureFlagsController:stateChange for runtime control of Bitcoin provider state
  controllerMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    (state: unknown) => {
      const addBitcoinAccountEnabled = Boolean(
        (state as { remoteFeatureFlags?: { addBitcoinAccount?: boolean } })
          ?.remoteFeatureFlags?.addBitcoinAccount,
      );

      // Enable/disable Bitcoin provider based on feature flag
      btcProvider.setEnabled(addBitcoinAccountEnabled);

      // Trigger wallet sync to update account visibility
      // sync() rebuilds mappings based on getAccounts() so disabled provider's accounts are hidden
      const wallets = controller.getMultichainAccountWallets();
      for (const wallet of wallets) {
        wallet.sync();
      }
    },
  );

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
