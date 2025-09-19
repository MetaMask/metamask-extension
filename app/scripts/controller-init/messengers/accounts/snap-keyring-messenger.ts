import { Messenger } from '@metamask/base-controller';
import { KeyringControllerPersistAllKeyringsAction } from '@metamask/keyring-controller';
import { AccountsControllerUpdateAccountsAction } from '@metamask/accounts-controller';
import { SnapKeyringBuilderAllowActions } from '../../../lib/snap-keyring/types';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';

export type SnapKeyringMessenger = ReturnType<typeof getSnapKeyringMessenger>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * Snap keyring.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSnapKeyringMessenger(
  messenger: Messenger<SnapKeyringBuilderAllowActions, never>,
) {
  return messenger.getRestricted({
    name: 'SnapKeyring',
    allowedActions: [
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
    ],
    allowedEvents: [],
  });
}

type AllowedInitializationActions =
  | AccountsControllerUpdateAccountsAction
  | KeyringControllerPersistAllKeyringsAction
  | MetaMetricsControllerTrackEventAction;

export type SnapKeyringInitMessenger = ReturnType<
  typeof getSnapKeyringInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the Snap keyring.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSnapKeyringInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'SnapKeyringInit',
    allowedActions: [
      'AccountsController:updateAccounts',
      'KeyringController:persistAllKeyrings',
      'MetaMetricsController:trackEvent',
    ],
    allowedEvents: [],
  });
}
