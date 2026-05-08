import { Messenger } from '@metamask/messenger';
import { KeyringControllerPersistAllKeyringsAction } from '@metamask/keyring-controller';
import { AccountsControllerUpdateAccountsAction } from '@metamask/accounts-controller';
import { SnapKeyringBuilderAllowActions } from '../../../lib/snap-keyring/types';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller-method-action-types';
import { RootMessenger } from '../../../lib/messenger';

export type SnapKeyringBuilderV2Messenger = ReturnType<
  typeof getSnapKeyringBuilderV2Messenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * v2 Snap keyring.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSnapKeyringBuilderV2Messenger(
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
      'SnapController:getSnap',
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

export type SnapKeyringBuilderV2InitMessenger = ReturnType<
  typeof getSnapKeyringBuilderV2InitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the v2 Snap keyring.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSnapKeyringBuilderV2InitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const keyringInitMessenger = new Messenger<
    'SnapKeyringV2Init',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'SnapKeyringV2Init',
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
