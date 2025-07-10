import { Suite } from 'mocha';
import AccountListPage from '../../page-objects/pages/account-list-page';
import MultichainAccountDetailsPage from '../../page-objects/pages/multichain-account-details-page';
import { Driver } from '../../webdriver/driver';
import { withMultichainAccountsDesignEnabled } from './common';

const account1 = {
  name: 'Account 1',
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
};

const TEST_PRIVATE_KEY =
  '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

const importedAccount = {
  name: 'Account 3',
  address: '0x7A46ce51fbBB29C34aea1fE9833c27b5D2781925',
};

describe('Multichain Accounts - Account Details', function (this: Suite) {
  describe('Base screen', function () {
    it('displays account details page with all required elements', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.openAccountDetailsModal(account1.name);

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.checkPageIsLoaded();

          const headerName = await accountDetailsPage.getAccountName();
          if (headerName !== account1.name) {
            throw new Error(
              `Expected account name "${account1.name}" in header but got "${headerName}"`,
            );
          }

          const accountNameInRow =
            await accountDetailsPage.getAccountNameFromRow();
          if (!accountNameInRow.includes(account1.name)) {
            throw new Error(
              `Expected account name "${account1.name}" in row but got "${accountNameInRow}"`,
            );
          }

          const hasIcon = await accountDetailsPage.checkAccountIconPresent();
          if (!hasIcon) {
            throw new Error('Account icon should be present');
          }

          const address = await accountDetailsPage.getAccountAddress();
          if (
            !address.includes(account1.address.toLowerCase().substring(0, 6))
          ) {
            throw new Error(
              `Expected address to contain "${account1.address.toLowerCase().substring(0, 6)}" but got "${address}"`,
            );
          }

          const walletName = await accountDetailsPage.getWalletName();
          if (!walletName) {
            throw new Error(
              'Wallet row should be present and contain wallet name',
            );
          }
        },
      );
    });
  });

  describe('Rename', function () {
    it('renames account successfully', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.openAccountDetailsModal(account1.name);

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.checkPageIsLoaded();

          await accountDetailsPage.clickEditAccountNameButton();

          const newName = 'Updated Account Name';
          await accountDetailsPage.fillAccountNameInput(newName);

          await accountDetailsPage.clickSaveAccountNameButton();

          await accountDetailsPage.checkPageIsLoaded();

          const headerName = await accountDetailsPage.getAccountName();
          if (headerName !== newName) {
            throw new Error(
              `Expected account name "${newName}" in header but got "${headerName}"`,
            );
          }

          const rowName = await accountDetailsPage.getAccountNameFromRow();
          if (!rowName.includes(newName)) {
            throw new Error(
              `Expected account name "${newName}" in row but got "${rowName}"`,
            );
          }
        },
      );
    });
  });

  describe('View private key', function () {
    it('shows private key when requested', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.openAccountDetailsModal(account1.name);

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.checkPageIsLoaded();

          await accountDetailsPage.clickPrivateKeyRow();

          const privateKeyModal = await driver.findElement({
            css: 'h4',
            text: 'Show private key',
          });
          if (!privateKeyModal) {
            throw new Error('Private Key modal not found');
          }
        },
      );
    });
  });

  describe('Delete private key account', function () {
    it('removes imported private key account successfully', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.addNewImportedAccount(TEST_PRIVATE_KEY);
          await driver.clickElement('[data-testid="account-menu-icon"]');
          await accountListPage.openAccountDetailsModal(importedAccount.name);

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.checkPageIsLoaded();

          await accountDetailsPage.clickRemoveAccountButton();

          await accountDetailsPage.clickRemoveAccountConfirmButton();

          await driver.clickElement('[data-testid="account-menu-icon"]');
          await accountListPage.check_accountIsNotDisplayedInAccountList(
            importedAccount.name,
          );
        },
      );
    });
  });

  describe('Wallet property', function () {
    it('navigates to wallet details when wallet row is clicked', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.openAccountDetailsModal(account1.name);

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.checkPageIsLoaded();

          await accountDetailsPage.clickWalletRow();

          const walletDetailsHeader = await driver.findElement({
            css: 'h4',
            text: 'Wallet details',
          });
          if (!walletDetailsHeader) {
            throw new Error('Wallet details header not found');
          }
        },
      );
    });
  });

  describe('Share or show address', function () {
    it('shows share modal with QR code and checksummed address', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.openAccountDetailsModal(account1.name);

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.checkPageIsLoaded();

          await accountDetailsPage.clickAddressNavigationButton();

          await accountDetailsPage.checkQrCodeIsDisplayed();

          const modalAddress =
            await accountDetailsPage.getAddressFromShareModal();
          if (
            !modalAddress.includes(
              account1.address.toLowerCase().substring(0, 6),
            )
          ) {
            throw new Error(
              `Expected address to contain "${account1.address.toLowerCase().substring(0, 6)}" but got "${modalAddress}"`,
            );
          }
        },
      );
    });
  });

  describe('Copy address', function () {
    it('copies address to clipboard', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.openAccountDetailsModal(account1.name);

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.checkPageIsLoaded();
          await driver.setClipboardPermission();

          await accountDetailsPage.clickAddressNavigationButton();

          await accountDetailsPage.clickCopyAddressButton();

          const copiedAddress = (await driver.executeScript(
            'return navigator.clipboard.readText()',
          )) as string;

          if (copiedAddress !== account1.address) {
            throw new Error(
              `Expected address "${account1.address}" in clipboard but got "${copiedAddress}"`,
            );
          }
        },
      );
    });
  });

  describe('View on etherscan', function () {
    it('navigates to etherscan when view on etherscan is clicked', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.openAccountDetailsModal(account1.name);

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.checkPageIsLoaded();

          await accountDetailsPage.clickAddressNavigationButton();

          const originalTab = await driver.driver.getWindowHandle();
          await accountDetailsPage.clickViewOnEtherscanButton();

          const tabs = await driver.getAllWindowHandles();
          const newTab = tabs.find((tab) => tab !== originalTab);

          if (!newTab) {
            throw new Error('New tab not found');
          }

          await driver.switchToWindow(newTab);

          const newTabUrl = await driver.getCurrentUrl();
          if (!newTabUrl.includes('etherscan.io')) {
            throw new Error(
              `Expected new tab URL to include "etherscan.io" but got "${newTabUrl}"`,
            );
          }

          await driver.driver.close();
          await driver.switchToWindow(originalTab);
        },
      );
    });
  });
});
