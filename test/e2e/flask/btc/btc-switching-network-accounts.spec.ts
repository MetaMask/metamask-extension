import { Suite } from 'mocha';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE, DEFAULT_BTC_ACCOUNT_NAME } from '../../constants';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import { withBtcAccountSnap } from './common-btc';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';
import ModalPage from '../../page-objects/pages/home/modal-page';

describe('Switching between account from different networks', function (this: Suite) {
  it('Switch from Bitcoin account to local network', async function () {
    await withBtcAccountSnap(async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.check_currentSelectedNetwork('Bitcoin');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.selectAccount('Account 1');
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
      },
    );
  });
  it('Create a BTC account when BTC network is not selected', async function () {
    await withBtcAccountSnap(async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.selectAccount('Account 1');
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
        await headerNavbar.openAccountMenu();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Bitcoin,
          accountName: 'Bitcoin Account 2',
        });
        await headerNavbar.check_ifNetworkPickerClickable(true);
        await headerNavbar.check_currentSelectedNetwork('Bitcoin');
        await headerNavbar.check_accountLabel('Bitcoin Account 2');
      },
    );
  });
  it('Create a BTC account and switch to another network', async function () {
    await withBtcAccountSnap(async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_currentSelectedNetwork('Bitcoin');
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });
        await headerNavbar.check_accountLabel('Account 2');
        await headerNavbar.check_currentSelectedNetwork('Localhost 8545');
      },
    );
  });
  it.only('Switch to Bitcoin Signet with no previous account created', async function () {
    await withBtcAccountSnap(async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_currentSelectedNetwork('Bitcoin');
        await switchToNetworkFlow(driver, 'Bitcoin Tesnet', true);
        const modalPage = new ModalPage(driver);
        await modalPage.check_modalTitle('Add  account');
        await modalPage.check_modalContent('To enable the Bitcoin Testnet network, you need to create a  account.');
        await modalPage.clickOnButton('Add account');
        const accountListPage = new AccountListPage(driver);
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Bitcoin,
          accountName: 'Bitcoin Account 3',
          fromModal: true,
        });
        await headerNavbar.check_accountLabel('Bitcoin Account 3');
        await headerNavbar.check_currentSelectedNetwork('Bitcoin Signet');
      },
    );
  });
});