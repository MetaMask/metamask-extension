import { Messenger } from '@metamask/base-controller';
import { NetworkControllerFindNetworkClientIdByChainIdAction } from '@metamask/network-controller';
import type {
  AddApprovalRequest,
  HasApprovalRequest,
  AcceptRequest,
  RejectRequest,
} from '@metamask/approval-controller';
import type { GetSubjectMetadata } from '@metamask/permission-controller';
import { AccountsControllerListAccountsAction } from '@metamask/accounts-controller';
import {
  GetPermittedSnaps,
  InstallSnaps,
  MultichainRouterGetSupportedAccountsAction,
  MultichainRouterIsSupportedScopeAction,
} from '@metamask/snaps-controllers';
import { SnapPermissionSpecificationsActions } from '../../controllers/permissions/snaps/specifications';

type AllowedActions =
  | AddApprovalRequest
  | HasApprovalRequest
  | AcceptRequest
  | RejectRequest
  | GetSubjectMetadata
  | GetPermittedSnaps
  | InstallSnaps;

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
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'PermissionController',
    allowedActions: [
      'ApprovalController:addRequest',
      'ApprovalController:hasRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'SnapController:getPermitted',
      'SnapController:install',
      'SubjectMetadataController:getSubjectMetadata',
    ],
    allowedEvents: [],
  });
}

type AllowedInitializationActions =
  | AccountsControllerListAccountsAction
  | MultichainRouterIsSupportedScopeAction
  | MultichainRouterGetSupportedAccountsAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | SnapPermissionSpecificationsActions;

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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'PermissionControllerInit',
    allowedActions: [
      'AppStateController:getUnlockPromise',
      'AccountsController:listAccounts',
      'CurrencyRateController:getState',
      'KeyringController:getKeyringsByType',
      'KeyringController:withKeyring',
      'MultichainRouter:isSupportedScope',
      'MultichainRouter:getSupportedAccounts',
      'NetworkController:findNetworkClientIdByChainId',
      'PhishingController:maybeUpdateState',
      'PhishingController:testOrigin',
      'PreferencesController:getState',
      'RateLimitController:call',
      'SnapController:clearSnapState',
      'SnapController:get',
      'SnapController:getSnapState',
      'SnapController:handleRequest',
      'SnapController:updateSnapState',
      'SnapInterfaceController:createInterface',
      'SnapInterfaceController:getInterface',
    ],
    allowedEvents: [],
  });
}
