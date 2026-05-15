import {
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { addNetwork } from '../../../store/actions';
import { MetaMaskReduxDispatch } from '../../../store/store';

export const useEnsureNetworkEnabled = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  return useCallback(
    async (chainId: string) => {
      if (isNonEvmChainId(chainId)) {
        // Non-EVM networks are always enabled.
        return;
      }

      const hexChainId = formatChainIdToHex(chainId);

      if (networkConfigurationsByChainId[hexChainId]) {
        // Network is already enabled.
        return;
      }

      const networkConfig = FEATURED_RPCS.find(
        (rpc) => rpc.chainId === hexChainId,
      );

      if (!networkConfig) {
        // Trying to enable a network that does not exist in configuration.
        return;
      }

      await dispatch(addNetwork(networkConfig));
    },
    [networkConfigurationsByChainId, dispatch],
  );
};
