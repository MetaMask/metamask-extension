import { useEffect, useCallback, useRef, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hexToNumber } from '@metamask/utils';
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

const SLOW_BANNER_TIMEOUT = 5 * 1000; // 5 seconds
const UNAVAILABLE_BANNER_TIMEOUT = 30 * 1000; // 30 seconds

export const useNetworkConnectionBanner = () => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const firstUnavailableEvmNetwork = useSelector(
    selectFirstUnavailableEvmNetwork,
  );
  console.log('firstUnavailableEvmNetwork', firstUnavailableEvmNetwork);
  const networkConnectionBannerState = useSelector(getNetworkConnectionBanner);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const timersRef = useRef<{
    slowTimer?: NodeJS.Timeout;
    unavailableTimer?: NodeJS.Timeout;
  }>({});

  const clearTimers = useCallback(() => {
    if (timersRef.current.slowTimer) {
      clearTimeout(timersRef.current.slowTimer);
      timersRef.current.slowTimer = undefined;
    }
    if (timersRef.current.unavailableTimer) {
      clearTimeout(timersRef.current.unavailableTimer);
      timersRef.current.unavailableTimer = undefined;
    }
  }, []);

  const trackNetworkBannerEvent = useCallback(
    (eventName: string, networkClientId: string) => {
      if (!infuraProjectId) {
        console.warn(
          'Infura project ID not found, cannot track network banner event',
        );
        return;
      }

      const networkConfiguration = Object.values(
        networkConfigurationsByChainId,
      ).find((network) => {
        return network.rpcEndpoints.some(
          (rpcEndpoint) => rpcEndpoint.networkClientId === networkClientId,
        );
      });
      if (!networkConfiguration) {
        console.warn(
          `Network configuration not found for client ID: ${networkClientId}`,
        );
        return;
      }

      const rpcEndpoint = networkConfiguration.rpcEndpoints.find(
        (endpoint) => endpoint.networkClientId === networkClientId,
      );
      if (!rpcEndpoint) {
        console.warn(
          `RPC endpoint not found for network client ID: ${networkClientId}`,
        );
        return;
      }

      const rpcUrl = rpcEndpoint.url;
      const chainIdNumber = hexToNumber(networkConfiguration.chainId);
      const sanitizedRpcUrl = isPublicEndpointUrl(rpcUrl, infuraProjectId)
        ? onlyKeepHost(rpcUrl)
        : 'custom';

      trackEvent({
        category: MetaMetricsEventCategory.Network,
        event: eventName,
        // The names of Segment properties have a particular case.
        /* eslint-disable @typescript-eslint/naming-convention */
        properties: {
          chain_id_caip: `eip155:${chainIdNumber}`,
          rpc_endpoint_url: sanitizedRpcUrl,
        },
        /* eslint-enable @typescript-eslint/naming-convention */
      });
    },
    [networkConfigurationsByChainId, trackEvent],
  );

  const startUnavailableTimer = useCallback(() => {
    console.log('Starting unavailable timer');
    timersRef.current.unavailableTimer = setTimeout(() => {
      if (firstUnavailableEvmNetwork) {
        console.log('Showing unavailable banner');
        trackNetworkBannerEvent(
          MetaMetricsEventName.UnavailableRpcBannerShown,
          firstUnavailableEvmNetwork.networkClientId,
        );
        dispatch(
          updateNetworkConnectionBanner({
            status: 'unavailable',
            networkName: firstUnavailableEvmNetwork.networkName,
            networkClientId: firstUnavailableEvmNetwork.networkClientId,
            chainId: firstUnavailableEvmNetwork.chainId,
          }),
        );
      }
    }, UNAVAILABLE_BANNER_TIMEOUT - SLOW_BANNER_TIMEOUT);
  }, [firstUnavailableEvmNetwork, trackNetworkBannerEvent, dispatch]);

  const startSlowTimer = useCallback(() => {
    console.log('Starting slow timer');
    timersRef.current.slowTimer = setTimeout(() => {
      console.log('Now firstUnavailableEvmNetwork', firstUnavailableEvmNetwork);
      if (firstUnavailableEvmNetwork) {
        console.log('Showing slow banner');
        trackNetworkBannerEvent(
          MetaMetricsEventName.SlowRpcBannerShown,
          firstUnavailableEvmNetwork.networkClientId,
        );
        dispatch(
          updateNetworkConnectionBanner({
            status: 'slow',
            networkName: firstUnavailableEvmNetwork.networkName,
            networkClientId: firstUnavailableEvmNetwork.networkClientId,
            chainId: firstUnavailableEvmNetwork.chainId,
          }),
        );

        startUnavailableTimer();
      }
    }, SLOW_BANNER_TIMEOUT);
  }, [
    firstUnavailableEvmNetwork,
    trackNetworkBannerEvent,
    dispatch,
    startUnavailableTimer,
  ]);

  useEffect(() => {
    console.log('Running useEffect');

    clearTimers();

    if (firstUnavailableEvmNetwork) {
      // If banner is already visible and status is slow, start unavailable timer
      if (networkConnectionBannerState.status === 'slow') {
        console.log('Starting unavailable timer (banner already slow)');
        startUnavailableTimer();
      } else if (
        networkConnectionBannerState.status === 'unknown' ||
        networkConnectionBannerState.status === 'available'
      ) {
        // Only start slow timer if banner is not visible (status is unknown or available)
        startSlowTimer();
      }
    } else if (networkConnectionBannerState.status !== 'available') {
      console.log('Hiding banner');
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
    startSlowTimer,
    startUnavailableTimer,
  ]);

  return {
    ...networkConnectionBannerState,
    trackNetworkBannerEvent,
  };
};
