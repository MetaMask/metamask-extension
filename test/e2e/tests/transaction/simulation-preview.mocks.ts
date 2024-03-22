import type { Mockttp } from "mockttp";

const SENDER_ADDRESS_MOCK = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
export const RECIPIENT_ADDRESS_MOCK = '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc';

const SIMULATION_REQUEST_NATIVE_CHANGE_MOCK = {
  request: {
    "method": "infura_simulateTransactions",
    "params": [
      {
        "transactions": [
          {
            "from": SENDER_ADDRESS_MOCK,
            "to": RECIPIENT_ADDRESS_MOCK,
            "value": "0x38d7ea4c68000" // 0.001 ETH
          }
        ],
        "withCallTrace": true,
        "withLogs": true
      }
    ],
    "id": 42,
    "jsonrpc": "2.0"
  },
  response: {
    "jsonrpc": "2.0",
    "result": {
      "transactions": [
        {
          "return": "0x",
          "status": "0x1",
          "gasUsed": "0x5208",
          "gasLimit": "0x5208",
          "fees": [
            {
              "maxFeePerGas": "0x22ae4b8bcb",
              "maxPriorityFeePerGas": "0x59682f04",
              "balanceNeeded": "0xeaa6849ea3660",
              "currentBalance": "0x2386f26fc1000000",
              "error": ""
            }
          ],
          "stateDiff": {
            "post": {
              [SENDER_ADDRESS_MOCK]: {
                "balance": "0x238364f11c398000",
                "nonce": "0x1"
              },
              [RECIPIENT_ADDRESS_MOCK]: {
                "balance": "0x38d7ea4c68000"
              }
            },
            "pre": {
              [SENDER_ADDRESS_MOCK]: {
                "balance": "0x2386f26fc1000000"
              },
              [RECIPIENT_ADDRESS_MOCK]: {
                "balance": "0x0",
                "nonce": "0x24"
              }
            }
          },
          "callTrace": {
            "from": SENDER_ADDRESS_MOCK,
            "to": RECIPIENT_ADDRESS_MOCK,
            "type": "CALL",
            "gas": "0x1dcd6500",
            "gasUsed": "0x5208",
            "value": "0x38d7ea4c68000",
            "input": "0x",
            "output": "0x",
            "error": "",
            "calls": null
          },
          "feeEstimate": 1954138800138000,
          "baseFeePerGas": 92054228577
        }
      ],
      "blockNumber": "0x53afbb",
      "id": "09156630-b754-4bb8-bfc4-3390d934cec6"
    },
    "id": 42
  }
};

export async function mockSimulationServer(server: Mockttp) {
  await server.forPost('https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io/')
  .withJsonBody(SIMULATION_REQUEST_NATIVE_CHANGE_MOCK.request)
  .thenJson(200, SIMULATION_REQUEST_NATIVE_CHANGE_MOCK.response);
}
