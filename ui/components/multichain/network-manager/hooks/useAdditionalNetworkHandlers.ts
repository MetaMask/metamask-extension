import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateNetworkFields } from '@metamask/network-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { parseCaipChainId } from '@metamask/utils';
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
import { MetaMetricsNetworkEventSource } from '../../../../../shared/constants/metametrics';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_NETWORK_CHAIN_IDS,
} from '../../../../../shared/constants/network';
import {
  hideModal,
  requestUserApproval,
  setEnabledNetworks,
} from '../../../../store/actions';
import {
  getEnabledNetworksByNamespace,
  getSelectedMultichainNetworkChainId,
} from '../../../../selectors/multichain/networks';

export const useAdditionalNetworkHandlers = () => {
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const dispatch = useDispatch();
  const currentMultichainChainId = useSelector(
    getSelectedMultichainNetworkChainId,
  );
  const { namespace } = parseCaipChainId(currentMultichainChainId);

  // Memoize the additional network click handler
  const handleAdditionalNetworkClick = useCallback(
    async (network: UpdateNetworkFields) => {
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
      const enabledNetworksArray = Object.keys(enabledNetworksByNamespace);
      const filteredPopularNetworks = enabledNetworksArray.filter((key) =>
        FEATURED_NETWORK_CHAIN_IDS.includes(key as `0x${string}`),
      );
      await dispatch(
        setEnabledNetworks(
          [...filteredPopularNetworks, network.chainId],
          namespace,
        ),
      );
    },
    [dispatch, enabledNetworksByNamespace, namespace],
  );

  return {
    handleAdditionalNetworkClick,
  };
};
