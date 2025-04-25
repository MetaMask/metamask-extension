import { AuthorizationList, CHAIN_IDS } from '@metamask/transaction-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { jsonRpcRequest } from '../../../../shared/modules/rpc.utils';

const log = createProjectLogger('transaction-relay');

export type RelaySubmitRequest = {
  authorizationList?: AuthorizationList;
  chainId: Hex;
  data: Hex;
  to: Hex;
};

export type RelaySubmitResponse = {
  transactionHash: Hex;
};

export const RELAY_RPC_METHOD = 'eth_sendRelayTransaction';

const RELAY_URL_BY_CHAIN_ID = {
  [CHAIN_IDS.MAINNET]:
    'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io',
  [CHAIN_IDS.BSC]: 'https://tx-sentinel-bsc-mainnet.api.cx.metamask.io',
  [CHAIN_IDS.BASE]: 'https://tx-sentinel-base-mainnet.api.cx.metamask.io',
  [CHAIN_IDS.SEPOLIA]:
    'https://tx-sentinel-ethereum-sepolia.api.cx.metamask.io',
};

type SupportedChainId = keyof typeof RELAY_URL_BY_CHAIN_ID;

export async function submitRelayTransaction(
  request: RelaySubmitRequest,
): Promise<RelaySubmitResponse> {
  const { chainId } = request;

  const url =
    process.env.TRANSACTION_RELAY_API_URL ??
    RELAY_URL_BY_CHAIN_ID[chainId as SupportedChainId];

  if (!url) {
    throw new Error(`Chain not supported by transaction relay - ${chainId}`);
  }

  log('Request', url, request);

  const response = (await jsonRpcRequest(url, RELAY_RPC_METHOD, [
    request,
  ])) as RelaySubmitResponse;

  log('Response', response);

  return response;
}
