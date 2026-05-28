import { Messenger } from '@metamask/messenger';
import { NetworkControllerFindNetworkClientIdByChainIdAction } from '@metamask/network-controller';
import type {
  ApprovalControllerAddRequestAction,
  ApprovalControllerHasRequestAction,
  ApprovalControllerAcceptRequestAction,
  ApprovalControllerRejectRequestAction,
} from '@metamask/approval-controller';
import type { GetSubjectMetadata } from '@metamask/permission-controller';
import { AccountsControllerListAccountsAction } from '@metamask/accounts-controller';
import {
  SnapControllerGetPermittedSnapsAction,
  SnapControllerInstallSnapsAction,
  MultichainRoutingServiceGetSupportedAccountsAction,
  MultichainRoutingServiceIsSupportedScopeAction,
} from '@metamask/snaps-controllers';
import { SnapPermissionSpecificationsActions } from '../../controllers/permissions/snaps/specifications';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | ApprovalControllerAddRequestAction
  | ApprovalControllerHasRequestAction
  | ApprovalControllerAcceptRequestAction
  | ApprovalControllerRejectRequestAction
  | GetSubjectMetadata
  | SnapControllerGetPermittedSnapsAction
  | SnapControllerInstallSnapsAction;

// TODO: Ideally we remove this type, but we request more permissions than
// defined in the permission controller's own messenger (to support certain
// side effects), so we can't currently use the controller's messenger type as
// the allowed actions for the controller's messenger.
export type PermissionControllerMessenger = ReturnType<
  typeof getPermissionControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * permission controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPermissionControllerMessenger(
  messenger: RootMessenger<AllowedActions, never>,
) {
  const controllerMessenger = new Messenger<
    'PermissionController',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'PermissionController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'ApprovalController:addRequest',
      'ApprovalController:hasRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'SnapController:getPermittedSnaps',
      'SnapController:installSnaps',
      'SubjectMetadataController:getSubjectMetadata',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | AccountsControllerListAccountsAction
  | MultichainRoutingServiceGetSupportedAccountsAction
  | MultichainRoutingServiceIsSupportedScopeAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | SnapPermissionSpecificationsActions
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
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'PermissionControllerInit',
    AllowedInitializationActions,
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
      'CurrencyRateController:getState',
      'KeyringController:getKeyringsByType',
      'KeyringController:withKeyring',
      'KeyringController:addNewKeyring',
      'MultichainRoutingService:isSupportedScope',
      'MultichainRoutingService:getSupportedAccounts',
      'NetworkController:findNetworkClientIdByChainId',
      'PhishingController:maybeUpdateState',
      'PhishingController:testOrigin',
      'PreferencesController:getState',
      'RateLimitController:call',
      'RemoteFeatureFlagController:getState',
      'SnapController:clearSnapState',
      'SnapController:getSnap',
      'SnapController:getSnapState',
      'SnapController:handleRequest',
      'SnapController:updateSnapState',
      'SnapInterfaceController:createInterface',
      'SnapInterfaceController:getInterface',
      'SnapInterfaceController:setInterfaceDisplayed',
      'ApprovalController:addRequest',
    ],
  });
  return controllerInitMessenger;
}
