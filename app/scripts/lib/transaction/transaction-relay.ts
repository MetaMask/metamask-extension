import { AuthorizationList } from '@metamask/transaction-controller';
import { type SentinelMeta } from '@metamask/smart-transactions-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  SentinelChainNotSupportedError,
  type SentinelApiServiceGetNetworksAction,
  type SentinelApiServiceGetRelayStatusAction,
  type SentinelApiServiceSubmitRelayTransactionAction,
  type SentinelRelaySubmitRequest,
} from '@metamask/sentinel-api-service';

const log = createProjectLogger('transaction-relay');

/**
 * Minimal messenger able to call the SentinelApiService relay and registry
 * actions. Declared structurally so any restricted messenger with those actions
 * delegated (or the base controller messenger) can be threaded to these
 * helpers.
 */
export type SentinelRelayMessenger = {
  call(
    action: SentinelApiServiceGetNetworksAction['type'],
    ...args: Parameters<SentinelApiServiceGetNetworksAction['handler']>
  ): ReturnType<SentinelApiServiceGetNetworksAction['handler']>;
  call(
    action: SentinelApiServiceSubmitRelayTransactionAction['type'],
    ...args: Parameters<
      SentinelApiServiceSubmitRelayTransactionAction['handler']
    >
  ): ReturnType<SentinelApiServiceSubmitRelayTransactionAction['handler']>;
  call(
    action: SentinelApiServiceGetRelayStatusAction['type'],
    ...args: Parameters<SentinelApiServiceGetRelayStatusAction['handler']>
  ): ReturnType<SentinelApiServiceGetRelayStatusAction['handler']>;
};

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
  messenger: SentinelRelayMessenger,
  request: RelaySubmitRequest,
): Promise<RelaySubmitResponse> {
  log('Request', request);

  try {
    const response = await messenger.call(
      'SentinelApiService:submitRelayTransaction',
      request as unknown as SentinelRelaySubmitRequest,
    );

    log('Response', response);

    return response;
  } catch (error) {
    throw normalizeChainNotSupportedError(error, request.chainId);
  }
}

export async function waitForRelayResult(
  messenger: SentinelRelayMessenger,
  request: RelayWaitRequest,
): Promise<RelayWaitResponse> {
  const { chainId, interval, uuid } = request;

  return new Promise<RelayWaitResponse>((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        log('Polling request', chainId, uuid);

        const result = await messenger.call(
          'SentinelApiService:getRelayStatus',
          { chainId, uuid },
        );

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

export async function isRelaySupported(
  messenger: SentinelRelayMessenger,
  chainId: Hex,
): Promise<boolean> {
  const networkData = await messenger
    .call('SentinelApiService:getNetworks')
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
