import providerFromEngine from 'eth-json-rpc-middleware/providerFromEngine';
import EthQuery from 'eth-query';
import { JsonRpcEngine } from 'json-rpc-engine';
import { cloneDeep } from 'lodash';
import { NETWORK_ID_TO_CHAIN_ID_MAP } from '../../../shared/constants/network';
import createJsonRpcClient from '../controllers/network/createJsonRpcClient';

const version = 53;

/**
 * 1. replace metamaskNetworkId with chainId in txmeta
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = await transformState(state);
    return versionedData;
  },
};

async function transformState(state = {}) {
  const rpcs = state.PreferencesController?.frequentRpcListDetail;
  const rpcNetIdToChainMap = { ...NETWORK_ID_TO_CHAIN_ID_MAP };
  if (rpcs && Array.isArray(rpcs)) {
    const queries = rpcs.map((rpc) => {
      const { networkMiddleware } = createJsonRpcClient({
        rpcUrl: rpc.rpcUrl,
        chainId: rpc.chainid,
      });
      const engine = new JsonRpcEngine();
      engine.push(networkMiddleware);
      const provider = providerFromEngine(engine);
      const ethQuery = new EthQuery(provider);
      return new Promise((resolve) => {
        ethQuery.sendAsync({ method: 'net_version' }, (err, networkVersion) => {
          if (!err) {
            return resolve({ chainId: rpc.chainId, networkVersion });
          }
          resolve({ chainId: rpc.chainId, networkVersion: undefined });
        });
      });
    });
    const results = await Promise.all(queries);
    results.forEach(({ chainId, networkVersion }) => {
      rpcNetIdToChainMap[networkVersion] = chainId;
    });
  }
  const transactions = state.TransactionController?.transactions;
  const incomingTransactions =
    state.IncomingTransactionsController?.incomingTransactions;
  console.log();

  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      const metamaskNetworkId = transaction?.metamaskNetworkId;
      if (metamaskNetworkId) {
        transaction.chainId = rpcNetIdToChainMap[metamaskNetworkId];
        delete transaction.metamaskNetworkId;
      }
    });
  }

  if (
    typeof incomingTransactions === 'object' &&
    incomingTransactions !== null &&
    Object.keys(incomingTransactions).length > 0
  ) {
    Object.keys(incomingTransactions).forEach((transactionHash) => {
      const transaction = incomingTransactions[transactionHash];
      const metamaskNetworkId = transaction?.metamaskNetworkId;
      if (metamaskNetworkId) {
        transaction.chainId = rpcNetIdToChainMap[metamaskNetworkId];
        delete transaction.metamaskNetworkId;
      }
      incomingTransactions[transactionHash] = transaction;
    });
  }
  return state;
}
