import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ApprovalType } from '@metamask/controller-utils';
import { UpdateNetworkFields } from '@metamask/network-controller';
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
import { MetaMetricsNetworkEventSource } from '../../../../../shared/constants/metametrics';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import {
  hideModal,
  requestUserApproval,
  setActiveNetwork,
  setEnabledNetworks,
} from '../../../../store/actions';
import { getEnabledNetworks } from '../../../../selectors';
import { useAccountCreationOnNetworkChange } from '../../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { CaipChainId } from '@metamask/utils';

export const useAdditionalNetworkHandlers = () => {
  const enabledNetworks = useSelector(getEnabledNetworks);
  const dispatch = useDispatch();
  const { hasAnyAccountsInNetwork } = useAccountCreationOnNetworkChange();

  const handleNonEvmNetworkChange = useCallback(
    async (chainId: CaipChainId) => {
      if (hasAnyAccountsInNetwork(chainId)) {
        dispatch(setActiveNetwork(chainId));
        return;
      }
      // Note: The setSelectedNonEvmNetwork state setter was removed in a previous change
      // so we don't need to include it in the dependencies
    },
    [dispatch, hasAnyAccountsInNetwork],
  );

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
      const enabledNetworksArray = Object.keys(enabledNetworks);
      await dispatch(
        setEnabledNetworks([...enabledNetworksArray, network.chainId]),
      );
    },
    [dispatch, enabledNetworks],
  );

  return {
    handleAdditionalNetworkClick,
  };
};
