/* eslint-disable @typescript-eslint/naming-convention */
import { Mockttp, MockedEndpoint } from 'mockttp';
import { TronNode } from '../../../seeder/tron/node';
import {
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from '../../btc/mocks/tokens-api';

export const TRON_ACCOUNT_ADDRESS = 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3';
export const TRON_RECIPIENT_ADDRESS = 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq';
export const TRON_CHAIN_ID = 'tron:728126428';
export const TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE =
  '5472616e73616374696f6e2065787069726564';

// TRX balance in SUN (1 TRX = 1,000,000 SUN)
export const TRX_BALANCE = 6072392; // ~6.07 TRX
export const TRX_TO_USD_RATE = 0.29469;
export const SUN_PER_TRX = 1_000_000;

const DEFAULT_TRC10_ASSETS = {
  GAS_FREE: {
    decimals: 6,
    name: 'GasFreeTransferSolution',
    symbol: 'GasFree4uCOM',
    tokenId: '1005074',
  },
};

const DEFAULT_TRC20_ASSETS = {
  HTX: {
    address: 'TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6',
    decimals: 18,
    name: 'HTX DAO',
    symbol: 'HTX',
  },
  SEED: {
    address: 'TBwoSTyywvLrgjSgaatxrBhxt3DGpVuENh',
    decimals: 6,
    name: 'SEED',
    symbol: 'SEED',
  },
  USDD: {
    address: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
    decimals: 18,
    name: 'USDD',
    symbol: 'USDD',
  },
  USDT: {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    decimals: 6,
    name: 'Tether',
    symbol: 'USDT',
  },
};

// Feature flags URL
export const FEATURE_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags';

// Tron Infura API base URL pattern (matches any project ID)
const TRON_INFURA_BASE_URL = 'https://tron-mainnet\\.infura\\.io/v3/[^/]+';

/**
 * Creates a regex pattern for Tron Infura API endpoints
 *
 * @param path - The endpoint path to append to the base URL
 * @returns A RegExp that matches the full URL with any project ID
 */
function tronInfuraUrl(path: string): RegExp {
  return new RegExp(`^${TRON_INFURA_BASE_URL}${path}(\\?[^#]*)?$`, 'u');
}

// BIP44 Stage 2 feature flags - enables automatic multichain account creation
export const BIP44_STAGE_TWO = {
  enableMultichainAccountsState2: {
    enabled: true,
    featureVersion: '2',
    minimumVersion: '12.19.0',
  },
  bitcoinAccounts: {
    enabled: true,
    minimumVersion: '13.6.0',
  },
  tronAccounts: {
    enabled: true,
    minimumVersion: '13.6.0',
  },
};

export const TRON_SWAP_TOKEN_REGISTRY = {
  TRX: {
    address: '0x0000000000000000000000000000000000000000',
    assetId: 'tron:728126428/slip44:195',
    decimals: 6,
    name: 'Tron',
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/slip44/195.png',
  },
  USDT: {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    assetId: 'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    decimals: 6,
    name: 'Tether',
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t.png',
  },
  USDD: {
    address: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
    assetId: 'tron:728126428/trc20:TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
    decimals: 18,
    name: 'USDD',
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/trc20/TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz.png',
  },
} as const satisfies Record<
  string,
  {
    address: string;
    assetId: string;
    decimals: number;
    name: string;
    iconUrl: string;
  }
>;

export type TronSwapSymbol = keyof typeof TRON_SWAP_TOKEN_REGISTRY;

export type TronQuoteFixture = {
  src: TronSwapSymbol;
  dest: TronSwapSymbol;
  srcAmount: string; // base units (sun for TRX, raw for TRC20)
  destAmount: string; // base units of dest
  feeSun?: number; // metabridge TRX fee, default 8_750 (0.00875 TRX)
};

function buildTronAsset(symbol: TronSwapSymbol) {
  const meta = TRON_SWAP_TOKEN_REGISTRY[symbol];
  return {
    address: meta.address,
    chainId: 728126428,
    assetId: meta.assetId,
    symbol,
    decimals: meta.decimals,
    name: meta.name,
    aggregators: symbol === 'TRX' ? [] : ['coinGecko'],
    occurrences: symbol === 'TRX' ? 100 : 1,
    iconUrl: meta.iconUrl,
    metadata: {},
  };
}

/**
 * Mocks the feature flags endpoint with BIP44 Stage 2 configuration
 * This enables automatic Tron account creation
 *
 * @param mockServer
 */
export async function mockTronFeatureFlags(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: [BIP44_STAGE_TWO],
    }));
}

export async function mockBroadTransaction(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(tronInfuraUrl('/wallet/broadcasttransaction'))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        code: 'TRANSACTION_EXPIRATION_ERROR',
        txid: '6db783c4142b3749a4b598db4644155455c9206e2eca4b31efbd48e46773d9d5',
        message: TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE,
      },
    }));
}

export async function mockTronGetAccount(
  mockServer: Mockttp,
  mockZeroBalance?: boolean,
): Promise<MockedEndpoint> {
  // `($|\\?)` so the regex matches both with and without query params like ?visible=true
  return mockServer
    .forGet(
      new RegExp(
        `^${TRON_INFURA_BASE_URL}/v1/accounts/${TRON_ACCOUNT_ADDRESS}($|\\?)`,
        'u',
      ),
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        data: [
          {
            id: '',
            version: 1,
            address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
            create_time: 1763374065000,
            latest_opration_time: 1764149628000,
            owner_permission: {
              keys: [
                {
                  address: TRON_ACCOUNT_ADDRESS,
                  weight: 1,
                },
              ],
              threshold: 1,
              permission_name: 'owner',
            },
            account_resource: {
              energy_window_optimized: true,
              latest_consume_time_for_energy: 1764149628000,
              energy_window_size: 28800000,
            },
            active_permission: [
              {
                operations:
                  '7fff1fc0033ec30f000000000000000000000000000000000000000000000000',
                keys: [
                  {
                    address: TRON_ACCOUNT_ADDRESS,
                    weight: 1,
                  },
                ],
                threshold: 1,
                id: 2,
                type: 'Active',
                permission_name: 'active',
              },
            ],
            balance: mockZeroBalance ? 0 : TRX_BALANCE,
            frozenV2: [
              {},
              {
                amount: mockZeroBalance ? 0 : 20000000,
                type: 'ENERGY',
              },
              {
                type: 'TRON_POWER',
              },
            ],
            free_asset_net_usageV2: mockZeroBalance
              ? []
              : [
                  {
                    value: 0,
                    key: '1005074',
                  },
                ],
            assetV2: mockZeroBalance
              ? []
              : [
                  {
                    value: 33333333,
                    key: '1005074',
                  },
                ],
            trc20: mockZeroBalance
              ? []
              : [
                  {
                    TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6:
                      '3156454956836360132407885',
                  },
                  {
                    TBwoSTyywvLrgjSgaatxrBhxt3DGpVuENh: '89851311',
                  },
                  {
                    TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t: '2804595',
                  },
                  {
                    TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz: '289757448699320931',
                  },
                ],
            latest_consume_free_time: 1764149628000,
            net_window_size: 28800000,
            net_window_optimized: true,
          },
        ],
        success: true,
        meta: {
          at: 1767888275562,
          page_size: 1,
        },
      },
    }));
}

export type TronAccountSnapshot = {
  trxSun: number;
  trc20: Partial<Record<TronSwapSymbol, string>>;
};

/**
 * Creates stateful account/balance mocks that flip from `before` to `after`
 * once the wallet posts a broadcast transaction. Replaces mockTronGetAccount
 * and mockBroadTransaction for swap tests that assert balance deltas.
 *
 * @param mockServer - The Mockttp server
 * @param opts - before/after snapshots
 * @param opts.before - Account state before the swap completes
 * @param opts.after - Account state after the swap completes (optional)
 */
export async function createStatefulTronAccountMock(
  mockServer: Mockttp,
  {
    before,
    after,
  }: { before: TronAccountSnapshot; after?: TronAccountSnapshot },
): Promise<MockedEndpoint[]> {
  let broadcasted = false;
  const current = (): TronAccountSnapshot =>
    broadcasted && after ? after : before;

  // Build the TRC20 array from a snapshot, using canonical addresses
  const buildTrc20Array = (snapshot: TronAccountSnapshot) => {
    const entries: Record<string, string>[] = [];
    for (const [symbol, rawAmount] of Object.entries(snapshot.trc20)) {
      const address =
        TRON_SWAP_TOKEN_REGISTRY[symbol as TronSwapSymbol]?.address;
      if (address && address !== '0x0000000000000000000000000000000000000000') {
        entries.push({ [address]: rawAmount as string });
      }
    }
    return entries;
  };

  const buildAccountJson = (snapshot: TronAccountSnapshot) => ({
    data: [
      {
        owner_permission: {
          keys: [{ address: TRON_ACCOUNT_ADDRESS, weight: 1 }],
          threshold: 1,
          permission_name: 'owner',
        },
        account_resource: {
          energy_window_optimized: true,
          latest_consume_time_for_energy: 1764149628000,
          energy_window_size: 28800000,
        },
        active_permission: [
          {
            operations:
              '7fff1fc0033ec30f000000000000000000000000000000000000000000000000',
            keys: [{ address: TRON_ACCOUNT_ADDRESS, weight: 1 }],
            threshold: 1,
            id: 2,
            type: 'Active',
            permission_name: 'active',
          },
        ],
        address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
        create_time: 1763374065000,
        latest_opration_time: 1764149628000,
        free_asset_net_usageV2: [{ value: 0, key: '1005074' }],
        assetV2: [{ value: 33333333, key: '1005074' }],
        frozenV2: [
          {},
          { amount: 20000000, type: 'ENERGY' },
          { type: 'TRON_POWER' },
        ],
        balance: snapshot.trxSun,
        trc20: buildTrc20Array(snapshot),
        latest_consume_free_time: 1764149628000,
        net_window_size: 28800000,
        net_window_optimized: true,
      },
    ],
    success: true,
    meta: { at: Date.now(), page_size: 1 },
  });

  const broadcastEndpoint = await mockServer
    .forPost(tronInfuraUrl('/wallet/broadcasttransaction'))
    .thenCallback(() => {
      broadcasted = true;
      return {
        statusCode: 200,
        json: {
          code: 'TRANSACTION_EXPIRATION_ERROR',
          txid: '6db783c4142b3749a4b598db4644155455c9206e2eca4b31efbd48e46773d9d5',
          message: TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE,
        },
      };
    });

  const accountEndpoint = await mockServer
    .forGet(tronInfuraUrl(`/v1/accounts/${TRON_ACCOUNT_ADDRESS}`))
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: buildAccountJson(current()),
    }));

  return [broadcastEndpoint, accountEndpoint];
}

export async function mockTronGetTrc20Balance(
  mockServer: Mockttp,
  mockZeroBalance?: boolean,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(tronInfuraUrl(`/v1/accounts/${TRON_ACCOUNT_ADDRESS}/trc20/balance`))
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        data: mockZeroBalance
          ? []
          : [
              {
                contract_address: 'TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6',
                balance: '3156454956836360132407885',
                name: 'HTX',
                symbol: 'HTX',
                decimals: 18,
              },
              {
                contract_address: 'TBwoSTyywvLrgjSgaatxrBhxt3DGpVuENh',
                balance: '89851311',
                name: 'SEED',
                symbol: 'SEED',
                decimals: 6,
              },
              {
                contract_address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                balance: '2804595',
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
              },
              {
                contract_address: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
                balance: '289757448699320931',
                name: 'Decentralized USD',
                symbol: 'USDD',
                decimals: 18,
              },
            ],
        success: true,
        meta: {
          at: 1767888275562,
          page_size: 10,
        },
      },
    }));
}

export async function mockTronGetAccountResource(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(tronInfuraUrl('/wallet/getaccountresource'))
    .withJsonBody({
      address: TRON_ACCOUNT_ADDRESS,
      visible: true,
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        freeNetLimit: 600,
        assetNetUsed: [
          {
            key: '1005074',
            value: 0,
          },
        ],
        assetNetLimit: [
          {
            key: '1005074',
            value: 0,
          },
        ],
        TotalNetLimit: 43200000000,
        TotalNetWeight: 26681367161,
        tronPowerLimit: 20,
        EnergyLimit: 189,
        TotalEnergyLimit: 180000000000,
        TotalEnergyWeight: 19018684711,
      },
    }));
}

export const DEFAULT_TRON_TRC20_TRANSACTIONS = [
  {
    transaction_id:
      '0f757bc78562fc03c305d84ce83ddde8dd3c71a76dd014cecc96656bd432c5d1',
    token_info: {
      symbol: 'HTX',
      address: 'TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6',
      decimals: 18,
      name: 'HTX',
    },
    block_timestamp: 1764149631000,
    from: TRON_ACCOUNT_ADDRESS,
    to: 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq',
    type: 'Transfer',
    value: '50000000000000000000000',
  },
  {
    transaction_id:
      '47d6870d229f383e1bacc19967cb7be2c61d5ad4185b6848e91d2bc8c1616de1',
    token_info: {
      symbol: 'USDT',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      decimals: 6,
      name: 'Tether USD',
    },
    block_timestamp: 1764062793000,
    from: TRON_ACCOUNT_ADDRESS,
    to: 'TBEPnZeEVRJWtJwqY4f3VWEtf9jKyQ4HAu',
    type: 'Transfer',
    value: '7000000',
  },
  {
    transaction_id:
      'c2f4a66600c3f46cfffdcb1886d72e48e5fe2d650c110ddeb6da7e6fda12ab12',
    token_info: {
      symbol: 'USDT',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      decimals: 6,
      name: 'Tether USD',
    },
    block_timestamp: 1764062673000,
    from: TRON_ACCOUNT_ADDRESS,
    to: 'TJPmfFA9PwYf1Z9Ny7FzGHQD8uA2h88q74',
    type: 'Transfer',
    value: '10000000',
  },
  {
    transaction_id:
      'ac605640c5f44f36c766894d6f1d8dca0290cba857470c46a863e1f52abfc798',
    token_info: {
      symbol: 'USDT',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      decimals: 6,
      name: 'Tether USD',
    },
    block_timestamp: 1764062673000,
    from: TRON_ACCOUNT_ADDRESS,
    to: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    type: 'Approval',
    value: '10000000',
  },
  {
    transaction_id:
      'fa1721d1e32a19fae77a7bf7e2f6dd72cd514924eeb2c9f33134d6e4a612bd6f',
    token_info: {
      symbol: 'USDT',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      decimals: 6,
      name: 'Tether USD',
    },
    block_timestamp: 1763725185000,
    from: 'TPwezUWpEGmFBENNWJHwXHRG1D2NCEEt5s',
    to: TRON_ACCOUNT_ADDRESS,
    type: 'Transfer',
    value: '19794019',
  },
  {
    transaction_id:
      '28070ab43f0180dc932f05977ffa96e6a6b767f496203961a8f1ccdc12ab5181',
    token_info: {
      symbol: 'HTX',
      address: 'TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6',
      decimals: 18,
      name: 'HTX',
    },
    block_timestamp: 1763645868000,
    from: 'TYWc7X6YHpp2YrFXwLRsofdiL78JRvDd6u',
    to: TRON_ACCOUNT_ADDRESS,
    type: 'Transfer',
    value: '3206454956836360132407885',
  },
  {
    transaction_id:
      '33d8313c4d7f4999a900602063004352acf4a27e7d08d11bb050f36eaec398b5',
    token_info: {
      symbol: 'USDD',
      address: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
      decimals: 18,
      name: 'Decentralized USD',
    },
    block_timestamp: 1763551554000,
    from: 'TDEoc9JmeTbcnKuCqZrQuykb3k6CwvDW6P',
    to: TRON_ACCOUNT_ADDRESS,
    type: 'Transfer',
    value: '289757448699320931',
  },
  {
    transaction_id:
      '87951966199dce62daf8071726b1a1a14546191fa3e0d4820021cea2af407912',
    token_info: {
      symbol: 'SEED',
      address: 'TBwoSTyywvLrgjSgaatxrBhxt3DGpVuENh',
      decimals: 6,
      name: 'SEED',
    },
    block_timestamp: 1763479599000,
    from: 'TC6GmVK2zs1Nu7kTWhsMveuzV2w7o2e9L9',
    to: TRON_ACCOUNT_ADDRESS,
    type: 'Transfer',
    value: '89851311',
  },
  {
    transaction_id:
      'a0f85ddb6b9ebe00d45bf7c9f15a9ac296a333e5df49693d21275a6bd6d6ad0e',
    token_info: {
      symbol: 'USDT',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      decimals: 6,
      name: 'Tether USD',
    },
    block_timestamp: 1763477460000,
    from: TRON_ACCOUNT_ADDRESS,
    to: 'TXwNmWNLDYoCokvZcehV85JKszyyJFRRPu',
    type: 'Transfer',
    value: '300000',
  },
  {
    transaction_id:
      '2225c7e900ba240aa82302bb8818118419f07e39c15998fd2dd81a2109d0069d',
    token_info: {
      symbol: 'USDT',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      decimals: 6,
      name: 'Tether USD',
    },
    block_timestamp: 1763470344000,
    from: 'TCFNp179Lg46D16zKoumd4Poa2WFFdtqYj',
    to: TRON_ACCOUNT_ADDRESS,
    type: 'Transfer',
    value: '310576',
  },
];

export const DEFAULT_TRON_TRANSACTIONS = [
  {
    ret: [{ contractRet: 'SUCCESS', fee: 2799500 }],
    signature: [
      '4e812512a764e2648c31b4321d6d66731da49fef9354e668ffb6249147579af4164ca1424dc520e8d21eb15795b9efc9f2ead599aacb7ee00d1b70d40e4ee0281c',
    ],
    txID: '0f757bc78562fc03c305d84ce83ddde8dd3c71a76dd014cecc96656bd432c5d1',
    net_usage: 345,
    net_fee: 0,
    energy_usage: 190,
    blockNumber: 77829312,
    block_timestamp: 1764149631000,
    energy_fee: 2799500,
    energy_usage_total: 28185,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              data: 'a9059cbb000000000000000000000000639f09ebb2021f11ab768b639859ea6f66a9ea50000000000000000000000000000000000000000000000a968163f0a57b400000',
              owner_address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
              contract_address: '41ca0303e8b9a738121777116dcea419fe524f271a',
            },
            type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
          },
          type: 'TriggerSmartContract',
        },
      ],
      ref_block_bytes: '94a9',
      ref_block_hash: '5946efc2f14403b9',
      expiration: 1764149676000,
      fee_limit: 150000000,
      timestamp: 1764149619180,
    },
    internal_transactions: [],
  },
  {
    ret: [{ contractRet: 'SUCCESS', fee: 0 }],
    signature: [
      '1d4063933a8ff7bd59b6aeb40cbdd9ee553b44482d5ae0ee8b21e6d16f62ab24797e30caf9adfd19d9f5603ea1e77211628553dff7b2eaba0581f07b0968346001',
    ],
    txID: '3249a2975b834aeca79f7d929e53a3d94dccb5144bbf60c877001536e751cdf3',
    net_usage: 265,
    net_fee: 0,
    energy_usage: 0,
    blockNumber: 77819893,
    block_timestamp: 1764121368000,
    energy_fee: 0,
    energy_usage_total: 0,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              amount: 1,
              owner_address: '4158bf0e3296b05798df14af89749955daa753e946',
              to_address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        },
      ],
      ref_block_bytes: '6fe2',
      ref_block_hash: '21899808c649f863',
      expiration: 1764121425000,
      timestamp: 1764121365678,
    },
    internal_transactions: [],
  },
  {
    ret: [{ contractRet: 'SUCCESS', fee: 1100000 }],
    signature: [
      '48808a5003f1feafb6b4681b4983a50592f281a913b864356236addb191025b72ad84bf0e4857c54cb93b7ebe86606d95c47d6797b4a318cc13c6a0f907377fd1c',
    ],
    txID: 'e51e01e4a0d0f6b4720f489375c09e12c57e64d53ea82094b9cc2ef1d665d562',
    net_usage: 0,
    net_fee: 100000,
    energy_usage: 0,
    blockNumber: 77803364,
    block_timestamp: 1764071763000,
    energy_fee: 0,
    energy_usage_total: 0,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              amount: 2000000,
              owner_address: '4100dd57a0a3ee58392689f79c0bedcf44d3b6c255',
              to_address: '4127c4628ebcce8ad34ea83df4b9790069923830db',
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        },
      ],
      ref_block_bytes: '2f61',
      ref_block_hash: '1b253007b84f888d',
      expiration: 1764071814000,
      timestamp: 1764071754000,
    },
    internal_transactions: [],
  },
];

export async function mockTronGetTrc20Transactions(
  mockServer: Mockttp,
  transactions: unknown[] = DEFAULT_TRON_TRC20_TRANSACTIONS,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(
      tronInfuraUrl(`/v1/accounts/${TRON_ACCOUNT_ADDRESS}/transactions/trc20`),
    )
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        data: transactions,
        success: true,
        meta: { at: Date.now(), page_size: transactions.length },
      },
    }));
}

export async function mockTronGetTransactions(
  mockServer: Mockttp,
  transactions: unknown[] = DEFAULT_TRON_TRANSACTIONS,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(tronInfuraUrl(`/v1/accounts/${TRON_ACCOUNT_ADDRESS}/transactions`))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        data: transactions,
        success: true,
        meta: { at: Date.now(), page_size: transactions.length },
      },
    }));
}

export async function mockExchangeRates(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
    .withQuery({ baseCurrency: 'usd' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        btc: {
          name: 'Bitcoin',
          ticker: 'btc',
          value: 0.0000110332638340689,
          currencyType: 'crypto',
        },
        usd: {
          name: 'US Dollar',
          ticker: 'usd',
          value: 1,
          currencyType: 'fiat',
        },
        sol: {
          name: 'Solana',
          ticker: 'sol',
          value: 0.00726932104339546,
          currencyType: 'crypto',
        },
        trx: {
          name: 'Tron',
          ticker: 'trx',
          value: 3.39334751010698,
          currencyType: 'crypto',
        },
      },
    }));
}

export async function mockFiatExchangeRates(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates/fiat')
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        usd: {
          name: 'US Dollar',
          ticker: 'usd',
          value: 1,
          currencyType: 'fiat',
        },
        eur: {
          name: 'Euro',
          ticker: 'eur',
          value: 0.858193994158645,
          currencyType: 'fiat',
        },
      },
    }));
}

export async function mockTronSpotPrices(
  mockServer: Mockttp,
  tronNode?: Pick<TronNode, 'trc10Tokens' | 'trc20Tokens'>,
): Promise<MockedEndpoint> {
  const trc10Assets = { ...DEFAULT_TRC10_ASSETS, ...tronNode?.trc10Tokens };
  const trc20Assets = { ...DEFAULT_TRC20_ASSETS, ...tronNode?.trc20Tokens };
  const htxAssetId = `tron:728126428/trc20:${trc20Assets.HTX.address}`;
  const seedAssetId = `tron:728126428/trc20:${trc20Assets.SEED.address}`;
  const usddAssetId = `tron:728126428/trc20:${trc20Assets.USDD.address}`;
  const usdtAssetId = `tron:728126428/trc20:${trc20Assets.USDT.address}`;
  const gasFreeAssetId = `tron:728126428/trc10:${trc10Assets.GAS_FREE.tokenId}`;
  const pricesByAssetId = {
    'tron:728126428/slip44:195': {
      id: 'tron',
      price: TRX_TO_USD_RATE,
      marketCap: 27908032838,
      allTimeHigh: 0.431288,
      allTimeLow: 0.00180434,
      totalVolume: 681456174,
      high1d: 0.298231,
      low1d: 0.294641,
      circulatingSupply: 94699702752.04857,
      dilutedMarketCap: 27908037090,
      marketCapPercentChange1d: -0.97531,
      priceChange1d: -0.003047860467726426,
      pricePercentChange1h: -0.15075140224689543,
      pricePercentChange1d: -1.0236731036599194,
      pricePercentChange7d: 3.655119648562475,
      pricePercentChange14d: 6.071878922562999,
      pricePercentChange30d: 4.476394163995479,
      pricePercentChange200d: 10.682232053374577,
      pricePercentChange1y: 16.823798348731327,
    },
    'tron:3448148188/slip44:195': null,
    'tron:2494104990/slip44:195': null,
    [gasFreeAssetId]: {
      id: 'gas-free-transfer-solution',
      price: 0.000_000_001,
      marketCap: 1_000_000,
      allTimeHigh: 0.01,
      allTimeLow: 0.0001,
      totalVolume: 10_000,
      high1d: 0.0011,
      low1d: 0.00099,
      circulatingSupply: 1_000_000_000,
      dilutedMarketCap: 1_000_000,
      marketCapPercentChange1d: 0,
      priceChange1d: 0,
      pricePercentChange1h: 0,
      pricePercentChange1d: 0,
      pricePercentChange7d: 0,
      pricePercentChange14d: 0,
      pricePercentChange30d: 0,
      pricePercentChange200d: 0,
      pricePercentChange1y: 0,
    },
    [seedAssetId]: {
      id: 'seed',
      price: 0.000_000_001,
      marketCap: 100_000,
      allTimeHigh: 0.001,
      allTimeLow: 0.00001,
      totalVolume: 1_000,
      high1d: 0.000105,
      low1d: 0.0000099,
      circulatingSupply: 1_000_000_000,
      dilutedMarketCap: 100_000,
      marketCapPercentChange1d: 0,
      priceChange1d: 0,
      pricePercentChange1h: 0,
      pricePercentChange1d: 0,
      pricePercentChange7d: 0,
      pricePercentChange14d: 0,
      pricePercentChange30d: 0,
      pricePercentChange200d: 0,
      pricePercentChange1y: 0,
    },
    [htxAssetId]: {
      id: 'htx-dao',
      price: 0.00000168,
      marketCap: 1564644183,
      allTimeHigh: 0.00000375,
      allTimeLow: 8.00816e-7,
      totalVolume: 8401090,
      high1d: 0.00000169,
      low1d: 0.00000168,
      circulatingSupply: 930149437822426.1,
      dilutedMarketCap: 1564644183,
      marketCapPercentChange1d: -0.24658,
      priceChange1d: -5.256468957e-9,
      pricePercentChange1h: -0.018039112904324334,
      pricePercentChange1d: -0.31163572893346203,
      pricePercentChange7d: 2.5024956056778302,
      pricePercentChange14d: 2.5292823808168077,
      pricePercentChange30d: 3.0195398109184906,
      pricePercentChange200d: 0.6818433770786526,
      pricePercentChange1y: -32.576284326979135,
    },
    [usdtAssetId]: {
      id: 'tether',
      price: 0.999176,
      marketCap: 186948908128,
      allTimeHigh: 1.32,
      allTimeLow: 0.572521,
      totalVolume: 82810499462,
      high1d: 0.999233,
      low1d: 0.99864,
      circulatingSupply: 187095381424.3697,
      dilutedMarketCap: 192411564831,
      marketCapPercentChange1d: 0.00738,
      priceChange1d: 0.0000249,
      pricePercentChange1h: 0.020930266600212476,
      pricePercentChange1d: 0.0024917010333802407,
      pricePercentChange7d: 0.0353800081960735,
      pricePercentChange14d: -0.02819624194849003,
      pricePercentChange30d: -0.11081103419080159,
      pricePercentChange200d: -0.09316658601991926,
      pricePercentChange1y: -0.18071863167121408,
    },
    [usddAssetId]: {
      id: 'usdd',
      price: 0.999959,
      marketCap: 850324158,
      allTimeHigh: 1.052,
      allTimeLow: 0.928067,
      totalVolume: 4965944,
      high1d: 1.001,
      low1d: 0.997736,
      circulatingSupply: 849721383,
      dilutedMarketCap: 855111059,
      marketCapPercentChange1d: -1.16704,
      priceChange1d: 0.00091697,
      pricePercentChange1h: 0.08168027068663826,
      pricePercentChange1d: 0.09178502072533638,
      pricePercentChange7d: 0.13273041638231686,
      pricePercentChange14d: 0.03518940190469397,
      pricePercentChange30d: -0.008525700123439886,
      pricePercentChange200d: -0.00280303064037531,
      pricePercentChange1y: 0.5583576483408966,
    },
  };

  return mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .always()
    .thenCallback((request) => {
      const assetIds = new URL(request.url).searchParams
        .get('assetIds')
        ?.split(',');
      const requestedPrices = Object.fromEntries(
        (assetIds ?? Object.keys(pricesByAssetId)).map((assetId) => [
          assetId,
          pricesByAssetId[assetId as keyof typeof pricesByAssetId] ?? null,
        ]),
      );

      return {
        statusCode: 200,
        json: requestedPrices,
      };
    });
}

export async function mockTrxNativeSpotPrices(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const trxPriceResponse = {
    'tron:728126428/slip44:195': {
      id: 'tron',
      price: TRX_TO_USD_RATE,
      marketCap: 27908032838,
      allTimeHigh: 0.431288,
      allTimeLow: 0.00180434,
      totalVolume: 681456174,
      high1d: 0.298231,
      low1d: 0.294641,
      circulatingSupply: 94699702752.04857,
      dilutedMarketCap: 27908037090,
      marketCapPercentChange1d: -0.97531,
      priceChange1d: -0.003047860467726426,
      pricePercentChange1h: -0.15075140224689543,
      pricePercentChange1d: -1.0236731036599194,
      pricePercentChange7d: 3.655119648562475,
      pricePercentChange14d: 6.071878922562999,
      pricePercentChange30d: 4.476394163995479,
      pricePercentChange200d: 10.682232053374577,
      pricePercentChange1y: 16.823798348731327,
    },
    'tron:3448148188/slip44:195': null,
    'tron:2494104990/slip44:195': null,
  };

  // Initial load: all three Tron chains bundled together
  const allChainsEndpoint = await mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .withQuery({
      vsCurrency: 'usd',
      assetIds:
        'tron:728126428/slip44:195,tron:3448148188/slip44:195,tron:2494104990/slip44:195',
      includeMarketData: 'true',
    })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: trxPriceResponse,
    }));

  // After switching to Tron network: single-chain refresh with cacheOnly=false
  const singleChainEndpoint = await mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .withQuery({
      assetIds: 'tron:728126428/slip44:195',
      vsCurrency: 'usd',
      includeMarketData: 'true',
    })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        'tron:728126428/slip44:195':
          trxPriceResponse['tron:728126428/slip44:195'],
      },
    }));

  return [allChainsEndpoint, singleChainEndpoint];
}

export async function mockTronAssets(
  mockServer: Mockttp,
  tronNode?: Pick<TronNode, 'trc10Tokens' | 'trc20Tokens'>,
): Promise<MockedEndpoint> {
  const trc10Assets = { ...DEFAULT_TRC10_ASSETS, ...tronNode?.trc10Tokens };
  const trc20Assets = { ...DEFAULT_TRC20_ASSETS, ...tronNode?.trc20Tokens };

  return mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        {
          assetId: `tron:728126428/trc20:${trc20Assets.USDT.address}`,
          decimals: trc20Assets.USDT.decimals,
          name: trc20Assets.USDT.name,
          symbol: trc20Assets.USDT.symbol,
        },
        {
          assetId: `tron:728126428/trc10:${trc10Assets.GAS_FREE.tokenId}`,
          decimals: trc10Assets.GAS_FREE.decimals,
          name: trc10Assets.GAS_FREE.name,
          symbol: trc10Assets.GAS_FREE.symbol,
        },
        {
          assetId: `tron:728126428/trc20:${trc20Assets.SEED.address}`,
          decimals: trc20Assets.SEED.decimals,
          name: trc20Assets.SEED.name,
          symbol: trc20Assets.SEED.symbol,
        },
        {
          assetId: `tron:728126428/trc20:${trc20Assets.USDD.address}`,
          decimals: trc20Assets.USDD.decimals,
          name: trc20Assets.USDD.name,
          symbol: trc20Assets.USDD.symbol,
        },
        {
          assetId: `tron:728126428/trc20:${trc20Assets.HTX.address}`,
          decimals: trc20Assets.HTX.decimals,
          name: trc20Assets.HTX.name,
          symbol: trc20Assets.HTX.symbol,
        },
      ],
    }));
}

export async function mockTronGetBlock(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forPost(tronInfuraUrl('/wallet/getblock'))
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        blockID:
          '0000000004b6f733ff89d72ddc1ce1eabd6045d84cbc4eb0a7e88d9223c12c5e',
        block_header: {
          raw_data: {
            number: 79099699,
            txTrieRoot:
              '82bee4864136cf3b1e8ca1f67dd8edba1cfcbf37169fd58d16e29223d5ec3425',
            witness_address: '4162398d516b555ac64af24416e05c199c01823048',
            parentHash:
              '0000000004b6f732a48af7041c4e68a8f472c8072ed98c4a8126bc6d01a9dd0b',
            version: 32,
            timestamp: 1767962214000,
          },
          witness_signature:
            'b93cc232e26d2a1751dbaea8985aac5bac9d64b2c644021e96343c14f59212eb359ff52a6d46464bf61d56275ea26e38f903ffc253fca4f55097d0824136271b00',
        },
      },
    }));
}

export async function mockBridgeGetTronQuoteFor(
  mockServer: Mockttp,
  fixture: TronQuoteFixture,
): Promise<MockedEndpoint> {
  const srcAsset = buildTronAsset(fixture.src);
  const destAsset = buildTronAsset(fixture.dest);
  const minDestTokenAmount = String(
    BigInt(fixture.destAmount) - BigInt(fixture.destAmount) / 50n, // 2% slippage floor
  );

  return mockServer
    .forGet(/^https:\/\/bridge\.(api|dev-api)\.cx\.metamask\.io\/getQuote/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        {
          quote: {
            bridgeId: 'rango',
            requestId: '0678810e-a081-4246-9ddb-483ccf2d999e',
            aggregator: 'rango',
            srcChainId: 728126428,
            srcTokenAmount: fixture.srcAmount,
            srcAsset,
            destChainId: 728126428,
            destTokenAmount: fixture.destAmount,
            destAsset,
            minDestTokenAmount,
            feeData: {
              metabridge: {
                amount: String(fixture.feeSun ?? 8_750),
                asset: buildTronAsset('TRX'),
                quoteBpsFee: 87.5,
                baseBpsFee: 87.5,
              },
            },
            bridges: ['sunswap (via Rango)'],
            protocols: ['sunswap (via Rango)'],
            steps: [
              {
                srcAsset,
                destAsset,
                srcAmount: fixture.srcAmount,
                destAmount: fixture.destAmount,
              },
            ],
          },
          trade: {
            chainId: 728126428,
            from: TRON_ACCOUNT_ADDRESS,
            value: fixture.src === 'TRX' ? fixture.srcAmount : '0',
            data: '0xdeadbeef',
            to: 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax', // SunSwap router
            gasLimit: 200_000,
          },
          estimatedProcessingTimeInSeconds: 30,
        },
      ],
    }));
}

const MOCK_TRON_TOKENS = [
  {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 'tron:728126428',
    assetId: 'tron:728126428/slip44:195',
    symbol: 'TRX',
    decimals: 6,
    name: 'Tron',
    aggregators: [],
    occurrences: 100,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/slip44/195.png',
    metadata: {},
  },
  {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    chainId: 'tron:728126428',
    assetId: 'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether',
    aggregators: ['coinGecko'],
    occurrences: 1,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t.png',
    metadata: {},
  },
  {
    address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
    chainId: 'tron:728126428',
    assetId: 'tron:728126428/trc20:TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
    symbol: 'USDC',
    decimals: 6,
    name: 'USDC',
    aggregators: ['coinGecko'],
    occurrences: 1,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/trc20/TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8.png',
    metadata: {},
  },
  {
    address: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
    chainId: 'tron:728126428',
    assetId: 'tron:728126428/trc20:TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
    symbol: 'USDD',
    decimals: 18,
    name: 'USDD',
    aggregators: ['coinGecko'],
    occurrences: 1,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/trc20/TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz.png',
    metadata: {},
  },
  {
    address: 'TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S',
    chainId: 'tron:728126428',
    assetId: 'tron:728126428/trc20:TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S',
    symbol: 'SUN',
    decimals: 18,
    name: 'Sun Token',
    aggregators: ['coinGecko'],
    occurrences: 1,
    iconUrl:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/trc20/TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S.png',
    metadata: {},
  },
];

export async function mockBridgeGetTronTokens(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  mockServer.forPost(/getTokens\/search/u).thenCallback(() => ({
    statusCode: 200,
    json: {
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
      data: MOCK_TRON_TOKENS,
    },
  }));

  return mockServer.forPost(/getTokens\/popular/u).thenCallback(() => ({
    statusCode: 200,
    json: MOCK_TRON_TOKENS,
  }));
}

// Backwards-compatible default for existing tests (1 TRX → ~0.295 USDT)
export async function mockBridgeGetTronQuote(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockBridgeGetTronQuoteFor(mockServer, {
    src: 'TRX',
    dest: 'USDT',
    srcAmount: '991250',
    destAmount: '294852',
    feeSun: 8_750,
  });
}

export async function mockBridgeGetTronQuoteEmpty(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(/^https:\/\/bridge\.(api|dev-api)\.cx\.metamask\.io\/getQuote/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: [],
    }));
}

export async function mockTronApis(
  mockServer: Mockttp,
  mockZeroBalance?: boolean,
): Promise<MockedEndpoint[]> {
  return [
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
    await mockTronFeatureFlags(mockServer),
    await mockTronGetBlock(mockServer),
    await mockTronGetAccount(mockServer, mockZeroBalance),
    await mockTronGetAccountResource(mockServer),
    await mockTronGetTrc20Transactions(mockServer),
    await mockTronGetTransactions(mockServer),
    await mockExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockTronSpotPrices(mockServer),
    await mockTronAssets(mockServer),
    await mockBroadTransaction(mockServer),
  ];
}

export async function mockTronSwapApis(
  mockServer: Mockttp,
  mockZeroBalance?: boolean,
): Promise<MockedEndpoint[]> {
  return [
    ...(await mockTronApis(mockServer, mockZeroBalance)),
    await mockBridgeGetTronTokens(mockServer),
    await mockBridgeGetTronQuote(mockServer),
  ];
}

export async function mockTronSwapApisNoQuotes(
  mockServer: Mockttp,
  mockZeroBalance?: boolean,
): Promise<MockedEndpoint[]> {
  return [
    ...(await mockTronApis(mockServer, mockZeroBalance)),
    await mockBridgeGetTronTokens(mockServer),
    await mockBridgeGetTronQuoteEmpty(mockServer),
  ];
}
