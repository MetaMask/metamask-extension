import { connectToDapp, WINDOW_TITLES } from '../../helpers';
import { DEFAULT_FIXTURE_ACCOUNT, DAPP_HOST_ADDRESS } from '../../constants';
import Homepage from '../../page-objects/pages/home/homepage';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';
import {
  commonSolanaAddress,
  withSolanaAccountSnap,
} from '../solana/common-solana';
import FixtureBuilder from '../../fixture-builder';
import common from 'mocha/lib/interfaces/common';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from '../../flask/solana-wallet-standard/testHelpers';

const SOLANA_CAIP_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const COMMON_SOLANA_ACCOUNT = `${SOLANA_CAIP_CHAIN_ID}:4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer`;

const SOLANA_PERMISSIONS = {

              requiredScopes: {},
              optionalScopes: {
                [SOLANA_CAIP_CHAIN_ID]: {
                  accounts: [COMMON_SOLANA_ACCOUNT],
                },
              },
              isMultichainOrigin: true,

}

describe('Multiple Standard Dapp Connections', function () {
  it('should retain Solana permissions when connecting through the EVM provider', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        customFixtureModifications: (builder) =>
          builder.withPermissionControllerConnectedToMultichainTestDapp({
            value: SOLANA_PERMISSIONS,
          }),
      },
      async (driver) => {
        const testDapp = new TestDapp(driver);
        const homepage = new Homepage(driver);

        // Step 1: Open the dapp page and switch to it
        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.check_pageIsLoaded();
        await testDapp.clickConnectAccountButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectToDapp(driver);

        // await driver.waitForSelector({
        //   text: 'Connect this website with MetaMask',
        //   tag: 'p',
        // });

        // await driver.clickElementAndWaitForWindowToClose({
        //   text: 'Connect',
        //   tag: 'button',
        // });

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homepage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.check_pageIsLoaded(DAPP_HOST_ADDRESS);

        await sitePermissionPage.check_connectedAccountsNumber(2);
        await sitePermissionPage.check_connectedNetworksNumber(4);
      },
    );
  });

  it('should retain EVM permissions when connecting through the Solana Wallet Standard', async function () {
    await withSolanaAccountSnap(
      {
        ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        customFixtureModifications: (builder) =>
          builder.withPermissionControllerConnectedToMultichainTestDapp(),
      },
      async (driver) => {
        const testDapp = new TestDappSolana(driver);
        const homepage = new Homepage(driver);

        // // Step 1: Open the dapp page and switch to it
        await testDapp.openTestDappPage();
        await testDapp.switchTo();

        await connectSolanaTestDapp(driver, testDapp);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homepage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.check_pageIsLoaded(DAPP_HOST_ADDRESS);

        await sitePermissionPage.check_connectedAccountsNumber(2);
        await sitePermissionPage.check_connectedNetworksNumber(2);
      },
    );
  });

  it('should retain EVM permissions when connecting through the Solana Wallet Standard', async function () {
    await withSolanaAccountSnap(
      {
        ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        customFixtureModifications: (builder) =>
          builder.withPermissionControllerConnectedToMultichainTestDapp(),
      },
      async (driver) => {
        const testDapp = new TestDapp(driver);
        const homepage = new Homepage(driver);

        // Step 1: Open the dapp page and switch to it
        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  });
});
