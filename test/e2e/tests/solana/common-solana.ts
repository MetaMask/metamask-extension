/* eslint-disable @typescript-eslint/no-loss-of-precision */
import { ReadableStream as ReadableStreamWeb } from 'stream/web';
import { Readable } from 'stream';
import * as fs from 'fs/promises';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { DAPP_PATH } from '../../constants';
import { mockProtocolSnap } from '../../mock-response-data/snaps/snap-binary-mocks';

/**
 * Holds the actual transaction signature captured from sendTransaction.
 * Shared between mock functions so that getSignaturesForAddress and
 * getTransaction return the correct signature.
 */
export type SignatureHolder = { value: string };

/**
 * Extract the first signature from a base64-encoded Solana transaction.
 * The serialized format starts with a compact-u16 signature count, then
 * 64-byte signatures.
 *
 * @param base64Tx - The base64-encoded serialized transaction.
 * @returns The first signature as a base58 string.
 */
async function extractSignatureFromBase64Tx(base64Tx: string): Promise<string> {
  const buffer = Buffer.from(base64Tx, 'base64');
  // byte[0] = number of signatures (compact-u16; 1 = 0x01)
  // bytes[1..64] = first signature (64 bytes)
  const signatureBytes = buffer.slice(1, 65);
  const { default: bs58Mod } = await import('bs58');
  return bs58Mod.encode(signatureBytes);
}

const SOLANA_URL_REGEX_MAINNET =
  /^https:\/\/solana-(mainnet|devnet)\.infura\.io\/v3*/u;
const SOLANA_URL_REGEX_DEVNET = /^https:\/\/solana-devnet\.infura\.io\/v3\/.*/u;
const SPOT_PRICE_API =
  /^https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/spot-prices/u;
const SOLANA_EXCHANGE_RATES_PRICE_API =
  /^https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/exchange-rates\/fiat/u;
const SOLANA_STATIC_TOKEN_IMAGE_REGEX_MAINNET =
  /^https:\/\/static\.cx\.metamask\.io\/api\/v2\/tokenIcons\/assets\/solana\/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/u;
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

export const BRIDGE_GET_QUOTE_STREAM_API =
  /^https:\/\/bridge\.(api|dev-api)\.cx\.metamask\.io\/getQuoteStream/u;

const SSE_RESPONSE_HEADER = { 'Content-Type': 'text/event-stream' };

const getEventId = (index: number) => `${Date.now().toString()}-${index}`;
const emitLine = (controller: ReadableStreamDefaultController, line: string) =>
  controller.enqueue(Buffer.from(line));

const mockSseEventSource = (mockQuotes: unknown[], delay: number = 500) => {
  let index = 0;
  return Readable.fromWeb(
    new ReadableStreamWeb({
      async pull(controller) {
        if (index === mockQuotes.length) {
          controller.close();
          return;
        }
        const quote = mockQuotes[index];
        emitLine(controller, `event: quote\n`);
        emitLine(controller, `id: ${getEventId(index + 1)}\n`);
        emitLine(controller, `data: ${JSON.stringify(quote)}\n\n`);
        index += 1;
        await new Promise((resolve) => setTimeout(resolve, delay));
      },
    }),
  );
};

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
  amount: '-0.00708 SOL',
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to read or parse JSON file: ${error.message}`);
    }
    throw new Error('Failed to read or parse JSON file');
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
export async function mockPriceApiNative(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
    .withQuery({
      assetIds: 'eip155:1/slip44:60',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          'eip155:1/slip44:60': {
            id: 'ethereum',
            price: 0.999117772642222,
            marketCap: 120730309.278268,
            allTimeHigh: 1.24053260919415,
            allTimeLow: 0.000108596671808063,
            totalVolume: 9010559.46688706,
            high1d: 1.04615771175613,
            low1d: 0.989917959436686,
            circulatingSupply: 120698129.773088,
            dilutedMarketCap: 120730309.278268,
            marketCapPercentChange1d: -3.34335,
            priceChange1d: -140.536403039107,
            pricePercentChange1h: -0.127159732673363,
            pricePercentChange1d: -3.40772116422561,
            pricePercentChange7d: 0.946312983866069,
            pricePercentChange14d: -3.47111933351513,
            pricePercentChange30d: -3.63371831966747,
            pricePercentChange200d: 153.231041911147,
            pricePercentChange1y: 54.625598917999,
          },
        },
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

export async function mockSolanaBalanceQuote({
  mockServer,
  balance = SOL_BALANCE,
}: {
  mockServer: Mockttp;
  balance?: number;
}) {
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
        value: balance,
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

export async function mockGetSuccessSplTokenTransaction(mockServer: Mockttp) {
  const succeededSplTransaction = await readResponseJsonFile(
    'succeededSplTokenTransaction.json',
  );
  const response = {
    statusCode: 200,
    json: succeededSplTransaction,
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

const SOL_TO_USDC_SWAP_SIGNATURE =
  '2m8z8uPZyoZwQpissDbhSfW5XDTFmpc7cSFithc5e1w8iCwFcvVkxHeaVhgFSdgUPb5cebbKGjuu48JMLPjfEATr';
const USDC_TO_SOL_SWAP_SIGNATURE =
  '28rWme56aMyaP8oX18unFeZg65iyDEhjLhvMBpxyFgKcn38P37ZRsssSZoHDCCr5xUfwfpqsVSSBoShLitHQLdrr';

export async function mockGetSignaturesSuccessSwap(
  mockServer: Mockttp,
  signatureOrHolder: string | SignatureHolder = SOL_TO_USDC_SWAP_SIGNATURE,
) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(() => {
      const signature =
        typeof signatureOrHolder === 'string'
          ? signatureOrHolder
          : signatureOrHolder.value || SOL_TO_USDC_SWAP_SIGNATURE;
      return {
        statusCode: 200,
        json: {
          result: [
            {
              blockTime: 1748363309,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature,
              slot: 342840492,
            },
          ],
        },
      };
    });
}

export async function mockSendSwapSolanaTransaction(
  mockServer: Mockttp,
  signatureHolder?: SignatureHolder,
  defaultSignature: string = USDC_TO_SOL_SWAP_SIGNATURE,
) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'sendTransaction',
    })
    .thenCallback(async (req) => {
      let signature = defaultSignature;
      try {
        const body = (await req.body.getJson()) as {
          params?: [string];
        };
        const base64Tx = body?.params?.[0];
        if (base64Tx) {
          signature = await extractSignatureFromBase64Tx(base64Tx);
          console.log('Captured actual swap signature:', signature);
          if (signatureHolder) {
            signatureHolder.value = signature;
          }
        }
      } catch (e) {
        console.log('Failed to extract signature from sendTransaction:', e);
      }
      return {
        statusCode: 200,
        json: {
          result: signature,
          id: '1337',
          jsonrpc: '2.0',
        },
      };
    });
}

export async function mockGetUSDCSOLTransaction(
  mockServer: Mockttp,
  signatureHolder?: SignatureHolder,
) {
  const resp = await readResponseJsonFile('usdcSolTransaction.json');
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTransaction',
    })
    .thenCallback(() => {
      const json = JSON.parse(JSON.stringify(resp));
      if (signatureHolder?.value) {
        json.result.transaction.signatures = [signatureHolder.value];
      }
      return {
        statusCode: 200,
        json,
      };
    });
}

export async function mockGetSOLUSDCTransaction(
  mockServer: Mockttp,
  signatureHolder?: SignatureHolder,
) {
  const resp = await readResponseJsonFile('solUsdcTransaction.json');
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getTransaction',
    })
    .thenCallback(() => {
      const json = JSON.parse(JSON.stringify(resp));
      if (signatureHolder?.value) {
        json.result.transaction.signatures = [signatureHolder.value];
      }
      return {
        statusCode: 200,
        json,
      };
    });
}

export async function mockSendSolanaTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result:
        '3AcYfpsSaFYogY4Y4YN77MkhDgVBEgUe1vuEeqKnCMm5udTrFCyw9w17mNM8DUnHnQD2VHRFeipMUb27Q3iqMQJr',
      id: '1337',
      jsonrpc: '2.0',
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'sendTransaction',
    })
    .thenCallback(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds delay
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
  account: string = '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
  programId: string = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
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
          data: ['', 'base58'],
          executable: false,
          lamports: 5312114,
          owner: '11111111111111111111111111111111',
          rentEpoch: 18446744073709551615,
          space: 0,
        },
      },
    },
  };
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getAccountInfo',
    })
    .thenCallback(() => {
      return response;
    });
}

/**
 * Mocks getAccountInfo for SPL token mint accounts (USDC and WSOL).
 * Must be registered AFTER mockGetTokenAccountInfo (LIFO priority)
 * so mint queries get the correct SPL token mint layout.
 *
 * @param mockServer - The mockttp server instance.
 */
export async function mockGetMintAccountInfo(mockServer: Mockttp) {
  const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const WSOL_MINT = 'So11111111111111111111111111111111111111112';

  // 82-byte SPL Token Mint layout encoded as base64
  // USDC: decimals=6, isInitialized=true, mintAuthority=Some, freezeAuthority=Some
  const USDC_MINT_DATA =
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKByThgJAAAGAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
  // WSOL: decimals=9, isInitialized=true, mintAuthority=None, freezeAuthority=None
  const WSOL_MINT_DATA =
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//9jp7O24A0JAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

  const mintDataMap: Record<string, string> = {
    [USDC_MINT]: USDC_MINT_DATA,
    [WSOL_MINT]: WSOL_MINT_DATA,
  };

  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getAccountInfo',
    })
    .thenCallback(async (req) => {
      const body = (await req.body.getJson()) as {
        params?: [string];
      };
      const address = body?.params?.[0] ?? '';
      const mintData = mintDataMap[address];

      if (mintData) {
        return {
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
                data: [mintData, 'base64'],
                executable: false,
                lamports: 5312114,
                owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                rentEpoch: 18446744073709551615,
                space: 82,
              },
            },
          },
        };
      }

      // Fallback: generic system account (same as mockGetTokenAccountInfo)
      return {
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
              data: ['', 'base58'],
              executable: false,
              lamports: 5312114,
              owner: '11111111111111111111111111111111',
              rentEpoch: 18446744073709551615,
              space: 0,
            },
          },
        },
      };
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

export async function mockNoQuotesAvailable(mockServer: Mockttp) {
  return await mockServer
    .forGet(BRIDGE_GET_QUOTE_STREAM_API)
    .thenStream(200, mockSseEventSource([]), SSE_RESPONSE_HEADER);
}

export async function mockQuoteFromUSDCtoSOL(mockServer: Mockttp) {
  const quoteUsdcToSol = await readResponseJsonFile('quoteUsdcToSol.json');
  return await mockServer
    .forGet(BRIDGE_GET_QUOTE_STREAM_API)
    .thenStream(
      200,
      mockSseEventSource(quoteUsdcToSol as unknown[]),
      SSE_RESPONSE_HEADER,
    );
}

export async function mockQuoteFromSoltoUSDC(mockServer: Mockttp) {
  const quoteSolToUsdc = await readResponseJsonFile('quoteSolToUsdc.json');
  return await mockServer
    .forGet(BRIDGE_GET_QUOTE_STREAM_API)
    .thenStream(
      200,
      mockSseEventSource(quoteSolToUsdc as unknown[]),
      SSE_RESPONSE_HEADER,
    );
}

export async function mockGetMultipleAccounts(mockServer: Mockttp) {
  console.log('mockgetMultipleAccounts');

  // The swap V0 transactions reference ALT indices up to 246 (0-based),
  // so we need at least 247 entries.
  const NUM_ALT_ADDRESSES = 247;
  const dummyAddresses: string[] = [];
  for (let i = 0; i < NUM_ALT_ADDRESSES; i++) {
    // Produce deterministic base58-like 32-byte addresses
    const buf = Buffer.alloc(32);
    buf[0] = (i + 1) % 256;
    buf[1] = Math.floor((i + 1) / 256) % 256;
    buf[31] = 1;
    dummyAddresses.push(buf.toString('base64'));
  }

  const altAccountEntry = {
    data: {
      parsed: {
        info: {
          addresses: dummyAddresses,
          authority: '9RAufBfjGQjDfrwxeyKmZWPADHSb8HcoqCdrmpqvCr1g',
          deactivationSlot: '18446744073709551615',
          lastExtendedSlot: '330440295',
          lastExtendedSlotStartIndex: 0,
        },
        type: 'lookupTable',
      },
      program: 'address-lookup-table',
      space: 56 + NUM_ALT_ADDRESSES * 32,
    },
    executable: false,
    lamports: 58296960,
    owner: 'AddressLookupTab1e1111111111111111111111111',
    rentEpoch: 18446744073709551615,
    space: 56 + NUM_ALT_ADDRESSES * 32,
  };

  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getMultipleAccounts',
    })
    .thenCallback(async (req) => {
      const body = (await req.body.getJson()) as {
        params?: [string[]];
      };
      const requestedAccounts = body?.params?.[0] ?? [];
      // Return one ALT entry per requested account
      const value = requestedAccounts.map(() => altAccountEntry);
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: {
            context: { apiVersion: '2.1.21', slot: 341693911 },
            value,
          },
        },
      };
    });
}

export async function mockSecurityAlertSwap(mockServer: Mockttp) {
  console.log('mockSecurityAlertSwap');
  const securityAlertSwapResponse = await readResponseJsonFile(
    'securityAlertSwap.json',
  );
  const response = {
    statusCode: 200,
    json: securityAlertSwapResponse,
  };
  return await mockServer
    .forPost(SECURITY_ALERT_BRIDGE_URL_REGEX)
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
            id: 'usd-coin',
            price: 0.999761,
          },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          id: 'solana',
          price: 168.88,
        },
      },
    };
  });
}

const SOLANA_BRIDGE_TOKENS = [
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
];

export async function mockBridgeGetTokens(mockServer: Mockttp) {
  return await mockServer.forPost(/getTokens\/popular/u).thenCallback(() => {
    return {
      statusCode: 200,
      json: SOLANA_BRIDGE_TOKENS,
    };
  });
}

export async function mockBridgeSearchTokens(mockServer: Mockttp) {
  return await mockServer.forPost(/getTokens\/search/u).thenCallback(() => {
    return {
      statusCode: 200,
      json: {
        data: SOLANA_BRIDGE_TOKENS,
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
    };
  });
}

/**
 * Mocks the Bridge getTxStatus endpoint to return a COMPLETE status.
 *
 * @param mockServer - The mockttp server instance.
 */
const SOL_TOKEN_INFO = {
  address: '0x0000000000000000000000000000000000000000',
  chainId: 1151111081099710,
  symbol: 'SOL',
  decimals: 9,
  name: 'SOL',
  coinKey: 'SOL',
  logoURI: '',
  priceUSD: '168.88',
};

const USDC_TOKEN_INFO = {
  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  chainId: 1151111081099710,
  symbol: 'USDC',
  decimals: 6,
  name: 'USD Coin',
  coinKey: 'USDC',
  logoURI: '',
  priceUSD: '1.0',
};

export async function mockBridgeTxStatus(
  mockServer: Mockttp,
  direction: 'SOL_TO_USDC' | 'USDC_TO_SOL' = 'SOL_TO_USDC',
) {
  const isSolToUsdc = direction === 'SOL_TO_USDC';
  return await mockServer.forGet(BRIDGE_TX_STATUS).thenCallback(() => {
    console.log('mockBridgeTxStatus', direction);
    return {
      statusCode: 200,
      json: {
        status: 'COMPLETE',
        isExpectedToken: true,
        bridge: 'lifi',
        srcChain: {
          chainId: 1151111081099710,
          txHash: isSolToUsdc
            ? SOL_TO_USDC_SWAP_SIGNATURE
            : USDC_TO_SOL_SWAP_SIGNATURE,
          amount: isSolToUsdc ? '1000000000' : '991250',
          token: isSolToUsdc ? SOL_TOKEN_INFO : USDC_TOKEN_INFO,
        },
        destChain: {
          chainId: 1151111081099710,
          txHash: '',
          amount: isSolToUsdc ? '136900000' : '5836864',
          token: isSolToUsdc ? USDC_TOKEN_INFO : SOL_TOKEN_INFO,
        },
      },
    };
  });
}

const WALLET_ADDRESS = '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';

const USDC_CAIP19 =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const USDC_TOKEN_ACCOUNT_PUBKEY =
  'F77xG4vz2CJeMxxAmFW8pvPx2c5Uk75pksr6Wwx6HFhV';

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const USDC_BALANCE_AMOUNT = '8908267';

/**
 * Returns the USDC token account for SPL Token program queries.
 * For Token2022 program queries, returns empty.
 *
 * @param mockServer - The mockttp server instance.
 * @param signatureHolder - Optional. When provided, USDC is only returned after swap submission.
 */
export async function mockGetTokenAccountsUSDCOnly(
  mockServer: Mockttp,
  signatureHolder?: SignatureHolder,
) {
  const usdcAccount = {
    account: {
      data: {
        parsed: {
          info: {
            isNative: false,
            mint: USDC_MINT,
            owner: WALLET_ADDRESS,
            state: 'initialized',
            tokenAmount: {
              amount: USDC_BALANCE_AMOUNT,
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
      owner: SOLANA_TOKEN_PROGRAM,
      rentEpoch: 18446744073709552000,
      space: 165,
    },
    pubkey: USDC_TOKEN_ACCOUNT_PUBKEY,
  };

  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({ method: 'getTokenAccountsByOwner' })
    .thenCallback(async (req) => {
      const body = (await req.body.getText()) ?? '';
      const isSplToken = body.includes(SOLANA_TOKEN_PROGRAM);
      const shouldReturn = !signatureHolder || signatureHolder.value !== '';
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: {
            context: { apiVersion: '2.2.14', slot: 343229969 },
            value: isSplToken && shouldReturn ? [usdcAccount] : [],
          },
        },
      };
    });
}

/**
 * Mocks getTokenAccountBalance for the USDC token account.
 * The snap calls this to get the exact balance of a discovered SPL token account.
 *
 * @param mockServer - The mockttp server instance.
 */
export async function mockGetTokenAccountBalance(mockServer: Mockttp) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({ method: 'getTokenAccountBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        id: '1337',
        jsonrpc: '2.0',
        result: {
          context: { apiVersion: '2.2.14', slot: 343229969 },
          value: {
            amount: USDC_BALANCE_AMOUNT,
            decimals: 6,
            uiAmount: 8.908267,
            uiAmountString: '8.908267',
          },
        },
      },
    }));
}

/**
 * Mocks the Token API /v3/assets endpoint so the snap can resolve
 * USDC metadata (symbol, name, decimals) for the swap transaction display.
 *
 * @param mockServer - The mockttp server instance.
 */
export async function mockTokenApiAssets(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        {
          assetId: USDC_CAIP19,
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
        },
      ],
    }));
}

/**
 * Only returns swap signatures for the wallet address and only after the
 * swap has been submitted. Returns empty for token account addresses to
 * prevent the snap from processing redundant transactions during asset discovery.
 *
 * @param mockServer - The mockttp server instance.
 * @param signatureHolder - Shared holder for the dynamic signature.
 */
export async function mockGetSignaturesForWalletOnly(
  mockServer: Mockttp,
  signatureHolder: SignatureHolder,
) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(async (req) => {
      const body = (await req.body.getText()) ?? '';
      const isWalletAddress = body.includes(WALLET_ADDRESS);
      const swapSubmitted = signatureHolder.value !== '';

      if (!isWalletAddress || !swapSubmitted) {
        return {
          statusCode: 200,
          json: { id: '1337', jsonrpc: '2.0', result: [] },
        };
      }

      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: [
            {
              blockTime: 1748363309,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature: signatureHolder.value,
              slot: 342840492,
            },
          ],
        },
      };
    });
}

export const SHOW_SWAP_SNAP_CONFIRMATION = false;

export const SOLANA_DEFAULT_DAPP_OPTIONS = {
  numberOfTestDapps: 1,
  customDappPaths: [DAPP_PATH.TEST_SNAPS],
};

export type SolanaMockOptions = {
  mockGetTransactionSuccess?: boolean;
  mockGetTransactionFailed?: boolean;
  mockTokenAccountAccountInfo?: boolean;
  balance?: number;
  mockSwapUSDtoSOL?: boolean;
  mockSwapSOLtoUSDC?: boolean;
  mockSwapWithNoQuotes?: boolean;
  walletConnect?: boolean;
  withProtocolSnap?: boolean;
  withCustomMocks?: (
    mockServer: Mockttp,
  ) =>
    | Promise<MockedEndpoint[] | MockedEndpoint>
    | MockedEndpoint[]
    | MockedEndpoint;
};

export function buildSolanaTestSpecificMock(options: SolanaMockOptions = {}) {
  const {
    mockGetTransactionSuccess,
    mockGetTransactionFailed,
    mockTokenAccountAccountInfo = true,
    balance,
    mockSwapUSDtoSOL,
    mockSwapSOLtoUSDC,
    mockSwapWithNoQuotes,
    walletConnect = false,
    withProtocolSnap,
    withCustomMocks,
  } = options;

  return async (mockServer: Mockttp): Promise<MockedEndpoint[]> => {
    const mockList: MockedEndpoint[] = [];
    const isExecutedSwapScenario = Boolean(
      mockSwapUSDtoSOL || mockSwapSOLtoUSDC,
    );
    const isSwapScenario = Boolean(
      isExecutedSwapScenario || mockSwapWithNoQuotes,
    );
    mockList.push(await simulateSolanaTransaction(mockServer));
    if (walletConnect) {
      mockList.push(await mockGetTokenAccountsByOwnerDevnet(mockServer));
      mockList.push(await mockGetAccountInfoDevnet(mockServer));
    }
    mockList.push(await mockGetMultipleAccounts(mockServer));
    if (mockGetTransactionSuccess) {
      mockList.push(await mockSendSolanaTransaction(mockServer));
      mockList.push(await mockGetSuccessSignaturesForAddress(mockServer));
      mockList.push(await mockGetSuccessTransaction(mockServer));
    }
    if (mockGetTransactionFailed) {
      mockList.push(await mockSendSolanaFailedTransaction(mockServer));
      mockList.push(await mockGetFailedSignaturesForAddress(mockServer));
      mockList.push(await mockGetFailedTransaction(mockServer));
    }

    if (!isExecutedSwapScenario) {
      mockList.push(await mockGetSuccessSignaturesForAddress(mockServer));
    }
    mockList.push(await mockSolanaBalanceQuote({ mockServer, balance }));

    mockList.push(
      await mockGetMinimumBalanceForRentExemption(mockServer),
      await mockMultiCoinPrice(mockServer),
      await mockGetLatestBlockhash(mockServer),
      await mockGetFeeForMessage(mockServer),
      isSwapScenario
        ? await mockPriceApiSpotPriceSwap(mockServer)
        : await mockPriceApiSpotPrice(mockServer),
      await mockPriceApiExchangeRates(mockServer),
      await mockClientSideDetectionApi(mockServer),
      await mockPhishingDetectionApi(mockServer),
    );

    if (mockTokenAccountAccountInfo) {
      await mockGetTokenAccountInfo(mockServer);
    }

    mockList.push(
      await mockTokenApiMainnetTest(mockServer),
      await mockAccountsApi(mockServer),
      await mockGetMultipleAccounts(mockServer),
      await mockGetAccountInfoDevnet(mockServer),
    );

    if (mockSwapWithNoQuotes) {
      mockList.push(await mockBridgeGetTokens(mockServer));
      mockList.push(await mockBridgeSearchTokens(mockServer));
      mockList.push(await mockNoQuotesAvailable(mockServer));
    }
    if (mockSwapUSDtoSOL) {
      mockList.push(
        ...[
          await mockQuoteFromUSDCtoSOL(mockServer),
          await mockSendSwapSolanaTransaction(mockServer),
          await mockGetUSDCSOLTransaction(mockServer),
          await mockSecurityAlertSwap(mockServer),
          await mockGetSignaturesSuccessSwap(
            mockServer,
            USDC_TO_SOL_SWAP_SIGNATURE,
          ),
          await mockBridgeGetTokens(mockServer),
          await mockBridgeSearchTokens(mockServer),
        ],
      );
    }
    if (mockSwapSOLtoUSDC) {
      mockList.push(
        ...[
          await mockQuoteFromSoltoUSDC(mockServer),
          await mockSendSwapSolanaTransaction(
            mockServer,
            undefined,
            SOL_TO_USDC_SWAP_SIGNATURE,
          ),
          await mockGetSOLUSDCTransaction(mockServer),
          await mockSecurityAlertSwap(mockServer),
          await mockGetSignaturesSuccessSwap(
            mockServer,
            SOL_TO_USDC_SWAP_SIGNATURE,
          ),
          await mockBridgeGetTokens(mockServer),
          await mockBridgeSearchTokens(mockServer),
        ],
      );
    }

    if (withProtocolSnap) {
      mockList.push(await mockProtocolSnap(mockServer));
    }
    if (withCustomMocks) {
      const customMocksResult = await withCustomMocks(mockServer);
      if (customMocksResult) {
        if (Array.isArray(customMocksResult)) {
          mockList.push(...customMocksResult.filter((m) => m));
        } else {
          mockList.push(customMocksResult);
        }
      }
    }
    return mockList;
  };
}
