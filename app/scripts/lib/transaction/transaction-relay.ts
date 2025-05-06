import { AuthorizationList, CHAIN_IDS } from '@metamask/transaction-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { jsonRpcRequest } from '../../../../shared/modules/rpc.utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';

const log = createProjectLogger('transaction-relay');

export type RelaySubmitRequest = {
  authorizationList?: AuthorizationList;
  chainId: Hex;
  data: Hex;
  to: Hex;
};

export type RelayWaitRequest = {
  chainId: Hex;
  interval: number;
  uuid: string;
};

export type RelaySubmitResponse = {
  uuid: string;
};

export type RelayWaitResponse = {
  transactionHash?: Hex;
  status: string;
};

export enum RelayStatus {
  Pending = 'PENDING',
  Success = 'SUCCESS',
}

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

export async function waitForRelayResult(
  request: RelayWaitRequest,
): Promise<RelayWaitResponse> {
  const { chainId, interval, uuid } = request;

  const baseUrl =
    process.env.TRANSACTION_RELAY_API_URL ??
    RELAY_URL_BY_CHAIN_ID[chainId as SupportedChainId];

  if (!baseUrl) {
    throw new Error(`Chain not supported by transaction relay - ${chainId}`);
  }

  const url = `${baseUrl}/smart-transactions/${uuid}`;

  return new Promise<RelayWaitResponse>((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        const result = await pollResult(url);

        if (result.status !== RelayStatus.Pending) {
          clearInterval(intervalId);
          resolve(result);
        }
      } catch (error) {
        clearInterval(intervalId);
        reject(error);
      }
    }, interval);
  });
}

async function pollResult(url: string): Promise<RelayWaitResponse> {
  log('Polling request', url);

  const response = await getFetchWithTimeout()(url);

  log('Polling response', response);

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Failed to fetch relay transaction status: ${response.status} - ${errorBody}`,
    );
  }

  const data = await response.json();
  const transaction = data?.transactions[0];
  const { hash: transactionHash, status } = transaction || {};

  return {
    status,
    transactionHash,
  };
}
