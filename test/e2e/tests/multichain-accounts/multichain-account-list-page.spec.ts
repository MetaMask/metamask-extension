import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { Driver } from '../../webdriver/driver';
import { DAPP_PATH, WINDOW_TITLES } from '../../constants';
import { mockSnapSimpleKeyringAndSite } from '../account/snap-keyring-site-mocks';
import { MOCK_ETH_CONVERSION_RATE, mockPriceApi } from '../tokens/utils/mocks';

describe('Multichain Accounts - Multichain accounts list page', function (this: Suite) {
  it('displays wallet and accounts for hardware wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          expectedBalance: '0',
          waitForNonEvmAccounts: false,
        });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Ledger');

        // Ensure that accounts within the wallets are displayed
        // The balance is not loaded for a non-selected account (which was never selected before)
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'Wallet 1',
          account: 'Account 1',
          balance: '$0.00',
        });
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'Ledger',
          account: 'Ledger 1',
          balance: '$0.00',
        });
        await accountListPage.checkMultichainAccountNameDisplayed('Account 1');
        await accountListPage.checkMultichainAccountNameDisplayed('Ledger 1');
      },
    );
  });

  it('displays wallet for Snap Keyring', async function () {
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

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu(
          'MetaMask Simple Snap Keyring',
        );

        // Ensure that an SSK account within the wallet is displayed
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'Wallet 1',
          account: 'Account 1',
          balance: '$85,025.00',
        });
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'MetaMask Simple Snap Keyring',
          account: 'Snap Account 1',
          balance: '$0.00',
        });
        await accountListPage.checkMultichainAccountNameDisplayed('Account 1');
        await accountListPage.checkMultichainAccountNameDisplayed(
          'Snap Account 1',
        );
      },
    );
  });
});
