import {
  BridgeClientId,
  BridgeController,
  BridgeControllerMessenger,
  UNIFIED_SWAP_BRIDGE_EVENT_CATEGORY,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { handleFetch, HttpError } from '@metamask/controller-utils';
import { TransactionController } from '@metamask/transaction-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
  AssetsUnifyStateFeatureFlag,
  isAssetsUnifyStateFeatureEnabled,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';
import { trace } from '../../../shared/lib/trace';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { MINUTE, SECOND } from '../../../shared/constants/time';
import { getEnvironmentType } from '../lib/util';
import {
  getActiveTabDomainAllowlist,
  getActiveTabDomainForMetrics,
} from '../../../shared/lib/active-tab-domain-metrics';
import { MessengerClientInitFunction } from './types';
import { BridgeControllerInitMessenger } from './messengers';

/**
 * Initialize the bridge controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.getMessengerClient
 * @returns The initialized controller.
 */
export const BridgeControllerInit: MessengerClientInitFunction<
  BridgeController,
  BridgeControllerMessenger,
  BridgeControllerInitMessenger
> = ({ controllerMessenger, initMessenger, getMessengerClient }) => {
  const transactionController = getMessengerClient(
    'TransactionController',
  ) as TransactionController;

  if (!process.env.METAMASK_VERSION) {
    throw new Error(
      'process.env.METAMASK_VERSION is not defined but is required by the BridgeController',
    );
  }

  const messengerClient = new BridgeController({
    messenger: controllerMessenger,
    clientId: BridgeClientId.EXTENSION,
    clientVersion: process.env.METAMASK_VERSION,

    // TODO: Remove once TransactionController exports this action type.
    getLayer1GasFee: (...args) =>
      transactionController.getLayer1GasFee(...args),

    fetchFn: async (url, requestOptions) => {
      const urlString = url.toString();
      // Cache token list for 10 minutes
      if (urlString.includes('getTokens')) {
        return await fetchWithCache({
          url: urlString,
          fetchOptions: { method: 'GET', ...requestOptions },
          cacheOptions: { cacheRefreshTime: 10 * MINUTE },
          functionName: 'fetchBridgeTokens',
        });
      }
      // Cache spot prices for 30 seconds
      if (urlString.includes('spot-prices')) {
        return await fetchWithCache({
          url: urlString,
          fetchOptions: { method: 'GET', ...requestOptions },
          cacheOptions: { cacheRefreshTime: 30 * SECOND },
          functionName: 'fetchAssetExchangeRates',
        });
      }
      // Use handleFetch for getQuote
      if (urlString.includes('getQuote?')) {
        return await handleFetch(url, {
          method: 'GET',
          ...requestOptions,
        });
      }
      // Use fetch for all other requests
      const response = await fetch(url, requestOptions);
      if (!response.ok) {
        throw new HttpError(
          response.status,
          `Fetch failed with status '${response.status}' for request ${urlString}`,
        );
      }
      return response;
    },

    trackMetaMetricsFn: (event, properties) => {
      const actionId = (Date.now() + Math.random()).toString();

      let activeTabDomain: string | undefined;
      if (event === UnifiedSwapBridgeEventName.Submitted) {
        try {
          const appStateController = getMessengerClient('AppStateController');
          const remoteFeatureFlagController = getMessengerClient(
            'RemoteFeatureFlagController',
          );
          const activeTabOrigin =
            appStateController?.state?.appActiveTab?.origin;
          const allowlist = getActiveTabDomainAllowlist(
            remoteFeatureFlagController?.state,
          );
          activeTabDomain = getActiveTabDomainForMetrics(
            activeTabOrigin,
            allowlist,
          );
        } catch {
          // Intentionally empty
        }
      }

      initMessenger.call('MetaMetricsController:trackEvent', {
        category: UNIFIED_SWAP_BRIDGE_EVENT_CATEGORY,
        event,
        properties: {
          ...(properties ?? {}),
          environmentType: getEnvironmentType(),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          ...(activeTabDomain ? { active_tab_domain: activeTabDomain } : {}),
          actionId,
        },
      });
    },

    // @ts-expect-error: `trace` function type does not match the expected type.
    traceFn: (...args) => trace(...args),

    config: {
      customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
    },

    getUseAssetsControllerForRates: () => {
      try {
        const remoteFeatureFlagController = getMessengerClient(
          'RemoteFeatureFlagController',
        );
        const featureFlag = remoteFeatureFlagController?.state
          ?.remoteFeatureFlags?.[ASSETS_UNIFY_STATE_FLAG] as
          | AssetsUnifyStateFeatureFlag
          | undefined;

        return (
          isAssetsUnifyStateFeatureEnabled(
            featureFlag,
            ASSETS_UNIFY_STATE_VERSION_1,
          ) && getIsAssetsUnifiedStateIncludedInBuild()
        );
      } catch {
        return false;
      }
    },
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    messengerClient,
  };
};
