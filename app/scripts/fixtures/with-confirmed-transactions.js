import { v4 as uuidv4 } from 'uuid';
import { CHAIN_IDS } from '../../../shared/constants/network';

/**
 * Generates a specified number of confirmed transactions for each network.
 *
 * @param {string} from - The address from which the transactions are sent.
 * @param {number} numEntries - The number of transactions to generate for each network.
 * @returns {object} The generated transactions object.
 */
export const withConfirmedTransactions = (from, numEntries) => {
  const networks = [CHAIN_IDS.MAINNET, CHAIN_IDS.SEPOLIA];
  const transactions = {};

  networks.forEach((network) => {
    for (let i = 0; i < numEntries; i++) {
      const id = uuidv4();
      const transaction = {
        chainId: network,
        dappSuggestedGasFees: {
          gas: '0x5208',
          maxFeePerGas: '0x59682f0c',
          maxPriorityFeePerGas: '0x59682f00',
        },
        history: [
          {
            chainId: network,
            dappSuggestedGasFees: {
              gas: '0x5208',
              maxFeePerGas: '0x59682f0c',
              maxPriorityFeePerGas: '0x59682f00',
            },
            id,
            loadingDefaults: true,
            origin: 'https://metamask.github.io',
            status: 'confirmed',
            time: Date.now(),
            txParams: {
              from,
              gas: '0x5208',
              maxFeePerGas: '0x59682f0c',
              maxPriorityFeePerGas: '0x59682f00',
              to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
              value: '0x29a2241af62c0000',
            },
            type: 'simpleSend',
          },
          [
            {
              note: 'Added new confirmed transaction.',
              op: 'replace',
              path: '/loadingDefaults',
              timestamp: Date.now(),
              value: false,
            },
            {
              op: 'add',
              path: '/simulationData',
              value: {
                error: {
                  code: 'disabled',
                  message: 'Simulation disabled',
                },
                tokenBalanceChanges: [],
              },
              note: 'TransactionController#updateSimulationData - Update simulation data',
              timestamp: Date.now(),
            },
          ],
        ],
        simulationData: {
          error: {
            code: 'disabled',
            message: 'Simulation disabled',
          },
          tokenBalanceChanges: [],
        },
        id,
        loadingDefaults: false,
        origin: 'https://metamask.github.io',
        status: 'confirmed',
        time: Date.now(),
        txParams: {
          from,
          gas: '0x5208',
          maxFeePerGas: '0x59682f0c',
          maxPriorityFeePerGas: '0x59682f00',
          to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
          value: '0x29a2241af62c0000',
        },
        type: 'simpleSend',
      };

      transactions[id] = transaction;
    }
  });

  return { transactions };
};
