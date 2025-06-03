/* eslint-disable @typescript-eslint/no-loss-of-precision */
import { Mockttp, MockedEndpoint } from 'mockttp';
import { regularDelayMs, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import FixtureBuilder from '../../fixture-builder';
import { ACCOUNT_TYPE } from '../../constants';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockProtocolSnap } from '../../mock-response-data/snaps/snap-binary-mocks';

const SOLANA_URL_REGEX_MAINNET =
  /^https:\/\/solana-(mainnet|devnet)\.infura\.io\/v3\/.*/u;
const SOLANA_URL_REGEX_DEVNET = /^https:\/\/solana-devnet\.infura\.io\/v3\/.*/u;
const ETH_SPOT_PRICE_API =
  /^https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/chains\/1\/spot-prices/u;
const SPOT_PRICE_API =
  /^https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/spot-prices/u;
const SOLANA_EXCHANGE_RATES_PRICE_API =
  /^https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/exchange-rates\/fiat/u;
const SOLANA_STATIC_TOKEN_IMAGE_REGEX_MAINNET =
  /^https:\/\/static\.cx\.metamask\.io\/api\/v2\/tokenIcons\/assets\/solana\/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/u;
const SOLANA_STATIC_TOKEN_IMAGE_REGEX_DEVNET =
  /^https:\/\/static\.cx\.metamask\.io\/api\/v2\/tokenIcons\/assets\/solana\/EtWTRABZaYq6iMfeYKouRu166VU2xqa1/u;
const SOLANA_BITCOIN_MIN_API =
  /^https:\/\/min-api\.cryptocompare\.com\/data\/pricemulti/u;
export const SOLANA_TOKEN_API =
  /^https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u;
export const METAMASK_PHISHING_DETECTION_API =
  /^https:\/\/phishing-detection\.api\.cx\.metamask\.io\/$/u;
export const METAMASK_CLIENT_SIDE_DETECTION_REGEX =
  /^https:\/\/client-side-detection\.api\.cx\.metamask\.io\/$/u;
export const ACCOUNTS_API =
  /^https:\/\/accounts\.api\.cx\.metamask\.io\/v1\/accounts\/0x5cfe73b6021e818b776b421b1c4db2474086a7e1\/$/u;
export const BRIDGE_TX_STATUS =
  /^https:\/\/bridge\.api\.cx\.metamask\.io\/getTxStatus/u;
export const BRIDGED_TOKEN_LIST_API =
  /^https:\/\/bridge\.api\.cx\.metamask\.io\/getTokens/u;
export const BRIDGE_GET_QUOTE_API =
  /^https:\/\/bridge\.api\.cx\.metamask\.io\/getQuote/u;

export const SECURITY_ALERT_BRIDGE_URL_REGEX =
  /^https:\/\/security-alerts\.api\.cx\.metamask\.io\/solana\/message\/scan/u;
export const SOLANA_TOKEN_PROGRAM =
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export enum SendFlowPlaceHolders {
  AMOUNT = 'Enter amount to send',
  RECIPIENT = 'Enter receiving address',
  LOADING = 'Preparing transaction',
}

export const SIMPLEHASH_URL = 'https://api.simplehash.com';

export const SOLANA_DEVNET_URL = 'https://solana-devnet.infura.io/v3/';

export const SOL_BALANCE = 50000000000;

// https://docs.anza.xyz/implemented-proposals/rent#two-tiered-rent-regime
export const MINIMUM_BALANCE_FOR_RENT_EXEMPTION = 890880; // = 0.00089088 SOL

export const SOL_TO_USD_RATE = 225.88;

export const USD_BALANCE = SOL_BALANCE * SOL_TO_USD_RATE;

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const commonSolanaAddress =
  '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c'; // Disclaimer: This account is intended solely for testing purposes. Do not use or trade any tokens associated with this account in production or live environments.

export const commonSolanaTxConfirmedDetailsFixture = {
  status: 'Confirmed',
  amount: '0.00708 SOL',
  networkFee: '0.000005 SOL',
  fromAddress: 'HH9ZzgQvSVmznKcRfwHuEphuxk7zU5f92CkXFDQfVJcq',
  toAddress: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
  txHash:
    '3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr',
};

export const commonSolanaTxFailedDetailsFixture = {
  status: 'Failed',
  amount: '0.000000005 SOL',
  networkFee: '-0.000005',
  fromAddress: 's3zTLVvDbrBzbQ36sr2Z4xrzpRHFv3noWChbNi6vcjr',
  toAddress: 'AL9Z5JgZdeCKnaYg6jduy9PQGzo3moo7vZYVSTJwnSEq',
  txHash:
    '3dcsK2iXLKHqb5v3bboQvvd7LScajnXENhhxeje2tn3cgQ9e4YJZc7h5QFRypTmYwccAzy4DUskt6R9mXib3Tu1D',
};

export async function mockAccountsApi(mockServer: Mockttp) {
  const response = {
    pageInfo: {
      count: 0,
      cursor: null,
      hasNextPage: false,
    },
    data: [],
    unprocessedNetworks: [],
  };
  return await mockServer
    .forGet(ACCOUNTS_API)
    .withQuery({
      networks: '0x1,0x89,0x38,0xe708,0x2105,0xa,0xa4b1,0x82750',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: response,
      };
    });
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

export async function mockPriceApiSpotPriceSolanaUsdc(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .withQuery({
      assetIds:
        'solana%35eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2token%3EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      vsCurrency: 'usd',
      includeMarketData: 'true',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
            {
              id: 'usd-coin',
              price: 0.999793,
              marketCap: 61542953704,
              allTimeHigh: 1.17,
              allTimeLow: 0.877647,
              totalVolume: 9348231451,
              high1d: 0.999817,
              low1d: 0.999679,
              circulatingSupply: 61556030405.52778,
              dilutedMarketCap: 61550339528,
              marketCapPercentChange1d: -0.09557,
              priceChange1d: 0.00005363,
              pricePercentChange1h: 0.000029061306970489807,
              pricePercentChange1d: 0.00536420028047396,
              pricePercentChange7d: -0.001434739608255301,
              pricePercentChange14d: -0.02055901758173432,
              pricePercentChange30d: -0.017196961352851058,
              pricePercentChange200d: 0.040737368524822216,
              pricePercentChange1y: -0.008133540526302847,
            },
        },
      };
    });
}

export async function mockPriceApiSpotPrice(mockServer: Mockttp) {
  console.log('mockPriceApiSpotPrice');
  const ehtMarketResponse = {
    statusCode: 200,
    json: {
      '0x0000000000000000000000000000000000000000': {
        id: 'ethereum',
        price: 2547.92,
        marketCap: 307530853041,
        allTimeHigh: 4878.26,
        allTimeLow: 0.432979,
        totalVolume: 23288959944,
        high1d: 2600,
        low1d: 2460.59,
        circulatingSupply: 120727123.8805214,
        dilutedMarketCap: 307531339803,
        marketCapPercentChange1d: 1.36787,
        priceChange1d: 33.5,
        pricePercentChange1h: 0.8627663682513834,
        pricePercentChange1d: 1.3324861525535276,
        pricePercentChange7d: -1.995156058030328,
        pricePercentChange14d: 38.956197665952054,
        pricePercentChange30d: 55.86452523348427,
        pricePercentChange200d: 1.8744275469950988,
        pricePercentChange1y: -31.41115838150723,
      },
    },
  };
  const solanaMarketDataResponse = {
    statusCode: 200,
    json: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
        id: 'solana',
        price: 112.87,
        marketCap: 58245152246,
        allTimeHigh: 293.31,
        allTimeLow: 0.500801,
        totalVolume: 6991628445,
        high1d: 119.85,
        low1d: 105.87,
        circulatingSupply: 515615042.5147497,
        dilutedMarketCap: 67566552200,
        marketCapPercentChange1d: 6.43259,
        priceChange1d: 6.91,
        pricePercentChange1h: -0.10747351712871725,
        pricePercentChange1d: 6.517062579985171,
        pricePercentChange7d: -1.2651850097746231,
        pricePercentChange14d: -17.42211401987578,
        pricePercentChange30d: -7.317068682545842,
        pricePercentChange200d: -22.09390252653303,
        pricePercentChange1y: -31.856951873653344,
      },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv':
        {
          id: 'usd-coin',
          price: 0.9999,
          marketCap: 59878237545,
          allTimeHigh: 1.17,
          allTimeLow: 0.877647,
          totalVolume: 15910794136,
          high1d: 1.001,
          low1d: 0.999781,
          circulatingSupply: 59884477611.62816,
          dilutedMarketCap: 59993084685,
          marketCapPercentChange1d: -0.54935,
          priceChange1d: -0.00000967395266227,
          pricePercentChange1h: -0.0036230127807169886,
          pricePercentChange1d: -0.0009674830537401128,
          pricePercentChange7d: -0.0040353282511238105,
          pricePercentChange14d: 0.008577550625780632,
          pricePercentChange30d: 0.004483705121822349,
          pricePercentChange200d: 0.029482859180996183,
          pricePercentChange1y: -0.11068819291624574,
        },
    },
  };
  const solanaSpotPriceResponse = {
    statusCode: 200,
    json: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
        usd: 167.93676777178396,
      },
    },
  };

  const ethSpotPriceResponse = {
    statusCode: 200,
    json: {
      'eip155:1/slip44:60': {
        usd: 25373.64,
      },
    },
  };
  let resp;
  resp = await mockServer
    .forGet(SPOT_PRICE_API)
    .withQuery({
      assetIds: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      vsCurrency: 'usd',
    })
    .thenCallback(() => {
      return solanaSpotPriceResponse;
    });

  if (!resp) {
    resp = await mockServer
      .forGet(SPOT_PRICE_API)
      .withQuery({
        assetIds: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        includeMarketData: 'true',
        vsCurrency: 'usd',
      })
      .thenCallback(() => {
        return solanaMarketDataResponse;
      });
  }

  if (!resp) {
    resp = await mockServer
      .forGet(ETH_SPOT_PRICE_API)
      .withQuery({
        tokenAddresses:
          '0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000000',
        includeMarketData: 'true',
        vsCurrency: 'usd',
      })
      .thenCallback(() => {
        return ehtMarketResponse;
      });
  }

  if (!resp) {
    resp = await mockServer
      .forGet(SPOT_PRICE_API)
      .withQuery({
        assetIds: 'eip155%3A1/slip44%3A60',
        vsCurrency: 'usd',
      })
      .thenCallback(() => {
        return ethSpotPriceResponse;
      });
  }

  console.log('resp ', resp);
  return resp;
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

export async function mockStaticMetamaskTokenIconMainnet(mockServer: Mockttp) {
  console.log('mockStaticMetamaskTokenIcon');
  return await mockServer
    .forGet(SOLANA_STATIC_TOKEN_IMAGE_REGEX_MAINNET)
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

export async function mockStaticMetamaskTokenIconDevnet(mockServer: Mockttp) {
  console.log('mockStaticMetamaskTokenIcon');
  return await mockServer
    .forGet(SOLANA_STATIC_TOKEN_IMAGE_REGEX_DEVNET)
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

export async function mockTokenApiMainnetTest(mockServer: Mockttp) {
  console.log('mockTokenApi');
  const response = {
    statusCode: 200,
    json: [
      {
        decimals: 9,
        assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        name: 'Solana',
        symbol: 'SOL',
      },
      {
        decimals: 6,
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
        name: 'PUMPKIN',
        symbol: 'PKIN',
      },
      {
        decimals: 6,
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        name: 'USDC',
        symbol: 'USDC',
      },
    ],
  };
  return await mockServer.forGet(SOLANA_TOKEN_API).thenCallback(() => {
    return response;
  });
}

export async function mockTokenApiMainnet(mockServer: Mockttp) {
  console.log('mockTokenApi');
  const response = {
    statusCode: 200,
    json: [
      {
        decimals: 9,
        assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        name: 'Solana',
        symbol: 'SOL',
      },
      {
        decimals: 6,
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
        name: 'PUMPKIN',
        symbol: 'PKIN',
      },
    ],
  };
  return await mockServer.forGet(SOLANA_TOKEN_API).thenCallback(() => {
    return response;
  });
}

export async function mockTokenApiMainnet2(mockServer: Mockttp) {
  console.log('mockTokenApi');
  const response = {
    statusCode: 200,
    json: [
      {
        decimals: 9,
        assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        name: 'Solana',
        symbol: 'SOL',
      },
      {
        decimals: 9,
        assetId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501',
        name: 'Solana',
        symbol: 'SOL',
      },
    ],
  };
  return await mockServer
    .forGet(SOLANA_TOKEN_API)
    .withQuery({
      assetIds:
        'solana%5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Fslip44%3A501%2Csolana%3AEtWTRABZaYq6iMfeYKouRu166VU2xqa1%2Fslip44%3A501',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockTokenApiDevnet2(mockServer: Mockttp) {
  console.log('mockTokenApi');
  const response = {
    statusCode: 200,
    json: [
      {
        decimals: 9,
        assetId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501',
        name: 'Solana',
        symbol: 'SOL',
      },
    ],
  };
  return await mockServer
    .forGet(SOLANA_TOKEN_API)
    .withQuery({
      assetIds: 'solana%3AEtWTRABZaYq6iMfeYKouRu166VU2xqa1%2Fslip44%3A501',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockTokenApiDevnet(mockServer: Mockttp) {
  console.log('mockTokenApi');
  const response = {
    statusCode: 200,
    json: [
      {
        decimals: 9,
        assetId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501',
        name: 'Solana',
        symbol: 'SOL',
      },
      {
        decimals: 6,
        assetId:
          'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
        name: 'PUMPKIN',
        symbol: 'PKIN',
      },
    ],
  };
  return await mockServer
    .forGet(SOLANA_TOKEN_API)
    .withQuery({
      assetIds:
        'solana%EtWTRABZaYq6iMfeYKouRu166VU2xqa1%2Fslip44%3A501%2Csolana%EtWTRABZaYq6iMfeYKouRu166VU2xqa1%2Ftoken%3A2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
    })
    .thenCallback(() => {
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
      id: '1337',
      jsonrpc: '2.0',
      result: {
        context: {
          apiVersion: '2.0.18',
          slot: 308460925,
        },
        value: mockZeroBalance ? 0 : SOL_BALANCE,
      },
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getBalance',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockSolanaBalanceQuoteDevnet(
  mockServer: Mockttp,
  mockZeroBalance: boolean = false,
) {
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
      result: {
        context: {
          apiVersion: '2.0.18',
          slot: 308460925,
        },
        value: mockZeroBalance ? 0 : SOL_BALANCE,
      },
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_DEVNET)
    .withJsonBodyIncluding({
      method: 'getBalance',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetMinimumBalanceForRentExemption(
  mockServer: Mockttp,
) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getMinimumBalanceForRentExemption',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: MINIMUM_BALANCE_FOR_RENT_EXEMPTION,
        },
      };
    });
}

export async function simulateSolanaTransactionFailed(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        id: '1337',
        jsonrpc: '2.0',
        result: {
          context: {
            slot: 12345678,
          },
          value: {
            err: {
              InstructionError: [
                1,
                {
                  Custom: 1,
                },
              ],
            },
            logs: [
              'Program 11111111111111111111111111111111 invoke [1]',
              'Program 11111111111111111111111111111111 failed: custom program error: 0x1',
            ],
            accounts: null,
            unitsConsumed: 200000,
          },
        },
      },
    },
  };

  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'simulateTransaction',
    })
    .thenCallback(() => {
      return response;
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
          id: '1337',
          jsonrpc: '2.0',
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
    .forPost(SOLANA_URL_REGEX_MAINNET)
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
      id: '1337',
      jsonrpc: '2.0',
      result: {
        blockTime: 1741612022,
        meta: {
          computeUnitsConsumed: 6654,
          err: {
            InstructionError: [
              1,
              {
                Custom: 6003,
              },
            ],
          },
          fee: 5000,
          innerInstructions: [],
          loadedAddresses: {
            readonly: [],
            writable: [],
          },
          logMessages: [
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program cjg3oHmg9uuPsP8D6g29NWvhySJkdYdAo9D25PRbKXJ invoke [1]',
            'Program log: AnchorError thrown in programs/ocr2/src/lib.rs:639. Error Code: StaleReport. Error Number: 6003. Error Message: Stale report.',
            'Program cjg3oHmg9uuPsP8D6g29NWvhySJkdYdAo9D25PRbKXJ consumed 6504 of 199850 compute units',
            'Program cjg3oHmg9uuPsP8D6g29NWvhySJkdYdAo9D25PRbKXJ failed: custom program error: 0x1773',
          ],
          postBalances: [
            14290605326, 49054080, 2616960, 1141440, 0, 0, 1141440, 1,
          ],
          postTokenBalances: [],
          preBalances: [
            14290610326, 49054080, 2616960, 1141440, 0, 0, 1141440, 1,
          ],
          preTokenBalances: [],
          rewards: [],
          status: {
            Err: {
              InstructionError: [
                1,
                {
                  Custom: 6003,
                },
              ],
            },
          },
        },
        slot: 325836308,
        transaction: {
          message: {
            accountKeys: [
              'D5shgkAbSHH1VGDybY5bEbgbvvCMbop4u5WKTKxb3cFq',
              'A3FsKE2XRcVadCp4gjeYb8BJoVaDiVFLbdaM5nvZpUZJ',
              'F6rApkRBD31K6zZrwXt8aQrRKwzbZqCMH2vbMvBgftPX',
              'HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny',
              '38cqxKympqDkL7KDQM6CgJJ3uCvNvDTCHN6vSZAhHCRG',
              'Sysvar1nstructions1111111111111111111111111',
              'cjg3oHmg9uuPsP8D6g29NWvhySJkdYdAo9D25PRbKXJ',
              'ComputeBudget111111111111111111111111111111',
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 5,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [],
                data: '3DTZbgwsozUF',
                programIdIndex: 7,
                stackHeight: null,
              },
              {
                accounts: [1, 0, 2, 3, 4, 5],
                data: '5g5NfetiBHZ3fNvGggKKkfh7UrhUoZ8e22ibBb5PZtw3PaqQ6aJhYvvghterfdXw3Ms4QTDv6oCfQZ1U62dSTpmx1ksZoWZbY9VUPkaBmBGSx14DXkLB2QYD1Z6gDr27Z2VH4UUKm5YhBSxXY9jzjQCqPPaRVeezexZDRWieq5fNGqcffy26C37JTm3BCoLwmhr1ruFWDtdpuuzHNzQ1Z4WC7Ng1D6nYUadNXxPhm9j5f8XaBQCyhtSoqvstijnePmPo4Jb41gHwv6QSP6ELvVnLAhSdNApX4xgnKzNatvB6SfZkeJLpeZMDLkYX6hrNc6JmrY3PZkwdvUE42g8LFKV67ZZFWVskskTokK4Q4vzs8YT6BwBA1Ceit2doSEy57xhW5gHKw1HVohyBXEJ7LYq1wxNaGpWPAd7kA1TZA41NS7hRDBsuGtwuxv3kc4BBYaVreCtaaXfvPjGVa4xgv6GZsjZeaFnbev8WEcZKaLu8S6ecoNhv6MkrAkopqmZWwPBs297W2qrrqmfZv3G3GaEE396D1v1vJMJEzG2CSvXtGcdqLebqzCvdnZXLq5FFbo7Mi23vaW5HZtbRduH5yBHE5tnqHUUf8TNUYn7xC8tofY1p6w3Npu6anB2GMvcnzR8svMATjt4ukGSw7JkxoKFsQrLXvVhazAWYTpSJ2pykjDBpfrT9MWn9WnpzY76QH1XxGMKXWECudNKhixFuAonEJ6asC6WZDWgrvpvTfy6Ac',
                programIdIndex: 6,
                stackHeight: null,
              },
              {
                accounts: [],
                data: 'Fj2Eoy',
                programIdIndex: 7,
                stackHeight: null,
              },
            ],
            recentBlockhash: '7s7d5NA26LQyEc34egMDbUFVub3gE5XSDrC1AunVmabY',
          },
          signatures: [
            '3dcsK2iXLKHqb5v3bboQvvd7LScajnXENhhxeje2tn3cgQ9e4YJZc7h5QFRypTmYwccAzy4DUskt6R9mXib3Tu1D',
          ],
        },
        version: 'legacy',
      },
    },
  };

  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withBodyIncluding('getTransaction')
    .thenCallback(() => {
      return response;
    });
}
export async function mockGetFailedTransactionDevnet(mockServer: Mockttp) {
  console.log('mockGetFailedTransaction');
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
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
    .forPost(SOLANA_URL_REGEX_DEVNET)
    .withBodyIncluding('getTransaction')
    .thenCallback(() => {
      return response;
    });
}
export async function mockGetSuccessTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
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
              '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
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
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withBodyIncluding('getTransaction')
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetLatestBlockhash(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
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
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getLatestBlockhash',
    })
    .thenCallback(() => {
      return response;
    });
}
export async function mockGetLatestBlockhashDevnet(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
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
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_DEVNET)
    .withJsonBodyIncluding({
      method: 'getLatestBlockhash',
    })
    .thenCallback(() => {
      return response;
    });
}
export async function mockGetFailedSignaturesForAddress(mockServer: Mockttp) {
  console.log('mockGetFailedSignaturesForAddress');
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
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
  console.log('mockGetSuccessSignaturesForAddress');
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
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

export async function mockGetSuccessSignaturesForBridge(mockServer: Mockttp) {
  console.log('mockGetSuccessSignaturesForBridge');
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: [
            {
              blockTime: 1748277595,
              confirmationStatus: 'finalized',
              err: null,
              memo: '[66] 0x6320fa51e6aaa93f522013db85b1ee724ab9f4c77b8230902c8eff9568951be8',
              signature:
                '2fwnBMKmGJ86uagQ9NEAyUfWeCrvTDn5WiZtiB8AFVtf1RiSaNmyfTxBw8Un7G5BRpoXACzvfhohyxCsCXhJWBJp',
              slot: 342622364,
            },
          ],
        },
      };
    });
}

export async function mockGetSuccessSignaturesForAddressDevnet(
  mockServer: Mockttp,
) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX_DEVNET)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
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

export async function mockSendSolanaFailedTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
      error: {
        code: -32002,
        message:
          'Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1',
        data: {
          accounts: null,
          err: {
            InstructionError: [
              0,
              {
                Custom: 1,
              },
            ],
          },
          logs: [
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 failed: custom program error: 0x1',
          ],
          unitsConsumed: 200000,
          returnData: null,
        },
      },
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'sendTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockSendBridgeSolanaTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result:
        '2fwnBMKmGJ86uagQ9NEAyUfWeCrvTDn5WiZtiB8AFVtf1RiSaNmyfTxBw8Un7G5BRpoXACzvfhohyxCsCXhJWBJp',
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'sendTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetSignaturesSuccessSwap(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: [
        {
          blockTime: 1748363309,
          confirmationStatus: 'finalized',
          err: null,
          memo: null,
          signature:
            '28rWme56aMyaP8oX18unFeZg65iyDEhjLhvMBpxyFgKcn38P37ZRsssSZoHDCCr5xUfwfpqsVSSBoShLitHQLdrr',
          slot: 342840492,
        },
      ],
    },
  };

  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      return response;
    });
}

export async function mockSendSwapSolanaTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result:
        '28rWme56aMyaP8oX18unFeZg65iyDEhjLhvMBpxyFgKcn38P37ZRsssSZoHDCCr5xUfwfpqsVSSBoShLitHQLdrr',
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'sendTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetSOLPKINTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        blockTime: 1748516016,
        meta: {
          computeUnitsConsumed: 110697,
          err: null,
          fee: 11633,
          innerInstructions: [
            {
              index: 2,
              instructions: [
                {
                  accounts: [21],
                  data: '84eT',
                  programIdIndex: 13,
                  stackHeight: 2,
                },
                {
                  accounts: [0, 5],
                  data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL',
                  programIdIndex: 7,
                  stackHeight: 2,
                },
                {
                  accounts: [5],
                  data: 'P',
                  programIdIndex: 13,
                  stackHeight: 2,
                },
                {
                  accounts: [5, 21],
                  data: '6Q6A46mVa7ntxYLTkQL1uwuXsmxKehnHCxSemuaNkzZYa',
                  programIdIndex: 13,
                  stackHeight: 2,
                },
              ],
            },
            {
              index: 5,
              instructions: [
                {
                  accounts: [0, 19, 16, 5, 3, 17, 14, 18, 13, 4, 15, 2, 6],
                  data: 'wZRp7wZ3cztQRVoxv1rHBByFEJbLS1Vrqx7pSN3s1CtgVypLi1st54PA',
                  programIdIndex: 20,
                  stackHeight: 2,
                },
                {
                  accounts: [5, 17, 0],
                  data: '3jcEe9BDANAT',
                  programIdIndex: 13,
                  stackHeight: 3,
                },
                {
                  accounts: [14, 3, 16],
                  data: '3c59vLJnDqMh',
                  programIdIndex: 13,
                  stackHeight: 3,
                },
                {
                  accounts: [11],
                  data: 'QMqFu4fYGGeUEysFnenhAvi1xPm726vLbPnsuyPY5Jr6BfJygEDcWLKrWxu3qzgfNRAXU7RAbzNafJ4bdNR8s1YUrGsTWq5ebGCaGW31qDjnqHTwSJn28PPXTY4z7VZngMTvxYojq6eseH5hVsHPDPmvLAZ1kznG3NSnPtRDAHp17Nw',
                  programIdIndex: 12,
                  stackHeight: 2,
                },
              ],
            },
          ],
          loadedAddresses: {
            readonly: [
              'A1BBtTYJd4i3xU8D6Tc2FzU6ZN4oXZWXKZnCxwbHXr8x',
              'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
              'So11111111111111111111111111111111111111112',
            ],
            writable: [
              'AGkFq2JK5y9crD6JYLceJYEHQz7wpxoYogAvbxp2gNC2',
              'DAy7Pj8aWnjPUSuDFSgPUUUy7xUXagfLyrS7gb4mqg1G',
              'EDE4v78Zjo54DfhcbWM8nmFrLWSTVGgBcjg8UWh5Fsdv',
              'GC9Hk5D7WQ6CNQ5JEVE81K8sLER1ysXwuD4zhu1wRDSE',
              'YqucwEQB6jYHpV1MRrKwKNwJpu14bXQoVqquuJg2xwY',
            ],
          },
          logMessages: [
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
            'Program log: CreateIdempotent',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: GetAccountDataSize',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 126951 compute units',
            'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program 11111111111111111111111111111111 invoke [2]',
            'Program 11111111111111111111111111111111 success',
            'Program log: Initialize the associated token account',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: InitializeImmutableOwner',
            'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 120364 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: InitializeAccount3',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 116482 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 19315 of 132356 compute units',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: SyncNative',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3045 of 112891 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]',
            'Program log: Instruction: Route',
            'Program CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK invoke [2]',
            'Program log: Instruction: Swap',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 45787 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 38391 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program data: QMbN6CYIceLESazcDx5yFySP5+tPeeykI06pH8EFVrAVNFfRBG3KlSvsJhRtumFSoGZgsFcJr6DNYguB2VI+8YX3cCnnfUCf2faezBYvIPIdPqffzy0Ah08sYIqHynXY7u6aYSziWQ2FVmtApULvbTqNftGq+9n24ejpTT1yvee/KqHZhjSHn7RAlwAAAAAAAAAAAAAAAACHMrw+AAAAAAAAAAAAAAAAATEAQeo2MjdbCgAAAAAAAAAL3uYp2hEAAAAAAAAAAAAAorYAAA==',
            'Program CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK consumed 75520 of 104044 compute units',
            'Program CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 26792 compute units',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 84822 of 109846 compute units',
            'Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 hzK8PgAAAAA=',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: CloseAccount',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2915 of 25024 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
          ],
          postBalances: [
            1566579489, 7233272128, 72161280, 2039280, 72161280, 0, 72161280, 1,
            46557866023, 731913600, 1, 1017918, 1141440, 934087680, 2039280,
            13641600, 12547140, 1713395180734, 32092560, 1705200, 1141440,
            1045539216193,
          ],
          postTokenBalances: [
            {
              accountIndex: 3,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '1053632046',
                decimals: 6,
                uiAmount: 1053.632046,
                uiAmountString: '1053.632046',
              },
            },
            {
              accountIndex: 14,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: 'EDE4v78Zjo54DfhcbWM8nmFrLWSTVGgBcjg8UWh5Fsdv',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '216374769199099',
                decimals: 6,
                uiAmount: 216374769.199099,
                uiAmountString: '216374769.199099',
              },
            },
            {
              accountIndex: 17,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'EDE4v78Zjo54DfhcbWM8nmFrLWSTVGgBcjg8UWh5Fsdv',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '1713393141454',
                decimals: 9,
                uiAmount: 1713.393141454,
                uiAmountString: '1713.393141454',
              },
            },
          ],
          preBalances: [
            1576591122, 7233184628, 72161280, 2039280, 72161280, 0, 72161280, 1,
            46557866023, 731913600, 1, 1017918, 1141440, 934087680, 2039280,
            13641600, 12547140, 1713385268234, 32092560, 1705200, 1141440,
            1045539216193,
          ],
          preTokenBalances: [
            {
              accountIndex: 3,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '1110951',
                decimals: 6,
                uiAmount: 1.110951,
                uiAmountString: '1.110951',
              },
            },
            {
              accountIndex: 14,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: 'EDE4v78Zjo54DfhcbWM8nmFrLWSTVGgBcjg8UWh5Fsdv',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '216375821720194',
                decimals: 6,
                uiAmount: 216375821.720194,
                uiAmountString: '216375821.720194',
              },
            },
            {
              accountIndex: 17,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'EDE4v78Zjo54DfhcbWM8nmFrLWSTVGgBcjg8UWh5Fsdv',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '1713383228954',
                decimals: 9,
                uiAmount: 1713.383228954,
                uiAmountString: '1713.383228954',
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 343228399,
        transaction: {
          message: {
            accountKeys: [
              '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA',
              '6FvNszCopHB66PmRXxY1XMkfbuGuQf2vn7GgizNt2Vdv',
              '9yVetFBzUDjrXSsNDdY6eSiTYaLWgbBwDDv5Dsf35djC',
              'D6kNwseUcFtyzBVuEhhm2wVN1eBdCcRLFqTvJsZRfgAi',
              'Ffqao4nxSvgaR5kvFz1F718WaxSv6LnNfHuGqFEZ8fzL',
              'Gs7P2uTR6RCzHGVH7xndgi4AvhSCYEiBdEgQE6aN6S4E',
              '11111111111111111111111111111111',
              '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
              'ComputeBudget111111111111111111111111111111',
              'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf',
              'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            ],
            addressTableLookups: [
              {
                accountKey: '3U5dLxf4pPXUQvz2JswGv7oB7JaBrqSsi5pggseaZaBn',
                readonlyIndexes: [63, 56, 16],
                writableIndexes: [57, 65, 59, 64, 60],
              },
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 7,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [],
                data: '3Sy41WEwNLnT',
                programIdIndex: 10,
                stackHeight: null,
              },
              {
                accounts: [],
                data: 'FKG5rX',
                programIdIndex: 10,
                stackHeight: null,
              },
              {
                accounts: [0, 5, 0, 21, 7, 13],
                data: '2',
                programIdIndex: 9,
                stackHeight: null,
              },
              {
                accounts: [0, 5],
                data: '3Bxs4X1LHvnvamXm',
                programIdIndex: 7,
                stackHeight: null,
              },
              {
                accounts: [5],
                data: 'J',
                programIdIndex: 13,
                stackHeight: null,
              },
              {
                accounts: [
                  13, 0, 5, 3, 12, 8, 12, 11, 12, 20, 0, 19, 16, 5, 3, 17, 14,
                  18, 13, 4, 15, 2, 6, 12,
                ],
                data: 'PrpFmsY4d26dKbdKMZJ1NLG2A9jT958BYutrog6aP9dWtUko',
                programIdIndex: 12,
                stackHeight: null,
              },
              {
                accounts: [5, 0, 0],
                data: 'A',
                programIdIndex: 13,
                stackHeight: null,
              },
              {
                accounts: [0, 1],
                data: '3Bxs4b2wJf6b9pyu',
                programIdIndex: 7,
                stackHeight: null,
              },
            ],
            recentBlockhash: '6upBDTdJhDdhwZZbcZ8VJuiEzCKRcfUEtbdAJQxGD8jn',
          },
          signatures: [
            '2fBvzrQ3Yg1EuURsLjQ34LL3TKB4me5oc4mAiPkhTVnUC8ycu8FoP7vWjYW2Sc1ta3jkzszwxkoihxryqezLo46y',
          ],
        },
        version: 0,
      },
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetUSDCSOLTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        blockTime: 1748545222,
        meta: {
          computeUnitsConsumed: 101807,
          err: null,
          fee: 17129,
          innerInstructions: [
            {
              index: 2,
              instructions: [
                {
                  accounts: [18],
                  data: '84eT',
                  programIdIndex: 11,
                  stackHeight: 2,
                },
                {
                  accounts: [0, 2],
                  data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL',
                  programIdIndex: 4,
                  stackHeight: 2,
                },
                {
                  accounts: [2],
                  data: 'P',
                  programIdIndex: 11,
                  stackHeight: 2,
                },
                {
                  accounts: [2, 18],
                  data: '6Q6A46mVa7ntxYLTkQL1uwuXsmxKehnHCxSemuaNkzZYa',
                  programIdIndex: 11,
                  stackHeight: 2,
                },
              ],
            },
            {
              index: 3,
              instructions: [
                {
                  accounts: [14, 9, 5, 12, 13, 2, 1, 15, 16, 19, 0, 11],
                  data: '2j6vnwYDURn8yxjpGDgSwCk2TC7zm3ds9vF',
                  programIdIndex: 17,
                  stackHeight: 2,
                },
                {
                  accounts: [1, 13, 0],
                  data: '3GVQAnZaHe7Z',
                  programIdIndex: 11,
                  stackHeight: 3,
                },
                {
                  accounts: [12, 2, 14],
                  data: '3YCx4dunCXKm',
                  programIdIndex: 11,
                  stackHeight: 3,
                },
                {
                  accounts: [8],
                  data: 'QMqFu4fYGGeUEysFnenhAvD866YwW6jMndC6NeFLmgrgSsQrYzqQkLQZLriiyYAHU6DY9CABySGbF8TQvwB3my7Y4x2mCV92TazD1F3CPHC5Lc1t9Sxvsw4uAWevnAMmvZuNDYJ2mVPStyXdQdpeMWPunS72XGr9kntRo29mYiYQRSF',
                  programIdIndex: 10,
                  stackHeight: 2,
                },
              ],
            },
          ],
          loadedAddresses: {
            readonly: [
              'J4HJYz4p7TRP96WVFky3vh7XryxoFehHjoRySUTeSeXw',
              'obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y',
              'So11111111111111111111111111111111111111112',
              'Sysvar1nstructions1111111111111111111111111',
            ],
            writable: [
              '86KSdCfcqnJo9TCLFi3zxsJAJzvx9QU7oEPd6Fn5ZPom',
              '8ofECjHnVGLU4ywyPdK6mFddEqAuXsnrrov8m2zeFhvj',
              'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK',
              'FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q',
            ],
          },
          logMessages: [
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
            'Program log: CreateIdempotent',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: GetAccountDataSize',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 115585 compute units',
            'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program 11111111111111111111111111111111 invoke [2]',
            'Program 11111111111111111111111111111111 success',
            'Program log: Initialize the associated token account',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: InitializeImmutableOwner',
            'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 108998 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: InitializeAccount3',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 105116 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 19315 of 120990 compute units',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]',
            'Program log: Instruction: Route',
            'Program obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y invoke [2]',
            'Program log: Instruction: Swap',
            'Program log: price_x: 1679383',
            'Program log: price_y: 10000',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 49483 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 41962 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program log: YX15 224719444972,123013945942,991250,5903984',
            'Program obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y consumed 66637 of 97183 compute units',
            'Program obriQD1zbpyLz95G5n7nJe6a4DPjpFwa5XYPoNm113y success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 28810 compute units',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 74633 of 101675 compute units',
            'Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 cBZaAAAAAAA=',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: CloseAccount',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2915 of 27042 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 24127 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
          ],
          postBalances: [
            1538468067, 2039280, 0, 2039280, 1, 29900160, 731913600, 1, 1017968,
            8741760, 1141440, 934087680, 224715580269, 2039280, 5526241,
            3167032033, 2561280, 1141440, 1045539216193, 0,
          ],
          postTokenBalances: [
            {
              accountIndex: 1,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '11827324',
                decimals: 6,
                uiAmount: 11.827324,
                uiAmountString: '11.827324',
              },
            },
            {
              accountIndex: 3,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '244533398',
                decimals: 6,
                uiAmount: 244.533398,
                uiAmountString: '244.533398',
              },
            },
            {
              accountIndex: 12,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '224713540988',
                decimals: 9,
                uiAmount: 224.713540988,
                uiAmountString: '224.713540988',
              },
            },
            {
              accountIndex: 13,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: 'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '123014937192',
                decimals: 6,
                uiAmount: 123014.937192,
                uiAmountString: '123014.937192',
              },
            },
          ],
          preBalances: [
            1532581212, 2039280, 0, 2039280, 1, 29900160, 731913600, 1, 1017968,
            8741760, 1141440, 934087680, 224721484253, 2039280, 5526241,
            3167032033, 2561280, 1141440, 1045539216193, 0,
          ],
          preTokenBalances: [
            {
              accountIndex: 1,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '12827324',
                decimals: 6,
                uiAmount: 12.827324,
                uiAmountString: '12.827324',
              },
            },
            {
              accountIndex: 3,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '244524648',
                decimals: 6,
                uiAmount: 244.524648,
                uiAmountString: '244.524648',
              },
            },
            {
              accountIndex: 12,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '224719444972',
                decimals: 9,
                uiAmount: 224.719444972,
                uiAmountString: '224.719444972',
              },
            },
            {
              accountIndex: 13,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: 'Fn68NZzCCgZKtYmnAYbkL6w5NNx3TgjW91dGkLA3hsDK',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '123013945942',
                decimals: 6,
                uiAmount: 123013.945942,
                uiAmountString: '123013.945942',
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 343302515,
        transaction: {
          message: {
            accountKeys: [
              '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              'F77xG4vz2CJeMxxAmFW8pvPx2c5Uk75pksr6Wwx6HFhV',
              'Ffqao4nxSvgaR5kvFz1F718WaxSv6LnNfHuGqFEZ8fzL',
              'H4FVf2mGfHN26D1CkZ6sJAb6xUhhnW1w9abpaxHnUbUD',
              '11111111111111111111111111111111',
              '6YawcNeZ74tRyCv4UfGydYMr7eho7vbUR6ScVffxKAb3',
              'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
              'ComputeBudget111111111111111111111111111111',
              'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf',
              'GZsNmWKbqhMYtdSkkvMdEyQF9k5mLmP7tTKYWZjcHVPE',
              'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            ],
            addressTableLookups: [
              {
                accountKey: 'HPLCVFcCMgt6mp5uZLo9u8WnqAe2Yan7Sf285fRmitYP',
                readonlyIndexes: [14, 15, 42, 16],
                writableIndexes: [18, 13, 12, 11],
              },
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 8,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [],
                data: '3gJqkocMWaMm',
                programIdIndex: 7,
                stackHeight: null,
              },
              {
                accounts: [],
                data: 'KGo3nf',
                programIdIndex: 7,
                stackHeight: null,
              },
              {
                accounts: [0, 2, 0, 18, 4, 11],
                data: '2',
                programIdIndex: 6,
                stackHeight: null,
              },
              {
                accounts: [
                  11, 0, 1, 2, 10, 18, 10, 8, 10, 17, 14, 9, 5, 12, 13, 2, 1,
                  15, 16, 19, 0, 11,
                ],
                data: '2jtsaD446yyqqK5qJ4cgMnD16xhu3vMUQSmXDEWJrsxn4RTnsh',
                programIdIndex: 10,
                stackHeight: null,
              },
              {
                accounts: [2, 0, 0],
                data: 'A',
                programIdIndex: 11,
                stackHeight: null,
              },
              {
                accounts: [1, 3, 0],
                data: '3MB7Gffrb7zX',
                programIdIndex: 11,
                stackHeight: null,
              },
            ],
            recentBlockhash: 'FN4BriKgvHGgyzrz1iZ1rv2zfAvogZ9fFbKiwL8b9Eru',
          },
          signatures: [
            '28rWme56aMyaP8oX18unFeZg65iyDEhjLhvMBpxyFgKcn38P37ZRsssSZoHDCCr5xUfwfpqsVSSBoShLitHQLdrr',
          ],
        },
        version: 0,
      },
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetSOLUSDCTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        blockTime: 1748539157,
        meta: {
          computeUnitsConsumed: 129912,
          err: null,
          fee: 34455,
          innerInstructions: [
            {
              index: 2,
              instructions: [
                {
                  accounts: [18],
                  data: '84eT',
                  programIdIndex: 10,
                  stackHeight: 2,
                },
                {
                  accounts: [0, 3],
                  data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL',
                  programIdIndex: 4,
                  stackHeight: 2,
                },
                {
                  accounts: [3],
                  data: 'P',
                  programIdIndex: 10,
                  stackHeight: 2,
                },
                {
                  accounts: [3, 18],
                  data: '6Q6A46mVa7ntxYLTkQL1uwuXsmxKehnHCxSemuaNkzZYa',
                  programIdIndex: 10,
                  stackHeight: 2,
                },
              ],
            },
            {
              index: 5,
              instructions: [
                {
                  accounts: [15, 11, 14, 2, 3, 12, 13, 0, 17, 10],
                  data: '6dBsuaBHXi8d2gsEfL23XB5nEqri41gT9gsPuiAtUgKFBMZ',
                  programIdIndex: 16,
                  stackHeight: 2,
                },
                {
                  accounts: [12, 2, 17],
                  data: '3FZHQ8FDYaDD',
                  programIdIndex: 10,
                  stackHeight: 3,
                },
                {
                  accounts: [3, 13, 0],
                  data: '3GVQAnZaHe7Z',
                  programIdIndex: 10,
                  stackHeight: 3,
                },
                {
                  accounts: [7],
                  data: 'QMqFu4fYGGeUEysFnenhAvzEgC7KtWo3rbrz23rHmuYejeLpEsEDEW5eGmGdnztjRTWgSaJpnoTKGasY2QkCKXdyfgLczCs3UG1bALyTqFNfEYTvwo9ekgYF7N9RYPfcP6Up2xqDwHiV57BD3fVY6UnXE7vVpPfwPsPuYJ1DzNU3Zcs',
                  programIdIndex: 9,
                  stackHeight: 2,
                },
              ],
            },
          ],
          loadedAddresses: {
            readonly: [
              '8NsPwRFYqob3FzYvHYTjFK6WVFJADFN8Hn7yNQKcVNW1',
              'HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt',
              'J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt',
              'So11111111111111111111111111111111111111112',
            ],
            writable: [
              '2SgUGxYDczrB6wUzXHPJH65pNhWkEzNMEx3km4xTYUTC',
              '3f9kSZg8PPJ6NkLwVdXeff16ZT1XbkmT5eaQCqUnpDWx',
              '4maNZQtYFA1cdB55aLS321dxwdH1Y8NWaH4qiMedKpTZ',
              'FaF5XKRqTNaQ7zXwYNtpig2Q1HArtzJK4xB8XxHERF2j',
            ],
          },
          logMessages: [
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
            'Program log: CreateIdempotent',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: GetAccountDataSize',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 149999 compute units',
            'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program 11111111111111111111111111111111 invoke [2]',
            'Program 11111111111111111111111111111111 success',
            'Program log: Initialize the associated token account',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: InitializeImmutableOwner',
            'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 143412 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: InitializeAccount3',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 139530 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 19315 of 155404 compute units',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: SyncNative',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3045 of 135939 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]',
            'Program log: Instruction: Route',
            'Program HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt invoke [2]',
            'Program log: Instruction: Swap',
            'Program log: INVARIANT: SWAP',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 45582 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 38288 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt consumed 95056 of 127418 compute units',
            'Program HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 30625 compute units',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 104037 of 132894 compute units',
            'Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 DIwCAAAAAAA=',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: CloseAccount',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2915 of 28857 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
          ],
          postBalances: [
            1532581212, 7648893840, 2039280, 0, 1, 731913600, 1, 1017968,
            391278827123, 1141440, 934087680, 17903222, 24039280, 27021899342,
            78139920, 1405920, 1141440, 32151736, 1045539216193,
          ],
          postTokenBalances: [
            {
              accountIndex: 2,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '12827324',
                decimals: 6,
                uiAmount: 12.827324,
                uiAmountString: '12.827324',
              },
            },
            {
              accountIndex: 12,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: 'J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '3902878273',
                decimals: 6,
                uiAmount: 3902.878273,
                uiAmountString: '3902.878273',
              },
            },
            {
              accountIndex: 13,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '27019860062',
                decimals: 9,
                uiAmount: 27.019860062,
                uiAmountString: '27.019860062',
              },
            },
          ],
          preBalances: [
            1533615667, 7648885090, 2039280, 0, 1, 731913600, 1, 1017968,
            391278827123, 1141440, 934087680, 17903222, 24039280, 27020908092,
            78139920, 1405920, 1141440, 32151736, 1045539216193,
          ],
          preTokenBalances: [
            {
              accountIndex: 2,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '12660400',
                decimals: 6,
                uiAmount: 12.6604,
                uiAmountString: '12.6604',
              },
            },
            {
              accountIndex: 12,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: 'J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '3903045197',
                decimals: 6,
                uiAmount: 3903.045197,
                uiAmountString: '3903.045197',
              },
            },
            {
              accountIndex: 13,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'J4uBbeoWpZE8fH58PM1Fp9n9K6f1aThyeVCyRdJbaXqt',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '27018868812',
                decimals: 9,
                uiAmount: 27.018868812,
                uiAmountString: '27.018868812',
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 343287088,
        transaction: {
          message: {
            accountKeys: [
              '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA',
              'F77xG4vz2CJeMxxAmFW8pvPx2c5Uk75pksr6Wwx6HFhV',
              'Ffqao4nxSvgaR5kvFz1F718WaxSv6LnNfHuGqFEZ8fzL',
              '11111111111111111111111111111111',
              'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
              'ComputeBudget111111111111111111111111111111',
              'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf',
              'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            ],
            addressTableLookups: [
              {
                accountKey: 'G6EBADumaU4MaifUPMYY77Ao74ogBSwGDsavzcmYRkUA',
                readonlyIndexes: [129, 128, 204, 55],
                writableIndexes: [205, 203, 199, 206],
              },
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 7,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [],
                data: '3ukRnd9B42QF',
                programIdIndex: 6,
                stackHeight: null,
              },
              {
                accounts: [],
                data: 'FXeDT5',
                programIdIndex: 6,
                stackHeight: null,
              },
              {
                accounts: [0, 3, 0, 18, 4, 10],
                data: '2',
                programIdIndex: 5,
                stackHeight: null,
              },
              {
                accounts: [0, 3],
                data: '3Bxs43tVpaBHi3Us',
                programIdIndex: 4,
                stackHeight: null,
              },
              {
                accounts: [3],
                data: 'J',
                programIdIndex: 10,
                stackHeight: null,
              },
              {
                accounts: [
                  10, 0, 3, 2, 9, 8, 9, 7, 9, 16, 15, 11, 14, 2, 3, 12, 13, 0,
                  17, 10, 9,
                ],
                data: '2jtsaD446yyqqK5qHzyBL7AJRuFwz8jmkAGiCoB56mM29yqUXh',
                programIdIndex: 9,
                stackHeight: null,
              },
              {
                accounts: [3, 0, 0],
                data: 'A',
                programIdIndex: 10,
                stackHeight: null,
              },
              {
                accounts: [0, 1],
                data: '3Bxs48aCvTHa1XMq',
                programIdIndex: 4,
                stackHeight: null,
              },
            ],
            recentBlockhash: 'CR4RkaZprQixHJC3EQdkcMRte8E3GwLfec6ehefyvtmk',
          },
          signatures: [
            '2m8z8uPZyoZwQpissDbhSfW5XDTFmpc7cSFithc5e1w8iCwFcvVkxHeaVhgFSdgUPb5cebbKGjuu48JMLPjfEATr',
          ],
        },
        version: 0,
      },
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetPKINSOLTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        blockTime: 1748516275,
        meta: {
          computeUnitsConsumed: 89091,
          err: null,
          fee: 10326,
          innerInstructions: [
            {
              index: 2,
              instructions: [
                {
                  accounts: [17],
                  data: '84eT',
                  programIdIndex: 12,
                  stackHeight: 2,
                },
                {
                  accounts: [0, 6],
                  data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL',
                  programIdIndex: 7,
                  stackHeight: 2,
                },
                {
                  accounts: [6],
                  data: 'P',
                  programIdIndex: 12,
                  stackHeight: 2,
                },
                {
                  accounts: [6, 17],
                  data: '6Q6A46mVa7ntxYLTkQL1uwuXsmxKehnHCxSemuaNkzZYa',
                  programIdIndex: 12,
                  stackHeight: 2,
                },
              ],
            },
            {
              index: 3,
              instructions: [
                {
                  accounts: [12, 0, 14, 6, 15, 2, 13, 5, 4, 3, 16],
                  data: '59p8WydnSZtSDohjdrC6LsgsQkosue1gB1AivptrWVJsUBAba2iUiN5z1m',
                  programIdIndex: 18,
                  stackHeight: 2,
                },
                {
                  accounts: [2, 13, 0],
                  data: '3GVQAnZaHe7Z',
                  programIdIndex: 12,
                  stackHeight: 3,
                },
                {
                  accounts: [15, 6, 14],
                  data: '3ThXuAtkUfjV',
                  programIdIndex: 12,
                  stackHeight: 3,
                },
                {
                  accounts: [10],
                  data: 'QMqFu4fYGGeUEysFnenhAvDWgqp1W7DbrMv3z8JcyrP4Bu3Yyyj7irLW76wEzMiFqiR5My6zdyULfwutxiLA8ANwfjDKnvVNe7WPuin5AAqe9kBUvF8PWHrij2ZZwSVoyvpMVT9oR6y8oSbQW89J3R86qd3qc3fGyWArCteZwEuxWsZ',
                  programIdIndex: 11,
                  stackHeight: 2,
                },
              ],
            },
          ],
          loadedAddresses: {
            readonly: [
              'CxM8yx8h67qxuh4fwCFXNGdwUEcohe5PNsJPHof7gFSU',
              'So11111111111111111111111111111111111111112',
              'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
            ],
            writable: [
              'C4z3yz8SSRBjS3Qomi5ravhLaBHt6yhU56HnM3WC7uNz',
              'CuK2hDN8wE54Ncb4guJ7UeKwvAH4DEpWLgBPdhAnx7ya',
              'HBZwHfFBQvGt2VKXfzNm8RcQzD94jJ9S9SsDDX88fhpW',
            ],
          },
          logMessages: [
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
            'Program log: CreateIdempotent',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: GetAccountDataSize',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 101024 compute units',
            'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program 11111111111111111111111111111111 invoke [2]',
            'Program 11111111111111111111111111111111 success',
            'Program log: Initialize the associated token account',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: InitializeImmutableOwner',
            'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 94437 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: InitializeAccount3',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3158 of 90555 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 19315 of 106429 compute units',
            'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]',
            'Program log: Instruction: Route',
            'Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc invoke [2]',
            'Program log: Instruction: Swap',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 44634 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 36929 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program data: 4cpJr5MroJaw1yTZHjj9dDxFKTLqeniSpuk6F0QOU/lU8TuJT6VasQCiQS2jB/waSgoAAAAAAAAA0s9sVjJgO0oKAAAAAAAAABIgDwAAAAAAVSQAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5xUAAAAAAABFAwAAAAAAAA==',
            'Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc consumed 53918 of 82620 compute units',
            'Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 26965 compute units',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 61917 of 87114 compute units',
            'Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 VSQAAAAAAAA=',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: CloseAccount',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2915 of 25197 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 22282 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
          ],
          postBalances: [
            1564527643, 2039280, 2039280, 0, 0, 70407360, 0, 1, 731913600, 1,
            1017918, 1141440, 934087680, 2039280, 5435760, 197617842, 0,
            1045539216193, 1141440,
          ],
          postTokenBalances: [
            {
              accountIndex: 1,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '8837',
                decimals: 6,
                uiAmount: 0.008837,
                uiAmountString: '0.008837',
              },
            },
            {
              accountIndex: 2,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '1052622046',
                decimals: 6,
                uiAmount: 1052.622046,
                uiAmountString: '1052.622046',
              },
            },
            {
              accountIndex: 13,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: 'CuK2hDN8wE54Ncb4guJ7UeKwvAH4DEpWLgBPdhAnx7ya',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '20756195180',
                decimals: 6,
                uiAmount: 20756.19518,
                uiAmountString: '20756.19518',
              },
            },
            {
              accountIndex: 15,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'CuK2hDN8wE54Ncb4guJ7UeKwvAH4DEpWLgBPdhAnx7ya',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '195578562',
                decimals: 9,
                uiAmount: 0.195578562,
                uiAmountString: '0.195578562',
              },
            },
          ],
          preBalances: [
            1564528668, 2039280, 2039280, 0, 0, 70407360, 0, 1, 731913600, 1,
            1017918, 1141440, 934087680, 2039280, 5435760, 197627143, 0,
            1045539216193, 1141440,
          ],
          preTokenBalances: [
            {
              accountIndex: 1,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '87',
                decimals: 6,
                uiAmount: 0.000087,
                uiAmountString: '0.000087',
              },
            },
            {
              accountIndex: 2,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '1053622046',
                decimals: 6,
                uiAmount: 1053.622046,
                uiAmountString: '1053.622046',
              },
            },
            {
              accountIndex: 13,
              mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
              owner: 'CuK2hDN8wE54Ncb4guJ7UeKwvAH4DEpWLgBPdhAnx7ya',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '20755203930',
                decimals: 6,
                uiAmount: 20755.20393,
                uiAmountString: '20755.20393',
              },
            },
            {
              accountIndex: 15,
              mint: 'So11111111111111111111111111111111111111112',
              owner: 'CuK2hDN8wE54Ncb4guJ7UeKwvAH4DEpWLgBPdhAnx7ya',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '195587863',
                decimals: 9,
                uiAmount: 0.195587863,
                uiAmountString: '0.195587863',
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 343229064,
        transaction: {
          message: {
            accountKeys: [
              '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              '4RgH3zvDTdHUoX8jY4TFb87kbPwj7LsD1QT3jVGUcHwV',
              '9yVetFBzUDjrXSsNDdY6eSiTYaLWgbBwDDv5Dsf35djC',
              'Btu8ZdZrRsbGfD1sWEbWnL1HptYn5Z4hJGUjDKogThhr',
              'DhXNHQnMosbBFWP6vqDSjKa2M24dU385JhU6Ezmd5MyN',
              'EfP44VmzMaMAMvZLFAtEEEHrc43hYroyBnpP5xXxhBir',
              'Ffqao4nxSvgaR5kvFz1F718WaxSv6LnNfHuGqFEZ8fzL',
              '11111111111111111111111111111111',
              'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
              'ComputeBudget111111111111111111111111111111',
              'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf',
              'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            ],
            addressTableLookups: [
              {
                accountKey: 'Gu7KCqeWsYEYWDzEKQet6bgw1dxd4VDMQi3Nypj3M5hU',
                readonlyIndexes: [28, 12, 6],
                writableIndexes: [0, 27, 8],
              },
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 6,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [],
                data: '3uE7RD71ytdm',
                programIdIndex: 9,
                stackHeight: null,
              },
              {
                accounts: [],
                data: 'L4RX5H',
                programIdIndex: 9,
                stackHeight: null,
              },
              {
                accounts: [0, 6, 0, 17, 7, 12],
                data: '2',
                programIdIndex: 8,
                stackHeight: null,
              },
              {
                accounts: [
                  12, 0, 2, 6, 11, 17, 11, 10, 11, 18, 12, 0, 14, 6, 15, 2, 13,
                  5, 4, 3, 16,
                ],
                data: '2jtsaD446yyqqK5qHzstev2z1j2FTb9XgJZ6H7WHwsSpBq6SYo',
                programIdIndex: 11,
                stackHeight: null,
              },
              {
                accounts: [6, 0, 0],
                data: 'A',
                programIdIndex: 12,
                stackHeight: null,
              },
              {
                accounts: [2, 1, 0],
                data: '3MB7Gffrb7zX',
                programIdIndex: 12,
                stackHeight: null,
              },
            ],
            recentBlockhash: 'AMTPfYBY3ZJmVgE15o352TY4Qyqt7AcQBLsP4iiUS8Jm',
          },
          signatures: [
            '1T8H7suhyWyWEf6jHC8vCT93Uj8X1m36VYxUmPgxwc8YXk356SM1CFhkmTnerg29ceVvKiHkpdYFKgytTsR2Zxe',
          ],
        },
        version: 0,
      },
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockSendSolanaTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result:
        '3nqGKH1ef8WkTgKXZ8q3xKsvjktWmHHhJpZMSdbB6hBqy5dA7aLVSAUjw5okezZjKMHiNg2MF5HAqtpmsesQtnpj',
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
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
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTokenAccountsByOwner',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
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
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getFeeForMessage',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetFeeForMessageDevnet(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: { context: { slot: 5068 }, value: 5000 },
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_DEVNET)
    .withJsonBodyIncluding({
      method: 'getFeeForMessage',
    })
    .thenCallback(() => {
      return response;
    });
}
export async function mockGetTokenAccountsTokenProgramSwaps(
  mockServer: Mockttp,
) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          apiVersion: '2.2.14',
          slot: 343229969,
        },
        value: [
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '9doRRAik5gvhbEwjbZDbZR6GxXSAfdoomyJR57xKpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '314595883',
                      decimals: 6,
                      uiAmount: 314.595883,
                      uiAmountString: '314.595883',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '3yDyeHifh3EznD2Z7VY9nWx3prSjjgdwQkS5RpCcF8s2',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '23986313',
                      decimals: 8,
                      uiAmount: 0.23986313,
                      uiAmountString: '0.23986313',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '3vuphhHwdnTSGjf5wGrGSFFroPULVYYUqzJe1DVdQsuJ',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '154294',
                      decimals: 6,
                      uiAmount: 0.154294,
                      uiAmountString: '0.154294',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'GuNi16eeE5B4GYJkEw56S7DZSB7LeTYPqSvKRvjTsnbb',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'Ai3eKAWjzKMV8wRwd41nVP83yqfbAVJykhvJVPxspump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '75819432',
                      decimals: 6,
                      uiAmount: 75.819432,
                      uiAmountString: '75.819432',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'DbHKaVdNkyLY9nT8DiEgS8Pak3etvCDioeVfnLgc89Rt',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'EQ83rcnFgBUeVYrDz8kDeVUyKkzBuD6U2GbP5jo2pump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '353983574488',
                      decimals: 6,
                      uiAmount: 353983.574488,
                      uiAmountString: '353983.574488',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'Hu8MBvSETquRiyoxmancTqaSgfgGs3wYZ8TPjMtFAUST',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '769PDM2wL4GgaK8MTCMvCKFkuVDWtEzYyHZMVAB9pump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '3516719700',
                      decimals: 6,
                      uiAmount: 3516.7197,
                      uiAmountString: '3516.7197',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '8r2t12xXY7G9wa1UQC3rEVCCQNgq79LHae51pixhBgs2',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '8908267',
                      decimals: 6,
                      uiAmount: 8.908267,
                      uiAmountString: '8.908267',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'F77xG4vz2CJeMxxAmFW8pvPx2c5Uk75pksr6Wwx6HFhV',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '1249172',
                      decimals: 6,
                      uiAmount: 1.249172,
                      uiAmountString: '1.249172',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'HQKjnbcPFiuephwEBWzUTriVz4Eb6NTBW6yCLLGABDaq',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '51422992417',
                      decimals: 5,
                      uiAmount: 514229.92417,
                      uiAmountString: '514229.92417',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '3eijxpr9TikQHCqwzFcWgZKh22axxsVFWHtGcoJEKD73',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '7Lhfqr3qitZzVqy85ZbWrfQw5Sdr81qzYoWdb1EVpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '34996714709',
                      decimals: 6,
                      uiAmount: 34996.714709,
                      uiAmountString: '34996.714709',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'AFRTc41SvH4rKVi9c4Q2SAHj8gFsNn8vJvacXM8wC4NB',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '7T2uEpf76VtTmGcjoRHM7su5oqk26QRLkxjYxywWpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '35408223678',
                      decimals: 6,
                      uiAmount: 35408.223678,
                      uiAmountString: '35408.223678',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '3XM436p6fYoNCUyyr3MT9JCi2DUtp7gTbAsZAoHj16MN',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'G3EDZoS49NRVKP8X1HggHZJueJeR8d2izUHeXdV3pump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '440485913',
                      decimals: 6,
                      uiAmount: 440.485913,
                      uiAmountString: '440.485913',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '5Smj24Ltb5fyKD1JJNVfKZVV5tNrCoxWRrGohdW4Lrzp',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'J1Wpmugrooj1yMyQKrdZ2vwRXG5rhfx3vTnYE39gpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '3080998',
                      decimals: 6,
                      uiAmount: 3.080998,
                      uiAmountString: '3.080998',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '3Tfw2vJSXpAZqDRSxaGbFBjwCD8dnkphzXx1CbLjhdEq',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'FUAfBo2jgks6gB4Z4LfZkqSZgzNucisEHqnNebaRxM1P',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '66713',
                      decimals: 6,
                      uiAmount: 0.066713,
                      uiAmountString: '0.066713',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '4NMJaUqMA6GezuaDWo2x9aseTMUXxKeLqiyUJ8f2ZjJD',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'E4Q5pLaEiejwEQHcM9GeYSQfMyGy8DJ4bPWgeYthn24v',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '2123467877803',
                      decimals: 9,
                      uiAmount: 2123.467877803,
                      uiAmountString: '2123.467877803',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '8kK3GUVh7U1tgzWqmhWCzcieyRTvL6XqyWNZtr4NTswY',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '2y8gNtkPpc6gCY3jqA4BjzU5VKM131VUxsGVomgjpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '35730474484',
                      decimals: 6,
                      uiAmount: 35730.474484,
                      uiAmountString: '35730.474484',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '3hKapdExvT88crDZioEE3gTQE2aok1h7R27m6t6MkTHX',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '65075',
                      decimals: 6,
                      uiAmount: 0.065075,
                      uiAmountString: '0.065075',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '8xkWanz217CrnZsiXE6LwynRSLUh3gG24jYEiyX6qwGh',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '4NDJGFjYX3bHEraX4yq8ffcN2DuHUrphNRStjWJkpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '303627223008',
                      decimals: 6,
                      uiAmount: 303627.223008,
                      uiAmountString: '303627.223008',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '6Y4epJW4pnptbeEUSB33QJF6cfn5zU1myFq2QwUMPoFk',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '982659',
                      decimals: 6,
                      uiAmount: 0.982659,
                      uiAmountString: '0.982659',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'Frd1EFQVSJghKXojmQj74zvtTV1G81XgiANrgtnkod5t',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '7f94zk1EgfoeG57Vj5FtDDjMmPNHM4DYs7KRiyd2T4bA',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '10451732144847',
                      decimals: 9,
                      uiAmount: 10451.732144847,
                      uiAmountString: '10451.732144847',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '2joxUvSFN9YLUBt9YBDkEvKuE6uF1bd3KDU397ETj6dk',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '72319669',
                      decimals: 6,
                      uiAmount: 72.319669,
                      uiAmountString: '72.319669',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '8Lw8dSdkovD5aEpk8yaEAYgipkqQ1PbPPGzQKbdFUFno',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '57809638',
                      decimals: 6,
                      uiAmount: 57.809638,
                      uiAmountString: '57.809638',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '4qAyRKDQ58Y3K1jMDsKyd2cuaSwwQfFP5rYQiXzhR7tz',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '2fUFhZyd47Mapv9wcfXh5gnQwFXtqcYu9xAN4THBpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '12000000',
                      decimals: 6,
                      uiAmount: 12.0,
                      uiAmountString: '12',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '7Reu31qVZQQKq44CUKiV5TtzMjbZZcvKN5dPrYFxkoaZ',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '0',
                      decimals: 8,
                      uiAmount: 0.0,
                      uiAmountString: '0',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'FSSpA3wGnjJwRiCF1HhhEi2bX6yj9MCEgQ7u9Kws8ftN',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '5KCGJJpRMtbydUDTAoc5MoRPnqmJNNDaFwvBDdSG6daC',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '37135256151',
                      decimals: 6,
                      uiAmount: 37135.256151,
                      uiAmountString: '37135.256151',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '7o5zqQTKtwpPob6E8cQxyPwdwdzrfjvoK2mp1Za3oxYd',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '4FEmjnc7ETPZUi6vcAhjkEtPH9gDFZ8wPtBUi3SVgojP',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '990487',
                      decimals: 8,
                      uiAmount: 0.00990487,
                      uiAmountString: '0.00990487',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '8119nb3heDcf9iJYwG1PoXDrRi8h2zeCBBztmTJ5N77K',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '121652521',
                      decimals: 9,
                      uiAmount: 0.121652521,
                      uiAmountString: '0.121652521',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '8yvQJJC8wr6Vntfg247Hu4xeme6tKqvUv1HztMrMPwQS',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'bobaM3u8QmqZhY1HwAtnvze9DLXvkgKYk3td3t8MLva',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '1029376517',
                      decimals: 6,
                      uiAmount: 1029.376517,
                      uiAmountString: '1029.376517',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'wgjLyyqvTvpzfr8adCyU4XSH8yJPhntWYMhwLhQteKU',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '1323863',
                      decimals: 6,
                      uiAmount: 1.323863,
                      uiAmountString: '1.323863',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '3kSx5A3dtJBdk3guPgSYLmNJ7Jc415u7DqekfwgH2baz',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 's6nSHLDSpEYWPRZgXkLPsqe2iSbWZZq53eVshC3pump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '2546574702',
                      decimals: 6,
                      uiAmount: 2546.574702,
                      uiAmountString: '2546.574702',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'Fiw97seQPBJPd3cfyftGyZUG1Y6NeC2dhxGx7S5yTNCR',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'GkyZ3xtwoA35nTXE1t26uKGL6jjiC6zM9pGjvdtpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '0',
                      decimals: 6,
                      uiAmount: 0.0,
                      uiAmountString: '0',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '7qjAXKhEUkLwBtCPfdx1yJDaX84bcdqW7bUGzNrqNoxB',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'A8YHuvQBMAxXoZAZE72FyC8B7jKHo8RJyByXRRffpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '509459547',
                      decimals: 6,
                      uiAmount: 509.459547,
                      uiAmountString: '509.459547',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '9QfrUWEBUjsu6pnmoBc8JS7TTarFo2TuTfn75cUFruNg',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '6884860',
                      decimals: 9,
                      uiAmount: 0.00688486,
                      uiAmountString: '0.00688486',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '6AKMz2gsminbjAKiAa6Qe2V3iGaUzMk4pPvkpQ5Sy8up',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '3vgopg7xm3EWkXfxmWPUpcf7g939hecfqg18sLuXDzVt',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '16056663',
                      decimals: 5,
                      uiAmount: 160.56663,
                      uiAmountString: '160.56663',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '4yM7n73wR1KfDkiTwSfYujS4Fht7V7EijhivTsETBDjT',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'HaMv3cdfDW6357yjpDur6kb6w52BUPJrMJpR76tjpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '2455230499',
                      decimals: 6,
                      uiAmount: 2455.230499,
                      uiAmountString: '2455.230499',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'CedBdQf8zYzjModUXwZ1pVMaLsyaY3CXV9Rr8quBG82T',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '7998500',
                      decimals: 6,
                      uiAmount: 7.9985,
                      uiAmountString: '7.9985',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'CUonExueT2hVacmtVYxbV6tXHDfexd57NPHj8odNBpEa',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '5858280',
                      decimals: 6,
                      uiAmount: 5.85828,
                      uiAmountString: '5.85828',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '5YQ3cpxPx7ff4dH5NVbJbefNPWGwzSEpJqXE4Pk9EUV1',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '41c4xTTHWRLQn9Cvco9zGCwLPBFEUvoK81Z6LS1KjajY',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '1',
                      decimals: 0,
                      uiAmount: 1.0,
                      uiAmountString: '1',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'HezCUACsn5BbQ7WgumvEojdRGYGPccqmcxnGwzkbpnL9',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '193298',
                      decimals: 6,
                      uiAmount: 0.193298,
                      uiAmountString: '0.193298',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'GeLW25iyKu8LyiuJ7J4rChfdBT5mr5V5DULuZMqQA5tB',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '1052622046',
                      decimals: 6,
                      uiAmount: 1052.622046,
                      uiAmountString: '1052.622046',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '9yVetFBzUDjrXSsNDdY6eSiTYaLWgbBwDDv5Dsf35djC',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '19623247',
                      decimals: 9,
                      uiAmount: 0.019623247,
                      uiAmountString: '0.019623247',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: 'HFsy9jjM3J4SBSws2HEKAyFoXYdtPPS6GSTjziqu9v8D',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    isNative: false,
                    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '555',
                      decimals: 6,
                      uiAmount: 0.000555,
                      uiAmountString: '0.000555',
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
              rentEpoch: 18446744073709551615,
              space: 165,
            },
            pubkey: '6Ac3jJCMU9iP7qmzhiyXjS7WvjwTjiYhHvpbwpErPGQ4',
          },
        ],
      },
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTokenAccountsByOwner',
      params: [
        '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
        {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
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

export async function mockGetTokenAccountsTokenProgram2022Swaps(
  mockServer: Mockttp,
) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          apiVersion: '2.2.14',
          slot: 343229969,
        },
        value: [
          {
            account: {
              data: {
                parsed: {
                  info: {
                    extensions: [
                      {
                        extension: 'immutableOwner',
                      },
                      {
                        extension: 'transferFeeAmount',
                        state: {
                          withheldAmount: 439972989,
                        },
                      },
                    ],
                    isNative: false,
                    mint: '7atgF8KQo4wJrD5ATGX7t1V2zVvykPJbFfNeVf1icFv1',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '10559351714',
                      decimals: 2,
                      uiAmount: 105593517.14,
                      uiAmountString: '105593517.14',
                    },
                  },
                  type: 'account',
                },
                program: 'spl-token-2022',
                space: 182,
              },
              executable: false,
              lamports: 2157600,
              owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
              rentEpoch: 18446744073709551615,
              space: 182,
            },
            pubkey: 'Ep1j6MKrqJRr1XiMgaJsAfuAVwrGMJFui4A92mo6uy4P',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    extensions: [
                      {
                        extension: 'immutableOwner',
                      },
                      {
                        extension: 'transferFeeAmount',
                        state: {
                          withheldAmount: 20016866,
                        },
                      },
                    ],
                    isNative: false,
                    mint: 'Ey59PH7Z4BFU4HjyKnyMdWt5GGN76KazTAwQihoUXRnk',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '6496613429',
                      decimals: 9,
                      uiAmount: 6.496613429,
                      uiAmountString: '6.496613429',
                    },
                  },
                  type: 'account',
                },
                program: 'spl-token-2022',
                space: 182,
              },
              executable: false,
              lamports: 2157600,
              owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
              rentEpoch: 18446744073709551615,
              space: 182,
            },
            pubkey: 'GAttXjiLSqu7CFbR5ut8qWPqmAzGnnM6eBsQbEPv74fv',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    extensions: [
                      {
                        extension: 'immutableOwner',
                      },
                    ],
                    isNative: false,
                    mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '40066179490',
                      decimals: 9,
                      uiAmount: 40.06617949,
                      uiAmountString: '40.06617949',
                    },
                  },
                  type: 'account',
                },
                program: 'spl-token-2022',
                space: 170,
              },
              executable: false,
              lamports: 2074080,
              owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
              rentEpoch: 18446744073709551615,
              space: 170,
            },
            pubkey: '5rwKMx2FKuUF4jYUG5584wXU8utAD6Q1JUTvpTf6tyZ4',
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    extensions: [
                      {
                        extension: 'immutableOwner',
                      },
                    ],
                    isNative: false,
                    mint: '4EXRq3Pt9qqaoR9iXw6yZYMweoDE5PGSUak5z9jfafmZ',
                    owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                    state: 'initialized',
                    tokenAmount: {
                      amount: '1',
                      decimals: 0,
                      uiAmount: 1.0,
                      uiAmountString: '1',
                    },
                  },
                  type: 'account',
                },
                program: 'spl-token-2022',
                space: 170,
              },
              executable: false,
              lamports: 2074080,
              owner: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
              rentEpoch: 18446744073709551615,
              space: 170,
            },
            pubkey: 'D3fMWGBgqoBP4b58H1Hs2cyiYDz7pEANgiE4RsHQBk1T',
          },
        ],
      },
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTokenAccountsByOwner',
      params: [
        '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
        {
          programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
        },
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

export async function mockGetTokenAccountsByOwner(
  mockServer: Mockttp,
  account: string,
  programId: string,
) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTokenAccountsByOwner',
      params: [
        account,
        {
          programId,
        },
        {
          encoding: 'jsonParsed',
          commitment: 'confirmed',
        },
      ],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
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
                        owner: account,
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

export async function mockGetTokenAccountsByOwnerDevnet(mockServer: Mockttp) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX_DEVNET)
    .withJsonBodyIncluding({
      method: 'getTokenAccountsByOwner',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
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

export async function mockGetAccountInfoPKIN(mockServer: Mockttp) {
  console.log('mockGetAccountInfo');
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
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
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getAccountInfo',
    })
    .withBodyIncluding('2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin')
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetAccountInfoUSDC(mockServer: Mockttp) {
  console.log('mockGetAccountInfo');
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
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
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getAccountInfo',
    })
    .withBodyIncluding('2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin')
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetAccountInfoDevnet(mockServer: Mockttp) {
  console.log('mockGetAccountInfoDevnet');
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
      result: {
        context: {
          apiVersion: '2.0.21',
          slot: 317161313,
        },
        value: {
          data: [
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
            'base64',
          ],
          executable: false,
          lamports: 1124837338893,
          owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
          rentEpoch: 18446744073709551615,
          space: 82,
        },
      },
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_DEVNET)
    .withJsonBodyIncluding({
      method: 'getAccountInfo',
    })
    .withBodyIncluding('So11111111111111111111111111111111111111112')
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetTokenAccountInfo(mockServer: Mockttp) {
  console.log('mockGetTokenAccountInfo');
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
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
    .forPost(SOLANA_URL_REGEX_MAINNET)
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

export async function mockGetBridgeStatus(mockServer: Mockttp) {
  const bridgeStatusResponse = {
    statusCode: 200,
    json: {
      status: 'PENDING',
      bridge: 'relay',
      srcChain: {
        chainId: 1151111081099710,
        txHash:
          '2fwnBMKmGJ86uagQ9NEAyUfWeCrvTDn5WiZtiB8AFVtf1RiSaNmyfTxBw8Un7G5BRpoXACzvfhohyxCsCXhJWBJp',
      },
      destChain: {
        chainId: 1,
      },
    },
  };
  return await mockServer
    .forGet(BRIDGE_TX_STATUS)
    .withQuery({ chainId: 1 })
    .thenCallback(() => {
      return bridgeStatusResponse;
    });
}

export async function mockGetEthereumTokenList(mockServer: Mockttp) {
  console.log('mockGetEthereumTokenList');
  const ethereumTokenListResponse = {
    statusCode: 200,
    json: [
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        assetId: 'eip155:1/slip44:60',
        symbol: 'ETH',
        decimals: 18,
        name: 'Ethereum',
        coingeckoId: 'ethereum',
        aggregators: [],
        occurrences: 100,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
        metadata: {
          honeypotStatus: {},
          isContractVerified: false,
          erc20Permit: false,
          description: {
            en: 'Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.',
            ko: '이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.',
            zh: 'Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。',
            ja: 'イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。',
          },
          createdAt: '2023-10-31T22:41:58.553Z',
        },
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        chainId: 1,
        assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
        coingeckoId: 'dai',
        aggregators: [
          'metamask',
          'aave',
          'cmc',
          'coinGecko',
          'coinMarketCap',
          'openSwap',
          'uniswapLabs',
          'zerion',
          'oneInch',
          'liFi',
          'xSwap',
          'socket',
          'rubic',
          'squid',
          'rango',
          'sonarwatch',
          'sushiSwap',
          'pmm',
          'bancor',
        ],
        occurrences: 19,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x6b175474e89094c44da98b954eedeac495271d0f.png',
        metadata: {
          honeypotStatus: {
            honeypotIs: false,
            goPlus: false,
          },
          isContractVerified: true,
          fees: {
            avgFee: 0,
            maxFee: 0,
            minFee: 0,
          },
          storage: {
            balance: 2,
            approval: 3,
          },
          erc20Permit: true,
          description: {
            en: 'MakerDAO has launched Multi-collateral DAI (MCD). This token refers to the new DAI that is collaterized by multiple assets.',
          },
          createdAt: '2023-10-31T22:41:58.553Z',
        },
      },
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: 1,
        assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 6,
        name: 'USDC',
        coingeckoId: 'usd-coin',
        aggregators: [
          'metamask',
          'aave',
          'coinGecko',
          'coinMarketCap',
          'openSwap',
          'uniswapLabs',
          'zerion',
          'oneInch',
          'liFi',
          'xSwap',
          'socket',
          'rubic',
          'squid',
          'rango',
          'sonarwatch',
          'sushiSwap',
          'pmm',
          'bancor',
        ],
        occurrences: 18,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
        metadata: {
          honeypotStatus: {
            honeypotIs: false,
          },
          isContractVerified: true,
          fees: {
            avgFee: 0,
            maxFee: 0,
            minFee: 0,
          },
          storage: {
            balance: 9,
            approval: 10,
          },
          erc20Permit: true,
          description: {
            en: 'USDC is a fully collateralized US dollar stablecoin. USDC is the bridge between dollars and trading on cryptocurrency exchanges. The technology behind CENTRE makes it possible to exchange value between people, businesses and financial institutions just like email between mail services and texts between SMS providers. We believe by removing artificial economic borders, we can create a more inclusive global economy.',
          },
          createdAt: '2023-10-31T22:41:58.553Z',
        },
      },
    ],
  };
  return await mockServer
    .forGet(BRIDGED_TOKEN_LIST_API)
    .withQuery({ chainId: 1 })
    .thenCallback(() => {
      return ethereumTokenListResponse;
    });
}

export async function mockSOLQuote(mockServer: Mockttp) {
  return await mockServer
    .forGet(
      'https://price.api.cx.metamask.io/v3/spot-prices?assetIds=solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Fslip44%3A501&vsCurrency=eur',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            eur: 147.93676777178396,
          },
        },
      };
    });
}

export async function mockETHQuote(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .withQuery({ assetsIds: 'eip155:slip44', vsCurrency: 'usd' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          'eip155:1/eip155': {
            eur: 2543.12,
          },
        },
      };
    });
}

export async function mockNoQuotesAvailable(mockServer: Mockttp) {
  return await mockServer
    .forGet(BRIDGE_GET_QUOTE_API)
    .thenCallback(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // just to see fetching quotes
      return {
        statusCode: 200,
        json: [],
      };
    });
}
export async function mockQuoteFromUSDCtoSOL(mockServer: Mockttp) {
  const quotesResponse = {
    statusCode: 200,
    json: [
      {
        quote: {
          bridgeId: 'lifi',
          requestId:
            '0xd9990728abf1185f5accffaf77842ed6744e413ce5a626a63e8f455c26176f78',
          aggregator: 'lifi',
          srcChainId: 1151111081099710,
          srcTokenAmount: '991250',
          srcAsset: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            chainId: 1151111081099710,
            assetId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
            coingeckoId: 'usd-coin',
            aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
            occurrences: 4,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
            metadata: {},
            price: '0.999774',
          },
          destChainId: 1151111081099710,
          destTokenAmount: '5836864',
          destAsset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1151111081099710,
            assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            symbol: 'SOL',
            decimals: 9,
            name: 'SOL',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
            metadata: {},
            price: '168.49',
          },
          feeData: {
            metabridge: {
              amount: '8750',
              asset: {
                address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                chainId: 1151111081099710,
                assetId:
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                symbol: 'USDC',
                decimals: 6,
                name: 'USD Coin',
                coingeckoId: 'usd-coin',
                aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
                occurrences: 4,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
                metadata: {},
              },
            },
          },
          bridges: ['jupiter (via LiFi)'],
          steps: [
            {
              action: 'swap',
              srcChainId: 1151111081099710,
              destChainId: 1151111081099710,
              protocol: {
                name: 'jupiter',
                displayName: 'Jupiter',
                icon: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/jupiter.svg',
              },
              srcAsset: {
                address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                chainId: 1151111081099710,
                assetId:
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                symbol: 'USDC',
                decimals: 6,
                name: 'USD Coin',
                coingeckoId: 'usd-coin',
                aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
                occurrences: 4,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
                metadata: {},
              },
              destAsset: {
                address: '0x0000000000000000000000000000000000000000',
                chainId: 1151111081099710,
                assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                symbol: 'SOL',
                decimals: 9,
                name: 'SOL',
                aggregators: [],
                occurrences: 100,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                metadata: {},
              },
              srcAmount: '982577',
              destAmount: '5836864',
            },
          ],
          priceData: {
            totalFromAmountUsd: '0.999772',
            totalToAmountUsd: '0.98421200768',
            priceImpact: '0.015563540807304115',
          },
        },
        trade:
          'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAMESvsJhRtumFSoGZgsFcJr6DNYguB2VI+8YX3cCnnfUCfcvRFs6GawEjSqSj+B3TPe4te+nxkV8vMvILs8OrJPHnRlPacsnehxGUzvfBQOykkiuk2ZeKpI2vhOrOop7hbVO6QHypJEnWgmyavRZDxgbUvMIThv/+Q/ffa0JMGYGY62faezBYvIPIdPqffzy0Ah08sYIqHynXY7u6aYSziWQ0oPQ3SgjVP7wrjsOIn03zYnKJm+xfd+PfLfM775OvcVQan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAAA9Bq6GrSQ0IG2/BL7eCIiLNUD6si3bkLQciA0jpQI1IDBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAIyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZHoxPq4mUSUyPHlwSh0RbKRfWDEPHmqlZFi9dYABZjTLG+nrzvtutOj1l82qryXQxsbvkwtL24OR8pgIDRS9dYQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKk1oGb+rLnywLjLSrIQx6MkqNBhCFbxqY1YmoGZVORW/QR51VvyMcBu7nTFbs5oFQf9sbLeo/SOUQKxzaJWvBOPtD/6J/XX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5egED3F5rF3k3hTNBPd+KF4A2ipwMZyQ55D61KqG8HByUAoFAgYHCQBNyg9IqNelAAgABQIplQMACAAJA8T1AwAAAAAACQYAAQoLDA0BAQ0EAgsBAAoMAAAAAAAAAAAGCQYAAw4LDA0BAQ0EAgsDAAoM4CEAAAAAAAAGCQYABAAVDA0BAQ8VDQACBA8VDxAPFhcREgIEExQAGA0PJOUXy5d6460qAQAAABIBZAABMf4OAAAAAAA/DVkAAAAAAGQAAA0DBAAAAQkB4DYa6jZ39WscUTqRj/ZBkWPcZSOrplXadxvYM7bt86MEzc7LxwQ3gIHM',
        estimatedProcessingTimeInSeconds: 0,
      },
      {
        quote: {
          requestId:
            '0xdd4446ad2ed2e500538395a106da44f20c3ca939260089460aeddaec52388127',
          bridgeId: 'jupiter',
          aggregator: 'jupiter',
          srcChainId: 1151111081099710,
          srcTokenAmount: '991250',
          srcAsset: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            chainId: 1151111081099710,
            assetId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
            coingeckoId: 'usd-coin',
            aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
            occurrences: 4,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
            metadata: {},
          },
          destChainId: 1151111081099710,
          destTokenAmount: '5891206',
          destAsset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1151111081099710,
            assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            symbol: 'SOL',
            decimals: 9,
            name: 'SOL',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
            metadata: {},
          },
          feeData: {
            metabridge: {
              amount: '8750',
              asset: {
                address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                chainId: 1151111081099710,
                assetId:
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                symbol: 'USDC',
                decimals: 6,
                name: 'USD Coin',
                coingeckoId: 'usd-coin',
                aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
                occurrences: 4,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
                metadata: {},
              },
            },
          },
          bridges: ['Invariant'],
          steps: [],
          priceData: {
            totalFromAmountUsd: '0.999772',
            totalToAmountUsd: '0.9933751557200001',
            priceImpact: '0.006398303093105098',
          },
        },
        trade:
          'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAGCivsJhRtumFSoGZgsFcJr6DNYguB2VI+8YX3cCnnfUCf2faezBYvIPIdPqffzy0Ah08sYIqHynXY7u6aYSziWQ3RlPacsnehxGUzvfBQOykkiuk2ZeKpI2vhOrOop7hbVO6QHypJEnWgmyavRZDxgbUvMIThv/+Q/ffa0JMGYGY6AwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTj7Q/+if11/ZKdMCbHylYed5LCas238ndUUsyGqezjOXoSYaBAfYzguASD94F7oIIriSrPiNpNaY3cm888v4vTHcGBAAJA9xQAQAAAAAABAAFAuJvAgAFBgABAA4GBwEBCBUHAAIBCA4ICQgPEAoLAgEMDQARBwgk5RfLl3rjrSoBAAAAEgFkAAESIA8AAAAAAIbkWQAAAAAADwAABwMBAAABCQcDAgMACQMuIgAAAAAAAAHgNhrqNnf1axxROpGP9kGRY9xlI6umVdp3G9gztu3zowTNzsvHBDeAgcw=',
        estimatedProcessingTimeInSeconds: 0,
      },
    ],
  };
  return await mockServer
    .forGet(BRIDGE_GET_QUOTE_API)
    .thenCallback(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // just to see fetching quotes
      return quotesResponse;
    });
}

export async function mockQuoteFromSoltoUSDC(mockServer: Mockttp) {
  const quotesResponse = {
    statusCode: 200,
    json: [
      {
        quote: {
          bridgeId: 'lifi',
          requestId:
            '0xdab782c5426414879ca6988c95680ca43656a1758a875eb6afeb6e77ec8ec12d',
          aggregator: 'lifi',
          srcChainId: 1151111081099710,
          srcTokenAmount: '991250000',
          srcAsset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1151111081099710,
            assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            symbol: 'SOL',
            decimals: 9,
            name: 'SOL',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
            metadata: {},
            price: '168.83',
          },
          destChainId: 1151111081099710,
          destTokenAmount: '166266188',
          destAsset: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            chainId: 1151111081099710,
            assetId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
            coingeckoId: 'usd-coin',
            aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
            occurrences: 4,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
            metadata: {},
            price: '0.999779',
          },
          feeData: {
            metabridge: {
              amount: '8750000',
              asset: {
                address: '0x0000000000000000000000000000000000000000',
                chainId: 1151111081099710,
                assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                symbol: 'SOL',
                decimals: 9,
                name: 'SOL',
                aggregators: [],
                occurrences: 100,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                metadata: {},
              },
            },
          },
          bridges: ['jupiter (via LiFi)'],
          steps: [
            {
              action: 'swap',
              srcChainId: 1151111081099710,
              destChainId: 1151111081099710,
              protocol: {
                name: 'jupiter',
                displayName: 'Jupiter',
                icon: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/jupiter.svg',
              },
              srcAsset: {
                address: '0x0000000000000000000000000000000000000000',
                chainId: 1151111081099710,
                assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                symbol: 'SOL',
                decimals: 9,
                name: 'SOL',
                aggregators: [],
                occurrences: 100,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                metadata: {},
              },
              destAsset: {
                address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                chainId: 1151111081099710,
                assetId:
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                symbol: 'USDC',
                decimals: 6,
                name: 'USD Coin',
                coingeckoId: 'usd-coin',
                aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
                occurrences: 4,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
                metadata: {},
              },
              srcAmount: '982576563',
              destAmount: '166266188',
            },
          ],
          priceData: {
            totalFromAmountUsd: '168.98',
            totalToAmountUsd: '166.231770899084',
            priceImpact: '0.016263635346881158',
          },
        },
        trade:
          'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAKDyvsJhRtumFSoGZgsFcJr6DNYguB2VI+8YX3cCnnfUCfHoxPq4mUSUyPHlwSh0RbKRfWDEPHmqlZFi9dYABZjTI1oGb+rLnywLjLSrIQx6MkqNBhCFbxqY1YmoGZVORW/dn2nswWLyDyHT6n388tAIdPLGCKh8p12O7ummEs4lkN0ZT2nLJ3ocRlM73wUDspJIrpNmXiqSNr4TqzqKe4W1QoPQ3SgjVP7wrjsOIn03zYnKJm+xfd+PfLfM775OvcVQan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAAA9Bq6GrSQ0IG2/BL7eCIiLNUD6si3bkLQciA0jpQI1IDBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FkG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQR51VvyMcBu7nTFbs5oFQf9sbLeo/SOUQKxzaJWvBOPxvp6877brTo9ZfNqq8l0MbG75MLS9uDkfKYCA0UvXWG0P/on9df2SnTAmx8pWHneSwmrNt/J3VFLMhqns4zl6IDkgTMpHGKNwG9wtTqNDAW2uEq0SyHvFGmlKc+t7S5RCgUCBgcJAEixvlvet00ACAAFAj0lAwAIAAkDQKgFAAAAAAAJAgABDAIAAAAAAAAAAAAAAAkCAAIMAgAAAJxYhAAAAAAACgYAAwASCQsBAQkCAAMMAgAAALPtkDoAAAAACwEDAREMEgsAAwQMDQwODBMADxARAwQLFCTlF8uXeuOtKgEAAAA9AGQAAbPtkDoAAAAANRDpCQAAAABkAAALAwMAAAEJAcs3mT7X98muFY0vPNMWGrrtMic5QoepZ7VBVinFOrR6AwsODQMHDxA=',
        estimatedProcessingTimeInSeconds: 0,
      },
      {
        quote: {
          requestId:
            '0xb3bb136416776ed151357cf2465530fc64b05a4850ebc6951d07584065c2ec4b',
          bridgeId: 'jupiter',
          aggregator: 'jupiter',
          srcChainId: 1151111081099710,
          srcTokenAmount: '991250000',
          srcAsset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1151111081099710,
            assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            symbol: 'SOL',
            decimals: 9,
            name: 'SOL',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
            metadata: {},
          },
          destChainId: 1151111081099710,
          destTokenAmount: '167735797',
          destAsset: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            chainId: 1151111081099710,
            assetId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
            coingeckoId: 'usd-coin',
            aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
            occurrences: 4,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
            metadata: {},
          },
          feeData: {
            metabridge: {
              amount: '8750000',
              asset: {
                address: '0x0000000000000000000000000000000000000000',
                chainId: 1151111081099710,
                assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                symbol: 'SOL',
                decimals: 9,
                name: 'SOL',
                aggregators: [],
                occurrences: 100,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                metadata: {},
              },
            },
          },
          bridges: ['SolFi'],
          steps: [],
          priceData: {
            totalFromAmountUsd: '168.98',
            totalToAmountUsd: '167.70107569002099',
            priceImpact: '0.007568495147230467',
          },
        },
        trade:
          'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAHCyvsJhRtumFSoGZgsFcJr6DNYguB2VI+8YX3cCnnfUCf2faezBYvIPIdPqffzy0Ah08sYIqHynXY7u6aYSziWQ3RlPacsnehxGUzvfBQOykkiuk2ZeKpI2vhOrOop7hbVDWgZv6sufLAuMtKshDHoySo0GEIVvGpjViagZlU5Fb9AwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTj8b6evO+2606PWXzaqvJdDGxu+TC0vbg5HymAgNFL11htD/6J/XX9kp0wJsfKVh53ksJqzbfyd1RSzIap7OM5ejA+SX0xZ5j4BVh6m/mAUNhT1UIBf73Ck+RvSCMCiB1lggEAAkDMd8BAAAAAAAEAAUCqPsBAAUGAAEADgYHAQEGAgABDAIAAABQRhU7AAAAAAcBAQERCBIHAAECCAkICggPAAsMDQECBxAk5RfLl3rjrSoBAAAAPQBkAAFQRhU7AAAAAPVx/wkAAAAADwAABwMBAAABCQYCAAMMAgAAALCDhQAAAAAAATznz7hitJe6doKky8gbc8f6FlIm+dOC8F8i0Ga6cPUDAxoZFgMCGxg=',
        estimatedProcessingTimeInSeconds: 0,
      },
    ],
  };
  return await mockServer
    .forGet(BRIDGE_GET_QUOTE_API)
    .thenCallback(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // just to see fetching quotes
      return quotesResponse;
    });
}

export async function mockQuoteFromPKINtoSOL(mockServer: Mockttp) {
  const quotesResponse = {
    statusCode: 200,
    json: [
      {
        quote: {
          bridgeId: 'lifi',
          requestId:
            '0x1ce9af72f17750978bbb8b243604dd9186755d0446421e0c7ed181abaf12feeb',
          aggregator: 'lifi',
          srcChainId: 1151111081099710,
          srcTokenAmount: '991250',
          srcAsset: {
            address: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
            chainId: 1151111081099710,
            assetId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
            symbol: 'PKIN',
            decimals: 6,
            name: 'PUMPKIN',
            coingeckoId: 'pumpkin-4',
            aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
            occurrences: 4,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin.png',
            metadata: {},
            price: '0.00161937',
          },
          destChainId: 1151111081099710,
          destTokenAmount: '9219',
          destAsset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1151111081099710,
            assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            symbol: 'SOL',
            decimals: 9,
            name: 'SOL',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
            metadata: {},
            price: '172.58',
          },
          feeData: {
            metabridge: {
              amount: '8750',
              asset: {
                address: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
                chainId: 1151111081099710,
                assetId:
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
                symbol: 'PKIN',
                decimals: 6,
                name: 'PUMPKIN',
                coingeckoId: 'pumpkin-4',
                aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
                occurrences: 4,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin.png',
                metadata: {},
              },
            },
          },
          bridges: ['jupiter (via LiFi)'],
          steps: [
            {
              action: 'swap',
              srcChainId: 1151111081099710,
              destChainId: 1151111081099710,
              protocol: {
                name: 'jupiter',
                displayName: 'Jupiter',
                icon: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/jupiter.svg',
              },
              srcAsset: {
                address: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
                chainId: 1151111081099710,
                assetId:
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
                symbol: 'PKIN',
                decimals: 6,
                name: 'PUMPKIN',
                coingeckoId: 'pumpkin-4',
                aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
                occurrences: 4,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin.png',
                metadata: {},
              },
              destAsset: {
                address: '0x0000000000000000000000000000000000000000',
                chainId: 1151111081099710,
                assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                symbol: 'SOL',
                decimals: 9,
                name: 'SOL',
                aggregators: [],
                occurrences: 100,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                metadata: {},
              },
              srcAmount: '982577',
              destAmount: '9219',
            },
          ],
          priceData: {
            totalFromAmountUsd: '0.00195709',
            totalToAmountUsd: '0.0015894477899999998',
            priceImpact: '0.18785145803207828',
          },
        },
        trade:
          'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQALEyvsJhRtumFSoGZgsFcJr6DNYguB2VI+8YX3cCnnfUCfC4vCKBGagPRzk8qoTmD4zCq9T+WYvHPWKBu2Bs5a4KuFVmtApULvbTqNftGq+9n24ejpTT1yvee/KqHZhjSHnzLlaRqxeqGcSNgLeZTYp6gaw9nKB7oVH4YB/vFaasEg2faezBYvIPIdPqffzy0Ah08sYIqHynXY7u6aYSziWQ3K/O+Y4Wo6R893YUOyWubMQbO1er4ZaWDMc+dYWrucE7ytz74v86wWs3YOVAh/h+sBkhfRI4nnI+840aM6DKG1oeBvPmOnaawKFkXMlWFcisFC4wrxlDqNK+Yqb2WgGaEoPQ3SgjVP7wrjsOIn03zYnKJm+xfd+PfLfM775OvcVQan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAAA9Bq6GrSQ0IG2/BL7eCIiLNUD6si3bkLQciA0jpQI1IDBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAIyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZHoxPq4mUSUyPHlwSh0RbKRfWDEPHmqlZFi9dYABZjTIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpNaBm/qy58sC4y0qyEMejJKjQYQhW8amNWJqBmVTkVv0EedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTj7Q/+if11/ZKdMCbHylYed5LCas238ndUUsyGqezjOXoKmBPZt/5wcpRSLUcKn0+IkcmhKdYpbb607h+MWiW/QMKCAIJCgkA4Bkyy3coFgALAAUCbb0CAAsACQOghgEAAAAAAAwGAAENFg4PAQEPBAIWAQAKDAAAAAAAAAAABgwGAAMQFg4PAQEPBAIWAwAKDOAhAAAAAAAABgwGAAQAFw4PAQERFQ8AAgQRFxESERgPABMEFAIVBQYHGSTlF8uXeuOtKgEAAAARAGQAATH+DgAAAAAAAyQAAAAAAAD0AQAPAwQAAAEJAew4pSO0SoFQnT1LS/XR+na6M46NR7hDuO/J6Gqa0YX7AxsIAAQHDAYc',
        estimatedProcessingTimeInSeconds: 0,
      },
      {
        quote: {
          requestId:
            '0xe5ee85002724c8d0bc5e74860b0daed1881daf6dfa8f3492f0d52fe7092d3c5b',
          bridgeId: 'jupiter',
          aggregator: 'jupiter',
          srcChainId: 1151111081099710,
          srcTokenAmount: '991250',
          srcAsset: {
            address: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
            chainId: 1151111081099710,
            assetId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
            symbol: 'PKIN',
            decimals: 6,
            name: 'PUMPKIN',
            coingeckoId: 'pumpkin-4',
            aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
            occurrences: 4,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin.png',
            metadata: {},
          },
          destChainId: 1151111081099710,
          destTokenAmount: '9301',
          destAsset: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1151111081099710,
            assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
            symbol: 'SOL',
            decimals: 9,
            name: 'SOL',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
            metadata: {},
          },
          feeData: {
            metabridge: {
              amount: '8750',
              asset: {
                address: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
                chainId: 1151111081099710,
                assetId:
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
                symbol: 'PKIN',
                decimals: 6,
                name: 'PUMPKIN',
                coingeckoId: 'pumpkin-4',
                aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
                occurrences: 4,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin.png',
                metadata: {},
              },
            },
          },
          bridges: ['Whirlpool'],
          steps: [],
          priceData: {
            totalFromAmountUsd: '0.00195709',
            totalToAmountUsd: '0.00160358541',
            priceImpact: '0.18062766147698878',
          },
        },
        trade:
          'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAHDivsJhRtumFSoGZgsFcJr6DNYguB2VI+8YX3cCnnfUCf2faezBYvIPIdPqffzy0Ah08sYIqHynXY7u6aYSziWQ2FVmtApULvbTqNftGq+9n24ejpTT1yvee/KqHZhjSHn8r875jhajpHz3dhQ7Ja5sxBs7V6vhlpYMxz51hau5wTvK3Pvi/zrBazdg5UCH+H6wGSF9Ejiecj7zjRozoMobWh4G8+Y6dprAoWRcyVYVyKwULjCvGUOo0r5ipvZaAZoTLlaRqxeqGcSNgLeZTYp6gaw9nKB7oVH4YB/vFaasEgAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTj7Q/+if11/ZKdMCbHylYed5LCas238ndUUsyGqezjOXoNaBm/qy58sC4y0qyEMejJKjQYQhW8amNWJqBmVTkVv05Xtvoe62QXKD9010mhrKR6vte46Md7xV2915ouru1owcHAAkDY6QAAAAAAAAHAAUCogcCAAgGAAEAEQkKAQELFQoAAgELEQsMCxIKAA4BDwIQAwQFEyTlF8uXeuOtKgEAAAARAGQAARIgDwAAAAAAVSQAAAAAAABQAAAKAwEAAAEJCAYABg0UCQoACgMCBgAJAy4iAAAAAAAAAew4pSO0SoFQnT1LS/XR+na6M46NR7hDuO/J6Gqa0YX7AxsIAAQMBhwH',
        estimatedProcessingTimeInSeconds: 0,
      },
    ],
  };
  return await mockServer
    .forGet('https://bridge.api.cx.metamask.io/getQuote')
    .withQuery({
      srcChainId: 1151111081099710,
      destChainId: 1151111081099710,
      srcTokenAddress: '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
      destTokenAddress: '0x0000000000000000000000000000000000000000',
    })
    .thenCallback(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // just to see fetching quotes
      return quotesResponse;
    });
}

export async function mockSOLtoETHQuote(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://bridge.api.cx.metamask.io/getQuote')
    .withQuery({ srcChainId: 1151111081099710, destChainId: 1 })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
            quote: {
              bridgeId: 'lifi',
              requestId:
                '0x78b1a3b0530e1774c7974e1e33b8e0a802fb840db6ce87b57d92ff2a80259422',
              aggregator: 'lifi',
              srcChainId: 1151111081099710,
              srcTokenAmount: '991250000',
              srcAsset: {
                address: '0x0000000000000000000000000000000000000000',
                chainId: 1151111081099710,
                assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                symbol: 'SOL',
                decimals: 9,
                name: 'SOL',
                aggregators: [],
                occurrences: 100,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                metadata: {},
                price: '167.98',
              },
              destChainId: 1,
              destTokenAmount: '65312314677968091',
              destAsset: {
                address: '0x0000000000000000000000000000000000000000',
                chainId: 1,
                assetId: 'eip155:1/slip44:60',
                symbol: 'ETH',
                decimals: 18,
                name: 'Ethereum',
                coingeckoId: 'ethereum',
                aggregators: [],
                occurrences: 100,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
                metadata: {
                  honeypotStatus: {},
                  isContractVerified: false,
                  erc20Permit: false,
                  description: {
                    en: 'Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.',
                    ko: '이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.',
                    zh: 'Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。',
                    ja: 'イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。',
                  },
                  createdAt: '2023-10-31T22:41:58.553Z',
                },
                price: '2529.90697331',
              },
              feeData: {
                metabridge: {
                  amount: '8750000',
                  asset: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 1151111081099710,
                    assetId:
                      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                    symbol: 'SOL',
                    decimals: 9,
                    name: 'SOL',
                    aggregators: [],
                    occurrences: 100,
                    iconUrl:
                      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                    metadata: {},
                    price: '167.98',
                  },
                },
              },
              bridges: ['relay'],
              steps: [
                {
                  action: 'bridge',
                  srcChainId: 1151111081099710,
                  destChainId: 1,
                  protocol: {
                    name: 'relay',
                    displayName: 'Relay',
                    icon: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/relay.svg',
                  },
                  srcAsset: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 1151111081099710,
                    assetId:
                      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                    symbol: 'SOL',
                    decimals: 9,
                    name: 'SOL',
                    aggregators: [],
                    occurrences: 100,
                    iconUrl:
                      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                    metadata: {},
                  },
                  destAsset: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 1,
                    assetId: 'eip155:1/slip44:60',
                    symbol: 'ETH',
                    decimals: 18,
                    name: 'Ethereum',
                    coingeckoId: 'ethereum',
                    aggregators: [],
                    occurrences: 100,
                    iconUrl:
                      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
                    metadata: {
                      honeypotStatus: {},
                      isContractVerified: false,
                      erc20Permit: false,
                      description: {
                        en: 'Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.',
                        ko: '이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.',
                        zh: 'Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。',
                        ja: 'イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。',
                      },
                      createdAt: '2023-10-31T22:41:58.553Z',
                    },
                  },
                  srcAmount: '982576563',
                  destAmount: '65312314677968091',
                },
              ],
              priceData: {
                totalFromAmountUsd: '168.28',
                totalToAmountUsd: '165.223174933443',
                priceImpact: '0.018165112114077706',
              },
            },
            trade:
              'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQALEVH9iAGdPDRjcH0W9QBgy+nhAejTsfKmkKeSxUeKrnAJgxNfP4JDyXxZvzX/gy5nNbPU6Q8JWs3l2OOBPiEMAi7lSpUjZ0oJ+6tXFY2lex9sn5sRuFLyUgPLi2ojim4owQXoSsB3SBkF6AlB9oyrASH5Fx8F2qs54vrrlOsVPQSRHoxPq4mUSUyPHlwSh0RbKRfWDEPHmqlZFi9dYABZjTI1oGb+rLnywLjLSrIQx6MkqNBhCFbxqY1YmoGZVORW/QMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAjJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpxvp6877brTo9ZfNqq8l0MbG75MLS9uDkfKYCA0UvXWEEedVb8jHAbu50xW7OaBUH/bGy3qP0jlECsc2iVrwTj7Q/+if11/ZKdMCbHylYed5LCas238ndUUsyGqezjOXoBUpTWpkpIQZNJOhxYNo4fHw1td28kruB5B+oQEEFRI0oPQ3SgjVP7wrjsOIn03zYnKJm+xfd+PfLfM775OvcVQan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAAtvhNVsUp0Qguci0cBfPPlwkpnpbUstD8N4DJzYSE5g9BjBrmJXP4MU5DTy4OueToQ7lKVq84GWVhJkSiDMdOZAsGAAUCwCcJAAYACQMAwQIAAAAAAAcGAAEAFAgJAQEIAgABDAIAAACz7ZA6AAAAAAkBAQERBwYAAgAKCAkBAQsSCQABAgMKCwwLFQAREhMBAgkWJOUXy5d6460qAQAAAD0AZAABs+2QOgAAAACoKeQJAAAAADIAAA0AQjB4NDhmNjFhOWI4MDI2MWE4ODc2NTNhY2ViYmY2MjVhZDViNWI2MzVlODg5ZTExNWJlM2NlYTg3OWRmY2RkNzFiNg4CDxAJABiEs2d2f3YACAIABAwCAAAAAAAAAAAAAAAIAgAFDAIAAACcWIQAAAAAAAHLN5k+1/fJrhWNLzzTFhq67TInOUKHqWe1QVYpxTq0egMLDg0DBw8Q',
            estimatedProcessingTimeInSeconds: 7,
          },
        ],
      };
    });
}

export async function mockGetTokenAccountInfoDevnet(mockServer: Mockttp) {
  console.log('mockGetTokenAccountInfo');
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
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
    .forPost(SOLANA_URL_REGEX_DEVNET)
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

export async function mockGetMultipleAccounts(mockServer: Mockttp) {
  console.log('mockgetMultipleAccounts');
  const response = {
    statusCode: 200,
    json: {
      id: '1337',
      jsonrpc: '2.0',
      result: {
        context: {
          apiVersion: '2.1.21',
          slot: 341693911,
        },
        value: [
          {
            data: {
              parsed: {
                info: {
                  addresses: [
                    'DKHsQ6aGhUeUpauP9BQoTcU8SwtR6tKkxLsu7kfzAsF5',
                    '21W1iDL9TvuZbukEnLZgAP3PjQZhJMQXvawsr9qQsCNc',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'CS45pMNjfUC3VhxZwJkvomQUAV2XNEnAJDFA662QPp9k',
                    'Co7m7EuE55VYfUKGwwbLHhP8PKUHqM5UcVh3AAHufd6',
                    '3RSCvu3ZsN5RtNiA7Gdx1BE9NPvjnDkgCzkxepD2yNfG',
                    'GeWALqZXBxoahcHvEQ3kv5X59dqsxGDHNSaLPg5wVjT2',
                    'So11111111111111111111111111111111111111112',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'DYWfDacJxwuAcoXKQG5jTKoCSAJpEaiGATHSzPyk2Mr9',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'AHhiY6GAKfBkvseQDQbBC7qp3fTRNpyZccuEdYSdPFEf',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '3cUAyfvugAibjb2USudpRUjx4JNzWchDWaLnaBok6BEy',
                    'Cu6yvJiPeLxV6FDoyD8P8NxaSjz5iC2zr6i9GfjyyN5f',
                    'SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe',
                    'Sysvar1nstructions1111111111111111111111111',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '7TSjqvAszfkZCbdJ7LDbqSQX99aWsAu6amCRta4NJoS5',
                    '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                    'LgyntccxjTsyJoTMmwik2PbajoQHaYBj85NATZP5khL',
                    '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                    '2qdFBrMf7t6HEmcyMKUEFsMpaU17yXM45wsALuNnfrAX',
                    '82xT9uyTf4gTzFi6i21oTfHoMDkumysMtrQFkdRSsWtm',
                    'EATZMCjR8rmYdmM1xzKvNsFEScLrZkwrwwiFi8hs59MW',
                    'So11111111111111111111111111111111111111112',
                    '6QCn1E73T8J8e9s7VJeGaVcF9kAsnTAJCzqKtNgJT8rF',
                    'DJvSjwqCnD3sDPe7RoRo2UYcwv5gTHiQ7TGdWJDvTb8U',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'BaMuET9fXVVFMbjcmN5NTmF613tzMzMjNj119nePFtYy',
                    '9ZYx2LcHfYQFgGynfMNQrNcfhHVJAup2VCuDnq4WxaMW',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    '7WJcjrKFP3zPx5XNE3DQNKSt7Fi4rBSpy7jPSzBGdxfu',
                    '9HNrd648YrwaRYhfhrgkg5QXCLvc69G3CgHJKyCuHd4s',
                    '3QCNgKzEfaHgjnnxgTeCzBBTojoVAGpX95btuAjo62yB',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '28tTLnwjpS25VUdKDjLPbqEfi8rYF9r6bHDjp9kLvJCY',
                    '2CvY6Vgjwz9THd6aGg9sYiM4xVbRaqCC76qGKwEPBsJ9',
                    'ExwjhTcUdduJq16ANTRSe1VdFFCCm4sdF1RjPADZB4RS',
                    '9Bn6BT4Tj363Z6DfUSKAqaFw5Hjds355JnGetiKYmkkJ',
                    'E6hYURrcCuvUXVtvMrRNMW1ZVAEfiCNeFWnGyh1o8vny',
                    'So11111111111111111111111111111111111111112',
                    'CJ8eyHr4jAUk7nFUCh7o48gofzCxnBarrL8Yn7mVMy7X',
                    '3M4iUNGDhJcaVhrKn6hDxcXRqgdYwcrygNjErPtSsb7e',
                    '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                    'EbDruMjU9goaRAxz52sMnqLkTqk21CS7dSFQwokFcvrj',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                    'GrkefHuZE786W5oZv8JU7TeZyjgnpCBLmKa3WBQrSt6T',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'So11111111111111111111111111111111111111112',
                    '3YUt2jMiAgvZpdPXLwoEDkKAJu2VM3apVhAoxojA94ZR',
                    'BCrPhfA9H8L9y4pxqtx4b2zVHcUFVtv1LRwCJpP3t25F',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'CXiUd8K4oe45F33pgQZB8H2r2MM14Z8HGjZWCFXNh1Nz',
                    'DUefNzuryf5XYFAwKB4kb6wam3xarpBDAkdCCX5aw31j',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    '7vjg8LTyJMMmqpgZhmyfwG4v2T9FMEgaFoFeZW1cxP7y',
                    'AyKub2YqiHZrwV4bXm6X8PLQqsHfRpw4nzyEp73bWeGG',
                    'BaGSCND14xiEzPVtPBZoQQXfMs2i8yPsqq611gz345o7',
                    '8aJRNbUvaD3RuGEVZwb27pgYSvyEoXiZtDCxVsHc2D41',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'J7YmDRiKnXTPw35GvAUeuJaMeR3NNJiagEMxq6tuNeED',
                    'GjYYNshE59wPZQpEeV7rV6fYpnrAR37pBLux4wD9ZjcN',
                    'JCRGumoE9Qi5BBgULTgdgTLjSgkCMSbF62ZZfGs84JeU',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
                    'ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw',
                    '2UxSpJirdNaQgJhntPPAPnWtWevHhxwNGhxgRZQXor5L',
                    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                    'GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR',
                    '9rPYyANsfQZw3DnDmKE3YCQF5E8oD89UXoHn9JFEhJUz',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    '7d9xsfiz87HWEiFgycyWUWTmNzbFK1KQGyUCnDcsBhZU',
                    'AexZyYH3MtkTAGyjpWi2xPALDF9nx1KdnTe21xATCdnQ',
                    '2qQXvQ34br6hRvANAKjqzZuc3J7GLh1iioTSuMT22moj',
                    'MVnJxwcN2FDWmEuS4uvxAgcZBxaGQDGuwLCxS8RNUCp',
                    'So11111111111111111111111111111111111111112',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'BzvZFdjsxmC7s4VLbtCB5dCjdYSxMVuueGZHMNHWc1BF',
                    'GZp5xhdrzGLYRK44yBHjmTuvdSFFG4kDz4SiaXvTNQa8',
                    '9rxuNMjWhfbTrjCwur5MsnsWAHD1VYKE9Em4cof37ZUx',
                    '8qjx44gZReqz9K32tCYDXRKHXTscEBsTRvD8fEPMp9Xc',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    '7fHkUQtsATjZSpNm77tteKHUVChGgdyRBywUNRmBRa8L',
                    'Dq9pX2NDdZzY6uQkDJNVEYgHAz7nRjCiSwXTCLvtDcmL',
                    'BwwQYJezL7yukZ88dksXVZxJpPGSBiSUMHskoyEXNSiz',
                    '2upnk1iSE4XD9cqrrzPDQWxau3TmmmYpDr8WskKXCP4r',
                    'BBtjc5Vcb4E9mZ1aa6gNarjVsDFgA65S2xETXtQpvMJ7',
                    'So11111111111111111111111111111111111111112',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    '4f6sdp45CTj6zftMFivtzoWwza337mxdxNCTuWM87XZB',
                    'So11111111111111111111111111111111111111112',
                    '5BvnbLVnFKaoksMFoikEfCZicvfNe1ad2RwSd6qUquze',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '3YtHRkvvdFZ1fqRme5JCGNpxy38kwDnhjH9zdh1gCAdz',
                    'BicxWV8uGXbhBMkriEundU1UwfCN5DaWs3jA4NxfegQP',
                    'Coy58oJ6edLPDhaFT3TvuD7USzt4C6NYRcQwBhcasz9v',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    '5fgyeP3ApnJ6A7URDsrpmpS87NG1Dtpr3UVjMdKGvP7T',
                    'HnsqM6UgJDtN6cV2JRFFucJcEFDmU8DhZaP3vX2YyQNy',
                    'DWpvfqzGWuVy9jVSKSShdM2733nrEsnnhsUStYbkj6Nn',
                    'Bvtgim23rfocUzxVX9j9QFxTbBnH8JZxnaGLCEkXvjKS',
                    'So11111111111111111111111111111111111111112',
                    '8V85G47onBYMUsHQfw7qFACPTsdLUJGfwfsnigdtU4T2',
                    'ASXKzQjXF71m2kLTmvaLAJCofvM9675C5muzD9fJXPZ4',
                    'HvtzTYySywjiiRBazZsno9vwfTbtwGDcurJrjppzmn7',
                    'J8tqWAPJKAebbpSxn7Ehi6QFojj1AebcQ4jbqxWz7ycR',
                    '94oAusT3TC8LKR1UgEAw48QkS6rDj4fLApxt8f8Lbb45',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'BmG5QmRi2XdFnaaRGP9pVZy9K7f89jMvisGRBrzfjseh',
                    'So11111111111111111111111111111111111111112',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'AjHz5F4vVjx2d4SSLJtN6Ro9kyL7XYRXhTUC5eMLXcJC',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '3KXZUzCCoQy3NdUUUHwAEYPBdfyhK5XXf32uYFL6mBys',
                    '2idEQkJJLLzqnzoiU5BFZ8r6yBsZ7QrE7PTp9N4gtYtm',
                    '7LbLL27B773hwBULyWRHM7EKaqFMfkasQTszLzAPnQfE',
                    '64B7pmSeBpbRxvhsbwbtFQcCxESbyNMfgoDt7H3Gn47m',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'E6SeNSzboPxKLWXcynLzDwR38oMiNmZqT9Rmd5m2ZuQN',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'bfkH861uASYM8XmZmBBSzDL7SANHhxJ88jVnm45Qdkp',
                    'FkojvUiK35KkB8r8atCXuvfSyoTMCcKwMccnkVxcA58w',
                    'So11111111111111111111111111111111111111112',
                    'HQit2y6D6KQMnaNwfvA3Kk8PNoPcobiFUCNZhVpQZBzG',
                    'D1ZN9Wj1fRSUQfCjhvnu1hqDMT7hzjzBBpi12nVniYD6',
                    '2AZjdaHWwYnz8GXcm18FUQFGUgfojR5Liw4tvFcqBP7o',
                    'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
                    'HZmpBjKhNSZrazBrgaLrVLKeYoyjD5dN69mAajHW3F8C',
                    '7P4MrgE51tgsJLUDj3NfCzsgWnJhK6hhZa1Dg1U3eB61',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'AZqNravg7XHc3HBxo4AfA6S7KHv6jDgFYC14ZrrVTNHJ',
                    'CdUZnXu1bUb1jygFYgpffP7Gs8975STjR2LCnf49m9zA',
                    'So11111111111111111111111111111111111111112',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'FHVYTNjrQJ6TNKh12W37GDLj8RPMXvucYa2wqyL2KHda',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'ARveDX45r5Ht2wUexEAjKUGpe6mw9ywNScoSzXfQjfaC',
                    'DM3Bz19eCR5uPjj7QnPmYBJDuCs9W61AuwTNdrzhgMSe',
                    'HjuaDiBbEvYQ9LHb8NcuC2Ary7n5bq1MRDMfJPw5piTB',
                    'A7wbiyvErTebTShhQ2Czeie2Mj14sGCfSPR5gHctbVp3',
                    '5pH5SeiXdNUgGwufv2wkA5gsTSEhyoeZnX3JiaQWpump',
                    'ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw',
                    'GmrbjCWoo789YiogYrQcQcFdEteNhgvBhU9fmYvCT495',
                    '7xQYoUjUJF1Kg6WVczoTAkaNhn5syQYcbvjmFrhjWpx',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                    'JCRGumoE9Qi5BBgULTgdgTLjSgkCMSbF62ZZfGs84JeU',
                    'FWsW1xNtWscwNmKv6wVsU1iTzRN6wmmk3MjxRP5tT7hz',
                    'GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR',
                    'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
                    'So11111111111111111111111111111111111111112',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '9rPYyANsfQZw3DnDmKE3YCQF5E8oD89UXoHn9JFEhJUz',
                    '7xQYoUjUJF1Kg6WVczoTAkaNhn5syQYcbvjmFrhjWpx',
                    'AUsYZG9xAy3Ki4U9JnFU1hBmqfpEMWS4YNAYdQ4Qy4qH',
                    'FWsW1xNtWscwNmKv6wVsU1iTzRN6wmmk3MjxRP5tT7hz',
                    'ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw',
                    '66zUuH9EY5BMrS9UBAvpxp1xBSzcodefCD57WUvCpump',
                    'Bvtgim23rfocUzxVX9j9QFxTbBnH8JZxnaGLCEkXvjKS',
                    'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
                    'GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR',
                    'JCRGumoE9Qi5BBgULTgdgTLjSgkCMSbF62ZZfGs84JeU',
                    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                    'ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw',
                    'DWpvfqzGWuVy9jVSKSShdM2733nrEsnnhsUStYbkj6Nn',
                    'So11111111111111111111111111111111111111112',
                    '7xQYoUjUJF1Kg6WVczoTAkaNhn5syQYcbvjmFrhjWpx',
                    'Ehcp6YJ6FP2TRZvtAdcps6SrLMsoaUfRmde3QFc7Mv6X',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'HW7QUooaHDpxFzAwwqxF57gvKPCT1dg7vJrpVf2zoXXX',
                    'ugLkwUtNTJKqVZFYRtAFBkhcojbhHhcq8L4vkdJjGZj',
                    '6H9G7JTwH6xitF6v3yDuZR291Z441TppQsWBrLcPX3dk',
                    '6ci8Hmrs4x44QgXR4dcoVT4E2WifqnpH1hpnGgaT6g7M',
                    'So11111111111111111111111111111111111111112',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'EV5s3FWsC51F3b2HUzQWQJ7JzP6yKarc4p3c3WKTAxpN',
                    '213d7q3AAoVCo32FC2wS17gTcNKttCrQyfqmz3xRZkB2',
                    '31An2Ti3p8oCgr5kQ1aPMztACywtxvyNZeyj9xoPQqpa',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '52aKUayTraBdYerqj9e9cfhdDuuJbqggduMSUp7sWvY9',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'HrSEm5yRxNQjdETSfm6Bbupw2M5maX2bqocdKBn1H3nL',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'So11111111111111111111111111111111111111112',
                    '7FGbqTtJCA62w2BForS25QEN9bF1LUbuCtfttwx56WaD',
                    'DYjutCcchPdVtcNSsL4838ahB44SSpJvUnxMJZV9WdGp',
                    'HVJXUUkejaCkitHwwdZChJRDcxNWsiE3jCRR2mYyGVW4',
                    '7yXLjdeeNejF4EWXDwYz1irtP3TKF7Cn15t16jkDUo4B',
                    'B2zWWcMgY63L63HHqHzc6PFmFXLJiqAYnjxWJCYFxhWH',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    '4AL24ehi4NVPD2dRYfuUUPPGC1XTt2EU4pSwZ6XMEjC4',
                    'GmPVfMVugMHmtieCzC44ePaUjayLMcYc7bnoeyLMtmQ9',
                    'oVLrTYw8vNp9wQiZ1RMoGYj7Amn2DcQFeWiivP3T6N3',
                    'HW2v8YMnCMqQM6HcFX9anpwMYCbwCGoMGVg3HDD2Dc4A',
                    '8HE9DgYfSppCr5NeSBSKqEmuLrNegfpxKwMtxJZdzY18',
                    '82cVfDci6uUcqs7BH1e522CvwtA2Q6p7hWMr3X7vPDc4',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'So11111111111111111111111111111111111111112',
                    '78tAjATUfxNmMbmhoReyoiwkTxZBYnhmGKoEGiopE9VT',
                    'DWpvfqzGWuVy9jVSKSShdM2733nrEsnnhsUStYbkj6Nn',
                    '8SMP584sFKUza1wZ9BANNqStQSWAPbhmdRAHjdq6JYfn',
                    '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
                    '83bY8m5tUoxPW36RprxmxVz3i3niHaiVyMQe7Fr9TVH9',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    'JDBbXzQNMYN8naDviqUApz63qGxzLc9zRzMWYZz3fg9c',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'EXc7Ffea1rLGQ7MjLADUjFoBsZFY1jzwLDv3YRY6akBJ',
                    'CmA9SNA33mUxTBh3zFLNfZaqxo1GULm2kpkqPuMj5EFj',
                    '38ceeKS88Vkrjw4kT3vh9KSdz6VbyEGDzSN6DCRw7eYL',
                    'CMNFhPJwTVvG1guqvHerGBaZS58JMrW4YdkUpW7fgxUp',
                    '4xnH3Zd83J9JCyNSQtFDWPo5WkT6fJ7dzthYLJPskCF2',
                    'DR8Kk7KTXaErV542oc4uAfAW6Ge7T71Zsz7PWanPN6q9',
                    'So11111111111111111111111111111111111111112',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '3Aa47Q7nLHJEjqdmU71k441sryH325LykN3hsvSpVMQw',
                    'A8JBhB6t8ktie5FcX2wqieQfQFJ34JyPZYvGVE3Ypump',
                    'So11111111111111111111111111111111111111112',
                    'BwE7jNNE2edhxZffnXjCnZMRe8Zd8PoThU3aWftF9TUJ',
                    'ZMkKrGLRYCepsTW4Pu8dKj3Q1N7WLZnfN8fn5auhJwh',
                    'HRQVXPVrdGNZxCRa8FSkBY5iAk1CXcC1voymDnvy6vaU',
                    '4nq29hz1wXGqiGCbCVn421FpaKcr7v1BR2sSqmAxyKwu',
                    'B4fG6XmAXyehZGuT3M1qsz6kCWEvTb21QhqogNNzQEAQ',
                    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                    '3akTYtB4xrJ7ekasveYYe3xmjL5TALyFoDWbhFgSEz5c',
                    'So11111111111111111111111111111111111111112',
                    'GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR',
                    'CEtfgnUBu8TxJA4JFqreyQhDutkJpcUU9Yuf7FHxfg92',
                    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'zQfZksmpdLLnKERHr4J4Mct2QXFgYie55k4HsKzrmxm',
                    '5NTVjqDAdo5vTFcieqw1gq3NjYQx5BNqzKAdDXJ9wthW',
                    'So11111111111111111111111111111111111111112',
                    'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
                    '4h97bHmc1H8x18gTMjrZHyk2L3m2Msm9jBJsGpVYmCpp',
                    'E8LqaJHuSmbB99V8ayfeikJsnXXwrVzbkYu7zipTg2w8',
                    'GH9bp37WhcrZZiXEiJLD8WHQKmHhGK4Pd71dyi4KzPRp',
                    'Degp69AVPmHzGnsMLtfSNMaRm4QLmxcDD1KaxDaqjoY8',
                    'A7MSQobaXrQEQe8cTtUtwDTorfQLJcwfTGckA4cUeBuY',
                    'DPij4Pqx2pMwGVuLsjMfHzwyoBm6YRNnxyYXHPj5BL2L',
                    'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA',
                    'FWsW1xNtWscwNmKv6wVsU1iTzRN6wmmk3MjxRP5tT7hz',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    '148Nv5a6RrR8QUfQJWLW5VBHtx3SDD4QyfvqupUXJsjF',
                  ],
                  authority: '9RAufBfjGQjDfrwxeyKmZWPADHSb8HcoqCdrmpqvCr1g',
                  deactivationSlot: '18446744073709551615',
                  lastExtendedSlot: '330440295',
                  lastExtendedSlotStartIndex: 0,
                },
                type: 'lookupTable',
              },
              program: 'address-lookup-table',
              space: 8248,
            },
            executable: false,
            lamports: 58296960,
            owner: 'AddressLookupTab1e1111111111111111111111111',
            rentEpoch: 18446744073709551615,
            space: 8248,
          },
        ],
      },
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getMultipleAccounts',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockSecurityAlertSwap(mockServer: Mockttp) {
  console.log('mockSecurityAlertSwap');
  const response = {
    statusCode: 200,
    json: {
      encoding: 'base64',
      status: 'SUCCESS',
      result: {
        simulation: {
          assets_diff: {
            '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c': [
              {
                asset: {
                  type: 'SOL',
                  decimals: 9,
                  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                },
                in: null,
                out: {
                  usd_price: 178.19,
                  summary: 'Lost approximately 178.19$',
                  value: 1.00007001,
                  raw_value: 1000070010,
                },
                asset_type: 'SOL',
              },
              {
                asset: {
                  type: 'TOKEN',
                  name: 'USD Coin',
                  symbol: 'USDC',
                  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                  decimals: 6,
                  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
                },
                in: {
                  usd_price: 176.44,
                  summary: 'Gained approximately 176.44$',
                  value: 176.43884,
                  raw_value: 176438840,
                },
                out: null,
                asset_type: 'TOKEN',
              },
            ],
            SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe: [
              {
                asset: {
                  type: 'TOKEN',
                  name: 'Wrapped SOL',
                  symbol: 'WSOL',
                  address: 'So11111111111111111111111111111111111111112',
                  decimals: 9,
                  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                },
                in: {
                  usd_price: 176.74,
                  summary: 'Gained approximately 176.74$',
                  value: 0.99125,
                  raw_value: 991250000,
                },
                out: null,
                asset_type: 'TOKEN',
              },
              {
                asset: {
                  type: 'TOKEN',
                  name: 'USD Coin',
                  symbol: 'USDC',
                  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                  decimals: 6,
                  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
                },
                in: null,
                out: {
                  usd_price: 176.44,
                  summary: 'Lost approximately 176.44$',
                  value: 176.43884,
                  raw_value: 176438840,
                },
                asset_type: 'TOKEN',
              },
            ],
            '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA': [
              {
                asset: {
                  type: 'SOL',
                  decimals: 9,
                  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                },
                in: {
                  usd_price: 1.56,
                  summary: 'Gained approximately 1.56$',
                  value: 0.00875,
                  raw_value: 8750000,
                },
                out: null,
                asset_type: 'SOL',
              },
            ],
          },
          delegations: {},
          assets_ownership_diff: {},
          accounts_details: [
            {
              account_address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              description: 'Token Program',
              type: 'PROGRAM',
              was_written_to: false,
            },
            {
              account_address: 'ComputeBudget111111111111111111111111111111',
              description: 'Compute Budget',
              type: 'NATIVE_PROGRAM',
              was_written_to: false,
            },
            {
              account_address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
              description: 'Associated Token Account Program',
              type: 'PROGRAM',
              was_written_to: false,
            },
            {
              account_address: '11111111111111111111111111111111',
              description: 'System Program',
              type: 'NATIVE_PROGRAM',
              was_written_to: false,
            },
            {
              account_address: 'SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe',
              description: 'N/A',
              type: 'PROGRAM',
              was_written_to: false,
            },
            {
              account_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              description: 'USD Coin Mint Account',
              type: 'FUNGIBLE_MINT_ACCOUNT',
              was_written_to: false,
              name: 'USD Coin',
              symbol: 'USDC',
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
            },
            {
              account_address: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
              description: 'Jupiter Aggregator v6',
              type: 'PROGRAM',
              was_written_to: false,
            },
            {
              account_address: 'CAPhoEse9xEH95XmdnJjYrZdNCA8xfUWdy3aWymHa1Vj',
              description:
                'PDA owned by SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe',
              type: 'PDA',
              was_written_to: true,
              owner: 'SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe',
            },
            {
              account_address: '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA',
              description: null,
              type: 'SYSTEM_ACCOUNT',
              was_written_to: true,
            },
            {
              account_address: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c',
              description: null,
              type: 'SYSTEM_ACCOUNT',
              was_written_to: true,
            },
            {
              account_address: 'F77xG4vz2CJeMxxAmFW8pvPx2c5Uk75pksr6Wwx6HFhV',
              description: "USD Coin's ($USDC) Token Account",
              type: 'TOKEN_ACCOUNT',
              was_written_to: true,
              mint_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner_address: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c',
            },
            {
              account_address: 'CTaDZW2LhvHPRnA9JWcZF8R5y2mpkV2RcHAXyEoKLbzp',
              description: "Wrapped SOL's ($WSOL) Token Account",
              type: 'TOKEN_ACCOUNT',
              was_written_to: true,
              mint_address: 'So11111111111111111111111111111111111111112',
              owner_address: 'CAPhoEse9xEH95XmdnJjYrZdNCA8xfUWdy3aWymHa1Vj',
            },
            {
              account_address: 'So11111111111111111111111111111111111111112',
              description: 'Wrapped SOL Mint Account',
              type: 'FUNGIBLE_MINT_ACCOUNT',
              was_written_to: false,
              name: 'Wrapped SOL',
              symbol: 'WSOL',
              logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            },
            {
              account_address: 'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf',
              description: null,
              type: 'SYSTEM_ACCOUNT',
              was_written_to: false,
            },
            {
              account_address: 'JHVJLsPsbzNW8JP8cPYmrwfzD2M9aHXdFHSjeeCDERu',
              description: "USD Coin's ($USDC) Token Account",
              type: 'TOKEN_ACCOUNT',
              was_written_to: true,
              mint_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner_address: 'CAPhoEse9xEH95XmdnJjYrZdNCA8xfUWdy3aWymHa1Vj',
            },
            {
              account_address: 'BPFLoaderUpgradeab1e11111111111111111111111',
              description: 'BPF Upgradeable Loader',
              type: 'NATIVE_PROGRAM',
              was_written_to: false,
            },
            {
              account_address: 'BPFLoader2111111111111111111111111111111111',
              description: 'BPF Loader 2',
              type: 'NATIVE_PROGRAM',
              was_written_to: false,
            },
            {
              account_address: 'Ffqao4nxSvgaR5kvFz1F718WaxSv6LnNfHuGqFEZ8fzL',
              description: "Wrapped SOL's ($WSOL) Token Account",
              type: 'TOKEN_ACCOUNT',
              was_written_to: true,
              mint_address: 'So11111111111111111111111111111111111111112',
              owner_address: '3xTPAZxmpwd8GrNEKApaTw6VH4jqJ31WFXUvQzgwhR7c',
            },
          ],
          account_summary: {
            account_assets_diff: [
              {
                asset: {
                  type: 'SOL',
                  decimals: 9,
                  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                },
                in: null,
                out: {
                  usd_price: 178.19,
                  summary: 'Lost approximately 178.19$',
                  value: 1.00007001,
                  raw_value: 1000070010,
                },
                asset_type: 'SOL',
              },
              {
                asset: {
                  type: 'TOKEN',
                  name: 'USD Coin',
                  symbol: 'USDC',
                  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                  decimals: 6,
                  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
                },
                in: {
                  usd_price: 176.44,
                  summary: 'Gained approximately 176.44$',
                  value: 176.43884,
                  raw_value: 176438840,
                },
                out: null,
                asset_type: 'TOKEN',
              },
            ],
            account_delegations: [],
            account_ownerships_diff: [],
            total_usd_diff: {
              in: 176.44,
              out: 178.19,
              total: -1.76,
            },
            total_usd_exposure: {},
          },
        },
        validation: {
          result_type: 'Benign',
          reason: '',
          features: [],
          extended_features: [],
        },
      },
      error: null,
      error_details: null,
      request_id: '3e978da6-980a-4bdf-81db-0057b937a3c1',
    },
  };
  return await mockServer
    .forPost(SECURITY_ALERT_BRIDGE_URL_REGEX)
    .thenCallback(() => {
      return response;
    });
}

export async function mockEthCallForBridge(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result:
        '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000038000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000480000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000005800000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000068000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000008800000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000000098000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000340dd0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000791b8100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000019d5c367b0c9a9b4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000005ca4643c17f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000121d6e6a16ddc86cbab0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000001b1c78ea45d5e34800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000006bd3e60806e3e140000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000b60aa821bcda944707000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000011ea030000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000005b1bd6905d461a100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000005af4f0591724000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000cfd57c5ca000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000f4240',
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'eth_call',
    })
    .thenCallback(() => {
      return response;
    });
}

export async function mockGetTransactionBridge(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        blockTime: 748277595,
        meta: {
          computeUnitsConsumed: 119916,
          err: null,
          fee: 325504,
          innerInstructions: [
            {
              index: 4,
              instructions: [
                {
                  accounts: [22, 17, 0, 4, 3, 18, 16, 19, 20, 15, 24, 24, 23],
                  data: 'PgQWtn8oziwvxhjVCfr6Mb9EUo2vPeHUT',
                  programIdIndex: 21,
                  stackHeight: 2,
                },
                {
                  accounts: [4, 18, 0],
                  data: '3MpYxPvHuSw1',
                  programIdIndex: 15,
                  stackHeight: 3,
                },
                {
                  accounts: [19, 20, 22],
                  data: '6D5Tp8qqoAB9',
                  programIdIndex: 15,
                  stackHeight: 3,
                },
                {
                  accounts: [16, 3, 22],
                  data: '3hzzRrg7JeAT',
                  programIdIndex: 15,
                  stackHeight: 3,
                },
                {
                  accounts: [9],
                  data: 'QMqFu4fYGGeUEysFnenhAvGHnSPFLovkZXi46MfLjsSzqJhm6XkVGqWpaXx8STNjEgoafNsZcrmDQKhSHUushBvvEwmFp69UewGqbW1sofQNSs7usc6dDnhLrE2mMxALDd6JwaVtHFtrczLi3UQnz4T71gF4ypsSJAg3G9yEp6pEM4j',
                  programIdIndex: 12,
                  stackHeight: 2,
                },
                {
                  accounts: [3, 5, 0],
                  data: '3hzzRrg7JeAT',
                  programIdIndex: 15,
                  stackHeight: 2,
                },
              ],
            },
          ],
          loadedAddresses: {
            readonly: [
              '2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c',
              '7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2',
              '7oo7u7iXrNCekxWWpfLYCbXyjrYLAco5FM9qSjQeNn7g',
              '8RVPH46opPd3qLy1n1djntzGMZxnqEzbYs9uoeixdnwk',
            ],
            writable: [
              '53EkU98Vbv2TQPwGG6t2asCynzFjCX5AnvaabbXafaed',
              'DrRd8gYMJu9XGxLhwTCPdHNLXCKHsxJtMpbn62YqmwQe',
              'EVGW4q1iFjDmtxtHr3NoPi5iVKAxwEjohsusMrinDxr6',
              'FGYgFJSxZTGzaLwzUL9YZqK2yUZ8seofCwGq8BPEw4o8',
              'FwWV8a193zZsYxaRAbYkrM6tmrHMoVY1Xahh2PNFejvF',
            ],
          },
          logMessages: [
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: SyncNative',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3045 of 599550 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]',
            'Program log: Instruction: Route',
            'Program 2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c invoke [2]',
            'Program log: Instruction: Swap',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 543316 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: MintTo',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4492 of 536180 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 529302 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program 2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c consumed 71232 of 591980 compute units',
            'Program 2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 184 of 519014 compute units',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 516125 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 85157 of 596505 compute units',
            'Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 qqQCAAAAAAA=',
            'Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success',
            'Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke [1]',
            'Program log: Memo (len 66): "0x6320fa51e6aaa93f522013db85b1ee724ab9f4c77b8230902c8eff9568951be8"',
            'Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr consumed 24927 of 511348 compute units',
            'Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr success',
            'Program 3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br invoke [1]',
            'Program log: LI.FI TX: 0xF8B3831DC3861A00',
            'Program 3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br consumed 6037 of 486421 compute units',
            'Program 3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
          ],
          postBalances: [
            1771900585, 41158027011, 4573422054, 2039280, 2039280, 2039280, 1,
            1141440, 1, 1017918, 0, 391237817122, 1141440, 521498880, 1169280,
            934087680, 2039280, 7231440, 2312760663063, 1461600, 2039280,
            1141440, 0, 23942400, 23942400,
          ],
          postTokenBalances: [
            {
              accountIndex: 3,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '5202758',
                decimals: 6,
                uiAmount: 5.202758,
                uiAmountString: '5.202758',
              },
            },
            {
              accountIndex: 4,
              mint: 'So11111111111111111111111111111111111111112',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '0',
                decimals: 9,
                uiAmount: null,
                uiAmountString: '0',
              },
            },
            {
              accountIndex: 5,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: 'F7p3dFrjRTbtRp8FRF6qHLomXbKRBzpvBLjtQcfcgmNe',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '267687837498',
                decimals: 6,
                uiAmount: 267687.837498,
                uiAmountString: '267687.837498',
              },
            },
            {
              accountIndex: 16,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '971667118938',
                decimals: 6,
                uiAmount: 971667.118938,
                uiAmountString: '971667.118938',
              },
            },
            {
              accountIndex: 18,
              mint: 'So11111111111111111111111111111111111111112',
              owner: '7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '2312758623772',
                decimals: 9,
                uiAmount: 2312.758623772,
                uiAmountString: '2312.758623772',
              },
            },
            {
              accountIndex: 20,
              mint: 'FGYgFJSxZTGzaLwzUL9YZqK2yUZ8seofCwGq8BPEw4o8',
              owner: 'CbYf9QNrkVgNRCMTDiVdvzMqSzXh8AAgnrKAoTfEACdh',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '1134346653338',
                decimals: 9,
                uiAmount: 1134.346653338,
                uiAmountString: '1134.346653338',
              },
            },
          ],
          preBalances: [
            1773217338, 41158027011, 4573413382, 2039280, 2039280, 2039280, 1,
            1141440, 1, 1017918, 0, 391237817122, 1141440, 521498880, 1169280,
            934087680, 2039280, 7231440, 2312759680486, 1461600, 2039280,
            1141440, 0, 23942400, 23942400,
          ],
          preTokenBalances: [
            {
              accountIndex: 3,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '5202758',
                decimals: 6,
                uiAmount: 5.202758,
                uiAmountString: '5.202758',
              },
            },
            {
              accountIndex: 4,
              mint: 'So11111111111111111111111111111111111111112',
              owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '0',
                decimals: 9,
                uiAmount: null,
                uiAmountString: '0',
              },
            },
            {
              accountIndex: 5,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: 'F7p3dFrjRTbtRp8FRF6qHLomXbKRBzpvBLjtQcfcgmNe',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '267687664272',
                decimals: 6,
                uiAmount: 267687.664272,
                uiAmountString: '267687.664272',
              },
            },
            {
              accountIndex: 16,
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              owner: '7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '971667292164',
                decimals: 6,
                uiAmount: 971667.292164,
                uiAmountString: '971667.292164',
              },
            },
            {
              accountIndex: 18,
              mint: 'So11111111111111111111111111111111111111112',
              owner: '7GmDCbu7bYiWJvFaNUyPNiM8PjvvBcmyBcZY1qSsAGi2',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '2312757641195',
                decimals: 9,
                uiAmount: 2312.757641195,
                uiAmountString: '2312.757641195',
              },
            },
            {
              accountIndex: 20,
              mint: 'FGYgFJSxZTGzaLwzUL9YZqK2yUZ8seofCwGq8BPEw4o8',
              owner: 'CbYf9QNrkVgNRCMTDiVdvzMqSzXh8AAgnrKAoTfEACdh',
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              uiTokenAmount: {
                amount: '1134346653324',
                decimals: 9,
                uiAmount: 1134.346653324,
                uiAmountString: '1134.346653324',
              },
            },
          ],
          rewards: [],
          status: {
            Ok: null,
          },
        },
        slot: 9999942622364,
        transaction: {
          message: {
            accountKeys: [
              '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
              '34FKjAdVcTax2DHqV2XnbXa9J3zmyKcFuFKWbcmgxjgm',
              '4cLUBQKZgCv2AqGXbh8ncGhrDRcicUe3WSDzjgPY2oTA',
              'F77xG4vz2CJeMxxAmFW8pvPx2c5Uk75pksr6Wwx6HFhV',
              'Ffqao4nxSvgaR5kvFz1F718WaxSv6LnNfHuGqFEZ8fzL',
              'Q4UmPB9hKMw3ERqksavS9oEpNo2eWG4ffkWg7wHa9j6',
              '11111111111111111111111111111111',
              '3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br',
              'ComputeBudget111111111111111111111111111111',
              'D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf',
              'DmFk5PjVhNpcyZD2sDr7Lj9VzoGJn9Ls5MyyHEhLAcmM',
              'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
              'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
              'SysvarC1ock11111111111111111111111111111111',
              'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            ],
            addressTableLookups: [
              {
                accountKey: 'UKjUSSbQjkPFkw2i2yggWdTpWmEXZWQLNyHmPRxq4gN',
                readonlyIndexes: [0, 8, 17, 160],
                writableIndexes: [16, 12, 11, 13, 14],
              },
            ],
            header: {
              numReadonlySignedAccounts: 0,
              numReadonlyUnsignedAccounts: 10,
              numRequiredSignatures: 1,
            },
            instructions: [
              {
                accounts: [],
                data: 'JzwPro',
                programIdIndex: 8,
                stackHeight: null,
              },
              {
                accounts: [],
                data: '3fk6o7p4GDXV',
                programIdIndex: 8,
                stackHeight: null,
              },
              {
                accounts: [0, 4],
                data: '3Bxs49DecBY1KrJK',
                programIdIndex: 6,
                stackHeight: null,
              },
              {
                accounts: [4],
                data: 'J',
                programIdIndex: 15,
                stackHeight: null,
              },
              {
                accounts: [
                  15, 0, 4, 3, 5, 11, 12, 9, 12, 21, 22, 17, 0, 4, 3, 18, 16,
                  19, 20, 15, 24, 24, 23,
                ],
                data: 'PrpFmsY4d26dKbdKMY6XTWRcNuyndeauLudWb16wc7qe6oBm',
                programIdIndex: 12,
                stackHeight: null,
              },
              {
                accounts: [],
                data: 'KsyTHVan5QTtA4hbrKFPxZWybs2wbp7Hi2VACb2TLtwEKuMwXpAxcYDq2h5ab5bhTdig9EJdWhydGBAZcmsUqUPfuy',
                programIdIndex: 13,
                stackHeight: null,
              },
              {
                accounts: [14, 10],
                data: '1ibiNkvUdyZq',
                programIdIndex: 7,
                stackHeight: null,
              },
              {
                accounts: [0, 1],
                data: '3Bxs3zrfFUZbEPqZ',
                programIdIndex: 6,
                stackHeight: null,
              },
              {
                accounts: [0, 2],
                data: '3Bxs4eLzTT6qyqq1',
                programIdIndex: 6,
                stackHeight: null,
              },
            ],
            recentBlockhash: '7JcLaME3F2ReKRVR8bxGG8eMcZSGSKJeMPp645x1SD2H',
          },
          signatures: [
            '2fwnBMKmGJ86uagQ9NEAyUfWeCrvTDn5WiZtiB8AFVtf1RiSaNmyfTxBw8Un7G5BRpoXACzvfhohyxCsCXhJWBJp',
          ],
        },
        version: 0,
      },
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTransaction',
    })
    .thenCallback(() => {
      return response;
    });
}
export async function mockPriceApiSpotPriceSwap(mockServer: Mockttp) {
  return await mockServer.forGet(SPOT_PRICE_API).thenCallback(() => {
    return {
      statusCode: 200,
      json: {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
          {
            usd: 0.999761,
          },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          usd: 168.88,
        },
      },
    };
  });
}

export async function mockBridgeGetTokens(mockServer: Mockttp) {
  return await mockServer.forGet(BRIDGED_TOKEN_LIST_API).thenCallback(() => {
    return {
      statusCode: 200,
      json: [
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: 1151111081099710,
          assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          symbol: 'SOL',
          decimals: 9,
          name: 'SOL',
          aggregators: [],
          occurrences: 100,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
          metadata: {},
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: 1151111081099710,
          assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          symbol: 'SOL',
          decimals: 9,
          name: 'SOL',
          aggregators: [],
          occurrences: 100,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
          metadata: {},
        },
        {
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          chainId: 1151111081099710,
          assetId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
          coingeckoId: 'usd-coin',
          aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
          occurrences: 4,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
          metadata: {},
        },
      ],
    };
  });
}

const featureFlags = {
  refreshRate: 30000,
  maxRefreshCount: 5,
  support: true,
  chains: {
    '1': { isActiveSrc: true, isActiveDest: true },
    '42161': { isActiveSrc: true, isActiveDest: true },
    '59144': { isActiveSrc: true, isActiveDest: true },
    '1151111081099710': {
      topAssets: [
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // Jupiter
        '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxsDx8F8k8k3uYw1PDC',
        '3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y',
        '9zNQRsGLjNKwCUU5Gq5LR8beUCPzQMVMqKAi3SSZh54u',
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
        '2RBko3xoz56aH69isQMUpzZd9NYHahhwC23A5F3Spkin',
      ],
      isActiveSrc: true,
      isActiveDest: true,
    },
  },
};
export async function withSolanaAccountSnap(
  {
    title,
    showNativeTokenAsMainBalance,
    mockCalls,
    mockSendTransaction,
    numberOfAccounts = 1,
    simulateTransaction,
    simulateTransactionFailed,
    mockGetTransactionSuccess,
    mockGetTransactionFailed,
    mockZeroBalance,
    sendFailedTransaction,
    dappPaths,
    withProtocolSnap,
    mockSwapUSDtoSOL,
    mockSwapSOLtoUSDC,
    mockSwapWithNoQuotes,
  }: {
    title?: string;
    showNativeTokenAsMainBalance?: boolean;
    mockCalls?: boolean;
    mockSendTransaction?: boolean;
    numberOfAccounts?: number;
    simulateTransaction?: boolean;
    simulateTransactionFailed?: boolean;
    mockGetTransactionSuccess?: boolean;
    mockGetTransactionFailed?: boolean;
    mockZeroBalance?: boolean;
    sendFailedTransaction?: boolean;
    dappPaths?: string[];
    withProtocolSnap?: boolean;
    mockSwapUSDtoSOL?: boolean;
    mockSwapSOLtoUSDC?: boolean;
    mockSwapWithNoQuotes?: boolean;
  },
  test: (
    driver: Driver,
    mockServer: Mockttp,
    extensionId: string,
  ) => Promise<void>,
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
      manifestFlags: {
        // This flag is used to enable/disable the remote mode for the carousel
        // component, which will impact to the slides count.
        // - If this flag is not set, the slides count will be 4.
        // - If this flag is set, the slides count will be 5.
        remoteFeatureFlags: {
          addSolanaAccount: true,
          bridgeConfig: featureFlags,
        },
      },
      dappPaths,
      testSpecificMock: async (mockServer: Mockttp) => {
        const mockList: MockedEndpoint[] = [];

        if (mockGetTransactionSuccess && !mockGetTransactionFailed) {
          console.log('mockGetTransactionSuccess');
          mockList.push(await mockGetSuccessSignaturesForAddress(mockServer));
          mockList.push(await mockGetSuccessTransaction(mockServer));
          mockList.push(
            await mockGetSuccessSignaturesForAddressDevnet(mockServer),
          );
        }
        if (mockGetTransactionFailed && !mockGetTransactionSuccess) {
          console.log('mockGetTransactionFailed');
          mockList.push(await mockGetFailedSignaturesForAddress(mockServer));
          mockList.push(await mockGetFailedTransaction(mockServer));
          mockList.push(
            await mockGetFailedSignaturesForAddressDevnet(mockServer),
          );
          mockList.push(await mockGetFailedTransactionDevnet(mockServer));
        }
        if (
          !mockGetTransactionSuccess &&
          !mockGetTransactionFailed &&
          !mockSwapUSDtoSOL &&
          !mockSwapSOLtoUSDC
        ) {
          // success tx by default
          console.log('mockGetTransactionSuccess');
          mockList.push(await mockGetSuccessSignaturesForAddress(mockServer));
          mockList.push(await mockGetSuccessTransaction(mockServer));
          mockList.push(
            await mockGetSuccessSignaturesForAddressDevnet(mockServer),
          );
        }
        if (mockCalls) {
          mockList.push(
            ...[
              await mockSolanaBalanceQuote(mockServer),
              await mockSolanaBalanceQuoteDevnet(mockServer),
              await mockGetMinimumBalanceForRentExemption(mockServer),
              /* await mockGetTokenAccountsByOwner(
                mockServer,
                '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                SOLANA_TOKEN_PROGRAM,
              ),
              await mockGetTokenAccountsByOwner(
                mockServer,
                '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
                'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
              ),*/
              // await mockGetTokenAccountsByOwnerDevnet(mockServer),
              await mockMultiCoinPrice(mockServer),
              await mockGetLatestBlockhash(mockServer),
              await mockGetLatestBlockhashDevnet(mockServer),
              await mockGetFeeForMessage(mockServer),
              await mockGetFeeForMessageDevnet(mockServer),
              await mockPriceApiSpotPrice(mockServer),
              await mockPriceApiExchangeRates(mockServer),
              await mockClientSideDetectionApi(mockServer),
              await mockPhishingDetectionApi(mockServer),
              await mockGetTokenAccountInfo(mockServer),

              await mockGetAccountInfoDevnet(mockServer),
              await mockTokenApiMainnetTest(mockServer),
              await mockAccountsApi(mockServer),
              // await mockGetTokenAccountInfoDevnet(mockServer),
            ],
          );
        }
        if (mockZeroBalance) {
          mockList.push(await mockSolanaBalanceQuote(mockServer, true));
          mockList.push(await mockSolanaBalanceQuoteDevnet(mockServer, true));
        }
        if (simulateTransactionFailed) {
          mockList.push(await simulateSolanaTransactionFailed(mockServer));
        }
        if (simulateTransaction) {
          mockList.push(await simulateSolanaTransaction(mockServer));
        }
        if (mockSwapWithNoQuotes) {
          mockList.push(await mockNoQuotesAvailable(mockServer));
          mockList.push(
            await mockGetTokenAccountsTokenProgramSwaps(mockServer),
          );
          mockList.push(
            await mockGetTokenAccountsTokenProgram2022Swaps(mockServer),
          );
          mockList.push(await mockGetMultipleAccounts(mockServer));
        }
        if (mockSwapUSDtoSOL) {
          mockList.push(
            ...[
              await mockQuoteFromUSDCtoSOL(mockServer),
              await mockSendSwapSolanaTransaction(mockServer),
              await mockPriceApiSpotPriceSwap(mockServer),
              await mockGetUSDCSOLTransaction(mockServer),
              await mockGetTokenAccountsTokenProgramSwaps(mockServer),
              await mockGetTokenAccountsTokenProgram2022Swaps(mockServer),
              await mockGetMultipleAccounts(mockServer),
              await mockSecurityAlertSwap(mockServer),
              await mockGetSignaturesSuccessSwap(mockServer),

              // await mockTopAssetsSolana(mockServer),
            ],
          );
        }
        if (mockSwapSOLtoUSDC) {
          mockList.push(
            ...[
              await mockQuoteFromSoltoUSDC(mockServer),
              await mockSendSwapSolanaTransaction(mockServer),
              await mockPriceApiSpotPriceSwap(mockServer),
              await mockGetSOLUSDCTransaction(mockServer),
              await mockGetTokenAccountsTokenProgramSwaps(mockServer),
              await mockGetTokenAccountsTokenProgram2022Swaps(mockServer),
              await mockGetMultipleAccounts(mockServer),
              await mockSecurityAlertSwap(mockServer),
              await mockGetSignaturesSuccessSwap(mockServer),
              // await mockTopAssetsSolana(mockServer),
            ],
          );
        }
        if (mockSendTransaction) {
          mockList.push(await simulateSolanaTransaction(mockServer));
          mockList.push(await mockSendSolanaTransaction(mockServer));
        } else if (sendFailedTransaction) {
          mockList.push(await simulateSolanaTransaction(mockServer));
          mockList.push(await mockSendSolanaFailedTransaction(mockServer));
        }
        if (withProtocolSnap) {
          mockList.push(await mockProtocolSnap(mockServer));
        }

        return mockList;
      },
      ignoredConsoleErrors: [
        'SES_UNHANDLED_REJECTION: 0, never, undefined, index, Array(1)',
        'SES_UNHANDLED_REJECTION: 1, never, undefined, index, Array(1)',
        'No custom network client was found with the ID',
        'No Infura network client was found with the ID "linea-mainnet"',
      ],
    },
    async ({
      driver,
      mockServer,
      extensionId,
    }: {
      driver: Driver;
      mockServer: Mockttp;
      extensionId: string;
    }) => {
      await loginWithoutBalanceValidation(driver);
      const headerComponent = new HeaderNavbar(driver);
      const accountListPage = new AccountListPage(driver);

      for (let i = 1; i <= numberOfAccounts; i++) {
        await headerComponent.openAccountMenu();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: `Solana ${i}`,
        });
        await headerComponent.check_accountLabel(`Solana ${i}`);
      }

      if (numberOfAccounts > 0) {
        await headerComponent.check_accountLabel(`Solana ${numberOfAccounts}`);
      }

      await driver.delay(regularDelayMs); // workaround to avoid flakiness
      await test(driver, mockServer, extensionId);
    },
  );
}
