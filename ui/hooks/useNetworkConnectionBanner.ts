import { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hexToNumber } from '@metamask/utils';
import { networkConnectionBannerControllerSelectors } from '@metamask/network-connection-banner-controller';
import type {
  FailedNetwork,
  NetworkConnectionBannerStatus,
} from '@metamask/network-connection-banner-controller';
import type { MetaMaskReduxState } from '../store/store';
import type { RouteMessengerInstance } from '../pages/home/messenger';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { onlyKeepHost } from '../../shared/lib/only-keep-host';
import { submitRequestToBackground } from '../store/background-connection';
import { setShowInfuraSwitchToast } from '../components/app/toast-master/utils';
import { useMessenger } from './useMessenger';
import { useAnalytics } from './useAnalytics';

const {
  selectNetworkConnectionBannerStatus,
  selectNetworkConnectionBannerNetwork,
} = networkConnectionBannerControllerSelectors;

type UseNetworkConnectionBannerResult = {
  status: NetworkConnectionBannerStatus;
  network: FailedNetwork | null;
  trackNetworkBannerEvent: (event: {
    bannerType: 'degraded' | 'unavailable';
    eventName: string;
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
    const status = useSelector((state: MetaMaskReduxState) =>
      selectNetworkConnectionBannerStatus(state.metamask),
    );
    const network = useSelector((state: MetaMaskReduxState) =>
      selectNetworkConnectionBannerNetwork(state.metamask),
    );

    const trackNetworkBannerEvent = useCallback(
      async ({
        bannerType,
        eventName,
      }: {
        bannerType: 'degraded' | 'unavailable';
        eventName: string;
      }) => {
        if (!network) {
          return;
        }
        const { chainId, rpcUrl } = network;

        try {
          const chainIdAsDecimal = hexToNumber(chainId);
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
      [network, trackEvent, createEventBuilder],
    );

    // Fire the banner-shown analytics when the banner transitions to a
    // visible status. The 5s / 30s escalation lives inside the controller;
    // here we just translate state changes to analytics.
    const lastReportedKeyRef = useRef<string | null>(null);
    useEffect(() => {
      if ((status !== 'degraded' && status !== 'unavailable') || !network) {
        lastReportedKeyRef.current = null;
        return;
      }
      const key = `${status}:${network.chainId}:${network.rpcUrl}`;
      if (lastReportedKeyRef.current === key) {
        return;
      }
      lastReportedKeyRef.current = key;
      trackNetworkBannerEvent({
        bannerType: status,
        eventName: MetaMetricsEventName.NetworkConnectionBannerShown,
      });
    }, [status, network, trackNetworkBannerEvent]);

    const switchToInfura = useCallback(async () => {
      if (!network || network.switchableInfuraNetworkClientId === null) {
        return;
      }

      try {
        await messenger.call(
          'NetworkConnectionBannerController:switchToDefaultInfuraRpcEndpoint',
          network.chainId,
        );
        dispatch(setShowInfuraSwitchToast(true));
      } catch (error) {
        // Do not show the success toast on failure
        console.error(
          'Failed to switch to the default Infura RPC endpoint:',
          error,
        );
      }
    }, [network, messenger, dispatch]);

    return {
      status,
      network,
      trackNetworkBannerEvent,
      switchToInfura,
    };
  };
