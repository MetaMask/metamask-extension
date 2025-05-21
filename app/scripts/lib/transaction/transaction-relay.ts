import { AuthorizationList } from '@metamask/transaction-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { jsonRpcRequest } from '../../../../shared/modules/rpc.utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';

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
  Success = 'VALIDATED',
}

type RelayNetwork = {
  network: string;
  relayTransactions: boolean;
};

type RelayNetworkResponse = {
  [chainIdDecimal: string]: RelayNetwork;
};

const BASE_URL = 'https://tx-sentinel-{0}.api.cx.metamask.io/';
const ENDPOINT_NETWORKS = 'networks';

export const RELAY_RPC_METHOD = 'eth_sendRelayTransaction';

export async function submitRelayTransaction(
  request: RelaySubmitRequest,
): Promise<RelaySubmitResponse> {
  const { chainId } = request;

  const url = await getRelayUrl(chainId);

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

  const baseUrl = await getRelayUrl(chainId);

  if (!baseUrl) {
    throw new Error(`Chain not supported by transaction relay - ${chainId}`);
  }

  const url = `${baseUrl}smart-transactions/${uuid}`;

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

export async function isRelaySupported(chainId: Hex): Promise<boolean> {
  return Boolean(await getRelayUrl(chainId));
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

async function getRelayUrl(chainId: Hex): Promise<string | undefined> {
  const networkData = await getNetworkData();
  const chainIdDecimal = hexToDecimal(chainId);
  const network = networkData[chainIdDecimal];

  if (!network?.relayTransactions) {
    log('Chain is not supported', chainId);
    return undefined;
  }

  return buildUrl(network.network);
}

async function getNetworkData(): Promise<RelayNetworkResponse> {
  const url = `${buildUrl('ethereum-mainnet')}${ENDPOINT_NETWORKS}`;
  const response = await getFetchWithTimeout()(url);
  return response.json();
}

function buildUrl(subdomain: string): string {
  return BASE_URL.replace('{0}', subdomain);
}
