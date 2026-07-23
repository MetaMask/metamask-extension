import { createHash } from 'crypto';
import { Mockttp } from 'mockttp';
import { TRANSACTION_HASH_MOCK } from '../common-tron';

const TRONGRID_API_URL = 'https://api.trongrid.io';
const TRON_API_URL =
  /(?:https:\/\/api\.trongrid\.io|https:\/\/tron-mainnet\.infura\.io\/v3\/[^/]+)/u;
const TRON_WALLET_API_URL =
  /(?:https:\/\/api\.trongrid\.io\/wallet|https:\/\/tron-mainnet\.infura\.io\/v3\/[^/]+\/wallet)/u;
const DEFAULT_TRX_BALANCE_IN_SUN = 45811016;

/**
 * Builds an exact Tron endpoint matcher from a shared TronGrid/Infura base URL.
 *
 * The final matcher is anchored to prevent shorter mocks, such as the /transactions
 * endpoint, from also matching longer endpoints like /transactions/trc20.
 * Query strings are still accepted because some API clients append request
 * parameters to otherwise identical endpoint paths.
 *
 * @param baseUrl - Base URL matcher for the TronGrid or Infura Tron API.
 * @param endpoint - Endpoint path to append to the base URL matcher.
 * @returns A regular expression that matches only the provided endpoint.
 */
const buildTronEndpointRegExp = (baseUrl: RegExp, endpoint: string) =>
  new RegExp(`${baseUrl.source}${endpoint}(?:\\?.*)?$`, 'u');

type AccountRequestOptions = {
  balance?: number;
};

// We disable this rule because the resposes we mock are using snake_case
/* eslint-disable @typescript-eslint/naming-convention */
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
      balance: DEFAULT_TRX_BALANCE_IN_SUN,
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

const transactionsTRC20Response = {
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
  freeNetUsed: 0,
  freeNetLimit: 2000,
  EnergyLimit: 2000,
  EnergyUsed: 0,
  TotalNetLimit: 43200000000,
  TotalNetWeight: 26677115436,
  TotalEnergyLimit: 180000000000,
  TotalEnergyWeight: 19125511029,
};

export type AccountResourcesRequestOptions = Partial<
  typeof accountResourcesResponse
>;

// The block number and blockID must stay consistent with the transaction's
// TAPOS reference (`ref_block_bytes` / `ref_block_hash`) returned by
// `mockTriggerSmartContract`, otherwise the snap's `isTransactionExpired` check
// treats the transaction as expired and disables the Confirm button:
//   - number % 65536 === 0x8b15  → getRefBlockBytes(number) === '8b15'
//   - blockID.slice(16, 32)      === '5fca48bd51bf3f1d' (ref_block_hash)
const buildBlockResponse = () => ({
  blockID: '00000000039d8b155fca48bd51bf3f1d00000000000000000000000000000000',
  block_header: {
    raw_data: {
      number: 60656405,
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

export const mockGetBlock = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${TRONGRID_API_URL}/wallet/getblock`)
    .thenCallback(() => ({ statusCode: 200, json: buildBlockResponse() }));

export const mockGetNowBlock = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${TRONGRID_API_URL}/wallet/getnowblock`)
    .thenCallback(() => ({ statusCode: 200, json: buildBlockResponse() }));

export const mockGetBlockByNum = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${TRONGRID_API_URL}/wallet/getblockbynum`)
    .thenCallback(() => ({ statusCode: 200, json: buildBlockResponse() }));

// TODO: Check why we had to mock this. Do we intend this call to be routed through Infura
// instead of Trongrid ?
export const mockGetNowBlockInfura = (mockServer: Mockttp) =>
  mockServer
    .forGet(/tron-mainnet\.infura\.io\/v3\/.*\/wallet\/getnowblock/u)
    .always()
    .thenCallback(() => ({ statusCode: 200, json: buildBlockResponse() }));

export const mockBroadcastTransaction = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${TRONGRID_API_URL}/wallet/broadcasttransaction`)
    .thenJson(200, {
      result: 'SUCCESS',
      txid: TRANSACTION_HASH_MOCK,
    });

/**
 * Encodes an unsigned integer as a protobuf LEB128 varint hex string.
 *
 * @param value - The value to encode.
 * @returns The lowercase hex encoding of the varint.
 */
/* eslint-disable no-bitwise */
const encodeVarintHex = (value: number): string => {
  let remaining = BigInt(value);
  const bytes: number[] = [];
  do {
    let byte = Number(remaining & 0x7fn);
    remaining >>= 7n;
    if (remaining > 0n) {
      byte |= 0x80;
    }
    bytes.push(byte);
  } while (remaining > 0n);
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
/* eslint-enable no-bitwise */

// The original hardcoded timestamps baked into the static `raw_data_hex` below.
// They are rewritten to fresh values on every request so the snap's TAPOS/
// expiration check (`isTransactionExpired`) does not reject the transaction as
// expired — which would disable the confirmation's Confirm button and surface
// the "This transaction was reverted during simulation" banner.
const STATIC_EXPIRATION_MS = 1768469721000;
const STATIC_TIMESTAMP_MS = 1768469664343;
const STATIC_RAW_DATA_HEX =
  '0a028b1522085fca48bd51bf3f1d40a8df8988bc335aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541588c5216750cceaad16cf5a757e3f7b32835a5e1121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb00000000000000000000000032f9c0c487f21716b7a8f12906b7528899026558000000000000000000000000000000000000000000000000000000000754d4c070d7a48688bc33900180c2d72f';

export const mockTriggerSmartContract = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${TRONGRID_API_URL}/wallet/triggersmartcontract`)
    .thenCallback(() => {
      const now = Date.now();
      const timestamp = now;
      // Keep well within Tron's TAPOS validity window (< 24h ahead, > the
      // snap's ~9s freshness buffer). Both timestamps stay 6-byte varints for
      // realistic dates, so the in-place hex rewrite preserves byte length.
      const expiration = now + 10 * 60 * 1000;

      const rawDataHex = STATIC_RAW_DATA_HEX.replace(
        encodeVarintHex(STATIC_EXPIRATION_MS),
        encodeVarintHex(expiration),
      ).replace(
        encodeVarintHex(STATIC_TIMESTAMP_MS),
        encodeVarintHex(timestamp),
      );

      const txID = createHash('sha256')
        .update(Buffer.from(rawDataHex, 'hex'))
        .digest('hex');

      return {
        statusCode: 200,
        json: {
          result: {
            result: true,
          },
          transaction: {
            visible: false,
            txID,
            raw_data: {
              contract: [
                {
                  parameter: {
                    value: {
                      data: 'a9059cbb00000000000000000000000032f9c0c487f21716b7a8f12906b7528899026558000000000000000000000000000000000000000000000000000000000754d4c0',
                      owner_address:
                        '41588c5216750cceaad16cf5a757e3f7b32835a5e1',
                      contract_address:
                        '41a614f803b6fd780986a42c78ec9c7f77e6ded13c',
                    },
                    type_url:
                      'type.googleapis.com/protocol.TriggerSmartContract',
                  },
                  type: 'TriggerSmartContract',
                },
              ],
              ref_block_bytes: '8b15',
              ref_block_hash: '5fca48bd51bf3f1d',
              expiration,
              fee_limit: 100000000,
              timestamp,
            },
            raw_data_hex: rawDataHex,
          },
        },
      };
    });

export const mockTriggerConstantContract = (mockServer: Mockttp) =>
  mockServer
    .forPost(
      buildTronEndpointRegExp(TRON_WALLET_API_URL, '/triggerconstantcontract'),
    )
    .always()
    .thenJson(200, {
      result: {
        result: true,
      },
      energy_used: 1000,
      constant_result: [],
      transaction: {
        ret: [{ ret: 'SUCCESS' }],
        visible: false,
        txID: 'mock-trigger-constant-tx-id',
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  data: 'a9059cbb00000000000000000000000032f9c0c487f21716b7a8f12906b7528899026558000000000000000000000000000000000000000000000000000000000754d4c0',
                  owner_address: '41588c5216750cceaad16cf5a757e3f7b32835a5e1',
                  contract_address:
                    '41a614f803b6fd780986a42c78ec9c7f77e6ded13c',
                },
                type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
              },
              type: 'TriggerSmartContract',
            },
          ],
          ref_block_bytes: '8b15',
          ref_block_hash: '5fca48bd51bf3f1d',
          expiration: Date.now() + 10 * 60 * 1000,
          timestamp: Date.now(),
        },
        raw_data_hex: '',
      },
    });

export const mockGetChainParameters = (mockServer: Mockttp) =>
  mockServer
    .forGet(buildTronEndpointRegExp(TRON_WALLET_API_URL, '/getchainparameters'))
    .always()
    .thenJson(200, {
      chainParameter: [
        { key: 'getTransactionFee', value: 1000 },
        { key: 'getEnergyFee', value: 420 },
      ],
    });

export const mockGetNextMaintenanceTime = (mockServer: Mockttp) =>
  mockServer
    .forPost(
      buildTronEndpointRegExp(TRON_WALLET_API_URL, '/getnextmaintenancetime'),
    )
    .always()
    .thenJson(200, {
      num: Date.now() + 6 * 60 * 60 * 1000,
    });

export const mockGetContract = (mockServer: Mockttp) =>
  mockServer
    .forPost(buildTronEndpointRegExp(TRON_WALLET_API_URL, '/getcontract'))
    .always()
    .thenJson(200, {});

export const mockAccountRequest = (
  mockServer: Mockttp,
  options: AccountRequestOptions = {},
) =>
  mockServer
    .forGet(
      buildTronEndpointRegExp(
        TRON_API_URL,
        '/v1/accounts/TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
      ),
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        ...accountsResponse,
        data: [
          {
            ...accountsResponse.data[0],
            balance: options.balance ?? DEFAULT_TRX_BALANCE_IN_SUN,
          },
        ],
      },
    }));

export const mockTransactionsRequest = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      buildTronEndpointRegExp(
        TRON_API_URL,
        '/v1/accounts/TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3/transactions',
      ),
    )
    .always()
    .thenJson(200, transactionsResponse);

export const mockTransactionsTRC20Request = (mockServer: Mockttp) =>
  mockServer
    .forGet(
      buildTronEndpointRegExp(
        TRON_API_URL,
        '/v1/accounts/TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3/transactions/trc20',
      ),
    )
    .always()
    .thenJson(200, transactionsTRC20Response);

export const mockAccountResourcesRequest = (
  mockServer: Mockttp,
  options: AccountResourcesRequestOptions = {},
) =>
  mockServer
    .forPost(
      buildTronEndpointRegExp(TRON_WALLET_API_URL, '/getaccountresource'),
    )
    .always()
    .thenJson(200, {
      ...accountResourcesResponse,
      ...options,
    });
