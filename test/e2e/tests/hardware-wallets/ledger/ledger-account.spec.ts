import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosFixtures,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import { SPECULOS_LEDGER_ADDRESSES } from '../../../speculos/constants';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import MultichainAccountDetailsPage from '../../../page-objects/pages/multichain/multichain-account-details-page';
import { login } from '../../../page-objects/flows/login.flow';
import { checkAccountAddressDisplayedInAccountList } from '../../../page-objects/flows/account-list.flow';

describe('Ledger Hardware Account Management @speculos', function (this: Suite) {
  this.timeout(120000);

  let shared: SharedSpeculosContext;

  before(async function () {
    this.timeout(120000);
    shared = await startSharedSpeculos();
  });

  after(async function () {
    this.timeout(30000);
    await stopSharedSpeculos(shared);
  });

  it('derives the correct accounts and unlocks the first account', async function () {
    await withSpeculosFixtures(
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

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.clickConnectLedgerButton();

        const selectLedgerAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectLedgerAccountPage.checkPageIsLoaded();

        await selectLedgerAccountPage.checkAccountNumber();
        for (const address of SPECULOS_LEDGER_ADDRESSES.slice(0, 4)) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          await selectLedgerAccountPage.checkAddressIsDisplayed(
            shortenedAddress,
          );
        }

        await selectLedgerAccountPage.selectAccount(1);
        await driver.delay(1000);
        await selectLedgerAccountPage.clickUnlockButton();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        await checkAccountAddressDisplayedInAccountList(driver, 'Ledger', 1);
      },
    );
  });

  it('unlocks multiple accounts at once and removes one', async function () {
    await withSpeculosFixtures(
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

        const connectHardwareWalletPage = new ConnectHardwareWalletPage(driver);
        await connectHardwareWalletPage.checkPageIsLoaded();
        await connectHardwareWalletPage.clickConnectLedgerButton();

        const selectLedgerAccountPage = new SelectHardwareWalletAccountPage(
          driver,
        );
        await selectLedgerAccountPage.checkPageIsLoaded();
        await selectLedgerAccountPage.checkAccountNumber();
        for (let i = 1; i <= 5; i++) {
          await selectLedgerAccountPage.selectAccount(i);
        }
        await selectLedgerAccountPage.clickUnlockButton();

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
        await headerNavbar.openAccountMenu();
        await checkAccountAddressDisplayedInAccountList(driver, 'Ledger', 5);

        await accountListPage.openMultichainAccountMenu({
          accountLabel: `Ledger Account 1`,
        });
        await accountListPage.clickMultichainAccountMenuItem('Account details');
        const accountDetailsPage = new MultichainAccountDetailsPage(driver);
        await accountDetailsPage.checkPageIsLoaded();
        await accountDetailsPage.clickRemoveAccountButton();
        await accountDetailsPage.clickRemoveAccountConfirmButton();
        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          `Ledger Account 1`,
        );
      },
    );
  });
});
