import { useEffect, useState } from 'react';
import {
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';

/**
 * State backing the add/edit network form
 *
 * @param existingNetwork
 */
export const useNetworkFormState = (existingNetwork?: UpdateNetworkFields) => {
  const [name, setName] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [ticker, setTicker] = useState<string>('');

  const [rpcUrls, setRpcUrls] = useState<{
    rpcEndpoints: {
      name?: string;
      url: string;
      failoverUrls?: string[];
      type: RpcEndpointType;
    }[];
    defaultRpcEndpointIndex?: number;
  }>({
    rpcEndpoints: [],
    defaultRpcEndpointIndex: undefined,
  });

  const [blockExplorers, setBlockExplorers] = useState<{
    blockExplorerUrls: string[];
    defaultBlockExplorerUrlIndex?: number;
  }>({
    blockExplorerUrls: [],
    defaultBlockExplorerUrlIndex: undefined,
  });

  useEffect(() => {
    setName(existingNetwork?.name ?? '');
    setChainId(existingNetwork ? hexToDecimal(existingNetwork.chainId) : '');
    setTicker(existingNetwork?.nativeCurrency ?? '');
    setRpcUrls({
      rpcEndpoints: existingNetwork?.rpcEndpoints ?? [],
      defaultRpcEndpointIndex: existingNetwork?.defaultRpcEndpointIndex,
    });

    setBlockExplorers({
      blockExplorerUrls: existingNetwork?.blockExplorerUrls ?? [],
      defaultBlockExplorerUrlIndex:
        existingNetwork?.defaultBlockExplorerUrlIndex,
    });
  }, [existingNetwork?.chainId]);

  return {
    name,
    setName,
    chainId,
    setChainId,
    ticker,
    setTicker,
    rpcUrls,
    setRpcUrls,
    blockExplorers,
    setBlockExplorers,
    clear: () => {
      setName('');
      setChainId('');
      setTicker('');
      setRpcUrls({
        rpcEndpoints: [],
        defaultRpcEndpointIndex: undefined,
      });
      setBlockExplorers({
        blockExplorerUrls: [],
        defaultBlockExplorerUrlIndex: undefined,
      });
    },
  };
};
