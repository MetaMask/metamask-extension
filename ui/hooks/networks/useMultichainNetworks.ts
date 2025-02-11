import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type CaipChainId, toCaipChainId } from '@metamask/utils';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';

import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import { getMultichainNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/multichainNetworks';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';


export const useMultichainNetworks = (): [Record<string, MultichainNetworkConfiguration>, (chainId: CaipChainId) => any] => {
  const allNonEvmNetworks = useSelector(getMultichainNetworkConfigurationsByChainId);
  const evmNetworkConfigs = useSelector(getNetworkConfigurationsByChainId);

  const allEvmNetworks = useMemo(() => {
    const networks: Record<CaipChainId, any> = {};
    Object.values(evmNetworkConfigs).forEach((chainConfig) => {
      const chainId = toCaipChainId('eip155', hexToDecimal(chainConfig.chainId));
      networks[chainId] = {
        chainId,
        name: chainConfig.name,
        isEvm: true,
        nativeCurrency: chainConfig.nativeCurrency,
        rpcEndpoints: {},
        BlockExplorers: {
          urls: chainConfig.blockExplorerUrls,
          defaultIndex: chainConfig.defaultBlockExplorerUrlIndex,
        },
      };
    });
    return networks;
  }, [evmNetworkConfigs]);

  const allNetworks = useMemo(() => {
    return {
      ...allEvmNetworks,
      ...allNonEvmNetworks,
    };
  }, [allNonEvmNetworks, allEvmNetworks]);

  const getChainConfigByChainId = (chainId: CaipChainId) => allNetworks[chainId];

  console.log({ allNetworks });
  return [allNetworks, getChainConfigByChainId] as const;
};