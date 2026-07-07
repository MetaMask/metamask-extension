import { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Hex, hexToNumber } from '@metamask/utils';
import { getNetworkConnectionBanner } from '../selectors/selectors';
import type { RouteMessengerInstance } from '../pages/home/messenger';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { onlyKeepHost } from '../../shared/lib/only-keep-host';
import { submitRequestToBackground } from '../store/background-connection';
import { NetworkConnectionBanner } from '../../shared/constants/app-state';
import { setShowInfuraSwitchToast } from '../components/app/toast-master/utils';
import { useMessenger } from './useMessenger';
import { useAnalytics } from './useAnalytics';

type UseNetworkConnectionBannerResult = NetworkConnectionBanner & {
  trackNetworkBannerEvent: (event: {
    bannerType: 'degraded' | 'unavailable';
    eventName: string;
    networkClientId: string;
  }) => void;
  /**
   * Switch the default RPC endpoint to Infura for the current failed network.
   * Only available when the network has an Infura endpoint to switch to.
   * Returns a promise that resolves when the switch is complete (or rejects on error).
   */
  switchToInfura: () => Promise<void>;
};

export const useNetworkConnectionBanner =
  (): UseNetworkConnectionBannerResult => {
    const dispatch = useDispatch();
    const messenger = useMessenger<RouteMessengerInstance>();
    const { trackEvent, createEventBuilder } = useAnalytics();
    const networkConnectionBannerState = useSelector(
      getNetworkConnectionBanner,
    );
    const networkConfigurationsByChainId = useSelector(
      getNetworkConfigurationsByChainId,
    );

    const trackNetworkBannerEvent = useCallback(
      async ({
        bannerType,
        eventName,
        networkClientId,
      }: {
        bannerType: 'degraded' | 'unavailable';
        eventName: string;
        networkClientId: string;
      }) => {
        try {
          let foundNetwork: { chainId: Hex; url: string } | undefined;
          for (const networkConfiguration of Object.values(
            networkConfigurationsByChainId,
          )) {
            const rpcEndpoint = networkConfiguration.rpcEndpoints.find(
              (endpoint) => endpoint.networkClientId === networkClientId,
            );
            if (rpcEndpoint) {
              foundNetwork = {
                chainId: networkConfiguration.chainId,
                url: rpcEndpoint.url,
              };
              break;
            }
          }
          if (!foundNetwork) {
            console.warn(
              `RPC endpoint not found for network client ID: ${networkClientId}`,
            );
            return;
          }

          const rpcUrl = foundNetwork.url;
          const chainIdAsDecimal = hexToNumber(foundNetwork.chainId);
          const isPublic = await submitRequestToBackground<boolean>(
            'isPublicEndpointUrl',
            [rpcUrl],
          );
          const sanitizedRpcUrl = isPublic ? onlyKeepHost(rpcUrl) : 'custom';

          trackEvent(
            createEventBuilder(eventName)
              .addCategory(MetaMetricsEventCategory.Network)
              .addProperties({
                // The names of Segment properties have a particular case.
                /* eslint-disable @typescript-eslint/naming-convention */
                banner_type: bannerType,
                chain_id_caip: `eip155:${chainIdAsDecimal}`,
                rpc_domain: sanitizedRpcUrl,
                rpc_endpoint_url: sanitizedRpcUrl, // @deprecated - Will be removed in a future release.
                /* eslint-enable @typescript-eslint/naming-convention */
              })
              .build(),
          );
        } catch (error) {
          // Analytics tracking failed - don't surface this error since it's non-critical
          console.error('Failed to track network banner event:', error);
        }
      },
      [networkConfigurationsByChainId, trackEvent, createEventBuilder],
    );

    // Fire the banner-shown analytics when the banner transitions to a
    // visible status. The 5s / 30s escalation lives inside the controller;
    // here we just translate state changes to analytics.
    const lastReportedKeyRef = useRef<string | null>(null);
    useEffect(() => {
      if (
        networkConnectionBannerState.status !== 'degraded' &&
        networkConnectionBannerState.status !== 'unavailable'
      ) {
        lastReportedKeyRef.current = null;
        return;
      }
      const key = `${networkConnectionBannerState.status}:${networkConnectionBannerState.networkClientId}`;
      if (lastReportedKeyRef.current === key) {
        return;
      }
      lastReportedKeyRef.current = key;
      trackNetworkBannerEvent({
        bannerType: networkConnectionBannerState.status,
        eventName: MetaMetricsEventName.NetworkConnectionBannerShown,
        networkClientId: networkConnectionBannerState.networkClientId,
      });
    }, [networkConnectionBannerState, trackNetworkBannerEvent]);

    const switchToInfura = useCallback(async () => {
      if (
        networkConnectionBannerState.status !== 'degraded' &&
        networkConnectionBannerState.status !== 'unavailable'
      ) {
        return;
      }

      const { chainId, switchableInfuraNetworkClientId } =
        networkConnectionBannerState;
      if (!switchableInfuraNetworkClientId) {
        return;
      }

      try {
        await messenger.call(
          'NetworkConnectionBannerController:switchToDefaultInfuraRpcEndpoint',
          chainId,
        );
        dispatch(setShowInfuraSwitchToast(true));
      } catch (error) {
        // Do not show the success toast on failure
        console.error(
          'Failed to switch to the default Infura RPC endpoint:',
          error,
        );
      }
    }, [networkConnectionBannerState, messenger, dispatch]);

    return {
      ...networkConnectionBannerState,
      trackNetworkBannerEvent,
      switchToInfura,
    };
  };
