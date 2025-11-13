import type {
  JsonRpcMiddleware,
  JsonRpcRequest,
} from '@metamask/json-rpc-engine/v2';
import type { TransactionMeta } from '@metamask/transaction-controller';

import { formatTxMetaForRpcResult } from '../util';

export type GetPendingNonce = (
  address: string,
  networkClientId: string,
) => Promise<number>;

type PendingNonceMiddlewareOptions = {
  getPendingNonce: GetPendingNonce;
};

/**
 * Middleware to get the pending nonce for a given address,
 * implementing the `eth_getTransactionCount` RPC method.
 *
 * @param options - The options for the middleware.
 * @param options.getPendingNonce - Function to get the pending nonce for a given address.
 * @returns A middleware function to get the pending nonce for a given address.
 */
export function createPendingNonceMiddleware({
  getPendingNonce,
}: PendingNonceMiddlewareOptions): JsonRpcMiddleware<JsonRpcRequest> {
  return async ({ request, context, next }) => {
    const { method, params } = request;
    if (method !== 'eth_getTransactionCount') {
      return next();
    }

    const [address, blockRef] = params as string[];
    if (blockRef !== 'pending') {
      return next();
    }
    return await getPendingNonce(
      address,
      context.get('networkClientId') as string,
    );
  };
}

export type GetPendingTransactionByHash = (
  hash: string,
) => TransactionMeta | undefined;

type PendingTxMiddlewareOptions = {
  getPendingTransactionByHash: GetPendingTransactionByHash;
};

/**
 * Middleware to get the pending transaction by hash,
 * implementing the `eth_getTransactionByHash` RPC method.
 *
 * @param options - The options for the middleware.
 * @param options.getPendingTransactionByHash - Function to get the pending transaction by hash.
 * @returns A middleware function to get the pending transaction by hash.
 */
export function createPendingTxMiddleware({
  getPendingTransactionByHash,
}: PendingTxMiddlewareOptions): JsonRpcMiddleware<JsonRpcRequest> {
  return async ({ request, next }) => {
    const { method, params } = request;
    if (method !== 'eth_getTransactionByHash') {
      return next();
    }

    const [hash] = params as string[];
    const txMeta = getPendingTransactionByHash(hash);
    if (!txMeta) {
      return next();
    }
    return formatTxMetaForRpcResult(txMeta);
  };
}
