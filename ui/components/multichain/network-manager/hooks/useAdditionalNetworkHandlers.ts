import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { UpdateNetworkFields } from '@metamask/network-controller';
import { hideModal, addNetwork } from '../../../../store/actions';

export const useAdditionalNetworkHandlers = () => {
  const dispatch = useDispatch();

  // Memoize the additional network click handler
  const handleAdditionalNetworkClick = useCallback(
    async (network: UpdateNetworkFields) => {
      await dispatch(hideModal());

      // First add the network to user's configuration
      await dispatch(addNetwork(network));
    },
    [dispatch],
  );

  return {
    handleAdditionalNetworkClick,
  };
};
