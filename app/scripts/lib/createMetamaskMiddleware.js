import { createScaffoldMiddleware, mergeMiddleware } from 'json-rpc-engine';
import { createWalletMiddleware } from 'eth-json-rpc-middleware';
import {
  createPendingNonceMiddleware,
  createPendingTxMiddleware,
} from './middleware/pending';
import { createGetPlumeSignatureMiddleware } from './middleware/plume';

export default function createMetamaskMiddleware({
  version,
  getAccounts,
  processTransaction,
  processEthSignMessage,
  processTypedMessage,
  processTypedMessageV3,
  processTypedMessageV4,
  processPersonalMessage,
  processDecryptMessage,
  processEncryptionPublicKey,
  processGetPlumeSignature,
  getPendingNonce,
  getPendingTransactionByHash,
}) {
  const metamaskMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      eth_syncing: false,
      web3_clientVersion: `MetaMask/v${version}`,
    }),
    createWalletMiddleware({
      getAccounts,
      processTransaction,
      processEthSignMessage,
      processTypedMessage,
      processTypedMessageV3,
      processTypedMessageV4,
      processPersonalMessage,
      processDecryptMessage,
      processEncryptionPublicKey,
    }),
    createPendingNonceMiddleware({ getPendingNonce }),
    createPendingTxMiddleware({ getPendingTransactionByHash }),
    createGetPlumeSignatureMiddleware({ processGetPlumeSignature }),
  ]);
  return metamaskMiddleware;
}
