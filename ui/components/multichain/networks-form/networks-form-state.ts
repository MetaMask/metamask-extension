import { useState } from 'react';
import {
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import { hexToDecimal } from '../../../../shared/lib/conversion.utils';

/**
 * State backing the add/edit network form
 *
 * @param existingNetwork
 */
export const useNetworkFormState = (existingNetwork?: UpdateNetworkFields) => {
  const [name, setName] = useState<string>(existingNetwork?.name ?? '');
  const [chainId, setChainId] = useState<string>(
    existingNetwork ? hexToDecimal(existingNetwork.chainId) : '',
  );
  const [ticker, setTicker] = useState<string>(
    existingNetwork?.nativeCurrency ?? '',
  );

  const [rpcUrls, setRpcUrls] = useState<{
    rpcEndpoints: {
      name?: string;
      url: string;
      failoverUrls?: string[];
      type: RpcEndpointType;
    }[];
    defaultRpcEndpointIndex?: number;
  }>({
    rpcEndpoints: existingNetwork?.rpcEndpoints ?? [],
    defaultRpcEndpointIndex: existingNetwork?.defaultRpcEndpointIndex,
  });

  const [blockExplorers, setBlockExplorers] = useState<{
    blockExplorerUrls: string[];
    defaultBlockExplorerUrlIndex?: number;
  }>({
    blockExplorerUrls: existingNetwork?.blockExplorerUrls ?? [],
    defaultBlockExplorerUrlIndex: existingNetwork?.defaultBlockExplorerUrlIndex,
  });

  const existingNetworkChainId = existingNetwork?.chainId;
  const [prevExistingNetworkChainId, setPrevExistingNetworkChainId] = useState(
    existingNetworkChainId,
  );

  if (existingNetworkChainId !== prevExistingNetworkChainId) {
    setPrevExistingNetworkChainId(existingNetworkChainId);
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
  }

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
