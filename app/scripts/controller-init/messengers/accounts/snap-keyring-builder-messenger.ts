import { Messenger } from '@metamask/messenger';
import { KeyringControllerPersistAllKeyringsAction } from '@metamask/keyring-controller';
import { AccountsControllerUpdateAccountsAction } from '@metamask/accounts-controller';
import { SnapKeyringBuilderAllowActions } from '../../../lib/snap-keyring/types';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';
import { RootMessenger } from '../../../lib/messenger';

export type SnapKeyringBuilderMessenger = ReturnType<
  typeof getSnapKeyringBuilderMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * Snap keyring.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSnapKeyringBuilderMessenger(
  messenger: RootMessenger<SnapKeyringBuilderAllowActions, never>,
) {
  const keyringMessenger = new Messenger<
    'SnapKeyring',
    SnapKeyringBuilderAllowActions,
    never,
    typeof messenger
  >({
    namespace: 'SnapKeyring',
    parent: messenger,
  });
  messenger.delegate({
    messenger: keyringMessenger,
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
      'AccountsController:setSelectedAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'SnapController:get',
      'SnapController:isMinimumPlatformVersion',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
    ],
  });
  return keyringMessenger;
}

type AllowedInitializationActions =
  | AccountsControllerUpdateAccountsAction
  | KeyringControllerPersistAllKeyringsAction
  | MetaMetricsControllerTrackEventAction;

export type SnapKeyringBuilderInitMessenger = ReturnType<
  typeof getSnapKeyringBuilderInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the Snap keyring.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSnapKeyringBuilderInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const keyringInitMessenger = new Messenger<
    'SnapKeyringInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'SnapKeyringInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: keyringInitMessenger,
    actions: [
      'AccountsController:updateAccounts',
      'KeyringController:persistAllKeyrings',
      'MetaMetricsController:trackEvent',
    ],
  });
  return keyringInitMessenger;
}
