import {
  createScaffoldMiddleware,
  mergeMiddleware,
} from '@metamask/json-rpc-engine';
import { createWalletMiddleware } from '@metamask/eth-json-rpc-middleware';
import {
  createPendingNonceMiddleware,
  createPendingTxMiddleware,
} from './middleware/pending';

export default function createMetamaskMiddleware({
  version,
  getAccounts,
  getCallsStatus,
  getCapabilities,
  processTransaction,
  processTypedMessage,
  processTypedMessageV3,
  processTypedMessageV4,
  processPersonalMessage,
  processDecryptMessage,
  processEncryptionPublicKey,
  processSendCalls,
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
      getCallsStatus,
      getCapabilities,
      processTransaction,
      processTypedMessage,
      processTypedMessageV3,
      processTypedMessageV4,
      processPersonalMessage,
      processDecryptMessage,
      processEncryptionPublicKey,
      processSendCalls,
    }),
    createPendingNonceMiddleware({ getPendingNonce }),
    createPendingTxMiddleware({ getPendingTransactionByHash }),
  ]);
  return metamaskMiddleware;
}
