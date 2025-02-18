import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import FixtureBuilder from '../../fixture-builder';
import { ACCOUNT_TYPE } from '../../constants';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

const SOLANA_URL_REGEX =
  /^https:\/\/(solana-mainnet\.infura\.io|api\.devnet\.solana\.com)/u;
const SOLANA_PRICE_API =
  /^https:\/\/price\.(uat-api|api)\.cx\.metamask\.io\/v3\/spot-prices/u;
const SOLANA_STATIC_TOKEN_IMAGE_REGEX =
  /^https:\/\/static\.cx\.metamask\.io\/api\/v2\/tokenIcons\//u;
const SOLANA_BITCOIN_MIN_API =
  /^https:\/\/min-api\.cryptocompare\.com\/data\/pricemulti/u;
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
          recentlyAdded: [],
          recentlyRemoved: [],
          lastFetchedAt: '2025-02-03T11:08:02Z',
        },
      };
    });
}

export async function mockPhishingDetectionApi(mockServer: Mockttp) {
  return await mockServer
    .forPost(METAMASK_PHISHING_DETECTION_API)
    .thenCallback(() => {
      return { statusCode: 200 };
    });
}

export async function mockPriceApi(mockServer: Mockttp) {
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
  return await mockServer.forGet(SOLANA_PRICE_API).thenCallback(() => {
    return response;
  });
}

export async function mockStaticMetamaskTokenIcon(mockServer: Mockttp) {
  return await mockServer
    .forGet(SOLANA_STATIC_TOKEN_IMAGE_REGEX)
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

export async function mockTokenApi(mockServer: Mockttp) {
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

export async function mockGetTransaction(mockServer: Mockttp) {
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
  console.log('AQUI ENTRA EN GET ACCOUNT INFO');
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
  }: {
    title?: string;
    solanaSupportEnabled?: boolean;
    showNativeTokenAsMainBalance?: boolean;
    mockCalls?: boolean;
    mockSendTransaction?: boolean;
    importAccount?: boolean;
    isNative?: boolean;
    simulateTransaction?: boolean;
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
        mockList.push(await mockPriceApi(mockServer));

        if (mockCalls) {
          mockList.push([
            await mockSolanaBalanceQuote(mockServer),
            // await mockGetTransaction(mockServer),
            await mockGetTokenAccountsByOwner(mockServer),
            await mockGetSignaturesForAddress(mockServer),
            await mockMultiCoinPrice(mockServer),
            await mockGetLatestBlockhash(mockServer),
            await mockGetFeeForMessage(mockServer),
            await mockGetTokenAccountInfo(mockServer),
            await mockGetAccountInfo(mockServer),
          ]);
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
