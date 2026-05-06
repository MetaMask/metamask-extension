import {
  ComplianceService,
  type ComplianceServiceMessenger,
} from '@metamask/compliance-controller';
import { ENVIRONMENT } from '../../../development/build/constants';
import { MessengerClientInitFunction } from './types';

function getComplianceServiceEnvironment(): 'production' | 'development' {
  return process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.PRODUCTION
    ? 'production'
    : 'development';
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

  return { messengerClient };
};

