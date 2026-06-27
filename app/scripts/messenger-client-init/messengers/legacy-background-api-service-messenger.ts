import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { LegacyBackgroundApiServiceMessenger } from '../../services/legacy-background-api-service';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * background API service.
 * @param messenger - The base messenger used to create the restricted messenger.
 * @returns The messenger restricted to the allowed actions and events of the background API service.
 */
export function getLegacyBackgroundApiServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<LegacyBackgroundApiServiceMessenger>,
    MessengerEvents<LegacyBackgroundApiServiceMessenger>
  >,
) {
  const serviceMessenger: LegacyBackgroundApiServiceMessenger = new Messenger({
    namespace: 'LegacyBackgroundApiService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
      'CurrencyRateController:setCurrentCurrency',
      'AssetsController:setSelectedCurrency',
      'KeyringController:exportSeedPhrase',
      'AccountsController:getSelectedAccount',
      'ApprovalController:getState',
      'TransactionController:getNonceLock',
      'TransactionController:getState',
      'ApprovalController:rejectRequest',
      'TransactionController:wipeTransactions',
      'SmartTransactionsController:wipeSmartTransactions',
      'BridgeStatusController:wipeBridgeStatus',
      'NetworkController:resetConnection',
      'KeyringController:importAccountWithStrategy',
      'OnboardingController:getIsSocialLoginFlow',
      'KeyringController:withKeyringV2',
      'KeyringController:removeAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setSelectedAccount',
      'SeedlessOnboardingController:addNewSecretData',
      'SeedlessOnboardingController:changePassword',
      'SeedlessOnboardingController:updateBackupMetadataState',
      'PermissionController:updatePermissionsByCaveat',
      'KeyringController:getKeyringsByType',
      'KeyringController:addNewKeyring',
      'PreferencesController:setPasswordForgotten',
      'OnboardingController:getState',
      'SeedlessOnboardingController:checkIsPasswordOutdated',
      'SeedlessOnboardingController:getState',
      'SeedlessOnboardingController:runMigrations',
      'MetaMetricsController:trackEvent',
      'KeyringController:verifyPassword',
      'KeyringController:exportAccount',
      'KeyringController:changePassword',
      'KeyringController:exportEncryptionKey',
      'KeyringController:setLocked',
      'KeyringController:submitEncryptionKey',
      'KeyringController:submitPassword',
      'SeedlessOnboardingController:loadKeyringEncryptionKey',
      'SeedlessOnboardingController:revokePendingRefreshTokens',
      'SeedlessOnboardingController:setLocked',
      'SeedlessOnboardingController:storeKeyringEncryptionKey',
      'SeedlessOnboardingController:submitGlobalPassword',
      'SeedlessOnboardingController:submitPassword',
      'SeedlessOnboardingController:syncLatestGlobalPassword',
      'AccountsController:updateAccounts',
      'AccountTreeController:init',
      'AccountTreeController:getSelectedAccountGroup',
      'MultichainAccountService:init',
      'MultichainAccountService:resyncAccounts',
      'MultichainAccountService:alignWallets',
      'SubscriptionController:stopAllPolling',
      'AuthenticationController:getState',
      'AuthenticationController:performSignOut',
      'AppStateController:setPasskeyAutoUnlockSuppressed',
      'MetaMetricsController:bufferedTrace',
      'MetaMetricsController:bufferedEndTrace',
    ],
  });

  return serviceMessenger;
}
