import {
  ComplianceController,
  type ComplianceControllerMessenger,
} from '@metamask/compliance-controller';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the ComplianceController.
 *
 * The controller always exists so persisted compliance state is available.
 * Consumers decide whether to call the service based on their own gating logic.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger for the controller.
 * @param request.persistedState - Persisted state to hydrate from.
 * @returns The initialized controller.
 */
export const ComplianceControllerInit: MessengerClientInitFunction<
  ComplianceController,
  ComplianceControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new ComplianceController({
    messenger: controllerMessenger,
    state: persistedState.ComplianceController,
  });

  return { messengerClient };
};
