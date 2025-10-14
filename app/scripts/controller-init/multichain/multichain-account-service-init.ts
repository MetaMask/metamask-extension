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
import { isBitcoinFeatureEnabled } from '../../../../shared/lib/multichain-feature-flags';
import { removeChainAccounts, CHAIN_CONFIGS } from '../../../../shared/lib/multichain-account-management';

///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
// Use shared Bitcoin feature flag utility
const isAddBitcoinFlagEnabled = isBitcoinFeatureEnabled;
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

  // Set initial state based on addBitcoinAccount feature flag
  const isAddBitcoinAccountEnabled = isAddBitcoinFlagEnabled(
    initialRemoteFeatureFlagsState?.remoteFeatureFlags?.addBitcoinAccount,
  );
  btcProvider.setEnabled(isAddBitcoinAccountEnabled);

  // Track current state to prevent unnecessary work
  let currentBitcoinEnabled = isAddBitcoinAccountEnabled;
  let pendingBitcoinRemoval = false;

  // Subscribe to RemoteFeatureFlagsController:stateChange for runtime control
  controllerMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    async (state: unknown) => {
      const newBitcoinEnabled = isAddBitcoinFlagEnabled(
        (state as RemoteFeatureFlagControllerState)?.remoteFeatureFlags
          ?.addBitcoinAccount,
      );

      // Defense: Only react if the flag actually changed
      if (newBitcoinEnabled !== currentBitcoinEnabled) {
        currentBitcoinEnabled = newBitcoinEnabled;

        // Enable/disable Bitcoin provider based on feature flag
        btcProvider.setEnabled(newBitcoinEnabled);

        if (!newBitcoinEnabled) {
          // When disabled: remove Bitcoin accounts using generic chain management
          const keyringState = controllerMessenger.call('KeyringController:getState');
          if (keyringState.isUnlocked) {
            await removeChainAccounts(CHAIN_CONFIGS.bitcoin, controller, controllerMessenger);
          } else {
            pendingBitcoinRemoval = true;
          }
        } else {
          // When enabled: trigger alignment to create Bitcoin accounts for existing wallets
          pendingBitcoinRemoval = false;
          console.log(
            '✅ Bitcoin provider enabled - creating accounts for existing wallets',
          );
          controller.alignWallets().catch((error) => {
            console.error(
              'Failed to align wallets after enabling Bitcoin provider:',
              error,
            );
          });
        }
      }
    },
  );

  controllerMessenger.subscribe('KeyringController:stateChange', async (keyringState: any) => {
    if (keyringState.isUnlocked && pendingBitcoinRemoval) {
      pendingBitcoinRemoval = false;
      await removeChainAccounts(CHAIN_CONFIGS.bitcoin, controller, controllerMessenger);
    }
  });
  ///: END:ONLY_INCLUDE_IF

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
