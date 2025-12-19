import { Mockttp } from 'mockttp';
import { TRANSACTION_HASH_MOCK } from '../common-tron';

const PRICE_API_URL = 'https://api.shasta.trongrid.io';

export const mockGetBlock = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${PRICE_API_URL}/wallet/getblock`)
    .thenJson(200, {
      blockID: "00000000039dde639618e1831602b148fdbeba8f8034880ff120cc3a7eaf3caf",
      block_header: {
          raw_data: {
              number: 60677731,
              txTrieRoot: "0000000000000000000000000000000000000000000000000000000000000000",
              witness_address: "41ce9b5acfce023822bcdf302333668cce2ba60bca",
              parentHash: "00000000039dde62a6faec6860eb9c2271b497d97031f90f336ab564662fc005",
              version: 32,
              // Use a recent timestamp to satisfy freshness checks
              timestamp: Date.now() - 2000
          },
          witness_signature: "354261801bf88973cc144d74d81f90e3ebeb8ea6029b42412757e7e996df6d3a2ad22db54675d77be3774cc067e47f374a9bc8ffbdeb0cb62c6057be26201c9000"
      }
  });


export const mockBroadcastTransaction = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${PRICE_API_URL}/wallet/broadcasttransaction`)
    .thenJson(200, {
      result: 'SUCCESS',
      txid: TRANSACTION_HASH_MOCK
    });

export const mockTriggerSmartContract = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${PRICE_API_URL}/wallet/triggersmartcontract`)
    .thenJson(200, {
      "result": {
          "result": true
      },
      "transaction": {
          "visible": false,
          "txID": "dfb62695b5027a6c960666a1dcb560d706f9e401c44acfc8ec7a3191949fa21f",
          "raw_data": {
              "contract": [
                  {
                      "parameter": {
                          "value": {
                              "data": "a9059cbb00000000000000000000000032f9c0c487f21716b7a8f12906b7528899026558000000000000000000000000000000000000000000000000000000000754d4c0",
                              "owner_address": "41588c5216750cceaad16cf5a757e3f7b32835a5e1",
                              "contract_address": "4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0"
                          },
                          "type_url": "type.googleapis.com/protocol.TriggerSmartContract"
                      },
                      "type": "TriggerSmartContract"
                  }
              ],
              "ref_block_bytes": "60fb",
              "ref_block_hash": "cdef6776380058bf",
              "expiration": 1766159955000,
              "fee_limit": 100000000,
              "timestamp": 1766159895515
          },
          "raw_data_hex": "0a0260fb2208cdef6776380058bf40b8e8d8bab3335aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541588c5216750cceaad16cf5a757e3f7b32835a5e112154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb00000000000000000000000032f9c0c487f21716b7a8f12906b7528899026558000000000000000000000000000000000000000000000000000000000754d4c070db97d5bab333900180c2d72f"
      }
  });