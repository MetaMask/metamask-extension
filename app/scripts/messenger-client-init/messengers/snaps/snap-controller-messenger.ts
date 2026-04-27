import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import {
  SnapControllerMessenger,
  SnapControllerSetClientActiveAction,
} from '@metamask/snaps-controllers';
import {
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
  KeyringControllerWithKeyringAction,
} from '@metamask/keyring-controller';
import { PreferencesControllerGetStateAction } from '../../../controllers/preferences-controller';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller-method-action-types';
import { RootMessenger } from '../../../lib/messenger';
import {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../../controllers/onboarding';

/**
 * Get a restricted messenger for the Snap controller. This is scoped to the
 * actions and events that the Snap controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SnapControllerMessenger>,
    MessengerEvents<SnapControllerMessenger>
  >,
) {
  const controllerMessenger: SnapControllerMessenger = new Messenger({
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
      'SnapRegistryController:registryUpdated',
    ],
    actions: [
      'PermissionController:getEndowments',
      'PermissionController:getPermissions',
      'PermissionController:hasPermission',
      'PermissionController:hasPermissions',
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
      'ExecutionService:handleRpcRequest',
      'SnapRegistryController:get',
      'SnapRegistryController:getMetadata',
      'SnapRegistryController:requestUpdate',
      'SnapRegistryController:resolveVersion',
      'SnapInterfaceController:createInterface',
      'SnapInterfaceController:getInterface',
      'SnapInterfaceController:setInterfaceDisplayed',
      'StorageService:setItem',
      'StorageService:getItem',
      'StorageService:removeItem',
      'StorageService:clear',
    ],
  });
  return controllerMessenger;
}

type InitActions =
  | KeyringControllerWithKeyringAction
  | PreferencesControllerGetStateAction
  | MetaMetricsControllerTrackEventAction
  | SnapControllerSetClientActiveAction
  | OnboardingControllerGetStateAction;

type InitEvents =
  | KeyringControllerUnlockEvent
  | KeyringControllerLockEvent
  | OnboardingControllerStateChangeEvent;

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
      'KeyringController:withKeyring',
      'PreferencesController:getState',
      'MetaMetricsController:trackEvent',
      'SnapController:setClientActive',
      'OnboardingController:getState',
    ],
    events: [
      'KeyringController:lock',
      'KeyringController:unlock',
      'OnboardingController:stateChange',
    ],
  });
  return controllerInitMessenger;
}
