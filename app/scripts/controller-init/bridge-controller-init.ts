import {
  BridgeClientId,
  BridgeController,
  UNIFIED_SWAP_BRIDGE_EVENT_CATEGORY,
} from '@metamask/bridge-controller';
import { handleFetch } from '@metamask/controller-utils';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { trace } from '../../../shared/lib/trace';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { getEnvironmentType } from '../lib/util';
import { ControllerInitFunction } from './types';
import {
  BridgeControllerInitMessenger,
  BridgeControllerMessenger,
} from './messengers';

type FetchWithCacheOptions = {
  cacheOptions?: {
    cacheRefreshTime: number;
  };
  functionName?: string;
};

/**
 * Initialize the bridge controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.getController
 * @returns The initialized controller.
 */
export const BridgeControllerInit: ControllerInitFunction<
  BridgeController,
  BridgeControllerMessenger,
  BridgeControllerInitMessenger
> = ({ controllerMessenger, initMessenger, getController }) => {
  const transactionController = getController('TransactionController');

  const controller = new BridgeController({
    messenger: controllerMessenger,
    clientId: BridgeClientId.EXTENSION,

    // TODO: Remove once TransactionController exports this action type.
    getLayer1GasFee: (...args) =>
      transactionController.getLayer1GasFee(...args),

    fetchFn: async (
      url,
      {
        cacheOptions,
        functionName,
        ...requestOptions
      }: FetchWithCacheOptions = {},
    ) => {
      if (functionName === 'fetchBridgeTokens') {
        return await fetchWithCache({
          url: url.toString(),
          fetchOptions: { method: 'GET', ...requestOptions },
          cacheOptions,
          functionName,
        });
      }

      return await handleFetch(url, {
        method: 'GET',
        ...requestOptions,
      });
    },

    trackMetaMetricsFn: (event, properties) => {
      const actionId = (Date.now() + Math.random()).toString();
      initMessenger.call('MetaMetricsController:trackEvent', {
        category: UNIFIED_SWAP_BRIDGE_EVENT_CATEGORY,
        event,
        properties: {
          ...(properties ?? {}),
          environmentType: getEnvironmentType(),
          actionId,
        },
      });
    },

    // @ts-expect-error: `trace` function type does not match the expected type.
    traceFn: (...args) => trace(...args),

    config: {
      customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
    },
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
