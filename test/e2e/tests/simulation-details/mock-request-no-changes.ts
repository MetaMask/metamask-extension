import { MockRequestResponse, SENDER_ADDRESS_MOCK } from './types';

export const NO_CHANGES_TRANSACTION_MOCK = {
  from: SENDER_ADDRESS_MOCK,
  maxFeePerGas: '0x0',
  maxPriorityFeePerGas: '0x0',
  to: SENDER_ADDRESS_MOCK,
  value: '0x38d7ea4c68000',
};

export const NO_CHANGES_REQUEST_MOCK: MockRequestResponse = {
  request: {
    id: '0',
    jsonrpc: '2.0',
    method: 'infura_simulateTransactions',
    params: [
      {
        transactions: [NO_CHANGES_TRANSACTION_MOCK],
        withCallTrace: true,
        withLogs: true,
      },
    ],
  },
  response: {
    jsonrpc: '2.0',
    result: {
      transactions: [
        {
          return: '0x',
          status: '0x1',
          gasUsed: '0x5208',
          gasLimit: '0x5208',
          fees: [
            {
              maxFeePerGas: '0x0',
              maxPriorityFeePerGas: '0x0',
              balanceNeeded: '0x38d7ea4c68000',
              currentBalance: '0x3185e67a46d9066',
              error: '',
            },
          ],
          stateDiff: {
            post: {
              [SENDER_ADDRESS_MOCK]: {
                nonce: '0x3c0',
              },
            },
            pre: {
              [SENDER_ADDRESS_MOCK]: {
                balance: '0x3185e67a46d9066',
                nonce: '0x3bf',
              },
            },
          },
          callTrace: {
            from: SENDER_ADDRESS_MOCK,
            to: SENDER_ADDRESS_MOCK,
            type: 'CALL',
            gas: '0x1dcd6500',
            gasUsed: '0x5208',
            value: '0x38d7ea4c68000',
            input: '0x',
            output: '0x',
            error: '',
            calls: null,
          },
          feeEstimate: 766968100542000,
          baseFeePerGas: 36522290502,
        },
      ],
      blockNumber: '0x1296901',
      id: '964ce072-84c7-4f1e-a972-ff00ce84a6c8',
    },
    id: '0',
  },
};
