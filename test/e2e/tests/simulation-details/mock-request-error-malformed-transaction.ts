import { MockRequestResponse, SENDER_ADDRESS_MOCK } from "./types";

export const MALFORMED_TRANSACTION_MOCK = {
  "data": "0x0323498273498729872340897234087q",
  "from": SENDER_ADDRESS_MOCK,
  "maxFeePerGas": "0x0",
  "maxPriorityFeePerGas": "0x0",
  "to": "0xe18035bf8712672935fdb4e5e431b1a0183d2dfc",
  "value": "0x0"
};

export const MALFORMED_TRANSACTION_REQUEST_MOCK: MockRequestResponse = {
  request: {
    "id": "21",
    "jsonrpc": "2.0",
    "method": "infura_simulateTransactions",
    "params": [
      {
        "transactions": [MALFORMED_TRANSACTION_MOCK],
        "withCallTrace": true,
        "withLogs": true
      }
    ]
  },
  response: {
    "jsonrpc": "2.0",
    "error": {
      "code": -32000,
      "message": "failed to decode param in array[0] json: cannot unmarshal invalid hex string into Go struct field Transaction.transactions.data of type hexutil.Bytes"
    },
    "id": "21"
  },
};
