import {
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  BtcAccountProvider,
  ///: END:ONLY_INCLUDE_IF
  MultichainAccountService,
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
 * Extract addBitcoinAccount flag from RemoteFeatureFlagController state.
 *
 * @param state - RemoteFeatureFlagController state
 * @returns True if addBitcoinAccount flag is enabled
 */
function getIsAddBitcoinAccountEnabled(
  state: unknown,
): boolean {
  return Boolean(
    (state as { remoteFeatureFlags?: { addBitcoinAccount?: boolean } })
      ?.remoteFeatureFlags?.addBitcoinAccount,
  );
}

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
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  const btcProvider = new AccountProviderWrapper(
    controllerMessenger,
    new BtcAccountProvider(controllerMessenger),
  );
  ///: END:ONLY_INCLUDE_IF

  const controller = new MultichainAccountService({
    messenger: controllerMessenger,
    providers: [
      ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
      btcProvider,
      ///: END:ONLY_INCLUDE_IF
    ].filter(Boolean),
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

  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  // Handle Bitcoin provider feature flag
  const remoteFeatureFlagsState = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );

  // Set initial state based on addBitcoinAccount feature flag
  const isAddBitcoinAccountEnabled = getIsAddBitcoinAccountEnabled(remoteFeatureFlagsState);
  btcProvider.setEnabled(isAddBitcoinAccountEnabled);

  // Track current state to prevent unnecessary work
  let currentBitcoinEnabled = isAddBitcoinAccountEnabled;

  // Subscribe to RemoteFeatureFlagsController:stateChange for runtime control
  controllerMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    (state: unknown) => {
      const newBitcoinEnabled = getIsAddBitcoinAccountEnabled(state);

      // Defense: Only react if the flag actually changed
      if (newBitcoinEnabled !== currentBitcoinEnabled) {
        currentBitcoinEnabled = newBitcoinEnabled;

        // Enable/disable Bitcoin provider based on feature flag
        btcProvider.setEnabled(newBitcoinEnabled);

        // Only sync when disabling to hide accounts (no need when enabling)
        if (!newBitcoinEnabled) {
          const wallets = controller.getMultichainAccountWallets();
          for (const wallet of wallets) {
            wallet.sync();
          }
        }
      }
    },
  );
  ///: END:ONLY_INCLUDE_IF

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
