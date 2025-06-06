import { ApprovalType } from '@metamask/controller-utils';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
import { MetaMetricsNetworkEventSource } from '../../../../../shared/constants/metametrics';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import {
  hideModal,
  requestUserApproval,
} from '../../../../store/actions';

export const useAdditionalNetworkHandlers = () => {
  const dispatch = useDispatch();

  // Memoize the additional network click handler
  const handleAdditionalNetworkClick = useCallback(
    async (network: any) => {
      dispatch(hideModal());
      await dispatch(
        requestUserApproval({
          origin: ORIGIN_METAMASK,
          type: ApprovalType.AddEthereumChain,
          requestData: {
            chainId: network.chainId,
            rpcUrl: network.rpcEndpoints[network.defaultRpcEndpointIndex].url,
            failoverRpcUrls:
              network.rpcEndpoints[network.defaultRpcEndpointIndex]
                .failoverUrls,
            ticker: network.nativeCurrency,
            rpcPrefs: {
              blockExplorerUrl:
                network.defaultBlockExplorerUrlIndex === undefined
                  ? undefined
                  : network.blockExplorerUrls[
                      network.defaultBlockExplorerUrlIndex
                    ],
            },
            imageUrl:
              CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
              ],
            chainName: network.name,
            referrer: ORIGIN_METAMASK,
            source: MetaMetricsNetworkEventSource.NewAddNetworkFlow,
          },
        }),
      );
    },
    [dispatch],
  );

  return {
    handleAdditionalNetworkClick,
  };
};