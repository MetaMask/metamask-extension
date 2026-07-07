import { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hexToNumber } from '@metamask/utils';
import { getNetworkConnectionBanner } from '../selectors/selectors';
import type { RouteMessengerInstance } from '../pages/home/messenger';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
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

    const trackNetworkBannerEvent = useCallback(
      async ({
        bannerType,
        eventName,
      }: {
        bannerType: 'degraded' | 'unavailable';
        eventName: string;
      }) => {
        if (
          networkConnectionBannerState.status !== 'degraded' &&
          networkConnectionBannerState.status !== 'unavailable'
        ) {
          return;
        }
        const { chainId, rpcUrl } = networkConnectionBannerState;

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
      [networkConnectionBannerState, trackEvent, createEventBuilder],
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
      const key = `${networkConnectionBannerState.status}:${networkConnectionBannerState.chainId}:${networkConnectionBannerState.rpcUrl}`;
      if (lastReportedKeyRef.current === key) {
        return;
      }
      lastReportedKeyRef.current = key;
      trackNetworkBannerEvent({
        bannerType: networkConnectionBannerState.status,
        eventName: MetaMetricsEventName.NetworkConnectionBannerShown,
      });
    }, [networkConnectionBannerState, trackNetworkBannerEvent]);

    const switchToInfura = useCallback(async () => {
      if (
        networkConnectionBannerState.status !== 'degraded' &&
        networkConnectionBannerState.status !== 'unavailable'
      ) {
        return;
      }

      const { chainId, canSwitchToInfura } = networkConnectionBannerState;
      if (!canSwitchToInfura) {
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
