/* eslint-disable mocha/no-skipped-tests */
import { Suite } from 'mocha';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE, DEFAULT_BTC_ACCOUNT_NAME } from '../../constants';
import ModalPage from '../../page-objects/pages/home/modal-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { withBtcAccountSnap } from './common-btc';

// TODO: Remove skip once we have a way to switch to local network with network filter
describe('Switching between account from different networks', function (this: Suite) {
  it.skip('Switch from Bitcoin account to local network', async function () {
    await withBtcAccountSnap(async (driver) => {
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_pageIsLoaded();
      await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);
      await headerNavbar.check_ifNetworkPickerClickable(true);
      // await headerNavbar.check_currentSelectedNetwork('Bitcoin');
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.selectAccount('Account 1');
      await headerNavbar.check_ifNetworkPickerClickable(true);
      // await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
    });
  });
  it.skip('Create a BTC account when BTC network is not selected', async function () {
    await withBtcAccountSnap(async (driver) => {
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_pageIsLoaded();
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.selectAccount('Account 1');
      await headerNavbar.check_ifNetworkPickerClickable(true);
      // await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
      await headerNavbar.openAccountMenu();
      await accountListPage.addAccount({
        accountType: ACCOUNT_TYPE.Bitcoin,
        accountName: 'Bitcoin Account 2',
      });
      await headerNavbar.check_ifNetworkPickerClickable(true);
      // await headerNavbar.check_currentSelectedNetwork('Bitcoin');
      await headerNavbar.check_accountLabel('Bitcoin Account 2');
    });
  });
  it.skip('Switch to Bitcoin Testnet with no previous account created', async function () {
    await withBtcAccountSnap(async (driver) => {
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.check_pageIsLoaded();
      // await switchToNetworkFromSendFlow(driver, 'Bitcoin Testnet', true);
      const modalPage = new ModalPage(driver);

      await modalPage.check_modalTitle('Add Bitcoin Testnet account');

      await modalPage.check_modalContent(
        'To enable the Bitcoin Testnet network, you need to create a Bitcoin Testnet account.',
      );
      await modalPage.clickOnButton('Add account');
      const accountListPage = new AccountListPage(driver);
      await accountListPage.addAccount({
        accountType: ACCOUNT_TYPE.Bitcoin,
        accountName: 'Bitcoin Account 3',
        fromModal: true,
      });
      await headerNavbar.check_accountLabel('Bitcoin Account 3');
      const homePage = new NonEvmHomepage(driver);
      await homePage.check_getBalance('0', 'tBTC');
    });
  });
});
