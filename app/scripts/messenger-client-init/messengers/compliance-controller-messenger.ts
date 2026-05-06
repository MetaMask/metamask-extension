import { Messenger } from '@metamask/messenger';
import type {
  ComplianceControllerActions,
  ComplianceControllerEvents,
  ComplianceServiceCheckWalletComplianceAction,
  ComplianceServiceCheckWalletsComplianceAction,
} from '@metamask/compliance-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | ComplianceServiceCheckWalletComplianceAction
  | ComplianceServiceCheckWalletsComplianceAction;

type AllowedEvents = never;

export type ComplianceControllerMessenger = ReturnType<
  typeof getComplianceControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * ComplianceController.
 *
 * @param messenger - The root messenger used to create the restricted messenger.
 * @returns A restricted messenger for the ComplianceController.
 */
export function getComplianceControllerMessenger(
  messenger: RootMessenger<ComplianceControllerActions | AllowedActions>,
) {
  const complianceControllerMessenger = new Messenger<
    'ComplianceController',
    ComplianceControllerActions | AllowedActions,
    ComplianceControllerEvents | AllowedEvents,
    typeof messenger
  >({
    namespace: 'ComplianceController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: complianceControllerMessenger,
    actions: [
      'ComplianceService:checkWalletCompliance',
      'ComplianceService:checkWalletsCompliance',
    ],
  });

  return complianceControllerMessenger;
}
