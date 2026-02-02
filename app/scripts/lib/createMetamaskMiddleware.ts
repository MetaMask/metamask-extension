import { createWalletMiddleware } from '@metamask/eth-json-rpc-middleware';
import {
  asLegacyMiddleware,
  createScaffoldMiddleware,
  JsonRpcEngineV2,
  type Middleware,
} from '@metamask/json-rpc-engine/v2';
import { rpcErrors } from '@metamask/rpc-errors';
import type { Json, JsonRpcParams } from '@metamask/utils';

import {
  createPendingNonceMiddleware,
  createPendingTxMiddleware,
  type GetPendingNonce,
  type GetPendingTransactionByHash,
} from './middleware/pending';

type Options = Parameters<typeof createWalletMiddleware>[0] & {
  version: string;
  getPendingNonce: GetPendingNonce;
  getPendingTransactionByHash: GetPendingTransactionByHash;
};

/**
 * Creates a middleware wrapper that catches errors and ensures requests are properly terminated.
 * This prevents "Nothing ended request" errors when middleware throws exceptions.
 *
 * @param middleware - The middleware to wrap with error handling
 * @returns A wrapped middleware with error handling
 */
function createErrorHandlingWrapper(
  middleware: Middleware<JsonRpcParams, Json>,
): Middleware<JsonRpcParams, Json> {
  return async (args) => {
    try {
      return await middleware(args);
    } catch (error) {
      // If the error is already a proper RPC error, throw it as-is
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      // Convert unknown errors to proper JSON-RPC errors
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw rpcErrors.internal({
        message,
        data: { originalError: String(error) },
      });
    }
  };
}

export default function createMetamaskMiddleware({
  version,
  getAccounts,
  processTransaction,
  processTypedMessage,
  processTypedMessageV3,
  processTypedMessageV4,
  processPersonalMessage,
  processDecryptMessage,
  processEncryptionPublicKey,
  getPendingNonce,
  getPendingTransactionByHash,
  processRequestExecutionPermissions,
  processGetSupportedExecutionPermissions,
  processGetGrantedExecutionPermissions,
}: Options) {
  const engine = JsonRpcEngineV2.create({
    middleware: [
      /* eslint-disable @typescript-eslint/naming-convention */
      createScaffoldMiddleware({
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
      }),
      /* eslint-enable @typescript-eslint/naming-convention */
      createErrorHandlingWrapper(
        createWalletMiddleware({
          getAccounts,
          processTransaction,
          processTypedMessage,
          processTypedMessageV3,
          processTypedMessageV4,
          processPersonalMessage,
          processDecryptMessage,
          processEncryptionPublicKey,
          processRequestExecutionPermissions,
          processGetSupportedExecutionPermissions,
          processGetGrantedExecutionPermissions,
        }),
      ),
      createPendingNonceMiddleware({ getPendingNonce }),
      createPendingTxMiddleware({ getPendingTransactionByHash }),
    ],
  });
  return asLegacyMiddleware(engine);
}
