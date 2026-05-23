import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosFixtures,
  withSpeculosAutoApprove,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';
import { WINDOW_TITLES } from '../../../constants';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import HardwareWalletErrorModalPage from '../../../page-objects/pages/hardware-wallet/hardware-wallet-error-modal-page';
import TestDappPage from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import { sendRedesignedTransactionToAddress } from '../../../page-objects/flows/send-transaction.flow';

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

const LEDGER_SEED_BALANCE = [
  { address: SPECULOS_LEDGER_ADDRESS, balance: '0x100000000000000000000' },
];

describe('Ledger Hardware Wallet Happy & Unhappy Paths @speculos', function (this: Suite) {
  this.timeout(180000);

  let shared: SharedSpeculosContext;

  before(async function () {
    this.timeout(120000);
    shared = await startSharedSpeculos();
  });

  after(async function () {
    this.timeout(30000);
    await stopSharedSpeculos(shared);
  });

  describe('Happy Path', function () {
    it('connects a Ledger device and unlocks an account', async function () {
      await withSpeculosAutoApprove(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          sharedContext: shared,
        },
        async ({ driver }) => {
          await login(driver);

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
          await accountListPage.openConnectHardwareWalletModal();

          const connectPage = new ConnectHardwareWalletPage(driver);
          await connectPage.checkPageIsLoaded();
          await connectPage.clickConnectLedgerButton();
          await connectPage.clickContinueButton(30000);

          const selectPage = new SelectHardwareWalletAccountPage(driver);
          await selectPage.checkPageIsLoaded();
          await selectPage.unlockAccount(1);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await headerNavbar.openAccountMenu();
          await accountListPage.checkAccountDisplayedInAccountList(
            'Ledger Account 1',
          );
        },
      );
    });

    it('sends ETH from a Ledger account', async function () {
      await withSpeculosAutoApprove(
        {
          fixtures: new FixtureBuilderV2().withLedgerAccount().build(),
          localNodeOptions: { hardfork: 'london' },
          title: this.test?.fullTitle(),
          sharedContext: shared,
          seedBalances: LEDGER_SEED_BALANCE,
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });
          await switchToHardwareAccount(driver, 'Ledger 1');

          await sendRedesignedTransactionToAddress({
            driver,
            recipientAddress: RECIPIENT,
            amount: '1',
          });

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const activityList = new ActivityListPage(driver);
          await activityList.checkConfirmedTxNumberDisplayedInActivity();
          await activityList.checkTxAmountInActivity();
        },
      );
    });

    it('signs a personal message from a Ledger account', async function () {
      await withSpeculosAutoApprove(
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
        async ({ driver }) => {
          await login(driver, { validateBalance: false });

          const testDappPage = new TestDappPage(driver);
          await testDappPage.openTestDappPage();
          await testDappPage.checkPageIsLoaded();
          await testDappPage.personalSign();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const confirmation = new Confirmation(driver);
          await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDappPage.checkSuccessPersonalSign(SPECULOS_LEDGER_ADDRESS);
        },
      );
    });

    it('deploys a contract from a Ledger account', async function () {
      await withSpeculosAutoApprove(
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
          seedBalances: LEDGER_SEED_BALANCE,
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });
          await switchToHardwareAccount(driver, 'Ledger 1');

          const testDappPage = new TestDappPage(driver);
          await testDappPage.openTestDappPage();
          await testDappPage.checkPageIsLoaded();
          await testDappPage.clickERC20CreateTokenButton();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new TransactionConfirmation(driver);
          await txConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDappPage.checkTokenAddressesValue(
            '0xcB17707e0623251182A654BEdaE16429C78A7424',
          );
        },
      );
    });
  });

  describe('Unhappy Path', function () {
    it('rejects a connection request on the Ledger device', async function () {
      await withSpeculosFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          sharedContext: shared,
        },
        async ({ driver, automation }) => {
          await login(driver);

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
          await accountListPage.openConnectHardwareWalletModal();

          const connectPage = new ConnectHardwareWalletPage(driver);
          await connectPage.checkPageIsLoaded();
          await connectPage.clickConnectLedgerButton();
          await connectPage.clickContinueButton(30000);

          const selectPage = new SelectHardwareWalletAccountPage(driver);
          await selectPage.checkPageIsLoaded();

          await automation.reject();

          await connectPage.checkPageIsLoaded();
        },
      );
    });

    it('rejects a personal sign request on the Ledger device', async function () {
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
        async ({ driver, automation }) => {
          await login(driver, { validateBalance: false });

          const testDappPage = new TestDappPage(driver);
          await testDappPage.openTestDappPage();
          await testDappPage.checkPageIsLoaded();
          await testDappPage.personalSign();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const confirmation = new Confirmation(driver);
          await confirmation.checkPageIsLoaded();

          await automation.reject();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        },
      );
    });

    it('rejects a transaction on the Ledger device', async function () {
      await withSpeculosFixtures(
        {
          fixtures: new FixtureBuilderV2().withLedgerAccount().build(),
          localNodeOptions: { hardfork: 'london' },
          title: this.test?.fullTitle(),
          sharedContext: shared,
          seedBalances: LEDGER_SEED_BALANCE,
        },
        async ({ driver, automation }) => {
          await login(driver, { validateBalance: false });
          await switchToHardwareAccount(driver, 'Ledger 1');

          await sendRedesignedTransactionToAddress({
            driver,
            recipientAddress: RECIPIENT,
            amount: '1',
          });

          await automation.reject();
        },
      );
    });

    it('shows reconnect button in confirmation footer when device is disconnected', async function () {
      await withSpeculosAutoApprove(
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
          seedBalances: LEDGER_SEED_BALANCE,
        },
        async ({ driver, apduBridge }) => {
          await login(driver, { validateBalance: false });
          await switchToHardwareAccount(driver, 'Ledger 1');

          await apduBridge.stop();
          console.log('[Test] APDU bridge stopped to simulate disconnect');

          const testDappPage = new TestDappPage(driver);
          await testDappPage.openTestDappPage();
          await testDappPage.checkPageIsLoaded();
          await testDappPage.clickERC20CreateTokenButton();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const reconnectPresent = await driver.isElementPresent({
            css: '[data-testid="reconnect-hardware-wallet-button"]',
          });

          await apduBridge.start();
          console.log('[Test] APDU bridge restarted');

          if (!reconnectPresent) {
            throw new Error(
              'Expected reconnect-hardware-wallet-button to be present',
            );
          }
        },
      );
    });

    it('recovers after device reconnect', async function () {
      await withSpeculosAutoApprove(
        {
          fixtures: new FixtureBuilderV2().withLedgerAccount().build(),
          localNodeOptions: { hardfork: 'london' },
          title: this.test?.fullTitle(),
          sharedContext: shared,
          seedBalances: LEDGER_SEED_BALANCE,
        },
        async ({ driver, apduBridge }) => {
          await login(driver, { validateBalance: false });
          await switchToHardwareAccount(driver, 'Ledger 1');

          await apduBridge.stop();
          console.log('[Test] APDU bridge stopped to simulate disconnect');

          try {
            await sendRedesignedTransactionToAddress({
              driver,
              recipientAddress: RECIPIENT,
              amount: '1',
            });
          } catch {
            // Expected - transaction should fail while disconnected
          }

          await apduBridge.start();
          console.log('[Test] APDU bridge restarted for recovery');

          await sendRedesignedTransactionToAddress({
            driver,
            recipientAddress: RECIPIENT,
            amount: '1',
          });

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const activityList = new ActivityListPage(driver);
          await activityList.checkConfirmedTxNumberDisplayedInActivity();
        },
      );
    });

    it('forgets device and confirms removal from account list', async function () {
      await withSpeculosAutoApprove(
        {
          fixtures: new FixtureBuilderV2().withLedgerAccount().build(),
          title: this.test?.fullTitle(),
          sharedContext: shared,
        },
        async ({ driver }) => {
          await login(driver, { validateBalance: false });

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
          await accountListPage.openConnectHardwareWalletModal();

          const connectPage = new ConnectHardwareWalletPage(driver);
          await connectPage.checkPageIsLoaded();
          await connectPage.clickConnectLedgerButton();
          await connectPage.clickContinueButton();

          const selectPage = new SelectHardwareWalletAccountPage(driver);
          await selectPage.checkPageIsLoaded();
          await selectPage.clickForgetDeviceButton();

          await connectPage.checkPageIsLoaded();
          await connectPage.clickCloseButton();

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await headerNavbar.openAccountMenu();
          await accountListPage.checkPageIsLoaded();
          await accountListPage.checkAccountIsNotDisplayedInAccountList(
            'Ledger Account 1',
          );
        },
      );
    });
  });
});
