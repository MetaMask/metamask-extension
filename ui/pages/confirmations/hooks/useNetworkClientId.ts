import { CaipChainId } from '@metamask/utils';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { getRpcDataByChainId } from '../../../../shared/modules/network.utils';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors';

export function useNetworkClientId() {
  const multichainNetworkConfigurations = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const evmNetworks = multichainNetworkConfigurations[1];

  const getNetworkClientIdForChainId = useCallback(
    (chainId: CaipChainId) => {
      const { defaultRpcEndpoint } = getRpcDataByChainId(chainId, evmNetworks);
      const { networkClientId } = defaultRpcEndpoint;
      return networkClientId;
    },
    [evmNetworks],
  );

  return { getNetworkClientIdForChainId };
}
