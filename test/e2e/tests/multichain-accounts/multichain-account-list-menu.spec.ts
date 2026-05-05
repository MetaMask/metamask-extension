import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { Driver } from '../../webdriver/driver';
import {
  DAPP_PATH,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import { mockSnapSimpleKeyringAndSite } from '../account/snap-keyring-site-mocks';
import { MOCK_ETH_CONVERSION_RATE, mockPriceApi } from '../tokens/utils/mocks';

describe('Multichain Accounts - Account tree', function (this: Suite) {
  it('should display basic wallets and accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withSnapsPrivacyWarningAlreadyShown()
          .withCurrencyController({
            currencyRates: {
              ETH: {
                conversionDate: Date.now(),
                conversionRate: MOCK_ETH_CONVERSION_RATE,
                usdConversionRate: MOCK_ETH_CONVERSION_RATE,
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return await mockPriceApi(mockServer);
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { expectedBalance: '$85,025.00' });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkAccountNameIsDisplayedUnderWallet(
          'Account 1',
          'Wallet 1',
        );

        await accountListPage.checkAccountNameIsDisplayedUnderWallet(
          'Account 1',
          'Wallet 2',
        );
        await accountListPage.checkAddWalletButttonIsDisplayed();

        await accountListPage.checkMultichainAccountBalanceDisplayed({
          account: 'Account 1',
          wallet: 'Wallet 1',
          balance: '$85,025.00',
        });
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          account: 'Account 1',
          wallet: 'Wallet 2',
          balance: '$0.00',
        });
        await accountListPage.checkNumberOfAvailableAccounts(2);
      },
    );
  });
  it('should display wallet and accounts for hardware wallet', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withPreferencesController({
            preferences: { showFiatInTestnets: true },
            useCurrencyRateCheck: true,
          })
          .withCurrencyController({
            currencyRates: {
              ETH: {
                conversionDate: Date.now(),
                conversionRate: MOCK_ETH_CONVERSION_RATE,
                usdConversionRate: MOCK_ETH_CONVERSION_RATE,
              },
            },
          })
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withShowNativeTokenAsMainBalanceDisabled()
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                'eip155:1/slip44:60': { amount: '0' },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockSnapSimpleKeyringAndSite(mockServer);
          return await mockPriceApi(mockServer);
        },
      },
      async ({ driver, localNodes }) => {
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x15af1d78b58c40000',
        )) ?? console.error('localNodes is undefined or empty');
        await login(driver, { waitForNonEvmAccounts: false });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Ledger');
        await accountListPage.checkAddWalletButttonIsDisplayed();

        // The balance is not loaded for a non-selected account (which was never selected before)
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          balance: '$0.00',
          wallet: 'Wallet 1',
          account: 'Account 1',
        });
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          balance: '$85,025.00',
          wallet: 'Ledger',
          account: 'Ledger 1',
        });
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList('Ledger 1');
        await accountListPage.checkNumberOfAvailableAccounts(2);
      },
    );
  });

  it('should display wallet for Snap Keyring', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withSnapsPrivacyWarningAlreadyShown()
          .withCurrencyController({
            currencyRates: {
              ETH: {
                conversionDate: Date.now(),
                conversionRate: MOCK_ETH_CONVERSION_RATE,
                usdConversionRate: MOCK_ETH_CONVERSION_RATE,
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        testSpecificMock: async (mockServer: Mockttp) => {
          return [
            ...(await mockPriceApi(mockServer)),
            ...(await mockSnapSimpleKeyringAndSite(mockServer)),
          ];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { expectedBalance: '$85,025.00' });

        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        await snapSimpleKeyringPage.createNewAccount();

        // Check snap account is displayed after adding the snap account.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu(
          'MetaMask Simple Snap Keyring',
        );
        // Ensure that account balances within each wallet are displayed
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          account: 'Account 1',
          wallet: 'Wallet 1',
          balance: '$85,025.00',
        });
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          account: 'Snap Account 1',
          wallet: 'MetaMask Simple Snap Keyring',
          balance: '$0.00',
        });
        await accountListPage.checkAccountDisplayedInAccountList('Account 1');
        await accountListPage.checkAccountDisplayedInAccountList(
          'Snap Account 1',
        );
        await accountListPage.checkNumberOfAvailableAccounts(3);
      },
    );
  });
});
