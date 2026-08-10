import { useCallback } from 'react';
import { UpdateNetworkFields } from '@metamask/network-controller';
import { hideModal, addNetwork } from '../../../../store/actions';
import { useDispatch } from '../../../../store/hooks';

export const useAdditionalNetworkHandlers = () => {
  const dispatch = useDispatch();

  // Memoize the additional network click handler
  const handleAdditionalNetworkClick = useCallback(
    async (network: UpdateNetworkFields) => {
      await dispatch(hideModal());

      // setActive: false + enableNetwork: true adds and enables this network
      // without disabling every other currently-enabled network, which is
      // NetworkEnablementController#onAddNetwork's default side effect for
      // any non-popular (e.g. Base Enablement) network.
      await dispatch(
        addNetwork(network, { setActive: false, enableNetwork: true }),
      );
    },
    [dispatch],
  );

  return {
    handleAdditionalNetworkClick,
  };
};
