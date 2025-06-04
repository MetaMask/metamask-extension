/* eslint-disable @typescript-eslint/no-loss-of-precision */
import * as fs from 'fs/promises';
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
  /^https:\/\/bridge\.(api|dev-api)\.cx\.metamask\.io\/getTxStatus/u;
export const BRIDGED_TOKEN_LIST_API =
  /^https:\/\/bridge\.(api|dev-api)\.cx\.metamask\.io\/getTokens/u;

export const BRIDGE_GET_QUOTE_API =
  /^https:\/\/bridge\.(api|dev-api)\.cx\.metamask\.io\/getQuote/u;

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

async function readResponseJsonFile(fileName: string): Promise<object> {
  try {
    const fileContents = await fs.readFile(
      `test/e2e/tests/solana/mocks/${fileName}`,
      'utf-8',
    );
    const jsonObject = JSON.parse(fileContents);
    return jsonObject;
  } catch (error) {
    throw new Error(`Failed to read or parse JSON file: ${error.message}`);
  }
}

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
  const response = await readResponseJsonFile('priceApiSpotSolanaUsdc.json');
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
        json: response,
      };
    });
}

export async function mockPriceApiSpotPrice(mockServer: Mockttp) {
  return await mockServer.forGet(SPOT_PRICE_API).thenCallback(() => {
    return {
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
  });
}

export async function mockPriceApiSpotPriceOld(mockServer: Mockttp) {
  console.log('mockPriceApiSpotPriceOld');
  const ethMarketResp = await readResponseJsonFile('ethMarketData.json');
  const ehtMarketResponse = {
    statusCode: 200,
    json: ethMarketResp,
  };
  const solanaMarketDataResp = await readResponseJsonFile(
    'solanaMarketData.json',
  );
  const solanaMarketDataResponse = {
    statusCode: 200,
    json: solanaMarketDataResp,
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
          logMessages: [],
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
            instructions: [],
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

export async function mockGetSuccessTransaction(mockServer: Mockttp) {
  const succededTransaction = await readResponseJsonFile(
    'succeededTransaction.json',
  );
  const response = {
    statusCode: 200,
    json: succededTransaction,
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

export async function mockGetUSDCSOLTransaction(mockServer: Mockttp) {
  const resp = await readResponseJsonFile('usdcSolTransaction.json');
  const response = {
    statusCode: 200,
    json: resp,
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
  const resp = await readResponseJsonFile('solUsdcTransaction.json');
  const response = {
    statusCode: 200,
    json: resp,
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
  const resp = await readResponseJsonFile('tokenAccountTokenProgram.json');
  const response = {
    statusCode: 200,
    json: resp,
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
  const quoteUsdcToSol = await readResponseJsonFile('quoteUsdcToSol.json');
  const quotesResponse = {
    statusCode: 200,
    json: quoteUsdcToSol,
  };
  return await mockServer
    .forGet(BRIDGE_GET_QUOTE_API)
    .thenCallback(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // just to see fetching quotes
      return quotesResponse;
    });
}

export async function mockQuoteFromSoltoUSDC(mockServer: Mockttp) {
  const quoteSolToUsdc = await readResponseJsonFile('quoteSolToUsdc.json');
  const quotesResponse = {
    statusCode: 200,
    json: quoteSolToUsdc,
  };
  return await mockServer
    .forGet(BRIDGE_GET_QUOTE_API)
    .thenCallback(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // just to see fetching quotes
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
              instructions: [],
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
          logMessages: [],
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
            instructions: [],
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
    console.log('Entra aqui y response es');

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
  minimumVersion: '0.0.0',
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
    mockSendSPLToken,
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
    mockSendSPLToken?: boolean;
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
        }
        if (mockGetTransactionFailed && !mockGetTransactionSuccess) {
          console.log('mockGetTransactionFailed');
          mockList.push(await mockGetFailedSignaturesForAddress(mockServer));
          mockList.push(await mockGetFailedTransaction(mockServer));
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
        }
        if (mockCalls) {
          mockList.push(
            await mockSolanaBalanceQuote(mockServer, mockZeroBalance),
            await mockGetMinimumBalanceForRentExemption(mockServer),
            await mockMultiCoinPrice(mockServer),
            await mockGetLatestBlockhash(mockServer),
            await mockGetFeeForMessage(mockServer),
            await mockPriceApiSpotPrice(mockServer),
            await mockPriceApiExchangeRates(mockServer),
            await mockClientSideDetectionApi(mockServer),
            await mockPhishingDetectionApi(mockServer),
            await mockGetTokenAccountInfo(mockServer),
            await mockGetAccountInfoDevnet(mockServer),
            await mockTokenApiMainnetTest(mockServer),
            await mockAccountsApi(mockServer),
          );
        }
        if (mockZeroBalance) {
          mockList.push(await mockSolanaBalanceQuote(mockServer, true));
        }
        if (simulateTransactionFailed) {
          mockList.push(await simulateSolanaTransactionFailed(mockServer));
        }
        if (simulateTransaction) {
          mockList.push(await simulateSolanaTransaction(mockServer));
        }
        if (mockSwapWithNoQuotes) {
          mockList.push(await mockBridgeGetTokens(mockServer));
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
              await mockBridgeGetTokens(mockServer),
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
              await mockBridgeGetTokens(mockServer),
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
