import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { PRIVATE_KEY_TWO, WINDOW_TITLES, withFixtures } from '../../helpers';
import { DAPP_PATH, DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import FixtureBuilder from '../../fixtures/fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';
import { sendRedesignedTransactionWithSnapAccount } from '../../page-objects/flows/send-transaction.flow';
import { mockEtherumSpotPrices } from '../tokens/utils/mocks';
import { mockSnapSimpleKeyringAndSite } from './snap-keyring-site-mocks';

async function mockSnapSimpleKeyringAndSiteWithSpotPrices(
  mockServer: Mockttp,
  port: number = 8080,
) {
  const snapMocks = await mockSnapSimpleKeyringAndSite(mockServer, port);
  const spotPricesMock = await mockServer
    .forGet(
      /^https:\/\/price\.api\.cx\.metamask\.io\/v2\/chains\/\d+\/spot-prices/u,
    )
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        '0x0000000000000000000000000000000000000000': {
          id: 'ethereum',
          price: 1700,
          marketCap: 382623505141,
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
          name: 'Ethereum',
          ticker: 'eth',
          value: 1,
          currencyType: 'fiat',
        },
      },
    }));

  return [...snapMocks, spotPricesMock, mockExchangeRates];
}

describe('Snap Account Transfers', function (this: Suite) {
  it('can import a private key and transfer 1 ETH (sync flow)', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        fixtures: new FixtureBuilder()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .withShowFiatTestnetEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockSnapSimpleKeyringAndSite(mockServer);
          return [await mockSnapSimpleKeyringAndSiteWithSpotPrices(mockServer)];
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed('42,500.00', 'USD');
        await homePage.checkPageIsLoaded();

        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // import snap account with private key on snap simple keyring page.
        await snapSimpleKeyringPage.importAccountWithPrivateKey(
          PRIVATE_KEY_TWO,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        // BUGBUG With BIP44 the account mame is not retained.
        await headerNavbar.checkAccountLabel('Snap Account 1');
        await homePage.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');

        // send 1 ETH from snap account to account 1
        await sendRedesignedTransactionWithSnapAccount({
          driver,
          recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
          amount: '1',
        });
        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAmountInActivity('-1 ETH');
        await activityList.waitPendingTxToNotBeVisible();

        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded();

        await accountList.checkMultichainAccountBalanceDisplayed('$44,200');
        await accountList.checkMultichainAccountBalanceDisplayed('$40,799');
      },
    );
  });

  it('can import a private key and transfer 1 ETH (async flow approve)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .withShowFiatTestnetEnabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockSnapSimpleKeyringAndSiteWithSpotPrices(mockServer);
          return [await mockEtherumSpotPrices(mockServer)];
        },
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed('42,500.00', 'USD');
        await homePage.checkPageIsLoaded();

        await installSnapSimpleKeyring(driver, false);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // import snap account with private key on snap simple keyring page.
        await snapSimpleKeyringPage.importAccountWithPrivateKey(
          PRIVATE_KEY_TWO,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        // BUGBUG With BIP44 the account mame is not retained.
        await headerNavbar.checkAccountLabel('Snap Account 1');
        await homePage.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');

        // send 1 ETH from snap account to account 1 and approve the transaction
        await sendRedesignedTransactionWithSnapAccount({
          driver,
          recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
          amount: '1',
          isSyncFlow: false,
        });
        await driver.delay(1000);
        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAmountInActivity('-1 ETH');
        await activityList.waitPendingTxToNotBeVisible();

        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded();

        await accountList.checkMultichainAccountBalanceDisplayed('$44,200');
        await accountList.checkMultichainAccountBalanceDisplayed('$40,799');
      },
    );
  });

  it('can import a private key and transfer 1 ETH (async flow reject)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockSnapSimpleKeyringAndSiteWithSpotPrices,
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        title: this.test?.fullTitle(),
        ignoredConsoleErrors: ['Request rejected by user or snap.'],
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await installSnapSimpleKeyring(driver, false);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // Import snap account with private key on snap simple keyring page.
        await snapSimpleKeyringPage.importAccountWithPrivateKey(
          PRIVATE_KEY_TWO,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        // BUGBUG With BIP44 the account mame is not retained.
        await headerNavbar.checkAccountLabel('Snap Account 1');
        await homePage.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');

        // send 1 ETH from snap account to account 1 and reject the transaction
        await sendRedesignedTransactionWithSnapAccount({
          driver,
          recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
          amount: '1',
          isSyncFlow: false,
          approveTransaction: false,
        });

        // check the transaction is failed in MetaMask activity list
        await new HomePage(driver).checkPageIsLoaded();
        await new ActivityListPage(
          driver,
        ).checkFailedTxNumberDisplayedInActivity();
      },
    );
  });
});
