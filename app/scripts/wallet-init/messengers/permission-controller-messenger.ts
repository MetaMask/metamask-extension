import { AccountsControllerListAccountsAction } from '@metamask/accounts-controller';
import { NetworkControllerFindNetworkClientIdByChainIdAction } from '@metamask/network-controller';
import {
  MultichainRoutingServiceGetSupportedAccountsAction,
  MultichainRoutingServiceIsSupportedScopeAction,
} from '@metamask/snaps-controllers';
import { SnapAccountServiceHandleKeyringSnapMessageAction } from '@metamask/snap-account-service';
import { ApprovalControllerAddRequestAction } from '@metamask/approval-controller';
import { Messenger } from '@metamask/messenger';
import { SnapPermissionSpecificationsActions } from '../../controllers/permissions/snaps/specifications';
import { RootMessenger } from '../../lib/messenger';

export type PermissionControllerInitMessengerActions =
  | AccountsControllerListAccountsAction
  | MultichainRoutingServiceGetSupportedAccountsAction
  | MultichainRoutingServiceIsSupportedScopeAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | SnapPermissionSpecificationsActions
  | SnapAccountServiceHandleKeyringSnapMessageAction
  | ApprovalControllerAddRequestAction;

export type PermissionControllerInitMessenger = ReturnType<
  typeof getPermissionControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the permission controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPermissionControllerInitMessenger(
  messenger: RootMessenger<PermissionControllerInitMessengerActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'PermissionControllerInit',
    PermissionControllerInitMessengerActions,
    never,
    typeof messenger
  >({
    namespace: 'PermissionControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'AppStateController:getUnlockPromise',
      'AccountsController:listAccounts',
      'AssetsController:getState',
      'KeyringController:withKeyring',
      'KeyringController:withKeyringV2Unsafe',
      'MultichainRoutingService:isSupportedScope',
      'MultichainRoutingService:getSupportedAccounts',
      'NetworkController:findNetworkClientIdByChainId',
      'PhishingController:maybeUpdateState',
      'PhishingController:testOrigin',
      'PreferencesController:getState',
      'RateLimitController:call',
      'SnapController:clearSnapState',
      'SnapController:getSnap',
      'SnapController:getSnapState',
      'SnapController:handleRequest',
      'SnapController:updateSnapState',
      'SnapInterfaceController:createInterface',
      'SnapInterfaceController:getInterface',
      'SnapInterfaceController:setInterfaceDisplayed',
      'SnapAccountService:handleKeyringSnapMessage',
      'ApprovalController:addRequest',
    ],
  });
  return controllerInitMessenger;
}
