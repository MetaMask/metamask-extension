import { AuthorizationList } from '@metamask/transaction-controller';
import {
  SentinelSmartTransactionStatus,
  type SentinelRelaySubmitRequest,
  type SentinelRelaySubmitResponse,
  type SentinelSmartTransactionRequest,
} from '@metamask/sentinel-api-service';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  getSentinelApiMessenger,
  getSentinelNetworkFlags,
} from './sentinel-api';

const log = createProjectLogger('transaction-relay');

export const RelayStatus = {
  Pending: SentinelSmartTransactionStatus.Pending,
  Success: SentinelSmartTransactionStatus.Validated,
} as const;

export type RelaySubmitRequest = Omit<
  SentinelRelaySubmitRequest,
  'authorizationList'
> & {
  authorizationList?: AuthorizationList;
};

export type RelayWaitRequest = SentinelSmartTransactionRequest & {
  interval: number;
};

export type RelayWaitResponse = {
  transactionHash?: Hex;
  status: string;
};

export async function submitRelayTransaction(
  request: RelaySubmitRequest,
): Promise<SentinelRelaySubmitResponse> {
  const { chainId } = request;

  if (!(await isRelaySupported(chainId))) {
    throw new Error(`Chain not supported by transaction relay - ${chainId}`);
  }

  log('Request', request);

  const response = await getSentinelApiMessenger().call(
    'SentinelApiService:submitRelayTransaction',
    request as SentinelRelaySubmitRequest,
  );

  log('Response', response);

  return response;
}

export async function waitForRelayResult(
  request: RelayWaitRequest,
): Promise<RelayWaitResponse> {
  const { chainId, interval, uuid } = request;

  if (!(await isRelaySupported(chainId))) {
    throw new Error(`Chain not supported by transaction relay - ${chainId}`);
  }

  return new Promise<RelayWaitResponse>((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        const result = await pollResult(chainId, uuid);

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
  const networkData = await getSentinelNetworkFlags(chainId);

  if (!networkData?.relayTransactions) {
    log('Chain is not supported', chainId);
    return false;
  }

  return true;
}

async function pollResult(
  chainId: Hex,
  uuid: string,
): Promise<RelayWaitResponse> {
  log('Polling request', chainId, uuid);

  const { transactions } = await getSentinelApiMessenger().call(
    'SentinelApiService:getSmartTransaction',
    { chainId, uuid },
  );

  log('Polling response', transactions);

  const transaction = transactions[0];

  return {
    status: transaction?.status as string,
    transactionHash: transaction?.hash as Hex | undefined,
  };
}
