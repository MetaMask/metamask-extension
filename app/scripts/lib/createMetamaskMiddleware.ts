import { createWalletMiddleware } from '@metamask/eth-json-rpc-middleware';
import { createScaffoldMiddleware } from '@metamask/json-rpc-engine/v2';

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
}: Options) {
  return [
    /* eslint-disable @typescript-eslint/naming-convention */
    createScaffoldMiddleware({
      eth_syncing: false,
      web3_clientVersion: `MetaMask/v${version}`,
    }),
    /* eslint-enable @typescript-eslint/naming-convention */
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
    }),
    createPendingNonceMiddleware({ getPendingNonce }),
    createPendingTxMiddleware({ getPendingTransactionByHash }),
  ];
}
