import { AuthorizationList } from '@metamask/transaction-controller';
import { type SentinelMeta } from '@metamask/smart-transactions-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import { getSentinelApiService } from './sentinel-api-service';
import {
  SentinelChainNotSupportedError,
  type SentinelRelaySubmitRequest,
} from '@metamask/sentinel-api-service';

const log = createProjectLogger('transaction-relay');

export type RelaySubmitRequest = {
  authorizationList?: AuthorizationList;
  chainId: Hex;
  data: Hex;
  to: Hex;
  metadata?: SentinelMeta;
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

export const RELAY_RPC_METHOD = 'eth_sendRelayTransaction';

export async function submitRelayTransaction(
  request: RelaySubmitRequest,
): Promise<RelaySubmitResponse> {
  log('Request', request);

  try {
    const response = await getSentinelApiService().submitRelayTransaction(
      request as unknown as SentinelRelaySubmitRequest,
    );

    log('Response', response);

    return response;
  } catch (error) {
    throw normalizeChainNotSupportedError(error, request.chainId);
  }
}

export async function waitForRelayResult(
  request: RelayWaitRequest,
): Promise<RelayWaitResponse> {
  const { chainId, interval, uuid } = request;

  const service = getSentinelApiService();

  return new Promise<RelayWaitResponse>((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        log('Polling request', chainId, uuid);

        const result = await service.getRelayStatus({ chainId, uuid });

        log('Polling response', result);

        if (result.status !== RelayStatus.Pending) {
          clearInterval(intervalId);
          resolve(result);
        }
      } catch (error) {
        clearInterval(intervalId);
        reject(normalizeChainNotSupportedError(error, chainId));
      }
    }, interval);
  });
}

export async function isRelaySupported(chainId: Hex): Promise<boolean> {
  const networkData = await getSentinelApiService()
    .getNetworks()
    .catch(() => undefined);

  return Boolean(
    networkData?.[BigInt(chainId).toString(10)]?.relayTransactions,
  );
}

/**
 * Converts a {@link SentinelChainNotSupportedError} thrown by the shared service
 * back into the historical relay error, preserving the previous public error
 * message. Other errors are returned unchanged.
 *
 * @param error - The error thrown by the Sentinel service.
 * @param chainId - The chain ID the request targeted.
 * @returns The error to surface to callers.
 */
function normalizeChainNotSupportedError(
  error: unknown,
  chainId: Hex,
): unknown {
  if (error instanceof SentinelChainNotSupportedError) {
    return new Error(`Chain not supported by transaction relay - ${chainId}`);
  }

  return error;
}
