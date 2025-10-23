import { withFixtures, WALLET_PASSWORD } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AccountDetailsModal from '../../page-objects/pages/dialog/account-details-modal';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import MultichainAccountDetailsPage from '../../page-objects/pages/multichain/multichain-account-details-page';
import PrivateKeyModal from '../../page-objects/pages/multichain/private-key-modal';
import {
  withImportedAccount,
  withMultichainAccountsDesignEnabled,
} from './common';

const TEST_PRIVATE_KEY =
  '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

const importedAccount = {
  name: 'Imported Account 1',
  address: '0x7A46ce51fbBB29C34aea1fE9833c27b5D2781925',
};

describe('Show account details', function () {
  it('should show the correct private key from account menu', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });
        await accountListPage.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
        await accountListPage.clickMultichainAccountMenuItem('Account details');

        const accountDetailsPage = new MultichainAccountDetailsPage(driver);
        await accountDetailsPage.clickPrivateKeyRow();

        const privateKeyModal = new PrivateKeyModal(driver);
        await privateKeyModal.checkPageIsLoaded();
        await privateKeyModal.typePassword(WALLET_PASSWORD);
        await privateKeyModal.clickConfirm();
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.clickCopyPrivateKeyButton();
        await accountDetailsModal.checkAddressIsCopied();
      },
    );
  });

  it('should show the correct private key from global menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        forceBip44Version: 2,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountDetailsModal();
        const accountDetailsPage = new MultichainAccountDetailsPage(driver);
        await accountDetailsPage.clickPrivateKeyRow();
        const privateKeyModal = new PrivateKeyModal(driver);
        await privateKeyModal.checkPageIsLoaded();
        await privateKeyModal.typePassword(WALLET_PASSWORD);
        await privateKeyModal.clickConfirm();
        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.clickCopyPrivateKeyButton();
        await accountDetailsModal.checkAddressIsCopied();
      },
    );
  });

  it('removes imported private key account successfully', async function () {
    await withImportedAccount(
      {
        title: this.test?.fullTitle(),
        privateKey: TEST_PRIVATE_KEY,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });
        await accountListPage.openMultichainAccountMenu({
          accountLabel: importedAccount.name,
        });
        await accountListPage.clickMultichainAccountMenuItem('Account details');

        const accountDetailsPage = new MultichainAccountDetailsPage(driver);
        await accountDetailsPage.checkPageIsLoaded();

        await accountDetailsPage.clickRemoveAccountButton();

        await accountDetailsPage.clickRemoveAccountConfirmButton();

        await accountListPage.checkAccountIsNotDisplayedInAccountList(
          importedAccount.name,
        );
      },
    );
  });
});
