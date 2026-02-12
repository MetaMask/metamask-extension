import {
  RECIPIENT_ADDRESS_MOCK,
  MockRequestResponse,
  SENDER_ADDRESS_MOCK,
} from './types';

export const SEND_ETH_TRANSACTION_MOCK = {
  data: '0x',
  gas: '0x123',
  from: SENDER_ADDRESS_MOCK,
  maxFeePerGas: '0x456',
  maxPriorityFeePerGas: '0x789',
  to: RECIPIENT_ADDRESS_MOCK,
  value: '0x38d7ea4c68000',
};

export const SEND_ETH_REQUEST_MOCK: MockRequestResponse = {
  request: {
    id: '0',
    jsonrpc: '2.0',
    method: 'infura_simulateTransactions',
    params: [
      {
        transactions: [SEND_ETH_TRANSACTION_MOCK],
        withCallTrace: true,
        withLogs: true,
        withGas: true,
        withDefaultBlockOverrides: true,
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
              maxFeePerGas: '0x22ae4b8bcb',
              maxPriorityFeePerGas: '0x59682f04',
              balanceNeeded: '0xeaa6849ea3660',
              currentBalance: '0x2386f26fc1000000',
              error: '',
            },
          ],
          stateDiff: {
            post: {
              [SENDER_ADDRESS_MOCK]: {
                balance: '0x238364f11c398000',
                nonce: '0x1',
              },
              [RECIPIENT_ADDRESS_MOCK]: {
                balance: '0x38d7ea4c68000',
              },
            },
            pre: {
              [SENDER_ADDRESS_MOCK]: {
                balance: '0x2386f26fc1000000',
              },
              [RECIPIENT_ADDRESS_MOCK]: {
                balance: '0x0',
                nonce: '0x24',
              },
            },
          },
          callTrace: {
            from: SENDER_ADDRESS_MOCK,
            to: RECIPIENT_ADDRESS_MOCK,
            type: 'CALL',
            gas: '0x1dcd6500',
            gasUsed: '0x5208',
            value: '0x38d7ea4c68000',
            input: '0x',
            output: '0x',
            error: '',
            calls: null,
          },
          feeEstimate: 1954138800138000,
          baseFeePerGas: 92054228577,
        },
      ],
      blockNumber: '0x53afbb',
      id: '09156630-b754-4bb8-bfc4-3390d934cec6',
    },
    id: '42',
  },
};
