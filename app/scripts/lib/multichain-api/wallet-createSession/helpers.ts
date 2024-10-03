import { Hex } from '@metamask/utils';
import {
  NetworkController,
  RpcEndpointType,
} from '@metamask/network-controller';
import { validateAddEthereumChainParams } from '../../rpc-method-middleware/handlers/ethereum-chain-utils';

export const validateAndAddEip3085 = async ({
  eip3085Params,
  addNetwork,
  findNetworkClientIdByChainId,
}: {
  eip3085Params: unknown;
  addNetwork: NetworkController['addNetwork'];
  findNetworkClientIdByChainId: NetworkController['findNetworkClientIdByChainId'];
}): Promise<undefined | Hex> => {
  const validParams = validateAddEthereumChainParams(eip3085Params);

  const {
    chainId,
    chainName,
    firstValidBlockExplorerUrl,
    firstValidRPCUrl,
    ticker,
  } = validParams;

  try {
    findNetworkClientIdByChainId(chainId as Hex);
    return undefined;
  } catch (err) {
    // noop
  }

  const networkConfiguration = await addNetwork({
    blockExplorerUrls: firstValidBlockExplorerUrl
      ? [firstValidBlockExplorerUrl]
      : [],
    defaultBlockExplorerUrlIndex: firstValidBlockExplorerUrl ? 0 : undefined,
    chainId: chainId as Hex,
    defaultRpcEndpointIndex: 0,
    name: chainName,
    nativeCurrency: ticker,
    rpcEndpoints: [
      {
        url: firstValidRPCUrl,
        name: chainName,
        type: RpcEndpointType.Custom,
      },
    ],
  });

  return networkConfiguration.chainId;
};
