import {
  ChompApiService,
  type ChompApiServiceMessenger,
} from '@metamask/chomp-api-service';
import { createProjectLogger } from '@metamask/utils';
import { devApiEnv } from '../../../shared/lib/authentication/dev-api-env';
import { getMoneyAccountChompConfig } from '../../../shared/lib/money/chomp-config';
import type { ChompApiServiceInitMessenger } from './messengers/chomp-api-service-messenger';
import type { MessengerClientInitFunction } from './types';

const log = createProjectLogger('chomp-api-service');

export const DEFAULT_CHOMP_API_URL = 'https://chomp.api.cx.metamask.io';

/**
 * Dev CHOMP host. A token minted by `MM_DEV_API_ENV=dev` is rejected by the
 * production host, so the two have to move together.
 */
export const DEV_CHOMP_API_URL = 'https://chomp.dev-api.cx.metamask.io';

/**
 * Initialize the ChompApiService.
 *
 * The base URL comes from the `moneyAccountChompConfig` remote feature flag,
 * always falling back to the production CHOMP API when the flag is missing or
 * malformed. A development build opted into `MM_DEV_API_ENV=dev` uses the dev
 * host instead: that token's issuer is not accepted by production CHOMP.
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
  // The dev login token and the CHOMP host have to be the same environment.
  // The remote flag often still names the production host.
  const useDevApi = devApiEnv() === 'dev';
  const baseUrl = useDevApi
    ? DEV_CHOMP_API_URL
    : (chompConfig?.baseUrl ?? DEFAULT_CHOMP_API_URL);
  if (!useDevApi && !chompConfig) {
    log('CHOMP config flag unserved; defaulting', DEFAULT_CHOMP_API_URL);
  }

  const messengerClient = new ChompApiService({
    messenger: controllerMessenger,
    baseUrl,
  });

  return { messengerClient, persistedStateKey: null, memStateKey: null };
};
