import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { Driver } from '../../webdriver/driver';
import { mockSnapSimpleKeyringAndSite } from '../account/snap-keyring-site-mocks';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { DAPP_PATH } from '../../constants';
import { WINDOW_TITLES } from '../../helpers';
import { AccountType, withMultichainAccountsDesignEnabled } from './common';

async function mockPriceApi(mockServer: Mockttp) {
  const spotPricesMockEth = await mockServer
    .forGet(
      /^https:\/\/price\.api\.cx\.metamask\.io\/v2\/chains\/\d+\/spot-prices/u,
    )

    .thenCallback(() => ({
      statusCode: 200,
      json: {
        '0x0000000000000000000000000000000000000000': {
          id: 'ethereum',
          price: 1,
          marketCap: 112500000,
          totalVolume: 4500000,
          dilutedMarketCap: 120000000,
          pricePercentChange1d: 0,
        },
      },
    }));
  const mockExchangeRates = await mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        eth: {
          name: 'Ether',
          ticker: 'eth',
          value: 1 / 1700,
          currencyType: 'crypto',
        },
        usd: {
          name: 'US Dollar',
          ticker: 'usd',
          value: 1,
          currencyType: 'fiat',
        },
      },
    }));

  return [spotPricesMockEth, mockExchangeRates];
}

describe('Multichain Accounts - Account tree', function (this: Suite) {
  it('should display basic wallets and accounts', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockPriceApi,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 2');
        await accountListPage.checkAddWalletButttonIsDisplayed();

        await accountListPage.checkMultichainAccountBalanceDisplayed(
          '$42,500.00',
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('$0.00');
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList('Account 2');
        await accountListPage.checkNumberOfAvailableAccounts(2);
      },
    );
  });

  it('should display wallet and accounts for hardware wallet', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        accountType: AccountType.HardwareWallet,
        testSpecificMock: mockPriceApi,
      },
      async (driver: Driver) => {
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Ledger');
        await accountListPage.checkAddWalletButttonIsDisplayed();

        await accountListPage.checkMultichainAccountBalanceDisplayed(
          '$42,500.00',
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('$0.00');
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList('Ledger 1');
        await accountListPage.checkNumberOfAvailableAccounts(2);
      },
    );
  });

  it('should display wallet for Snap Keyring', async function () {
    await withMultichainAccountsDesignEnabled(
      {
        title: this.test?.fullTitle(),
        accountType: AccountType.SSK,
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        testSpecificMock: async (mockServer) => {
          await mockPriceApi(mockServer);
          return mockSnapSimpleKeyringAndSite(mockServer);
        },
      },
      async (driver: Driver) => {
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        await snapSimpleKeyringPage.createNewAccount();

        // Check snap account is displayed after adding the snap account.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu(
          'MetaMask Simple Snap Keyring',
        );

        // Ensure that an SSK account within the wallet is displayed
        await accountListPage.checkMultichainAccountBalanceDisplayed(
          '$42,500.00',
        );
        await accountListPage.checkMultichainAccountBalanceDisplayed('$0.00');
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList(
          'Snap Account 1',
        );
        await accountListPage.checkNumberOfAvailableAccounts(3);
      },
    );
  });
});
