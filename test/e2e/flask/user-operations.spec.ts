import {
  BUNDLER_URL,
  DAPP_PATH,
  ENTRYPOINT,
  ERC_4337_ACCOUNT,
  ERC_4337_ACCOUNT_SALT,
  LOCAL_NODE_ACCOUNT,
  LOCAL_NODE_PRIVATE_KEY,
  SIMPLE_ACCOUNT_FACTORY,
  VERIFYING_PAYMASTER,
  WINDOW_TITLES,
} from '../constants';
import { withFixtures, convertETHToHexGwei } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { Driver } from '../webdriver/driver';
import { Bundler } from '../bundler';
import { SWAP_TEST_ETH_USDC_TRADES_MOCK } from '../../data/mock-data';
import { Mockttp } from '../mock-e2e';
import TestDapp from '../page-objects/pages/test-dapp';
import TestDappIndividualRequest from '../page-objects/pages/test-dapp-individual-request';
import SnapAccountAbstractionKeyringPage from '../page-objects/pages/snap-account-abstraction-keyring-page';
import ActivityTab from '../page-objects/pages/home/activity-tab';
import TransactionConfirmation from '../page-objects/pages/confirmations/transaction-confirmation';
import { mockSnapAccountAbstractionKeyRingAndSite } from '../mock-response-data/snaps/snap-local-sites/account-abstraction-keyring-site-mocks';
import { createInternalTransaction } from '../page-objects/flows/transaction.flow';
import { installAccountAbstractionSnap } from '../page-objects/flows/snap-account-abstraction.flow';
import { login } from '../page-objects/flows/login.flow';
import { connectAccountToTestDapp } from '../page-objects/flows/test-dapp.flow';

enum TransactionDetailRowIndex {
  Nonce = 0,
  GasUsed = 3,
}

async function confirmTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const transactionConfirmation = new TransactionConfirmation(driver);
  await transactionConfirmation.clickFooterConfirmButton();
}

async function expectTransactionDetailsMatchReceipt(
  driver: Driver,
  bundlerServer: Bundler,
) {
  const hexToDecimalString = (hex: string) => String(parseInt(hex, 16));

  const userOperationHash = bundlerServer.getUserOperationHashes()[0];

  if (!userOperationHash) {
    throw new Error('No user operation hash found');
  }

  const receipt =
    await bundlerServer.getUserOperationReceipt(userOperationHash);

  if (!receipt) {
    throw new Error('No user operation receipt found');
  }

  const activityTab = new ActivityTab(driver);

  await activityTab.checkTransactionBreakdownRowValue(
    TransactionDetailRowIndex.Nonce,
    hexToDecimalString(receipt.nonce),
  );

  await activityTab.checkTransactionBreakdownRowValue(
    TransactionDetailRowIndex.GasUsed,
    hexToDecimalString(receipt.actualGasUsed),
  );
}

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
    ...(await mockSnapAccountAbstractionKeyRingAndSite(mockServer, 8081)),
    await mockSwapsTransactionQuote(mockServer),
  ];
}

async function openConfirmedTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  const activityTab = new ActivityTab(driver);
  await activityTab.goToActivityList();
  await activityTab.clickConfirmedTransaction();
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
      fixtures: new FixtureBuilderV2()
        .withSnapsPrivacyWarningAlreadyShown()
        .build(),
      title,
      useBundler: true,
      usePaymaster: Boolean(paymaster),
      dappOptions: {
        numberOfTestDapps: 1,
        customDappPaths: [
          DAPP_PATH.SNAP_ACCOUNT_ABSTRACTION_KEYRING,
          DAPP_PATH.TEST_SNAPS,
        ],
      },
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
      await login(driver, { validateBalance: false });

      await installAccountAbstractionSnap(driver);

      const snapAccountAbstractionKeyringPage =
        new SnapAccountAbstractionKeyringPage(driver);
      await snapAccountAbstractionKeyringPage.setChainConfig({
        bundlerUrl: BUNDLER_URL,
        entrypoint: ENTRYPOINT,
        simpleAccountFactory: SIMPLE_ACCOUNT_FACTORY,
        paymaster,
      });
      await snapAccountAbstractionKeyringPage.createAccount(
        LOCAL_NODE_PRIVATE_KEY,
        ERC_4337_ACCOUNT_SALT,
      );

      const testDapp = new TestDapp(driver);
      await testDapp.openTestDappPage();
      await connectAccountToTestDapp(driver, {
        publicAddress: ERC_4337_ACCOUNT,
      });

      await driver.switchToWindowWithTitle(
        WINDOW_TITLES.ExtensionInFullScreenView,
      );

      await testCallback(driver, bundlerServer);
    },
  );
}

async function sendDappTransaction(driver: Driver) {
  const testDappIndividualRequest = new TestDappIndividualRequest(driver);
  await testDappIndividualRequest.request('eth_sendTransaction', [
    {
      from: ERC_4337_ACCOUNT,
      to: LOCAL_NODE_ACCOUNT,
      value: convertETHToHexGwei(1),
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
    },
  ]);
}

// Bug #37823 (CLOSED Jan 2026): BIP44 confirmation crash was fixed.
// TODO: Unskip -- #37823 is resolved, verify tests pass and remove describe.skip
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('User Operations', function () {
  it('from dApp transaction', async function () {
    await withAccountSnap({ title: this.test?.fullTitle() }, async (driver) => {
      await sendDappTransaction(driver);
      await confirmTransaction(driver);
    });
  });

  // Issue #36567 (OPEN): Test depends on old confirmation flow and needs rewriting.
  // TODO: #36567 (open) -- rewrite to use new confirmation flow
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('from send transaction', async function () {
    await withAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver, bundlerServer) => {
        await createInternalTransaction({
          driver,
          recipientAddress: LOCAL_NODE_ACCOUNT,
          amount: '1',
        });

        await openConfirmedTransaction(driver);
        await expectTransactionDetailsMatchReceipt(driver, bundlerServer);
      },
    );
  });

  // TODO: Implement swap test for ERC-4337 user operations
  // it.skip('from swap', async function () {
  //   await withAccountSnap(
  //     { title: this.test?.fullTitle() },
  //     async (driver, bundlerServer) => {
  //       await createSwap(driver);
  //       await openConfirmedTransaction(driver);
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
            type: 'anvil',
            options: {
              hardfork: 'london',
              mnemonic:
                'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent',
            },
          },
        ],
      },
      async (driver, bundlerServer) => {
        await sendDappTransaction(driver);
        await confirmTransaction(driver);
        await openConfirmedTransaction(driver);
        await expectTransactionDetailsMatchReceipt(driver, bundlerServer);
      },
    );
  });
});
