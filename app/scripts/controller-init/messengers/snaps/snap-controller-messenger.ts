import { Messenger } from '@metamask/messenger';
import {
  ExecuteSnapAction,
  TerminateSnapAction,
  TerminateAllSnapsAction,
  HandleRpcRequestAction,
  GetResult,
  GetMetadata,
  Update,
  ResolveVersion,
  CreateInterface,
  GetInterface,
  ErrorMessageEvent,
  OutboundRequest,
  OutboundResponse,
  SetClientActive,
} from '@metamask/snaps-controllers';
import {
  GetEndowments,
  GetPermissions,
  HasPermission,
  HasPermissions,
  RequestPermissions,
  RevokeAllPermissions,
  RevokePermissions,
  RevokePermissionForAllSubjects,
  GetSubjects,
  GrantPermissions,
  GetSubjectMetadata,
  AddSubjectMetadata,
  UpdateCaveat,
} from '@metamask/permission-controller';
import {
  AddApprovalRequest,
  UpdateRequestState,
} from '@metamask/approval-controller';
import {
  KeyringControllerGetKeyringsByTypeAction,
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { SelectedNetworkControllerGetNetworkClientIdForDomainAction } from '@metamask/selected-network-controller';
import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import { PreferencesControllerGetStateAction } from '../../../controllers/preferences-controller';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | GetEndowments
  | GetPermissions
  | HasPermission
  | HasPermissions
  | RequestPermissions
  | RevokeAllPermissions
  | RevokePermissions
  | RevokePermissionForAllSubjects
  | GetSubjects
  | AddApprovalRequest
  | UpdateRequestState
  | GrantPermissions
  | GetSubjectMetadata
  | UpdateCaveat
  | AddSubjectMetadata
  | ExecuteSnapAction
  | TerminateSnapAction
  | TerminateAllSnapsAction
  | HandleRpcRequestAction
  | GetResult
  | GetMetadata
  | Update
  | ResolveVersion
  | CreateInterface
  | GetInterface
  | SelectedNetworkControllerGetNetworkClientIdForDomainAction
  | NetworkControllerGetNetworkClientByIdAction;

type Events =
  | ErrorMessageEvent
  | OutboundRequest
  | OutboundResponse
  | KeyringControllerLockEvent;

export type SnapControllerMessenger = ReturnType<
  typeof getSnapControllerMessenger
>;

/**
 * Get a restricted messenger for the Snap controller. This is scoped to the
 * actions and events that the Snap controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'SnapController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'SnapController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'ExecutionService:unhandledError',
      'ExecutionService:outboundRequest',
      'ExecutionService:outboundResponse',
      'KeyringController:lock',
    ],
    actions: [
      'PermissionController:getEndowments',
      'PermissionController:getPermissions',
      'PermissionController:hasPermission',
      'PermissionController:hasPermissions',
      'PermissionController:requestPermissions',
      'PermissionController:revokeAllPermissions',
      'PermissionController:revokePermissions',
      'PermissionController:revokePermissionForAllSubjects',
      'PermissionController:getSubjectNames',
      'PermissionController:updateCaveat',
      'ApprovalController:addRequest',
      'ApprovalController:updateRequestState',
      'PermissionController:grantPermissions',
      'SubjectMetadataController:getSubjectMetadata',
      'SubjectMetadataController:addSubjectMetadata',
      'ExecutionService:executeSnap',
      'ExecutionService:terminateSnap',
      'ExecutionService:terminateAllSnaps',
      'ExecutionService:handleRpcRequest',
      'NetworkController:getNetworkClientById',
      'SelectedNetworkController:getNetworkClientIdForDomain',
      'SnapsRegistry:get',
      'SnapsRegistry:getMetadata',
      'SnapsRegistry:update',
      'SnapsRegistry:resolveVersion',
      'SnapInterfaceController:createInterface',
      'SnapInterfaceController:getInterface',
    ],
  });
  return controllerMessenger;
}

type InitActions =
  | KeyringControllerGetKeyringsByTypeAction
  | PreferencesControllerGetStateAction
  | MetaMetricsControllerTrackEventAction
  | SetClientActive;

type InitEvents = KeyringControllerUnlockEvent | KeyringControllerLockEvent;

export type SnapControllerInitMessenger = ReturnType<
  typeof getSnapControllerInitMessenger
>;

/**
 * Get a restricted messenger for the Snap controller init. This is scoped to
 * the actions and events that the Snap controller init is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapControllerInitMessenger(
  messenger: RootMessenger<InitActions, InitEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'SnapControllerInit',
    InitActions,
    InitEvents,
    typeof messenger
  >({
    namespace: 'SnapControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'KeyringController:getKeyringsByType',
      'PreferencesController:getState',
      'MetaMetricsController:trackEvent',
      'SnapController:setClientActive',
    ],
    events: ['KeyringController:lock', 'KeyringController:unlock'],
  });
  return controllerInitMessenger;
}
