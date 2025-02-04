import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import FixtureBuilder from '../../fixture-builder';
import { ACCOUNT_TYPE } from '../../constants';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

const SOLANA_URL_REGEX = /.*/u;
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
  return await mockServer
    .forGet(SOLANA_PRICE_REGEX)
    .withQuery({ vsCurrency: 'usd' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
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
        },
      };
    });
}

export async function withSolanaAccountSnap(
  {
    title,
    solanaSupportEnabled,
    showNativeTokenAsMainBalance,
    mockCalls,
    mockSendTransaction,
  }: {
    title?: string;
    solanaSupportEnabled?: boolean;
    showNativeTokenAsMainBalance?: boolean;
    mockCalls?: boolean;
    mockSendTransaction?: boolean;
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
        if (mockCalls) {
          mockList.push([
            await mockSolanaBalanceQuote(mockServer),
            await mockSolanaRatesCall(mockServer),
            await mockGetSignaturesForAddress(mockServer),
            await mockMultiCoinPrice(mockServer),
            await mockGetLatestBlockhash(mockServer),
          ]);
        }
        if (mockSendTransaction) {
          mockList.push(await mockSendSolanaTransaction(mockServer));
        }
        return mockList;
      },
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      await loginWithBalanceValidation(driver);
      const headerComponen = new HeaderNavbar(driver);
      await headerComponen.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.addAccount({
        accountType: ACCOUNT_TYPE.Solana,
        accountName: 'Solana 1',
      });
      await test(driver, mockServer);
    },
  );
}
