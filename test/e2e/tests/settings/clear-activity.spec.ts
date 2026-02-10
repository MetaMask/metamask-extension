import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import ActivityList from '../../page-objects/pages/home/activity-list';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';

const BASE_TX_MOCK = {
  blockNumber: 1,
  gas: 1,
  gasUsed: 1,
  gasPrice: '1',
  nonce: 1,
  methodId: null,
  value: '1000000000000000000',
  isError: false,
};

const RECEIVED_TX_MOCK = {
  ...BASE_TX_MOCK,
  hash: '0x1',
  timestamp: new Date(1234).toISOString(),
  chainId: 1337,
  from: '0x2',
  to: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
  valueTransfers: [
    {
      from: '0x2',
      to: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
      amount: '1000000000000000000',
      decimal: 18,
      symbol: 'ETH',
    },
  ],
  transactionType: 'INCOMING',
  readable: 'Received',
};

const SENT_TX_MOCK = {
  ...BASE_TX_MOCK,
  hash: '0x2',
  timestamp: new Date(1233).toISOString(),
  chainId: 1337,
  from: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
  to: '0x2',
  valueTransfers: [
    {
      from: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
      to: '0x2',
      amount: '1000000000000000000',
      decimal: 18,
      symbol: 'ETH',
    },
  ],
  transactionType: 'ERC_20_TRANSFER',
  readable: 'Sent',
};

async function mockAccountsApi(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(
        'https://accounts.api.cx.metamask.io/v4/multiaccount/transactions',
      )
      .once()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          data: [RECEIVED_TX_MOCK, SENT_TX_MOCK],
          pageInfo: { hasNextPage: false, count: 2 },
        },
      })),
  ];
}

describe('Clear account activity', function (this: Suite) {
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // When user get stuck with pending transactions, one can reset the account by clicking the 'Clear activity tab data' //
  // button in settings, advanced tab. This functionality will clear all the transactions history.                      //
  // Note that it only only affects the current network.                                                                //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it('User can clear account activity via the advanced setting tab, ', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
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
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        // Check send transaction and receive transaction history are all displayed
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityList = new ActivityList(driver);
        await activityList.checkTxAction({
          action: 'Received',
          confirmedTx: 2,
        });
        await activityList.checkTxAction({
          action: 'Sent',
          txIndex: 2,
          confirmedTx: 2,
        });

        // Clear activity and nonce data
        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettings = new AdvancedSettings(driver);
        await advancedSettings.checkPageIsLoaded();
        await advancedSettings.clearActivityTabData();
        await settingsPage.closeSettingsPage();

        await activityList.checkNoTxInActivity();
      },
    );
  });
});
