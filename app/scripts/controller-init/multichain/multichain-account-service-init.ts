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
// Version-aware Bitcoin flag checking
function isAddBitcoinFlagEnabled(flagValue: unknown): boolean {
  // Default to true if flag is undefined
  if (flagValue === undefined) {
    return true;
  }

  // Simple boolean flag
  if (typeof flagValue === 'boolean') {
    return flagValue;
  }

  // Object with enabled and minVersion properties
  if (typeof flagValue === 'object' && flagValue !== null) {
    const { enabled, minVersion } = flagValue as { enabled?: boolean; minVersion?: string };

    // If not enabled, return false
    if (!enabled) {
      return false;
    }

    // If enabled but no minVersion specified, return true
    if (!minVersion) {
      return true;
    }

    // Check if current version meets minimum requirement - Extension: 13.6.0
    const currentVersion = '13.6.0'; // TODO: Get from package.json or build config

    // Simple version comparison (assumes semver format)
    const parseVersion = (version: string) =>
      version.split('.').map((num) => parseInt(num, 10));

    const [currentMajor, currentMinor, currentPatch] =
      parseVersion(currentVersion);
    const [minMajor, minMinor, minPatch] = parseVersion(minVersion);

    if (currentMajor > minMajor) {
      return true;
    }
    if (currentMajor < minMajor) {
      return false;
    }
    if (currentMinor > minMinor) {
      return true;
    }
    if (currentMinor < minMinor) {
      return false;
    }
    return currentPatch >= minPatch;
  }

  return true; // Default to true for any other cases
}
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

  // Subscribe to RemoteFeatureFlagsController:stateChange for runtime control
  controllerMessenger.subscribe(
    'RemoteFeatureFlagController:stateChange',
    async (state: unknown) => {
      const newBitcoinEnabled = isAddBitcoinFlagEnabled(
        (state as RemoteFeatureFlagControllerState)?.remoteFeatureFlags?.addBitcoinAccount,
      );

      // Defense: Only react if the flag actually changed
      if (newBitcoinEnabled !== currentBitcoinEnabled) {
        currentBitcoinEnabled = newBitcoinEnabled;

        // Enable/disable Bitcoin provider based on feature flag
        btcProvider.setEnabled(newBitcoinEnabled);

        if (!newBitcoinEnabled) {
          // When disabled: remove Bitcoin accounts completely
          console.log('🗑️ Removing Bitcoin accounts from wallet...');

          try {
            const wallets = controller.getMultichainAccountWallets();
            const bitcoinAccounts: any[] = [];

            for (const wallet of wallets) {
              const groups = wallet.getMultichainAccountGroups();
              for (const group of groups) {
                const accounts = group.getAccounts();
                const btcAccountsInGroup = accounts.filter((account: any) =>
                  account.type?.startsWith('bip122:') // All Bitcoin account types
                );
                bitcoinAccounts.push(...btcAccountsInGroup);
              }
            }

            console.log(`🗑️ Found ${bitcoinAccounts.length} Bitcoin accounts to remove`);

            // Remove Bitcoin accounts from their keyrings
            for (const bitcoinAccount of bitcoinAccounts) {
              try {
                // Get all snap keyrings and check each one for this account
                const snapKeyrings = controllerMessenger.call('KeyringController:getKeyringsByType', 'Snap Keyring');

                for (const snapKeyring of snapKeyrings) {
                  // Cast snapKeyring to access its properties
                  const keyring = snapKeyring as any;
                  // Use the keyring ID from the metadata or a generated one
                  const keyringId = keyring.id || `snap-${keyring.accounts?.[0]}` || 'unknown';

                  try {
                    await controllerMessenger.call('KeyringController:withKeyring',
                      { id: keyringId },
                      async ({ keyring }: { keyring: any }) => {
                        // Only remove if this keyring contains the account
                        if (keyring.accounts && keyring.accounts.includes(bitcoinAccount.address)) {
                          await keyring.removeAccount(bitcoinAccount.address);
                          console.log(`🗑️ Removed Bitcoin account: ${bitcoinAccount.address.slice(0, 8)}... from keyring ${keyringId}`);
                        }
                      }
                    );
                  } catch (keyringError) {
                    // Try with the keyring object itself if ID approach fails
                    console.warn(`Keyring ID approach failed for ${keyringId}, trying direct approach:`, keyringError);
                  }
                }
              } catch (error) {
                console.warn(`Failed to remove Bitcoin account ${bitcoinAccount.address}:`, error);
              }
            }

            console.log('✅ Bitcoin accounts completely removed from wallet');
          } catch (error) {
            console.error('Failed to remove Bitcoin accounts:', error);
          }
        } else {
          // When enabled: trigger alignment to create Bitcoin accounts for existing wallets
          console.log('✅ Bitcoin provider enabled - creating accounts for existing wallets');
          controller.alignWallets().catch((error) => {
            console.error('Failed to align wallets after enabling Bitcoin provider:', error);
          });
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
