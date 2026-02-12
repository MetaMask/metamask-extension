import { Mockttp } from 'mockttp';
import { TransactionType } from '@metamask/transaction-controller';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';

const TIMESTAMP_MOCK = 1234;

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
  timestamp: new Date(TIMESTAMP_MOCK - 1).toISOString(),
};

const RESPONSE_TOKEN_TRANSFER_MOCK = {
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

const RESPONSE_OUTGOING_MOCK = {
  ...RESPONSE_STANDARD_MOCK,
  from: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
  to: '0x2',
  methodId: '0x12345678',
  value: '4560000000000000000',
};

async function mockAccountsApi(
  mockServer: Mockttp,
  {
    cursor,
    transactions,
  }: { cursor?: string; transactions?: Record<string, unknown>[] } = {},
) {
  return [
    await mockServer
      .forGet(
        `https://accounts.api.cx.metamask.io/v1/accounts/${DEFAULT_FIXTURE_ACCOUNT.toLowerCase()}/transactions`,
      )
      .withQuery(cursor ? { cursor } : {})
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
          .withUseBasicFunctionalityEnabled()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockAccountsApi,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(2);

        await activityList.checkTxAction({
          action: 'Received',
          txIndex: 1,
          confirmedTx: 2,
        });
        await activityList.checkTxAmountInActivity('1.23 ETH', 1);

        await activityList.checkTxAction({
          action: 'Received',
          txIndex: 2,
          confirmedTx: 2,
        });
        await activityList.checkTxAmountInActivity('2.34 ETH', 2);
      },
    );
  });

  it('ignores token transfer transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityEnabled()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) =>
          mockAccountsApi(server, {
            transactions: [
              RESPONSE_STANDARD_MOCK,
              RESPONSE_TOKEN_TRANSFER_MOCK,
            ],
          }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activityList = await changeNetworkAndGoToActivity(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
      },
    );
  });

  it('adds outgoing transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityEnabled()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) =>
          mockAccountsApi(server, {
            transactions: [RESPONSE_STANDARD_MOCK, RESPONSE_OUTGOING_MOCK],
          }),
      },
      async ({ driver }: { driver: Driver }) => {
        const activityList = await changeNetworkAndGoToActivity(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(2);

        await activityList.checkTxAction({
          action: 'Contract interaction',
          txIndex: 2,
          confirmedTx: 2,
        });
        await activityList.checkTxAmountInActivity('-4.56 ETH', 2);
      },
    );
  });

  it('does nothing if preference disabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityDisabled()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockAccountsApi,
      },
      async ({ driver }: { driver: Driver }) => {
        const activityList = await changeNetworkAndGoToActivity(driver);
        await driver.delay(2000);
        await activityList.checkNoTxInActivity();
      },
    );
  });

  it('ignores duplicate transactions already in state', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityEnabled()
          .withTransactions([
            {
              hash: RESPONSE_STANDARD_MOCK.hash,
              txParams: { from: RESPONSE_STANDARD_MOCK.from },
              type: TransactionType.incoming,
            },
          ])
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockAccountsApi,
      },
      async ({ driver }: { driver: Driver }) => {
        const activityList = await changeNetworkAndGoToActivity(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
      },
    );
  });
});

async function changeNetworkAndGoToActivity(driver: Driver) {
  await loginWithoutBalanceValidation(driver);

  const homepage = new HomePage(driver);
  await homepage.goToActivityList();

  return new ActivityListPage(driver);
}
