import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import ChooseWalletTypePage from '../../page-objects/pages/accounts/add-wallet/choose-wallet-type-page';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import SideNavAccounts from '../../page-objects/pages/home/side-nav-accounts';

// The side nav's accounts section only exists in the wide layout, so these
// tests pin the A/B variant and drive the side nav directly. They cover the
// actions the section offers on its own; what each destination screen does is
// covered by the tests of those screens, which are layout-agnostic.
const WIDE_LAYOUT_MANIFEST_FLAGS = {
  remoteFeatureFlags: {
    coreCEUX1492AbtestWideScreenRedesign: { name: 'treatment' },
  },
};

describe('Side nav accounts - wide layout', function (this: Suite) {
  it('opens the account list from the manage button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        manifestFlags: WIDE_LAYOUT_MANIFEST_FLAGS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await driver.checkWideLayoutViewport();

        await new SideNavAccounts(driver).clickManageAccounts();

        await new AccountListPage(driver).checkPageIsLoaded();
      },
    );
  });

  // Adding a wallet or account is covered through the account list. This only
  // checks that the side nav's add button reaches the same add wallet menu.
  it('opens the add wallet menu from the add button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        manifestFlags: WIDE_LAYOUT_MANIFEST_FLAGS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await driver.checkWideLayoutViewport();

        await new SideNavAccounts(driver).clickAddWallet();

        await new ChooseWalletTypePage(driver).checkPageIsLoaded();
      },
    );
  });

  it('filters the account list with the search', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerAdditionalAccountVault()
          .withAccountsControllerAdditionalAccountVault()
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: WIDE_LAYOUT_MANIFEST_FLAGS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await driver.checkWideLayoutViewport();
        const sideNavAccounts = new SideNavAccounts(driver);
        await sideNavAccounts.checkAccountIsListed('Account 1');
        await sideNavAccounts.checkAccountIsListed('Account 2');

        await sideNavAccounts.searchAccounts('Account 2');

        await sideNavAccounts.checkAccountIsListed('Account 2');
        await sideNavAccounts.checkAccountIsNotListed('Account 1');

        await sideNavAccounts.searchAccounts('no account has this name');

        await sideNavAccounts.checkNoAccountsFound();
      },
    );
  });

  it('switches the selected account from the account list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerAdditionalAccountVault()
          .withAccountsControllerAdditionalAccountVault()
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: WIDE_LAYOUT_MANIFEST_FLAGS,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await driver.checkWideLayoutViewport();
        const headerNavbar = new HeaderNavbar(driver);
        const sideNavAccounts = new SideNavAccounts(driver);
        await headerNavbar.checkAccountLabel('Account 1');

        await sideNavAccounts.selectAccount('Account 2');
        await headerNavbar.checkAccountLabel('Account 2');

        await sideNavAccounts.selectAccount('Account 1');
        await headerNavbar.checkAccountLabel('Account 1');
      },
    );
  });
});
