import { Messenger } from '@metamask/messenger';
import type {
  ComplianceServiceActions,
  ComplianceServiceEvents,
} from '@metamask/compliance-controller';
import { RootMessenger } from '../../lib/messenger';

export type ComplianceServiceMessenger = ReturnType<
  typeof getComplianceServiceMessenger
>;

/**
 * Create a messenger for the ComplianceService.
 *
 * @param messenger - The root messenger used to create the restricted messenger.
 * @returns A restricted messenger for the ComplianceService.
 */
export function getComplianceServiceMessenger(messenger: RootMessenger) {
  return new Messenger<
    'ComplianceService',
    ComplianceServiceActions,
    ComplianceServiceEvents,
    typeof messenger
  >({
    namespace: 'ComplianceService',
    parent: messenger,
  });
}
