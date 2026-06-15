import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { isHexString } from 'ethereumjs-util';
import { Hex } from '@metamask/utils';
import { NetworkStatus } from '@metamask/network-controller';

import {
  getNetworkConfigurationsByChainId,
  getNetworksMetadata,
} from '../../../../../shared/lib/selectors/networks';
import { setEditedNetwork } from '../../../../store/actions';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { useSendContext } from '../../context/send';

export const useUnreliableNetworkRpc = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chainId } = useSendContext();
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const networksMetadata = useSelector(getNetworksMetadata);

  const { isUnreliable, networkName } = useMemo(() => {
    if (!chainId || !isHexString(chainId)) {
      return { isUnreliable: false, networkName: undefined };
    }
    const networkConfiguration = networkConfigurationsByChainId[chainId as Hex];
    if (!networkConfiguration) {
      return { isUnreliable: false, networkName: undefined };
    }
    const { rpcEndpoints, defaultRpcEndpointIndex, name } =
      networkConfiguration;
    const rpcEndpoint = rpcEndpoints[defaultRpcEndpointIndex];
    if (!rpcEndpoint) {
      return { isUnreliable: false, networkName: name };
    }
    const status = networksMetadata[rpcEndpoint.networkClientId]?.status;
    return {
      isUnreliable: status !== undefined && status !== NetworkStatus.Available,
      networkName: name,
    };
  }, [chainId, networkConfigurationsByChainId, networksMetadata]);

  const navigateToEditNetwork = useCallback(() => {
    if (!chainId || !isHexString(chainId)) {
      return;
    }
    dispatch(
      setEditedNetwork({
        chainId,
        trackRpcUpdateFromBanner: true,
      }),
    );
    navigate(NETWORKS_ROUTE);
  }, [chainId, dispatch, navigate]);

  return {
    isUnreliable,
    networkName,
    navigateToEditNetwork,
  };
};
