import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { ACCOUNT_TYPE, WALLET_PASSWORD } from '../../constants';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import AccountListPage from '../../page-objects/pages/account-list-page';

const mockLedgerIframeServerDown = async (mockServer: Mockttp) => {
  return [
    await mockServer
      .forGet('https://metamask.github.io/ledger-iframe-bridge/8.0.3/')
      .thenCallback(() => {
        return {
          statusCode: 301,
          headers: {
            Location: 'https://metamask.io'
          }
        };
      }),
  ]
};

describe('Keyring Actions', function () {
  it('should be able to login when the Ledger iframe is down', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockLedgerIframeServerDown,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginPage.loginToHomepage(WALLET_PASSWORD);

        const homePage = new Homepage(driver)
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();
      }
    );
  });

  it('should be able to create an account when the Ledger iframe is down', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockLedgerIframeServerDown,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginPage.loginToHomepage(WALLET_PASSWORD);

        const homePage = new Homepage(driver)
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // Create new account with default name
        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });
        await headerNavbar.check_accountLabel('Account 2');
        await homePage.check_expectedBalanceIsDisplayed();
      }
    );
  });

  it.only('should be able to lock the wallet when the Ledger iframe is down', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockLedgerIframeServerDown,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginPage.loginToHomepage(WALLET_PASSWORD);

        const homePage = new Homepage(driver)
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openThreeDotMenu();
        await driver.delay(5000)
        await headerNavbar.lockMetaMask();
        await loginPage.check_pageIsLoaded();
      }
    );
  });
});
