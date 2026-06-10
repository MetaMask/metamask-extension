import { Messenger } from '@metamask/messenger';
import {
  RootMessenger,
  RootMessengerActions,
  RootMessengerEvents,
} from '../../../lib/messenger';
import { SnapKeyringBuilderMessenger } from '../../../lib/snap-keyring/types';

export type { SnapKeyringBuilderMessenger };

/**
 * Gets the messenger for the Snap keyring, which is used to handle communication between the Snap keyring
 * and the rest of the extension.
 *
 * @param messenger - The root messenger instance, used to create a child messenger for the Snap keyring and to delegate necessary actions to it.
 * @returns The Snap keyring messenger instance.
 */
export function getSnapKeyringBuilderMessenger(
  messenger: RootMessenger<RootMessengerActions, RootMessengerEvents>,
): SnapKeyringBuilderMessenger {
  const snapKeyringMessenger: SnapKeyringBuilderMessenger = new Messenger({
    namespace: 'SnapKeyring',
    parent: messenger,
  });

  messenger.delegate({
    messenger: snapKeyringMessenger,
    actions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'ApprovalController:startFlow',
      'ApprovalController:endFlow',
      'ApprovalController:showSuccess',
      'ApprovalController:showError',
      'PhishingController:testOrigin',
      'PhishingController:maybeUpdateState',
      'KeyringController:getAccounts',
      'KeyringController:persistAllKeyrings',
      'AccountsController:setSelectedAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
      'AccountsController:listMultichainAccounts',
      'AccountsController:updateAccounts',
      'SnapController:handleRequest',
      'SnapController:getSnap',
      'SnapController:isMinimumPlatformVersion',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
      'MetaMetricsController:trackEvent',
      'LegacyBackgroundApiService:removeAccount',
    ],
  });

  return snapKeyringMessenger;
}
