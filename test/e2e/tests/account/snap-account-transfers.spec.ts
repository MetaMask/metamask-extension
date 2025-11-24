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
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendRedesignedTransactionWithSnapAccount } from '../../page-objects/flows/send-transaction.flow';
import { mockPriceApi } from '../tokens/utils/mocks';
import { mockSnapSimpleKeyringAndSite } from './snap-keyring-site-mocks';

async function mockSnapSimpleKeyringAndSiteWithSpotPrices(
  mockServer: Mockttp,
  port: number = 8080,
) {
  const snapMocks = await mockSnapSimpleKeyringAndSite(mockServer, port);
  const spotPricesMock = await mockPriceApi(mockServer);

  return [...snapMocks, spotPricesMock];
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
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
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
        // BUG #37591 - Account created with snap using BIP44 with a custom name defaults to Snap Account 1
        await headerNavbar.checkAccountLabel('Snap Account 1');
        await homePage.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');
        // intended delay to allow for network requests to complete
        await driver.delay(1000);

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

        // Account balance doesn't update after transation is completed
        // await accountList.checkMultichainAccountBalanceDisplayed('$88,426');
        await accountList.checkMultichainAccountBalanceDisplayed('$81,623');
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
          return [await mockPriceApi(mockServer)];
        },
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
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
        // BUG #37591 - Account created with snap using BIP44 with a custom name defaults to Snap Account 1
        await headerNavbar.checkAccountLabel('Snap Account 1');
        await homePage.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');

        // send 1 ETH from snap account to account 1 and approve the transaction
        await sendRedesignedTransactionWithSnapAccount({
          driver,
          recipientAddress: DEFAULT_FIXTURE_ACCOUNT,
          amount: '1',
          isSyncFlow: false,
        });
        // intended delay to allow for network requests to complete
        await driver.delay(1000);
        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAmountInActivity('-1 ETH');
        await activityList.waitPendingTxToNotBeVisible();

        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded();

        // Account balance doesn't update after transation is completed
        // await accountList.checkMultichainAccountBalanceDisplayed('$88,426');
        await accountList.checkMultichainAccountBalanceDisplayed('$81,623');
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
        // BUG #37591 - Account created with snap using BIP44 with a custom name defaults to Snap Account 1
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
