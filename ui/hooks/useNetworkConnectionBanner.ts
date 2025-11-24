import { useEffect, useCallback, useRef, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Hex, hexToNumber } from '@metamask/utils';
import { selectFirstUnavailableEvmNetwork } from '../selectors/multichain/networks';
import { getNetworkConnectionBanner } from '../selectors/selectors';
import { updateNetworkConnectionBanner } from '../store/actions';
import { MetaMetricsContext } from '../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { infuraProjectId } from '../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { onlyKeepHost } from '../../shared/lib/only-keep-host';
import { isPublicEndpointUrl } from '../../shared/lib/network-utils';
import { NetworkConnectionBanner } from '../../shared/constants/app-state';

type UseNetworkConnectionBannerResult = NetworkConnectionBanner & {
  trackNetworkBannerEvent: (event: {
    bannerType: 'degraded' | 'unavailable';
    eventName: string;
    networkClientId: string;
  }) => void;
};

const DEGRADED_BANNER_TIMEOUT = 5 * 1000;
const UNAVAILABLE_BANNER_TIMEOUT = 30 * 1000;

export const useNetworkConnectionBanner =
  (): UseNetworkConnectionBannerResult => {
    const dispatch = useDispatch();
    const trackEvent = useContext(MetaMetricsContext);
    const firstUnavailableEvmNetwork = useSelector(
      selectFirstUnavailableEvmNetwork,
    );
    const networkConnectionBannerState = useSelector(
      getNetworkConnectionBanner,
    );
    const networkConfigurationsByChainId = useSelector(
      getNetworkConfigurationsByChainId,
    );

    const timersRef = useRef<{
      degradedTimer?: NodeJS.Timeout;
      unavailableTimer?: NodeJS.Timeout;
    }>({});

    const clearDegradedTimer = useCallback(() => {
      if (timersRef.current.degradedTimer) {
        clearTimeout(timersRef.current.degradedTimer);
        timersRef.current.degradedTimer = undefined;
      }
    }, []);

    const clearUnavailableTimer = useCallback(() => {
      if (timersRef.current.unavailableTimer) {
        clearTimeout(timersRef.current.unavailableTimer);
        timersRef.current.unavailableTimer = undefined;
      }
    }, []);

    const clearTimers = useCallback(() => {
      clearDegradedTimer();
      clearUnavailableTimer();
    }, [clearDegradedTimer, clearUnavailableTimer]);

    const trackNetworkBannerEvent = useCallback(
      ({
        bannerType,
        eventName,
        networkClientId,
      }: {
        bannerType: 'degraded' | 'unavailable';
        eventName: string;
        networkClientId: string;
      }) => {
        if (!infuraProjectId) {
          console.warn(
            'Infura project ID not found, cannot track network banner event',
          );
          return;
        }

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
        const sanitizedRpcUrl = isPublicEndpointUrl(rpcUrl, infuraProjectId)
          ? onlyKeepHost(rpcUrl)
          : 'custom';

        trackEvent({
          category: MetaMetricsEventCategory.Network,
          event: eventName,
          // The names of Segment properties have a particular case.
          /* eslint-disable @typescript-eslint/naming-convention */
          properties: {
            banner_type: bannerType,
            chain_id_caip: `eip155:${chainIdAsDecimal}`,
            rpc_endpoint_url: sanitizedRpcUrl,
          },
          /* eslint-enable @typescript-eslint/naming-convention */
        });
      },
      [networkConfigurationsByChainId, trackEvent],
    );

    const startUnavailableTimer = useCallback(() => {
      clearUnavailableTimer();

      timersRef.current.unavailableTimer = setTimeout(() => {
        if (firstUnavailableEvmNetwork) {
          trackNetworkBannerEvent({
            bannerType: 'unavailable',
            eventName: MetaMetricsEventName.NetworkConnectionBannerShown,
            networkClientId: firstUnavailableEvmNetwork.networkClientId,
          });
          dispatch(
            updateNetworkConnectionBanner({
              status: 'unavailable',
              networkName: firstUnavailableEvmNetwork.networkName,
              networkClientId: firstUnavailableEvmNetwork.networkClientId,
              chainId: firstUnavailableEvmNetwork.chainId,
              isInfuraEndpoint: firstUnavailableEvmNetwork.isInfuraEndpoint,
            }),
          );
        }
      }, UNAVAILABLE_BANNER_TIMEOUT - DEGRADED_BANNER_TIMEOUT);
    }, [
      firstUnavailableEvmNetwork,
      trackNetworkBannerEvent,
      dispatch,
      clearUnavailableTimer,
    ]);

    const startDegradedTimer = useCallback(() => {
      clearDegradedTimer();

      timersRef.current.degradedTimer = setTimeout(() => {
        if (firstUnavailableEvmNetwork) {
          trackNetworkBannerEvent({
            bannerType: 'degraded',
            eventName: MetaMetricsEventName.NetworkConnectionBannerShown,
            networkClientId: firstUnavailableEvmNetwork.networkClientId,
          });
          dispatch(
            updateNetworkConnectionBanner({
              status: 'degraded',
              networkName: firstUnavailableEvmNetwork.networkName,
              networkClientId: firstUnavailableEvmNetwork.networkClientId,
              chainId: firstUnavailableEvmNetwork.chainId,
              isInfuraEndpoint: firstUnavailableEvmNetwork.isInfuraEndpoint,
            }),
          );

          startUnavailableTimer();
        }
      }, DEGRADED_BANNER_TIMEOUT);
    }, [
      firstUnavailableEvmNetwork,
      trackNetworkBannerEvent,
      dispatch,
      startUnavailableTimer,
      clearDegradedTimer,
    ]);

    // If the first unavailable network does not change but the status changes, start the degraded or unavailable timer
    // If the first unavailable network changes, reset all timers and change the status

    useEffect(() => {
      if (firstUnavailableEvmNetwork) {
        if (networkConnectionBannerState.status === 'degraded') {
          startUnavailableTimer();
        } else if (
          networkConnectionBannerState.status === 'unknown' ||
          networkConnectionBannerState.status === 'available'
        ) {
          startDegradedTimer();
        }
      } else if (networkConnectionBannerState.status !== 'available') {
        dispatch(updateNetworkConnectionBanner({ status: 'available' }));
      }

      return () => {
        clearTimers();
      };
    }, [
      firstUnavailableEvmNetwork,
      clearTimers,
      dispatch,
      networkConnectionBannerState.status,
      startDegradedTimer,
      startUnavailableTimer,
    ]);

    return {
      ...networkConnectionBannerState,
      trackNetworkBannerEvent,
    };
  };
