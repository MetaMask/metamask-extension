import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosFixtures,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import { WINDOW_TITLES } from '../../../constants';
import { cleanupSpeculosEnvironment } from '../../../speculos/cleanup';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import { sendRedesignedTransactionToAddress } from '../../../page-objects/flows/send-transaction.flow';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import type { SpeculosClient } from '../../../speculos/client';
import type { ApduBridge } from '../../../speculos/apdu-bridge';

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

async function approveLedgerAfterSigningApdu(
  speculosClient: SpeculosClient,
  apduBridge: ApduBridge,
  rightPresses: number,
) {
  await apduBridge.waitForSigningApduAndApprove(
    speculosClient,
    rightPresses,
    30000,
  );
}

describe('Ledger Hardware - Speculos Integration @speculos', function () {
  this.timeout(120000);

  let shared: SharedSpeculosContext;

  before(async function () {
    this.timeout(120000);
    await cleanupSpeculosEnvironment();
    shared = await startSharedSpeculos();
  });

  after(async function () {
    this.timeout(60000);
    try {
      await stopSharedSpeculos(shared);
    } finally {
      await cleanupSpeculosEnvironment();
    }
  });

  it('connects to a Ledger device with manual approval', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
      },
      async ({ driver, speculosClient }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectPage = new ConnectHardwareWalletPage(driver);
        await connectPage.checkPageIsLoaded();
        await connectPage.clickConnectLedgerButton();

        const selectPage = new SelectHardwareWalletAccountPage(driver);
        await selectPage.checkPageIsLoaded();

        await speculosClient.pressButton('both');
        await selectPage.unlockAccount(1);

        await headerNavbar.openAccountMenu();
        await accountListPage.checkAccountDisplayedInAccountList(
          'Ledger Account 1',
        );
      },
    );
  });

  it('connects and unlocks a Ledger account with manual approval', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
      },
      async ({ driver, speculosClient }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectPage = new ConnectHardwareWalletPage(driver);
        await connectPage.checkPageIsLoaded();
        await connectPage.clickConnectLedgerButton();

        const selectPage = new SelectHardwareWalletAccountPage(driver);
        await selectPage.checkPageIsLoaded();
        await speculosClient.pressButton('both');
        await selectPage.unlockAccount(1);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
      },
    );
  });

  // TODO: The Ethereum NanoSP app auto-approves GET_PUBLIC_KEY, so the device
  // cannot reject the connection request. The reject flow needs to target an
  // operation that requires user approval (e.g., signing). Re-enable when we
  // have a way to force GET_PUBLIC_KEY approval on Speculos.
  it.skip('rejects connection on the Ledger device', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
      },
      async ({ driver, speculosClient }) => {
        await login(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.openConnectHardwareWalletModal();

        const connectPage = new ConnectHardwareWalletPage(driver);
        await connectPage.checkPageIsLoaded();
        await connectPage.clickConnectLedgerButton();

        const selectPage = new SelectHardwareWalletAccountPage(driver);
        await selectPage.checkPageIsLoaded();

        await new Promise((r) => setTimeout(r, 2000));
        await speculosClient.pressButton('right');
        await new Promise((r) => setTimeout(r, 300));
        await speculosClient.pressButton('both');

        await connectPage.checkPageIsLoaded();
      },
    );
  });

  it('sends ETH from a Ledger account', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2().withSpeculosLedgerAccount().build(),
        localNodeOptions: {
          hardfork: 'london',
        },
        title: this.test?.fullTitle(),
        sharedContext: shared,
        seedBalances: [
          {
            address: SPECULOS_LEDGER_ADDRESS,
            balance: '0x100000000000000000000',
          },
        ],
      },
      async ({ driver, speculosClient, apduBridge }) => {
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed('1.21M');

        const ledgerDone = approveLedgerAfterSigningApdu(
          speculosClient,
          apduBridge,
          6,
        );
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '1',
        });
        await ledgerDone;

        await homePage.checkPageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
        await activityList.checkTxAmountInActivity();
      },
    );
  });

  it('personal sign', async function () {
    await withSpeculosFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: SPECULOS_LEDGER_ADDRESS,
          })
          .build(),
        title: this.test?.fullTitle(),
        sharedContext: shared,
      },
      async ({ driver, speculosClient, apduBridge }) => {
        await login(driver, { validateBalance: false });

        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.checkPageIsLoaded();
        await testDappPage.personalSign();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new Confirmation(driver);

        const ledgerDone = approveLedgerAfterSigningApdu(
          speculosClient,
          apduBridge,
          2,
        );
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await ledgerDone;

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.checkSuccessPersonalSign(SPECULOS_LEDGER_ADDRESS);
      },
    );
  });
});
