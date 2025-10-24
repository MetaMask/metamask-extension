import { Suite } from 'mocha';
import { WALLET_PASSWORD } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AccountAddressModal from '../../page-objects/pages/multichain/account-address-modal';
import AddressListModal from '../../page-objects/pages/multichain/address-list-modal';
import PrivateKeyModal from '../../page-objects/pages/multichain/private-key-modal';
import MultichainAccountDetailsPage from '../../page-objects/pages/multichain/multichain-account-details-page';
import MultichainWalletDetailsPage from '../../page-objects/pages/multichain/multichain-wallet-details-page';
import { Driver } from '../../webdriver/driver';
import {
  withImportedAccount,
  withMultichainAccountsDesignEnabled,
} from './common';

const account1 = {
  name: 'Account 1',
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
};

const TEST_PRIVATE_KEY =
  '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

const importedAccount = {
  name: 'Imported Account 1',
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
          await accountListPage.checkPageIsLoaded({
            isMultichainAccountsState2Enabled: true,
          });
          await accountListPage.openMultichainAccountMenu({
            accountLabel: account1.name,
          });
          await accountListPage.clickMultichainAccountMenuItem(
            'Account details',
          );

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

          await accountDetailsPage.clickNetworksRow();
          const addressListModal = new AddressListModal(driver);

          const visibleNetworks = ['Ethereum', 'Linea', 'Base'];
          for (const networkName of visibleNetworks) {
            await addressListModal.checkNetworkNameisDisplayed(networkName);
          }

          await addressListModal.clickQRbutton();
          const accountAddressModal = new AccountAddressModal(driver);
          await accountAddressModal.checkPageIsLoaded();
          const address = await accountAddressModal.getAccountAddress();
          if (address.toUpperCase() !== account1.address.toUpperCase()) {
            throw new Error(
              `Expected account address "${account1.address}" but got "${address}"`,
            );
          }

          await accountAddressModal.goBack();
          await addressListModal.goBack();

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
          state: 2,
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded({
            isMultichainAccountsState2Enabled: true,
          });
          await accountListPage.openMultichainAccountMenu({
            accountLabel: account1.name,
          });
          await accountListPage.clickMultichainAccountMenuItem('Rename');
          const accountDetailsPage = new MultichainAccountDetailsPage(driver);

          const newName = 'Updated Account Name';
          await accountDetailsPage.fillAccountNameInput(newName);

          await accountDetailsPage.clickConfirmAccountNameButton();

          await accountListPage.checkPageIsLoaded({
            isMultichainAccountsState2Enabled: true,
          });

          await accountListPage.checkAccountNameIsDisplayed(newName);
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
          await accountListPage.checkPageIsLoaded({
            isMultichainAccountsState2Enabled: true,
          });
          await accountListPage.openMultichainAccountMenu({
            accountLabel: account1.name,
          });
          await accountListPage.clickMultichainAccountMenuItem(
            'Account details',
          );

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.clickPrivateKeyRow();

          const privateKeyModal = new PrivateKeyModal(driver);
          await privateKeyModal.checkPageIsLoaded();
          await privateKeyModal.typePassword(WALLET_PASSWORD);
          await privateKeyModal.clickConfirm();
        },
      );
    });
  });

  describe('Delete private key account', function () {
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
          await accountListPage.clickMultichainAccountMenuItem(
            'Account details',
          );

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

  describe('Wallet property', function () {
    it('navigates to wallet details when wallet row is clicked', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
          state: 2,
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded({
            isMultichainAccountsState2Enabled: true,
          });
          await accountListPage.openMultichainAccountMenu({
            accountLabel: account1.name,
          });
          await accountListPage.clickMultichainAccountMenuItem(
            'Account details',
          );

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.clickWalletRow();

          const walletDetailsPage = new MultichainWalletDetailsPage(driver);
          await walletDetailsPage.checkPageIsLoaded('Wallet 1');
        },
      );
    });
  });

  describe('Share or show address', function () {
    it('shows share modal with QR code and checksummed address', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
          state: 2,
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded({
            isMultichainAccountsState2Enabled: true,
          });
          await accountListPage.openMultichainAccountMenu({
            accountLabel: account1.name,
          });
          await accountListPage.clickMultichainAccountMenuItem('Addresses');

          const addressListModal = new AddressListModal(driver);
          await addressListModal.clickQRbutton();
          await driver.delay(1000);

          const accountAddressModal = new AccountAddressModal(driver);
          const address = await accountAddressModal.getAccountAddress();
          if (address.toUpperCase() !== account1.address.toUpperCase()) {
            throw new Error(
              `Expected account address "${account1.address}" but got "${address}"`,
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
          state: 2,
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded({
            isMultichainAccountsState2Enabled: true,
          });
          await accountListPage.openMultichainAccountMenu({
            accountLabel: account1.name,
          });
          await accountListPage.clickMultichainAccountMenuItem('Addresses');

          const addressListModal = new AddressListModal(driver);
          await addressListModal.checkPageIsLoaded();
          await addressListModal.clickCopyButton();

          // Verify UI feedback for copy action
          await addressListModal.verifyCopyButtonFeedback();
        },
      );
    });
  });

  describe('View on etherscan', function () {
    it('navigates to etherscan when view on etherscan is clicked', async function () {
      await withMultichainAccountsDesignEnabled(
        {
          title: this.test?.fullTitle(),
          state: 2,
        },
        async (driver: Driver) => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded({
            isMultichainAccountsState2Enabled: true,
          });
          await accountListPage.openMultichainAccountMenu({
            accountLabel: account1.name,
          });
          await accountListPage.clickMultichainAccountMenuItem(
            'Account details',
          );

          const accountDetailsPage = new MultichainAccountDetailsPage(driver);
          await accountDetailsPage.clickNetworksRow();

          const addressListModal = new AddressListModal(driver);
          await addressListModal.clickQRbutton();

          const accountAddressModal = new AccountAddressModal(driver);
          await accountAddressModal.checkPageIsLoaded();
          await accountAddressModal.checkViewOnEtherscanButton();
        },
      );
    });
  });
});
