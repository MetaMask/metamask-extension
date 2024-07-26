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
  const [name, setName] = useState<string>();
  const [chainId, setChainId] = useState<string>();
  const [ticker, setTicker] = useState<string>();

  const [rpcUrls, setRpcUrls] = useState<{
    rpcEndpoints?: { name?: string; url: string; type: RpcEndpointType }[];
    defaultRpcEndpointIndex?: number;
  }>({});

  const [blockExplorers, setBlockExplorers] = useState<{
    blockExplorerUrls?: string[];
    defaultBlockExplorerUrlIndex?: number;
  }>({});

  useEffect(() => {
    setName(existingNetwork?.name);
    setChainId(
      existingNetwork ? hexToDecimal(existingNetwork.chainId) : undefined,
    );
    setTicker(existingNetwork?.nativeCurrency);
    setRpcUrls({
      rpcEndpoints: existingNetwork?.rpcEndpoints ?? [],
      defaultRpcEndpointIndex: existingNetwork?.defaultRpcEndpointIndex,
    });

    setBlockExplorers({
      blockExplorerUrls: existingNetwork?.blockExplorerUrls ?? [],
      defaultBlockExplorerUrlIndex:
        existingNetwork?.defaultBlockExplorerUrlIndex,
    });
    // Set initial state only on chain switch
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
  };
};
