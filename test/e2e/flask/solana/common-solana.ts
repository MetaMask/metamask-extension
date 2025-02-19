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
const SOLANA_SPOT_PRICE_API =
  /^https:\/\/price\.(uat-api|api)\.cx\.metamask\.io\/v[1-9]\/spot-prices/u;
const SOLANA_EXCHANGE_RATES_PRICE_API =
  /^https:\/\/price\.(uat-api|api)\.cx\.metamask\.io\/v[1-9]\/exchange-rates\/fiat/u;
const SOLANA_STATIC_TOKEN_IMAGE_REGEX =
  /^https:\/\/static\.cx\.metamask\.io\/api\/v2\/tokenIcons\//u;
const SOLANA_BITCOIN_MIN_API =
  /^https:\/\/min-api\.cryptocompare\.com\/data\/pricemulti\?fsyms=btc/u;
export enum SendFlowPlaceHolders {
  AMOUNT = 'Enter amount to send',
  RECIPIENT = 'Enter receiving address',
  LOADING = 'Preparing transaction',
}
export const commonSolanaAddress =
  '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c';

export const SIMPLEHASH_URL = 'https://api.simplehash.com';

export const SOLANA_TOKEN_API =
  /^https:\/\/tokens\.(uat-api|api)\.cx\.metamask\.io\/v3\/assets/u;

export const METAMASK_PHISHING_DETECTION_API =
  /^https:\/\/phishing-detection\.api\.cx\.metamask\.io\/$/u;

export const METAMASK_CLIENT_SIDE_DETECTION_REGEX =
  /^https:\/\/client-side-detection\.api\.cx\.metamask\.io\/$/u;

export const SOL_BALANCE = 50000000000;

export const SOL_TO_USD_RATE = 225.88;

export const USD_BALANCE = SOL_BALANCE * SOL_TO_USD_RATE;

export const LAMPORTS_PER_SOL = 1_000_000_000;

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
  console.log('mockMultiCoinPrice');
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
  amount: number = SOL_BALANCE,
) {
  console.log('mockSolanaBalanceQuote');
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          apiVersion: '2.0.18',
          slot: 308460925,
        },
        value: amount,
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
  console.log('mockFungibleAssets');
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
  console.log('simulateSolanaTransaction');
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

export async function mockGetTransaction(mockServer: Mockttp) {
  console.log('mockGetTransaction');
  const response = {
    statusCode: 200,
    json: {
      result: {
        slot: 98123569,
        meta: {
          err: null,
          fee: 500000,
          preBalances: [1000000, 5000],
          postBalances: [995000, 0],
          innerInstructions: [],
          logMessages: [],
          preTokenBalances: [],
          postTokenBalances: [],
          rewards: [],
          loadedAddresses: {
            writable: [],
            readonly: [],
          },
        },
        transaction: {
          signatures: [
            '5f84uRa5xsJv7iyzVfXTXQJ7ySskAqYYeXYaz5VUKxf2FLVzFfcs8QePFE3yQieYMDm4K8F1wfwStP6dTrY7gjvZ',
          ],
          message: {
            accountKeys: [
              {
                pubkey: '9vNYXEehFV8V1jxzjH7Sv3BBtsYZ92HPKYP1stgNGHJE',
                signer: true,
                writable: true,
              },
              {
                pubkey: 'HUNMbn6FnUDoFmrATKUkq3GjSRjWX4ytkX4nvP7XNYfH',
                signer: false,
                writable: true,
              },
            ],
            instructions: [],
            recentBlockhash: '8LiyWuxtdHEH7ik6u1E5yy8TP4Fm1ZJdN6K8zmrtyjsW',
          },
        },
      },
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({ method: 'getTransaction' })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetLatestBlockhash(mockServer: Mockttp) {
  console.log('mockGetLatestBlockhash');
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          apiVersion: '2.0.18',
          slot: 318191893,
        },
        value: {
          blockhash: 'AwD5mVCuELZgzi6Y3peDKxYmHupoRXkmV9HHK1zdv79z',
          lastValidBlockHeight: 296475562,
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
  console.log('mockGetSignaturesForAddress');
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          result: [
            {
              blockTime: 1738597240,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                'YrRAUxD3P6xotGqDviLNcxUTRBdWbrzSeDDRYUeZBe23JQV8TB3QmNgPYPmNAbgAGvHcQHWeMFDFpRAyWDoBym8',
              slot: 318232819,
            },
            {
              blockTime: 1738596839,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '5c119ofQ1MAHfD7krGtQyLfMmCRXD96dRjyFBnnKbvCWw17Hx9q9C1inPmeJzGpbrUV6a1bRZR8ysV3pmYQwogyj',
              slot: 318231818,
            },
            {
              blockTime: 1738596586,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '2uJjRZYzDtn72qmK2oDYhJwT4nf5NJDTXRg1udc9GCa5adBRpbeQVQ9PPKFMbEFUKEmRLhFtbxvW9BnjKyYgEqo2',
              slot: 318231193,
            },
            {
              blockTime: 1738595427,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                'chyHrBna5cg1cwwHG38MYzoVNKr9fX1zc6g5aFre6YU3v2Hv1riaNYa6ni1xJNEeEeoYdAmRZaC633wQhecqBwS',
              slot: 318228310,
            },
            {
              blockTime: 1738594455,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                'tnZUPPU5tf7h8AaoYQXkSkyWP3b4ztS3C4TqbzUpB5gnQmnkBTnUH6aiJoj6Kxt1mHS2rwwMgCbyyqqWqZx9YRJ',
              slot: 318225880,
            },
            {
              blockTime: 1738590678,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '2SwjS3pkEBGXXscCPTb38bjQdJ4XN6DhB6rYQGy1s8UuXLQQPMkWNjrYwmtQNuQSgDs7QvyoHgzYFejLHgcZAoVo',
              slot: 318216438,
            },
            {
              blockTime: 1738581677,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '3xsopCMFosN2CW6rQyciJmLgxri8GRoVaNXCL4FE1oCxjWPs1g916pC7nFidrRHeqtcZ3Ujr9Nz9WyTksNbpSJL6',
              slot: 318193825,
            },
            {
              blockTime: 1738579200,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '3xRb1a5juEYTtB4B6LpADXVbc2FPz2zUeSe1DSj7h9pSDz6RGdFvMHANrKikpmfPX7rcjDWeVKqNsrVVQbywqsma',
              slot: 318187642,
            },
            {
              blockTime: 1738573989,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '47Nr6Xdf4DQFHSwbjYhXiCzgUCXyBRacHwfkN5D19upvAgSF7hawzpsnmNDAUewwCxjYqdY96KMQWcLyQpQxyEnq',
              slot: 318174543,
            },
            {
              blockTime: 1738560986,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '5MHZdXPnaQZWgjEofLrjVtqH92ssQY5Tt41Ap6dAKcjQQqEYqaUytASFohgeujotEQRqZaUFhu2HuFapMRX52BGM',
              slot: 318142036,
            },
            {
              blockTime: 1738557644,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '5M2of5fo41bJD8kakzgSf2RVT2qPFjHbq5jfHQsRrPRhcDsokeUGjA1BEr2NTM72VK98P2BZaan9tQ1jHFAw82Ku',
              slot: 318133714,
            },
            {
              blockTime: 1738557642,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '3XsM84VSnJxHoqyEGYp4Lq223MQxUMkWRUWxqrM4XpB4R7v7iDZjyTmoaFEe5WuuLs7fkPszTr4TJkuHtQ88NdCY',
              slot: 318133708,
            },
            {
              blockTime: 1738557642,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '3Kw6yFcWiyjWqXAgwoeXCD4gk3F46onGaUS23hNo5KRZ5i7w62TdiWB78hA2jPdAoLBa2fB3YFexzcYUXuXcNd4L',
              slot: 318133708,
            },
            {
              blockTime: 1738557642,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '2UDD9akDqcuskdpqaQPRETvV845DFYcPt4NSFfBSdES7U8RG1SpcbCYKYJdCL2voaojyXt6cSWwLNWqbTSLs5tTQ',
              slot: 318133708,
            },
          ],
        },
      };
    });
}

export async function mockSendSolanaTransaction(mockServer: Mockttp) {
  console.log('mockSendSolanaTransaction');
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

export async function mockGetFeeForMessage(mockServer: Mockttp) {
  console.log('mockGetFeeForMessage');
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: { apiVersion: '2.0.18', slot: 317144874 },
        value: 10,
      },
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

export async function withSolanaAccountSnap(
  {
    title,
    solanaSupportEnabled,
    showNativeTokenAsMainBalance,
    mockCalls,
    mockSendTransaction,
    importAccount,
    isNative,
    simulateTransaction,
    mockGetZeroBalanceAccount,
    mockGetNonZeroBalanceAccount,
  }: {
    title?: string;
    solanaSupportEnabled?: boolean;
    showNativeTokenAsMainBalance?: boolean;
    mockCalls?: boolean;
    mockSendTransaction?: boolean;
    importAccount?: boolean;
    isNative?: boolean;
    simulateTransaction?: boolean;
    mockGetZeroBalanceAccount?: boolean;
    mockGetNonZeroBalanceAccount?: boolean;
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
        mockList.push(await mockTokenApi(mockServer));
        mockList.push(await mockStaticMetamaskTokenIcon(mockServer));
        mockList.push(await mockPriceApiExchangeRates(mockServer));
        mockList.push(await mockPriceApiSpotPrice(mockServer));

        if (mockCalls) {
          mockList.push([
            await mockGetTransaction(mockServer),
            await mockGetTokenAccountsByOwner(mockServer),
            await mockGetSignaturesForAddress(mockServer),
            await mockMultiCoinPrice(mockServer),
            await mockGetLatestBlockhash(mockServer),
            await mockGetFeeForMessage(mockServer),
            await mockGetTokenAccountInfo(mockServer),
            await mockGetAccountInfo(mockServer),
          ]);
        }
        if (mockGetZeroBalanceAccount) {
          mockList.push(await mockSolanaBalanceQuote(mockServer, 0));
        }
        if (mockGetNonZeroBalanceAccount) {
          mockList.push(await mockSolanaBalanceQuote(mockServer));
        }
        if (mockSendTransaction) {
          mockList.push(await mockSendSolanaTransaction(mockServer));
          // mockList.push(await mockGetAccountInfo(mockServer));
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
