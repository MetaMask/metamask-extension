import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import MainNav from '../../page-objects/pages/home/main-nav-page';
import TokensTab from '../../page-objects/pages/home/tokens-tab';

// The wide layout needs a viewport of at least 768px, which the E2E browser
// windows already provide outside of `constrainWindowSize` tests.
const WIDE_LAYOUT_MANIFEST_FLAGS = {
  remoteFeatureFlags: {
    extensionUxFullscreenRedesign: true,
  },
};

describe('Wide layout', function (this: Suite) {
  it('shows the side nav, account name and token table on home', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        manifestFlags: WIDE_LAYOUT_MANIFEST_FLAGS,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const mainNav = new MainNav(driver);
        await mainNav.checkSideNavIsDisplayed();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkAccountLabel('Account 1');

        const homePage = new HomePage(driver);
        await homePage.checkSendButtonIsClickable();
        await homePage.checkSwapButtonIsClickable();

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenTableIsDisplayed();
        await tokensTab.checkNetworkPillsAreDisplayed();
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');
      },
    );
  });

  it('navigates between pages with the side nav', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        manifestFlags: WIDE_LAYOUT_MANIFEST_FLAGS,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const mainNav = new MainNav(driver);
        await mainNav.clickHome();
        await homePage.checkPageIsLoaded();

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
      },
    );
  });
});
