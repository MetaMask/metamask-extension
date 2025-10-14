import {
  MultichainAccountService,
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  BtcAccountProvider,
  AccountProviderWrapper,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/multichain-account-service';
///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
///: END:ONLY_INCLUDE_IF
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
import { isBitcoinFeatureEnabled } from '../../../../shared/lib/multichain-feature-flags';

// Use shared Bitcoin feature flag utility
const isBitcoinAccountsFlagEnabled = isBitcoinFeatureEnabled;
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
  const initialRemoteFeatureFlagsState = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );

  // Set initial state based on bitcoinAccounts feature flag
  const areBitcoinAccountsEnabled = isBitcoinAccountsFlagEnabled(
    initialRemoteFeatureFlagsState?.remoteFeatureFlags?.bitcoinAccounts,
  );
  btcProvider.setEnabled(areBitcoinAccountsEnabled);

  // Subscribe to RemoteFeatureFlagsController:stateChange for runtime control
  controllerMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    (state: unknown) => {
      const bitcoinAccountsEnabled = isBitcoinAccountsFlagEnabled(
        (state as RemoteFeatureFlagControllerState)?.remoteFeatureFlags
          ?.bitcoinAccounts,
      );

      // Enable/disable Bitcoin provider based on feature flag
      btcProvider.setEnabled(bitcoinAccountsEnabled);
    },
  );
  ///: END:ONLY_INCLUDE_IF

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
