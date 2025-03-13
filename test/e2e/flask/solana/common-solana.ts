import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import FixtureBuilder from '../../fixture-builder';
import { ACCOUNT_TYPE } from '../../constants';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

const SOLANA_URL_REGEX =
  /^https:\/\/(solana-mainnet\.infura\.io|api\.devnet\.solana\.com)/u;
// const SOLANA_RPC_PROVIDER = 'https://api.devnet.solana.com/';
const SOLANA_SPOT_PRICE_API =
  /^https:\/\/price\.(uat-api|api)\.cx\.metamask\.io\/v[1-9]\/spot-prices/u;
const SOLANA_EXCHANGE_RATES_PRICE_API =
  /^https:\/\/price\.(uat-api|api)\.cx\.metamask\.io\/v[1-9]\/exchange-rates\/fiat/u;
const SOLANA_STATIC_TOKEN_IMAGE_REGEX =
  /^https:\/\/static\.cx\.metamask\.io\/api\/v2\/tokenIcons\//u;
const SOLANA_BITCOIN_MIN_API =
  /^https:\/\/min-api\.cryptocompare\.com\/data\/pricemulti\?fsyms=btc/u;
export const SOLANA_TOKEN_API =
  /^https:\/\/tokens\.(uat-api|api)\.cx\.metamask\.io\/v3\/assets/u;
export const METAMASK_PHISHING_DETECTION_API =
  /^https:\/\/phishing-detection\.api\.cx\.metamask\.io\/$/u;
export const METAMASK_CLIENT_SIDE_DETECTION_REGEX =
  /^https:\/\/client-side-detection\.api\.cx\.metamask\.io\/$/u;

export enum SendFlowPlaceHolders {
  AMOUNT = 'Enter amount to send',
  RECIPIENT = 'Enter receiving address',
  LOADING = 'Preparing transaction',
}

export const SIMPLEHASH_URL = 'https://api.simplehash.com';

export const SOL_BALANCE = 50000000000;

export const SOL_TO_USD_RATE = 225.88;

export const USD_BALANCE = SOL_BALANCE * SOL_TO_USD_RATE;

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const commonSolanaAddress =
  '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c';

export const commonSolanaTxConfirmedDetailsFixture = {
  status: 'Confirmed',
  amount: '0.00708 SOL',
  networkFee: '0.000005 SOL',
  fromAddress: 'HH9ZzgQvSVmznKcRfwHuEphuxk7zU5f92CkXFDQfVJcq',
  toAddress: 'AL9Z5JgZdeCKnaYg6jduy9PQGzo3moo7vZYVSTJwnSEq',
  txHash:
    '3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr',
};

export async function mockClientSideDetectionApi(mockServer: Mockttp) {
  return await mockServer
    .forPost(METAMASK_CLIENT_SIDE_DETECTION_REGEX)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          recentlyAdded: [
            '4479785186623bfab0f5cb3ab40c5ea69722ff7a3a37e82f48a8b7704bc1e5c9',
            '102979a759f49e65e27d610f8daf54f1f17e78d8cc7f32526ba04b36c372af0b',
          ],
          recentlyRemoved: [],
          lastFetchedAt: '2025-02-18T11:08:02Z',
        },
      };
    });
}

export async function mockPhishingDetectionApi(mockServer: Mockttp) {
  console.log('mockPhishingDetectionApi');
  return await mockServer
    .forPost(METAMASK_PHISHING_DETECTION_API)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [],
      };
    });
}

export async function mockPriceApiSpotPrice(mockServer: Mockttp) {
  console.log('mockPriceApiSpotPrice');
  const response = {
    statusCode: 200,
    json: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
        usd: 198.42,
      },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv':
        {
          usd: 0.01157283,
        },
    },
  };
  return await mockServer.forGet(SOLANA_SPOT_PRICE_API).thenCallback(() => {
    return response;
  });
}

export async function mockPriceApiExchangeRates(mockServer: Mockttp) {
  console.log('mockPriceApiExchangeRates');
  const response = {
    statusCode: 200,
    json: {
      usd: {
        name: 'US Dollar',
        ticker: 'usd',
        value: 1,
        currencyType: 'fiat',
      },
      aed: {
        name: 'United Arab Emirates Dirham',
        ticker: 'aed',
        value: 3.6730000002306573,
        currencyType: 'fiat',
      },
      ars: {
        name: 'Argentine Peso',
        ticker: 'ars',
        value: 1058.4054021781933,
        currencyType: 'fiat',
      },
      aud: {
        name: 'Australian Dollar',
        ticker: 'aud',
        value: 1.573687992967399,
        currencyType: 'fiat',
      },
      bdt: {
        name: 'Bangladeshi Taka',
        ticker: 'bdt',
        value: 121.5906632459838,
        currencyType: 'fiat',
      },
      bhd: {
        name: 'Bahraini Dinar',
        ticker: 'bhd',
        value: 0.37682599749175366,
        currencyType: 'fiat',
      },
      bmd: {
        name: 'Bermudian Dollar',
        ticker: 'bmd',
        value: 1,
        currencyType: 'fiat',
      },
      brl: {
        name: 'Brazil Real',
        ticker: 'brl',
        value: 5.681400008593015,
        currencyType: 'fiat',
      },
      cad: {
        name: 'Canadian Dollar',
        ticker: 'cad',
        value: 1.4190170021979291,
        currencyType: 'fiat',
      },
      chf: {
        name: 'Swiss Franc',
        ticker: 'chf',
        value: 0.9018210001016359,
        currencyType: 'fiat',
      },
      clp: {
        name: 'Chilean Peso',
        ticker: 'clp',
        value: 950.9800019576477,
        currencyType: 'fiat',
      },
      cny: {
        name: 'Chinese Yuan',
        ticker: 'cny',
        value: 7.28000000964565,
        currencyType: 'fiat',
      },
      czk: {
        name: 'Czech Koruna',
        ticker: 'czk',
        value: 23.98077804452193,
        currencyType: 'fiat',
      },
      dkk: {
        name: 'Danish Krone',
        ticker: 'dkk',
        value: 7.132778008120085,
        currencyType: 'fiat',
      },
      eur: {
        name: 'Euro',
        ticker: 'eur',
        value: 0.9563709966805755,
        currencyType: 'fiat',
      },
      gbp: {
        name: 'British Pound Sterling',
        ticker: 'gbp',
        value: 0.7925789957213786,
        currencyType: 'fiat',
      },
      gel: {
        name: 'Georgian Lari',
        ticker: 'gel',
        value: 2.8250000057664213,
        currencyType: 'fiat',
      },
      hkd: {
        name: 'Hong Kong Dollar',
        ticker: 'hkd',
        value: 7.7757990146885,
        currencyType: 'fiat',
      },
      huf: {
        name: 'Hungarian Forint',
        ticker: 'huf',
        value: 383.5511237884304,
        currencyType: 'fiat',
      },
      idr: {
        name: 'Indonesian Rupiah',
        ticker: 'idr',
        value: 16309.621295575147,
        currencyType: 'fiat',
      },
      ils: {
        name: 'Israeli New Shekel',
        ticker: 'ils',
        value: 3.5515449992726973,
        currencyType: 'fiat',
      },
      inr: {
        name: 'Indian Rupee',
        ticker: 'inr',
        value: 86.90204417107836,
        currencyType: 'fiat',
      },
      jpy: {
        name: 'Japanese Yen',
        ticker: 'jpy',
        value: 151.59810030397847,
        currencyType: 'fiat',
      },
      krw: {
        name: 'South Korean Won',
        ticker: 'krw',
        value: 1441.0473569630362,
        currencyType: 'fiat',
      },
      kwd: {
        name: 'Kuwaiti Dinar',
        ticker: 'kwd',
        value: 0.30863599337494846,
        currencyType: 'fiat',
      },
      lkr: {
        name: 'Sri Lankan Rupee',
        ticker: 'lkr',
        value: 296.3533776014134,
        currencyType: 'fiat',
      },
      mmk: {
        name: 'Burmese Kyat',
        ticker: 'mmk',
        value: 2098.0000043195737,
        currencyType: 'fiat',
      },
      mxn: {
        name: 'Mexican Peso',
        ticker: 'mxn',
        value: 20.280359037500883,
        currencyType: 'fiat',
      },
      myr: {
        name: 'Malaysian Ringgit',
        ticker: 'myr',
        value: 4.445500003533244,
        currencyType: 'fiat',
      },
      ngn: {
        name: 'Nigerian Naira',
        ticker: 'ngn',
        value: 1505.6100030985604,
        currencyType: 'fiat',
      },
      nok: {
        name: 'Norwegian Krone',
        ticker: 'nok',
        value: 11.145146016578398,
        currencyType: 'fiat',
      },
      nzd: {
        name: 'New Zealand Dollar',
        ticker: 'nzd',
        value: 1.7526639973799063,
        currencyType: 'fiat',
      },
      php: {
        name: 'Philippine Peso',
        ticker: 'php',
        value: 58.170502112470665,
        currencyType: 'fiat',
      },
      pkr: {
        name: 'Pakistani Rupee',
        ticker: 'pkr',
        value: 279.5921655664021,
        currencyType: 'fiat',
      },
      pln: {
        name: 'Polish Zloty',
        ticker: 'pln',
        value: 3.976559005909282,
        currencyType: 'fiat',
      },
      rub: {
        name: 'Russian Ruble',
        ticker: 'rub',
        value: 91.94870918456455,
        currencyType: 'fiat',
      },
      sar: {
        name: 'Saudi Riyal',
        ticker: 'sar',
        value: 3.7503770033621175,
        currencyType: 'fiat',
      },
      sek: {
        name: 'Swedish Krona',
        ticker: 'sek',
        value: 10.7121080141656,
        currencyType: 'fiat',
      },
      sgd: {
        name: 'Singapore Dollar',
        ticker: 'sgd',
        value: 1.3419719981338605,
        currencyType: 'fiat',
      },
      thb: {
        name: 'Thai Baht',
        ticker: 'thb',
        value: 33.65200006844218,
        currencyType: 'fiat',
      },
      try: {
        name: 'Turkish Lira',
        ticker: 'try',
        value: 36.27049707366716,
        currencyType: 'fiat',
      },
      twd: {
        name: 'New Taiwan Dollar',
        ticker: 'twd',
        value: 32.737001066452386,
        currencyType: 'fiat',
      },
      uah: {
        name: 'Ukrainian hryvnia',
        ticker: 'uah',
        value: 41.63396008248541,
        currencyType: 'fiat',
      },
      vef: {
        name: 'Venezuelan bolívar fuerte',
        ticker: 'vef',
        value: 0.10012998980727426,
        currencyType: 'fiat',
      },
      vnd: {
        name: 'Vietnamese đồng',
        ticker: 'vnd',
        value: 25519.98978853863,
        currencyType: 'fiat',
      },
      zar: {
        name: 'South African Rand',
        ticker: 'zar',
        value: 18.43090003368219,
        currencyType: 'fiat',
      },
      xdr: {
        name: 'IMF Special Drawing Rights',
        ticker: 'xdr',
        value: 0.7636459993734942,
        currencyType: 'fiat',
      },
    },
  };
  return await mockServer
    .forGet(SOLANA_EXCHANGE_RATES_PRICE_API)
    .thenCallback(() => {
      return response;
    });
}

export async function mockStaticMetamaskTokenIcon(mockServer: Mockttp) {
  console.log('mockStaticMetamaskTokenIcon');
  return await mockServer
    .forGet(SOLANA_STATIC_TOKEN_IMAGE_REGEX)
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

export async function mockTokenApi(mockServer: Mockttp) {
  console.log('mockTokenApi');
  const response = {
    statusCode: 200,
    json: {
      decimals: 6,
      assetId:
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
      name: 'PUMPKIN',
      symbol: 'PKIN',
    },
  };
  return await mockServer.forGet(SOLANA_TOKEN_API).thenCallback(() => {
    return response;
  });
}

export async function mockMultiCoinPrice(mockServer: Mockttp) {
  return await mockServer.forGet(SOLANA_BITCOIN_MIN_API).thenCallback(() => {
    return {
      statusCode: 200,
      json: {
        BTC: {
          USD: 96155.06,
        },
        SOL: {
          USD: 180.5,
        },
      },
    };
  });
}

export async function mockSolanaBalanceQuote(
  mockServer: Mockttp,
  mockZeroBalance: boolean = false,
) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          apiVersion: '2.0.18',
          slot: 308460925,
        },
        value: mockZeroBalance ? 0 : SOL_BALANCE,
      },
      id: 1337,
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'getBalance',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockFungibleAssets(mockServer: Mockttp) {
  return await mockServer
    .forGet(`${SIMPLEHASH_URL}/api/v0/fungibles/assets`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          fungible_id: 'solana.2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
          name: 'PUMPKIN',
          symbol: 'PKIN',
          decimals: 6,
          chain: 'solana',
          previews: {
            image_small_url: '',
            image_medium_url: '',
            image_large_url: '',
            image_opengraph_url: '',
            blurhash: 'U=Io~ufQ9_jtJTfQsTfQ0*fQ$$fQ#nfQX7fQ',
            predominant_color: '#fb9f18',
          },
          image_url: '',
          image_properties: {
            width: 1024,
            height: 1024,
            size: 338371,
            mime_type: 'image/png',
            exif_orientation: null,
          },
          created_date: '2025-01-28T17:40:25Z',
          created_by: '85c4VNwMhWtj5ygDgRjs2scmYRGetFeSf7RYNjtPErq1',
          supply: '1000011299680610',
          holder_count: 21675,
          extra_metadata: {
            twitter: '',
            telegram: '',
            is_mutable: true,
            creators: [
              {
                address: '85c4VNwMhWtj5ygDgRjs2scmYRGetFeSf7RYNjtPErq1',
                verified: true,
                share: 100,
              },
            ],
            token_program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            extensions: [],
            image_original_url: '',
            animation_original_url: null,
            metadata_original_url: '',
          },
        },
      };
    });
}

export async function simulateSolanaTransaction(
  mockServer: Mockttp,
  isNative: boolean = true,
) {
  const response = isNative
    ? {
        statusCode: 200,
        json: {
          result: {
            context: {
              apiVersion: '2.0.21',
              slot: 318191894,
            },
            value: {
              accounts: null,
              err: null,
              innerInstructions: null,
              logs: [
                'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
                'Program log: Instruction: Transfer',
                'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 1400000 compute units',
                'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
                'Program ComputeBudget111111111111111111111111111111 invoke [1]',
                'Program ComputeBudget111111111111111111111111111111 success',
              ],
              replacementBlockhash: {
                blockhash: '2xWVC3snr4U29m8Rhio9HMmPaYNAQPrRn1bXjB1BJFuM',
                lastValidBlockHeight: 296475563,
              },
              returnData: null,
              unitsConsumed: 4794,
            },
            id: 1337,
          },
        },
      }
    : {
        statusCode: 200,
        json: {
          result: {
            value: {
              accounts: null,
              err: null,
              innerInstructions: null,
              logs: [
                'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
                'Program log: Instruction: Transfer',
                'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 1400000 compute units',
                'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
                'Program ComputeBudget111111111111111111111111111111 invoke [1]',
                'Program ComputeBudget111111111111111111111111111111 success',
              ],
              replacementBlockhash: {
                blockhash: '8geweh6EzwMCZBSwPuPjY7mUSC9YePtvRJ42dcsrGyRj',
                lastValidBlockHeight: 295648133,
              },
              returnData: null,
              unitsConsumed: 4794,
            },
          },
        },
      };
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'simulateTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}
export async function mockGetFailedTransaction(mockServer: Mockttp) {
  console.log('mockGetFailedTransaction');
  const response = {
    statusCode: 200,
    json: {
      result: {
        blockTime: 1739988764,
        meta: {
          computeUnitsConsumed: 227081,
          err: {
            InstructionError: [6, 'ProgramFailedToComplete'],
          },
          fee: 5003,
          innerInstructions: [
            {
              index: 6,
              instructions: [
                {
                  accounts: [
                    24, 32, 25, 26, 1, 2, 30, 28, 27, 32, 0, 29, 29, 33, 32, 4,
                    5, 6,
                  ],
                  data: 'PgQWtn8oziwv4wjywURrfSUpN2afyjR5h',
                  programIdIndex: 32,
                  stackHeight: 2,
                },
                {
                  accounts: [1, 28, 26, 0],
                  data: 'geX9xF4vG8SRn',
                  programIdIndex: 29,
                  stackHeight: 3,
                },
                {
                  accounts: [25, 30, 2, 24],
                  data: 'iQbm5aGXcxE2q',
                  programIdIndex: 29,
                  stackHeight: 3,
                },
                {
                  accounts: [33],
                  data: 'yCGxBopjnVNQkNP5usq1Poz4fRguySgsQmFH4UH3WnybnnKLMv4E31ZgcviiVVBcdfGH9CKN1QJU2sGMDjSL2BMngeWNEuZYV2pntb9tQCA4bAj2h9auc55vN4spYstjhyVHhbVVEdMguD2c8hS718SW5Cs3cL7wcVJgN4R6B7f172DL8guGbHgggrWHtkb31aqgVV',
                  programIdIndex: 32,
                  stackHeight: 3,
                },
                {
                  accounts: [14],
                  data: 'QMqFu4fYGGeUEysFnenhAvBobXTzswhLdvQq6s8axxcbKUPRksm2543pJNNNHVd1VJ58FCg7NVh9cMuPYiMKNyfUpUXSDci9arMkqVwgC1zp8zDJwW7pyDP9b5cYa5qw53EeE5G8kdfjFeQwWaSmPrybVSiwipxHWP5ipHGTNnrUbod',
                  programIdIndex: 13,
                  stackHeight: 2,
                },
                {
                  accounts: [
                    15, 32, 16, 17, 2, 3, 31, 30, 18, 32, 0, 29, 29, 33, 32, 19,
                  ],
                  data: 'PgQWtn8ozixD9F2rzgmrRy83iHAQSKhno',
                  programIdIndex: 32,
                  stackHeight: 2,
                },
                {
                  accounts: [2, 30, 17, 0],
                  data: 'iQbm5aGXcxE2q',
                  programIdIndex: 29,
                  stackHeight: 3,
                },
                {
                  accounts: [16, 31, 3, 15],
                  data: 'jEX4PcL3MYVoN',
                  programIdIndex: 29,
                  stackHeight: 3,
                },
                {
                  accounts: [33],
                  data: 'yCGxBopjnVNQkNP5usq1PnieAT94qLJpXa7U5hQkqcasRRm8PypkFAXYpuQGWQAoTxcq1bAZrnBrU784NtdfP6EpvkxuNJ6oaWAnRT6a87P3VcuyXHTeeYtN78WZ5Y2YgyezMPkdTThHhms9dCo3rFchirvKRkbTvZhaXbMvMrzz7gRZP5DStrrEAbjHtp8cdKyWFZ',
                  programIdIndex: 32,
                  stackHeight: 3,
                },
                {
                  accounts: [14],
                  data: 'QMqFu4fYGGeUEysFnenhAvBobXTzswhLdvQq6s8axxcbKUPRksm2543pJNNNHVd1VJwXfcUWQEHusMZ55Vd8C9CLFM5Wg9RwxshnjoSxBQonfjBTF9DYwGyEnAnKT6FoERcF8QDWA2psNoVS9PWDLncAJNG4bgXBc2NQoBSm5mxV2xP',
                  programIdIndex: 13,
                  stackHeight: 2,
                },
                {
                  accounts: [
                    20, 32, 21, 22, 3, 1, 31, 28, 23, 32, 0, 29, 29, 33, 32, 7,
                    8, 9,
                  ],
                  data: 'PgQWtn8ozixMA7i75HkXhsJ6xryM1VG3H',
                  programIdIndex: 32,
                  stackHeight: 2,
                },
                {
                  accounts: [3, 31, 21, 0],
                  data: 'jEX4PcL3MYVoN',
                  programIdIndex: 29,
                  stackHeight: 3,
                },
                {
                  accounts: [22, 28, 1, 20],
                  data: 'gzSGobBbETi3r',
                  programIdIndex: 29,
                  stackHeight: 3,
                },
                {
                  accounts: [33],
                  data: 'yCGxBopjnVNQkNP5usq1Pov6GJuCoryx81NaK44ZYA3PaVLCYuN6xV4Ew7eNzQ39FF8zgnQFCeARbJ7AVTLD5XgiEbMqMQnBmYA3JfmpmA83yXNWT2Jk71eyjkv2HnM9s2kgNbHGjkx8DrNaQBjKrx89Rnze2qCpDZjRvnn2mmHR8fAV826kLzY7ifBRLNXnQVfQij',
                  programIdIndex: 32,
                  stackHeight: 3,
                },
                {
                  accounts: [14],
                  data: 'QMqFu4fYGGeUEysFnenhAvBobXTzswhLdvQq6s8axxcbKUPRksm2543pJNNNHVd1VKMQxCUWZtjhztwssiahZW5QRwrQ9AZP1GpjxfNbrheNNgSZSoWNdzCeXo4HbeAxfB9UkFNT26YXZmkQbpve8ATHJynLE2hp2zzz9fhqgqevi9M',
                  programIdIndex: 13,
                  stackHeight: 2,
                },
              ],
            },
          ],
          loadedAddresses: {
            readonly: [
              'So11111111111111111111111111111111111111112',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
              '9McvH6w97oewLmPxqQEoHUAv3u5iYMyQ9AeZZhguYf1T',
              'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
              'D1ZN9Wj1fRSUQfCjhvnu1hqDMT7hzjzBBpi12nVniYD6',
            ],
            writable: [
              '29reKMpP4V3czq4nCyHcT1xtaLbajXoMdULge8spA4jF',
              'EDY2fMWABHRNkaWy9LkfoQumJLN1y3RJY4UYnupt1FE4',
              'B3PDScDob59VGqQ5uk7V3ykRwermmAms6kaEJh6TQXFM',
              'Ff7oak29LVz2AFt93TSxU5npcBYS4T35CEsBH2XtgPM1',
              '45AwfA9GQ1Vt5bFowhJPX9sSGHqVELpEEhPZ1cWh2eC2',
              'CW65UBkNMFDYGy2jZBenxihs9Gqh6y6opTDzS8txxyAK',
              '6UabcCKafVh29VZknaMQduf8SXiamaXxDUiZty2gfw5B',
              'G2LeRmQbTUFrLXhWJPPUpSx28eVkd7iHg1GyGC6MNAFJ',
              'FicnHXkPCPjuctuxLZH23BjzcN4Zsa5CNHtpXf64CdZS',
              'D6RL6sWrs6khn7AfEyS6dsqqiiqAh4hXC83JtcmEUf6D',
              '3MNsvVWUNVM67aGMKMzBgcMKhvc9HsNdwz2RaKHwwEv4',
              '2x3UPXgacTTQp45bvx7UbXuHjrwa4J9jfAE8HB2YdjgU',
              'B44GzRdUq48vBUbppeWxV51PtC7P25U6YA3GDuMqpGdW',
            ],
          },
          logMessages: [
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
            'Program log: CreateIdempotent',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 4339 of 226781 compute units',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
            'Program log: CreateIdempotent',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 4338 of 222442 compute units',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
            'Program log: CreateIdempotent',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 4338 of 218104 compute units',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
            'Program log: CreateIdempotent',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 4339 of 213766 compute units',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx invoke [1]',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo invoke [2]',
            'Program log: Instruction: Swap',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6238 of 160377 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6147 of 150705 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo invoke [3]',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo consumed 2134 of 141124 compute units',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo success',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo consumed 63909 of 201331 compute units',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo success',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx invoke [2]',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx consumed 182 of 135690 compute units',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx success',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo invoke [2]',
            'Program log: Instruction: Swap',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6147 of 90588 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 81007 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo invoke [3]',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo consumed 2134 of 71400 compute units',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo success',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo consumed 62873 of 130639 compute units',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo success',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx invoke [2]',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx consumed 182 of 66034 compute units',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx success',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo invoke [2]',
            'Program log: Instruction: Swap',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 24780 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6238 of 15174 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo invoke [3]',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo consumed 2134 of 5505 compute units',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo success',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo consumed 58872 of 60675 compute units',
            'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo success',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx invoke [2]',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx consumed 71 of 71 compute units',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx failed: exceeded CUs meter at BPF instruction',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx consumed 209427 of 209427 compute units',
            'Program JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx failed: Program failed to complete',
          ],
          postBalances: [
            2214757471, 24524198861, 2039280, 2039280, 71437440, 71437440,
            71437440, 71437440, 71437440, 71437440, 1, 731913600, 1, 1141440, 0,
            7182720, 2039280, 2039280, 23385600, 71437440, 7282720, 2039280,
            296172641647, 23385600, 7182721, 2039280, 45847462984, 23385600,
            959143176713, 934087680, 1335629455120, 27971524604, 1141440,
            4000000,
          ],
          postTokenBalances: [
            {
              accountIndex: 1,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 's3zTLVvDbrBzbQ36sr2Z4xrzpRHFv3noWChbNi6vcjr',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '24522159581',
                decimals: 9,
                uiAmount: 24.522159581,
                uiAmountString: '24.522159581',
              },
            },
            {
              accountIndex: 2,
              mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
              owner: 's3zTLVvDbrBzbQ36sr2Z4xrzpRHFv3noWChbNi6vcjr',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '0',
                decimals: 6,
                uiAmount: null,
                uiAmountString: '0',
              },
            },
            {
              accountIndex: 3,
              mint: '9McvH6w97oewLmPxqQEoHUAv3u5iYMyQ9AeZZhguYf1T',
              owner: 's3zTLVvDbrBzbQ36sr2Z4xrzpRHFv3noWChbNi6vcjr',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '0',
                decimals: 9,
                uiAmount: null,
                uiAmountString: '0',
              },
            },
            {
              accountIndex: 16,
              mint: '9McvH6w97oewLmPxqQEoHUAv3u5iYMyQ9AeZZhguYf1T',
              owner: '29reKMpP4V3czq4nCyHcT1xtaLbajXoMdULge8spA4jF',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '2636762152',
                decimals: 9,
                uiAmount: 2.636762152,
                uiAmountString: '2.636762152',
              },
            },
            {
              accountIndex: 17,
              mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
              owner: '29reKMpP4V3czq4nCyHcT1xtaLbajXoMdULge8spA4jF',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '7264154',
                decimals: 6,
                uiAmount: 7.264154,
                uiAmountString: '7.264154',
              },
            },
            {
              accountIndex: 21,
              mint: '9McvH6w97oewLmPxqQEoHUAv3u5iYMyQ9AeZZhguYf1T',
              owner: 'CW65UBkNMFDYGy2jZBenxihs9Gqh6y6opTDzS8txxyAK',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '8191355381419',
                decimals: 9,
                uiAmount: 8191.355381419,
                uiAmountString: '8191.355381419',
              },
            },
            {
              accountIndex: 22,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'CW65UBkNMFDYGy2jZBenxihs9Gqh6y6opTDzS8txxyAK',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '296170602367',
                decimals: 9,
                uiAmount: 296.170602367,
                uiAmountString: '296.170602367',
              },
            },
            {
              accountIndex: 25,
              mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
              owner: 'D6RL6sWrs6khn7AfEyS6dsqqiiqAh4hXC83JtcmEUf6D',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '884477775',
                decimals: 6,
                uiAmount: 884.477775,
                uiAmountString: '884.477775',
              },
            },
            {
              accountIndex: 26,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'D6RL6sWrs6khn7AfEyS6dsqqiiqAh4hXC83JtcmEUf6D',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '45845423703',
                decimals: 9,
                uiAmount: 45.845423703,
                uiAmountString: '45.845423703',
              },
            },
          ],
          preBalances: [
            2214762474, 24524198861, 2039280, 2039280, 71437440, 71437440,
            71437440, 71437440, 71437440, 71437440, 1, 731913600, 1, 1141440, 0,
            7182720, 2039280, 2039280, 23385600, 71437440, 7282720, 2039280,
            296172641647, 23385600, 7182721, 2039280, 45847462984, 23385600,
            959143176713, 934087680, 1335629455120, 27971524604, 1141440,
            4000000,
          ],
          preTokenBalances: [
            {
              accountIndex: 1,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 's3zTLVvDbrBzbQ36sr2Z4xrzpRHFv3noWChbNi6vcjr',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '24522159581',
                decimals: 9,
                uiAmount: 24.522159581,
                uiAmountString: '24.522159581',
              },
            },
            {
              accountIndex: 2,
              mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
              owner: 's3zTLVvDbrBzbQ36sr2Z4xrzpRHFv3noWChbNi6vcjr',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '0',
                decimals: 6,
                uiAmount: null,
                uiAmountString: '0',
              },
            },
            {
              accountIndex: 3,
              mint: '9McvH6w97oewLmPxqQEoHUAv3u5iYMyQ9AeZZhguYf1T',
              owner: 's3zTLVvDbrBzbQ36sr2Z4xrzpRHFv3noWChbNi6vcjr',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '0',
                decimals: 9,
                uiAmount: null,
                uiAmountString: '0',
              },
            },
            {
              accountIndex: 16,
              mint: '9McvH6w97oewLmPxqQEoHUAv3u5iYMyQ9AeZZhguYf1T',
              owner: '29reKMpP4V3czq4nCyHcT1xtaLbajXoMdULge8spA4jF',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '2636762152',
                decimals: 9,
                uiAmount: 2.636762152,
                uiAmountString: '2.636762152',
              },
            },
            {
              accountIndex: 17,
              mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
              owner: '29reKMpP4V3czq4nCyHcT1xtaLbajXoMdULge8spA4jF',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '7264154',
                decimals: 6,
                uiAmount: 7.264154,
                uiAmountString: '7.264154',
              },
            },
            {
              accountIndex: 21,
              mint: '9McvH6w97oewLmPxqQEoHUAv3u5iYMyQ9AeZZhguYf1T',
              owner: 'CW65UBkNMFDYGy2jZBenxihs9Gqh6y6opTDzS8txxyAK',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '8191355381419',
                decimals: 9,
                uiAmount: 8191.355381419,
                uiAmountString: '8191.355381419',
              },
            },
            {
              accountIndex: 22,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'CW65UBkNMFDYGy2jZBenxihs9Gqh6y6opTDzS8txxyAK',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '296170602367',
                decimals: 9,
                uiAmount: 296.170602367,
                uiAmountString: '296.170602367',
              },
            },
            {
              accountIndex: 25,
              mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
              owner: 'D6RL6sWrs6khn7AfEyS6dsqqiiqAh4hXC83JtcmEUf6D',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '884477775',
                decimals: 6,
                uiAmount: 884.477775,
                uiAmountString: '884.477775',
              },
            },
            {
              accountIndex: 26,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'D6RL6sWrs6khn7AfEyS6dsqqiiqAh4hXC83JtcmEUf6D',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '45845423703',
                decimals: 9,
                uiAmount: 45.845423703,
                uiAmountString: '45.845423703',
              },
            },
          ],
          rewards: [],
          status: {
            Err: {
              InstructionError: [6, 'ProgramFailedToComplete'],
            },
          },
        },
        slot: 321739724,
        transaction: {
          message: {
            accountKeys: [
              's3zTLVvDbrBzbQ36sr2Z4xrzpRHFv3noWChbNi6vcjr',
              '6sBssU2T4xhaw95q1i48pjSDTwDC45u3eTZAkK5CKNYQ',
              'AskK3y8NKwhczpG72ZKAwuPAqUQWr51frfabf8gXv4YV',
              'C2m8gz92gHGS32o38LXrMa9NheNb1pxsWadjEqY6jdpn',
              '42ECGwTnCe22gmzVQw5AD4vmEJp42u2HiFBP6XnC7SSi',
              '5nBajSNFtR62AFLYqaU4TYwnDWBduPTUAvFY3tqJ3MCd',
              '2TvN137JoQgwjWtuaAp6fwLyhVDNt9PHoaHRgEXgcDw8',
              'GwTbrnsugAQrLa3xbZrknyGiTUD9vjfoZW78oFAnQVVg',
              'DC2ZjAA1z85HfDGcurc1tppH5nETCUGMgvG1Nr9QKduz',
              '7no6QTSVJoHm286jnESCP26a7UR4QuZ8rQdZhQQEFVN4',
              'ComputeBudget111111111111111111111111111111',
              'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
              '11111111111111111111111111111111',
              'JUPSjgjMFjU4453KMgxhqVmzep6W352bQpE4RsNqXAx',
              '8J2QTzGjsgb49at66wyA48o7s2zZeRtxfASsBDe2TnEd',
            ],
            addressTableLookups: [
              {
                accountKey: '4ynUVUKW68eEy7WKP7TmwbnR7tmnws8Cqk91u7VU7kfr',
                readonlyIndexes: [30, 8, 224, 223, 4, 9],
                writableIndexes: [226, 220, 221, 217, 216],
              },
              {
                accountKey: 'APBx2HjiMVeVoMxVuihdhUzHMY9VjxezgbWSX6VBtENA',
                readonlyIndexes: [],
                writableIndexes: [207, 208, 122, 125],
              },
              {
                accountKey: '9YbkrJysYz7rPQKCWTbZwUsqjZ8epZWLPLskP7BxNgsk',
                readonlyIndexes: [],
                writableIndexes: [64, 60, 66, 61],
              },
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 5,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [],
                data: 'EL6XMh',
                programIdIndex: 10,
                stackHeight: null,
              },
              {
                accounts: [],
                data: '3FTyfrdhjHgT',
                programIdIndex: 10,
                stackHeight: null,
              },
              {
                accounts: [0, 1, 0, 28, 12, 29],
                data: '2',
                programIdIndex: 11,
                stackHeight: null,
              },
              {
                accounts: [0, 2, 0, 30, 12, 29],
                data: '2',
                programIdIndex: 11,
                stackHeight: null,
              },
              {
                accounts: [0, 3, 0, 31, 12, 29],
                data: '2',
                programIdIndex: 11,
                stackHeight: null,
              },
              {
                accounts: [0, 1, 0, 28, 12, 29],
                data: '2',
                programIdIndex: 11,
                stackHeight: null,
              },
              {
                accounts: [
                  29, 0, 1, 3, 13, 31, 13, 14, 13, 32, 24, 32, 25, 26, 1, 2, 30,
                  28, 27, 32, 0, 29, 29, 33, 32, 4, 5, 6, 13, 32, 15, 32, 16,
                  17, 2, 3, 31, 30, 18, 32, 0, 29, 29, 33, 32, 19, 13, 32, 20,
                  32, 21, 22, 3, 1, 31, 28, 23, 32, 0, 29, 29, 33, 32, 7, 8, 9,
                  13,
                ],
                data: 'HsoVKDsbqEUoMD4o3nR6TWLiK5ryockP5BuBzCGoAjojtKJB5bq5Zt3BjGb',
                programIdIndex: 13,
                stackHeight: null,
              },
            ],
            recentBlockhash: '4xhayLciiYjWXSzM41tzwUcjufCdxbgouLuCJqXiySAW',
          },
          signatures: [
            '3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr',
          ],
        },
        version: 0,
      },
    },
  };

  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withBodyIncluding('getTransaction')
    .thenCallback(() => {
      return response;
    });
}
export async function mockGetSuccessTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        blockTime: 1739973211,
        meta: {
          computeUnitsConsumed: 150,
          err: null,
          fee: 5000,
          innerInstructions: [],
          loadedAddresses: {
            readonly: [],
            writable: [],
          },
          logMessages: [
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
          ],
          postBalances: [6995200, 525845878579, 1],
          postTokenBalances: [],
          preBalances: [14078760, 525838800019, 1],
          preTokenBalances: [],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 321700491,
        transaction: {
          message: {
            accountKeys: [
              'HH9ZzgQvSVmznKcRfwHuEphuxk7zU5f92CkXFDQfVJcq',
              'AL9Z5JgZdeCKnaYg6jduy9PQGzo3moo7vZYVSTJwnSEq',
              '11111111111111111111111111111111',
            ],
            addressTableLookups: [],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 1,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [0, 1],
                data: '3Bxs4TcxCSkLAdy9',
                programIdIndex: 2,
                stackHeight: null,
              },
            ],
            recentBlockhash: 'BV3s6CSZXUiNkFvdzQjpD6jB3ZSNqhnbpRQ1acu2DG5L',
          },
          signatures: [
            '3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr',
          ],
        },
        version: 0,
      },
    },
  };

  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withBodyIncluding('getTransaction')
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetLatestBlockhash(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          apiVersion: '2.0.18',
          slot: 308460925,
        },
        value: {
          blockhash: '6E9FiVcuvavWyKTfYC7N9ezJWkNgJVQsroDTHvqApncg',
          lastValidBlockHeight: 341034515,
        },
      },
      id: 1337,
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'getLatestBlockhash',
    })
    .thenCallback(() => {
      return response;
    });
}
export async function mockGetFailedSignaturesForAddress(mockServer: Mockttp) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          result: [
            {
              blockTime: 1739973211,
              confirmationStatus: 'finalized',
              err: {
                InstructionError: [0, 'CustomError'],
              },
              memo: null,
              signature:
                '3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr',
              slot: 321700491,
            },
          ],
        },
      };
    });
}
export async function mockGetSuccessSignaturesForAddress(mockServer: Mockttp) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          result: [
            {
              blockTime: 1739973211,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr',
              slot: 321700491,
            },
          ],
        },
      };
    });
}

export async function mockSendSolanaTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result:
        '3nqGKH1ef8WkTgKXZ8q3xKsvjktWmHHhJpZMSdbB6hBqy5dA7aLVSAUjw5okezZjKMHiNg2MF5HAqtpmsesQtnpj',
      id: 1337,
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'sendTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}

/*
export async function mockGetTokenAccountsByOwner(mockServer: Mockttp) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'getTokenAccountsByOwner',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          result: {
            context: {
              slot: 137568828,
            },
            value: [
              {
                account: {
                  data: {
                    parsed: {
                      info: {
                        isNative: false,
                        mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
                        owner: 'J27ma1MPBRvmPJxLqBqQGNECMXDm9L6abFa4duKiPosa',
                        state: 'initialized',
                        tokenAmount: {
                          amount: '821',
                          decimals: 6,
                          uiAmount: 8.21e-4,
                          uiAmountString: '0.000821',
                        },
                      },
                      type: 'account',
                    },
                    program: 'spl-token',
                    space: 165,
                  },
                  executable: false,
                  lamports: 2039280,
                  owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                  rentEpoch: 318,
                },
                pubkey: 'Exo9AH6fNchE43GaJB85FT7ToYiuKnKzYDyW5mFeTXRR',
              },
            ],
          },
        },
      };
    });
}
*/
export async function mockGetFeeForMessage(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: { context: { slot: 5068 }, value: 5000 },
      id: 1337,
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'getFeeForMessage',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetTokenAccountsByOwner(mockServer: Mockttp) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'getTokenAccountsByOwner',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          result: {
            context: {
              slot: 137568828,
            },
            value: [
              {
                account: {
                  data: {
                    parsed: {
                      info: {
                        isNative: false,
                        mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
                        owner: '14BLn1WLBf3coaPj1fZ5ZqJKQArEjJHvw7rvSktGv2b5',
                        state: 'initialized',
                        tokenAmount: {
                          amount: '6000000',
                          decimals: 6,
                          uiAmount: 6,
                          uiAmountString: '6',
                        },
                      },
                      type: 'account',
                    },
                    program: 'spl-token',
                    space: 165,
                  },
                  executable: false,
                  lamports: 2039280,
                  owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                  rentEpoch: 18446744073709552000,
                  space: 165,
                },
                pubkey: 'EzG33TbDzHVaWBqgQgHhtQSY6tcAVsWub6hBRepcsDt4',
              },
            ],
          },
        },
      };
    });
}
export async function mockGetAccountInfo(mockServer: Mockttp) {
  console.log('mockGetAccountInfo');
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          apiVersion: '2.0.21',
          slot: 317161313,
        },
        value: {
          data: {
            parsed: {
              info: {
                decimals: 6,
                freezeAuthority: null,
                isInitialized: true,
                mintAuthority: null,
                supply: '999943585864185',
              },
              type: 'mint',
            },
            program: 'spl-token',
            space: 82,
          },
          executable: false,
          lamports: 37002092583,
          owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          rentEpoch: 18446744073709552000,
          space: 82,
        },
      },
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'getAccountInfo',
    })
    .withBody('2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin')
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetTokenAccountInfo(mockServer: Mockttp) {
  console.log('mockGetTokenAccountInfo');
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          apiVersion: '2.0.21',
          slot: 317161313,
        },
        value: {
          data: {
            parsed: {
              info: {
                isNative: false,
                mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
                owner: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c',
                state: 'initialized',
                tokenAmount: {
                  amount: '3610951',
                  decimals: 6,
                  uiAmount: 3.610951,
                  uiAmountString: '3.610951',
                },
              },
              type: 'account',
            },
            program: 'spl-token',
            space: 165,
          },
          executable: false,
          lamports: 2039280,
          owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          rentEpoch: 18446744073709552000,
          space: 165,
        },
      },
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'getAccountInfo',
    })
    .withJsonBodyIncluding({
      params: [
        '4Dt7hvLAzSXGvxvpqFU7cRdQXXhU3orACV6ujY4KPv9D',
        {
          encoding: 'jsonParsed',
          commitment: 'confirmed',
        },
      ],
    })
    .thenCallback(() => {
      return response;
    });
}

export async function withSolanaAccountSnap(
  {
    title,
    showNativeTokenAsMainBalance,
    mockCalls,
    mockSendTransaction,
    importAccount,
    simulateTransaction,
    isNative,
    mockGetTransactionSuccess,
    mockGetTransactionFailed,
    mockZeroBalance,
  }: {
    title?: string;
    showNativeTokenAsMainBalance?: boolean;
    mockCalls?: boolean;
    mockSendTransaction?: boolean;
    importAccount?: boolean;
    simulateTransaction?: boolean;
    isNative?: boolean;
    mockGetTransactionSuccess?: boolean;
    mockGetTransactionFailed?: boolean;
    mockZeroBalance?: boolean;
  },
  test: (driver: Driver, mockServer: Mockttp) => Promise<void>,
) {
  console.log('Starting withSolanaAccountSnap');
  let fixtures = new FixtureBuilder();
  if (!showNativeTokenAsMainBalance) {
    fixtures =
      fixtures.withPreferencesControllerShowNativeTokenAsMainBalanceDisabled();
  }
  await withFixtures(
    {
      fixtures: fixtures.build(),
      title,
      dapp: true,
      testSpecificMock: async (mockServer: Mockttp) => {
        const mockList = [];

        // Default Solana mocks
        mockList.push(await mockFungibleAssets(mockServer));

        if (mockGetTransactionSuccess && !mockGetTransactionFailed) {
          mockList.push(await mockGetSuccessSignaturesForAddress(mockServer));
          mockList.push(await mockGetSuccessTransaction(mockServer));
        }
        if (mockGetTransactionFailed && !mockGetTransactionSuccess) {
          mockList.push(await mockGetFailedSignaturesForAddress(mockServer));
          mockList.push(await mockGetFailedTransaction(mockServer));
        }
        if (!mockGetTransactionSuccess && !mockGetTransactionFailed) {
          // success tx by default
          mockList.push(await mockGetSuccessSignaturesForAddress(mockServer));
          mockList.push(await mockGetSuccessTransaction(mockServer));
        }
        if (mockCalls) {
          mockList.push([
            await mockSolanaBalanceQuote(mockServer),
            // await mockGetTransaction(mockServer),
            await mockGetTokenAccountsByOwner(mockServer),
            // await mockGetSuccessSignaturesForAddress(mockServer),
            await mockMultiCoinPrice(mockServer),
            await mockGetLatestBlockhash(mockServer),
            await mockGetFeeForMessage(mockServer),
            await mockPriceApiSpotPrice(mockServer),
            await mockPriceApiExchangeRates(mockServer),
            await mockClientSideDetectionApi(mockServer),
            await mockPhishingDetectionApi(mockServer),
            await mockGetTokenAccountInfo(mockServer),
            await mockGetAccountInfo(mockServer),
          ]);
        }
        if (mockZeroBalance) {
          mockList.push(await mockSolanaBalanceQuote(mockServer, true));
        }
        if (mockSendTransaction) {
          mockList.push(await mockSendSolanaTransaction(mockServer));
        }
        if (simulateTransaction) {
          mockList.push(await simulateSolanaTransaction(mockServer, isNative));
        }
        return mockList;
      },
      ignoredConsoleErrors: [
        'SES_UNHANDLED_REJECTION: 0, never, undefined, index, Array(1)',
        'SES_UNHANDLED_REJECTION: 1, never, undefined, index, Array(1)',
      ],
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      await loginWithoutBalanceValidation(driver);
      const headerComponen = new HeaderNavbar(driver);
      await headerComponen.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      if (!importAccount) {
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: 'Solana 1',
        });
      }
      await test(driver, mockServer);
    },
  );
}
