import {
  withFixtures,
  unlockWallet,
  convertETHToHexGwei,
  WINDOW_TITLES,
} from '../helpers';
import { createDappTransaction } from '../page-objects/flows/transaction';
import { sendRedesignedTransactionWithSnapAccount } from '../page-objects/flows/send-transaction.flow';
import FixtureBuilder from '../fixture-builder';
import {
  BUNDLER_URL,
  ENTRYPOINT,
  ERC_4337_ACCOUNT,
  ERC_4337_ACCOUNT_SALT,
  ERC_4337_ACCOUNT_SNAP_URL,
  LOCAL_NODE_ACCOUNT,
  LOCAL_NODE_PRIVATE_KEY,
  SIMPLE_ACCOUNT_FACTORY,
  VERIFYING_PAYMASTER,
} from '../constants';
import { Driver } from '../webdriver/driver';
import { Bundler } from '../bundler';
import { SWAP_TEST_ETH_USDC_TRADES_MOCK } from '../../data/mock-data';
import { Mockttp } from '../mock-e2e';
import { mockAccountAbstractionKeyringSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import {
  setupCompleteERC4337Environment,
  validateTransactionDetailsWithReceipt,
} from '../page-objects/flows/user-operations.flow';
import HomePage from '../page-objects/pages/home/homepage';
import ActivityListPage from '../page-objects/pages/home/activity-list';
import Confirmation from '../page-objects/pages/confirmations/redesign/confirmation';

async function mockSwapsTransactionQuote(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => ({
        statusCode: 200,
        json: SWAP_TEST_ETH_USDC_TRADES_MOCK,
      })),
  ];
}
async function mockSnapAndSwaps(mockServer: Mockttp) {
  return [
    await mockSwapsTransactionQuote(mockServer),
    await mockAccountAbstractionKeyringSnap(mockServer),
  ];
}

async function withAccountSnap(
  {
    title,
    paymaster,
    localNodeOptions,
  }: { title?: string; paymaster?: string; localNodeOptions?: object },
  testCallback: (driver: Driver, bundlerServer: Bundler) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder().build(),
      title,
      useBundler: true,
      usePaymaster: Boolean(paymaster),
      dapp: true,
      localNodeOptions: localNodeOptions || {
        hardfork: 'london',
        mnemonic:
          'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
      },
      testSpecificMock: mockSnapAndSwaps,
    },
    async ({
      driver,
      bundlerServer,
    }: {
      driver: Driver;
      bundlerServer: Bundler;
    }) => {
      await unlockWallet(driver);

      await setupCompleteERC4337Environment(
        driver,
        ERC_4337_ACCOUNT_SNAP_URL,
        {
          bundlerUrl: BUNDLER_URL,
          entrypoint: ENTRYPOINT,
          simpleAccountFactory: SIMPLE_ACCOUNT_FACTORY,
          paymaster,
        },
        {
          privateKey: LOCAL_NODE_PRIVATE_KEY,
          salt: ERC_4337_ACCOUNT_SALT,
        },
        ERC_4337_ACCOUNT,
      );

      await testCallback(driver, bundlerServer);
    },
  );
}

describe('User Operations', function () {
  it('from dApp transaction', async function () {
    await withAccountSnap({ title: this.test?.fullTitle() }, async (driver) => {
      await createDappTransaction(driver, {
        from: ERC_4337_ACCOUNT,
        to: LOCAL_NODE_ACCOUNT,
        value: convertETHToHexGwei(1),
        maxFeePerGas: '0x0',
        maxPriorityFeePerGas: '0x0',
      });

      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
      const confirmation = new Confirmation(driver);
      await confirmation.checkPageIsLoaded();
      await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
    });
  });

  // https://github.com/MetaMask/metamask-extension/issues/36567
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('from send transaction', async function () {
    await withAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, bundlerServer) => {
        await sendRedesignedTransactionWithSnapAccount({
          driver,
          recipientAddress: LOCAL_NODE_ACCOUNT,
          amount: '1',
          isSyncFlow: true,
        });

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.clickConfirmedTransaction();
        await validateTransactionDetailsWithReceipt(driver, bundlerServer);
      },
    );
  });

  // it.skip('from swap', async function () {
  //   await withAccountSnap(
  //     { title: this.test?.fullTitle() },
  //     async (driver, bundlerServer) => {
  //       await createSwap(driver);
  //       await driver.switchToWindowWithTitle(
  //         WINDOW_TITLES.ExtensionInFullScreenView,
  //       );
  //       const homePage = new HomePage(driver);
  //       await homePage.goToActivityList();
  //       const activityListPage = new ActivityListPage(driver);
  //       await activityListPage.clickConfirmedTransaction();
  //       await expectTransactionDetailsMatchReceipt(driver, bundlerServer);
  //     },
  //   );
  // });

  it('with paymaster', async function () {
    await withAccountSnap(
      {
        title: this.test?.fullTitle(),
        paymaster: VERIFYING_PAYMASTER,
        localNodeOptions: [
          {
            type: 'ganache',
            options: {
              hardfork: 'london',
              mnemonic:
                'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
            },
          },
        ],
      },
      async (driver, bundlerServer) => {
        await createDappTransaction(driver, {
          from: ERC_4337_ACCOUNT,
          to: LOCAL_NODE_ACCOUNT,
          value: convertETHToHexGwei(1),
          maxFeePerGas: '0x0',
          maxPriorityFeePerGas: '0x0',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.clickConfirmedTransaction();
        await validateTransactionDetailsWithReceipt(driver, bundlerServer);
      },
    );
  });
});
