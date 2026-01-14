import { Mockttp } from 'mockttp';
import { TRANSACTION_HASH_MOCK } from '../common-tron';

const TRONGRID_API_URL = 'https://api.trongrid.io';
const TRONGRID_SHASTA_API_URL = 'https://api.shasta.trongrid.io';

export const mockGetBlock = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${TRONGRID_SHASTA_API_URL}/wallet/getblock`)
    .thenJson(200, {
      blockID: 'xxxxxxxx',
      block_header: {
        raw_data: {
          number: 60677731,
          txTrieRoot:
            '0000000000000000000000000000000000000000000000000000000000000000',
          witness_address: '41ce9b5acfce023822bcdf302333668cce2ba60bca',
          parentHash:
            '00000000039dde62a6faec6860eb9c2271b497d97031f90f336ab564662fc005',
          version: 32,
          // Use a recent timestamp to satisfy freshness checks
          timestamp: Date.now() - 2000,
        },
        witness_signature:
          '354261801bf88973cc144d74d81f90e3ebeb8ea6029b42412757e7e996df6d3a2ad22db54675d77be3774cc067e47f374a9bc8ffbdeb0cb62c6057be26201c9000',
      },
    });

export const mockBroadcastTransaction = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${TRONGRID_SHASTA_API_URL}/wallet/broadcasttransaction`)
    .thenJson(200, {
      result: 'SUCCESS',
      txid: TRANSACTION_HASH_MOCK,
    });

export const mockTriggerSmartContract = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${TRONGRID_SHASTA_API_URL}/wallet/triggersmartcontract`)
    .thenJson(200, {
      result: {
        result: true,
      },
      transaction: {
        visible: false,
        txID: 'dfb62695b5027a6c960666a1dcb560d706f9e401c44acfc8ec7a3191949fa21f',
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  data: 'a9059cbb00000000000000000000000032f9c0c487f21716b7a8f12906b7528899026558000000000000000000000000000000000000000000000000000000000754d4c0',
                  owner_address: '41588c5216750cceaad16cf5a757e3f7b32835a5e1',
                  contract_address:
                    '4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0',
                },
                type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
              },
              type: 'TriggerSmartContract',
            },
          ],
          ref_block_bytes: '60fb',
          ref_block_hash: 'cdef6776380058bf',
          expiration: 1766159955000,
          fee_limit: 100000000,
          timestamp: 1766159895515,
        },
        raw_data_hex:
          '0a0260fb2208cdef6776380058bf40b8e8d8bab3335aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541588c5216750cceaad16cf5a757e3f7b32835a5e112154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb00000000000000000000000032f9c0c487f21716b7a8f12906b7528899026558000000000000000000000000000000000000000000000000000000000754d4c070db97d5bab333900180c2d72f',
      },
    });

export const mockAccountRequest = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      `${TRONGRID_API_URL}/v1/accounts/TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3`,
    )
    .thenJson(200, accountsResponse);

export const mockTransactionsRequest = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      `${TRONGRID_API_URL}/v1/accounts/TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3/transactions`,
    )
    .thenJson(200, transactionsResponse);

export const mockTransactionsTRC20Request = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      `${TRONGRID_API_URL}/v1/accounts/TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3/transactions/trc20`,
    )
    .thenJson(200, thisransactionsTRC20Response);

export const mockAccountResourcesRequest = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${TRONGRID_API_URL}/wallet/getaccountresource`)
    .thenJson(200, accountResourcesResponse);

const accountsResponse = {
  data: [
    {
      owner_permission: {
        keys: [
          {
            address: 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
            weight: 1,
          },
        ],
        threshold: 1,
        permission_name: 'owner',
      },
      account_resource: {
        energy_window_optimized: true,
        acquired_delegated_frozenV2_balance_for_energy: 6906265032,
        latest_consume_time_for_energy: 1765876896000,
        energy_window_size: 28800000,
      },
      active_permission: [
        {
          operations:
            '7fff000000000000000000000000000000000000000000000000000000000000',
          keys: [
            {
              address: 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
              weight: 1,
            },
          ],
          threshold: 1,
          id: 2,
          type: 'Active',
          permission_name: 'active',
        },
      ],
      address: '41588c5216750cceaad16cf5a757e3f7b32835a5e1',
      create_time: 1765876611000,
      latest_opration_time: 1765994064000,
      free_net_usage: 270,
      frozenV2: [
        {},
        {
          type: 'ENERGY',
        },
        {
          type: 'TRON_POWER',
        },
      ],
      balance: 45811016,
      trc20: [
        {
          TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t: '70270000',
        },
      ],
      latest_consume_free_time: 1765994064000,
      net_window_size: 28800000,
      net_window_optimized: true,
    },
  ],
  success: true,
  meta: {
    at: 1765994144909,
    page_size: 1,
  },
};

const transactionsResponse = {
  data: [
    {
      ret: [
        {
          contractRet: 'SUCCESS',
          fee: 0,
        },
      ],
      signature: ['xxxxxxxxx'],
      txID: 'xxxxxxxx',
      net_usage: 265,
      raw_data_hex: 'xxxxxxxxx',
      net_fee: 0,
      energy_usage: 0,
      blockNumber: 78444042,
      block_timestamp: 1765994349000,
      energy_fee: 0,
      energy_usage_total: 0,
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                amount: 3,
                owner_address: '41588c5216750cceaad16cf5a757e3f7b32835a5e1',
                to_address: '41588c5216750cceaad16cf5a757e3f7b32835a5e1',
              },
              type_url: 'type.googleapis.com/protocol.TransferContract',
            },
            type: 'TransferContract',
          },
        ],
        ref_block_bytes: 'f609',
        ref_block_hash: '3f8104381e219a83',
        expiration: 1765994406000,
        timestamp: 1765994346000,
      },
      internal_transactions: [],
    },
  ],
  success: true,
  meta: {
    at: 1765994884399,
    fingerprint: 'xxxxxxxxxx',
    links: {
      next: 'https://api.trongrid.io/v1/accounts/TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
    },
    page_size: 3,
  },
};

const thisransactionsTRC20Response = {
  data: [
    {
      transaction_id: 'xxxxxxxxx',
      token_info: {
        symbol: 'USDT',
        address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        decimals: 6,
        name: 'Tether USD',
      },
      block_timestamp: 1765994163000,
      from: 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
      to: 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
      type: 'Transfer',
      value: '70270000',
    },
  ],
  success: true,
  meta: {
    at: 1765994972770,
    page_size: 4,
  },
};

const accountResourcesResponse = {
  freeNetUsed: 527,
  freeNetLimit: 600,
  TotalNetLimit: 43200000000,
  TotalNetWeight: 26677115436,
  TotalEnergyLimit: 180000000000,
  TotalEnergyWeight: 19125511029,
};
