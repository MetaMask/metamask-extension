import {
  ComplianceService,
  type ComplianceServiceMessenger,
} from '@metamask/compliance-controller';
import { isProduction } from '../../../shared/lib/environment';
import { MessengerClientInitFunction } from './types';

function getComplianceServiceEnvironment(): 'production' | 'development' {
  return isProduction() ? 'production' : 'development';
}

/**
 * Initialize the ComplianceService.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const ComplianceServiceInit: MessengerClientInitFunction<
  ComplianceService,
  ComplianceServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new ComplianceService({
    messenger: controllerMessenger,
    fetch: globalThis.fetch.bind(globalThis),
    env: getComplianceServiceEnvironment(),
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
