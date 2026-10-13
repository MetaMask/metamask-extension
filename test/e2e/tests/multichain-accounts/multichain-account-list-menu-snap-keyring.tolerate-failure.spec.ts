// Filename includes `tolerate-failure` so run-e2e-test.js logs a failure and exits 0.
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import SnapSimpleKeyringPage from '../../page-objects/pages/snaps/simple-keyring-page';
import { Driver } from '../../webdriver/driver';
import { DAPP_PATH, WINDOW_TITLES } from '../../constants';
import { mockSnapSimpleKeyringAndSite } from '../account/snap-keyring-site-mocks';
import {
  getMockAssetsPrice,
  MOCK_ETH_CONVERSION_RATE,
  mockPriceApi,
} from '../tokens/utils/mocks';

describe('Multichain Accounts - Account tree', function (this: Suite) {
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
          .withAssetsController({
            assetsPrice: getMockAssetsPrice(MOCK_ETH_CONVERSION_RATE),
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
        await accountListPage.checkMultichainAccountBalanceNotDisplayed({
          account: 'Snap Account 1',
          wallet: 'MetaMask Simple Snap Keyring',
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
