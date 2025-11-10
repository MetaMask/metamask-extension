import { createWalletMiddleware } from '@metamask/eth-json-rpc-middleware';
import {
  asLegacyMiddleware,
  createScaffoldMiddleware,
  JsonRpcEngineV2,
} from '@metamask/json-rpc-engine/v2';

import {
  createPendingNonceMiddleware,
  createPendingTxMiddleware,
} from './middleware/pending';

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
}) {
  const engine = JsonRpcEngineV2.create({
    middleware: [
      createScaffoldMiddleware({
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
      }),
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
    ],
  });
  return asLegacyMiddleware(engine);
}
