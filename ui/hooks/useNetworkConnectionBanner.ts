import { useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Hex, hexToNumber } from '@metamask/utils';
import { selectFirstFailedNetworkForNetworkConnectionBanner } from '../selectors/multichain/networks';
import {
  getNetworkConnectionBanner,
  getIsDeviceOffline,
} from '../selectors/selectors';
import { updateNetworkConnectionBanner, updateNetwork } from '../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { onlyKeepHost } from '../../shared/lib/only-keep-host';
import { submitRequestToBackground } from '../store/background-connection';
import { NetworkConnectionBanner } from '../../shared/constants/app-state';
import { setShowInfuraSwitchToast } from '../components/app/toast-master/utils';
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

const DEGRADED_BANNER_TIMEOUT = 5 * 1000;
const UNAVAILABLE_BANNER_TIMEOUT = 30 * 1000;

export const useNetworkConnectionBanner =
  (): UseNetworkConnectionBannerResult => {
    const dispatch = useDispatch();
    const { trackEvent, createEventBuilder } = useAnalytics();
    const isOffline = useSelector(getIsDeviceOffline);
    const failedNetwork = useSelector(
      selectFirstFailedNetworkForNetworkConnectionBanner,
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

    const startUnavailableTimer = useCallback(() => {
      clearUnavailableTimer();

      timersRef.current.unavailableTimer = setTimeout(() => {
        if (failedNetwork) {
          trackNetworkBannerEvent({
            bannerType: 'unavailable',
            eventName: MetaMetricsEventName.NetworkConnectionBannerShown,
            networkClientId: failedNetwork.networkClientId,
          });
          dispatch(
            updateNetworkConnectionBanner({
              status: 'unavailable',
              networkName: failedNetwork.networkName,
              networkClientId: failedNetwork.networkClientId,
              chainId: failedNetwork.chainId,
              isInfuraEndpoint: failedNetwork.isInfuraEndpoint,
              infuraEndpointIndex: failedNetwork.infuraEndpointIndex,
            }),
          );
        }
      }, UNAVAILABLE_BANNER_TIMEOUT - DEGRADED_BANNER_TIMEOUT);
    }, [
      failedNetwork,
      trackNetworkBannerEvent,
      dispatch,
      clearUnavailableTimer,
    ]);

    const startDegradedTimer = useCallback(() => {
      clearDegradedTimer();

      timersRef.current.degradedTimer = setTimeout(() => {
        if (failedNetwork) {
          trackNetworkBannerEvent({
            bannerType: 'degraded',
            eventName: MetaMetricsEventName.NetworkConnectionBannerShown,
            networkClientId: failedNetwork.networkClientId,
          });
          dispatch(
            updateNetworkConnectionBanner({
              status: 'degraded',
              networkName: failedNetwork.networkName,
              networkClientId: failedNetwork.networkClientId,
              chainId: failedNetwork.chainId,
              isInfuraEndpoint: failedNetwork.isInfuraEndpoint,
              infuraEndpointIndex: failedNetwork.infuraEndpointIndex,
            }),
          );

          startUnavailableTimer();
        }
      }, DEGRADED_BANNER_TIMEOUT);
    }, [
      failedNetwork,
      trackNetworkBannerEvent,
      dispatch,
      startUnavailableTimer,
      clearDegradedTimer,
    ]);

    // If the failed network does not change but the banner status changes, start the degraded or unavailable timer
    // If the failed network changes, reset all timers and change the status
    // If the device is offline, don't show network banners - the issue is device connectivity, not the network
    useEffect(() => {
      // When device is offline, clear timers and reset banner state
      // We don't want to show network degraded/unavailable banners when the real issue
      // is the device's internet connectivity
      if (isOffline) {
        clearTimers();
        if (networkConnectionBannerState.status !== 'available') {
          dispatch(updateNetworkConnectionBanner({ status: 'available' }));
        }
        return;
      }

      if (failedNetwork) {
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
      isOffline,
      failedNetwork,
      clearTimers,
      dispatch,
      networkConnectionBannerState.status,
      startDegradedTimer,
      startUnavailableTimer,
    ]);

    const switchToInfura = useCallback(async () => {
      if (
        networkConnectionBannerState.status !== 'degraded' &&
        networkConnectionBannerState.status !== 'unavailable'
      ) {
        return;
      }

      const { chainId, infuraEndpointIndex } = networkConnectionBannerState;
      if (infuraEndpointIndex === undefined) {
        return;
      }

      const networkConfiguration = networkConfigurationsByChainId[chainId];
      if (!networkConfiguration) {
        return;
      }

      // Update the network configuration to use the Infura endpoint as default
      // Only show success toast if the update completes without error
      try {
        await dispatch(
          updateNetwork(
            {
              chainId,
              name: networkConfiguration.name,
              nativeCurrency: networkConfiguration.nativeCurrency,
              rpcEndpoints: networkConfiguration.rpcEndpoints,
              blockExplorerUrls: networkConfiguration.blockExplorerUrls,
              defaultBlockExplorerUrlIndex:
                networkConfiguration.defaultBlockExplorerUrlIndex,
              defaultRpcEndpointIndex: infuraEndpointIndex,
            },
            { replacementSelectedRpcEndpointIndex: infuraEndpointIndex },
          ),
        );
        dispatch(setShowInfuraSwitchToast(true));
      } catch {
        // Error is already handled by updateNetwork which shows a warning
        // Do not show success toast on failure
      }
    }, [
      networkConnectionBannerState,
      networkConfigurationsByChainId,
      dispatch,
    ]);

    // When in degraded/unavailable status, use fresh selector data for network details
    // to prevent stale "Switch to MetaMask default RPC" button after switching endpoints
    if (
      (networkConnectionBannerState.status === 'degraded' ||
        networkConnectionBannerState.status === 'unavailable') &&
      failedNetwork
    ) {
      return {
        ...networkConnectionBannerState,
        // Override with fresh data from selector
        networkClientId: failedNetwork.networkClientId,
        networkName: failedNetwork.networkName,
        chainId: failedNetwork.chainId,
        isInfuraEndpoint: failedNetwork.isInfuraEndpoint,
        infuraEndpointIndex: failedNetwork.infuraEndpointIndex,
        trackNetworkBannerEvent,
        switchToInfura,
      };
    }

    return {
      ...networkConnectionBannerState,
      trackNetworkBannerEvent,
      switchToInfura,
    };
  };
