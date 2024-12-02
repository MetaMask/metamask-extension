import { Mockttp } from 'mockttp';
import { ACCOUNT_TYPE } from '../../constants';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { Driver } from '../../webdriver/driver';

const SOLANA_URL_REGEX =
  /^https:\/\/(solana-mainnet\.infura\.io|api\.devnet\.solana\.com)/u;
// const SOLANA_RPC_PROVIDER = 'https://api.devnet.solana.com/';
const SOLANA_PRICE_REGEX =
  /^https:\/\/price-api\.metamask-institutional\.io\/v2\/chains\/solana:/u;
const SOLANA_BITCOIN_MIN_API =
  /^https:\/\/min-api\.cryptocompare\.com\/data\/pricemulti/u;
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

export async function simulateSolanaTransaction(mockServer: Mockttp) {
  const response = {
    statusCode: 200,
    json: {
      result: {
        context: {
          slot: 218,
        },
        value: {
          // eslint-disable-next-line id-denylist
          err: null,
          accounts: null,
          logs: [
            'Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri invoke [1]',
            'Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri consumed 2366 of 1400000 compute units',
            'Program return: 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri KgAAAAAAAAA=',
            'Program 83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri success',
          ],
          returnData: {
            data: ['Kg==', 'base64'],
            programId: '83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri',
          },
          unitsConsumed: 2366,
        },
        id: 1337,
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
  const response = {
    statusCode: 200,
    json: {
      result: {
        slot: 98123569,
        meta: {
          err: null,
          fee: 5000,
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
    .withQuery({ method: 'getTransaction' })
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
              blockTime: 1734620122,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '5THAXC3pHCRwwwrMHR6PJiSqFfgSkZrBhn59C7YEbTMVbiAnjZhqpPvJYs4v5aRcqUiokunfbdTgo9HLfv6bogNR',
              slot: 348093552,
            },
            {
              blockTime: 1734619950,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '5KHuDsTMjre6rWU5Qkf8ugG31PjWoZ8NbV21ThY8RwcHpn3dKbTafdizUkEj4sU2AfrRzVxgyGkX8MLxK5nWHJ6J',
              slot: 348093088,
            },
            {
              blockTime: 1734619916,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '2RcW9iJCGnYuGVbDbaDi93t2f2347a6gzjoQf9idDdfFTjHsC7yMYcUvGqNzouKgA8T8tdYqjNUtDf4vR4e9iUoF',
              slot: 348092996,
            },
            {
              blockTime: 1734619899,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '2kCcoXZxe14384c8JTvq1g63pSjmmyuDnye9y3ReBMEiaZeGWspsmooEdC4RoyzP6uTfaDyFpCupBAKXnZwXCKMg',
              slot: 348092952,
            },
            {
              blockTime: 1734619885,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '4fzwGY4Tw5C4nYMaVAY7e3ZMwz691CbT7By4F4YFdukzBxd7yspmZEHhBtuPhFrqLj1yBn6zpc4kh1GLzgcovEbx',
              slot: 348092914,
            },
            {
              blockTime: 1734619758,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '2vgL59tfVa2VJkf7kmsGhbdBFjHdspLa1wfL72zZqHfJuzhmKfqS4YoLofpMTnZzzZfiA6712pwURheMUh5S2RXd',
              slot: 348092568,
            },
            {
              blockTime: 1734619697,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature:
                '32fqeHudeNBuDmyCrmRemFppVPpWmXwT4cbfai5D7G2Vzah1BvVguLqkNuk9Pdu4xVyBD32dhnSV8AN9k4qnffSB',
              slot: 348092404,
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

export async function mockSolanaRatesCall(mockServer: Mockttp) {
  return await mockServer.forGet(SOLANA_PRICE_REGEX).thenCallback(() => {
    const priceResponse = {
      id: 'wrapped-solana',
      price: 210.57,
      marketCap: 0,
      allTimeHigh: 263.68,
      allTimeLow: 8.11,
      totalVolume: 3141761864,
      high1d: 218.26,
      low1d: 200.85,
      circulatingSupply: 0,
      dilutedMarketCap: 124394527657,
      marketCapPercentChange1d: 0,
      priceChange1d: -7.68288033909846,
      pricePercentChange1h: 0.5794201955743261,
      pricePercentChange1d: -3.520101943578202,
      pricePercentChange7d: -8.192700158252544,
      pricePercentChange14d: -12.477367449577399,
      pricePercentChange30d: -14.588630064677465,
      pricePercentChange200d: 28.111509321033513,
      pricePercentChange1y: 181.48381055890258,
    };
    return {
      statusCode: 200,
      json: priceResponse,
    };
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

export async function withSolanaAccountSnap(
  {
    title,
    solanaSupportEnabled,
    showNativeTokenAsMainBalance,
    mockCalls,
    mockSendTransaction,
    importAccount,
  }: {
    title?: string;
    solanaSupportEnabled?: boolean;
    showNativeTokenAsMainBalance?: boolean;
    mockCalls?: boolean;
    mockSendTransaction?: boolean;
    importAccount?: boolean;
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
            await mockSolanaRatesCall(mockServer),
            await mockGetTransaction(mockServer),
            await simulateSolanaTransaction(mockServer),
            await mockGetTokenAccountsByOwner(mockServer),
            await mockGetSignaturesForAddress(mockServer),
            await mockMultiCoinPrice(mockServer),
            await mockGetLatestBlockhash(mockServer),
            await mockGetFeeForMessage(mockServer),
          ]);
        }
        if (mockSendTransaction) {
          mockList.push(await mockSendSolanaTransaction(mockServer));
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
