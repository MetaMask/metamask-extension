import { Messenger } from '@metamask/base-controller';
import { KeyringControllerPersistAllKeyringsAction } from '@metamask/keyring-controller';
import { AccountsControllerUpdateAccountsAction } from '@metamask/accounts-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/account-tracker-controller';
import { AppStateControllerRequestQrCodeScanAction } from '../../controllers/app-state-controller';
import { SnapKeyringBuilderAllowActions } from '../../lib/snap-keyring/types';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';

export type KeyringControllerMessenger = ReturnType<
  typeof getKeyringControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * keyring controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getKeyringControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'KeyringController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}

type AllowedInitializationActions =
  | AccountsControllerUpdateAccountsAction
  | AppStateControllerRequestQrCodeScanAction
  | KeyringControllerPersistAllKeyringsAction
  | MetaMetricsControllerTrackEventAction;

export type KeyringControllerInitMessenger = ReturnType<
  typeof getKeyringControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the keyring controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getKeyringControllerInitMessenger(
  messenger: Messenger<
    AllowedInitializationActions | SnapKeyringBuilderAllowActions,
    never
  >,
) {
  return messenger.getRestricted({
    name: 'KeyringControllerInit',
    allowedActions: [
      'AccountsController:updateAccounts',
      'AppStateController:requestQrCodeScan',
      'KeyringController:persistAllKeyrings',
      'MetaMetricsController:trackEvent',

      // SnapKeyring actions. This is a workaround, since the Snap keyring can't
      // be initialised with the modular init pattern yet.
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
