import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { UpdateNetworkFields } from '@metamask/network-controller';
import { hideModal, addNetwork } from '../../../../store/actions';
import { enableSingleNetwork } from '../../../../store/controller-actions/network-order-controller';

export const useAdditionalNetworkHandlers = () => {
  const dispatch = useDispatch();

  // Memoize the additional network click handler
  const handleAdditionalNetworkClick = useCallback(
    async (network: UpdateNetworkFields) => {
      await dispatch(hideModal());

      // First add the network to user's configuration
      await dispatch(addNetwork(network));

      // Then enable it in the network list
      await dispatch(enableSingleNetwork(network.chainId));
    },
    [dispatch],
  );

  return {
    handleAdditionalNetworkClick,
  };
};
