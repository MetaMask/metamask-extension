import {
  ChompApiService,
  type ChompApiServiceMessenger,
} from '@metamask/chomp-api-service';
import { createProjectLogger } from '@metamask/utils';
import { getMoneyAccountChompConfig } from '../../../shared/lib/money/chomp-config';
import type { ChompApiServiceInitMessenger } from './messengers/chomp-api-service-messenger';
import type { MessengerClientInitFunction } from './types';

const log = createProjectLogger('chomp-api-service');

export const DEFAULT_CHOMP_API_URL = 'https://chomp.api.cx.metamask.io';

/**
 * Initialize the ChompApiService.
 *
 * The base URL comes from the `moneyAccountChompConfig` remote feature flag,
 * always falling back to the production CHOMP API when the flag is missing or
 * malformed
 *
 * The URL is frozen at construction so flag changes are only picked up
 * when the background process restarts.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.initMessenger - The messenger to read feature flags with.
 * @returns The initialized service.
 */
export const ChompApiServiceInit: MessengerClientInitFunction<
  ChompApiService,
  ChompApiServiceMessenger,
  ChompApiServiceInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const { remoteFeatureFlags } = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );

  const chompConfig = getMoneyAccountChompConfig(remoteFeatureFlags);
  if (!chompConfig) {
    log('CHOMP config flag unserved; defaulting', DEFAULT_CHOMP_API_URL);
  }

  const messengerClient = new ChompApiService({
    messenger: controllerMessenger,
    baseUrl: chompConfig?.baseUrl ?? DEFAULT_CHOMP_API_URL,
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
