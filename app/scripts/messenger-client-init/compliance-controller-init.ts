import {
  ComplianceController,
  type ComplianceControllerMessenger,
  type WalletComplianceStatus,
} from '@metamask/compliance-controller';
import { MessengerClientInitFunction } from './types';

type ComplianceBackgroundApi = {
  complianceCheckWalletsCompliance: (
    addresses: string[],
  ) => Promise<WalletComplianceStatus[]>;
};

/**
 * Initialize the ComplianceController.
 *
 * The controller always exists so its persisted state slot is available. Perps
 * gates decide whether to call the API by checking the compliance feature flag.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger for the controller.
 * @param request.persistedState - Persisted state to hydrate from.
 * @returns The initialized controller and background API.
 */
export const ComplianceControllerInit: MessengerClientInitFunction<
  ComplianceController,
  ComplianceControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new ComplianceController({
    messenger: controllerMessenger,
    state: persistedState.ComplianceController,
  });

  return {
    messengerClient,
    api: getApi(messengerClient),
  };
};

function getApi(
  messengerClient: ComplianceController,
): ComplianceBackgroundApi {
  return {
    complianceCheckWalletsCompliance:
      messengerClient.checkWalletsCompliance.bind(messengerClient),
  };
}
