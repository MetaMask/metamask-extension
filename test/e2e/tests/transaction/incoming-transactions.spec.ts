import { Mockttp } from 'mockttp';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import { Driver } from '../../webdriver/driver';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';

const PAST_DURATION_MOCK = 1000 * 60 * 60 * 24; // 1 Day
const TIMESTAMP_MOCK = Date.now() - PAST_DURATION_MOCK;
const LAST_FETCHED_TIMESTAMP_MOCK = 123;

const RESPONSE_STANDARD_MOCK = {
  hash: '0x1',
  timestamp: new Date(TIMESTAMP_MOCK).toISOString(),
  chainId: 1,
  blockNumber: 1,
  blockHash: '0x2',
  gas: 1,
  gasUsed: 1,
  gasPrice: '1',
  effectiveGasPrice: '1',
  nonce: 1,
  cumulativeGasUsed: 1,
  methodId: null,
  value: '1230000000000000000',
  to: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
  from: '0x2',
  isError: false,
  valueTransfers: [],
};

const RESPONSE_STANDARD_2_MOCK = {
  ...RESPONSE_STANDARD_MOCK,
  hash: '0x2',
  value: '2340000000000000000',
};

const RESPONSE_TOKEN_MOCK = {
  ...RESPONSE_STANDARD_MOCK,
  to: '0x2',
  valueTransfers: [
    {
      contractAddress: '0x123',
      decimal: 18,
      symbol: 'ABC',
      from: '0x2',
      to: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
      amount: '4560000000000000000',
    },
  ],
};

const RESPONSE_LAST_FETCHED_MOCK = {
  ...RESPONSE_STANDARD_MOCK,
  timeStamp: new Date((LAST_FETCHED_TIMESTAMP_MOCK + 1) * 1000).toISOString(),
};

async function mockAccountsApi(
  mockServer: Mockttp,
  {
    transactions,
    startTimestamp,
  }: { transactions?: any[]; startTimestamp?: number } = {},
) {
  return [
    await mockServer
      .forGet(/https:\/\/accounts.api.cx.metamask.io\/v1\/accounts\//)
      .withQuery(startTimestamp ? { startTimestamp } : {})
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          data: transactions ?? [
            RESPONSE_STANDARD_MOCK,
            RESPONSE_STANDARD_2_MOCK,
          ],
          pageInfo: { hasNextPage: false },
        },
      })),
  ];
}

describe('Incoming Transactions', function () {
  it('adds standard incoming transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withIncomingTransactionsPreferences({
            [CHAIN_IDS.MAINNET]: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockAccountsApi,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();
        await homepage.check_confirmedTxNumberDisplayedInActivity(2);

        await homepage.check_txAction('Receive', 1);
        await homepage.check_txAmountInActivity('1.23 ETH', 1);

        await homepage.check_txAction('Receive', 2);
        await homepage.check_txAmountInActivity('2.34 ETH', 2);
      },
    );
  });

  it('adds token transfer incoming transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withIncomingTransactionsPreferences({
            [CHAIN_IDS.MAINNET]: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) =>
          mockAccountsApi(server, { transactions: [RESPONSE_TOKEN_MOCK] }),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();
        await homepage.check_confirmedTxNumberDisplayedInActivity(1);

        await homepage.check_txAction('Receive', 1);
        await homepage.check_txAmountInActivity('4.56 ETH', 1);
      },
    );
  });

  it('queries transactions using saved timestamp', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withIncomingTransactionsPreferences({
            [CHAIN_IDS.MAINNET]: true,
          })
          .withIncomingTransactionsLastFetchedTimestamps({
            [`${CHAIN_IDS.MAINNET}#${DEFAULT_FIXTURE_ACCOUNT.toLowerCase()}`]:
              LAST_FETCHED_TIMESTAMP_MOCK,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) =>
          mockAccountsApi(server, {
            startTimestamp: LAST_FETCHED_TIMESTAMP_MOCK + 1,
            transactions: [RESPONSE_LAST_FETCHED_MOCK],
          }),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();
        await homepage.check_confirmedTxNumberDisplayedInActivity(1);

        await homepage.check_txAction('Receive', 1);
        await homepage.check_txAmountInActivity('1.23 ETH', 1);
      },
    );
  });
});
