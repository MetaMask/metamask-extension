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
    amount: '0.00707856 SOL',
    networkFee: '0.000005 SOL',
    fromAddress: 'HH9ZzgQvSVmznKcRfwHuEphuxk7zU5f92CkXFDQfVJcq',
    toAddress: 'AL9Z5JgZdeCKnaYg6jduy9PQGzo3moo7vZYVSTJwnSEq',
    txHash: '3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr',
}

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

export async function mockSolanaBalanceQuote(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          apiVersion: '2.0.18',
          slot: 308460925,
        },
        value: SOL_BALANCE,
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

export async function simulateSolanaTransaction(mockServer: Mockttp, isNative: boolean = true) {
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
export async function mockGetTransactionFailed(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        blockTime: 1739973344,
        meta: {
            computeUnitsConsumed: 153606,
            err: {
                InstructionError: [
                    2,
                    {
                        Custom: 1
                    }
                ]
            },
            fee: 6884,
            innerInstructions: [
                {
                    index: 2,
                    instructions: [
                        {
                            accounts: [
                                6,
                                21,
                                7,
                                8,
                                16,
                                2,
                                1,
                                17,
                                9,
                                21,
                                0,
                                19,
                                19,
                                15,
                                21,
                                10,
                                11,
                                12
                            ],
                            data: "PgQWtn8ozixF162XmibMdYyE4nSMLz1Cj",
                            programIdIndex: 21,
                            stackHeight: 2
                        },
                        {
                            accounts: [
                                16,
                                17,
                                8,
                                0
                            ],
                            data: "ibiXFHZ3k4yWp",
                            programIdIndex: 19,
                            stackHeight: 3
                        },
                        {
                            accounts: [
                                7,
                                1,
                                2,
                                6
                            ],
                            data: "gcB7hKX7WjSJ9",
                            programIdIndex: 19,
                            stackHeight: 3
                        },
                        {
                            accounts: [
                                15
                            ],
                            data: "yCGxBopjnVNQkNP5usq1PoJkoD4rwiqArbxcfahuLJdRMHovUBeVqo4uFDofrS3ZpGQTS7eknmGcnBqddiU15QdogM3uoTncf4CLNffD1VJnjAVQJAWF8d53T4BKrXbBjmuB3MYtsuvGDGzeubLW521FX4UhpGUy3hzh28p26pivoqNXTpcZB6LGmu7D15CcDaPLAB",
                            programIdIndex: 21,
                            stackHeight: 3
                        },
                        {
                            accounts: [
                                19,
                                3,
                                20,
                                3,
                                4,
                                5,
                                3,
                                3,
                                3,
                                3,
                                3,
                                3,
                                3,
                                3,
                                2,
                                16,
                                0
                            ],
                            data: "5zPzCmGQ3Br6S1KCTYN5bJF",
                            programIdIndex: 18,
                            stackHeight: 2
                        },
                        {
                            accounts: [
                                2,
                                5,
                                0
                            ],
                            data: "3L5d33ArKvM5",
                            programIdIndex: 19,
                            stackHeight: 3
                        },
                        {
                            accounts: [
                                4,
                                16,
                                20
                            ],
                            data: "3UApoXKnEWnb",
                            programIdIndex: 19,
                            stackHeight: 3
                        }
                    ]
                }
            ],
            loadedAddresses: {
                readonly: [
                    "So11111111111111111111111111111111111111112",
                    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
                    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                    "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"
                ],
                writable: [
                    "6vPjNiPknqyvCgLEBBQvomKZa2RP4LaY7d7urhRUoVhK"
                ]
            },
            logMessages: [
                "Program ComputeBudget111111111111111111111111111111 invoke [1]",
                "Program ComputeBudget111111111111111111111111111111 success",
                "Program ComputeBudget111111111111111111111111111111 invoke [1]",
                "Program ComputeBudget111111111111111111111111111111 success",
                "Program HzwtjANeVzJPpnXTYt9MYMjVmkhTMfUyS8pJWqSRWLNr invoke [1]",
                "Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo invoke [2]",
                "Program log: Instruction: Swap",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                "Program log: Instruction: TransferChecked",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6238 of 84720 compute units",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                "Program log: Instruction: TransferChecked",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6147 of 75048 compute units",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                "Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo invoke [3]",
                "Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo consumed 2134 of 65467 compute units",
                "Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo success",
                "Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo consumed 68341 of 130106 compute units",
                "Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo success",
                "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 invoke [2]",
                "Program log: ray_log: AyeWsCt6AAAAAAAAAAAAAAABAAAAAAAAACeWsCt6AAAAAeLMxvQAAABXZtbEwzsAAFf0LO8BAAAA",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                "Program log: Instruction: Transfer",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 35687 compute units",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                "Program log: Instruction: Transfer",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 28061 compute units",
                "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 consumed 30541 of 53012 compute units",
                "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 success",
                "Program HzwtjANeVzJPpnXTYt9MYMjVmkhTMfUyS8pJWqSRWLNr consumed 153306 of 174506 compute units",
                "Program HzwtjANeVzJPpnXTYt9MYMjVmkhTMfUyS8pJWqSRWLNr failed: custom program error: 0x1"
            ],
            postBalances: [
                18966260601,
                6097693297,
                2039280,
                97227920,
                1051309375473,
                2039280,
                7182720,
                2039280,
                139515178118,
                23385600,
                71437440,
                71437440,
                71437440,
                1,
                1398960,
                4000000,
                66905120369,
                959143176713,
                1141440,
                934087680,
                16024596044,
                1141440
            ],
            postTokenBalances: [
                {
                    accountIndex: 2,
                    mint: "4h26eponcR8jc3N3EuQZ72ZCpurpGoszvFgGiekTpump",
                    owner: "AEK3Z5CGNgmRQHxK9sRHbbn6MJ5oCg5M96qsXjQJE123",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "0",
                        decimals: 6,
                        uiAmount: null,
                        uiAmountString: "0"
                    }
                },
                {
                    accountIndex: 4,
                    mint: "So11111111111111111111111111111111111111112",
                    owner: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "1051307336193",
                        decimals: 9,
                        uiAmount: 1051.307336193,
                        uiAmountString: "1051.307336193"
                    }
                },
                {
                    accountIndex: 5,
                    mint: "4h26eponcR8jc3N3EuQZ72ZCpurpGoszvFgGiekTpump",
                    owner: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "65712007046743",
                        decimals: 6,
                        uiAmount: 65712007.046743,
                        uiAmountString: "65712007.046743"
                    }
                },
                {
                    accountIndex: 7,
                    mint: "4h26eponcR8jc3N3EuQZ72ZCpurpGoszvFgGiekTpump",
                    owner: "7EhGRZYoi5qz5KEtbQo7x4AUD4LQX5m1MoE6AKxSZoeS",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "13499588966110",
                        decimals: 6,
                        uiAmount: 13499588.96611,
                        uiAmountString: "13499588.96611"
                    }
                },
                {
                    accountIndex: 8,
                    mint: "So11111111111111111111111111111111111111112",
                    owner: "7EhGRZYoi5qz5KEtbQo7x4AUD4LQX5m1MoE6AKxSZoeS",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "139513138838",
                        decimals: 9,
                        uiAmount: 139.513138838,
                        uiAmountString: "139.513138838"
                    }
                },
                {
                    accountIndex: 16,
                    mint: "So11111111111111111111111111111111111111112",
                    owner: "AEK3Z5CGNgmRQHxK9sRHbbn6MJ5oCg5M96qsXjQJE123",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "66903071089",
                        decimals: 9,
                        uiAmount: 66.903071089,
                        uiAmountString: "66.903071089"
                    }
                }
            ],
            preBalances: [
                18966267485,
                6097693297,
                2039280,
                97227920,
                1051309375473,
                2039280,
                7182720,
                2039280,
                139515178118,
                23385600,
                71437440,
                71437440,
                71437440,
                1,
                1398960,
                4000000,
                66905120369,
                959143176713,
                1141440,
                934087680,
                16024596044,
                1141440
            ],
            preTokenBalances: [
                {
                    accountIndex: 2,
                    mint: "4h26eponcR8jc3N3EuQZ72ZCpurpGoszvFgGiekTpump",
                    owner: "AEK3Z5CGNgmRQHxK9sRHbbn6MJ5oCg5M96qsXjQJE123",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "0",
                        decimals: 6,
                        uiAmount: null,
                        uiAmountString: "0"
                    }
                },
                {
                    accountIndex: 4,
                    mint: "So11111111111111111111111111111111111111112",
                    owner: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "1051307336193",
                        decimals: 9,
                        uiAmount: 1051.307336193,
                        uiAmountString: "1051.307336193"
                    }
                },
                {
                    accountIndex: 5,
                    mint: "4h26eponcR8jc3N3EuQZ72ZCpurpGoszvFgGiekTpump",
                    owner: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "65712007046743",
                        decimals: 6,
                        uiAmount: 65712007.046743,
                        uiAmountString: "65712007.046743"
                    }
                },
                {
                    accountIndex: 7,
                    mint: "4h26eponcR8jc3N3EuQZ72ZCpurpGoszvFgGiekTpump",
                    owner: "7EhGRZYoi5qz5KEtbQo7x4AUD4LQX5m1MoE6AKxSZoeS",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "13499588966110",
                        decimals: 6,
                        uiAmount: 13499588.96611,
                        uiAmountString: "13499588.96611"
                    }
                },
                {
                    accountIndex: 8,
                    mint: "So11111111111111111111111111111111111111112",
                    owner: "7EhGRZYoi5qz5KEtbQo7x4AUD4LQX5m1MoE6AKxSZoeS",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "139513138838",
                        decimals: 9,
                        uiAmount: 139.513138838,
                        uiAmountString: "139.513138838"
                    }
                },
                {
                    accountIndex: 16,
                    mint: "So11111111111111111111111111111111111111112",
                    owner: "AEK3Z5CGNgmRQHxK9sRHbbn6MJ5oCg5M96qsXjQJE123",
                    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    uiTokenAmount: {
                        amount: "66903071089",
                        decimals: 9,
                        uiAmount: 66.903071089,
                        uiAmountString: "66.903071089"
                    }
                }
            ],
            rewards: [],
            status: {
                Err: {
                    InstructionError: [
                        2,
                        {
                            Custom: 1
                        }
                    ]
                }
            }
        },
        slot: 321700829,
        transaction: {
            message: {
                accountKeys: [
                    "AEK3Z5CGNgmRQHxK9sRHbbn6MJ5oCg5M96qsXjQJE123",
                    "4h26eponcR8jc3N3EuQZ72ZCpurpGoszvFgGiekTpump",
                    "2ipv52UjzejkcXfkxwuDuQyfvruihP5pBjRcTuRszzLW",
                    "7SYjFQd8K62JhPFqL3AxvXyWLVaQhQAokFBazJ9UcCP8",
                    "2zXhx1ShZd2ftDGdhZkqSujwTN8w4kux7QZTkf9n9ac8",
                    "8UEvHKLBZK82FaFwa4HMcQ9rPwegv2r9GpSXm1ZZ27sw",
                    "7EhGRZYoi5qz5KEtbQo7x4AUD4LQX5m1MoE6AKxSZoeS",
                    "DFvPKZMo3rC5bRVxybLaWWgofsZLVvqaMuYZKiMH77F4",
                    "2rQJbawXssuxcAMWsBLKnaKe8RjaCgbDSFMGvc5p8zwT",
                    "F4PKU1mRYDhVLtQEwNP5zDrjAF7BBavtb3fySE1kWeM2",
                    "F4cswGfpGg4ajn49qwTcH8TvhZ8HMXPt64xDTKjYqpuA",
                    "9DgozBsEVezMPntmNAnidhS44WxMHotntaPnMC2a94kt",
                    "3q1jLbSyBZVjA2G9FnKypfuVJWve8FwvxLRpGyqxTbh8",
                    "ComputeBudget111111111111111111111111111111",
                    "HzwtjANeVzJPpnXTYt9MYMjVmkhTMfUyS8pJWqSRWLNr",
                    "D1ZN9Wj1fRSUQfCjhvnu1hqDMT7hzjzBBpi12nVniYD6"
                ],
                addressTableLookups: [
                    {
                        accountKey: "bczTb9qkUQDWU1oKMNb7KuFPcSajdWAHwGwMLrQ4aTW",
                        readonlyIndexes: [
                            7,
                            5,
                            4,
                            6,
                            3
                        ],
                        writableIndexes: [
                            2
                        ]
                    }
                ],
                header: {
                    numReadonlySignedAccounts: 0,
                    numReadonlyUnsignedAccounts: 3,
                    numRequiredSignatures: 1
                },
                instructions: [
                    {
                        accounts: [],
                        data: "KaK7cT",
                        programIdIndex: 13,
                        stackHeight: null
                    },
                    {
                        accounts: [],
                        data: "3GqBN9eQNeGF",
                        programIdIndex: 13,
                        stackHeight: null
                    },
                    {
                        accounts: [
                            0,
                            17,
                            16,
                            18,
                            19,
                            20,
                            21,
                            15,
                            1,
                            2,
                            3,
                            4,
                            5,
                            6,
                            7,
                            8,
                            9,
                            10,
                            11,
                            12
                        ],
                        data: "11111111ZoM6rghFpt7",
                        programIdIndex: 14,
                        stackHeight: null
                    }
                ],
                recentBlockhash: "HpjiRrvVxWREDhhXrLTD16xMkmYJs84g2f81c1NwzqrM"
            },
            signatures: [
                "5DewYfr36dYHN1bRiBckv4LL18RoPRnY6dMKQ9gy4qTo5UwcR9mM2DXFxwwA8EYsbFiRWqL9PzKXxTZxJgWtPuMs"
            ]
        },
        version: 0
      }
    }
  }
}
export async function mockGetTransactionSuccess(mockServer: Mockttp) {
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
                writable: []
            },
            logMessages: [
                "Program 11111111111111111111111111111111 invoke [1]",
                "Program 11111111111111111111111111111111 success"
            ],
            postBalances: [
                6995200,
                525845878579,
                1
            ],
            postTokenBalances: [],
            preBalances: [
                14078760,
                525838800019,
                1
            ],
            preTokenBalances: [],
            rewards: [],
            status: {
                Ok: null
            }
        },
        slot: 321700491,
        transaction: {
            message: {
                accountKeys: [
                    "HH9ZzgQvSVmznKcRfwHuEphuxk7zU5f92CkXFDQfVJcq",
                    "AL9Z5JgZdeCKnaYg6jduy9PQGzo3moo7vZYVSTJwnSEq",
                    "11111111111111111111111111111111"
                ],
                addressTableLookups: [],
                header: {
                    "numReadonlySignedAccounts": 0,
                    "numReadonlyUnsignedAccounts": 1,
                    "numRequiredSignatures": 1
                },
                instructions: [
                    {
                        accounts: [
                            0,
                            1
                        ],
                        data: "3Bxs4TcxCSkLAdy9",
                        programIdIndex: 2,
                        stackHeight: null
                    }
                ],
                recentBlockhash: "BV3s6CSZXUiNkFvdzQjpD6jB3ZSNqhnbpRQ1acu2DG5L"
            },
            signatures: [
                "3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr"
            ]
        },
        version: 0,
      }
    }
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
export async function mockGetSignaturesForAddress(mockServer: Mockttp) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          result: [
            {
              "blockTime": 1739973211,
              "confirmationStatus": "finalized",
              "err": null,
              "memo": null,
              "signature": "3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr",
              "slot": 321700491
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
                      type: 'account'
                    },
                    program: 'spl-token',
                    space: 165
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
    solanaSupportEnabled,
    showNativeTokenAsMainBalance,
    mockCalls,
    mockSendTransaction,
    importAccount,
    simulateTransaction,
    isNative,
  }: {

    title?: string;
    solanaSupportEnabled?: boolean;
    showNativeTokenAsMainBalance?: boolean;
    mockCalls?: boolean;
    mockSendTransaction?: boolean;
    importAccount?: boolean;
    simulateTransaction?: boolean;
    isNative?: boolean;
  },
  test: (driver: Driver, mockServer: Mockttp) => Promise<void>,
) {
  console.log('Starting withSolanaAccountSnap');
  let fixtures = new FixtureBuilder().withPreferencesController({
    solanaSupportEnabled: solanaSupportEnabled ?? true,
  });
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

        if (mockCalls) {
          mockList.push([
            await mockSolanaBalanceQuote(mockServer),
            //await mockGetTransaction(mockServer),
            await mockGetTransactionSuccess(mockServer),
            await mockGetTokenAccountsByOwner(mockServer),
            await mockGetSignaturesForAddress(mockServer),
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
